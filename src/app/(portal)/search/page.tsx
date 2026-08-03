import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMissionControlClients, getMissionControlTools, missionClientRouteId } from "@/server/data/mission-control-clients";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await requireUser();
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const canReadAllClients = user.role === "Founder" || hasPermission(user, "clients:read:all");
  const canReadAssignedClients = hasPermission(user, "clients:read:assigned");
  const canReadAssignedLeads = hasPermission(user, "leads:read:assigned");

  const empty = query.length < 2;
  const [tasks, leads, localClients, sops, knowledge, missionClients, missionTools] = empty
    ? [[], [], [], [], [], null, null] as const
    : await Promise.all([
        getPrisma().task.findMany({
          where: {
            ...(user.role === "Founder" ? { archivedAt: null } : { ownerId: user.id, archivedAt: null }),
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } }
            ]
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 8
        }),
        canReadAssignedLeads
          ? getPrisma().lead.findMany({
              where: {
                ...leadAccessWhere(user.id, user.role),
                OR: [
                  { company: { contains: query, mode: "insensitive" } },
                  { contactName: { contains: query, mode: "insensitive" } },
                  { contactEmail: { contains: query, mode: "insensitive" } },
                  { contactPhone: { contains: query, mode: "insensitive" } }
                ]
              },
              orderBy: [{ updatedAt: "desc" }],
              take: 8
            })
          : [],
        canReadAssignedClients
          ? getPrisma().client.findMany({
              where: {
                ...clientAccessWhere(user.id, user.role, canReadAllClients),
                company: { contains: query, mode: "insensitive" }
              },
              orderBy: [{ updatedAt: "desc" }],
              take: 8
            })
          : [],
        getPrisma().sOPArticle.findMany({
          where: {
            archivedAt: null,
            ...(user.role === "Founder" ? {} : { published: true, audienceRoles: { has: user.role } }),
            title: { contains: query, mode: "insensitive" }
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 8
        }),
        getPrisma().knowledgeArticle.findMany({
          where: {
            archivedAt: null,
            ...(user.role === "Founder" ? {} : { status: "Published", visibleToRoles: { has: user.role } }),
            title: { contains: query, mode: "insensitive" }
          },
          orderBy: [{ updatedAt: "desc" }],
          take: 8
        }),
        canReadAllClients ? getMissionControlClients() : null,
        canReadAllClients ? getMissionControlTools() : null
      ]);

  const missionClientMatches = missionClients?.ok ? missionClients.clients.filter((client) => matchesMissionRecord(client, query)).slice(0, 8) : [];
  const missionToolMatches = missionTools?.ok ? missionTools.clients.filter((tool) => matchesMissionRecord(tool, query)).slice(0, 8) : [];

  return (
    <PageSection eyebrow="Find" title="Search" description="Search across your permission-scoped Ops Portal records and Mission Control roster.">
      <form className="mb-5 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input name="q" defaultValue={query} placeholder="Search clients, leads, tasks, SOPs..." className="h-11 rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none focus:border-accent" />
        <button className="h-11 rounded-lg border border-white/10 px-4 text-sm font-medium hover:bg-white/10">Search</button>
      </form>

      {empty ? (
        <Card>
          <p className="text-sm text-white/58">Enter at least two characters to search.</p>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          <ResultGroup title="Leads" items={leads.map((lead) => ({ href: `/leads/${lead.id}`, label: lead.company, meta: lead.contactName ?? lead.contactEmail ?? lead.contactPhone ?? "No contact", badge: lead.stage }))} />
          <ResultGroup title="Tasks" items={tasks.map((task) => ({ href: `/tasks/${task.id}`, label: task.title, meta: task.description ?? "No description", badge: task.priority }))} />
          <ResultGroup title="Clients" items={[
            ...localClients.map((client) => ({ href: `/clients/${client.id}`, label: client.company, meta: client.operationalNotes ?? "Ops Portal client", badge: client.status })),
            ...missionClientMatches.map((client) => ({ href: `/clients/${missionClientRouteId(client.id)}`, label: client.clientName, meta: client.websiteUrl || "Mission Control client", badge: client.stage }))
          ]} />
          <ResultGroup title="Tools" items={missionToolMatches.map((tool) => ({ href: "/tools", label: tool.clientName, meta: tool.websiteUrl || "Internal Ghost tool", badge: tool.stage }))} />
          <ResultGroup title="SOPs" items={sops.map((sop) => ({ href: `/sops/${sop.id}`, label: sop.title, meta: sop.purpose, badge: sop.category }))} />
          <ResultGroup title="Knowledge" items={knowledge.map((article) => ({ href: `/knowledge/${article.id}`, label: article.title, meta: article.category, badge: article.status }))} />
        </div>
      )}
    </PageSection>
  );
}

function ResultGroup({ title, items }: { title: string; items: Array<{ href: string; label: string; meta: string; badge: string }> }) {
  return (
    <Card>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="font-semibold">{title}</h3>
        <Badge>{items.length}</Badge>
      </div>
      <div className="space-y-2">
        {items.length ? items.map((item) => (
          <Link key={`${item.href}-${item.label}`} href={item.href} className="block rounded-lg border border-white/10 bg-white/[0.035] p-3 transition hover:bg-white/[0.065]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{item.label}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/48">{item.meta}</p>
              </div>
              <Badge className="h-6 shrink-0 px-2">{item.badge}</Badge>
            </div>
          </Link>
        )) : <p className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-white/48">No matches.</p>}
      </div>
    </Card>
  );
}

function leadAccessWhere(userId: string, role: string): Prisma.LeadWhereInput {
  return role === "Founder" ? { archivedAt: null } : { archivedAt: null, access: { some: { userId } } };
}

function clientAccessWhere(userId: string, role: string, canReadAllClients: boolean): Prisma.ClientWhereInput {
  return role === "Founder" || canReadAllClients ? { archivedAt: null } : { archivedAt: null, access: { some: { userId } } };
}

function matchesMissionRecord(record: { clientName: string; websiteUrl: string; services: string[] }, query: string) {
  const normalized = query.toLowerCase();
  return [record.clientName, record.websiteUrl, ...record.services].some((value) => value.toLowerCase().includes(normalized));
}
