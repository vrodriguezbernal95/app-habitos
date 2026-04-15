"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Sun, Moon, LogOut, X } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "@/components/layout/ThemeProvider";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const { data: session } = useSession();
  const menuRef = useRef<HTMLDivElement>(null);

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
    <div className="sticky top-0 z-40 flex items-center justify-end px-4 md:px-8 py-3 bg-background/80 backdrop-blur-sm border-b border-border">
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
            {/* User info */}
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

            {/* Theme toggle */}
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

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Sign out */}
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
