"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { mockHabits, mockDayRecords } from "@/lib/mock-data";
import { ConsistencyHeatmap } from "@/components/charts/ConsistencyHeatmap";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle, Award } from "lucide-react";

const TrendChart = dynamic(() => import("@/components/charts/TrendChart"), { ssr: false });

// Mock context analysis
const contextAnalysis = [
  { label: "Cansancio",  pct: 42, icon: "😴" },
  { label: "Estrés",    pct: 31, icon: "😤" },
  { label: "Antojo",    pct: 18, icon: "🍬" },
  { label: "Sin tiempo", pct: 9, icon: "⏱️" },
];

const ACHIEVEMENTS = [
  { id: "7d",  label: "7 días seguidos",   unlocked: true,  icon: "🔥" },
  { id: "21d", label: "21 días seguidos",  unlocked: false, icon: "⭐" },
  { id: "66d", label: "66 días seguidos",  unlocked: false, icon: "🏆" },
  { id: "3h",  label: "3 hábitos activos", unlocked: true,  icon: "✦" },
];

export default function ProgresoPage() {
  const [selectedHabit, setSelectedHabit] = useState(mockHabits[0].id);
  const habit = mockHabits.find((h) => h.id === selectedHabit) ?? mockHabits[0];

  const completedDays = mockDayRecords.filter((r) => r.completed).length;
  const totalDays = mockDayRecords.length;
  const consistencyPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  // Detect worst day of week
  const dayFailRates = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const dayRecords = mockDayRecords.filter((r) => new Date(r.date).getDay() === d);
    const failed = dayRecords.filter((r) => !r.completed).length;
    return {
      day: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d],
      rate: failed / (dayRecords.length || 1),
    };
  });
  const worstDay = [...dayFailRates].sort((a, b) => b.rate - a.rate)[0];

  return (
    <div className="px-4 md:px-8 pt-6 pb-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold">Progreso</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Últimas 12 semanas</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Consistencia" value={`${consistencyPct}%`} sub="Últimos 84 días" trend="up" />
        <StatCard label="Racha activa" value={`${habit.streak}d`} sub={`Máx: ${habit.bestStreak}d`} trend="up" />
        <StatCard label="Hábitos activos" value={String(mockHabits.length)} sub="Esta semana" trend="neutral" />
        <StatCard label="Día débil" value={worstDay.day} sub={`${Math.round(worstDay.rate * 100)}% fallos`} trend="down" />
      </div>

      {/* Habit selector */}
      <div>
        <p className="text-sm font-semibold mb-2">Ver por hábito</p>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {mockHabits.map((h) => (
            <button
              key={h.id}
              onClick={() => setSelectedHabit(h.id)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 cursor-pointer tap-scale transition-all duration-150",
                selectedHabit === h.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              <span>{h.icon}</span>
              <span>{h.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold">Mapa de consistencia</p>
          <StreakBadge streak={habit.streak} size="sm" />
        </div>
        <ConsistencyHeatmap records={mockDayRecords} className="overflow-x-auto" />
      </div>

      {/* Weekly trend chart */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Tendencia semanal</p>
        <TrendChart />
      </div>

      {/* Context analysis */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <p className="text-sm font-semibold">¿Cuándo fallas más?</p>
        </div>
        <p className="text-xs text-muted-foreground -mt-1">
          Basado en los contextos que has registrado al fallar
        </p>
        <div className="space-y-2">
          {contextAnalysis.map((ctx) => (
            <div key={ctx.label} className="flex items-center gap-3">
              <span className="text-base w-6 text-center">{ctx.icon}</span>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{ctx.label}</span>
                  <span className="text-xs text-muted-foreground">{ctx.pct}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-400 transition-all duration-500"
                    style={{ width: `${ctx.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-accent/10 border border-accent/25 px-4 py-3">
          <p className="text-xs text-foreground font-medium">
            💡 El 73% de tus fallos ocurren por cansancio o estrés. Considera añadir un micro-hábito de gestión del estrés por la tarde.
          </p>
        </div>
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-primary" />
          <p className="text-sm font-semibold">Logros</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-150",
                a.unlocked
                  ? "bg-primary/5 border-primary/20"
                  : "bg-muted/40 border-border opacity-50"
              )}
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className={cn("text-xs font-semibold", !a.unlocked && "text-muted-foreground")}>
                  {a.label}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {a.unlocked ? "Conseguido" : "Bloqueado"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  trend: "up" | "down" | "neutral";
}

function StatCard({ label, value, sub, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-1">
      <p className="text-xs text-muted-foreground font-medium">{label}</p>
      <div className="flex items-end gap-1">
        <p className="font-heading text-2xl font-bold text-foreground leading-tight">{value}</p>
        {trend === "up" && <TrendingUp size={14} className="text-primary mb-1" />}
        {trend === "down" && <TrendingDown size={14} className="text-destructive mb-1" />}
      </div>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );
}
