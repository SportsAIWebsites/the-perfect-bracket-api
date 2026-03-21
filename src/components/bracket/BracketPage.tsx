"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBracket } from "@/hooks/useBracket";
import { FullBracketView } from "./FullBracketView";
import { MobileBracketView } from "./MobileBracketView";

export function BracketPage() {
  const { bracket, isLoading, error } = useBracket();
  const [isMobile, setIsMobile] = useState(false);
  const searchParams = useSearchParams();
  const isDemo = searchParams.get("demo") === "true";

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1280);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-text-secondary">
          Loading bracket data...
        </p>
      </div>
    );
  }

  if (error || !bracket) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm text-live-red">Failed to load bracket data</p>
        <p className="mt-2 text-xs text-text-dim">
          Try adding ?demo=true for demo mode
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      <div className="mb-4 text-center">
        <span className="text-[10px] text-text-dim" suppressHydrationWarning>
          Last updated:{" "}
          {new Date(bracket.lastUpdated).toLocaleTimeString()}
        </span>
      </div>

      {isMobile ? (
        <MobileBracketView
          bracket={bracket}
        />
      ) : (
        <FullBracketView
          bracket={bracket}
          isDemo={isDemo}
        />
      )}
    </div>
  );
}
