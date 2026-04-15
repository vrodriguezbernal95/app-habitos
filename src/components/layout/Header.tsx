"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Sun, Moon, LogOut, X, Smartphone } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";

const PAGE_TITLES: Record<string, { title: string; sub?: string }> = {
  "/daily":    { title: "Hoy",      sub: undefined },
  "/habitos":  { title: "Hábitos",  sub: undefined },
  "/liga":     { title: "Liga",     sub: "Compite con tus amigos" },
  "/progreso": { title: "Progreso", sub: "Últimas 12 semanas" },
  "/crear":    { title: "Nuevo hábito" },
};

function usePageTitle() {
  const pathname = usePathname();
  if (pathname.startsWith("/editar")) return { title: "Editar hábito" };
  return PAGE_TITLES[pathname] ?? { title: "" };
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [hapticOn, setHapticOn] = useState(true);
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);
  const { title, sub } = usePageTitle();

  useEffect(() => {
    const stored = localStorage.getItem("setting_haptic");
    if (stored !== null) setHapticOn(stored === "true");
  }, []);

  const toggleHaptic = () => {
    const next = !hapticOn;
    setHapticOn(next);
    localStorage.setItem("setting_haptic", String(next));
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="sticky top-0 z-40 flex items-center justify-between px-4 md:px-8 py-3 bg-background/90 backdrop-blur-sm border-b border-border">
      {/* Title */}
      <div>
        <h1 className="font-heading text-lg font-semibold leading-tight">{title}</h1>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>

      {/* Burger */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-150",
            open ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
          aria-label="Opciones"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>

        {open && (
          <div className="absolute right-0 top-11 z-50 w-52 rounded-2xl border border-border bg-card shadow-xl overflow-hidden">
            {session?.user && (
              <div className="px-4 py-3 border-b border-border">
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? ""}
                    className="w-8 h-8 rounded-full mb-2"
                  />
                )}
                <p className="text-sm font-semibold text-foreground truncate">{session.user.name}</p>
                <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
              </div>
            )}

            <button
              onClick={() => { toggle(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors duration-150 cursor-pointer"
            >
              {theme === "dark" ? (
                <Sun size={16} className="text-muted-foreground" />
              ) : (
                <Moon size={16} className="text-muted-foreground" />
              )}
              <span>{theme === "dark" ? "Modo claro" : "Modo oscuro"}</span>
            </button>

            <button
              onClick={toggleHaptic}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted transition-colors duration-150 cursor-pointer"
            >
              <Smartphone size={16} className="text-muted-foreground" />
              <span className="flex-1 text-left">Vibración</span>
              <div className={cn(
                "relative w-9 h-5 rounded-full transition-colors duration-200 shrink-0",
                hapticOn ? "bg-primary" : "bg-muted-foreground/30"
              )}>
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200",
                  hapticOn ? "left-[calc(100%-1.125rem)]" : "left-0.5"
                )} />
              </div>
            </button>

            <div className="border-t border-border" />

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors duration-150 cursor-pointer"
            >
              <LogOut size={16} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
