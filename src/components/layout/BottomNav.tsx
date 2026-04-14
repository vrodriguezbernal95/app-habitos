"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, PlusCircle, BarChart2, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/layout/ThemeProvider";

const NAV_ITEMS = [
  { href: "/daily",   label: "Hoy",      Icon: CalendarCheck },
  { href: "/crear",   label: "Crear",    Icon: PlusCircle    },
  { href: "/progreso",label: "Progreso", Icon: BarChart2     },
];

export function BottomNav() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border safe-bottom">
      <div className="flex items-center justify-around px-2 pt-2 pb-3">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl cursor-pointer transition-all duration-150 tap-scale",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.75}
                className={cn("transition-all duration-150", active && "celebrate")}
              />
              <span className={cn("text-[11px] font-medium", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex flex-col items-center gap-1 px-5 py-1.5 rounded-xl cursor-pointer transition-all duration-150 tap-scale text-muted-foreground hover:text-foreground"
          aria-label={theme === "dark" ? "Activar modo claro" : "Activar modo oscuro"}
        >
          {theme === "dark" ? (
            <Sun size={22} strokeWidth={1.75} className="transition-all duration-150" />
          ) : (
            <Moon size={22} strokeWidth={1.75} className="transition-all duration-150" />
          )}
          <span className="text-[11px] font-medium">
            {theme === "dark" ? "Claro" : "Oscuro"}
          </span>
        </button>
      </div>
    </nav>
  );
}
