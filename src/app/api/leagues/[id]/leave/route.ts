import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE /api/leagues/[id]/leave
export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const userId = (session.user as any).id;
  const leagueId = params.id;

  await prisma.leagueMember.deleteMany({
    where: { leagueId, userId },
  });

  const remaining = await prisma.leagueMember.count({ where: { leagueId } });
  if (remaining === 0) {
    await prisma.league.delete({ where: { id: leagueId } });
  }

  return NextResponse.json({ ok: true });
}
