"use server";

import { revalidatePath } from "next/cache";
import type { ServiceOffering } from "@prisma/client";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission, requireUser } from "@/server/permissions/authorize";
import { pricingWarnings } from "@/lib/pricing";

const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  slug: z.string().min(2),
  offerType: z.enum(["GrowthPartnership", "StandaloneService", "ProductSubscription", "CustomEnterpriseEngagement"]).default("StandaloneService"),
  category: z.enum([
    "Websites",
    "WebsiteCare",
    "AIAutomation",
    "CustomAISystems",
    "LeadGeneration",
    "SEOAEO_GEO",
    "Marketing",
    "SocialMedia",
    "Applications",
    "DigitalBusinessCards",
    "Consulting",
    "FractionalLeadership",
    "CustomDevelopment"
  ]),
  shortExplanation: z.string().min(10),
  internalExplanation: z.string().min(10),
  idealCustomer: z.string().min(2),
  oneTimePriceCents: z.coerce.number().int().nonnegative().optional(),
  monthlyPriceCents: z.coerce.number().int().nonnegative().optional(),
  priceRangeMinCents: z.coerce.number().int().nonnegative().optional(),
  priceRangeMaxCents: z.coerce.number().int().nonnegative().optional(),
  setupFeeCents: z.coerce.number().int().nonnegative().optional(),
  noSetupFeeRequired: checkbox(false),
  minimumTermMonths: z.coerce.number().int().nonnegative().optional(),
  pricingStatus: z.enum(["Provisional", "UnderReview", "Approved", "FounderManagedRequired", "CustomScope", "Retired", "Inactive"]),
  pricingBasis: z.enum(["Project", "MonthlyRetainer", "Subscription", "PerUnit", "UsageBased", "Custom"]).optional(),
  priceDisplayMode: z.enum(["Fixed", "Range", "FounderReviewRequired", "CustomPricing"]).default("FounderReviewRequired"),
  paymentTerms: z.string().optional(),
  minimumEngagement: z.string().optional(),
  typicalTimeline: z.string().optional(),
  approvedResponse: z.string().min(2),
  desiredNextStep: z.string().min(2),
  alexMayQuote: checkbox(false),
  founderApprovalRequired: checkbox(false),
  employeeQuotePermission: checkbox(false),
  websiteIncluded: checkbox(false),
  active: checkbox(false),
  displayOrder: z.coerce.number().int().default(0),
  internalNotes: z.string().optional(),
  founderNotes: z.string().optional(),
  pricingNotes: z.string().optional(),
  approvalThreshold: z.string().optional(),
  websiteInclusion: z.string().optional(),
  websiteOwnershipTerms: z.string().optional(),
  cancellationTerms: z.string().optional(),
  earlyCancellationTerms: z.string().optional(),
  financingNotes: z.string().optional(),
  problemsSolved: z.string().optional(),
  includedDeliverables: z.string().optional(),
  optionalAddOns: z.string().optional(),
  qualificationQuestions: z.string().optional(),
  commonObjections: z.string().optional(),
  exclusions: z.string().optional(),
  escalationTriggers: z.string().optional()
});

const calculatorSchema = z.object({
  serviceId: z.string().min(1),
  founderSetupHours: z.coerce.number().nonnegative().optional(),
  founderMonthlyHours: z.coerce.number().nonnegative().optional(),
  contractorSetupHours: z.coerce.number().nonnegative().optional(),
  contractorMonthlyHours: z.coerce.number().nonnegative().optional(),
  founderHourlyCost: z.coerce.number().nonnegative().optional(),
  contractorHourlyCost: z.coerce.number().nonnegative().optional(),
  softwareCosts: z.coerce.number().nonnegative().optional(),
  apiCosts: z.coerce.number().nonnegative().optional(),
  hostingCosts: z.coerce.number().nonnegative().optional(),
  dataProviderCosts: z.coerce.number().nonnegative().optional(),
  advertisingManagementCosts: z.coerce.number().nonnegative().optional(),
  supportReserve: z.coerce.number().nonnegative().optional(),
  riskReserve: z.coerce.number().nonnegative().optional(),
  paymentProcessingFeePercent: z.coerce.number().nonnegative().optional(),
  targetGrossMargin: z.coerce.number().nonnegative().optional(),
  monthlyRecoveryAmount: z.coerce.number().nonnegative().optional(),
  discountFloor: z.coerce.number().nonnegative().optional(),
  changeReason: z.string().optional()
});

const packageSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  description: z.string().min(10),
  setupPriceCents: z.coerce.number().int().nonnegative().optional(),
  monthlyPriceCents: z.coerce.number().int().nonnegative().optional(),
  discount: z.string().optional(),
  minimumTerm: z.string().optional(),
  paymentSchedule: z.string().optional(),
  includedUsage: z.string().optional(),
  optionalAddOns: z.string().optional(),
  employeeQuotePermission: checkbox(false),
  founderApprovalThreshold: z.string().optional(),
  active: checkbox(false)
});

export async function upsertServiceOfferingAction(formData: FormData) {
  const user = await requirePermission("pricing:manage");
  const parsed = serviceSchema.parse(fromForm(formData));
  const prisma = getPrisma();
  const before = parsed.id ? await prisma.serviceOffering.findUnique({ where: { id: parsed.id } }) : null;
  const { id: _id, ...data } = {
    ...parsed,
    oneTimePriceCents: moneyToCents(formData.get("oneTimePrice")),
    monthlyPriceCents: moneyToCents(formData.get("monthlyPrice")),
    priceRangeMinCents: moneyToCents(formData.get("priceRangeMin")),
    priceRangeMaxCents: moneyToCents(formData.get("priceRangeMax")),
    setupFeeCents: moneyToCents(formData.get("setupFee")),
    noSetupFeeRequired: parsed.noSetupFeeRequired,
    problemsSolved: lines(parsed.problemsSolved),
    includedDeliverables: lines(parsed.includedDeliverables),
    optionalAddOns: lines(parsed.optionalAddOns),
    qualificationQuestions: lines(parsed.qualificationQuestions),
    commonObjections: lines(parsed.commonObjections),
    exclusions: lines(parsed.exclusions),
    escalationTriggers: lines(parsed.escalationTriggers),
    customerFacingExclusions: lines(parsed.exclusions),
    updatedById: user.id,
    effectiveDate: new Date()
  };
  void _id;
  const service = parsed.id
    ? await prisma.serviceOffering.update({ where: { id: parsed.id }, data })
    : await prisma.serviceOffering.create({ data });

  await prisma.pricingHistory.create({
    data: {
      serviceId: service.id,
      changedById: user.id,
      action: before ? "service.pricing_updated" : "service.created",
      before: before ?? undefined,
      after: service
    }
  });
  await writeAuditLog({
    userId: user.id,
    action: before ? "pricing.changed" : "service.created",
    entity: "ServiceOffering",
    entityId: service.id,
    before: before ?? undefined,
    after: service
  });
  revalidatePath("/pricing");
  revalidatePath("/services");
  revalidatePath("/admin/service-catalog");
  revalidatePath("/admin/pricing-workshop");
}

