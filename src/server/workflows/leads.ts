"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { syncLeadHandoffToMissionControl, type MissionControlLeadPayload } from "@/server/mission-control/client";
import { canAccessLead, requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";

export async function createLeadAction(formData: FormData) {
  const user = await requireUser();
  if (!canWorkLeads(user)) throw new Error("Forbidden: leads:update:assigned");

  const parsed = z.object({
    company: z.string().min(2),
    contactMethod: z.string().min(3),
    leadSource: leadSourceSchema,
    assignedUserId: z.string().min(1),
    contactName: z.string().optional(),
    website: z.string().optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
    initialNote: z.string().optional()
  }).parse({
    company: formData.get("company"),
    contactMethod: formData.get("contactMethod"),
    leadSource: formData.get("leadSource"),
    assignedUserId: formData.get("assignedUserId") || user.id,
    contactName: stringOrUndefined(formData.get("contactName")),
    website: stringOrUndefined(formData.get("website")),
    industry: stringOrUndefined(formData.get("industry")),
    location: stringOrUndefined(formData.get("location")),
    initialNote: stringOrUndefined(formData.get("initialNote"))
  });
  const contact = parseContactMethod(parsed.contactMethod);
  const assignedUserId = user.role === "Founder" || parsed.assignedUserId === user.id ? parsed.assignedUserId : user.id;
  const startCall = formData.get("intent") === "startCall";

  const prisma = getPrisma();
  const lead = await prisma.lead.create({
    data: {
      company: parsed.company.trim(),
      contactName: emptyToNull(parsed.contactName),
      contactEmail: contact.email,
      contactPhone: contact.phone,
      website: emptyToNull(parsed.website),
      industry: emptyToNull(parsed.industry),
      location: emptyToNull(parsed.location),
      leadSource: parsed.leadSource,
      createdById: user.id,
      assignedUserId,
      serviceInterest: "Unknown",
      stage: startCall ? "Attempted" : "ReadyToCall",
      notes: emptyToNull(parsed.initialNote),
      nextAction: startCall ? "Log first call outcome" : "Ready for first call"
    }
  });

  await prisma.leadAccess.upsert({
    where: { userId_leadId: { userId: assignedUserId, leadId: lead.id } },
    update: { access: "Edit" },
    create: { userId: assignedUserId, leadId: lead.id, access: "Edit", grantedBy: user.id }
  });
  if (assignedUserId !== user.id) {
    await prisma.leadAccess.upsert({
      where: { userId_leadId: { userId: user.id, leadId: lead.id } },
      update: { access: "Edit" },
      create: { userId: user.id, leadId: lead.id, access: "Edit", grantedBy: user.id }
    });
  }
  await prisma.activity.create({
    data: {
      actorId: user.id,
      action: "created lead",
      target: `${lead.company} from ${lead.leadSource ?? "Unknown"}`
    }
  });

  await writeAuditLog({ userId: user.id, action: "lead.created", entity: "Lead", entityId: lead.id, after: { company: lead.company } });
  revalidatePath("/leads");
  redirect(startCall ? `/leads/${lead.id}?call=1#quick-call` : `/leads/${lead.id}`);
}

export async function updateLeadOperationalAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    company: z.string().optional(),
    contactName: z.string().optional(),
    jobTitle: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().optional(),
    website: z.string().optional(),
    industry: z.string().optional(),
    location: z.string().optional(),
    timezone: z.string().optional(),
    leadSource: leadSourceSchema.optional(),
    assignedUserId: z.string().optional(),
    notes: z.string().optional(),
    nextAction: z.string().optional(),
    followUpDate: z.coerce.date().optional()
  }).parse({
    leadId: formData.get("leadId"),
    company: stringOrUndefined(formData.get("company")),
    contactName: stringOrUndefined(formData.get("contactName")),
    jobTitle: stringOrUndefined(formData.get("jobTitle")),
    contactPhone: stringOrUndefined(formData.get("contactPhone")),
    contactEmail: stringOrUndefined(formData.get("contactEmail")),
    website: stringOrUndefined(formData.get("website")),
    industry: stringOrUndefined(formData.get("industry")),
    location: stringOrUndefined(formData.get("location")),
    timezone: stringOrUndefined(formData.get("timezone")),
    leadSource: formData.get("leadSource") || undefined,
    assignedUserId: stringOrUndefined(formData.get("assignedUserId")),
    notes: stringOrUndefined(formData.get("notes")),
    nextAction: stringOrUndefined(formData.get("nextAction")),
    followUpDate: formData.get("followUpDate") || undefined
  });

  if (!(await canAccessLead(user, parsed.leadId, "Edit"))) throw new Error("Forbidden: lead");

  await getPrisma().lead.update({
    where: { id: parsed.leadId },
    data: {
      company: parsed.company?.trim() || undefined,
      contactName: emptyToNull(parsed.contactName),
      jobTitle: emptyToNull(parsed.jobTitle),
      contactPhone: emptyToNull(parsed.contactPhone),
      contactEmail: emptyToNull(parsed.contactEmail),
      website: emptyToNull(parsed.website),
      industry: emptyToNull(parsed.industry),
      location: emptyToNull(parsed.location),
      timezone: emptyToNull(parsed.timezone),
      leadSource: parsed.leadSource,
      assignedUserId: user.role === "Founder" ? parsed.assignedUserId : undefined,
      notes: emptyToNull(parsed.notes),
      nextAction: emptyToNull(parsed.nextAction),
      followUpDate: parsed.followUpDate
    }
  });
  if (user.role === "Founder" && parsed.assignedUserId) {
    await getPrisma().leadAccess.upsert({
      where: { userId_leadId: { userId: parsed.assignedUserId, leadId: parsed.leadId } },
      update: { access: "Edit" },
      create: { userId: parsed.assignedUserId, leadId: parsed.leadId, access: "Edit", grantedBy: user.id }
    });
  }
  await writeAuditLog({ userId: user.id, action: "lead.operational_updated", entity: "Lead", entityId: parsed.leadId });
  revalidatePath(`/leads/${parsed.leadId}`);
}

