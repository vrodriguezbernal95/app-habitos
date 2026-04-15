"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { ConsistencyHeatmap } from "@/components/charts/ConsistencyHeatmap";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Award } from "lucide-react";
import type { Habit, DayRecord } from "@/lib/types";
import { HabitIcon } from "@/lib/habit-icons";

const TrendChart = dynamic(() => import("@/components/charts/TrendChart"), { ssr: false });

const ACHIEVEMENTS = [
  { id: "7d",  label: "7 días seguidos",   threshold: 7,  icon: "🔥" },
  { id: "21d", label: "21 días seguidos",  threshold: 21, icon: "⭐" },
  { id: "66d", label: "66 días seguidos",  threshold: 66, icon: "🏆" },
  { id: "3h",  label: "3 hábitos activos", threshold: 3,  icon: "✦" },
];

function computeGlobalRecords(allRecords: Record<string, DayRecord[]>): DayRecord[] {
  const habitIds = Object.keys(allRecords);
  if (habitIds.length === 0) return [];

  const dateMap: Record<string, { rates: number[]; completed: boolean[] }> = {};
  habitIds.forEach((hid) => {
    (allRecords[hid] ?? []).forEach((r) => {
      if (!dateMap[r.date]) dateMap[r.date] = { rates: [], completed: [] };
      dateMap[r.date].rates.push(r.completionRate);
      dateMap[r.date].completed.push(r.completed);
    });
  });

  return Object.entries(dateMap)
    .map(([date, { rates, completed }]) => ({
      date,
      habitId: "global",
      completed: completed.every(Boolean),
      completionRate: rates.reduce((a, b) => a + b, 0) / rates.length,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export default function ProgresoPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [allRecords, setAllRecords] = useState<Record<string, DayRecord[]>>({});
  const [selectedId, setSelectedId] = useState<string>("global");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/habits")
      .then((r) => r.json())
      .then(async (data: Habit[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          setLoading(false);
          return;
        }
        setHabits(data);

        const active = data.filter((h) => h.isActive);
        const entries = await Promise.all(
          active.map((h) =>
            fetch(`/api/habits/${h.id}/records`)
              .then((r) => r.json())
              .then((recs) => [h.id, Array.isArray(recs) ? recs : []] as [string, DayRecord[]])
          )
        );
        setAllRecords(Object.fromEntries(entries));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Records for the selected view (global or specific habit)
  const records = useMemo<DayRecord[]>(() => {
    if (selectedId === "global") return computeGlobalRecords(allRecords);
    return allRecords[selectedId] ?? [];
  }, [selectedId, allRecords]);

  const habit = habits.find((h) => h.id === selectedId);
  const activeHabits = habits.filter((h) => h.isActive);

  const completedDays = records.filter((r) => r.completed).length;
  const totalDays = records.length;
  const consistencyPct = totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

  const dayFailRates = [0, 1, 2, 3, 4, 5, 6].map((d) => {
    const dayRecords = records.filter((r) => new Date(r.date).getDay() === d);
    const failed = dayRecords.filter((r) => !r.completed).length;
    return {
      day: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"][d],
      rate: failed / (dayRecords.length || 1),
    };
  });
  const worstDay = [...dayFailRates].sort((a, b) => b.rate - a.rate)[0];

  const maxStreak = selectedId === "global"
    ? Math.max(0, ...activeHabits.map((h) => h.streak ?? 0))
    : (habit?.streak ?? 0);

  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.id === "3h"
      ? activeHabits.length >= a.threshold
      : maxStreak >= a.threshold,
  }));

  if (loading) {
    return (
      <div className="px-4 md:px-8 pt-6 pb-4 space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-4 space-y-8">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Consistencia" value={`${consistencyPct}%`} sub="Últimos 84 días" trend="up" />
        <StatCard label="Racha activa" value={`${maxStreak}d`} sub={`Hábito seleccionado`} trend="up" />
        <StatCard label="Hábitos activos" value={String(activeHabits.length)} sub="Esta semana" trend="neutral" />
        <StatCard label="Día débil" value={worstDay?.day ?? "—"} sub={`${Math.round((worstDay?.rate ?? 0) * 100)}% fallos`} trend="down" />
      </div>

      {/* Habit selector */}
      {activeHabits.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Ver por hábito</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {/* Global tab */}
            <button
              onClick={() => setSelectedId("global")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 cursor-pointer tap-scale transition-all duration-150",
                selectedId === "global"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              )}
            >
              <span>✦</span>
              <span>Global</span>
            </button>

            {activeHabits.map((h) => (
              <button
                key={h.id}
                onClick={() => setSelectedId(h.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 cursor-pointer tap-scale transition-all duration-150",
                  selectedId === h.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                <HabitIcon icon={h.icon} size={14} />
                <span>{h.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Heatmap */}
      {activeHabits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Mapa de consistencia</p>
            <StreakBadge streak={maxStreak} size="sm" />
          </div>
          <ConsistencyHeatmap records={records} />
        </div>
      )}

      {/* Weekly trend chart */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Tendencia semanal</p>
        <TrendChart records={records} />
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Award size={16} className="text-primary" />
          <p className="text-sm font-semibold">Logros</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {achievements.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all duration-150",
                a.unlocked ? "bg-primary/5 border-primary/20" : "bg-muted/40 border-border opacity-50"
              )}
            >
              <span className="text-2xl">{a.icon}</span>
              <div>
                <p className={cn("text-xs font-semibold", !a.unlocked && "text-muted-foreground")}>{a.label}</p>
                <p className="text-[10px] text-muted-foreground">{a.unlocked ? "Conseguido" : "Bloqueado"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">✦</p>
          <p className="font-heading text-lg font-semibold">Sin datos aún</p>
          <p className="text-sm text-muted-foreground">Crea hábitos y complételos para ver tu progreso.</p>
        </div>
      )}
    </div>
  );
}

interface StatCardProps { label: string; value: string; sub: string; trend: "up" | "down" | "neutral"; }
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
