"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { canAccessClient, requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export async function createClientAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "clients:manage")) throw new Error("Forbidden: clients:manage");

  const parsed = z.object({
    company: z.string().min(2),
    services: z.string().optional(),
    riskStatus: z.enum(["Low", "Medium", "High"]).default("Low"),
    operationalNotes: z.string().optional(),
    founderOnlyNotes: z.string().optional()
  }).parse({
    company: formData.get("company"),
    services: formData.get("services"),
    riskStatus: formData.get("riskStatus") ?? "Low",
    operationalNotes: formData.get("operationalNotes"),
    founderOnlyNotes: formData.get("founderOnlyNotes")
  });

  const client = await getPrisma().client.create({
    data: {
      company: parsed.company,
      services: parsed.services?.split(",").map((service) => service.trim()).filter(Boolean) ?? [],
      riskStatus: parsed.riskStatus,
      operationalNotes: parsed.operationalNotes,
      founderOnlyNotes: parsed.founderOnlyNotes,
      status: "Active"
    }
  });

  await writeAuditLog({ userId: user.id, action: "client.created", entity: "Client", entityId: client.id, after: { company: client.company } });
  revalidatePath("/clients");
  redirect(`/clients/${client.id}`);
}

export async function updateClientOperationalNotesAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({ clientId: z.string().min(1), operationalNotes: z.string().min(1) }).parse({
    clientId: formData.get("clientId"),
    operationalNotes: formData.get("operationalNotes")
  });

  if (!(await canAccessClient(user, parsed.clientId, "Edit"))) throw new Error("Forbidden: client");

  await getPrisma().client.update({ where: { id: parsed.clientId }, data: { operationalNotes: parsed.operationalNotes } });
  await writeAuditLog({ userId: user.id, action: "client.operational_notes_updated", entity: "Client", entityId: parsed.clientId });
  revalidatePath(`/clients/${parsed.clientId}`);
}