export async function logCallActivityAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    outcome: z.enum([
      "No Answer",
      "Voicemail Left",
      "Wrong Number",
      "Gatekeeper Reached",
      "Decision-Maker Reached",
      "Callback Requested",
      "Not Interested",
      "Interested",
      "Meeting Booked",
      "Do Not Contact"
    ]),
    occurredAt: z.coerce.date().optional(),
    personReached: z.string().optional(),
    decisionMakerStatus: z.string().optional(),
    summary: z.string().min(2),
    objection: z.string().optional(),
    callbackRequested: z.boolean().default(false),
    doNotContact: z.boolean().default(false),
    recordingReference: z.string().optional(),
    nextAction: z.string().optional(),
    followUpDate: z.coerce.date().optional(),
    interestLevel: leadInterestSchema.optional(),
    needs: z.array(z.string()).default([]),
    pricingRequested: z.boolean().default(false),
    discountRequested: z.boolean().default(false),
    timelineCommitmentRequested: z.boolean().default(false),
    scopeChangeRequested: z.boolean().default(false),
    customDevelopmentDiscussed: z.boolean().default(false),
    sensitiveIssue: z.boolean().default(false),
    needsStephen: z.boolean().default(false)
  }).parse({
    leadId: formData.get("leadId"),
    outcome: formData.get("outcome"),
    occurredAt: formData.get("occurredAt") || undefined,
    personReached: stringOrUndefined(formData.get("personReached")),
    decisionMakerStatus: stringOrUndefined(formData.get("decisionMakerStatus")),
    summary: formData.get("summary"),
    objection: stringOrUndefined(formData.get("objection")),
    callbackRequested: formData.get("callbackRequested") === "on",
    doNotContact: formData.get("doNotContact") === "on",
    recordingReference: stringOrUndefined(formData.get("recordingReference")),
    nextAction: stringOrUndefined(formData.get("nextAction")),
    followUpDate: formData.get("followUpDate") || undefined,
    interestLevel: formData.get("interestLevel") || undefined,
    needs: formData.getAll("needs").map(String),
    pricingRequested: formData.get("pricingRequested") === "on",
    discountRequested: formData.get("discountRequested") === "on",
    timelineCommitmentRequested: formData.get("timelineCommitmentRequested") === "on",
    scopeChangeRequested: formData.get("scopeChangeRequested") === "on",
    customDevelopmentDiscussed: formData.get("customDevelopmentDiscussed") === "on",
    sensitiveIssue: formData.get("sensitiveIssue") === "on",
    needsStephen: formData.get("needsStephen") === "on"
  });

  if (!(await canAccessLead(user, parsed.leadId, "Edit"))) throw new Error("Forbidden: lead");

  const reviewTriggers = approvalTriggers(parsed);
  await getPrisma().$transaction([
    getPrisma().callActivity.create({
      data: {
        leadId: parsed.leadId,
        userId: user.id,
        outcome: parsed.outcome,
        occurredAt: parsed.occurredAt,
        summary: parsed.summary,
        personReached: emptyToNull(parsed.personReached),
        decisionMakerStatus: emptyToNull(parsed.decisionMakerStatus),
        objection: emptyToNull(parsed.objection),
        callbackRequested: parsed.callbackRequested || parsed.outcome === "Callback Requested",
        doNotContact: parsed.doNotContact || parsed.outcome === "Do Not Contact",
        recordingReference: emptyToNull(parsed.recordingReference),
        nextAction: emptyToNull(parsed.nextAction),
        followUpDate: parsed.followUpDate
      }
    }),
    getPrisma().lead.update({
      where: { id: parsed.leadId },
      data: {
        callResult: parsed.outcome,
        lastContact: parsed.occurredAt ?? new Date(),
        nextAction: emptyToNull(parsed.nextAction),
        followUpDate: parsed.followUpDate,
        doNotContact: parsed.doNotContact || parsed.outcome === "Do Not Contact",
        stage: stageForOutcome(parsed.outcome),
        decisionMakerStatus: emptyToNull(parsed.decisionMakerStatus),
        interestLevel: parsed.interestLevel,
        needDiscovered: parsed.needs.length ? parsed.needs : undefined,
        needsStephenReview: reviewTriggers.length ? true : undefined,
        needsStephenReason: reviewTriggers.length ? reviewTriggers.join(", ") : undefined
      }
    }),
    getPrisma().activity.create({
      data: { actorId: user.id, action: `logged call: ${parsed.outcome}`, target: parsed.summary.slice(0, 180) }
    }),
    ...(reviewTriggers.length ? [getPrisma().approval.create({
      data: {
        requesterId: user.id,
        leadId: parsed.leadId,
        summary: `Stephen review needed: ${reviewTriggers.join(", ")}`,
        context: parsed.summary,
        businessImpact: "Lead outreach has a decision or risk that Operations cannot approve independently.",
        recommendation: parsed.nextAction || "Review lead before Alex continues outreach.",
        priority: parsed.sensitiveIssue ? "High" : "Medium"
      }
    })] : [])
  ]);
  await writeAuditLog({ userId: user.id, action: "call.logged", entity: "Lead", entityId: parsed.leadId, after: parsed });
  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.leadId}`);
}

export async function updateLeadQualificationAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    businessAge: z.string().optional(),
    employeeCount: z.string().optional(),
    approximateRevenue: z.string().optional(),
    currentWebsite: z.string().optional(),
    currentMarketing: z.string().optional(),
    currentLeadFlow: z.string().optional(),
    currentCrm: z.string().optional(),
    currentAdvertising: z.string().optional(),
    currentAutomation: z.string().optional(),
    mainPainPoint: z.string().optional(),
    urgency: z.string().optional(),
    budgetComfort: z.string().optional(),
    decisionMakerStatus: z.string().optional(),
    desiredOutcome: z.string().optional(),
    internalCapacity: z.string().optional(),
    numberOfLocations: z.string().optional(),
    existingVendor: z.string().optional(),
    preferredOfferType: z.enum(["GrowthPartnership", "StandaloneService", "ProductSubscription", "CustomEnterpriseEngagement"]).optional(),
    recommendedGhostOffer: z.string().optional(),
    recommendedServiceId: z.string().optional(),
    needDiscovered: z.array(z.string()).default([]),
    interestLevel: leadInterestSchema.default("Unknown"),
    qualificationSummary: z.string().optional(),
    appointmentStatus: z.string().optional(),
    valueSuggestionRange: z.string().optional(),
    regulatedIndustry: z.boolean().default(false)
  }).parse({
    leadId: formData.get("leadId"),
    businessAge: stringOrUndefined(formData.get("businessAge")),
    employeeCount: stringOrUndefined(formData.get("employeeCount")),
    approximateRevenue: stringOrUndefined(formData.get("approximateRevenue")),
    currentWebsite: stringOrUndefined(formData.get("currentWebsite")),
    currentMarketing: stringOrUndefined(formData.get("currentMarketing")),
    currentLeadFlow: stringOrUndefined(formData.get("currentLeadFlow")),
    currentCrm: stringOrUndefined(formData.get("currentCrm")),
    currentAdvertising: stringOrUndefined(formData.get("currentAdvertising")),
    currentAutomation: stringOrUndefined(formData.get("currentAutomation")),
    mainPainPoint: stringOrUndefined(formData.get("mainPainPoint")),
    urgency: stringOrUndefined(formData.get("urgency")),
    budgetComfort: stringOrUndefined(formData.get("budgetComfort")),
    decisionMakerStatus: stringOrUndefined(formData.get("decisionMakerStatus")),
    desiredOutcome: stringOrUndefined(formData.get("desiredOutcome")),
    internalCapacity: stringOrUndefined(formData.get("internalCapacity")),
    numberOfLocations: stringOrUndefined(formData.get("numberOfLocations")),
    existingVendor: stringOrUndefined(formData.get("existingVendor")),
    preferredOfferType: formData.get("preferredOfferType") || undefined,
    recommendedGhostOffer: stringOrUndefined(formData.get("recommendedGhostOffer")),
    recommendedServiceId: formData.get("recommendedServiceId") || undefined,
    needDiscovered: formData.getAll("needDiscovered").map(String),
    interestLevel: formData.get("interestLevel") || "Unknown",
    qualificationSummary: stringOrUndefined(formData.get("qualificationSummary")),
    appointmentStatus: stringOrUndefined(formData.get("appointmentStatus")),
    valueSuggestionRange: stringOrUndefined(formData.get("valueSuggestionRange")),
    regulatedIndustry: formData.get("regulatedIndustry") === "on"
  });

  if (!(await canAccessLead(user, parsed.leadId, "Edit"))) throw new Error("Forbidden: lead");
  const before = await getPrisma().lead.findUnique({ where: { id: parsed.leadId } });
  await getPrisma().lead.update({
    where: { id: parsed.leadId },
    data: {
      businessAge: emptyToNull(parsed.businessAge),
      employeeCount: emptyToNull(parsed.employeeCount),
      approximateRevenue: emptyToNull(parsed.approximateRevenue),
      currentWebsite: emptyToNull(parsed.currentWebsite),
      marketingStatus: emptyToNull(parsed.currentMarketing),
      currentLeadFlow: emptyToNull(parsed.currentLeadFlow),
      currentCrm: emptyToNull(parsed.currentCrm),
      currentAdvertising: emptyToNull(parsed.currentAdvertising),
      currentAutomation: emptyToNull(parsed.currentAutomation),
      mainPainPoint: emptyToNull(parsed.mainPainPoint),
      urgency: emptyToNull(parsed.urgency),
      budgetComfort: emptyToNull(parsed.budgetComfort),
      decisionMakerStatus: emptyToNull(parsed.decisionMakerStatus),
      desiredOutcome: emptyToNull(parsed.desiredOutcome),
      internalCapacity: emptyToNull(parsed.internalCapacity),
      numberOfLocations: emptyToNull(parsed.numberOfLocations),
      existingVendor: emptyToNull(parsed.existingVendor),
      preferredOfferType: parsed.preferredOfferType,
      recommendedGhostOffer: emptyToNull(parsed.recommendedGhostOffer),
      recommendedServiceId: parsed.recommendedServiceId,
      needDiscovered: parsed.needDiscovered,
      interestLevel: parsed.interestLevel,
      qualificationSummary: emptyToNull(parsed.qualificationSummary),
      appointmentStatus: emptyToNull(parsed.appointmentStatus),
      valueSuggestionRange: emptyToNull(parsed.valueSuggestionRange),
      regulatedIndustry: parsed.regulatedIndustry
    }
  });
  await writeAuditLog({ userId: user.id, action: "lead.qualification_updated", entity: "Lead", entityId: parsed.leadId, before: before ?? undefined, after: parsed });
  revalidatePath(`/leads/${parsed.leadId}`);
  revalidatePath("/leads");
}

export async function requestStephenLeadReviewAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    reason: z.string().min(2),
    recommendation: z.string().optional()
  }).parse({
    leadId: formData.get("leadId"),
    reason: formData.get("reason"),
    recommendation: formData.get("recommendation")
  });
  if (!(await canAccessLead(user, parsed.leadId, "Edit"))) throw new Error("Forbidden: lead");

  await getPrisma().$transaction([
    getPrisma().lead.update({
      where: { id: parsed.leadId },
      data: { needsStephenReview: true, needsStephenReason: parsed.reason }
    }),
    getPrisma().approval.create({
      data: {
        requesterId: user.id,
        leadId: parsed.leadId,
        summary: "Lead needs Stephen review",
        context: parsed.reason,
        businessImpact: "Operations needs Founder direction before continuing lead handling.",
        recommendation: parsed.recommendation || "Review lead workspace and advise next step.",
        priority: "Medium"
      }
    }),
    getPrisma().activity.create({ data: { actorId: user.id, action: "requested Stephen review", target: parsed.reason.slice(0, 180) } })
  ]);
  await writeAuditLog({ userId: user.id, action: "lead.stephen_review_requested", entity: "Lead", entityId: parsed.leadId, after: parsed });
  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.leadId}`);
}