export async function savePricingCalculatorAction(formData: FormData) {
  const user = await requirePermission("pricing:manage");
  const parsed = calculatorSchema.parse(fromForm(formData));
  const prisma = getPrisma();
  const before = await prisma.serviceOffering.findUnique({ where: { id: parsed.serviceId } });
  const data = {
    founderSetupHours: parsed.founderSetupHours,
    founderMonthlyHours: parsed.founderMonthlyHours,
    contractorSetupHours: parsed.contractorSetupHours,
    contractorMonthlyHours: parsed.contractorMonthlyHours,
    founderHourlyCostCents: moneyToCents(formData.get("founderHourlyCost")),
    contractorHourlyCostCents: moneyToCents(formData.get("contractorHourlyCost")),
    softwareCostsCents: moneyToCents(formData.get("softwareCosts")),
    apiCostsCents: moneyToCents(formData.get("apiCosts")),
    hostingCostsCents: moneyToCents(formData.get("hostingCosts")),
    dataProviderCostsCents: moneyToCents(formData.get("dataProviderCosts")),
    advertisingManagementCents: moneyToCents(formData.get("advertisingManagementCosts")),
    supportReserveCents: moneyToCents(formData.get("supportReserve")),
    riskReserveCents: moneyToCents(formData.get("riskReserve")),
    paymentProcessingFeePercent: parsed.paymentProcessingFeePercent,
    targetGrossMargin: parsed.targetGrossMargin,
    monthlyRecoveryAmountCents: moneyToCents(formData.get("monthlyRecoveryAmount")),
    discountFloorCents: moneyToCents(formData.get("discountFloor")),
    changeReason: parsed.changeReason,
    updatedById: user.id,
    reviewDate: new Date()
  };
  const service = await prisma.serviceOffering.update({ where: { id: parsed.serviceId }, data });
  await prisma.pricingHistory.create({ data: { serviceId: service.id, changedById: user.id, action: "pricing.calculator_saved", before: before ?? undefined, after: service } });
  await writeAuditLog({ userId: user.id, action: "pricing.calculator_saved", entity: "ServiceOffering", entityId: service.id, before: before ?? undefined, after: service });
  revalidatePath("/admin/pricing-workshop");
}

export async function updatePricingStatusAction(formData: FormData) {
  const user = await requirePermission("pricing:manage");
  const parsed = z.object({
    serviceId: z.string().min(1),
    pricingStatus: z.enum(["UnderReview", "Retired"]),
    changeReason: z.string().optional()
  }).parse({
    serviceId: formData.get("serviceId"),
    pricingStatus: formData.get("pricingStatus"),
    changeReason: formData.get("changeReason")
  });
  const prisma = getPrisma();
  const before = await prisma.serviceOffering.findUnique({ where: { id: parsed.serviceId } });
  const service = await prisma.serviceOffering.update({
    where: { id: parsed.serviceId },
    data: {
      pricingStatus: parsed.pricingStatus,
      active: parsed.pricingStatus !== "Retired",
      changeReason: parsed.changeReason,
      updatedById: user.id,
      reviewDate: new Date(),
      ...(parsed.pricingStatus === "Retired" ? { employeeQuotePermission: false, alexMayQuote: false } : {})
    }
  });
  await prisma.pricingHistory.create({ data: { serviceId: service.id, changedById: user.id, action: parsed.pricingStatus === "Retired" ? "pricing.retired" : "pricing.marked_under_review", before: before ?? undefined, after: service } });
  await writeAuditLog({ userId: user.id, action: parsed.pricingStatus === "Retired" ? "pricing.retired" : "pricing.marked_under_review", entity: "ServiceOffering", entityId: service.id, before: before ?? undefined, after: service });
  revalidatePath("/admin/pricing-workshop");
  revalidatePath("/pricing");
}

