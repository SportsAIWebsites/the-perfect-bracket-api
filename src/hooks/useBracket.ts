"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { FullBracket, Region } from "@/types/bracket";
import { useIsDemo } from "./useDemo";
import { mockBracket } from "@/mock/bracket";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const REGIONS: Region[] = ["East", "West", "South", "Midwest"];

function checkForLiveGames(bracket: FullBracket | undefined): boolean {
  if (!bracket) return false;
  for (const region of REGIONS) {
    const rounds = bracket.regions[region]?.rounds;
    if (!rounds) continue;
    for (const roundMatchups of Object.values(rounds)) {
      for (const m of roundMatchups) {
        if (m.status === "in_progress") return true;
      }
    }
  }
  for (const semi of bracket.finalFour?.semifinals || []) {
    if (semi.status === "in_progress") return true;
  }
  if (bracket.finalFour?.championship?.status === "in_progress") return true;
  return false;
}

export function useBracket() {
  const isDemo = useIsDemo();

  const { data, error, isLoading, mutate } = useSWR<FullBracket>(
    isDemo ? null : "/api/bracket",
    fetcher,
    {
      refreshInterval: 30000,
      revalidateOnFocus: true,
      errorRetryCount: 3,
    }
  );

  const bracket = isDemo ? mockBracket : data;

  const hasLiveGames = useMemo(() => checkForLiveGames(bracket), [bracket]);

  return {
    bracket,
    isLoading: isDemo ? false : isLoading,
    error: isDemo ? null : error,
    refresh: mutate,
    hasLiveGames,
  };
}