export async function sendLeadToMissionControlAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    conversationSummary: z.string().min(2),
    recommendedNextAction: z.string().min(2),
    level: z.enum(["discovery", "qualified"])
  }).parse({
    leadId: formData.get("leadId"),
    conversationSummary: formData.get("conversationSummary"),
    recommendedNextAction: formData.get("recommendedNextAction"),
    level: formData.get("level")
  });
  if (!(await canAccessLead(user, parsed.leadId, "Edit"))) throw new Error("Forbidden: lead");

  const lead = await getPrisma().lead.findUnique({
    where: { id: parsed.leadId },
    include: { callActivities: { orderBy: { occurredAt: "desc" }, take: 10 }, assignedUser: true }
  });
  if (!lead) throw new Error("Lead not found");
  const missing = parsed.level === "qualified" ? missingQualifiedFields(lead) : missingDiscoveryFields(lead, parsed.conversationSummary, parsed.recommendedNextAction);
  if (missing.length) throw new Error(`Missing required handoff fields: ${missing.join(", ")}`);

  const stage = parsed.level === "qualified" ? "Qualified - Awaiting Founder Review" : "Sales-Ready - Needs Discovery";
  const payload = buildMissionControlPayload(lead, parsed.conversationSummary, parsed.recommendedNextAction, stage);
  const syncResult = await syncLeadHandoffToMissionControl(payload);
  const jsonSyncResult = JSON.parse(JSON.stringify(syncResult)) as Prisma.InputJsonValue;
  const missionControlStatus = syncResult.status === "sent" ? "Sent to Mission Control" : syncResult.status === "failed" ? "Sync Failed" : "Ready to Sync";
  const handoffStatus = syncResult.status === "sent"
    ? "SentToMissionControl"
    : parsed.level === "qualified"
      ? "QualifiedAwaitingFounderReview"
      : "SalesReadyNeedsDiscovery";
  await getPrisma().$transaction([
    getPrisma().lead.update({
      where: { id: parsed.leadId },
      data: {
        handoffStatus,
        missionControlStatus,
        missionControlStage: stage,
        missionControlPayload: { ...payload, helperSync: jsonSyncResult } as Prisma.InputJsonValue,
        missionControlSyncedAt: new Date(),
        needsStephenReview: true,
        needsStephenReason: syncResult.status === "failed"
          ? `Mission Control sync failed: ${syncResult.error}`
          : parsed.level === "qualified" ? "Promoted as qualified opportunity." : "Sent to Mission Control for discovery.",
        stage: parsed.level === "qualified" ? "Qualified" : "Discovery",
        nextAction: parsed.recommendedNextAction
      }
    }),
    getPrisma().approval.create({
      data: {
        requesterId: user.id,
        leadId: parsed.leadId,
        summary: `Mission Control handoff: ${stage}`,
        context: parsed.conversationSummary,
        businessImpact: "Lead is ready for Mission Control visibility and Founder review.",
        recommendation: parsed.recommendedNextAction,
        priority: parsed.level === "qualified" ? "High" : "Medium"
      }
    }),
    getPrisma().activity.create({ data: { actorId: user.id, action: `mission control handoff: ${stage}`, target: lead.company } })
  ]);
  await writeAuditLog({ userId: user.id, action: "lead.mission_control_handoff", entity: "Lead", entityId: parsed.leadId, after: { payload, syncResult: jsonSyncResult } as Prisma.InputJsonValue });
  revalidatePath("/leads");
  revalidatePath(`/leads/${parsed.leadId}`);
}

