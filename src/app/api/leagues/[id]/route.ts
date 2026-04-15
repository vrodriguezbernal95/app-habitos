import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split("T")[0];
}

async function calcRankings(memberIds: string[], weekStart: string, weekEnd: string) {
  const habits = await prisma.habit.findMany({
    where: { userId: { in: memberIds }, archivedAt: null },
    select: { id: true, userId: true },
  });
  const records = await prisma.habitRecord.findMany({
    where: {
      habitId: { in: habits.map((h) => h.id) },
      date: { gte: weekStart, lte: weekEnd },
    },
    select: { habitId: true, completionRate: true },
  });
  const habitUser: Record<string, string> = {};
  habits.forEach((h) => { habitUser[h.id] = h.userId; });
  const scores: Record<string, number[]> = {};
  records.forEach((r) => {
    const uid = habitUser[r.habitId];
    if (!scores[uid]) scores[uid] = [];
    scores[uid].push(r.completionRate);
  });
  return memberIds.map((uid) => ({
    userId: uid,
    score: scores[uid]?.length
      ? scores[uid].reduce((a, b) => a + b, 0) / scores[uid].length
      : 0,
  }));
}

// GET /api/leagues/[id] — detalle completo de una liga
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = (session.user as any).id;
  const { id: leagueId } = await params;

  // Verificar membresía
  const membership = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId, userId } },
  });
  if (!membership) return NextResponse.json({ error: "No eres miembro de esta liga" }, { status: 403 });

  const league = await prisma.league.findUnique({
    where: { id: leagueId },
    include: {
      members: { include: { user: { select: { id: true, name: true, image: true } } } },
      weekResults: { orderBy: { closedAt: "desc" }, take: 10 },
    },
  });
  if (!league) return NextResponse.json({ error: "Liga no encontrada" }, { status: 404 });

  const memberIds = league.members.map((m) => m.userId);
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekStart = getWeekStart(today);

  // Auto-cerrar semana anterior si no está cerrada
  const prevWeekDate = new Date(today);
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevWeekStart = getWeekStart(prevWeekDate);

  if (prevWeekStart < weekStart) {
    const existing = await prisma.leagueWeekResult.findUnique({
      where: { leagueId_weekStart: { leagueId, weekStart: prevWeekStart } },
    });
    if (!existing) {
      try {
        const prevEnd = new Date(prevWeekStart + "T12:00:00");
        prevEnd.setDate(prevEnd.getDate() + 6);
        const rankings = await calcRankings(memberIds, prevWeekStart, prevEnd.toISOString().split("T")[0]);
        const winner = rankings.sort((a, b) => b.score - a.score)[0];
        if (winner) {
          const winnerName = league.members.find((m) => m.userId === winner.userId)?.user.name ?? "Desconocido";
          await prisma.leagueWeekResult.upsert({
            where: { leagueId_weekStart: { leagueId, weekStart: prevWeekStart } },
            create: { leagueId, weekStart: prevWeekStart, winnerId: winner.userId, winnerName, winnerScore: winner.score },
            update: {},
          });
        }
      } catch { /* race condition */ }
    }
  }

  // Rankings semana actual
  const currentRankings = await calcRankings(memberIds, weekStart, todayStr);
  const rankingsWithInfo = currentRankings
    .map((r) => {
      const member = league.members.find((m) => m.userId === r.userId);
      return { userId: r.userId, name: member?.user.name ?? "Desconocido", image: member?.user.image ?? null, score: r.score };
    })
    .sort((a, b) => b.score - a.score);

  // Re-fetch historial actualizado
  const updatedHistory = await prisma.leagueWeekResult.findMany({
    where: { leagueId },
    orderBy: { closedAt: "desc" },
    take: 10,
  });

  return NextResponse.json({
    id: league.id,
    name: league.name,
    code: league.code,
    rankings: rankingsWithInfo,
    history: updatedHistory,
    weekStart,
    todayStr,
    myUserId: userId,
  });
}
