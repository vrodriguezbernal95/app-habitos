"use client";

import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const weeklyTrend = [
  { day: "L", rate: 60 },
  { day: "M", rate: 80 },
  { day: "X", rate: 40 },
  { day: "J", rate: 90 },
  { day: "V", rate: 70 },
  { day: "S", rate: 55 },
  { day: "D", rate: 85 },
];

export default function TrendChart() {
  return (
    <div className="h-36 rounded-2xl overflow-hidden bg-card border border-border p-3">
      <ResponsiveContainer width="100%" height="100%" minHeight={1} minWidth={1}>
        <AreaChart data={weeklyTrend} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
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
              background: "white",
              border: "1px solid #cce8e4",
              borderRadius: "12px",
              fontSize: "12px",
            }}
            formatter={(v) => [`${v}%`, "Cumplimiento"]}
          />
          <Area
            type="monotone"
            dataKey="rate"
            stroke="#0D9488"
            strokeWidth={2}
            fill="url(#tealGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
