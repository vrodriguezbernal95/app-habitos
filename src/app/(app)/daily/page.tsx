"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import type { Habit } from "@/lib/types";
import { HabitCard } from "@/components/habits/HabitCard";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { HabitIcon } from "@/lib/habit-icons";

const MOTIVATIONAL_MESSAGES = [
  "Los pequeños pasos crean grandes cambios.",
  "Cada check es una promesa cumplida contigo mismo.",
  "Hoy vuelves a demostrar quién eres.",
  "Constancia hoy, libertad mañana.",
  "El mejor momento para empezar fue ayer. El segundo mejor es ahora.",
];

/** Fecha local del dispositivo en formato YYYY-MM-DD, sin desfase UTC */
function localDateStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

// Hábitos sugeridos para el onboarding. Usan IDs reales del sistema de iconos.
const QUICK_HABITS = [
  {
    name: "Beber agua",
    subtitle: "8 vasos al día",
    icon: "droplets",
    color: "bg-blue-500",
    type: "counter" as const,
    counterTarget: 8,
    frequency: "daily" as const,
    days: [],
  },
  {
    name: "Meditar",
    subtitle: "5 minutos de calma",
    icon: "brain",
    color: "bg-violet-500",
    type: "single" as const,
    frequency: "daily" as const,
    days: [],
  },
  {
    name: "Leer",
    subtitle: "10 páginas al día",
    icon: "book",
    color: "bg-amber-500",
    type: "single" as const,
    frequency: "daily" as const,
    days: [],
  },
  {
    name: "Ejercicio",
    subtitle: "30 min de movimiento",
    icon: "footprints",
    color: "bg-rose-500",
    type: "single" as const,
    frequency: "daily" as const,
    days: [],
  },
  {
    name: "Dormir 8h",
    subtitle: "Descanso completo",
    icon: "moon",
    color: "bg-indigo-500",
    type: "single" as const,
    frequency: "daily" as const,
    days: [],
  },
  {
    name: "Journaling",
    subtitle: "Escribe tus pensamientos",
    icon: "notebook",
    color: "bg-orange-500",
    type: "single" as const,
    frequency: "daily" as const,
    days: [],
  },
];

