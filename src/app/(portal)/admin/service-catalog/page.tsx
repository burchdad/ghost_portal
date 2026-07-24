import type { ServiceAddOn, ServiceOffering } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { calculatePricing, displayCategory, formatCents, pricingWarnings } from "@/lib/pricing";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { approvePricingAction, createServicePackageAction, duplicateOfferAction, savePricingCalculatorAction, updatePricingStatusAction, upsertServiceOfferingAction } from "@/server/workflows/pricing";

type WorkshopService = ServiceOffering & { addOns: ServiceAddOn[] };

const categories = [
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
];

export default async function AdminServiceCatalogPage() {
  await requirePermission("pricing:manage");
  const prisma = getPrisma();
  const [services, packages, history] = await Promise.all([
    prisma.serviceOffering.findMany({ include: { addOns: { where: { active: true }, orderBy: { name: "asc" } } }, orderBy: [{ reviewPriority: "asc" }, { displayOrder: "asc" }, { name: "asc" }] }),
    prisma.servicePackage.findMany({ include: { items: { include: { service: true } } }, orderBy: [{ active: "desc" }, { name: "asc" }] }),
    prisma.pricingHistory.findMany({ include: { changedBy: true, service: true }, orderBy: { createdAt: "desc" }, take: 10 })
  ]);

  return (
    <PageSection
      eyebrow="Founder admin"
      title="Pricing Workshop"
      description="Manage approved services, actual prices, quote permissions, approval thresholds, packages, and pricing history."
    >
      <div className="mb-5 grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Initial Approval Priority</h3>
          <div className="space-y-3">
            {services.filter((service) => service.reviewPriority <= 7).map((service) => (
              <div key={service.id} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_auto]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{service.reviewPriority}</Badge>
                    <Badge>{offerTypeLabel(service.offerType)}</Badge>
                    <Badge className={service.pricingStatus === "Approved" ? "border-accent/40 bg-accent/10 text-accent" : "border-warning/40 bg-warning/10 text-warning"}>{service.pricingStatus}</Badge>
                  </div>
                  <p className="mt-3 font-medium">{service.name}</p>
                  <p className="mt-1 text-sm leading-6 text-white/52">{service.reviewPriorityLabel ?? "Primary review candidate before Alex begins outreach."}</p>
                </div>
                <div className="text-sm text-white/58">
                  <p>Setup: {formatCents(service.setupFeeCents)}</p>
                  <p>Monthly: {formatCents(service.monthlyPriceCents)}</p>
                  <p>Term: {service.minimumTermMonths ? `${service.minimumTermMonths} months` : "Not set"}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="mb-4 text-lg font-semibold">Compare Offers</h3>
          <div className="space-y-3">
            {[
              ["Founder Launch", "Startup"],
              ["Startup", "Growth"],
              ["Standalone Custom Website", "Founder Launch"],
              ["Website Care Plan", "Founder Launch"],
              ["GEO Visibility Audit", "Founder Launch"],
              ["Vega Setup", "Growth"]
            ].map(([left, right]) => (
              <Comparison key={`${left}-${right}`} left={services.find((service) => service.name === left)} right={services.find((service) => service.name === right)} />
            ))}
          </div>
        </Card>
      </div>

      <div className="mb-5 grid gap-5">
        {services.map((service) => (
          <WorkshopOfferCard key={service.id} service={service} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <h3 className="mb-4 text-lg font-semibold">Add or Update Service</h3>
          <form action={upsertServiceOfferingAction} className="grid gap-3 lg:grid-cols-2">
            <input name="id" placeholder="Existing service ID for update" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="name" required placeholder="Service name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="slug" required placeholder="service-slug" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <select name="offerType" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="GrowthPartnership">Growth Partnership</option>
              <option value="StandaloneService">Standalone Service</option>
              <option value="ProductSubscription">Product Subscription</option>
              <option value="CustomEnterpriseEngagement">Custom Enterprise Engagement</option>
            </select>
            <select name="category" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              {categories.map((category) => <option key={category} value={category}>{displayCategory(category)}</option>)}
            </select>
            <input name="oneTimePrice" type="number" step="0.01" placeholder="One-time price" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="monthlyPrice" type="number" step="0.01" placeholder="Monthly price" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="setupFee" type="number" step="0.01" placeholder="Setup fee" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="minimumTermMonths" type="number" placeholder="Minimum term months" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="priceRangeMin" type="number" step="0.01" placeholder="Range minimum" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="priceRangeMax" type="number" step="0.01" placeholder="Range maximum" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <select name="pricingStatus" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="UnderReview">Under review</option>
              <option value="Provisional">Provisional</option>
              <option value="Approved">Approved</option>
              <option value="FounderManagedRequired">Founder-managed pricing required</option>
              <option value="CustomScope">Custom scope</option>
              <option value="Retired">Retired</option>
              <option value="Inactive">Inactive</option>
            </select>
            <select name="priceDisplayMode" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
              <option value="FounderReviewRequired">Founder review required</option>
              <option value="Fixed">Fixed</option>
              <option value="Range">Range</option>
              <option value="CustomPricing">Custom pricing</option>
            </select>
            <input name="displayOrder" type="number" placeholder="Display order" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <textarea name="shortExplanation" required placeholder="Short customer-facing explanation" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
            <textarea name="internalExplanation" required placeholder="Internal explanation" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-2" />
            <input name="idealCustomer" required placeholder="Ideal customer" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm lg:col-span-2" />
            <textarea name="problemsSolved" placeholder="Problems solved, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="includedDeliverables" placeholder="Included deliverables, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="optionalAddOns" placeholder="Optional add-ons, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="qualificationQuestions" placeholder="Qualification questions, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="commonObjections" placeholder="Common objections, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="exclusions" placeholder="Customer-facing exclusions, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="escalationTriggers" placeholder="Escalation triggers, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="approvedResponse" required placeholder="Approved response" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="desiredNextStep" required placeholder="Desired next step" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="founderNotes" placeholder="Founder notes visible to employees" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <textarea name="internalNotes" placeholder="Internal notes" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
            <input name="paymentTerms" placeholder="Payment terms" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="minimumEngagement" placeholder="Minimum engagement" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="typicalTimeline" placeholder="Typical timeline" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="approvalThreshold" placeholder="Founder approval threshold" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="websiteInclusion" placeholder="Website inclusion rules" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="websiteOwnershipTerms" placeholder="Website ownership terms" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="cancellationTerms" placeholder="Cancellation terms" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <input name="earlyCancellationTerms" placeholder="Early cancellation terms" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
            <label className="flex items-center gap-2 text-sm text-white/64"><input name="alexMayQuote" type="checkbox" /> Alex may quote directly</label>
            <label className="flex items-center gap-2 text-sm text-white/64"><input name="employeeQuotePermission" type="checkbox" /> Employee quote permission</label>
            <label className="flex items-center gap-2 text-sm text-white/64"><input name="founderApprovalRequired" type="checkbox" defaultChecked /> Founder approval required</label>
            <label className="flex items-center gap-2 text-sm text-white/64"><input name="websiteIncluded" type="checkbox" /> Website included</label>
            <label className="flex items-center gap-2 text-sm text-white/64"><input name="active" type="checkbox" defaultChecked /> Active</label>
            <Button variant="accent">Save service</Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-4 text-lg font-semibold">Package Builder</h3>
            <form action={createServicePackageAction} className="grid gap-3">
              <input name="name" required placeholder="Package name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="slug" required placeholder="package-slug" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <textarea name="description" required placeholder="Package description" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <div className="grid gap-2 rounded-lg border border-white/10 p-3">
                <p className="text-sm font-medium">Included services</p>
                {services.map((service) => (
                  <label key={service.id} className="flex items-center gap-2 text-sm text-white/64">
                    <input name="serviceIds" value={service.id} type="checkbox" /> {service.name}
                  </label>
                ))}
              </div>
              <input name="setupPrice" type="number" step="0.01" placeholder="Setup price" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="monthlyPrice" type="number" step="0.01" placeholder="Monthly price" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="discount" placeholder="Discount" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="minimumTerm" placeholder="Minimum term" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <input name="paymentSchedule" placeholder="Payment schedule" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <textarea name="includedUsage" placeholder="Included usage" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <textarea name="optionalAddOns" placeholder="Optional add-ons, one per line" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <input name="founderApprovalThreshold" placeholder="Founder approval threshold" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <label className="flex items-center gap-2 text-sm text-white/64"><input name="employeeQuotePermission" type="checkbox" /> Employee quote permission</label>
              <label className="flex items-center gap-2 text-sm text-white/64"><input name="active" type="checkbox" /> Active</label>
              <Button variant="accent">Create package</Button>
            </form>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        <SimpleTable
          columns={["ID", "Service", "Status", "Price", "Permission"]}
          empty="No services have been created."
          rows={services.map((service) => [
            <span key="id" className="font-mono text-xs text-white/44">{service.id}</span>,
            <div key="service"><p className="font-medium text-white">{service.name}</p><p className="text-xs text-white/42">{displayCategory(service.category)}</p></div>,
            <Badge key="status">{service.pricingStatus}</Badge>,
            <span key="price">{formatCents(service.oneTimePriceCents)} / {formatCents(service.monthlyPriceCents)}</span>,
            service.alexMayQuote ? "Alex may quote" : "Escalate to Stephen"
          ])}
        />

        <SimpleTable
          columns={["Package", "Included", "Price", "Status"]}
          empty="No packages have been created."
          rows={packages.map((pkg) => [
            <div key="package"><p className="font-medium text-white">{pkg.name}</p><p className="text-xs text-white/42">{pkg.description}</p></div>,
            pkg.items.map((item) => item.service.name).join(", ") || "No services selected",
            `${formatCents(pkg.setupPriceCents)} setup / ${formatCents(pkg.monthlyPriceCents)} monthly`,
            pkg.active ? <Badge key="active">Active</Badge> : <Badge key="draft">Draft</Badge>
          ])}
        />

        <SimpleTable
          columns={["When", "Action", "Service", "Changed By"]}
          empty="No pricing history yet."
          rows={history.map((entry) => [
            entry.createdAt.toLocaleString("en-US"),
            entry.action,
            entry.service?.name ?? "Package or archived service",
            entry.changedBy?.preferredName ?? entry.changedBy?.name ?? "System"
          ])}
        />
      </div>
    </PageSection>
  );
}

function WorkshopOfferCard({ service }: { service: WorkshopService }) {
  const calc = calculatePricing({
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
    monthlyRecoveryAmountCents: service.monthlyRecoveryAmountCents
  });
  const warnings = pricingWarnings({
    ...service,
    founderSetupHours: Number(service.founderSetupHours ?? 0),
    founderMonthlyHours: Number(service.founderMonthlyHours ?? 0),
    contractorSetupHours: Number(service.contractorSetupHours ?? 0),
    contractorMonthlyHours: Number(service.contractorMonthlyHours ?? 0),
    paymentProcessingFeePercent: Number(service.paymentProcessingFeePercent ?? 0),
    targetGrossMargin: Number(service.targetGrossMargin ?? 0)
  });

  return (
    <Card>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.9fr]">
        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <Badge>{offerTypeLabel(service.offerType)}</Badge>
            <Badge>{service.pricingStatus}</Badge>
            {service.websiteIncluded ? <Badge>Website included</Badge> : null}
            {service.employeeQuotePermission ? <Badge>Quote permission ready</Badge> : null}
          </div>
          <h3 className="text-xl font-semibold">{service.name}</h3>
          <p className="mt-2 text-sm leading-6 text-white/54">{service.shortExplanation}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Metric label="Setup Fee" value={formatCents(service.setupFeeCents)} />
            <Metric label="Monthly Price" value={formatCents(service.monthlyPriceCents ?? service.standardMonthlyPriceCents)} />
            <Metric label="Minimum Term" value={service.minimumTermMonths ? `${service.minimumTermMonths} months` : "Not set"} />
            <Metric label="Setup Cost" value={formatCents(calc.totalSetupCostCents)} />
            <Metric label="Monthly Cost" value={formatCents(calc.totalMonthlyDeliveryCostCents)} />
            <Metric label="Gross Margin" value={calc.grossMargin === null ? "Not set" : `${Math.round(calc.grossMargin * 100)}%`} />
            <Metric label="Break-even" value={calc.breakEvenMonth === null ? "Not reached" : `${calc.breakEvenMonth} months`} />
            <Metric label="Website Recovery" value={calc.websiteRecoveryPeriod === null ? "Not set" : `${calc.websiteRecoveryPeriod} months`} />
            <Metric label="Discount Floor" value={formatCents(service.discountFloorCents ?? calc.discountFloorCents)} />
          </div>
          {warnings.length > 0 ? (
            <div className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-4">
              <p className="mb-2 text-sm font-medium text-warning">Warnings</p>
              <div className="flex flex-wrap gap-2">
                {warnings.map((warning) => <Badge key={warning} className="border-warning/40 bg-warning/10 text-warning">{warning}</Badge>)}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <form action={savePricingCalculatorAction} className="grid gap-3 md:grid-cols-2">
            <input type="hidden" name="serviceId" value={service.id} />
            <NumberInput name="founderSetupHours" label="Founder setup hours" value={service.founderSetupHours} />
            <NumberInput name="founderMonthlyHours" label="Founder monthly hours" value={service.founderMonthlyHours} />
            <NumberInput name="contractorSetupHours" label="Contractor setup hours" value={service.contractorSetupHours} />
            <NumberInput name="contractorMonthlyHours" label="Contractor monthly hours" value={service.contractorMonthlyHours} />
            <MoneyInput name="founderHourlyCost" label="Founder hourly cost" cents={service.founderHourlyCostCents} />
            <MoneyInput name="contractorHourlyCost" label="Contractor hourly cost" cents={service.contractorHourlyCostCents} />
            <MoneyInput name="softwareCosts" label="Software costs" cents={service.softwareCostsCents} />
            <MoneyInput name="apiCosts" label="API costs" cents={service.apiCostsCents} />
            <MoneyInput name="hostingCosts" label="Hosting costs" cents={service.hostingCostsCents} />
            <MoneyInput name="dataProviderCosts" label="Data-provider costs" cents={service.dataProviderCostsCents} />
            <MoneyInput name="advertisingManagementCosts" label="Ad-management costs" cents={service.advertisingManagementCents} />
            <MoneyInput name="supportReserve" label="Support reserve" cents={service.supportReserveCents} />
            <MoneyInput name="riskReserve" label="Risk reserve" cents={service.riskReserveCents} />
            <NumberInput name="paymentProcessingFeePercent" label="Processing fee %" value={service.paymentProcessingFeePercent} />
            <NumberInput name="targetGrossMargin" label="Target margin %" value={service.targetGrossMargin} />
            <MoneyInput name="monthlyRecoveryAmount" label="Website recovery/mo" cents={service.monthlyRecoveryAmountCents} />
            <MoneyInput name="discountFloor" label="Discount floor" cents={service.discountFloorCents} />
            <input name="changeReason" placeholder="Change reason" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm md:col-span-2" />
            <Button variant="accent" className="md:col-span-2">Save calculator</Button>
          </form>

          <div className="grid gap-2 md:grid-cols-2">
            <form action={approvePricingAction} className="rounded-lg border border-white/10 bg-white/[0.035] p-3">
              <input type="hidden" name="serviceId" value={service.id} />
              <input name="changeReason" placeholder="Approval reason" className="mb-2 h-9 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-xs" />
              <label className="mb-3 flex items-center gap-2 text-xs text-white/62"><input name="founderConfirmation" type="checkbox" /> I confirm pricing is ready</label>
              <Button size="sm" variant="accent">Approve Pricing</Button>
            </form>
            <div className="grid gap-2">
              <StatusButton serviceId={service.id} status="UnderReview" label="Mark Under Review" />
              <StatusButton serviceId={service.id} status="Retired" label="Retire Offer" />
              <form action={duplicateOfferAction}><input type="hidden" name="serviceId" value={service.id} /><Button size="sm" variant="outline">Duplicate Offer</Button></form>
            </div>
          </div>

          <div className="rounded-lg border border-accent/30 bg-accent/10 p-4">
            <p className="mb-2 text-sm font-medium text-accent">Preview as Alex</p>
            <p className="text-sm leading-6 text-white/66">{service.approvedWording ?? service.shortExplanation}</p>
            <p className="mt-2 text-sm text-white/52">Price: {service.pricingStatus === "Approved" ? formatCents(service.monthlyPriceCents ?? service.oneTimePriceCents) : "Founder review required."}</p>
            <p className="mt-1 text-sm text-white/52">Setup: {service.pricingStatus === "Approved" ? formatCents(service.setupFeeCents) : "Founder review required."}</p>
            <p className="mt-1 text-sm text-white/52">Escalate: {service.escalationTriggers.join(", ") || "Founder approval required."}</p>
          </div>
        </div>
      </div>
    </Card>
  );
}

function Comparison({ left, right }: { left?: WorkshopService; right?: WorkshopService }) {
  if (!left || !right) return null;
  const leftCalc = calculatePricing({ monthlyPriceCents: left.monthlyPriceCents, setupFeeCents: left.setupFeeCents, founderMonthlyHours: Number(left.founderMonthlyHours ?? 0), contractorMonthlyHours: Number(left.contractorMonthlyHours ?? 0), founderHourlyCostCents: left.founderHourlyCostCents, contractorHourlyCostCents: left.contractorHourlyCostCents, softwareCostsCents: left.softwareCostsCents, targetGrossMargin: Number(left.targetGrossMargin ?? 0) });
  const rightCalc = calculatePricing({ monthlyPriceCents: right.monthlyPriceCents, setupFeeCents: right.setupFeeCents, founderMonthlyHours: Number(right.founderMonthlyHours ?? 0), contractorMonthlyHours: Number(right.contractorMonthlyHours ?? 0), founderHourlyCostCents: right.founderHourlyCostCents, contractorHourlyCostCents: right.contractorHourlyCostCents, softwareCostsCents: right.softwareCostsCents, targetGrossMargin: Number(right.targetGrossMargin ?? 0) });
  return (
    <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm md:grid-cols-2">
      {[{ offer: left, calc: leftCalc }, { offer: right, calc: rightCalc }].map(({ offer, calc }) => (
        <div key={offer.id}>
          <p className="font-medium text-white">{offer.name}</p>
          <p className="text-white/52">Price: {formatCents(offer.monthlyPriceCents ?? offer.oneTimePriceCents)}</p>
          <p className="text-white/52">Setup: {formatCents(offer.setupFeeCents)}</p>
          <p className="text-white/52">Term: {offer.minimumTermMonths ? `${offer.minimumTermMonths} months` : "Not set"}</p>
          <p className="text-white/52">Hours: {Number(offer.founderMonthlyHours ?? 0) + Number(offer.contractorMonthlyHours ?? 0)}/mo</p>
          <p className="text-white/52">Cost: {formatCents(calc.totalMonthlyDeliveryCostCents)}</p>
          <p className="text-white/52">Margin: {calc.grossMargin === null ? "Not set" : `${Math.round(calc.grossMargin * 100)}%`}</p>
        </div>
      ))}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-white/10 bg-black/18 p-3"><p className="text-xs text-white/40">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>;
}

function MoneyInput({ name, label, cents }: { name: string; label: string; cents: number | null }) {
  return <input name={name} type="number" step="0.01" defaultValue={cents ? cents / 100 : ""} placeholder={label} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />;
}

function NumberInput({ name, label, value }: { name: string; label: string; value: unknown }) {
  return <input name={name} type="number" step="0.01" defaultValue={value === null || value === undefined ? "" : String(value)} placeholder={label} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />;
}

function StatusButton({ serviceId, status, label }: { serviceId: string; status: "UnderReview" | "Retired"; label: string }) {
  return <form action={updatePricingStatusAction}><input type="hidden" name="serviceId" value={serviceId} /><input type="hidden" name="pricingStatus" value={status} /><Button size="sm" variant="outline">{label}</Button></form>;
}

function offerTypeLabel(value: string) {
  if (value === "GrowthPartnership") return "Growth Partnership";
  if (value === "ProductSubscription") return "Product Subscription";
  if (value === "CustomEnterpriseEngagement") return "Custom Enterprise";
  return "Standalone Service";
}
