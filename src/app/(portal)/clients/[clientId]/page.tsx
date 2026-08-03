import type React from "react";
import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMissionControlClientById, parseMissionClientRouteId } from "@/server/data/mission-control-clients";
import { canAccessClient, minimizeClientForUser, requireUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";
import { hasPermission } from "@/server/permissions/roles";
import { grantClientAccessAction, revokeClientAccessAction } from "@/server/workflows/record-access";
import { updateClientOperationalNotesAction } from "@/server/workflows/clients";

export default async function ClientDetailPage({ params }: { params: Promise<{ clientId: string }> }) {
  const user = await requireUser();
  const { clientId } = await params;
  const missionClientId = parseMissionClientRouteId(clientId);
  if (missionClientId) {
    if (!(user.role === "Founder" || hasPermission(user, "clients:read:all"))) redirect("/access-denied");
    const result = await getMissionControlClientById(missionClientId);
    if (!result.client) notFound();

    const client = result.client;
    return (
      <PageSection eyebrow="Mission Control Client" title={client.clientName} description="This record is read directly from Ghost Mission Control. Ops Portal-specific notes and access rules stay separate.">
        <div className="mb-5 grid gap-3 md:grid-cols-4">
          <StatusCard label="Stage" value={client.stage} />
          <StatusCard label="Relationship" value={client.relationshipType || "Not set"} />
          <StatusCard label="Services" value={String(client.services.length || client.plannedServices.length)} />
          <StatusCard label="Systems" value={systemCount(client)} />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <h3 className="font-semibold">Client profile</h3>
            <div className="mt-4 grid gap-3 text-sm text-white/64">
              <Info label="Stage" value={client.stage} />
              <Info label="Relationship" value={client.relationshipType || "Not set"} />
              <Info label="Pricing tier" value={client.pricingTier || "Not set"} />
              <Info label="Plan" value={client.plan || "Not set"} />
              <Info label="Contact" value={client.contact || "Not set"} />
              <Info label="Email" value={client.businessEmail || "Not set"} />
              <Info label="Phone" value={client.businessPhone || "Not set"} />
            </div>
          </Card>
          <Card>
            <h3 className="font-semibold">Systems</h3>
            <div className="mt-4 grid gap-3 text-sm text-white/64">
              <Info label="Website" value={client.websiteUrl ? <ExternalLink href={client.websiteUrl} /> : "Not set"} />
              <Info label="Repo" value={client.repo || client.githubUrl || "Not set"} />
              <Info label="Vercel" value={client.vercelUrl ? <ExternalLink href={client.vercelUrl} /> : "Not set"} />
              <Info label="Railway" value={client.railwayUrl ? <ExternalLink href={client.railwayUrl} /> : "Not set"} />
              <Info label="Support" value={client.supportUrl ? <ExternalLink href={client.supportUrl} label="Mission Control support link" /> : "Not set"} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {client.websiteUrl ? <Button asChild size="sm" variant="accent"><a href={client.websiteUrl} target="_blank" rel="noreferrer">Open website</a></Button> : null}
              {client.githubUrl ? <Button asChild size="sm" variant="outline"><a href={client.githubUrl} target="_blank" rel="noreferrer">Open repo</a></Button> : null}
              {client.supportUrl ? <Button asChild size="sm" variant="outline"><a href={client.supportUrl} target="_blank" rel="noreferrer">Support</a></Button> : null}
            </div>
          </Card>
        </div>
        <Card className="mt-5">
          <h3 className="font-semibold">Services</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {client.services.length ? client.services.map((service) => <Badge key={service}>{service}</Badge>) : <p className="text-sm text-white/58">No active services mapped.</p>}
          </div>
          {client.plannedServices.length ? (
            <>
              <h4 className="mt-5 text-sm font-semibold text-white/72">Planned</h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {client.plannedServices.map((service) => <Badge key={service}>{service}</Badge>)}
              </div>
            </>
          ) : null}
        </Card>
        <Card className="mt-5">
          <h3 className="font-semibold">Mission Control notes</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{client.notes || "No notes recorded in Mission Control."}</p>
          {client.actions.length ? (
            <div className="mt-5 space-y-2">
              {client.actions.slice(0, 6).map((action) => <p key={action} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-white/68">{action}</p>)}
            </div>
          ) : null}
        </Card>
      </PageSection>
    );
  }

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
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <StatusCard label="Status" value={visibleClient.status} />
        <StatusCard label="Risk" value={visibleClient.riskStatus} />
        <StatusCard label="Contacts" value={String(client.contacts.length)} />
        <StatusCard label="Open tasks" value={String(client.tasks.filter((task) => !task.archivedAt).length)} />
      </div>
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

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <p className="text-xs text-white/42">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </Card>
  );
}

function systemCount(client: { websiteUrl: string; repo: string; githubUrl: string; railwayUrl: string; vercelUrl: string; supportUrl: string }) {
  return String([client.websiteUrl, client.repo || client.githubUrl, client.railwayUrl, client.vercelUrl, client.supportUrl].filter(Boolean).length);
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.16em] text-white/38">{label}</p>
      <div className="mt-1 text-white/72">{value}</div>
    </div>
  );
}

function ExternalLink({ href, label }: { href: string; label?: string }) {
  return (
    <a href={href} className="text-accent" target="_blank" rel="noreferrer">
      {label ?? safeHostname(href)}
    </a>
  );
}

function safeHostname(href: string) {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}
