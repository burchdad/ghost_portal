"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { canAccessLead, requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export async function createLeadAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "leads:manage")) throw new Error("Forbidden: leads:manage");

  const parsed = z.object({
    company: z.string().min(2),
    contactName: z.string().optional(),
    serviceInterest: z.string().min(2),
    estimatedValue: z.coerce.number().optional(),
    stage: z.enum(["New", "Contacted", "Qualified", "Discovery", "Proposal", "Negotiation", "Won", "Lost", "Nurture"]).default("New"),
    nextAction: z.string().optional(),
    followUpDate: z.coerce.date().optional(),
    approvalRequired: z.boolean().default(false)
  }).parse({
    company: formData.get("company"),
    contactName: formData.get("contactName"),
    serviceInterest: formData.get("serviceInterest"),
    estimatedValue: formData.get("estimatedValue") || undefined,
    stage: formData.get("stage") ?? "New",
    nextAction: formData.get("nextAction"),
    followUpDate: formData.get("followUpDate") || undefined,
    approvalRequired: formData.get("approvalRequired") === "on"
  });

  const lead = await getPrisma().lead.create({
    data: {
      company: parsed.company,
      contactName: parsed.contactName,
      serviceInterest: parsed.serviceInterest,
      estimatedValue: parsed.estimatedValue ? new Prisma.Decimal(parsed.estimatedValue) : undefined,
      stage: parsed.stage,
      nextAction: parsed.nextAction,
      followUpDate: parsed.followUpDate,
      approvalRequired: parsed.approvalRequired
    }
  });

  await writeAuditLog({ userId: user.id, action: "lead.created", entity: "Lead", entityId: lead.id, after: { company: lead.company } });
  revalidatePath("/leads");
  redirect(`/leads/${lead.id}`);
}

export async function updateLeadOperationalAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    notes: z.string().optional(),
    nextAction: z.string().optional(),
    followUpDate: z.coerce.date().optional()
  }).parse({
    leadId: formData.get("leadId"),
    notes: formData.get("notes"),
    nextAction: formData.get("nextAction"),
    followUpDate: formData.get("followUpDate") || undefined
  });

  if (!(await canAccessLead(user, parsed.leadId, "Edit"))) throw new Error("Forbidden: lead");

  await getPrisma().lead.update({
    where: { id: parsed.leadId },
    data: {
      notes: parsed.notes,
      nextAction: parsed.nextAction,
      followUpDate: parsed.followUpDate
    }
  });
  await writeAuditLog({ userId: user.id, action: "lead.operational_updated", entity: "Lead", entityId: parsed.leadId });
  revalidatePath(`/leads/${parsed.leadId}`);
}
