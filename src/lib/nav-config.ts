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
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  labelAr: string;
  icon: typeof LayoutDashboard;
  requiresAnyRole?: string[]; // if omitted, visible to everyone signed in
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: LayoutDashboard },
  {
    href: "/hr",
    label: "HR",
    labelAr: "الموارد البشرية",
    icon: Users,
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "REGISTRAR", "DPREG_ESTABLISHMENT", "DPP", "HOD", "DEAN"],
  },
  { href: "/leave", label: "My Leave", labelAr: "الإجازات", icon: CalendarDays },
  { href: "/communication", label: "Communication", labelAr: "التواصل", icon: MessagesSquare },
  {
    href: "/academic",
    label: "Academic",
    labelAr: "الشؤون الأكاديمية",
    icon: GraduationCap,
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "DPA", "REGISTRAR", "DPREG_ACADEMIC", "DEAN", "HOD", "DIR_EXAMS"],
  },
  {
    href: "/staff",
    label: "Staff",
    labelAr: "الموظفون",
    icon: IdCard,
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "REGISTRAR", "DPREG_ESTABLISHMENT", "DPA", "DPP", "DEAN", "HOD"],
  },
  {
    href: "/students",
    label: "Students",
    labelAr: "الطلاب",
    icon: BookUser,
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "DPA", "DEAN", "HOD", "DIR_EXAMS"],
  },
  {
    href: "/examination",
    label: "Examination",
    labelAr: "الامتحانات",
    icon: FileCheck2,
    requiresAnyRole: ["SYSTEM_ADMIN", "DPA", "DIR_EXAMS", "DEAN", "HOD", "EXAMS_OFFICER", "ACADEMIC_STAFF"],
  },
  { href: "/documents", label: "Documents", labelAr: "الوثائق", icon: FolderOpen },
  { href: "/meetings", label: "Meetings", labelAr: "الاجتماعات", icon: CalendarClock },
  { href: "/reports", label: "Reports", labelAr: "التقارير", icon: BarChart3 },
  {
    href: "/settings",
    label: "Settings",
    labelAr: "الإعدادات",
    icon: Settings,
    requiresAnyRole: ["SYSTEM_ADMIN"],
  },
];

export function visibleNavItems(roleCodes: string[]): NavItem[] {
  return NAV_ITEMS.filter(
    (item) =>
      !item.requiresAnyRole ||
      item.requiresAnyRole.some((r) => roleCodes.includes(r))
  );
}
