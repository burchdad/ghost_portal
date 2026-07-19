import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { canModifyTask, requireUser } from "@/server/permissions/authorize";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const user = await requireUser();
  const { taskId } = await params;
  const task = await getPrisma().task.findUnique({ where: { id: taskId }, include: { owner: true, comments: { include: { author: true } } } });

  if (!task) notFound();
  if (user.role !== "Founder" && task.ownerId !== user.id) redirect("/access-denied");

  return (
    <PageSection eyebrow="Task" title={task.title} description={task.description ?? "No description recorded."}>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <h3 className="font-semibold">Operational Notes</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{task.internalNotes ?? "No internal notes."}</p>
        </Card>
        <Card>
          <p className="text-sm text-white/48">Status</p>
          <p className="mt-2 text-lg font-semibold">{task.status}</p>
          <p className="mt-5 text-sm text-white/48">Can modify</p>
          <p className="mt-2 text-lg font-semibold">{canModifyTask(user, task) ? "Yes" : "No"}</p>
        </Card>
      </div>
    </PageSection>
  );
}
