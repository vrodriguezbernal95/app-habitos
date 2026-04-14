export type HabitFrequency = "daily" | "weekly" | "custom";

export type CheckpointStatus = "pending" | "done" | "failed";

export type FailContext =
  | "tired"
  | "stress"
  | "craving"
  | "emotional"
  | "no_time"
  | "social"
  | "bad_day"
  | "other";

export interface Checkpoint {
  id: string;
  time: string; // "10:00"
  label: string; // "Mañana"
  status: CheckpointStatus;
  context?: FailContext[];
  note?: string;
}

export type HabitType = "single" | "checkpoints" | "counter";

export interface Habit {
  id: string;
  name: string;
  icon: string; // emoji or lucide icon name
  color: string; // tailwind color class
  type: HabitType;
  frequency: HabitFrequency;
  days?: number[]; // 0=Sun...6=Sat
  streak: number;
  bestStreak: number;
  completedToday: boolean;
  checkpoints?: Checkpoint[];
  counterTarget?: number;
  counterCurrent?: number;
  createdAt: string;
}

export interface DayRecord {
  date: string; // "2026-04-14"
  habitId: string;
  completed: boolean;
  completionRate: number; // 0-1
  checkpointResults?: {
    checkpointId: string;
    status: CheckpointStatus;
    context?: FailContext[];
  }[];
}

export interface UserStats {
  totalHabits: number;
  activeStreak: number; // días consecutivos con al menos 1 hábito
  completionRateWeek: number;
  completionRateMonth: number;
  bestHabit: string;
  weakestHabit: string;
}

export const FAIL_CONTEXT_LABELS: Record<FailContext, string> = {
  tired: "Cansancio",
  stress: "Estrés",
  craving: "Antojo",
  emotional: "Bajón emocional",
  no_time: "Sin tiempo",
  social: "Entorno social",
  bad_day: "Mal día",
  other: "Otro",
};

export const FAIL_CONTEXT_ICONS: Record<FailContext, string> = {
  tired: "😴",
  stress: "😤",
  craving: "🍬",
  emotional: "😔",
  no_time: "⏱",
  social: "👥",
  bad_day: "🌧",
  other: "💬",
};
