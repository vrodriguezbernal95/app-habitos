"use client";

import { useState } from "react";
import { FAIL_CONTEXT_LABELS, type FailContext } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CONTEXTS: FailContext[] = [
  "tired", "stress", "craving", "emotional", "no_time", "social", "bad_day", "other",
];

const CONTEXT_ICONS: Record<FailContext, string> = {
  tired: "😴", stress: "😤", craving: "🍬", emotional: "😔",
  no_time: "⏱️", social: "👥", bad_day: "🌧️", other: "💬",
};

interface ContextTagPickerProps {
  onConfirm: (contexts: FailContext[]) => void;
  onSkip: () => void;
}

export function ContextTagPicker({ onConfirm, onSkip }: ContextTagPickerProps) {
  const [selected, setSelected] = useState<FailContext[]>([]);

  const toggle = (ctx: FailContext) => {
    setSelected((prev) =>
      prev.includes(ctx) ? prev.filter((c) => c !== ctx) : [...prev, ctx]
    );
  };

  return (
    <div className="space-y-4 fade-in">
      <div>
        <p className="font-heading text-base font-semibold text-foreground">
          ¿Qué influyó?
        </p>
        <p className="text-sm text-muted-foreground mt-0.5">
          Selecciona todos los que apliquen
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {CONTEXTS.map((ctx) => (
          <button
            key={ctx}
            onClick={() => toggle(ctx)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 cursor-pointer tap-scale",
              selected.includes(ctx)
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            <span role="img" aria-label={FAIL_CONTEXT_LABELS[ctx]}>
              {CONTEXT_ICONS[ctx]}
            </span>
            <span>{FAIL_CONTEXT_LABELS[ctx]}</span>
          </button>
        ))}
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="ghost" size="sm" onClick={onSkip} className="flex-1 cursor-pointer">
          Saltar
        </Button>
        <Button
          size="sm"
          onClick={() => onConfirm(selected)}
          disabled={selected.length === 0}
          className="flex-1 cursor-pointer"
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
