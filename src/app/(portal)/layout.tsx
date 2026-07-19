import type { ReactNode } from "react";
import { requireUser } from "@/server/permissions/authorize";
import { PortalHeader } from "@/components/portal/layout/portal-header";
import { PortalSidebar } from "@/components/portal/layout/portal-sidebar";
import { NovaDrawer } from "@/components/portal/layout/nova-drawer";
import { buildNovaSummary } from "@/server/data/dashboard";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const novaSummary = await buildNovaSummary(user);

  return (
    <div className="grid min-h-screen grid-cols-1 text-foreground lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_340px]">
      <PortalSidebar user={user} />
      <main className="min-w-0">
        <PortalHeader user={user} />
        {children}
      </main>
      <NovaDrawer user={user} summary={novaSummary} />
    </div>
  );
}
