"use client";

import { useSearchParams } from "next/navigation";

export function useIsDemo(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get("demo") === "true";
}
