"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { hashPassword } from "@/server/auth/password";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import type { Role } from "@/server/permissions/roles";
import { defaultTimezone, isValidTimezone, normalizeTimezone } from "@/lib/timezones";

export type CreateEmployeeState = {
  status: "idle" | "success" | "error";
  message?: string;
  temporaryPassword?: string;
};

const founderAssignableRoles: Role[] = ["Executive", "Operations", "Sales", "Marketing", "Developer", "Support", "Finance", "Contractor", "Client"];
const operationsAssignableRoles: Role[] = ["Sales", "Marketing", "Support", "Contractor"];

const createEmployeeSchema = z.object({
  name: z.string().trim().min(2, "Employee name is required."),
  preferredName: z.string().trim().optional(),
  email: z.string().trim().email("Enter a valid email address."),
  role: z.enum(["Executive", "Operations", "Sales", "Marketing", "Developer", "Support", "Finance", "Contractor", "Client"]),
  timezone: z.string().trim().min(1).transform(normalizeTimezone).refine(isValidTimezone, "Choose a valid timezone.").default(defaultTimezone),
  status: z.enum(["Invited", "Active"]).default("Active"),
  temporaryPassword: z.string().trim().optional()
});

export async function createEmployeeAction(_state: CreateEmployeeState, formData: FormData): Promise<CreateEmployeeState> {
  const actor = await requirePermission("users:manage");
  const parsed = createEmployeeSchema.safeParse({
    name: formData.get("name"),
    preferredName: formData.get("preferredName") || undefined,
    email: formData.get("email"),
    role: formData.get("role"),
    timezone: formData.get("timezone") || defaultTimezone,
    status: formData.get("status") || "Active",
    temporaryPassword: formData.get("temporaryPassword") || undefined
  });

  if (!parsed.success) {
    return { status: "error", message: parsed.error.issues[0]?.message ?? "Could not create employee." };
  }

  const allowedRoles = actor.role === "Founder" ? founderAssignableRoles : operationsAssignableRoles;
  if (!allowedRoles.includes(parsed.data.role)) {
    return { status: "error", message: "You cannot assign that role." };
  }

  const prisma = getPrisma();
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "error", message: "An employee with that email already exists." };
  }

  const role = await prisma.role.findUnique({ where: { name: parsed.data.role } });
  if (!role) {
    return { status: "error", message: `Role ${parsed.data.role} has not been seeded yet.` };
  }

  const temporaryPassword = parsed.data.temporaryPassword || generateTemporaryPassword();
  const employee = await prisma.user.create({
    data: {
      name: parsed.data.name,
      preferredName: parsed.data.preferredName || null,
      email,
      timezone: parsed.data.timezone,
      status: parsed.data.status,
      emailVerified: false,
      passwordHash: hashPassword(temporaryPassword),
      roleId: role.id
    },
    include: { role: true }
  });

  await writeAuditLog({
    userId: actor.id,
    action: "user.employee_created",
    entity: "User",
    entityId: employee.id,
    after: {
      email: employee.email,
      role: employee.role.name,
      status: employee.status,
      timezone: employee.timezone
    }
  });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");

  return {
    status: "success",
    message: `${employee.preferredName ?? employee.name} was added as ${employee.role.name}. Share the temporary password securely and have them change it later.`,
    temporaryPassword
  };
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let value = "Ghost-";
  for (let index = 0; index < 14; index += 1) {
    value += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return value;
}
