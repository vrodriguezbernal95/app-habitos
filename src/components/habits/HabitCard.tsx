"use client";

import { useState } from "react";
import { Check, ChevronDown, ChevronUp, X, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { StreakBadge } from "./StreakBadge";
import { ContextTagPicker } from "./ContextTagPicker";
import type { Habit, Checkpoint, FailContext } from "@/lib/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface HabitCardProps {
  habit: Habit;
  onToggle: (id: string) => void;
  onCheckpointChange: (habitId: string, checkpointId: string, done: boolean, contexts?: FailContext[]) => void;
  onCounterChange: (habitId: string, delta: number) => void;
}

export function HabitCard({ habit, onToggle, onCheckpointChange, onCounterChange }: HabitCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [pendingFail, setPendingFail] = useState<{ checkpointId: string } | null>(null);

  const handleCheckpointTap = (cp: Checkpoint) => {
    if (cp.status === "done") return;
    if (cp.status === "failed") {
      onCheckpointChange(habit.id, cp.id, true);
      return;
    }
    // pending — ask: done or failed?
    setExpanded(true);
  };

  const handleMarkDone = (cpId: string) => {
    onCheckpointChange(habit.id, cpId, true);
  };

  const handleMarkFailed = (cpId: string) => {
    setPendingFail({ checkpointId: cpId });
    setFailDialogOpen(true);
  };

  const handleContextConfirm = (contexts: FailContext[]) => {
    if (pendingFail) {
      onCheckpointChange(habit.id, pendingFail.checkpointId, false, contexts);
    }
    setFailDialogOpen(false);
    setPendingFail(null);
  };

  const checkpointsDone =
    habit.checkpoints?.filter((c) => c.status === "done").length ?? 0;
  const checkpointsTotal = habit.checkpoints?.length ?? 0;
  const cpProgress = checkpointsTotal > 0 ? (checkpointsDone / checkpointsTotal) * 100 : 0;

  const counterProgress =
    habit.type === "counter" && habit.counterTarget
      ? ((habit.counterCurrent ?? 0) / habit.counterTarget) * 100
      : 0;

  return (
    <>
      <div
        className={cn(
          "rounded-2xl border bg-card p-4 transition-all duration-200 slide-up",
          habit.completedToday && "opacity-75 bg-muted/40"
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all duration-200",
              habit.completedToday ? "bg-primary/10" : "bg-muted"
            )}
          >
            {habit.icon}
          </div>

          {/* Name + streak */}
          <div className="flex-1 min-w-0">
            <p
              className={cn(
                "font-semibold text-sm leading-tight truncate",
                habit.completedToday && "line-through text-muted-foreground"
              )}
            >
              {habit.name}
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <StreakBadge streak={habit.streak} size="sm" />
              {habit.type === "checkpoints" && (
                <span className="text-xs text-muted-foreground">
                  {checkpointsDone}/{checkpointsTotal} tramos
                </span>
              )}
              {habit.type === "counter" && (
                <span className="text-xs text-muted-foreground">
                  {habit.counterCurrent ?? 0}/{habit.counterTarget} vasos
                </span>
              )}
            </div>
          </div>

          {/* Action */}
          {habit.type === "single" && (
            <button
              onClick={() => onToggle(habit.id)}
              className={cn(
                "w-10 h-10 rounded-full border-2 flex items-center justify-center shrink-0 cursor-pointer tap-scale transition-all duration-200",
                habit.completedToday
                  ? "bg-primary border-primary text-primary-foreground"
                  : "border-border hover:border-primary hover:bg-primary/5"
              )}
              aria-label={habit.completedToday ? "Desmarcar hábito" : "Marcar como completado"}
            >
              {habit.completedToday && <Check size={18} strokeWidth={2.5} />}
            </button>
          )}

          {habit.type === "checkpoints" && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-10 h-10 rounded-full border-2 border-border flex items-center justify-center shrink-0 cursor-pointer tap-scale hover:border-primary hover:bg-primary/5 transition-all duration-200"
              aria-label="Ver tramos del día"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}

          {habit.type === "counter" && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCounterChange(habit.id, -1)}
                className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center cursor-pointer tap-scale hover:border-destructive hover:bg-destructive/5 transition-all duration-150"
                aria-label="Restar"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={() => onCounterChange(habit.id, 1)}
                className="w-8 h-8 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center cursor-pointer tap-scale hover:bg-primary hover:text-primary-foreground transition-all duration-150"
                aria-label="Sumar"
              >
                <Plus size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Progress bar for counter */}
        {habit.type === "counter" && (
          <div className="mt-3">
            <Progress value={counterProgress} className="h-1.5" />
          </div>
        )}

        {/* Checkpoint progress bar */}
        {habit.type === "checkpoints" && checkpointsTotal > 0 && (
          <div className="mt-3">
            <Progress value={cpProgress} className="h-1.5" />
          </div>
        )}

        {/* Checkpoints expanded */}
        {habit.type === "checkpoints" && expanded && (
          <div className="mt-3 space-y-2 pt-3 border-t border-border">
            {habit.checkpoints?.map((cp) => (
              <CheckpointItem
                key={cp.id}
                checkpoint={cp}
                onDone={() => handleMarkDone(cp.id)}
                onFail={() => handleMarkFailed(cp.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Context dialog */}
      <Dialog open={failDialogOpen} onOpenChange={setFailDialogOpen}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">
              ¿Qué pasó en este tramo?
            </DialogTitle>
          </DialogHeader>
          <ContextTagPicker
            onConfirm={handleContextConfirm}
            onSkip={() => {
              if (pendingFail) {
                onCheckpointChange(habit.id, pendingFail.checkpointId, false);
              }
              setFailDialogOpen(false);
              setPendingFail(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CheckpointItemProps {
  checkpoint: Checkpoint;
  onDone: () => void;
  onFail: () => void;
}

function CheckpointItem({ checkpoint, onDone, onFail }: CheckpointItemProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Time */}
      <div className="text-xs text-muted-foreground font-medium w-12 shrink-0 text-right">
        {checkpoint.time}
      </div>

      {/* Label */}
      <div className="flex-1">
        <p className="text-sm font-medium">{checkpoint.label}</p>
      </div>

      {/* Status buttons */}
      <div className="flex items-center gap-1.5">
        {checkpoint.status === "done" ? (
          <span className="inline-flex items-center gap-1 text-xs text-primary font-medium">
            <Check size={14} className="text-primary" />
            Cumplido
          </span>
        ) : checkpoint.status === "failed" ? (
          <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium">
            <X size={14} />
            Fallé
          </span>
        ) : (
          <>
            <button
              onClick={onFail}
              className="w-8 h-8 rounded-full border-2 border-border flex items-center justify-center cursor-pointer tap-scale hover:border-destructive hover:bg-destructive/5 transition-all duration-150"
              aria-label="Marcar como fallado"
            >
              <X size={14} className="text-muted-foreground" />
            </button>
            <button
              onClick={onDone}
              className="w-8 h-8 rounded-full border-2 border-primary bg-primary/5 flex items-center justify-center cursor-pointer tap-scale hover:bg-primary hover:text-primary-foreground transition-all duration-150"
              aria-label="Marcar como completado"
            >
              <Check size={14} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
