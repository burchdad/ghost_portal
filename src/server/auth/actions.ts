"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createUserSession, destroyCurrentSession } from "@/server/auth/session";
import { verifyPassword } from "@/server/auth/password";
import { getPrisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/audit/audit";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export async function loginAction(_: { error?: string } | undefined, formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password")
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const user = await getPrisma().user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
    include: { role: true }
  });

  const valid = user && verifyPassword(parsed.data.password, user.passwordHash);

  if (!user || !valid) {
    await writeAuditLog({
      action: "auth.failed_login",
      entity: "User",
      after: { email: parsed.data.email.toLowerCase() }
    });
    return { error: "Email or password is incorrect." };
  }

  if (user.status !== "Active") {
    return { error: "This account is not active. Contact Stephen for access." };
  }

  await createUserSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroyCurrentSession();
  redirect("/login");
}
