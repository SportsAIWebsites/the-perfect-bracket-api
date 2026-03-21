"use client";

import { useState } from "react";
import clsx from "clsx";
import { FullBracket, Region } from "@/types/bracket";
import { RegionBracketStrip } from "./RegionBracketStrip";
import { FinalFourCenter } from "./FinalFourCenter";
import { REGIONS } from "@/lib/constants";

interface MobileBracketViewProps {
  bracket: FullBracket;
}

type Tab = Region | "Final Four";

export function MobileBracketView({
  bracket,
}: MobileBracketViewProps) {
  const [activeTab, setActiveTab] = useState<Tab>("East");

  const tabs: Tab[] = [...REGIONS, "Final Four"];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 overflow-x-auto border-b border-border-subtle px-2 pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors",
              activeTab === tab
                ? "bg-accent text-white"
                : "text-text-dim hover:bg-card hover:text-text-primary"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-4 overflow-x-auto px-2">
        {activeTab === "Final Four" ? (
          <FinalFourCenter
            finalFour={bracket.finalFour}
          />
        ) : (
          <RegionBracketStrip
            region={bracket.regions[activeTab]}
          />
        )}
      </div>
    </div>
  );
}
