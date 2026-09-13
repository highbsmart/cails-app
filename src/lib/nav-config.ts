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
  // The permission the destination page actually enforces. If omitted, the
  // page is open to anyone signed in (their own leave, their own documents).
  // Keep these in step with the checks in the pages themselves — a menu entry
  // that leads to a lock screen is worse than no menu entry.
  requiresAnyPermission?: string[];
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", labelAr: "لوحة التحكم", icon: "dashboard" },
  {
    href: "/hr",
    label: "HR",
    labelAr: "الموارد البشرية",
    icon: "hr",
    requiresAnyPermission: ["VIEW_STAFF"],
  },
  { href: "/leave", label: "My Leave", labelAr: "الإجازات", icon: "leave" },
  {
    href: "/communication",
    label: "Communication",
    labelAr: "التواصل",
    icon: "communication",
    requiresAnyPermission: ["ISSUE_MEMO", "APPROVE_MEMO"],
  },
  {
    href: "/academic",
    label: "Academic",
    labelAr: "الشؤون الأكاديمية",
    icon: "academic",
    requiresAnyPermission: ["MANAGE_ACADEMIC_STRUCTURE", "VIEW_RESULTS"],
  },
  {
    href: "/staff",
    label: "Staff",
    labelAr: "الموظفون",
    icon: "staff",
    requiresAnyPermission: ["VIEW_STAFF"],
  },
  {
    href: "/students",
    label: "Students",
    labelAr: "الطلاب",
    icon: "students",
    requiresAnyPermission: ["VIEW_STAFF", "MANAGE_ACADEMIC_STRUCTURE"],
  },
  {
    href: "/examination",
    label: "Examination",
    labelAr: "الامتحانات",
    icon: "examination",
    requiresAnyPermission: ["VIEW_RESULTS", "ENTER_RESULTS", "APPROVE_RESULTS"],
  },
  { href: "/documents", label: "Documents", labelAr: "الوثائق", icon: "documents" },
  {
    href: "/meetings",
    label: "Meetings",
    labelAr: "الاجتماعات",
    icon: "meetings",
    requiresAnyPermission: ["MANAGE_MEETINGS"],
  },
  { href: "/tasks", label: "Tasks", labelAr: "المهام", icon: "tasks" },
  {
    href: "/accreditation",
    label: "Accreditation",
    labelAr: "الاعتماد",
    icon: "accreditation",
    requiresAnyPermission: ["VIEW_ACCREDITATION_VAULT", "EDIT_ACCREDITATION_VAULT"],
  },
  {
    href: "/reports",
    label: "Reports",
    labelAr: "التقارير",
    icon: "reports",
    requiresAnyPermission: ["VIEW_REPORTS"],
  },
  {
    href: "/settings",
    label: "Settings",
    labelAr: "الإعدادات",
    icon: "settings",
    requiresAnyPermission: ["MANAGE_USERS", "CONFIGURE_ORG_UNITS", "CONFIGURE_WORKFLOWS"],
  },
];

export function visibleNavItems(permissionCodes: string[]): NavItem[] {
  return NAV_ITEMS.filter(
    (item) =>
      !item.requiresAnyPermission ||
      item.requiresAnyPermission.some((p) => permissionCodes.includes(p))
  );
}
