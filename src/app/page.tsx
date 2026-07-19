import { PortalShell } from "@/components/portal/portal-shell";
import { getDashboardSnapshot } from "@/server/data/dashboard";
import { getCurrentUser } from "@/server/auth/session";

export default async function Home() {
  const user = await getCurrentUser();
  const snapshot = await getDashboardSnapshot(user);

  return <PortalShell user={user} snapshot={snapshot} />;
}
