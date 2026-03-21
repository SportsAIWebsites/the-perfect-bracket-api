"use client";

import clsx from "clsx";

interface PredictionBadgeProps {
  confidence: number;
  compact?: boolean;
}

export function PredictionBadge({
  confidence,
  compact = false,
}: PredictionBadgeProps) {
  const color =
    confidence >= 70
      ? "text-final-green"
      : confidence >= 50
        ? "text-accent"
        : "text-live-red";

  const bgColor =
    confidence >= 70
      ? "bg-final-green/10"
      : confidence >= 50
        ? "bg-accent/10"
        : "bg-live-red/10";

  if (compact) {
    return (
      <span className={clsx("text-[10px] font-bold", color)}>
        {confidence}%
      </span>
    );
  }

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
        color,
        bgColor
      )}
    >
      {confidence}%
    </span>
  );
}
