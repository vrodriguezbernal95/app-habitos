import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/habits/[id]/records — obtener registros de los últimos 84 días
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  // Últimos 90 días (suficiente para cubrir la ventana de 12 semanas alineada a lunes)
  const start = new Date();
  start.setDate(start.getDate() - 90);
  const startStr = start.toISOString().split("T")[0];

  const records = await prisma.habitRecord.findMany({
    where: { habitId: id, date: { gte: startStr } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(records);
}

// POST /api/habits/[id]/records — crear o actualizar registro de hoy
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  // Usar la fecha local del cliente si viene en el body, evita el desfase UTC
  const today = body.date ?? new Date().toISOString().split("T")[0];

  const record = await prisma.habitRecord.upsert({
    where: { habitId_date: { habitId: id, date: today } },
    create: {
      habitId: id,
      date: today,
      completed: body.completed ?? false,
      completionRate: body.completionRate ?? 0,
      counterValue: body.counterValue ?? null,
    },
    update: {
      completed: body.completed ?? false,
      completionRate: body.completionRate ?? 0,
      counterValue: body.counterValue ?? null,
    },
  });

  return NextResponse.json(record);
}
