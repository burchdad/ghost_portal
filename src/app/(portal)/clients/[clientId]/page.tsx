import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { canAccessClient, minimizeClientForUser, requireUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const user = await requireUser();
  const { clientId } = await params;
  const allowed = await canAccessClient(user, clientId);
  if (!allowed) redirect("/access-denied");

  const client = await getPrisma().client.findUnique({ where: { id: clientId }, include: { contacts: true } });
  if (!client) notFound();

  const visibleClient = minimizeClientForUser(user, client);

  return (
    <PageSection eyebrow="Client" title={visibleClient.company} description="Client details are minimized according to role and record access.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Operational notes</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleClient.operationalNotes ?? "No notes recorded."}</p>
        </Card>
        <Card>
          <h3 className="font-semibold">Founder-only notes</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleClient.founderOnlyNotes ?? "Restricted or empty."}</p>
        </Card>
      </div>
    </PageSection>
  );
}
