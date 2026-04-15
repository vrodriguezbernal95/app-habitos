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

async function calcRankings(
  memberIds: string[],
  weekStart: string,
  weekEnd: string
) {
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
  habits.forEach((h) => {
    habitUser[h.id] = h.userId;
  });
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

async function getLeagueData(userId: string) {
  const membership = await prisma.leagueMember.findFirst({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    include: {
      league: {
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, image: true } },
            },
          },
          weekResults: { orderBy: { closedAt: "desc" }, take: 10 },
        },
      },
    },
  });

  if (!membership) return null;

  const league = membership.league;
  const memberIds = league.members.map((m) => m.userId);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const weekStart = getWeekStart(today);

  // Auto-close previous week
  const prevWeekDate = new Date(today);
  prevWeekDate.setDate(prevWeekDate.getDate() - 7);
  const prevWeekStart = getWeekStart(prevWeekDate);

  if (prevWeekStart < weekStart) {
    const existing = await prisma.leagueWeekResult.findUnique({
      where: { leagueId_weekStart: { leagueId: league.id, weekStart: prevWeekStart } },
    });
    if (!existing) {
      try {
        const prevWeekEndDate = new Date(prevWeekStart + "T12:00:00");
        prevWeekEndDate.setDate(prevWeekEndDate.getDate() + 6);
        const prevWeekEnd = prevWeekEndDate.toISOString().split("T")[0];

        const rankings = await calcRankings(memberIds, prevWeekStart, prevWeekEnd);
        const sorted = rankings.sort((a, b) => b.score - a.score);
        const winner = sorted[0];

        if (winner) {
          const winnerMember = league.members.find((m) => m.userId === winner.userId);
          const winnerName = winnerMember?.user.name ?? "Desconocido";

          await prisma.leagueWeekResult.upsert({
            where: { leagueId_weekStart: { leagueId: league.id, weekStart: prevWeekStart } },
            create: {
              leagueId: league.id,
              weekStart: prevWeekStart,
              winnerId: winner.userId,
              winnerName,
              winnerScore: winner.score,
            },
            update: {},
          });
        }
      } catch (e) {
        // Race condition — another request already created it
        console.warn("Auto-close race condition:", e);
      }
    }
  }

  // Re-fetch to get updated history
  const updatedLeague = await prisma.league.findUnique({
    where: { id: league.id },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      },
      weekResults: { orderBy: { closedAt: "desc" }, take: 10 },
    },
  });

  if (!updatedLeague) return null;

  const updatedMemberIds = updatedLeague.members.map((m) => m.userId);

  // Current week rankings
  const currentRankings = await calcRankings(updatedMemberIds, weekStart, todayStr);

  const rankingsWithInfo = currentRankings
    .map((r) => {
      const member = updatedLeague.members.find((m) => m.userId === r.userId);
      return {
        userId: r.userId,
        name: member?.user.name ?? "Desconocido",
        image: member?.user.image ?? null,
        score: r.score,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    id: updatedLeague.id,
    name: updatedLeague.name,
    code: updatedLeague.code,
    rankings: rankingsWithInfo,
    history: updatedLeague.weekResults,
    weekStart,
    todayStr,
    myUserId: userId,
  };
}

// GET /api/leagues
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const data = await getLeagueData(userId);
  return NextResponse.json(data);
}

// POST /api/leagues — create a league
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  // Enforce one league per user
  const existing = await prisma.leagueMember.findFirst({ where: { userId } });
  if (existing) {
    return NextResponse.json({ error: "Ya estás en una liga" }, { status: 400 });
  }

  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  // Generate unique 6-char code
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = Array.from({ length: 6 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");
    const exists = await prisma.league.findUnique({ where: { code: candidate } });
    if (!exists) {
      code = candidate;
      break;
    }
  }
  if (!code) {
    return NextResponse.json({ error: "Error generando código. Intenta de nuevo." }, { status: 500 });
  }

  await prisma.$transaction(async (tx) => {
    const league = await tx.league.create({ data: { name, code } });
    await tx.leagueMember.create({ data: { leagueId: league.id, userId } });
  });

  const data = await getLeagueData(userId);
  return NextResponse.json(data, { status: 201 });
}
