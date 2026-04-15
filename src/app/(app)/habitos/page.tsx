"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Lock, Pencil, Trash2, ToggleLeft, ToggleRight, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit } from "@/lib/types";

// Requisitos para desbloquear más slots
const SLOT_REQUIREMENTS = [
  { slots: 3, label: "3 hábitos", requirement: null },
  { slots: 4, label: "4 hábitos", requirement: "Completa 3 hábitos sin fallar 30 días seguidos" },
  { slots: 5, label: "5 hábitos", requirement: "Completa 4 hábitos sin fallar 60 días seguidos" },
];

const MAX_UNLOCKED_DEFAULT = 3;

export default function HabitosPage() {
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/habits")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setHabits(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Cerrar menu al hacer clic fuera
  useEffect(() => {
    const handler = () => setOpenMenuId(null);
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const activeHabits = habits.filter((h) => h.isActive);
  const inactiveHabits = habits.filter((h) => !h.isActive);
  const maxSlots = MAX_UNLOCKED_DEFAULT; // TODO: compute from achievements

  const handleToggleActive = async (habit: Habit) => {
    // No permitir activar si ya hay maxSlots activos
    if (!habit.isActive && activeHabits.length >= maxSlots) return;

    const newActive = !habit.isActive;
    setHabits((prev) =>
      prev.map((h) => h.id === habit.id ? { ...h, isActive: newActive } : h)
    );
    await fetch(`/api/habits/${habit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: newActive }),
    });
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  if (loading) {
    return (
      <div className="px-4 md:px-8 pt-6 pb-4 space-y-4">
        <div className="h-8 w-32 bg-muted animate-pulse rounded-xl" />
        <div className="space-y-3 pt-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 md:px-8 pt-6 pb-4 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Hábitos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {activeHabits.length} de {maxSlots} ranuras activas
          </p>
        </div>
        <button
          onClick={() => router.push("/crear")}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer tap-scale hover:opacity-90 transition-opacity duration-150"
        >
          <Plus size={16} />
          Nuevo
        </button>
      </div>

      {/* Slots activos */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Ranuras activas
        </p>

        {/* Hábitos activos */}
        {activeHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            menuOpen={openMenuId === habit.id}
            onMenuOpen={(e) => { e.stopPropagation(); setOpenMenuId(habit.id); }}
            onMenuClose={() => setOpenMenuId(null)}
            onEdit={() => { setOpenMenuId(null); router.push(`/editar/${habit.id}`); }}
            onDelete={() => { setOpenMenuId(null); handleDelete(habit.id); }}
            onToggle={() => handleToggleActive(habit)}
          />
        ))}

        {/* Ranura vacía si hay espacio */}
        {activeHabits.length < maxSlots && (
          <button
            onClick={() => router.push("/crear")}
            className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-all duration-150 cursor-pointer tap-scale group"
          >
            <div className="w-11 h-11 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors duration-150">
              <Plus size={20} className="text-muted-foreground group-hover:text-primary transition-colors duration-150" />
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-muted-foreground group-hover:text-primary transition-colors duration-150">
                Añadir hábito
              </p>
              <p className="text-xs text-muted-foreground">Ranura disponible</p>
            </div>
          </button>
        )}

        {/* Ranuras bloqueadas */}
        {SLOT_REQUIREMENTS.slice(maxSlots).map((req) => (
          <div
            key={req.slots}
            className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-muted/30 opacity-60"
          >
            <div className="w-11 h-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
              <Lock size={18} className="text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-muted-foreground">Ranura {req.slots} bloqueada</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{req.requirement}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Hábitos inactivos */}
      {inactiveHabits.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Otros hábitos
          </p>
          {inactiveHabits.map((habit) => (
            <HabitRow
              key={habit.id}
              habit={habit}
              menuOpen={openMenuId === habit.id}
              onMenuOpen={(e) => { e.stopPropagation(); setOpenMenuId(habit.id); }}
              onMenuClose={() => setOpenMenuId(null)}
              onEdit={() => { setOpenMenuId(null); router.push(`/editar/${habit.id}`); }}
              onDelete={() => { setOpenMenuId(null); handleDelete(habit.id); }}
              onToggle={() => handleToggleActive(habit)}
              canActivate={activeHabits.length < maxSlots}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {habits.length === 0 && (
        <div className="text-center py-16 space-y-4">
          <p className="text-4xl">✦</p>
          <p className="font-heading text-lg font-semibold">Sin hábitos todavía</p>
          <p className="text-sm text-muted-foreground">Crea tu primer hábito para empezar.</p>
          <button
            onClick={() => router.push("/crear")}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold cursor-pointer tap-scale hover:opacity-90 transition-opacity"
          >
            <Plus size={16} />
            Crear primer hábito
          </button>
        </div>
      )}
    </div>
  );
}

interface HabitRowProps {
  habit: Habit & { isActive?: boolean };
  menuOpen: boolean;
  onMenuOpen: (e: React.MouseEvent) => void;
  onMenuClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
  canActivate?: boolean;
}

function HabitRow({ habit, menuOpen, onMenuOpen, onMenuClose, onEdit, onDelete, onToggle, canActivate = true }: HabitRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-2xl border bg-card transition-all duration-200",
        !habit.isActive && "opacity-60"
      )}
    >
      {/* Icon */}
      <div className={cn(
        "w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0",
        habit.isActive ? "bg-primary/10" : "bg-muted"
      )}>
        {habit.icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate">{habit.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {habit.frequency === "daily" && "Todos los días"}
          {habit.frequency === "weekly" && "Una vez a la semana"}
          {habit.frequency === "custom" && `${habit.days?.length ?? 0} días por semana`}
          {" · "}
          {habit.type === "single" && "Un check"}
          {habit.type === "checkpoints" && `${habit.checkpoints?.length ?? 0} tramos`}
          {habit.type === "counter" && `Objetivo: ${habit.counterTarget}`}
        </p>
      </div>

      {/* Toggle active */}
      <button
        onClick={onToggle}
        disabled={!habit.isActive && !canActivate}
        className={cn(
          "shrink-0 cursor-pointer transition-all duration-150 tap-scale",
          !habit.isActive && !canActivate && "opacity-30 cursor-not-allowed"
        )}
        aria-label={habit.isActive ? "Desactivar" : "Activar"}
        title={!habit.isActive && !canActivate ? "Libera una ranura activa primero" : undefined}
      >
        {habit.isActive ? (
          <ToggleRight size={28} className="text-primary" />
        ) : (
          <ToggleLeft size={28} className="text-muted-foreground" />
        )}
      </button>

      {/* More menu */}
      <div className="relative">
        <button
          onClick={onMenuOpen}
          className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground cursor-pointer tap-scale hover:bg-muted transition-all duration-150"
        >
          <MoreVertical size={16} />
        </button>
        {menuOpen && (
          <div
            className="absolute right-0 top-9 z-50 w-36 rounded-xl border border-border bg-card shadow-lg overflow-hidden"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              onClick={onEdit}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium hover:bg-muted transition-colors duration-150 cursor-pointer"
            >
              <Pencil size={14} className="text-muted-foreground" />
              Editar
            </button>
            <button
              onClick={onDelete}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors duration-150 cursor-pointer"
            >
              <Trash2 size={14} />
              Eliminar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
