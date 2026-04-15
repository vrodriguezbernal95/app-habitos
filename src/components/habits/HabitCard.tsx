"use client";

import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, ChevronUp, X, Plus, Minus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
  onDelete?: (id: string) => void;
}

export function HabitCard({ habit, onToggle, onCheckpointChange, onCounterChange, onDelete }: HabitCardProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [failDialogOpen, setFailDialogOpen] = useState(false);
  const [pendingFail, setPendingFail] = useState<{ checkpointId: string } | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

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

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground cursor-pointer tap-scale hover:bg-muted transition-all duration-150"
              aria-label="Más opciones"
            >
              <MoreVertical size={16} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 z-50 w-36 rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                <button
                  onClick={() => { setMenuOpen(false); router.push(`/editar/${habit.id}`); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors duration-150 cursor-pointer"
                >
                  <Pencil size={14} className="text-muted-foreground" />
                  Editar
                </button>
                <button
                  onClick={() => { setMenuOpen(false); setConfirmDelete(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-150 cursor-pointer"
                >
                  <Trash2 size={14} />
                  Eliminar
                </button>
              </div>
            )}
          </div>
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

      {/* Confirm delete dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent className="max-w-sm mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">¿Eliminar hábito?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Se archivará <span className="font-semibold text-foreground">{habit.name}</span> y no aparecerá en tu lista. El historial se conserva.
          </p>
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 h-10 rounded-xl border border-border text-sm font-medium cursor-pointer hover:bg-muted transition-colors duration-150"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                setConfirmDelete(false);
                onDelete?.(habit.id);
              }}
              className="flex-1 h-10 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity duration-150"
            >
              Eliminar
            </button>
          </div>
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
