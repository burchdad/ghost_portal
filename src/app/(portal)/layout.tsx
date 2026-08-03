import type { ReactNode } from "react";
import { requireUser } from "@/server/permissions/authorize";
import { PortalHeader } from "@/components/portal/layout/portal-header";
import { PortalSidebar } from "@/components/portal/layout/portal-sidebar";
import { getPrisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const unreadNotifications = await getPrisma().notification.count({ where: { userId: user.id, readAt: null } });

  return (
    <div className="grid min-h-screen grid-cols-1 text-foreground lg:grid-cols-[280px_minmax(0,1fr)]">
      <PortalSidebar user={user} />
      <main className="min-w-0 overflow-x-hidden">
        <PortalHeader user={user} unreadNotifications={unreadNotifications} />
        {children}
      </main>
    </div>
  );
}
