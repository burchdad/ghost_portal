"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { createNotification } from "@/server/workflows/notifications";

const accessSchema = z.object({
  userId: z.string().min(1),
  recordId: z.string().min(1),
  access: z.enum(["View", "Edit", "Manage"]).default("View")
});

export async function grantClientAccessAction(formData: FormData) {
  const founder = await requireFounderManageClients();
  const parsed = accessSchema.parse({
    userId: formData.get("userId"),
    recordId: formData.get("clientId"),
    access: formData.get("access") ?? "View"
  });

  await getPrisma().clientAccess.upsert({
    where: { userId_clientId: { userId: parsed.userId, clientId: parsed.recordId } },
    update: { access: parsed.access, grantedBy: founder.id },
    create: { userId: parsed.userId, clientId: parsed.recordId, access: parsed.access, grantedBy: founder.id }
  });

  await Promise.all([
    createNotification({ userId: parsed.userId, title: "Client access granted", href: `/clients/${parsed.recordId}` }),
    writeAuditLog({
      userId: founder.id,
      action: "client_access.granted",
      entity: "Client",
      entityId: parsed.recordId,
      after: { userId: parsed.userId, access: parsed.access }
    })
  ]);

  revalidatePath(`/clients/${parsed.recordId}`);
}

export async function revokeClientAccessAction(formData: FormData) {
  const founder = await requireFounderManageClients();
  const parsed = z.object({ userId: z.string().min(1), clientId: z.string().min(1) }).parse({
    userId: formData.get("userId"),
    clientId: formData.get("clientId")
  });

  await getPrisma().clientAccess.deleteMany({ where: parsed });
  await writeAuditLog({
    userId: founder.id,
    action: "client_access.revoked",
    entity: "Client",
    entityId: parsed.clientId,
    before: { userId: parsed.userId }
  });
  revalidatePath(`/clients/${parsed.clientId}`);
}

export async function grantLeadAccessAction(formData: FormData) {
  const founder = await requireFounderManageLeads();
  const parsed = accessSchema.parse({
    userId: formData.get("userId"),
    recordId: formData.get("leadId"),
    access: formData.get("access") ?? "View"
  });

  await getPrisma().leadAccess.upsert({
    where: { userId_leadId: { userId: parsed.userId, leadId: parsed.recordId } },
    update: { access: parsed.access, grantedBy: founder.id },
    create: { userId: parsed.userId, leadId: parsed.recordId, access: parsed.access, grantedBy: founder.id }
  });

  await Promise.all([
    createNotification({ userId: parsed.userId, title: "Lead access granted", href: `/leads/${parsed.recordId}` }),
    writeAuditLog({
      userId: founder.id,
      action: "lead_access.granted",
      entity: "Lead",
      entityId: parsed.recordId,
      after: { userId: parsed.userId, access: parsed.access }
    })
  ]);

  revalidatePath(`/leads/${parsed.recordId}`);
}

export async function revokeLeadAccessAction(formData: FormData) {
  const founder = await requireFounderManageLeads();
  const parsed = z.object({ userId: z.string().min(1), leadId: z.string().min(1) }).parse({
    userId: formData.get("userId"),
    leadId: formData.get("leadId")
  });

  await getPrisma().leadAccess.deleteMany({ where: parsed });
  await writeAuditLog({
    userId: founder.id,
    action: "lead_access.revoked",
    entity: "Lead",
    entityId: parsed.leadId,
    before: { userId: parsed.userId }
  });
  revalidatePath(`/leads/${parsed.leadId}`);
}

async function requireFounderManageClients() {
  const user = await requireUser();
  if (!hasPermission(user, "clients:manage")) throw new Error("Forbidden: clients:manage");
  return user;
}

async function requireFounderManageLeads() {
  const user = await requireUser();
  if (!hasPermission(user, "leads:manage")) throw new Error("Forbidden: leads:manage");
  return user;
}
