import {
  Dumbbell, Footprints, Bike, Activity, Zap, Timer,
  Droplets, Apple, Pill, Coffee, UtensilsCrossed, Moon,
  Brain, Heart, Leaf, Wind, Sun, Flame,
  BookOpen, NotebookPen, GraduationCap, Music, SmartphoneOff, PiggyBank,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface HabitIconDef {
  id: string;
  label: string;
  Icon: LucideIcon;
  category: "fitness" | "salud" | "mente" | "productividad";
}

export const HABIT_ICONS: HabitIconDef[] = [
  // Fitness
  { id: "dumbbell",     label: "Gimnasio",      Icon: Dumbbell,       category: "fitness" },
  { id: "footprints",   label: "Correr",         Icon: Footprints,     category: "fitness" },
  { id: "bike",         label: "Ciclismo",       Icon: Bike,           category: "fitness" },
  { id: "activity",     label: "Deporte",        Icon: Activity,       category: "fitness" },
  { id: "zap",          label: "Entrenamiento",  Icon: Zap,            category: "fitness" },
  { id: "timer",        label: "Cardio",         Icon: Timer,          category: "fitness" },
  // Salud
  { id: "droplets",     label: "Hidratación",    Icon: Droplets,       category: "salud" },
  { id: "apple",        label: "Alimentación",   Icon: Apple,          category: "salud" },
  { id: "pill",         label: "Vitaminas",      Icon: Pill,           category: "salud" },
  { id: "coffee",       label: "Sin cafeína",    Icon: Coffee,         category: "salud" },
  { id: "utensils",     label: "Cocinar sano",   Icon: UtensilsCrossed, category: "salud" },
  { id: "moon",         label: "Sueño",          Icon: Moon,           category: "salud" },
  // Mente
  { id: "brain",        label: "Meditación",     Icon: Brain,          category: "mente" },
  { id: "heart",        label: "Bienestar",      Icon: Heart,          category: "mente" },
  { id: "leaf",         label: "Naturaleza",     Icon: Leaf,           category: "mente" },
  { id: "wind",         label: "Respiración",    Icon: Wind,           category: "mente" },
  { id: "sun",          label: "Rutina mañana",  Icon: Sun,            category: "mente" },
  { id: "flame",        label: "Constancia",     Icon: Flame,          category: "mente" },
  // Productividad
  { id: "book",         label: "Leer",           Icon: BookOpen,       category: "productividad" },
  { id: "notebook",     label: "Journaling",     Icon: NotebookPen,    category: "productividad" },
  { id: "graduation",   label: "Estudiar",       Icon: GraduationCap,  category: "productividad" },
  { id: "music",        label: "Música",         Icon: Music,          category: "productividad" },
  { id: "no-phone",     label: "Sin móvil",      Icon: SmartphoneOff,  category: "productividad" },
  { id: "savings",      label: "Ahorro",         Icon: PiggyBank,      category: "productividad" },
];

const ICON_MAP = Object.fromEntries(HABIT_ICONS.map((h) => [h.id, h.Icon]));

export const CATEGORY_LABELS: Record<HabitIconDef["category"], string> = {
  fitness:        "Fitness",
  salud:          "Salud",
  mente:          "Mente",
  productividad:  "Productividad",
};

export const CATEGORIES = ["fitness", "salud", "mente", "productividad"] as const;

interface HabitIconProps {
  icon: string;
  size?: number;
  className?: string;
}

/** Renders a lucide icon by id, or falls back to emoji text */
export function HabitIcon({ icon, size = 20, className }: HabitIconProps) {
  const Icon = ICON_MAP[icon];
  if (Icon) return <Icon size={size} className={className} />;
  // Fallback for old emoji habits
  return <span style={{ fontSize: size * 0.9 }} className={className}>{icon}</span>;
}
