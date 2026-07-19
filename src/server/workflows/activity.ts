import { getPrisma } from "@/server/db/prisma";

export async function recordActivity(input: {
  actorId?: string | null;
  action: string;
  target: string;
  taskId?: string | null;
  projectId?: string | null;
}) {
  return getPrisma().activity.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      target: input.target,
      taskId: input.taskId ?? null,
      projectId: input.projectId ?? null
    }
  });
}
