import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMissionControlClients, missionClientRouteId } from "@/server/data/mission-control-clients";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export default async function ClientsPage() {
  const user = await requireUser();
  const canReadAllClients = user.role === "Founder" || hasPermission(user, "clients:read:all");
  const missionControl = canReadAllClients ? await getMissionControlClients() : null;
  const localClients = missionControl?.ok
    ? []
    : await getPrisma().client.findMany({
    where:
      user.role === "Founder"
        ? { archivedAt: null }
        : {
            archivedAt: null,
            access: { some: { userId: user.id } }
      },
    orderBy: [{ riskStatus: "desc" }, { company: "asc" }]
  });
  const description = missionControl?.ok
    ? "Client records are read from Ghost Mission Control as the canonical client roster."
    : canReadAllClients
      ? "Mission Control clients are unavailable here, so this view is showing Ops Portal client records."
      : "Operations users only see Ops Portal clients explicitly assigned to them.";

  return (
    <PageSection eyebrow="CRM" title="Clients" description={description}>
      {missionControl && !missionControl.ok ? (
        <Card className="mb-5">
          <h3 className="font-semibold">Mission Control roster unavailable</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{missionControl.reason}</p>
        </Card>
      ) : null}
      <SimpleTable
        columns={missionControl?.ok ? ["Company", "Stage", "Services", "Website"] : ["Company", "Status", "Risk", "Next follow-up"]}
        empty="No clients are assigned to you yet."
        rows={missionControl?.ok ? missionControl.clients.map((client) => [
          <Link key="company" href={`/clients/${missionClientRouteId(client.id)}`} className="font-medium text-white hover:text-accent">
            {client.clientName}
          </Link>,
          <Badge key="stage">{client.stage}</Badge>,
          client.services.length ? client.services.join(", ") : "Not mapped",
          client.websiteUrl ? <a key="website" href={client.websiteUrl} className="text-accent" target="_blank" rel="noreferrer">{safeHostname(client.websiteUrl)}</a> : "Not set"
        ]) : localClients.map((client) => [
          <Link key="company" href={`/clients/${client.id}`} className="font-medium text-white hover:text-accent">
            {client.company}
          </Link>,
          client.status,
          <Badge key="risk">{client.riskStatus}</Badge>,
          client.nextFollowUp ? client.nextFollowUp.toISOString().slice(0, 10) : "Not set"
        ])}
      />
    </PageSection>
  );
}

function safeHostname(href: string) {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}
