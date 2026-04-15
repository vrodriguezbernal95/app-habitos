import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/leagues/join
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;

  const body = await req.json();
  const code = (body.code ?? "").toString().toUpperCase().trim();
  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Código inválido" }, { status: 400 });
  }

  const league = await prisma.league.findUnique({ where: { code } });
  if (!league) {
    return NextResponse.json({ error: "Liga no encontrada" }, { status: 404 });
  }

  const memberCount = await prisma.leagueMember.count({ where: { leagueId: league.id } });
  if (memberCount >= 8) {
    return NextResponse.json({ error: "La liga está llena (máximo 8 miembros)" }, { status: 400 });
  }

  const alreadyMember = await prisma.leagueMember.findUnique({
    where: { leagueId_userId: { leagueId: league.id, userId } },
  });
  if (alreadyMember) {
    return NextResponse.json({ error: "Ya eres miembro de esta liga" }, { status: 400 });
  }

  await prisma.leagueMember.create({ data: { leagueId: league.id, userId } });

  return NextResponse.json({ ok: true });
}
