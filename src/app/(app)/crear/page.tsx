"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Minus, Clock, ChevronLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HabitType, HabitFrequency } from "@/lib/types";
import { HABIT_ICONS, CATEGORIES, CATEGORY_LABELS, HabitIcon } from "@/lib/habit-icons";
const COLORS = [
  "bg-emerald-500", "bg-violet-500", "bg-blue-500", "bg-amber-500",
  "bg-rose-500", "bg-indigo-500", "bg-slate-500", "bg-orange-500",
  "bg-pink-500", "bg-teal-500", "bg-green-600", "bg-red-500",
];

const DAYS_LABELS = ["D", "L", "M", "X", "J", "V", "S"];

const DEFAULT_CHECKPOINTS = [
  { time: "08:00", label: "Mañana" },
  { time: "14:00", label: "Mediodía" },
  { time: "21:00", label: "Noche" },
];

type Step = 1 | 2 | 3 | 4;

interface NewHabit {
  name: string;
  icon: string;
  color: string;
  type: HabitType;
  frequency: HabitFrequency;
  days: number[];
  checkpoints: { time: string; label: string }[];
  counterTarget: number;
  reminder: string;
}

const INITIAL: NewHabit = {
  name: "",
  icon: "dumbbell",
  color: "bg-teal-500",
  type: "single",
  frequency: "daily",
  days: [],
  checkpoints: DEFAULT_CHECKPOINTS,
  counterTarget: 8,
  reminder: "09:00",
};

