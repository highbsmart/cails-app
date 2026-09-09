"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessagesSquare,
  GraduationCap,
  IdCard,
  BookUser,
  FileCheck2,
  FolderOpen,
  CalendarClock,
  BarChart3,
  Settings,
  CalendarDays,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import type { NavItem, IconName } from "@/lib/nav-config";

// Icons are resolved HERE, client-side, by name - never received as a
// component/function prop from a Server Component (see nav-config.ts).
const ICONS: Record<IconName, LucideIcon> = {
  dashboard: LayoutDashboard,
  hr: Users,
  leave: CalendarDays,
  communication: MessagesSquare,
  academic: GraduationCap,
  staff: IdCard,
  students: BookUser,
  examination: FileCheck2,
  documents: FolderOpen,
  meetings: CalendarClock,
  tasks: ListChecks,
  reports: BarChart3,
  settings: Settings,
};

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const { language } = useLanguage();

  return (
    <aside className="hidden w-64 shrink-0 border-e border-[var(--color-line)] bg-[var(--color-surface)] md:block">
      <div className="flex h-16 items-center gap-2 border-b border-[var(--color-line)] px-5">
        <Image
          src="/cails-logo.jpg"
          alt="CAILS crest"
          width={36}
          height={36}
          className="h-9 w-9 shrink-0 rounded-full object-cover"
        />
        <div className="leading-tight">
          <p className="font-serif text-[15px] font-medium text-[var(--color-green-deep)]">
            CAILS
          </p>
          <p className="text-[11px] text-[var(--color-ink-soft)]">Ilorin, Kwara State</p>
        </div>
      </div>

      <nav className="flex flex-col gap-0.5 p-3">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = ICONS[item.icon];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-sm border-s-2 px-3 py-2 text-sm transition-colors ${
                active
                  ? "border-[var(--color-brass)] bg-[var(--color-paper)] font-medium text-[var(--color-green-deep)]"
                  : "border-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-paper)]"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span>{language === "ar" ? item.labelAr : item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