export async function approvePricingAction(formData: FormData) {
  const user = await requirePermission("pricing:manage");
  const serviceId = String(formData.get("serviceId") ?? "");
  const founderConfirmation = formData.get("founderConfirmation") === "on";
  const changeReason = String(formData.get("changeReason") ?? "");
  const prisma = getPrisma();
  const before = await prisma.serviceOffering.findUniqueOrThrow({ where: { id: serviceId } });
  const errors = approvalErrors(before, founderConfirmation);
  if (errors.length > 0) {
    throw new Error(`Cannot approve pricing: ${errors.join("; ")}`);
  }

  const service = await prisma.serviceOffering.update({
    where: { id: serviceId },
    data: {
      pricingStatus: "Approved",
      approvedAt: new Date(),
      approvedById: user.id,
      effectiveDate: before.effectiveDate ?? new Date(),
      changeReason,
      reviewDate: new Date(),
      updatedById: user.id,
      alexMayQuote: before.employeeQuotePermission
    }
  });
  await prisma.pricingHistory.create({ data: { serviceId: service.id, changedById: user.id, action: "pricing.approved", before, after: service } });
  await writeAuditLog({ userId: user.id, action: "pricing.approved", entity: "ServiceOffering", entityId: service.id, before, after: service });

  const operationsUsers = await prisma.user.findMany({ where: { status: "Active", role: { name: "Operations" } }, select: { id: true } });
  if (operationsUsers.length > 0) {
    await prisma.notification.createMany({
      data: operationsUsers.map((row) => ({
        userId: row.id,
        title: `Pricing approved: ${service.name}`,
        body: "Review and acknowledge the updated approved pricing before quoting it externally.",
        href: "/pricing"
      }))
    });
  }
  revalidatePath("/admin/pricing-workshop");
  revalidatePath("/pricing");
  revalidatePath("/services");
}

export async function duplicateOfferAction(formData: FormData) {
  const user = await requirePermission("pricing:manage");
  const serviceId = String(formData.get("serviceId") ?? "");
  const source = await getPrisma().serviceOffering.findUniqueOrThrow({ where: { id: serviceId } });
  const { id: _sourceId, createdAt: _createdAt, updatedAt: _updatedAt, customPricingFields, ...copyable } = source;
  void _sourceId;
  void _createdAt;
  void _updatedAt;
  const duplicate = await getPrisma().serviceOffering.create({
    data: {
      ...copyable,
      slug: `${source.slug}-copy-${Date.now()}`,
      name: `${source.name} Copy`,
      pricingStatus: "UnderReview",
      approvedAt: null,
      approvedById: null,
      customPricingFields: customPricingFields ?? undefined,
      employeeQuotePermission: false,
      alexMayQuote: false,
      updatedById: user.id
    }
  });
  await writeAuditLog({ userId: user.id, action: "offer.duplicated", entity: "ServiceOffering", entityId: duplicate.id, after: { sourceId: source.id, duplicateId: duplicate.id } });
  revalidatePath("/admin/pricing-workshop");
}

export async function acknowledgePricingAction(formData: FormData) {
  const user = await requirePermission("pricing:read");
  const serviceId = String(formData.get("serviceId") ?? "");
  const service = await getPrisma().serviceOffering.findUniqueOrThrow({ where: { id: serviceId }, select: { id: true, updatedAt: true } });
  await getPrisma().pricingAcknowledgement.upsert({
    where: { userId_serviceId_serviceVersion: { userId: user.id, serviceId: service.id, serviceVersion: service.updatedAt } },
    update: {},
    create: { userId: user.id, serviceId: service.id, serviceVersion: service.updatedAt }
  });
  await writeAuditLog({ userId: user.id, action: "pricing.acknowledged", entity: "ServiceOffering", entityId: service.id });
  revalidatePath("/pricing");
}

export async function createServicePackageAction(formData: FormData) {
  const user = await requirePermission("pricing:manage");
  const parsed = packageSchema.parse(fromForm(formData));
  const setupPriceCents = moneyToCents(formData.get("setupPrice"));
  const monthlyPriceCents = moneyToCents(formData.get("monthlyPrice"));
  const serviceIds = formData.getAll("serviceIds").map(String).filter(Boolean);

  const pkg = await getPrisma().servicePackage.create({
    data: {
      ...parsed,
      setupPriceCents,
      monthlyPriceCents,
      optionalAddOns: lines(parsed.optionalAddOns),
      updatedById: user.id,
      items: {
        create: serviceIds.map((serviceId) => ({ serviceId }))
      }
    }
  });
  await writeAuditLog({ userId: user.id, action: "package.created", entity: "ServicePackage", entityId: pkg.id, after: pkg });
  revalidatePath("/admin/service-catalog");
}

