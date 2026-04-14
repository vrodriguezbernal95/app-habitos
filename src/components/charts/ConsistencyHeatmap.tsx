"use client";

import { cn } from "@/lib/utils";
import type { DayRecord } from "@/lib/types";

interface ConsistencyHeatmapProps {
  records: DayRecord[];
  className?: string;
}

// Lunes=0 … Domingo=6 (orden europeo)
const DAYS = ["L", "M", "X", "J", "V", "S", "D"];

function getIntensity(rate: number, completed: boolean): string {
  if (!completed || rate === 0) return "bg-muted";
  if (rate < 0.4) return "bg-primary/20";
  if (rate < 0.7) return "bg-primary/50";
  if (rate < 0.9) return "bg-primary/75";
  return "bg-primary";
}

export function ConsistencyHeatmap({ records, className }: ConsistencyHeatmapProps) {
  // Agrupar en semanas: cada semana es una columna de 7 días (L→D)
  const weeks: DayRecord[][] = [];
  for (let i = 0; i < records.length; i += 7) {
    weeks.push(records.slice(i, i + 7));
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-1 overflow-x-auto pb-1">
        {/* Columna de labels de día (filas) */}
        <div className="flex flex-col gap-1 shrink-0 mr-0.5">
          {DAYS.map((d) => (
            <div
              key={d}
              className="w-5 h-7 flex items-center justify-end pr-1 text-[10px] text-muted-foreground font-medium"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Columnas de semanas */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 shrink-0">
            {week.map((record, di) => (
              <div
                key={di}
                title={`${record.date} — ${Math.round(record.completionRate * 100)}%`}
                className={cn(
                  "w-7 h-7 rounded-md transition-colors duration-150",
                  getIntensity(record.completionRate, record.completed)
                )}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-1.5 pt-1 pl-6">
        <span className="text-[10px] text-muted-foreground">Menos</span>
        {["bg-muted", "bg-primary/20", "bg-primary/50", "bg-primary/75", "bg-primary"].map((cls) => (
          <div key={cls} className={cn("w-3.5 h-3.5 rounded-sm", cls)} />
        ))}
        <span className="text-[10px] text-muted-foreground">Más</span>
      </div>
    </div>
  );
}
