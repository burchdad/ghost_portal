import { DashboardPage } from "@/components/portal/dashboard/dashboard-page";
import { getDashboardSnapshot } from "@/server/data/dashboard";
import { requireUser } from "@/server/permissions/authorize";

export default async function DashboardRoute() {
  const user = await requireUser();
  const snapshot = await getDashboardSnapshot(user);

  return <DashboardPage user={user} snapshot={snapshot} />;
}
