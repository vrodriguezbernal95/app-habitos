"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { ConsistencyHeatmap } from "@/components/charts/ConsistencyHeatmap";
import { StreakBadge } from "@/components/habits/StreakBadge";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, AlertTriangle, Award } from "lucide-react";
import type { Habit, DayRecord } from "@/lib/types";

const TrendChart = dynamic(() => import("@/components/charts/TrendChart"), { ssr: false });

const ACHIEVEMENTS = [
  { id: "7d",  label: "7 días seguidos",   threshold: 7,  icon: "🔥" },
  { id: "21d", label: "21 días seguidos",  threshold: 21, icon: "⭐" },
  { id: "66d", label: "66 días seguidos",  threshold: 66, icon: "🏆" },
  { id: "3h",  label: "3 hábitos activos", threshold: 3,  icon: "✦" },
];

export default function ProgresoPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [records, setRecords] = useState<DayRecord[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/habits")
      .then((r) => r.json())
      .then((data: Habit[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setHabits(data);
          setSelectedHabitId(data[0].id);
          return fetch(`/api/habits/${data[0].id}/records`);
        }
        setLoading(false);
        return null;
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data) setRecords(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSelectHabit = (id: string) => {
    setSelectedHabitId(id);
    fetch(`/api/habits/${id}/records`)
      .then((r) => r.json())
      .then((data) => setRecords(Array.isArray(data) ? data : []));
  };

  const habit = habits.find((h) => h.id === selectedHabitId);

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

  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: a.id === "3h"
      ? habits.length >= a.threshold
      : (habit?.streak ?? 0) >= a.threshold,
  }));

  // Rellenar heatmap con 84 días (vacíos donde no hay registro)
  const heatmapRecords: DayRecord[] = Array.from({ length: 84 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const dateStr = d.toISOString().split("T")[0];
    const found = records.find((r) => r.date === dateStr);
    return found ?? { date: dateStr, habitId: selectedHabitId ?? "", completed: false, completionRate: 0 };
  });

  if (loading) {
    return (
      <div className="px-4 md:px-8 pt-6 pb-4 space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

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
        <StatCard label="Racha activa" value={`${habit?.streak ?? 0}d`} sub={`Máx: ${habit?.bestStreak ?? 0}d`} trend="up" />
        <StatCard label="Hábitos activos" value={String(habits.length)} sub="Esta semana" trend="neutral" />
        <StatCard label="Día débil" value={worstDay?.day ?? "—"} sub={`${Math.round((worstDay?.rate ?? 0) * 100)}% fallos`} trend="down" />
      </div>

      {/* Habit selector */}
      {habits.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-2">Ver por hábito</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {habits.map((h) => (
              <button
                key={h.id}
                onClick={() => handleSelectHabit(h.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium shrink-0 cursor-pointer tap-scale transition-all duration-150",
                  selectedHabitId === h.id
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
      )}

      {/* Heatmap */}
      {habits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Mapa de consistencia</p>
            <StreakBadge streak={habit?.streak ?? 0} size="sm" />
          </div>
          <ConsistencyHeatmap records={heatmapRecords} className="overflow-x-auto" />
        </div>
      )}

      {/* Weekly trend chart */}
      <div className="space-y-3">
        <p className="text-sm font-semibold">Tendencia semanal</p>
        <TrendChart />
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
