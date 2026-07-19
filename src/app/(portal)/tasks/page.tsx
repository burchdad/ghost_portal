import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function TasksPage() {
  const user = await requireUser();
  const tasks = await getPrisma().task.findMany({
    where: user.role === "Founder" ? { archivedAt: null } : { ownerId: user.id, archivedAt: null },
    include: { owner: true, client: true },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }]
  });

  return (
    <PageSection eyebrow="Execution" title="My Tasks" description="Assigned operational work with server-side role and owner scoping.">
      <SimpleTable
        columns={["Task", "Status", "Priority", "Client"]}
        empty="No tasks match your current access."
        rows={tasks.map((task) => [
          <Link key="title" href={`/tasks/${task.id}`} className="font-medium text-white hover:text-accent">
            {task.title}
          </Link>,
          <Badge key="status">{task.status}</Badge>,
          task.priority,
          task.client?.company ?? "Internal"
        ])}
      />
    </PageSection>
  );
}
