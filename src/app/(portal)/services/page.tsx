import Link from "next/link";
import type { ReactNode } from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageSection } from "@/components/portal/page-section";
import { canEmployeeQuoteOffer, displayCategory, formatCents } from "@/lib/pricing";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";

export default async function ServiceCatalogPage() {
  const user = await requirePermission("pricing:read");
  const services = await getPrisma().serviceOffering.findMany({
    where: { active: true, archivedAt: null },
    orderBy: [{ displayOrder: "asc" }, { name: "asc" }]
  });
  await writeAuditLog({ userId: user.id, action: "service_catalog.viewed", entity: "ServiceOffering" });

  return (
    <PageSection
      eyebrow="Sales enablement"
      title="Service Catalog"
      description="Approved internal explanations for what Ghost AI Solutions sells, who each service helps, and when Alex should bring Stephen in."
    >
      <div className="mb-5 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/pricing">Open pricing</Link>
        </Button>
      </div>

      {services.length === 0 ? (
        <Card>
          <p className="text-sm leading-6 text-white/58">
            No active approved services are available yet. Stephen can add services in Founder admin before Alex begins outreach.
          </p>
        </Card>
      ) : (
        <div className="grid gap-5 xl:grid-cols-2">
          {services.map((service) => (
            <Card key={service.id}>
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <Badge>{displayCategory(service.category)}</Badge>
                {canEmployeeQuoteOffer(service) ? (
                  <Badge className="border-accent/40 bg-accent/10 text-accent">Approved to quote</Badge>
                ) : (
                  <Badge className="border-warning/40 bg-warning/10 text-warning">Stephen approval required</Badge>
                )}
                {service.pricingStatus === "UnderReview" ? <Badge>Under review</Badge> : null}
                {service.pricingStatus === "CustomScope" ? <Badge>Custom scope</Badge> : null}
              </div>
              <h3 className="text-xl font-semibold">{service.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/64">{service.shortExplanation}</p>
              {service.pricingStatus === "UnderReview" ? (
                <p className="mt-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm leading-6 text-warning">
                  Pricing is currently under Founder review and may not be quoted without approval.
                </p>
              ) : null}
              <p className="mt-4 text-sm leading-6 text-white/50">{service.internalExplanation}</p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <InfoBlock title="Standard pricing">
                  <p>One-time: {formatCents(service.oneTimePriceCents)}</p>
                  <p>Monthly: {formatCents(service.monthlyPriceCents)}</p>
                  {service.priceRangeMinCents || service.priceRangeMaxCents ? (
                    <p>
                      Range: {formatCents(service.priceRangeMinCents)} - {formatCents(service.priceRangeMaxCents)}
                    </p>
                  ) : null}
                </InfoBlock>
                <InfoBlock title="Next step">
                  <p>{service.desiredNextStep}</p>
                </InfoBlock>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <ListBlock title="Problems solved" items={service.problemsSolved} />
                <ListBlock title="Included deliverables" items={service.includedDeliverables} />
              </div>

              <div className="mt-5 rounded-lg border border-warning/30 bg-warning/10 p-4 text-sm leading-6 text-warning">
                <div className="mb-2 flex items-center gap-2 font-medium">
                  <CircleAlert className="size-4" />
                  Pricing and scope boundary
                </div>
                Alex should not promise pricing, scope, results, timelines, integrations, or discounts beyond what is explicitly approved here and on the Pricing page.
              </div>

              <div className="mt-4 flex items-center gap-2 text-sm text-white/54">
                <CheckCircle2 className="size-4 text-accent" />
                <span>{service.approvedResponse}</span>
              </div>
            </Card>
          ))}
        </div>
      )}
    </PageSection>
  );
}

function InfoBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/62">
      <p className="mb-2 font-medium text-white">{title}</p>
      {children}
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-sm font-medium text-white">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm text-white/42">Not specified.</p>
      ) : (
        <ul className="space-y-2 text-sm text-white/58">
          {items.map((item) => (
            <li key={item}>- {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
