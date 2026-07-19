import type { Prisma, User } from "@prisma/client";
import { getPrisma } from "@/server/db/prisma";

type AuditInput = {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: Prisma.InputJsonValue;
  after?: Prisma.InputJsonValue;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export async function writeAuditLog(input: AuditInput) {
  const prisma = getPrisma();

  return prisma.auditLog.create({
    data: {
      userId: input.userId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      before: input.before ?? undefined,
      after: input.after ?? undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null
    }
  });
}

export function publicUserSnapshot(user: Pick<User, "id" | "email" | "name" | "status">) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status
  };
}
