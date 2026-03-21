import { NextRequest, NextResponse } from "next/server";
import { fetchGameSummary } from "@/lib/espn";

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const summary = await fetchGameSummary(params.eventId);
    if (!summary) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(summary, {
      headers: { "Cache-Control": "s-maxage=10, stale-while-revalidate=20" },
    });
  } catch (error) {
    console.error("Game fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch game data" },
      { status: 500 }
    );
  }
}