export async function requestPricingApprovalAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z.object({
    leadId: z.string().min(1),
    serviceId: z.string().optional(),
    business: z.string().min(2),
    recommendedOffer: z.string().min(2),
    currentPain: z.string().min(2),
    requestedPricing: z.string().optional(),
    requestedDiscount: z.string().optional(),
    requestedTerm: z.string().optional(),
    requestedAddOns: z.string().optional(),
    competitorInformation: z.string().optional(),
    budgetIndication: z.string().optional(),
    recommendation: z.string().min(2),
    urgency: z.enum(["Low", "Medium", "High", "Urgent"]).default("Medium"),
    meetingDate: z.coerce.date().optional(),
    notes: z.string().optional()
  }).parse({
    leadId: formData.get("leadId"),
    serviceId: formData.get("serviceId") || undefined,
    business: formData.get("business"),
    recommendedOffer: formData.get("recommendedOffer"),
    currentPain: formData.get("currentPain"),
    requestedPricing: formData.get("requestedPricing"),
    requestedDiscount: formData.get("requestedDiscount"),
    requestedTerm: formData.get("requestedTerm"),
    requestedAddOns: formData.get("requestedAddOns"),
    competitorInformation: formData.get("competitorInformation"),
    budgetIndication: formData.get("budgetIndication"),
    recommendation: formData.get("recommendation"),
    urgency: formData.get("urgency") ?? "Medium",
    meetingDate: formData.get("meetingDate") || undefined,
    notes: formData.get("notes")
  });

  if (!(await canAccessLead(user, parsed.leadId, "Edit"))) throw new Error("Forbidden: lead");

  const request = await getPrisma().pricingApprovalRequest.create({
    data: {
      ...parsed,
      requesterId: user.id
    }
  });
  await writeAuditLog({ userId: user.id, action: "pricing_approval.requested", entity: "PricingApprovalRequest", entityId: request.id, after: parsed });
  revalidatePath(`/leads/${parsed.leadId}`);
}

