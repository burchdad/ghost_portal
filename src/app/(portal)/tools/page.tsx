import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getMissionControlTools } from "@/server/data/mission-control-clients";
import { requirePermission } from "@/server/permissions/authorize";

export default async function ToolsPage() {
  await requirePermission("clients:read:all");
  const missionControl = await getMissionControlTools();

  return (
    <PageSection
      eyebrow="Internal"
      title="Tools"
      description="Ghost-owned products, internal assets, and utility systems are tracked separately from external client accounts."
    >
      {!missionControl.ok ? (
        <Card className="mb-5">
          <h3 className="font-semibold">Mission Control tools unavailable</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">{missionControl.reason}</p>
        </Card>
      ) : null}
      <SimpleTable
        columns={["Tool", "Status", "Purpose", "Website"]}
        empty="No internal tools are mapped from Mission Control yet."
        rows={missionControl.ok ? missionControl.clients.map((tool) => [
          <span key="tool" className="font-medium text-white">{tool.clientName}</span>,
          <Badge key="stage">{tool.stage}</Badge>,
          tool.services.length ? tool.services.join(", ") : tool.plan || "Not mapped",
          tool.websiteUrl ? <a key="website" href={tool.websiteUrl} className="text-accent" target="_blank" rel="noreferrer">{safeHostname(tool.websiteUrl)}</a> : "Not set"
        ]) : []}
      />
    </PageSection>
  );
}

function safeHostname(href: string) {
  try {
    return new URL(href).hostname;
  } catch {
    return href;
  }
}
