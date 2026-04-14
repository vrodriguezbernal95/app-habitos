"use client";

import { useState } from "react";
import { mockHabits } from "@/lib/mock-data";
import type { Habit, FailContext } from "@/lib/types";
import { HabitCard } from "@/components/habits/HabitCard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const MOTIVATIONAL_MESSAGES = [
  "Los pequeños pasos crean grandes cambios.",
  "Cada check es una promesa cumplida contigo mismo.",
  "Hoy vuelves a demostrar quién eres.",
  "Constancia hoy, libertad mañana.",
  "El mejor momento para empezar fue ayer. El segundo mejor es ahora.",
];

function getDayGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Buenos días";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

function formatDate(): string {
  return new Intl.DateTimeFormat("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function DailyPage() {
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [showCelebration, setShowCelebration] = useState(false);

  const todayHabits = habits.filter(
    (h) =>
      h.frequency === "daily" ||
      (h.frequency === "custom" &&
        h.days?.includes(new Date().getDay()))
  );

  const completedCount = todayHabits.filter((h) => {
    if (h.type === "single") return h.completedToday;
    if (h.type === "checkpoints") {
      const done = h.checkpoints?.filter((c) => c.status === "done").length ?? 0;
      const total = h.checkpoints?.length ?? 1;
      return done === total;
    }
    if (h.type === "counter") {
      return (h.counterCurrent ?? 0) >= (h.counterTarget ?? 1);
    }
    return false;
  }).length;

  const progress = todayHabits.length > 0
    ? (completedCount / todayHabits.length) * 100
    : 0;

  const allDone = completedCount === todayHabits.length && todayHabits.length > 0;

  const handleToggle = (id: string) => {
    setHabits((prev) => {
      const updated = prev.map((h) =>
        h.id === id ? { ...h, completedToday: !h.completedToday } : h
      );
      const newCompleted = updated.filter(
        (h) => h.frequency === "daily" && h.completedToday
      ).length;
      const total = updated.filter((h) => h.frequency === "daily").length;
      if (newCompleted === total && total > 0) {
        setTimeout(() => setShowCelebration(true), 300);
      }
      return updated;
    });
  };

  const handleCheckpointChange = (
    habitId: string,
    checkpointId: string,
    done: boolean,
    contexts?: FailContext[]
  ) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const updatedCps = h.checkpoints?.map((cp) =>
          cp.id === checkpointId
            ? { ...cp, status: done ? ("done" as const) : ("failed" as const), context: contexts }
            : cp
        );
        const allCpsDone = updatedCps?.every((cp) => cp.status === "done");
        return { ...h, checkpoints: updatedCps, completedToday: allCpsDone ?? false };
      })
    );
  };

  const handleCounterChange = (habitId: string, delta: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId || h.type !== "counter") return h;
        const next = Math.max(0, Math.min((h.counterCurrent ?? 0) + delta, h.counterTarget ?? 99));
        return { ...h, counterCurrent: next, completedToday: next >= (h.counterTarget ?? 1) };
      })
    );
  };

  const motivationMsg =
    MOTIVATIONAL_MESSAGES[new Date().getDate() % MOTIVATIONAL_MESSAGES.length];

  return (
    <div className="px-4 md:px-8 pt-6 pb-4 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground font-medium capitalize">
          {formatDate()}
        </p>
        <h1 className="font-heading text-2xl font-semibold text-foreground">
          {getDayGreeting()} ✦
        </h1>
        <p className="text-sm text-muted-foreground italic">{motivationMsg}</p>
      </div>

      {/* Daily progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">
            {completedCount} de {todayHabits.length} hábitos
          </span>
          <span className="text-sm font-semibold text-primary">
            {Math.round(progress)}%
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Celebration banner */}
      {allDone && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3 text-center slide-up">
          <p className="font-heading text-lg font-semibold text-primary">
            ¡Día completado!
          </p>
          <p className="text-sm text-muted-foreground mt-0.5">
            Has cumplido todos tus hábitos de hoy. Sigue así.
          </p>
        </div>
      )}

      {/* Habit list */}
      <div className="space-y-3">
        {/* Active habits first */}
        {todayHabits
          .filter((h) => !h.completedToday)
          .map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              onToggle={handleToggle}
              onCheckpointChange={handleCheckpointChange}
              onCounterChange={handleCounterChange}
            />
          ))}

        {/* Completed habits */}
        {todayHabits.filter((h) => h.completedToday).length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium px-2">
                Completados
              </span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {todayHabits
              .filter((h) => h.completedToday)
              .map((habit) => (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  onToggle={handleToggle}
                  onCheckpointChange={handleCheckpointChange}
                  onCounterChange={handleCounterChange}
                />
              ))}
          </>
        )}
      </div>

      {/* Empty state */}
      {todayHabits.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">✦</p>
          <p className="font-heading text-lg font-semibold text-foreground">
            Sin hábitos para hoy
          </p>
          <p className="text-sm text-muted-foreground">
            Crea tu primer hábito desde la pestaña Crear.
          </p>
        </div>
      )}
    </div>
  );
}
