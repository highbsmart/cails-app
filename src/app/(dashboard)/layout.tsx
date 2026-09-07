import { redirect } from "next/navigation";
import { getCurrentUserContext } from "@/lib/auth";
import { visibleNavItems } from "@/lib/nav-config";
import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { LanguageProvider } from "@/lib/language-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUserContext();

  // Middleware already redirects unauthenticated requests to /login,
  // but this is the second, independent check for defense in depth.
  if (!user) redirect("/login");

  const items = visibleNavItems(user.roleCodes);

  return (
    <LanguageProvider>
      <div className="flex min-h-screen">
        <Sidebar items={items} />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header user={user} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </LanguageProvider>
  );
}
