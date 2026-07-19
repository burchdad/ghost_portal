import type { AccessLevel, Client, Lead, Task, UserStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth/session";
import { getPrisma } from "@/server/db/prisma";
import { hasPermission, type AuthzUser, type Permission, type Role } from "@/server/permissions/roles";

const accessRank: Record<AccessLevel, number> = {
  View: 1,
  Edit: 2,
  Manage: 3
};

export type SessionUser = AuthzUser & {
  preferredName: string | null;
  status: UserStatus;
  timezone: string;
};

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.status !== "Active") {
    redirect("/login?reason=suspended");
  }

  return user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role && user.role !== "Founder") {
    redirect("/access-denied");
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();
  if (!can(user, permission)) {
    redirect("/access-denied");
  }

  return user;
}

export function can(user: Pick<AuthzUser, "role">, permission: Permission) {
  return hasPermission(user as AuthzUser, permission);
}

export function isFounder(user: Pick<AuthzUser, "role">) {
  return user.role === "Founder";
}

export async function canAccessClient(user: AuthzUser, clientId: string, level: AccessLevel = "View") {
  if (isFounder(user) || hasPermission(user, "clients:read:all")) return true;
  if (!hasPermission(user, "clients:read:assigned")) return false;

  const access = await getPrisma().clientAccess.findUnique({
    where: {
      userId_clientId: {
        userId: user.id,
        clientId
      }
    }
  });

  return Boolean(access && accessRank[access.access] >= accessRank[level]);
}

export async function canAccessLead(user: AuthzUser, leadId: string, level: AccessLevel = "View") {
  if (isFounder(user)) return true;
  if (!hasPermission(user, "leads:read:assigned")) return false;

  const access = await getPrisma().leadAccess.findUnique({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId
      }
    }
  });

  return Boolean(access && accessRank[access.access] >= accessRank[level]);
}

export function canModifyTask(user: AuthzUser, task: Pick<Task, "ownerId" | "archivedAt">) {
  if (task.archivedAt) return false;
  if (isFounder(user) || hasPermission(user, "tasks:manage")) return true;
  return hasPermission(user, "tasks:update:assigned") && task.ownerId === user.id;
}

export function canViewFounderOnlyNotes(user: AuthzUser) {
  return isFounder(user);
}

export function minimizeClientForUser(user: AuthzUser, client: Client) {
  if (canViewFounderOnlyNotes(user)) return client;
  return {
    ...client,
    founderOnlyNotes: null
  };
}

export function minimizeLeadForUser(user: AuthzUser, lead: Lead) {
  if (isFounder(user)) return lead;
  return {
    ...lead,
    approvedValue: null
  };
}