export async function logServiceView(serviceId: string) {
  const user = await requireUser();
  await writeAuditLog({ userId: user.id, action: "service.viewed", entity: "ServiceOffering", entityId: serviceId });
}

function fromForm(formData: FormData) {
  return Object.fromEntries(formData.entries());
}

function lines(value: string | undefined) {
  return (value ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function moneyToCents(value: FormDataEntryValue | null) {
  if (!value) return undefined;
  const normalized = String(value).trim();
  if (!normalized) return undefined;
  return Math.round(Number(normalized) * 100);
}

function checkbox(defaultValue: boolean) {
  return z.preprocess((value) => {
    if (value === undefined || value === null) return defaultValue;
    return value === "on" || value === "true" || value === true;
  }, z.boolean());
}

function approvalErrors(service: ServiceOffering, founderConfirmation: boolean) {
  const errors: string[] = [];
  if (!founderConfirmation) errors.push("Founder confirmation is required");
  if (!service.standardPriceCents && !service.oneTimePriceCents && !service.standardMonthlyPriceCents && !service.monthlyPriceCents && !service.priceRangeMinCents) errors.push("standard price or approved price is required");
  if (!service.noSetupFeeRequired && service.setupFeeCents === null) errors.push("setup fee or explicit no-setup decision is required");
  if (!service.minimumTermMonths) errors.push("minimum term is required");
  if (!service.includedDeliverables.length && !service.customerFacingInclusions.length) errors.push("inclusions are required");
  if (!service.exclusions.length && !service.customerFacingExclusions.length) errors.push("exclusions are required");
  if (!service.cancellationTerms) errors.push("cancellation terms are required");
  if (service.websiteIncluded && !service.websiteOwnershipTerms) errors.push("website ownership terms are required");
  if (service.targetGrossMargin === null) errors.push("target margin is required");
  if (!service.effectiveDate) errors.push("effective date is required");
  const warnings = pricingWarnings({
    setupFeeCents: service.setupFeeCents,
    monthlyPriceCents: service.monthlyPriceCents ?? service.standardMonthlyPriceCents,
    minimumTermMonths: service.minimumTermMonths,
    founderSetupHours: Number(service.founderSetupHours ?? 0),
    founderMonthlyHours: Number(service.founderMonthlyHours ?? 0),
    contractorSetupHours: Number(service.contractorSetupHours ?? 0),
    contractorMonthlyHours: Number(service.contractorMonthlyHours ?? 0),
    founderHourlyCostCents: service.founderHourlyCostCents,
    contractorHourlyCostCents: service.contractorHourlyCostCents,
    softwareCostsCents: service.softwareCostsCents,
    apiCostsCents: service.apiCostsCents,
    hostingCostsCents: service.hostingCostsCents,
    dataProviderCostsCents: service.dataProviderCostsCents,
    advertisingManagementCents: service.advertisingManagementCents,
    supportReserveCents: service.supportReserveCents,
    riskReserveCents: service.riskReserveCents,
    paymentProcessingFeePercent: Number(service.paymentProcessingFeePercent ?? 0),
    targetGrossMargin: Number(service.targetGrossMargin ?? 0),
    monthlyRecoveryAmountCents: service.monthlyRecoveryAmountCents,
    pricingStatus: service.pricingStatus,
    employeeQuotePermission: service.employeeQuotePermission,
    websiteIncluded: service.websiteIncluded,
    cancellationTerms: service.cancellationTerms,
    websiteOwnershipTerms: service.websiteOwnershipTerms,
    scopeAssumptions: service.scopeAssumptions,
    exclusions: service.exclusions
  });
  if (warnings.includes("Quote permission enabled while pricing is UnderReview")) errors.push("quote permission cannot be enabled while pricing is UnderReview");
  return errors;
}
