"use client";

import { cn } from "@/lib/utils";
import type { DayRecord } from "@/lib/types";

interface ConsistencyHeatmapProps {
  records: DayRecord[];
  className?: string;
}

const DAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTHS_ES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function cellColor(rate: number, completed: boolean, isFuture: boolean, isAchievement: boolean): string {
  if (isFuture) return "bg-muted/40";
  if (!completed || rate === 0) return "bg-muted";
  if (isAchievement) {
    if (rate >= 0.9) return "bg-amber-400 dark:bg-amber-500";
    if (rate >= 0.6) return "bg-amber-300 dark:bg-amber-400";
    return "bg-amber-200 dark:bg-amber-300";
  }
  if (rate < 0.4) return "bg-primary/25";
  if (rate < 0.7) return "bg-primary/50";
  if (rate < 0.9) return "bg-primary/75";
  return "bg-primary";
}

export function ConsistencyHeatmap({ records, className }: ConsistencyHeatmapProps) {
  // Build date → record map
  const recordMap: Record<string, DayRecord> = {};
  records.forEach((r) => { recordMap[r.date] = r; });

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  // Monday of current week (Mon-based: 0=Mon … 6=Sun)
  const jsDay = today.getDay(); // 0=Sun
  const monOffset = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - monOffset);

  // Grid start: 11 weeks before this Monday
  const gridStart = new Date(monday);
  gridStart.setDate(monday.getDate() - 11 * 7);

  // Build 12 × 7 grid
  const weeks = Array.from({ length: 12 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + w * 7 + d);
      const dateStr = date.toISOString().split("T")[0];
      const rec = recordMap[dateStr];
      return {
        date: dateStr,
        month: date.getMonth(),
        completed: rec?.completed ?? false,
        rate: rec?.completionRate ?? 0,
        isFuture: dateStr > todayStr,
      };
    })
  );

  // Achievement: all past days completed (min 14 days of data)
  const pastCells = weeks.flat().filter((c) => !c.isFuture);
  const isAchievement =
    pastCells.length >= 14 && pastCells.every((c) => c.completed);

  // 3 blocks of 4 weeks
  const blocks = [weeks.slice(0, 4), weeks.slice(4, 8), weeks.slice(8, 12)];

  // Label for each block: show month(s) of first day
  const blockLabels = blocks.map((block) => {
    const firstMonth = new Date(block[0][0].date).getMonth();
    const lastMonth = new Date(block[3][6].date).getMonth();
    return firstMonth === lastMonth
      ? MONTHS_ES[firstMonth]
      : `${MONTHS_ES[firstMonth]}–${MONTHS_ES[lastMonth]}`;
  });

  return (
    <div className={cn("space-y-2", className)}>
      {/* Achievement banner */}
      {isAchievement && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-400/15 border border-amber-400/30">
          <span>🏆</span>
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            ¡Hazaña! 12 semanas completadas
          </p>
        </div>
      )}

      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1 items-start w-max">
          {/* Day label column */}
          <div className="flex flex-col shrink-0 mr-1 pt-5">
            {DAYS.map((d) => (
              <div
                key={d}
                className="h-[18px] mb-[2px] flex items-center justify-end pr-1 text-[10px] text-muted-foreground font-medium w-4"
              >
                {d}
              </div>
            ))}
          </div>

          {/* 3 blocks */}
          {blocks.map((block, bi) => (
            <div key={bi} className={cn("flex flex-col", bi < 2 && "mr-3")}>
              {/* Month label */}
              <div className="h-5 mb-0.5 text-[10px] text-muted-foreground font-semibold flex items-center">
                {blockLabels[bi]}
              </div>
              {/* 3 week columns */}
              <div className="flex gap-[3px]">
                {block.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-[2px]">
                    {week.map((cell, di) => (
                      <div
                        key={di}
                        title={`${cell.date} — ${Math.round(cell.rate * 100)}%`}
                        className={cn(
                          "w-[18px] h-[18px] rounded-[3px] transition-colors duration-150",
                          cellColor(cell.rate, cell.completed, cell.isFuture, isAchievement)
                        )}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 pl-5">
        <span className="text-[10px] text-muted-foreground">Menos</span>
        {["bg-muted", "bg-primary/25", "bg-primary/50", "bg-primary/75", "bg-primary"].map((cls) => (
          <div key={cls} className={cn("w-3 h-3 rounded-sm", cls)} />
        ))}
        <span className="text-[10px] text-muted-foreground">Más</span>
        {isAchievement && (
          <>
            <span className="text-[10px] text-muted-foreground mx-1">·</span>
            <div className="w-3 h-3 rounded-sm bg-amber-400" />
            <span className="text-[10px] text-amber-500 dark:text-amber-400 font-medium">Hazaña</span>
          </>
        )}
      </div>
    </div>
  );
}
