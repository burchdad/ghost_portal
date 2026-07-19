import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { createClientAction } from "@/server/workflows/clients";

export default async function ClientsPage() {
  const user = await requireUser();
  const canCreate = hasPermission(user, "clients:manage");
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
      {canCreate ? (
        <Card className="mb-5">
          <h3 className="mb-4 text-lg font-semibold">Create Client</h3>
          <form action={createClientAction} className="grid gap-3 lg:grid-cols-2">
            <input name="company" required placeholder="Company name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="services" placeholder="Services, comma separated" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <select name="riskStatus" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {["Low", "Medium", "High"].map((risk) => <option key={risk} value={risk}>{risk}</option>)}
            </select>
            <textarea name="operationalNotes" placeholder="Operational notes" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
            <textarea name="founderOnlyNotes" placeholder="Founder-only notes" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
            <Button variant="accent" className="lg:col-span-2">Create client</Button>
          </form>
        </Card>
      ) : null}
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
