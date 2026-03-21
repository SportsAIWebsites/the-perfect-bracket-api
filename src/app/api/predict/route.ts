import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildPredictionPrompt } from "@/lib/claude";
import {
  getCachedPrediction,
  setCachedPrediction,
  makePredictionKey,
} from "@/lib/prediction-cache";
import { Prediction } from "@/types/bracket";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || apiKey === "your_key_here") {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 503 }
      );
    }

    const anthropic = new Anthropic({ apiKey });
    const body = await request.json();
    const { topTeam, bottomTeam, round, region, topStats, bottomStats, odds } = body;

    if (!topTeam || !bottomTeam) {
      return NextResponse.json(
        { error: "Both teams are required" },
        { status: 400 }
      );
    }

    // Check cache
    const cacheKey = makePredictionKey(topTeam.teamId, bottomTeam.teamId, round);
    const cached = getCachedPrediction(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const prompt = buildPredictionPrompt(topTeam, bottomTeam, round, region, topStats, bottomStats, odds);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      temperature: 0.3,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Parse the JSON response
    const parsed = JSON.parse(responseText);
    const winnerId =
      parsed.winnerId === "top" ? topTeam.teamId : bottomTeam.teamId;

    const prediction: Prediction = {
      winnerId,
      confidence: Math.min(99, Math.max(50, parsed.confidence)),
      reasoning: parsed.reasoning,
      generatedAt: new Date().toISOString(),
    };

    // Cache it
    setCachedPrediction(cacheKey, prediction);

    return NextResponse.json(prediction);
  } catch (error: unknown) {
    console.error("Prediction error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("credit balance")) {
      return NextResponse.json(
        { error: "Anthropic API credits exhausted. Add credits at console.anthropic.com" },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate prediction" },
      { status: 500 }
    );
  }
}
