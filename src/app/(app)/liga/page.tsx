"use client";

import { Trophy, Users, Clock, Zap } from "lucide-react";

export default function LigaPage() {
  return (
    <div className="px-4 md:px-8 pt-6 pb-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-semibold">Liga</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Compite con tus amigos</p>
      </div>

      {/* Coming soon hero */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-8 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
          <Trophy size={32} className="text-primary" />
        </div>
        <div className="space-y-1">
          <p className="font-heading text-xl font-semibold">Próximamente</p>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Las ligas están en desarrollo. Pronto podrás crear grupos y competir con amigos.
          </p>
        </div>
      </div>

      {/* Feature preview */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Qué podrás hacer
        </p>
        <div className="space-y-2">
          {[
            { Icon: Users, title: "Crear grupos", desc: "Invita a amigos con un código o enlace" },
            { Icon: Clock, title: "Duración flexible", desc: "Ligas de 3 a 16 semanas" },
            { Icon: Zap,   title: "Competición en tiempo real", desc: "Ranking semanal y clasificación final" },
            { Icon: Trophy, title: "Ganador de la liga", desc: "El que más hábitos cumpla gana" },
          ].map(({ Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
                <Icon size={18} className="text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
