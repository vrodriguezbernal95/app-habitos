import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/habits — obtener todos los hábitos del usuario
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const habits = await prisma.habit.findMany({
    where: { userId, archivedAt: null },
    include: { checkpoints: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(habits);
}

// POST /api/habits — crear un nuevo hábito
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const habit = await prisma.habit.create({
    data: {
      userId,
      name: body.name,
      icon: body.icon,
      color: body.color,
      type: body.type,
      frequency: body.frequency,
      days: body.days ?? [],
      counterTarget: body.counterTarget ?? null,
      reminder: body.reminder ?? null,
      checkpoints: body.type === "checkpoints"
        ? { create: body.checkpoints.map((cp: any) => ({ time: cp.time, label: cp.label })) }
        : undefined,
    },
    include: { checkpoints: true },
  });

  return NextResponse.json(habit, { status: 201 });
}
