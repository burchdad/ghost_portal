import { cookies, headers } from "next/headers";
import type { SessionUser } from "@/server/permissions/authorize";
import { getPrisma } from "@/server/db/prisma";
import { createSessionToken, hashSessionToken } from "@/server/auth/tokens";
import { writeAuditLog } from "@/server/audit/audit";

export const sessionCookieName = "ghost_portal_session";
const sessionDays = 7;

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (!token) return null;

  const session = await getPrisma().session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: {
      user: {
        include: {
          role: true
        }
      }
    }
  });

  if (!session || session.expiresAt <= new Date() || session.user.status !== "Active") {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name,
    preferredName: session.user.preferredName,
    email: session.user.email,
    role: session.user.role.name,
    status: session.user.status,
    timezone: session.user.timezone
  };
}

export async function createUserSession(userId: string) {
  const requestHeaders = await headers();
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

  await getPrisma().session.create({
    data: {
      userId,
      tokenHash: hashSessionToken(token),
      expiresAt,
      ipAddress: requestHeaders.get("x-forwarded-for") ?? null,
      userAgent: requestHeaders.get("user-agent") ?? null
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  });

  await writeAuditLog({
    userId,
    action: "auth.login",
    entity: "User",
    entityId: userId,
    ipAddress: requestHeaders.get("x-forwarded-for") ?? null,
    userAgent: requestHeaders.get("user-agent") ?? null
  });
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;

  if (token) {
    const tokenHash = hashSessionToken(token);
    const session = await getPrisma().session.findUnique({ where: { tokenHash } });

    if (session) {
      await getPrisma().session.delete({ where: { tokenHash } });
      await writeAuditLog({
        userId: session.userId,
        action: "auth.logout",
        entity: "Session",
        entityId: session.id
      });
    }
  }

  cookieStore.delete(sessionCookieName);
}
