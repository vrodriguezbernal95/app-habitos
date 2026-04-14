import type { Habit, DayRecord } from "./types";

export const mockHabits: Habit[] = [
  {
    id: "1",
    name: "No comer azúcar",
    icon: "🥗",
    color: "bg-emerald-500",
    type: "checkpoints",
    frequency: "daily",
    streak: 12,
    bestStreak: 21,
    completedToday: false,
    checkpoints: [
      { id: "1a", time: "10:00", label: "Mañana",  status: "done" },
      { id: "1b", time: "17:00", label: "Tarde",   status: "pending" },
      { id: "1c", time: "21:00", label: "Noche",   status: "pending" },
    ],
    createdAt: "2026-02-01",
  },
  {
    id: "2",
    name: "Meditar 10 min",
    icon: "🧘",
    color: "bg-violet-500",
    type: "single",
    frequency: "daily",
    streak: 5,
    bestStreak: 14,
    completedToday: true,
    createdAt: "2026-03-10",
  },
  {
    id: "3",
    name: "Beber 2L de agua",
    icon: "💧",
    color: "bg-blue-500",
    type: "counter",
    frequency: "daily",
    streak: 8,
    bestStreak: 8,
    completedToday: false,
    counterTarget: 8,
    counterCurrent: 3,
    createdAt: "2026-03-01",
  },
  {
    id: "4",
    name: "Leer 20 páginas",
    icon: "📖",
    color: "bg-amber-500",
    type: "single",
    frequency: "daily",
    streak: 3,
    bestStreak: 30,
    completedToday: false,
    createdAt: "2026-01-15",
  },
  {
    id: "5",
    name: "Ejercicio 30 min",
    icon: "🏃",
    color: "bg-rose-500",
    type: "single",
    frequency: "custom",
    days: [1, 3, 5], // Lun, Mié, Vie
    streak: 4,
    bestStreak: 12,
    completedToday: false,
    createdAt: "2026-02-15",
  },
];

// Genera heatmap para los últimos 84 días (12 semanas).
// Para un usuario nuevo, todos los días anteriores están vacíos.
// Solo hoy puede tener datos reales.
export function generateHeatmapData(habitId: string): DayRecord[] {
  const records: DayRecord[] = [];
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];

  for (let i = 83; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const isToday = dateStr === todayStr;
    records.push({
      date: dateStr,
      habitId,
      completed: false,      // sin datos reales aún
      completionRate: isToday ? 0 : 0,  // se actualizará con datos reales
    });
  }
  return records;
}

export const mockDayRecords = generateHeatmapData("1");

export const HABIT_SUGGESTIONS = [
  { name: "Meditar", icon: "🧘", color: "bg-violet-500" },
  { name: "Beber agua", icon: "💧", color: "bg-blue-500" },
  { name: "Leer", icon: "📖", color: "bg-amber-500" },
  { name: "Ejercicio", icon: "🏃", color: "bg-rose-500" },
  { name: "Sin azúcar", icon: "🥗", color: "bg-emerald-500" },
  { name: "Dormir 8h", icon: "😴", color: "bg-indigo-500" },
  { name: "Sin redes sociales", icon: "📵", color: "bg-slate-500" },
  { name: "Journaling", icon: "✍️", color: "bg-orange-500" },
  { name: "Vitaminas", icon: "💊", color: "bg-pink-500" },
];
