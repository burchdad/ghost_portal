import { AlertTriangle, DollarSign, Flame, RefreshCw } from "lucide-react";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/permissions/authorize";
import { buildViktorGrowthContext } from "@/server/viktor/growth-context";
import { ViktorChat } from "@/app/(portal)/viktor/viktor-chat";

export default async function ViktorPage() {
  const user = await requireUser();
  const context = await buildViktorGrowthContext(user);
  const userName = user.preferredName ?? user.name;

  return (
    <PageSection eyebrow="Viktor" title="Growth Strategy Agent" description="Revenue growth, offer focus, pipeline movement, positioning, and expansion planning.">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {context.metrics.map((metric) => (
            <Card key={metric.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
                  {iconForMetric(metric.label)}
                </div>
                <Badge>{metric.label}</Badge>
              </div>
              <p className="mt-4 text-2xl font-semibold">{metric.value}</p>
              <p className="mt-2 text-sm leading-6 text-white/58">{metric.detail}</p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="p-4">
            <h3 className="font-semibold">Top Opportunities</h3>
            <div className="mt-3 space-y-2">
              {context.opportunities.slice(0, 3).map((action) => (
                <a key={`${action.href}-${action.label}`} href={action.href} className="block rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/68 hover:border-warning/40 hover:bg-warning/10">
                  <span className="font-medium text-white">{action.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-white/45">{action.detail}</span>
                </a>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold">Growth Risks</h3>
            <div className="mt-3 space-y-2">
              {context.risks.slice(0, 3).map((action) => (
                <a key={`${action.href}-${action.label}`} href={action.href} className="block rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/68 hover:border-warning/40 hover:bg-warning/10">
                  <span className="font-medium text-white">{action.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-white/45">{action.detail}</span>
                </a>
              ))}
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold">Offer Focus</h3>
            <div className="mt-3 space-y-2">
              {context.offers.slice(0, 3).map((action) => (
                <a key={`${action.href}-${action.label}`} href={action.href} className="block rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/68 hover:border-warning/40 hover:bg-warning/10">
                  <span className="font-medium text-white">{action.label}</span>
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-white/45">{action.detail}</span>
                </a>
              ))}
            </div>
          </Card>
        </div>

        <ViktorChat summary={context.summary} userName={userName} userRole={user.role} />
      </div>
    </PageSection>
  );
}

function iconForMetric(label: string) {
  if (label === "Open pipeline") return <DollarSign className="size-4" />;
  if (label === "Warm leads") return <Flame className="size-4" />;
  if (label === "Follow-up due") return <AlertTriangle className="size-4" />;
  return <RefreshCw className="size-4" />;
}
