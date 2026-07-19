import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { canAccessClient, minimizeClientForUser, requireUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";
import { grantClientAccessAction, revokeClientAccessAction } from "@/server/workflows/record-access";
import { updateClientOperationalNotesAction } from "@/server/workflows/clients";

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const user = await requireUser();
  const { clientId } = await params;
  const allowed = await canAccessClient(user, clientId);
  if (!allowed) redirect("/access-denied");

  const [client, users] = await Promise.all([
    getPrisma().client.findUnique({ where: { id: clientId }, include: { contacts: true, access: { include: { user: true } }, tasks: true } }),
    getPrisma().user.findMany({ where: { status: "Active" }, include: { role: true }, orderBy: { name: "asc" } })
  ]);
  if (!client) notFound();

  const visibleClient = minimizeClientForUser(user, client);

  return (
    <PageSection eyebrow="Client" title={visibleClient.company} description="Client details are minimized according to role and record access.">
      <div className="grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Operational notes</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleClient.operationalNotes ?? "No notes recorded."}</p>
          <form action={updateClientOperationalNotesAction} className="mt-4 space-y-3">
            <input type="hidden" name="clientId" value={visibleClient.id} />
            <textarea name="operationalNotes" required defaultValue={visibleClient.operationalNotes ?? ""} className="min-h-28 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <Button>Save operational update</Button>
          </form>
        </Card>
        <Card>
          <h3 className="font-semibold">Founder-only notes</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{visibleClient.founderOnlyNotes ?? "Restricted or empty."}</p>
        </Card>
      </div>
      {user.role === "Founder" ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Access Management</h3>
          <form action={grantClientAccessAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_160px_auto]">
            <input type="hidden" name="clientId" value={visibleClient.id} />
            <select name="userId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {users.filter((row) => row.role.name !== "Founder").map((row) => <option key={row.id} value={row.id}>{row.preferredName ?? row.name}</option>)}
            </select>
            <select name="access" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {["View", "Edit", "Manage"].map((level) => <option key={level} value={level}>{level}</option>)}
            </select>
            <Button variant="accent">Grant access</Button>
          </form>
          <div className="mt-4 space-y-2">
            {client.access.map((access) => (
              <form key={access.userId} action={revokeClientAccessAction} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm">
                <span>{access.user.preferredName ?? access.user.name}: {access.access}</span>
                <input type="hidden" name="clientId" value={visibleClient.id} />
                <input type="hidden" name="userId" value={access.userId} />
                <Button size="sm" variant="outline">Revoke</Button>
              </form>
            ))}
          </div>
        </Card>
      ) : null}
    </PageSection>
  );
}
