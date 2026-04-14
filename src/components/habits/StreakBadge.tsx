"use client";

import { Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakBadgeProps {
  streak: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function StreakBadge({ streak, size = "md", className }: StreakBadgeProps) {
  const sizeClasses = {
    sm: "text-xs gap-0.5 px-1.5 py-0.5",
    md: "text-sm gap-1 px-2 py-1",
    lg: "text-base gap-1.5 px-3 py-1.5",
  };

  const iconSize = { sm: 12, md: 14, lg: 16 }[size];

  if (streak === 0) return null;

  const isHot = streak >= 7;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-semibold font-sans",
        sizeClasses[size],
        isHot
          ? "bg-orange-100 text-orange-600"
          : "bg-teal-50 text-teal-700",
        className
      )}
    >
      <Flame
        size={iconSize}
        className={isHot ? "text-orange-500" : "text-teal-500"}
        fill={isHot ? "currentColor" : "none"}
        strokeWidth={2}
      />
      {streak}
    </span>
  );
}