export default function CrearPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [habit, setHabit] = useState<NewHabit>(INITIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canNext = () => {
    if (step === 1) return habit.name.trim().length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 4) setStep((s) => (s + 1) as Step);
    else handleSave();
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else router.back();
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(habit),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Error ${res.status}`);
      }
      router.push("/daily");
    } catch (e: any) {
      setError(e.message ?? "No se pudo crear el hábito. Inténtalo de nuevo.");
      setSaving(false);
    }
  };

  const toggleDay = (d: number) => {
    setHabit((h) => ({
      ...h,
      days: h.days.includes(d) ? h.days.filter((x) => x !== d) : [...h.days, d],
    }));
  };

  const updateCheckpoint = (idx: number, field: "time" | "label", value: string) => {
    setHabit((h) => {
      const cps = [...h.checkpoints];
      cps[idx] = { ...cps[idx], [field]: value };
      return { ...h, checkpoints: cps };
    });
  };

  const addCheckpoint = () => {
    if (habit.checkpoints.length >= 6) return;
    setHabit((h) => ({
      ...h,
      checkpoints: [...h.checkpoints, { time: "12:00", label: "Nuevo" }],
    }));
  };

  const removeCheckpoint = (idx: number) => {
    if (habit.checkpoints.length <= 2) return;
    setHabit((h) => ({
      ...h,
      checkpoints: h.checkpoints.filter((_, i) => i !== idx),
    }));
  };

  return (
    <div className="px-4 md:px-8 pt-6 pb-4 flex flex-col min-h-[calc(100vh-80px)] md:min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={handleBack}
          className="w-9 h-9 rounded-full border border-border flex items-center justify-center cursor-pointer tap-scale hover:bg-muted transition-colors duration-150"
          aria-label="Volver"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="font-heading text-xl font-semibold">Nuevo hábito</h1>
          <p className="text-xs text-muted-foreground">Paso {step} de 4</p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex gap-1.5 mb-8">
        {([1, 2, 3, 4] as Step[]).map((s) => (
          <div
            key={s}
            className={cn(
              "h-1 rounded-full flex-1 transition-all duration-300",
              s <= step ? "bg-primary" : "bg-muted"
            )}
          />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 fade-in">
        {step === 1 && <Step1 habit={habit} onChange={setHabit} />}
        {step === 2 && <Step2 habit={habit} onChange={setHabit} toggleDay={toggleDay} />}
        {step === 3 && (
          <Step3
            habit={habit}
            onChange={setHabit}
            onUpdateCheckpoint={updateCheckpoint}
            onAddCheckpoint={addCheckpoint}
            onRemoveCheckpoint={removeCheckpoint}
          />
        )}
        {step === 4 && <Step4 habit={habit} onChange={setHabit} />}
      </div>

      {/* CTA */}
      <div className="pt-6 space-y-3">
        {error && (
          <p className="text-sm text-destructive text-center px-2">{error}</p>
        )}
        <Button
          onClick={handleNext}
          disabled={!canNext() || saving}
          className="w-full h-12 text-base font-semibold rounded-xl cursor-pointer"
          size="lg"
        >
          {step === 4 ? (
            <span className="flex items-center gap-2">
              <Check size={18} />
              {saving ? "Creando…" : "Crear hábito"}
            </span>
          ) : (
            "Continuar"
          )}
        </Button>
      </div>
    </div>
  );
}

/* ---- Step 1: Nombre + icono + color ---- */
function Step1({ habit, onChange }: { habit: NewHabit; onChange: (h: NewHabit) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold mb-1">¿Qué hábito quieres crear?</h2>
        <p className="text-sm text-muted-foreground">Nómbralo de forma concreta y personal.</p>
      </div>

      {/* Preview */}
      <div className="flex items-center gap-4 p-4 rounded-2xl bg-muted/50 border border-border">
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-primary-foreground", habit.color)}>
          <HabitIcon icon={habit.icon} size={26} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-base truncate">
            {habit.name || "Mi nuevo hábito"}
          </p>
        </div>
      </div>

      {/* Name input */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Nombre del hábito</label>
        <input
          type="text"
          value={habit.name}
          onChange={(e) => onChange({ ...habit, name: e.target.value })}
          placeholder="Ej: No comer azúcar"
          className="w-full h-12 px-4 rounded-xl border border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-base"
          maxLength={50}
          autoFocus
        />
        <p className="text-xs text-muted-foreground mt-1 text-right">{habit.name.length}/50</p>
      </div>

      {/* Icon picker */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground block">Icono</label>
        {CATEGORIES.map((cat) => (
          <div key={cat}>
            <p className="text-xs text-muted-foreground font-medium mb-1.5">{CATEGORY_LABELS[cat]}</p>
            <div className="grid grid-cols-6 gap-2">
              {HABIT_ICONS.filter((h) => h.category === cat).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => onChange({ ...habit, icon: id })}
                  title={label}
                  className={cn(
                    "w-full aspect-square rounded-xl flex items-center justify-center cursor-pointer tap-scale transition-all duration-150",
                    habit.icon === id
                      ? "bg-primary/15 ring-2 ring-primary text-primary"
                      : "bg-muted text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  )}
                  aria-label={label}
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Color picker */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">Color</label>
        <div className="flex flex-wrap gap-2">
          {COLORS.map((color) => (
            <button
              key={color}
              onClick={() => onChange({ ...habit, color })}
              className={cn(
                "w-8 h-8 rounded-full cursor-pointer tap-scale transition-all duration-150",
                color,
                habit.color === color && "ring-2 ring-offset-2 ring-foreground"
              )}
              aria-label={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---- Step 2: Frecuencia ---- */
function Step2({
  habit,
  onChange,
  toggleDay,
}: {
  habit: NewHabit;
  onChange: (h: NewHabit) => void;
  toggleDay: (d: number) => void;
}) {
  const freqOptions: { value: HabitFrequency; label: string; desc: string }[] = [
    { value: "daily",  label: "Todos los días", desc: "Sin excepciones" },
    { value: "weekly", label: "Una vez a la semana", desc: "Flexible" },
    { value: "custom", label: "Días específicos", desc: "Tú eliges" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold mb-1">¿Con qué frecuencia?</h2>
        <p className="text-sm text-muted-foreground">Elige cuándo quieres practicarlo.</p>
      </div>

      <div className="space-y-2">
        {freqOptions.map(({ value, label, desc }) => (
          <button
            key={value}
            onClick={() => onChange({ ...habit, frequency: value })}
            className={cn(
              "w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 cursor-pointer tap-scale transition-all duration-150 text-left",
              habit.frequency === value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <div>
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            {habit.frequency === value && (
              <Check size={18} className="text-primary shrink-0" />
            )}
          </button>
        ))}
      </div>

      {/* Day picker */}
      {habit.frequency === "custom" && (
        <div className="fade-in">
          <label className="text-sm font-medium text-foreground block mb-3">Días de la semana</label>
          <div className="flex gap-2 justify-between">
            {DAYS_LABELS.map((day, idx) => (
              <button
                key={idx}
                onClick={() => toggleDay(idx)}
                className={cn(
                  "flex-1 h-10 rounded-xl text-sm font-semibold cursor-pointer tap-scale transition-all duration-150",
                  habit.days.includes(idx)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70"
                )}
              >
                {day}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---- Step 3: Tipo + checkpoints ---- */
function Step3({
  habit,
  onChange,
  onUpdateCheckpoint,
  onAddCheckpoint,
  onRemoveCheckpoint,
}: {
  habit: NewHabit;
  onChange: (h: NewHabit) => void;
  onUpdateCheckpoint: (idx: number, field: "time" | "label", value: string) => void;
  onAddCheckpoint: () => void;
  onRemoveCheckpoint: (idx: number) => void;
}) {
  const typeOptions: { value: HabitType; label: string; desc: string; icon: string }[] = [
    { value: "single",      label: "Un solo check",       desc: "Lo hice / no lo hice",          icon: "✓" },
    { value: "checkpoints", label: "Tramos del día",      desc: "Varios momentos de control",     icon: "⏱" },
    { value: "counter",     label: "Contador",            desc: "Cuenta unidades (vasos, páginas…)", icon: "#" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold mb-1">¿Cómo quieres medirlo?</h2>
        <p className="text-sm text-muted-foreground">Define cómo vas a hacer seguimiento.</p>
      </div>

      <div className="space-y-2">
        {typeOptions.map(({ value, label, desc, icon }) => (
          <button
            key={value}
            onClick={() => onChange({ ...habit, type: value })}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 cursor-pointer tap-scale transition-all duration-150 text-left",
              habit.type === value
                ? "border-primary bg-primary/5"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center font-bold text-base shrink-0">
              {icon}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{label}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
            {habit.type === value && <Check size={18} className="text-primary shrink-0" />}
          </button>
        ))}
      </div>

      {/* Counter target */}
      {habit.type === "counter" && (
        <div className="fade-in space-y-2">
          <label className="text-sm font-medium text-foreground block">Objetivo diario</label>
          <div className="flex items-center gap-4">
            <button
              onClick={() => onChange({ ...habit, counterTarget: Math.max(1, habit.counterTarget - 1) })}
              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center cursor-pointer tap-scale hover:border-primary transition-all duration-150"
            >
              <Minus size={16} />
            </button>
            <span className="text-2xl font-bold font-heading flex-1 text-center">
              {habit.counterTarget}
            </span>
            <button
              onClick={() => onChange({ ...habit, counterTarget: Math.min(100, habit.counterTarget + 1) })}
              className="w-10 h-10 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center cursor-pointer tap-scale hover:bg-primary hover:text-primary-foreground transition-all duration-150"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Checkpoints editor */}
      {habit.type === "checkpoints" && (
        <div className="fade-in space-y-3">
          <label className="text-sm font-medium text-foreground block">Tramos de control</label>
          {habit.checkpoints.map((cp, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Clock size={14} className="text-muted-foreground shrink-0" />
              <input
                type="time"
                value={cp.time}
                onChange={(e) => onUpdateCheckpoint(idx, "time", e.target.value)}
                className="w-24 h-9 px-2 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <input
                type="text"
                value={cp.label}
                onChange={(e) => onUpdateCheckpoint(idx, "label", e.target.value)}
                placeholder="Etiqueta"
                className="flex-1 h-9 px-3 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <button
                onClick={() => onRemoveCheckpoint(idx)}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer tap-scale hover:bg-destructive/10 hover:text-destructive transition-all duration-150 text-muted-foreground"
                aria-label="Eliminar tramo"
                disabled={habit.checkpoints.length <= 2}
              >
                <Minus size={14} />
              </button>
            </div>
          ))}
          {habit.checkpoints.length < 6 && (
            <button
              onClick={onAddCheckpoint}
              className="w-full h-9 rounded-xl border-2 border-dashed border-border flex items-center justify-center gap-2 text-sm text-muted-foreground cursor-pointer tap-scale hover:border-primary hover:text-primary transition-all duration-150"
            >
              <Plus size={14} />
              Añadir tramo
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/* ---- Step 4: Recordatorio ---- */
function Step4({ habit, onChange }: { habit: NewHabit; onChange: (h: NewHabit) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-lg font-semibold mb-1">¿Quieres un recordatorio?</h2>
        <p className="text-sm text-muted-foreground">
          Te avisaremos de forma discreta para que no se te olvide.
        </p>
      </div>

      {/* Resumen */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-2">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">Resumen</p>
        <div className="flex items-center gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-primary-foreground", habit.color)}>
            <HabitIcon icon={habit.icon} size={20} />
          </div>
          <div>
            <p className="font-semibold text-sm">{habit.name}</p>
            <p className="text-xs text-muted-foreground capitalize">
              {habit.frequency === "daily" && "Todos los días"}
              {habit.frequency === "weekly" && "Una vez a la semana"}
              {habit.frequency === "custom" && `${habit.days.length} días por semana`}
              {" · "}
              {habit.type === "single" && "Un check"}
              {habit.type === "checkpoints" && `${habit.checkpoints.length} tramos`}
              {habit.type === "counter" && `Objetivo: ${habit.counterTarget}`}
            </p>
          </div>
        </div>
      </div>

      {/* Reminder time */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground block">Hora del recordatorio</label>
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-muted-foreground" />
          <input
            type="time"
            value={habit.reminder}
            onChange={(e) => onChange({ ...habit, reminder: e.target.value })}
            className="flex-1 h-12 px-4 rounded-xl border border-input bg-card text-base font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Necesitarás activar las notificaciones en tu navegador la primera vez.
        </p>
      </div>
    </div>
  );
}