const leadSourceSchema = z.enum([
  "Manual Cold Call",
  "Vega",
  "Referral",
  "Facebook",
  "Networking",
  "Website Inquiry",
  "Email",
  "Partner",
  "Existing Relationship",
  "Other"
]);

const leadInterestSchema = z.enum(["Unknown", "Low", "Possible", "Interested", "StrongInterest", "MeetingRequested"]);

function stageForOutcome(outcome: string) {
  if (outcome === "Meeting Booked") return "MeetingScheduled";
  if (outcome === "Interested") return "Interested";
  if (outcome === "Callback Requested") return "FollowUp";
  if (outcome === "Decision-Maker Reached" || outcome === "Gatekeeper Reached") return "Connected";
  if (outcome === "Do Not Contact") return "DoNotContact";
  if (outcome === "Not Interested") return "Lost";
  return "Attempted";
}

function canWorkLeads(user: Parameters<typeof hasPermission>[0]) {
  return hasPermission(user, "leads:manage") || hasPermission(user, "leads:update:assigned");
}

function parseContactMethod(value: string) {
  const trimmed = value.trim();
  if (trimmed.includes("@")) return { email: trimmed, phone: undefined };
  return { email: undefined, phone: trimmed };
}

function approvalTriggers(parsed: {
  pricingRequested: boolean;
  discountRequested: boolean;
  timelineCommitmentRequested: boolean;
  scopeChangeRequested: boolean;
  customDevelopmentDiscussed: boolean;
  sensitiveIssue: boolean;
  needsStephen: boolean;
}) {
  return [
    parsed.pricingRequested ? "Pricing requested" : null,
    parsed.discountRequested ? "Discount requested" : null,
    parsed.timelineCommitmentRequested ? "Timeline commitment requested" : null,
    parsed.scopeChangeRequested ? "Scope change requested" : null,
    parsed.customDevelopmentDiscussed ? "Custom development discussed" : null,
    parsed.sensitiveIssue ? "Legal/security/financial/public issue" : null,
    parsed.needsStephen ? "Marked Needs Stephen" : null
  ].filter(Boolean) as string[];
}

