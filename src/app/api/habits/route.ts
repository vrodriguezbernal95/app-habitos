import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/habits — obtener todos los hábitos del usuario
// Acepta ?date=YYYY-MM-DD para usar la fecha local del cliente en vez de UTC del servidor
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const url = new URL(req.url);
  const today = url.searchParams.get("date") ?? new Date().toISOString().split("T")[0];

  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    include: {
      checkpoints: { orderBy: { time: "asc" } },
      records: { where: { date: today } },
    },
    orderBy: { createdAt: "asc" },
  });

  // Calcular completedToday y counterCurrent desde el registro de hoy
  const result = habits.map((h) => {
    const todayRecord = h.records[0] ?? null;
    return {
      ...h,
      records: undefined,
      completedToday: todayRecord?.completed ?? false,
      counterCurrent: todayRecord?.counterValue ?? 0,
      streak: 0,
      bestStreak: 0,
    };
  });

  return NextResponse.json(result);
}

// POST /api/habits — crear un nuevo hábito
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  try {
    const MAX_ACTIVE_SLOTS = 3;
    const activeCount = await prisma.habit.count({
      where: { userId, isActive: true, archivedAt: null },
    });

    const habit = await prisma.habit.create({
      data: {
        userId,
        name: body.name,
        icon: body.icon,
        color: body.color,
        type: body.type,
        frequency: body.frequency,
        days: body.days ?? [],
        counterTarget: body.type === "counter" ? (body.counterTarget ?? 8) : null,
        reminder: body.reminder ?? null,
        isActive: activeCount < MAX_ACTIVE_SLOTS,
        checkpoints: body.type === "checkpoints"
          ? { create: (body.checkpoints ?? []).map((cp: any) => ({ time: cp.time, label: cp.label })) }
          : undefined,
      },
      include: { checkpoints: true },
    });

    return NextResponse.json({ ...habit, completedToday: false, counterCurrent: 0, streak: 0, bestStreak: 0 }, { status: 201 });
  } catch (e: any) {
    console.error("Error creando hábito:", e);
    return NextResponse.json({ error: e.message ?? "Error interno" }, { status: 500 });
  }
}
