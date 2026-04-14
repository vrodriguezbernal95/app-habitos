"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { HABIT_SUGGESTIONS } from "@/lib/mock-data";

type Step = 1 | 2 | 3;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);
  const [reminderTime, setReminderTime] = useState("09:00");

  const canNext = () => {
    if (step === 1) return name.trim().length > 0;
    if (step === 2) return selectedHabits.length > 0;
    return true;
  };

  const toggleHabit = (habitName: string) => {
    setSelectedHabits((prev) =>
      prev.includes(habitName)
        ? prev.filter((h) => h !== habitName)
        : prev.length < 3
        ? [...prev, habitName]
        : prev
    );
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((s) => (s + 1) as Step);
    } else {
      // TODO: save to Supabase
      router.push("/daily");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between px-6 py-10 max-w-md mx-auto">
      {/* Step dots */}
      <div className="flex gap-2 self-center">
        {([1, 2, 3] as Step[]).map((s) => (
          <div
            key={s}
            className={cn(
              "h-1.5 rounded-full transition-all duration-300",
              s === step ? "w-6 bg-primary" : s < step ? "w-3 bg-primary/40" : "w-3 bg-muted"
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-center w-full space-y-8 py-8 fade-in">
        {step === 1 && (
          <StepOne name={name} onChangeName={setName} />
        )}
        {step === 2 && (
          <StepTwo
            name={name}
            selected={selectedHabits}
            onToggle={toggleHabit}
          />
        )}
        {step === 3 && (
          <StepThree
            name={name}
            selected={selectedHabits}
            reminderTime={reminderTime}
            onChangeReminder={setReminderTime}
          />
        )}
      </div>

      {/* CTA */}
      <div className="w-full space-y-3">
        <Button
          onClick={handleNext}
          disabled={!canNext()}
          className="w-full h-13 text-base font-semibold rounded-2xl cursor-pointer"
          size="lg"
        >
          {step === 3 ? (
            <span className="flex items-center gap-2">
              Empezar mi journey
              <ChevronRight size={18} />
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Continuar
              <ChevronRight size={18} />
            </span>
          )}
        </Button>
        {step > 1 && (
          <button
            onClick={() => setStep((s) => (s - 1) as Step)}
            className="w-full text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors duration-150 py-2"
          >
            Volver
          </button>
        )}
      </div>
    </div>
  );
}

function StepOne({ name, onChangeName }: { name: string; onChangeName: (n: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Logo mark */}
      <div className="text-5xl text-center">✦</div>

      <div className="text-center space-y-2">
        <h1 className="font-heading text-3xl font-bold text-foreground leading-tight">
          Bienvenido a Hábitos
        </h1>
        <p className="text-muted-foreground text-base leading-relaxed">
          Tu mejor versión, construida día a día con pequeños pasos consistentes.
        </p>
      </div>

      <div className="space-y-2 pt-2">
        <label className="text-sm font-medium text-foreground block">¿Cómo te llamas?</label>
        <input
          type="text"
          value={name}
          onChange={(e) => onChangeName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full h-13 px-4 rounded-2xl border-2 border-input bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-base transition-colors duration-150"
          autoFocus
          maxLength={30}
        />
      </div>
    </div>
  );
}

function StepTwo({
  name,
  selected,
  onToggle,
}: {
  name: string;
  selected: string[];
  onToggle: (h: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-bold">
          Hola, {name} 👋
        </h2>
        <p className="text-muted-foreground">
          Elige hasta <strong>3 hábitos</strong> para empezar. Menos es más.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {HABIT_SUGGESTIONS.map((h) => {
          const isSelected = selected.includes(h.name);
          const isDisabled = !isSelected && selected.length >= 3;
          return (
            <button
              key={h.name}
              onClick={() => onToggle(h.name)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left cursor-pointer tap-scale transition-all duration-150",
                isSelected
                  ? "border-primary bg-primary/5"
                  : isDisabled
                  ? "border-border bg-muted/20 opacity-40 cursor-not-allowed"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <span className="text-xl">{h.icon}</span>
              <span className="font-medium text-sm flex-1">{h.name}</span>
              {isSelected && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Check size={12} className="text-primary-foreground" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected.length === 3 && (
        <p className="text-xs text-muted-foreground text-center fade-in">
          Perfecto. Tres hábitos es el punto óptimo para empezar con fuerza.
        </p>
      )}
    </div>
  );
}

function StepThree({
  name,
  selected,
  reminderTime,
  onChangeReminder,
}: {
  name: string;
  selected: string[];
  reminderTime: string;
  onChangeReminder: (t: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-heading text-2xl font-bold">¡Casi listo!</h2>
        <p className="text-muted-foreground">
          Un recordatorio diario aumenta un 40% la adherencia.
        </p>
      </div>

      {/* Selected habits summary */}
      <div className="rounded-2xl bg-primary/5 border border-primary/20 p-4 space-y-3">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide">
          Tus hábitos de inicio
        </p>
        {selected.map((habitName) => {
          const h = HABIT_SUGGESTIONS.find((s) => s.name === habitName);
          return (
            <div key={habitName} className="flex items-center gap-3">
              <span className="text-lg">{h?.icon}</span>
              <span className="font-medium text-sm">{habitName}</span>
              <div className="ml-auto w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                <Check size={11} className="text-primary" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reminder */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-foreground block">
          Hora de tu recordatorio diario
        </label>
        <input
          type="time"
          value={reminderTime}
          onChange={(e) => onChangeReminder(e.target.value)}
          className="w-full h-13 px-4 rounded-2xl border-2 border-input bg-card text-foreground text-base font-medium focus:outline-none focus:border-primary transition-colors duration-150"
        />
        <p className="text-xs text-muted-foreground">
          Activa las notificaciones del navegador cuando te lo pida.
        </p>
      </div>

      {/* Motivational note */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground italic">
          &quot;No se trata de motivación, {name}. Se trata de sistemas.&quot;
        </p>
      </div>
    </div>
  );
}
