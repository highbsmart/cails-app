// Icon references are looked up by NAME in the (client) Sidebar component,
// not imported/passed here as component functions - passing an actual
// component reference as a prop from a Server Component to a Client
// Component is not serializable and breaks the app. A string key is.
export type IconName =
  | "dashboard"
  | "hr"
  | "leave"
  | "communication"
  | "academic"
  | "staff"
  | "students"
  | "examination"
  | "documents"
  | "meetings"
  | "tasks"
  | "accreditation"
  | "reports"
  | "settings";

export type NavItem = {
  href: string;
  label: string;
  labelAr: string;
  icon: IconName;
  requiresAnyRole?: string[]; // if omitted, visible to everyone signed in
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: "dashboard" },
  {
    href: "/hr",
    label: "HR",
    labelAr: "الموارد البشرية",
    icon: "hr",
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "REGISTRAR", "DPREG_ESTABLISHMENT", "DPP", "HOD", "DEAN"],
  },
  { href: "/leave", label: "My Leave", labelAr: "الإجازات", icon: "leave" },
  { href: "/communication", label: "Communication", labelAr: "التواصل", icon: "communication" },
  {
    href: "/academic",
    label: "Academic",
    labelAr: "الشؤون الأكاديمية",
    icon: "academic",
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "DPA", "REGISTRAR", "DPREG_ACADEMIC", "DEAN", "HOD", "DIR_EXAMS"],
  },
  {
    href: "/staff",
    label: "Staff",
    labelAr: "الموظفون",
    icon: "staff",
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "REGISTRAR", "DPREG_ESTABLISHMENT", "DPA", "DPP", "DEAN", "HOD"],
  },
  {
    href: "/students",
    label: "Students",
    labelAr: "الطلاب",
    icon: "students",
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "DPA", "DEAN", "HOD", "DIR_EXAMS"],
  },
  {
    href: "/examination",
    label: "Examination",
    labelAr: "الامتحانات",
    icon: "examination",
    requiresAnyRole: ["SYSTEM_ADMIN", "DPA", "DIR_EXAMS", "DEAN", "HOD", "EXAMS_OFFICER", "ACADEMIC_STAFF"],
  },
  { href: "/documents", label: "Documents", labelAr: "الوثائق", icon: "documents" },
  { href: "/meetings", label: "Meetings", labelAr: "الاجتماعات", icon: "meetings" },
  { href: "/tasks", label: "Tasks", labelAr: "المهام", icon: "tasks" },
  {
    href: "/accreditation",
    label: "Accreditation",
    labelAr: "الاعتماد",
    icon: "accreditation",
    requiresAnyRole: ["SYSTEM_ADMIN", "PROVOST", "DPA", "DAPEQA"],
  },
  { href: "/reports", label: "Reports", labelAr: "التقارير", icon: "reports" },
  {
    href: "/settings",
    label: "Settings",
    labelAr: "الإعدادات",
    icon: "settings",
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
