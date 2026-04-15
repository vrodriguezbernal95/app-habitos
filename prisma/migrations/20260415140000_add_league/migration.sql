CREATE TABLE "League" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "League_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LeagueMember" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeagueMember_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LeagueWeekResult" (
    "id" TEXT NOT NULL,
    "leagueId" TEXT NOT NULL,
    "weekStart" TEXT NOT NULL,
    "winnerId" TEXT NOT NULL,
    "winnerName" TEXT NOT NULL,
    "winnerScore" DOUBLE PRECISION NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LeagueWeekResult_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "League_code_key" ON "League"("code");
CREATE UNIQUE INDEX "LeagueMember_leagueId_userId_key" ON "LeagueMember"("leagueId", "userId");
CREATE UNIQUE INDEX "LeagueWeekResult_leagueId_weekStart_key" ON "LeagueWeekResult"("leagueId", "weekStart");
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeagueMember" ADD CONSTRAINT "LeagueMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LeagueWeekResult" ADD CONSTRAINT "LeagueWeekResult_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE CASCADE ON UPDATE CASCADE;
