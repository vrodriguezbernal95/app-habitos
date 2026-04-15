import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/habits/[id] — actualizar hábito
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await params;

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.userId !== userId)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const body = await req.json();

  // Toggle rápido de isActive
  if ("isActive" in body && Object.keys(body).length === 1) {
    const updated = await prisma.habit.update({
      where: { id },
      data: { isActive: body.isActive },
    });
    return NextResponse.json(updated);
  }

  // Edición completa
  const updated = await prisma.habit.update({
    where: { id },
    data: {
      name: body.name,
      icon: body.icon,
      color: body.color,
      type: body.type,
      frequency: body.frequency,
      days: body.days ?? [],
      counterTarget: body.counterTarget ?? null,
      reminder: body.reminder ?? null,
      checkpoints: body.type === "checkpoints"
        ? {
            deleteMany: {},
            create: (body.checkpoints ?? []).map((cp: { time: string; label: string }) => ({
              time: cp.time,
              label: cp.label,
            })),
          }
        : { deleteMany: {} },
    },
    include: { checkpoints: true },
  });

  return NextResponse.json(updated);
}

// DELETE /api/habits/[id] — archivar hábito
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const { id } = await params;

  const habit = await prisma.habit.findUnique({ where: { id } });
  if (!habit || habit.userId !== userId)
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.habit.update({ where: { id }, data: { archivedAt: new Date() } });
  return NextResponse.json({ ok: true });
}
