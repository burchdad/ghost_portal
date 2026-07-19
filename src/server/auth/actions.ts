"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createUserSession, destroyCurrentSession } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import { getPrisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/audit/audit";
import { checkRateLimit } from "@/server/auth/rate-limit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  redirectTo: z.string().optional()
});

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: formData.get("redirectTo")
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const email = parsed.data.email.toLowerCase();
  if (!checkRateLimit(`login:${email}`)) {
    return { error: "Too many login attempts. Try again later." };
  }

  const user = await getPrisma().user.findUnique({
    where: { email },
    include: { role: true }
  });

  const valid = user && verifyPassword(parsed.data.password, user.passwordHash);

  if (!user || !valid) {
    await writeAuditLog({
      action: "auth.failed_login",
      entity: "User",
      after: { email }
    });
    return { error: "Email or password is incorrect." };
  }

  if (user.status !== "Active") {
    return { error: "This account is not active. Contact Stephen for access." };
  }

  await createUserSession(user.id);
  redirect(safeRedirect(parsed.data.redirectTo));
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login");
}

function safeRedirect(value: string | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard";
  return value;
}