function missingDiscoveryFields(lead: {
  company: string;
  contactName: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  leadSource: string | null;
  needDiscovered: string[];
  interestLevel: string;
  followUpDate: Date | null;
  appointmentStatus: string | null;
  doNotContact: boolean;
}, conversationSummary: string, recommendedNextAction: string) {
  const missing: string[] = [];
  if (!lead.company && !lead.contactName) missing.push("business or contact name");
  if (!lead.contactPhone && !lead.contactEmail) missing.push("phone or email");
  if (!lead.leadSource) missing.push("lead source");
  if (!conversationSummary.trim()) missing.push("conversation summary");
  if (!lead.needDiscovered.length) missing.push("identified or suspected need");
  if (!lead.interestLevel || lead.interestLevel === "Unknown") missing.push("interest level");
  if (!recommendedNextAction.trim()) missing.push("recommended next action");
  if (!lead.followUpDate && !lead.appointmentStatus) missing.push("follow-up date or appointment status");
  if (typeof lead.doNotContact !== "boolean") missing.push("do-not-contact status");
  return missing;
}

function missingQualifiedFields(lead: {
  company: string;
  contactPhone: string | null;
  contactEmail: string | null;
  decisionMakerStatus: string | null;
  needDiscovered: string[];
  recommendedGhostOffer: string | null;
  qualificationSummary: string | null;
  interestLevel: string;
  followUpDate: Date | null;
  appointmentStatus: string | null;
  doNotContact: boolean;
}) {
  const missing: string[] = [];
  if (!lead.company) missing.push("business name");
  if (!lead.contactPhone && !lead.contactEmail) missing.push("contact method");
  if (!lead.decisionMakerStatus) missing.push("decision-maker status");
  if (!lead.needDiscovered.length) missing.push("clear need");
  if (!lead.recommendedGhostOffer) missing.push("recommended offer or Needs Discovery");
  if (!lead.qualificationSummary) missing.push("qualification summary");
  if (!lead.interestLevel || lead.interestLevel === "Unknown") missing.push("interest level");
  if (!lead.followUpDate && !lead.appointmentStatus) missing.push("appointment or specific follow-up");
  if (typeof lead.doNotContact !== "boolean") missing.push("do-not-contact status");
  return missing;
}

