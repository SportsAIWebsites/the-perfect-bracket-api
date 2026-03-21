import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

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
    const { gameContext, messages } = body;

    if (!gameContext) {
      return NextResponse.json(
        { error: "Game context is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are Perfect Bracket AI, an elite college basketball analyst covering the NCAA Tournament. You're sharp, confident, and specific — always cite real numbers and matchup details. You have a knack for identifying momentum shifts and key matchups that will decide the game. Keep responses concise (2-4 sentences) unless asked for more detail. Use the game data provided to make specific, numbers-backed analysis.`;

    const userMessages = messages || [];
    const allMessages = [
      {
        role: "user" as const,
        content: `CURRENT GAME DATA:\n${gameContext}\n\n${
          userMessages.length === 0
            ? "Give a 3-sentence analysis of this game. Cover momentum, key matchups, and one bold prediction."
            : userMessages[userMessages.length - 1].content
        }`,
      },
    ];

    // Stream the response
    const stream = await anthropic.messages.stream({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: allMessages,
    });

    // Convert to ReadableStream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (error: unknown) {
    console.error("Analysis error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes("credit balance")) {
      return NextResponse.json(
        { error: "Anthropic API credits exhausted. Add credits at console.anthropic.com" },
        { status: 402 }
      );
    }
    return NextResponse.json(
      { error: "Failed to generate analysis" },
      { status: 500 }
    );
  }
}
