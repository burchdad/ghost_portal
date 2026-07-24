import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { canEmployeeQuoteOffer, displayCategory, formatCents } from "@/lib/pricing";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { acknowledgePricingAction } from "@/server/workflows/pricing";

const filters = [
  ["all", "All"],
  ["growth", "Growth Partnerships"],
  ["products", "Standalone Products"],
  ["services", "Standalone Services"],
  ["enterprise", "Custom Enterprise"],
  ["quoteable", "Quoteable by Alex"],
  ["approval", "Stephen approval required"],
  ["one-time", "One-time"],
  ["monthly", "Monthly recurring"],
  ["custom", "Custom scope"],
  ["website", "Website"],
  ["ai", "AI"],
  ["marketing", "Marketing"],
  ["lead-generation", "Lead generation"],
  ["seo", "SEO / GEO"],
  ["applications", "Applications"]
] as const;

export default async function PricingPage({ searchParams }: { searchParams?: Promise<{ filter?: string }> }) {
  const user = await requirePermission("pricing:read");
  const params = await searchParams;
  const filter = params?.filter ?? "all";
  const prisma = getPrisma();
  const services = await prisma.serviceOffering.findMany({
    where: { active: true, archivedAt: null },
    include: { addOns: { where: { active: true }, orderBy: { name: "asc" } } },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
  });
  const acknowledgements = await prisma.pricingAcknowledgement.findMany({
    where: { userId: user.id },
    select: { serviceId: true, serviceVersion: true }
  });
  const acknowledged = new Set(acknowledgements.map((item) => `${item.serviceId}:${item.serviceVersion.toISOString()}`));
  await writeAuditLog({ userId: user.id, action: "pricing.viewed", entity: "ServiceOffering" });

  const filtered = services.filter((service) => {
    if (filter === "quoteable") return service.alexMayQuote;
    if (filter === "growth") return service.offerType === "GrowthPartnership";
    if (filter === "products") return service.offerType === "ProductSubscription";
    if (filter === "services") return service.offerType === "StandaloneService";
    if (filter === "enterprise") return service.offerType === "CustomEnterpriseEngagement";
    if (filter === "approval") return service.founderApprovalRequired;
    if (filter === "one-time") return service.oneTimePriceCents !== null;
    if (filter === "monthly") return service.monthlyPriceCents !== null;
    if (filter === "custom") return service.pricingStatus === "CustomScope";
    if (filter === "website") return service.category === "Websites" || service.category === "WebsiteCare";
    if (filter === "ai") return service.category === "AIAutomation" || service.category === "CustomAISystems";
    if (filter === "marketing") return service.category === "Marketing" || service.category === "SocialMedia";
    if (filter === "lead-generation") return service.category === "LeadGeneration";
    if (filter === "seo") return service.category === "SEOAEO_GEO";
    if (filter === "applications") return service.category === "Applications";
    return true;
  });

  return (
    <PageSection
      eyebrow="Approved pricing"
      title="Pricing"
      description="Actual approved prices Alex may reference, plus clear approval boundaries for services that need Stephen's review."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        {filters.map(([value, label]) => (
          <Button key={value} asChild variant={filter === value ? "accent" : "outline"} size="sm">
            <Link href={value === "all" ? "/pricing" : `/pricing?filter=${value}`}>{label}</Link>
          </Button>
        ))}
      </div>

      <SimpleTable
        columns={["Offer", "Pricing", "Permission", "Terms", "Last Updated"]}
        empty="No active pricing records match this filter."
        rows={filtered.map((service) => [
          <div key="service">
            <p className="font-medium text-white">{service.name}</p>
            <p className="mt-1 text-xs text-white/42">{offerTypeLabel(service.offerType)} / {displayCategory(service.category)}</p>
            {service.pricingStatus === "UnderReview" ? (
              <p className="mt-2 rounded-md border border-warning/30 bg-warning/10 px-2 py-1 text-xs leading-5 text-warning">
                Pricing is currently under Founder review and may not be quoted without approval.
              </p>
            ) : null}
            {service.pricingStatus === "Approved" && !acknowledged.has(`${service.id}:${service.updatedAt.toISOString()}`) ? (
              <form action={acknowledgePricingAction} className="mt-2">
                <input type="hidden" name="serviceId" value={service.id} />
                <Button size="sm" variant="outline">Acknowledge pricing</Button>
              </form>
            ) : null}
          </div>,
          <div key="fees" className="space-y-1">
            <p>Setup: {formatCents(service.setupFeeCents)}</p>
            <p>One-time: {formatCents(service.oneTimePriceCents)}</p>
            <p>Monthly: {formatCents(service.monthlyPriceCents)}</p>
            {service.priceRangeMinCents || service.priceRangeMaxCents ? <p>Range: {formatCents(service.priceRangeMinCents)} - {formatCents(service.priceRangeMaxCents)}</p> : null}
            {service.addOns.length > 0 ? <p className="text-xs text-white/44">Add-ons: {service.addOns.map((addon) => addon.name).join(", ")}</p> : null}
          </div>,
          canEmployeeQuoteOffer(service) ? (
            <Badge key="quote" className="border-accent/40 bg-accent/10 text-accent">Approved to quote</Badge>
          ) : (
            <div key="quote" className="space-y-2">
              <Badge className="border-warning/40 bg-warning/10 text-warning">Founder approval required</Badge>
              {service.pricingStatus === "UnderReview" ? <Badge>Under review</Badge> : null}
              {service.priceDisplayMode === "CustomPricing" ? <Badge>Custom pricing</Badge> : null}
              {service.websiteIncluded ? <Badge>Website included</Badge> : <Badge>Website available as add-on</Badge>}
            </div>
          ),
          <div key="approval" className="space-y-2">
            {service.minimumTermMonths ? <Badge>{service.minimumTermMonths}-month minimum</Badge> : <Badge>Term Founder editable</Badge>}
            {service.monthlyPriceCents !== null ? <Badge>Monthly recurring</Badge> : null}
            {service.oneTimePriceCents !== null ? <Badge>One-time</Badge> : null}
            {service.setupFeeCents !== null ? <Badge>Setup fee</Badge> : null}
            {service.financingStatus !== "FinancingUnavailable" ? <Badge>Financing may be available</Badge> : null}
            <p className="text-xs leading-5 text-white/44">{service.customerFacingNotes ?? service.paymentTerms ?? "Founder review required."}</p>
          </div>,
          service.updatedAt.toLocaleDateString("en-US")
        ])}
      />

      <Card className="mt-5">
        <p className="text-sm leading-6 text-white/58">
          Employee pricing excludes sensitive internal costs, margins, vendor costs, and founder compensation. When a service is marked custom scope or not directly quoteable, Alex should schedule or request Stephen review.
        </p>
      </Card>
    </PageSection>
  );
}

function offerTypeLabel(offerType: string) {
  if (offerType === "GrowthPartnership") return "Growth Partnership";
  if (offerType === "ProductSubscription") return "Standalone Product";
  if (offerType === "StandaloneService") return "Standalone Service";
  return "Custom Enterprise";
}