function buildMissionControlPayload(
  lead: {
    id: string;
    company: string;
    contactName: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    website: string | null;
    industry: string | null;
    location: string | null;
    leadSource: string | null;
    assignedUser: { id: string; name: string; preferredName: string | null } | null;
    needDiscovered: string[];
    interestLevel: string;
    decisionMakerStatus: string | null;
    recommendedGhostOffer: string | null;
    qualificationSummary: string | null;
    followUpDate: Date | null;
    appointmentDate: Date | null;
    appointmentStatus: string | null;
    doNotContact: boolean;
    callActivities: Array<{ outcome: string; summary: string; occurredAt: Date }>;
  },
  conversationSummary: string,
  recommendedNextAction: string,
  missionControlStage: string
): MissionControlLeadPayload {
  return {
    sourceSystem: "Ghost Ops Portal",
    leadId: lead.id,
    missionControlStage,
    businessName: lead.company || null,
    contactName: lead.contactName || null,
    phone: lead.contactPhone || null,
    email: lead.contactEmail || null,
    website: lead.website || null,
    industry: lead.industry || null,
    location: lead.location || null,
    leadSource: lead.leadSource || "Unknown",
    setter: lead.assignedUser ? { id: lead.assignedUser.id, name: lead.assignedUser.preferredName ?? lead.assignedUser.name } : null,
    conversationSummary,
    callHistorySummary: lead.callActivities.map((call) => `${call.occurredAt.toISOString()}: ${call.outcome} - ${call.summary}`).join("\n") || null,
    needDiscovered: lead.needDiscovered,
    interestLevel: lead.interestLevel,
    decisionMakerStatus: lead.decisionMakerStatus || null,
    recommendedOffer: lead.recommendedGhostOffer || "Needs Discovery",
    qualificationSummary: lead.qualificationSummary || null,
    followUpDate: lead.followUpDate?.toISOString() ?? null,
    appointmentDate: lead.appointmentDate?.toISOString() ?? null,
    appointmentStatus: lead.appointmentStatus || null,
    doNotContact: lead.doNotContact,
    recommendedNextAction
  };
}

function emptyToNull(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() ? value.trim() : undefined;
}
