import { Bot, Eye, Megaphone, Rocket, Target, TrendingUp } from "lucide-react";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { buildNovaSummary } from "@/server/data/dashboard";
import { ghostAgentNetwork } from "@/server/nova/agent-network";
import { requireUser } from "@/server/permissions/authorize";
import { NovaChat } from "@/app/(portal)/nova/nova-chat";

export default async function NovaPage() {
  const user = await requireUser();
  const summary = await buildNovaSummary(user);
  const userName = user.preferredName ?? user.name;

  return (
    <PageSection eyebrow="Nova" title="Executive Command Agent" description="Nova is the CEO-style command layer for Ghost priorities, decisions, delegation, and specialist agent routing.">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {ghostAgentNetwork.map((agent) => {
            const Icon = iconForAgent(agent.id);
            return (
              <Card key={agent.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Icon className="size-4" />
                  </div>
                  <Badge>{agent.role}</Badge>
                </div>
                <h3 className="mt-4 text-base font-semibold">{agent.name}</h3>
                <p className="mt-2 min-h-20 text-sm leading-6 text-white/58">{agent.purpose}</p>
              </Card>
            );
          })}
        </div>

        <NovaChat summary={summary} userName={userName} userRole={user.role} />
      </div>
    </PageSection>
  );
}

function iconForAgent(agentId: string) {
  if (agentId === "nova") return Bot;
  if (agentId === "viktor") return TrendingUp;
  if (agentId === "vega") return Target;
  if (agentId === "geo") return Eye;
  if (agentId === "echo") return Megaphone;
  return Rocket;
}
