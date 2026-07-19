import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function ClientsPage() {
  const user = await requireUser();
  const clients = await getPrisma().client.findMany({
    where:
      user.role === "Founder"
        ? { archivedAt: null }
        : {
            archivedAt: null,
            access: { some: { userId: user.id } }
          },
    orderBy: [{ riskStatus: "desc" }, { company: "asc" }]
  });

  return (
    <PageSection eyebrow="CRM" title="Clients" description="Operations users only see clients explicitly assigned to them.">
      <SimpleTable
        columns={["Company", "Status", "Risk", "Next follow-up"]}
        empty="No clients are assigned to you yet."
        rows={clients.map((client) => [
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
