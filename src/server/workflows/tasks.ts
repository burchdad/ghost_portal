"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { canAccessClient, canAccessLead, canModifyTask, requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { createNotification } from "@/server/workflows/notifications";

const taskFormSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  ownerId: z.string().min(1),
  clientId: z.string().optional(),
  leadId: z.string().optional(),
  projectId: z.string().optional(),
  priority: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
  dueDate: z.coerce.date().optional(),
  approvalRequired: z.coerce.boolean().default(false),
  approverId: z.string().optional(),
  internalNotes: z.string().optional()
});

const statusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["Assigned", "InProgress", "WaitingOnStephen", "WaitingOnClient", "Completed", "Blocked"])
});

export async function createTaskAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "tasks:create")) throw new Error("Forbidden: tasks:create");

  const parsed = taskFormSchema.parse({
    title: formData.get("title"),
    description: stringOrUndefined(formData.get("description")),
    ownerId: formData.get("ownerId"),
    clientId: stringOrUndefined(formData.get("clientId")),
    leadId: stringOrUndefined(formData.get("leadId")),
    projectId: stringOrUndefined(formData.get("projectId")),
    priority: formData.get("priority") ?? "Medium",
    dueDate: stringOrUndefined(formData.get("dueDate")),
    approvalRequired: formData.get("approvalRequired") === "on",
    approverId: stringOrUndefined(formData.get("approverId")),
    internalNotes: stringOrUndefined(formData.get("internalNotes"))
  });

  const task = await getPrisma().$transaction(async (tx) => {
    const created = await tx.task.create({
      data: {
        title: parsed.title,
        description: parsed.description,
        ownerId: parsed.ownerId,
        clientId: parsed.clientId,
        leadId: parsed.leadId,
        projectId: parsed.projectId,
        priority: parsed.priority,
        dueDate: parsed.dueDate,
        approvalRequired: parsed.approvalRequired,
        approverId: parsed.approverId,
        internalNotes: parsed.internalNotes,
        createdById: user.id,
        status: "Assigned"
      }
    });

    await tx.activity.create({
      data: {
        actorId: user.id,
        action: "created task",
        target: created.title,
        taskId: created.id
      }
    });

    return created;
  });

  await Promise.all([
    createNotification({
      userId: parsed.ownerId,
      title: "Task assigned",
      body: task.title,
      href: `/tasks/${task.id}`
    }),
    writeAuditLog({
      userId: user.id,
      action: "task.created",
      entity: "Task",
      entityId: task.id,
      after: { title: task.title, ownerId: task.ownerId, clientId: task.clientId, leadId: task.leadId }
    })
  ]);

  revalidatePath("/tasks");
  redirect(`/tasks/${task.id}`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireUser();
  const parsed = statusSchema.parse({
    taskId: formData.get("taskId"),
    status: formData.get("status")
  });

  const task = await getPrisma().task.findUnique({ where: { id: parsed.taskId } });
  if (!task || !canModifyTask(user, task)) throw new Error("Forbidden: task");

  const updated = await getPrisma().task.update({
    where: { id: task.id },
    data: {
      status: parsed.status,
      completedAt: parsed.status === "Completed" ? new Date() : null,
      activity: {
        create: {
          actorId: user.id,
          action: "updated task status",
          target: parsed.status
        }
      }
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: "task.status_updated",
    entity: "Task",
    entityId: task.id,
    before: { status: task.status },
    after: { status: updated.status }
  });

  revalidatePath(`/tasks/${task.id}`);
}

export async function addTaskCommentAction(formData: FormData) {
  const user = await requireUser();
  const taskId = z.string().min(1).parse(formData.get("taskId"));
  const body = z.string().min(1).parse(formData.get("body"));
  const task = await getPrisma().task.findUnique({ where: { id: taskId } });

  if (!task || (user.role !== "Founder" && task.ownerId !== user.id)) throw new Error("Forbidden: task");

  const comment = await getPrisma().comment.create({
    data: {
      taskId,
      authorId: user.id,
      body
    }
  });

  await writeAuditLog({
    userId: user.id,
    action: "task.comment_created",
    entity: "Task",
    entityId: taskId,
    after: { commentId: comment.id }
  });

  revalidatePath(`/tasks/${taskId}`);
}

export async function archiveTaskAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "tasks:manage")) throw new Error("Forbidden: tasks:manage");
  const taskId = z.string().min(1).parse(formData.get("taskId"));

  await getPrisma().task.update({ where: { id: taskId }, data: { archivedAt: new Date() } });
  await writeAuditLog({ userId: user.id, action: "task.archived", entity: "Task", entityId: taskId });
  revalidatePath("/tasks");
}

export async function restoreTaskAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "tasks:manage")) throw new Error("Forbidden: tasks:manage");
  const taskId = z.string().min(1).parse(formData.get("taskId"));

  await getPrisma().task.update({ where: { id: taskId }, data: { archivedAt: null } });
  await writeAuditLog({ userId: user.id, action: "task.restored", entity: "Task", entityId: taskId });
  revalidatePath("/tasks");
}

export async function validateTaskRelatedAccessForUser(userId: string, clientId?: string | null, leadId?: string | null) {
  const user = await getPrisma().user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!user) return false;
  const authUser = { id: user.id, name: user.name, email: user.email, role: user.role.name };
  if (clientId && !(await canAccessClient(authUser, clientId))) return false;
  if (leadId && !(await canAccessLead(authUser, leadId))) return false;
  return true;
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() ? value.trim() : undefined;
}
