import { notFound, redirect } from "next/navigation";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/portal/date-time-controls";
import { TaskStatusForm } from "@/components/portal/task-status-form";
import { getPrisma } from "@/server/db/prisma";
import { canModifyTask, requireUser } from "@/server/permissions/authorize";
import { createApprovalRequestAction } from "@/server/workflows/approvals";
import { addTaskCommentAction, archiveTaskAction, restoreTaskAction, updateTaskStatusAction } from "@/server/workflows/tasks";
import { createLocalFileMetadataAction } from "@/server/workflows/files";
import { formatTaskActivityTarget, formatTaskStatus, type TaskStatusValue } from "@/lib/task-status";

export default async function TaskDetailPage({ params }: { params: Promise<{ taskId: string }> }) {
  const user = await requireUser();
  const { taskId } = await params;
  const task = await getPrisma().task.findUnique({
    where: { id: taskId },
    include: {
      owner: true,
      client: true,
      lead: true,
      approvals: { where: { status: { in: ["Open", "InReview"] } }, select: { id: true } },
      comments: { include: { author: true }, orderBy: { createdAt: "asc" } },
      activity: { include: { actor: true }, orderBy: { createdAt: "desc" } }
    }
  });

  if (!task) notFound();
  if (user.role !== "Founder" && task.ownerId !== user.id) redirect("/access-denied");

  return (
    <PageSection eyebrow="Task" title={task.title} description={task.description ?? "No description recorded."}>
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card>
          <h3 className="font-semibold">Operational Notes</h3>
          <p className="mt-3 text-sm leading-6 text-white/58">{task.internalNotes ?? "No internal notes."}</p>
          <div className="mt-5 flex flex-wrap gap-3 text-sm">
            {task.client ? <a className="text-accent" href={`/clients/${task.client.id}`}>{task.client.company}</a> : null}
            {task.lead ? <a className="text-accent" href={`/leads/${task.lead.id}`}>{task.lead.company}</a> : null}
          </div>
        </Card>
        <Card>
          <p className="text-sm text-white/48">Status</p>
          <p className="mt-2 text-lg font-semibold">{formatTaskStatus(task.status)}</p>
          <p className="mt-5 text-sm text-white/48">Can modify</p>
          <p className="mt-2 text-lg font-semibold">{canModifyTask(user, task) ? "Yes" : "No"}</p>
          {canModifyTask(user, task) ? (
            <TaskStatusForm taskId={task.id} currentStatus={task.status as TaskStatusValue} unresolvedApprovalCount={task.approvals.length} action={updateTaskStatusAction} />
          ) : null}
          {user.role === "Founder" ? (
            <form action={task.archivedAt ? restoreTaskAction : archiveTaskAction} className="mt-3">
              <input type="hidden" name="taskId" value={task.id} />
              <Button className="w-full" variant="outline">{task.archivedAt ? "Restore task" : "Archive task"}</Button>
            </form>
          ) : null}
        </Card>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="font-semibold">Comments</h3>
          <div className="mt-4 space-y-3">
            {task.comments.map((comment) => (
              <div key={comment.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
                <p className="text-sm text-white/58">{comment.body}</p>
                <p className="mt-2 text-xs text-white/38">{comment.author.preferredName ?? comment.author.name}</p>
              </div>
            ))}
          </div>
          <form action={addTaskCommentAction} className="mt-4 space-y-3">
            <input type="hidden" name="taskId" value={task.id} />
            <textarea name="body" required placeholder="Add a comment or work note" className="min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <Button>Add comment</Button>
          </form>
        </Card>

        <Card>
          <h3 className="font-semibold">Request Stephen Approval</h3>
          <form action={createApprovalRequestAction} className="mt-4 space-y-3">
            <input type="hidden" name="taskId" value={task.id} />
            {task.clientId ? <input type="hidden" name="clientId" value={task.clientId} /> : null}
            {task.leadId ? <input type="hidden" name="leadId" value={task.leadId} /> : null}
            <input name="summary" required placeholder="What needs approval?" className="h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <textarea name="context" required placeholder="Context" className="min-h-20 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="businessImpact" required placeholder="Business impact" className="min-h-20 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="recommendation" required placeholder="Recommendation" className="min-h-20 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <DateTimePicker name="deadline" label="Approval deadline" helper="Optional deadline for Stephen's decision." timezone={user.timezone} optional />
            <select name="priority" defaultValue="Medium" className="h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {["Low", "Medium", "High", "Urgent"].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
            </select>
            <Button variant="accent">Create request</Button>
          </form>
        </Card>
      </div>

      <Card className="mt-5">
        <h3 className="font-semibold">Supporting Attachment Metadata</h3>
        <form action={createLocalFileMetadataAction} className="mt-4 grid gap-3 md:grid-cols-4">
          <input type="hidden" name="taskId" value={task.id} />
          <input name="name" required placeholder="filename.pdf" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <select name="mimeType" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            <option value="application/pdf">PDF</option>
            <option value="image/png">PNG</option>
            <option value="image/jpeg">JPEG</option>
            <option value="text/plain">Text</option>
          </select>
          <input name="size" type="number" min="1" max="10485760" required placeholder="Bytes" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
          <Button variant="outline">Attach metadata</Button>
        </form>
      </Card>

      <Card className="mt-5">
        <h3 className="font-semibold">Activity Timeline</h3>
        <div className="mt-4 space-y-3">
          {task.activity.map((event) => (
            <p key={event.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-white/58">
              {(event.actor?.preferredName ?? event.actor?.name ?? "System")} {event.action}: {formatTaskActivityTarget(event.target)}
            </p>
          ))}
        </div>
      </Card>
    </PageSection>
  );
}