export default function DailyPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const prevAllDoneRef = useRef(false);

  useEffect(() => {
    fetch(`/api/habits?date=${localDateStr()}`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHabits(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const todayHabits = habits.filter(
    (h) =>
      h.isActive &&
      (h.frequency === "daily" ||
        h.frequency === "weekly" ||
        (h.frequency === "custom" && h.days?.includes(new Date().getDay())))
  );

  const completedCount = todayHabits.filter((h) => {
    if (h.type === "single") return h.completedToday;
    if (h.type === "checkpoints") {
      const done = h.checkpoints?.filter((c) => c.status === "done").length ?? 0;
      return done === (h.checkpoints?.length ?? 1);
    }
    if (h.type === "counter") return (h.counterCurrent ?? 0) >= (h.counterTarget ?? 1);
    return false;
  }).length;

  const progress = todayHabits.length > 0 ? (completedCount / todayHabits.length) * 100 : 0;
  const allDone = completedCount === todayHabits.length && todayHabits.length > 0;
  const hour = new Date().getHours();
  const inDanger = hour >= 21 && todayHabits.length > 0 && !allDone;

  const hapticEnabled = () =>
    typeof localStorage !== "undefined" &&
    localStorage.getItem("setting_haptic") !== "false";

  // Lanza confetti + vibración cuando se completan todos los hábitos del día
  useEffect(() => {
    if (allDone && !prevAllDoneRef.current) {
      setShowConfetti(true);
      if (hapticEnabled() && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([60, 40, 100]);
      }
      const t = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(t);
    }
    prevAllDoneRef.current = allDone;
  }, [allDone]);

  const saveRecord = async (habitId: string, completed: boolean, extra?: object) => {
    await fetch(`/api/habits/${habitId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed, completionRate: completed ? 1 : 0, date: localDateStr(), ...extra }),
    });
  };

  const handleToggle = (id: string) => {
    if (hapticEnabled() && typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
    setHabits((prev) => {
      const updated = prev.map((h) =>
        h.id === id ? { ...h, completedToday: !h.completedToday } : h
      );
      const habit = updated.find((h) => h.id === id);
      if (habit) saveRecord(id, habit.completedToday ?? false);
      return updated;
    });
  };

  const handleCheckpointChange = (habitId: string, checkpointId: string, done: boolean) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const updatedCps = h.checkpoints?.map((cp) =>
          cp.id === checkpointId
            ? { ...cp, status: done ? ("done" as const) : ("failed" as const) }
            : cp
        );
        const allDone = updatedCps?.every((cp) => cp.status === "done");
        const donePct = (updatedCps?.filter((c) => c.status === "done").length ?? 0) / (updatedCps?.length ?? 1);
        saveRecord(habitId, allDone ?? false, { completionRate: donePct });
        return { ...h, checkpoints: updatedCps, completedToday: allDone ?? false };
      })
    );
  };

  const handleCounterChange = (habitId: string, delta: number) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId || h.type !== "counter") return h;
        const next = Math.max(0, Math.min((h.counterCurrent ?? 0) + delta, h.counterTarget ?? 99));
        const completed = next >= (h.counterTarget ?? 1);
        saveRecord(habitId, completed, { counterValue: next, completionRate: next / (h.counterTarget ?? 1) });
        return { ...h, counterCurrent: next, completedToday: completed };
      })
    );
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 pt-6 pb-4 space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-xl" />
        <div className="h-4 w-32 bg-muted animate-pulse rounded-xl" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  // Primer uso: el usuario no tiene ningún hábito creado
  if (habits.length === 0) {
    return <FirstTimeSetup onHabitsCreated={(created) => setHabits(created)} />;
  }

  const motivationMsg = MOTIVATIONAL_MESSAGES[new Date().getDate() % MOTIVATIONAL_MESSAGES.length];

  return (
    <div className="px-4 md:px-8 pt-6 pb-4 space-y-6">
      <Confetti show={showConfetti} />

      {/* Greeting + date */}
      <div className="space-y-0.5">
        <p className="text-sm text-muted-foreground font-medium capitalize">{formatDate()}</p>
        <p className="text-base font-semibold text-foreground">{getDayGreeting()} ✦</p>
        <p className="text-sm text-muted-foreground italic">{motivationMsg}</p>
      </div>

      {/* Racha en peligro */}
      {inDanger && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-3 slide-up">
          <p className="font-semibold text-sm text-amber-700 dark:text-amber-400">
            ⚠️ Racha en peligro
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Quedan {todayHabits.length - completedCount} hábito
            {todayHabits.length - completedCount !== 1 ? "s" : ""} por completar hoy.
          </p>
        </div>
      )}

      {/* Daily progress */}
      {todayHabits.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">
              {completedCount} de {todayHabits.length} hábitos
            </span>
            <span className="text-sm font-semibold text-primary">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      )}

      {/* Celebration banner */}
      {allDone && (
        <div className="rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3 text-center slide-up">
          <p className="font-heading text-lg font-semibold text-primary">¡Día completado! ✦</p>
          <p className="text-sm text-muted-foreground mt-0.5">Has cumplido todos tus hábitos de hoy. Sigue así.</p>
        </div>
      )}

      {/* Habit list */}
      <div className="space-y-3">
        {todayHabits.filter((h) => !h.completedToday).map((habit) => (
          <HabitCard
            key={habit.id}
            habit={habit}
            onToggle={handleToggle}
            onCheckpointChange={handleCheckpointChange}
            onCounterChange={handleCounterChange}
            onDelete={handleDelete}
          />
        ))}

        {todayHabits.filter((h) => h.completedToday).length > 0 && (
          <>
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground font-medium px-2">Completados</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            {todayHabits.filter((h) => h.completedToday).map((habit) => (
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

      {/* Sin hábitos para hoy (tiene hábitos pero ninguno toca hoy) */}
      {todayHabits.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">✦</p>
          <p className="font-heading text-lg font-semibold text-foreground">Sin hábitos para hoy</p>
          <p className="text-sm text-muted-foreground">
            Tus hábitos de hoy están todos en descanso. Disfrútalo.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── First-time setup ────────────────────────────────────────────────────────

function FirstTimeSetup({ onHabitsCreated }: { onHabitsCreated: (habits: Habit[]) => void }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const MAX = 3;

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name)
        ? prev.filter((n) => n !== name)
        : prev.length < MAX
        ? [...prev, name]
        : prev
    );
  };

  const handleStart = async () => {
    if (!selected.length) return;
    setCreating(true);
    setError(null);
    try {
      const created: Habit[] = [];
      for (const name of selected) {
        const template = QUICK_HABITS.find((h) => h.name === name)!;
        const res = await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(template),
        });
        if (res.ok) {
          const habit = await res.json();
          created.push(habit);
        }
      }
      if (created.length > 0) onHabitsCreated(created);
    } catch {
      setError("No se pudieron crear los hábitos. Inténtalo de nuevo.");
      setCreating(false);
    }
  };

  return (
    <div className="px-4 md:px-8 pt-8 pb-6 space-y-8 fade-in">
      {/* Header */}
      <div className="space-y-2 text-center">
        <p className="text-4xl">✦</p>
        <h1 className="font-heading text-2xl font-bold">Bienvenido</h1>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Elige hasta <strong>3 hábitos</strong> para empezar.<br />Menos es más.
        </p>
      </div>

      {/* Habit grid */}
      <div className="grid grid-cols-2 gap-3">
        {QUICK_HABITS.map((h) => {
          const isSelected = selected.includes(h.name);
          const isDisabled = !isSelected && selected.length >= MAX;
          return (
            <button
              key={h.name}
              onClick={() => toggle(h.name)}
              disabled={isDisabled}
              className={cn(
                "relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 text-center cursor-pointer tap-scale transition-all duration-150",
                isSelected
                  ? "border-primary bg-primary/5"
                  : isDisabled
                  ? "border-border bg-muted/20 opacity-40 cursor-not-allowed"
                  : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
              )}
            >
              {/* Checkmark */}
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                  <Check size={11} className="text-primary-foreground" />
                </div>
              )}
              {/* Icon */}
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", h.color)}>
                <HabitIcon icon={h.icon} size={22} />
              </div>
              {/* Labels */}
              <div>
                <p className="font-semibold text-sm leading-tight">{h.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{h.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {error && <p className="text-sm text-destructive text-center">{error}</p>}

      {/* CTAs */}
      <div className="space-y-3">
        <button
          onClick={handleStart}
          disabled={!selected.length || creating}
          className={cn(
            "w-full h-12 rounded-xl font-semibold text-base transition-all duration-200",
            selected.length > 0
              ? "bg-primary text-primary-foreground cursor-pointer tap-scale hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {creating
            ? "Creando hábitos…"
            : selected.length > 0
            ? `Empezar con ${selected.length} hábito${selected.length > 1 ? "s" : ""}`
            : "Selecciona al menos 1"}
        </button>

        <button
          onClick={() => router.push("/crear")}
          className="w-full text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors py-2"
        >
          Prefiero crear los míos →
        </button>
      </div>
    </div>
  );
}

// ─── Confetti ────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#f97316"];

function Confetti({ show }: { show: boolean }) {
  if (!show) return null;

  const pieces = Array.from({ length: 40 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    delay: Math.random() * 0.5,
    duration: 0.9 + Math.random() * 0.9,
    size: 5 + Math.round(Math.random() * 5),
    rotate: Math.round(Math.random() * 360),
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="absolute rounded-sm"
          style={{
            left: `${p.x}%`,
            top: "-10px",
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            animation: `confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  );
}
