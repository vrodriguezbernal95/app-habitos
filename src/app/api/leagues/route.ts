import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/leagues — lista de todas las ligas del usuario
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = (session.user as any).id;

  const memberships = await prisma.leagueMember.findMany({
    where: { userId },
    orderBy: { joinedAt: "desc" },
    include: {
      league: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });

  const summaries = memberships.map((m) => ({
    id: m.league.id,
    name: m.league.name,
    code: m.league.code,
    memberCount: m.league._count.members,
  }));

  return NextResponse.json(summaries);
}

// POST /api/leagues — crear una nueva liga
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const userId = (session.user as any).id;

  const body = await req.json();
  const name = (body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Nombre requerido" }, { status: 400 });

  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = Array.from({ length: 6 }, () =>
      CHARS[Math.floor(Math.random() * CHARS.length)]
    ).join("");
    const exists = await prisma.league.findUnique({ where: { code: candidate } });
    if (!exists) { code = candidate; break; }
  }
  if (!code) return NextResponse.json({ error: "Error generando código. Intenta de nuevo." }, { status: 500 });

  const league = await prisma.$transaction(async (tx) => {
    const l = await tx.league.create({ data: { name, code } });
    await tx.leagueMember.create({ data: { leagueId: l.id, userId } });
    return l;
  });

  return NextResponse.json({ id: league.id, name: league.name, code: league.code, memberCount: 1 }, { status: 201 });
}
