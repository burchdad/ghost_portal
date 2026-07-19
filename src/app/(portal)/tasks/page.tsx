import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { createTaskAction } from "@/server/workflows/tasks";

export default async function TasksPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; priority?: string; q?: string }>;
}) {
  const user = await requireUser();
  const filters = await searchParams;
  const canCreate = hasPermission(user, "tasks:create");
  const [tasks, users, clients, leads, projects] = await Promise.all([
    getPrisma().task.findMany({
      where: {
        ...(user.role === "Founder" ? { archivedAt: null } : { ownerId: user.id, archivedAt: null }),
        ...(filters.status ? { status: filters.status as never } : {}),
        ...(filters.priority ? { priority: filters.priority as never } : {}),
        ...(filters.q
          ? {
              title: {
                contains: filters.q,
                mode: "insensitive"
              }
            }
          : {})
      },
      include: { owner: true, client: true, lead: true },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      take: 50
    }),
    getPrisma().user.findMany({ where: { status: "Active" }, include: { role: true }, orderBy: { name: "asc" } }),
    getPrisma().client.findMany({ where: { archivedAt: null }, orderBy: { company: "asc" } }),
    getPrisma().lead.findMany({ where: { archivedAt: null }, orderBy: { company: "asc" } }),
    getPrisma().project.findMany({ where: { archivedAt: null }, orderBy: { name: "asc" } })
  ]);

  return (
    <PageSection eyebrow="Execution" title="My Tasks" description="Assigned operational work with server-side role and owner scoping.">
      <form className="mb-5 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_160px_160px_auto]">
        <input name="q" defaultValue={filters.q} placeholder="Search tasks" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none focus:border-accent" />
        <select name="status" defaultValue={filters.status ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
          <option value="">All statuses</option>
          {["Assigned", "InProgress", "WaitingOnStephen", "WaitingOnClient", "Completed", "Blocked"].map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <select name="priority" defaultValue={filters.priority ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
          <option value="">All priorities</option>
          {["Low", "Medium", "High", "Urgent"].map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
        <Button variant="outline">Filter</Button>
      </form>

      {canCreate ? (
        <Card className="mb-5">
          <h3 className="mb-4 text-lg font-semibold">Create and Assign Task</h3>
          <form action={createTaskAction} className="grid gap-3 lg:grid-cols-2">
            <input name="title" placeholder="Task title" required className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <select name="ownerId" required className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="">Assign owner</option>
              {users.map((row) => (
                <option key={row.id} value={row.id}>{row.preferredName ?? row.name} ({row.role.name})</option>
              ))}
            </select>
            <textarea name="description" placeholder="Description" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
            <select name="clientId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="">Related client</option>
              {clients.map((client) => <option key={client.id} value={client.id}>{client.company}</option>)}
            </select>
            <select name="leadId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="">Related lead</option>
              {leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.company}</option>)}
            </select>
            <select name="projectId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="">Related project</option>
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
            </select>
            <select name="priority" defaultValue="Medium" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {["Low", "Medium", "High", "Urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            <input name="dueDate" type="datetime-local" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <select name="approverId" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="">Approver</option>
              {users.filter((row) => row.role.name === "Founder").map((row) => <option key={row.id} value={row.id}>{row.name}</option>)}
            </select>
            <label className="flex h-10 items-center gap-2 text-sm text-white/64">
              <input name="approvalRequired" type="checkbox" /> Approval required
            </label>
            <textarea name="internalNotes" placeholder="Internal notes" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
            <Button className="lg:col-span-2" variant="accent">Create task</Button>
          </form>
        </Card>
      ) : null}

      <SimpleTable
        columns={["Task", "Status", "Priority", "Context"]}
        empty="No tasks match your current access."
        rows={tasks.map((task) => [
          <Link key="title" href={`/tasks/${task.id}`} className="font-medium text-white hover:text-accent">
            {task.title}
          </Link>,
          <Badge key="status">{task.status}</Badge>,
          task.priority,
          task.client?.company ?? task.lead?.company ?? "Internal"
        ])}
      />
    </PageSection>
  );
}
