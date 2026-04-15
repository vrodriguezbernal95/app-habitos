"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Trophy,
  Plus,
  ArrowRight,
  ChevronLeft,
  Copy,
  Check,
  MoreVertical,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

interface RankingEntry {
  userId: string;
  name: string;
  image: string | null;
  score: number;
}

interface HistoryEntry {
  id: string;
  weekStart: string;
  winnerId: string;
  winnerName: string;
  winnerScore: number;
}

interface LeagueData {
  id: string;
  name: string;
  code: string;
  rankings: RankingEntry[];
  history: HistoryEntry[];
  weekStart: string;
  todayStr: string;
  myUserId: string;
}

type View = "loading" | "empty" | "creating" | "joining" | "league";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatWeekDate(dateStr: string): string {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
  });
}

function getMedalOrNumber(position: number): { medal: string | null; num: number | null } {
  if (position === 1) return { medal: "🥇", num: null };
  if (position === 2) return { medal: "🥈", num: null };
  if (position === 3) return { medal: "🥉", num: null };
  return { medal: null, num: position };
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-teal-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-rose-500",
  "bg-amber-500",
];

function avatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash + userId.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[hash];
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LigaPage() {
  const [view, setView] = useState<View>("loading");
  const [leagueData, setLeagueData] = useState<LeagueData | null>(null);

  // Forms
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  // Menu open
  const [menuOpen, setMenuOpen] = useState(false);

  const loadLeague = useCallback(async () => {
    try {
      const res = await fetch("/api/leagues");
      const data = await res.json();
      if (data) {
        setLeagueData(data);
        setView("league");
      } else {
        setLeagueData(null);
        setView("empty");
      }
    } catch {
      setView("empty");
    }
  }, []);

  useEffect(() => {
    loadLeague();
  }, [loadLeague]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const name = newName.trim();
    if (!name) { setError("Escribe un nombre para la liga"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al crear la liga"); return; }
      setNewName("");
      setLeagueData(data);
      setView("league");
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = joinCode.toUpperCase().trim();
    if (code.length !== 6) { setError("El código debe tener 6 caracteres"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Error al unirse"); return; }
      setJoinCode("");
      await loadLeague();
    } catch {
      setError("Error de conexión");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleLeave() {
    if (!leagueData) return;
    setMenuOpen(false);
    if (!confirm("¿Seguro que quieres salir de la liga?")) return;
    try {
      await fetch(`/api/leagues/${leagueData.id}/leave`, { method: "DELETE" });
      setLeagueData(null);
      setView("empty");
    } catch {
      // ignore
    }
  }

  function handleCopyCode() {
    if (!leagueData) return;
    navigator.clipboard.writeText(leagueData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  if (view === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (view === "empty") {
    return (
      <div className="px-4 md:px-8 pt-6 pb-4">
        <div className="flex flex-col items-center text-center gap-6 mt-8">
          <Trophy size={48} className="text-primary" />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-semibold">Compite con tus amigos</h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Crea una liga privada o únete a una con un código. El que más hábitos cumpla cada semana, gana.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <button
              onClick={() => { setError(""); setView("creating"); }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card active:scale-95 transition-transform"
            >
              <Plus size={24} className="text-primary" />
              <span className="text-sm font-medium">Crear liga</span>
            </button>
            <button
              onClick={() => { setError(""); setView("joining"); }}
              className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-border bg-card active:scale-95 transition-transform"
            >
              <ArrowRight size={24} className="text-primary" />
              <span className="text-sm font-medium">Unirse con código</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "creating") {
    return (
      <div className="px-4 md:px-8 pt-6 pb-4 space-y-6">
        <button
          onClick={() => setView("empty")}
          className="flex items-center gap-1 text-sm text-muted-foreground active:scale-95 transition-transform"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="font-heading text-xl font-semibold">Nueva liga</h1>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Nombre de la liga</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={30}
              placeholder="Ej. Los campeones"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform disabled:opacity-60"
          >
            {submitting ? "Creando..." : "Crear liga"}
          </button>
        </form>
      </div>
    );
  }

  if (view === "joining") {
    return (
      <div className="px-4 md:px-8 pt-6 pb-4 space-y-6">
        <button
          onClick={() => setView("empty")}
          className="flex items-center gap-1 text-sm text-muted-foreground active:scale-95 transition-transform"
        >
          <ChevronLeft size={16} /> Volver
        </button>
        <h1 className="font-heading text-xl font-semibold">Únete a una liga</h1>
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Código de invitación</label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              placeholder="XXXXXX"
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-lg font-mono tracking-widest text-center outline-none focus:border-primary transition-colors"
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm active:scale-95 transition-transform disabled:opacity-60"
          >
            {submitting ? "Uniéndose..." : "Unirse"}
          </button>
        </form>
      </div>
    );
  }

  // ── League view ──────────────────────────────────────────────────────────────

  if (view === "league" && leagueData) {
    const { name, code, rankings, history, weekStart, todayStr, myUserId } = leagueData;

    const weekStartDisplay = formatWeekDate(weekStart);
    const todayDisplay = new Date(todayStr + "T12:00:00").toLocaleDateString("es-ES", {
      weekday: "short",
      day: "numeric",
    });

    return (
      <div className="px-4 md:px-8 pt-6 pb-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="font-heading text-xl font-semibold truncate mr-2">{name}</h1>
          <div className="flex items-center gap-2 shrink-0">
            {/* Code badge + copy */}
            <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-lg">
              <span className="font-mono text-sm tracking-wider">{code}</span>
              <button
                onClick={handleCopyCode}
                className="p-0.5 rounded active:scale-90 transition-transform text-muted-foreground hover:text-foreground"
                title="Copiar código"
              >
                {copied ? <Check size={14} className="text-primary" /> : <Copy size={14} />}
              </button>
            </div>
            {/* Menu */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1.5 rounded-xl hover:bg-muted active:scale-90 transition-transform"
              >
                <MoreVertical size={18} />
              </button>
              {menuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 top-9 z-20 min-w-[160px] rounded-xl border border-border bg-card shadow-lg overflow-hidden">
                    <button
                      onClick={handleLeave}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm text-destructive hover:bg-muted transition-colors"
                    >
                      <LogOut size={15} />
                      Salir de la liga
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Current week */}
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Semana actual
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {weekStartDisplay} – Hoy
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
            {rankings.map((entry, idx) => {
              const position = idx + 1;
              const { medal, num } = getMedalOrNumber(position);
              const isMe = entry.userId === myUserId;
              const pct = Math.round(entry.score * 100);

              return (
                <div
                  key={entry.userId}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3",
                    isMe && "bg-primary/5 border-l-2 border-l-primary"
                  )}
                >
                  {/* Position */}
                  <div className="w-7 text-center shrink-0">
                    {medal ? (
                      <span className="text-lg leading-none">{medal}</span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                        {num}
                      </span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="shrink-0">
                    {entry.image ? (
                      <img
                        src={entry.image}
                        alt={entry.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    ) : (
                      <div
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold",
                          avatarColor(entry.userId)
                        )}
                      >
                        {getInitials(entry.name)}
                      </div>
                    )}
                  </div>

                  {/* Name + bar */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm truncate", isMe && "font-bold")}>{entry.name}</p>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Score */}
                  <div className="shrink-0 text-sm font-semibold tabular-nums">{pct}%</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Historial
            </p>
            <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border">
              {history.map((week) => (
                <div key={week.id} className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      Sem {formatWeekDate(week.weekStart)}
                    </p>
                    <p className="text-sm font-medium truncate">{week.winnerName}</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                    {Math.round(week.winnerScore * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
