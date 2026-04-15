"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarCheck, ListChecks, Trophy, BarChart2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/daily",    label: "Hoy",      Icon: CalendarCheck },
  { href: "/habitos",  label: "Hábitos",  Icon: ListChecks    },
  { href: "/progreso", label: "Progreso", Icon: BarChart2     },
  { href: "/liga",     label: "Liga",     Icon: Trophy        },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 min-h-screen border-r border-border bg-sidebar sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center">
            <Sparkles size={16} className="text-primary-foreground" />
          </div>
          <span className="font-heading font-semibold text-base text-foreground">Hábitos</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 cursor-pointer",
                active
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.75} />
              <span className="text-sm">{label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
