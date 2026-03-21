import { NextRequest, NextResponse } from "next/server";
import { GameOdds } from "@/types/odds";
import { teamsMatch } from "@/lib/odds";

export async function GET(request: NextRequest) {
  const homeTeam = request.nextUrl.searchParams.get("home");
  const awayTeam = request.nextUrl.searchParams.get("away");

  if (!homeTeam || !awayTeam) {
    return NextResponse.json(
      { error: "home and away team parameters required" },
      { status: 400 }
    );
  }

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey || apiKey === "your_key_here") {
    return NextResponse.json(
      { error: "Odds API key not configured" },
      { status: 503 }
    );
  }

  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`,
      { cache: "no-store" }
    );

    if (!res.ok) {
      return NextResponse.json(
        { error: "Odds API error" },
        { status: res.status }
      );
    }

    const games = await res.json();

    // Match BOTH teams using smart fuzzy matching
    const game = games.find(
      (g: { home_team: string; away_team: string }) => {
        const homeMatchesHome = teamsMatch(homeTeam, g.home_team);
        const homeMatchesAway = teamsMatch(homeTeam, g.away_team);
        const awayMatchesHome = teamsMatch(awayTeam, g.home_team);
        const awayMatchesAway = teamsMatch(awayTeam, g.away_team);
        return (
          (homeMatchesHome && awayMatchesAway) ||
          (homeMatchesAway && awayMatchesHome)
        );
      }
    );

    if (!game || !game.bookmakers?.length) {
      return NextResponse.json({ error: "Game not found in odds data" }, { status: 404 });
    }

    const book = game.bookmakers[0];
    const h2h = book.markets.find((m: { key: string }) => m.key === "h2h");
    const spreads = book.markets.find((m: { key: string }) => m.key === "spreads");
    const totals = book.markets.find((m: { key: string }) => m.key === "totals");

    // Map odds to match the bracket's top/bottom team ordering (query params),
    // not the odds API's arbitrary home/away designation.
    // "home" param = bracket's topTeam, "away" param = bracket's bottomTeam
    const topMatchesApiHome = teamsMatch(homeTeam, game.home_team);
    const topApiTeam = topMatchesApiHome ? game.home_team : game.away_team;
    const bottomApiTeam = topMatchesApiHome ? game.away_team : game.home_team;

    const odds: GameOdds = {
      moneyline: {
        home: h2h?.outcomes?.find((o: { name: string }) => o.name === topApiTeam)?.price || 0,
        away: h2h?.outcomes?.find((o: { name: string }) => o.name === bottomApiTeam)?.price || 0,
      },
      spread: {
        home: spreads?.outcomes?.find((o: { name: string }) => o.name === topApiTeam)?.price || 0,
        away: spreads?.outcomes?.find((o: { name: string }) => o.name === bottomApiTeam)?.price || 0,
        homePoint: spreads?.outcomes?.find((o: { name: string }) => o.name === topApiTeam)?.point || 0,
        awayPoint: spreads?.outcomes?.find((o: { name: string }) => o.name === bottomApiTeam)?.point || 0,
      },
      total: {
        over: totals?.outcomes?.find((o: { name: string }) => o.name === "Over")?.price || 0,
        under: totals?.outcomes?.find((o: { name: string }) => o.name === "Under")?.price || 0,
        point: totals?.outcomes?.find((o: { name: string }) => o.name === "Over")?.point || 0,
      },
      bookmaker: book.title,
    };

    return NextResponse.json(odds, {
      headers: { "Cache-Control": "s-maxage=30" },
    });
  } catch (error) {
    console.error("Odds fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch odds" },
      { status: 500 }
    );
  }
}
