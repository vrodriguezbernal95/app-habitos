"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import type { DayRecord } from "@/lib/types";

interface TrendChartProps {
  records: DayRecord[];
}

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export default function TrendChart({ records }: TrendChartProps) {
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const jsDay = today.getDay();
  const monOffset = jsDay === 0 ? 6 : jsDay - 1;

  const recordMap: Record<string, DayRecord> = {};
  records.forEach((r) => { recordMap[r.date] = r; });

  // Last 7 days (Mon→Sun of current week, up to today)
  const data = DAY_LABELS.map((day, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - monOffset + idx);
    const dateStr = d.toISOString().split("T")[0];
    const rec = recordMap[dateStr];
    const isFuture = dateStr > todayStr;
    return {
      day,
      rate: isFuture ? null : (rec ? Math.round(rec.completionRate * 100) : 0),
    };
  });

  return (
    <div className="h-36 rounded-2xl overflow-hidden bg-card border border-border p-3">
      <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
          <defs>
            <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#0D9488" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#0D9488" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 11, fill: "#52897F" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#52897F" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "var(--card)",
              border: "1px solid var(--border)",
              borderRadius: "12px",
              fontSize: "12px",
              color: "var(--foreground)",
            }}
            formatter={(v) => v !== null ? [`${v}%`, "Cumplimiento"] : ["—", "Sin datos"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#0D9488"
            strokeWidth={2}
            fill="url(#tealGrad)"
            connectNulls={false}
            dot={{ fill: "#0D9488", r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
