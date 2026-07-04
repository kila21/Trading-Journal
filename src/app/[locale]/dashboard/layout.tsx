import { headers } from "next/headers";
import type { ReactNode } from "react";
import { redirect } from "@/i18n/navigation";
import { Sidebar } from "@/components/dashboard/sidebar";
import { auth } from "@/lib/auth";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return redirect({ href: "/login", locale });
  }

  return (
    <div className="flex flex-1">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
