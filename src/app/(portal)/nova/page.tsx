import Link from "next/link";
import { ArrowUpRight, Bot, Eye, Megaphone, Rocket, Target, TrendingUp } from "lucide-react";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { buildNovaSummary } from "@/server/data/dashboard";
import { ghostAgentNetwork } from "@/server/nova/agent-network";
import { requireUser } from "@/server/permissions/authorize";
import { NovaChat } from "@/app/(portal)/nova/nova-chat";

export default async function NovaPage() {
  const user = await requireUser();
  const summary = await buildNovaSummary(user);
  const userName = user.preferredName ?? user.name;

  return (
    <PageSection eyebrow="AI Agents" title="Executive Command Agent" description="Nova is the CEO-style command layer for Ghost priorities, decisions, delegation, and specialist agent routing.">
      <div className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {ghostAgentNetwork.map((agent) => {
            const Icon = iconForAgent(agent.id);
            return (
              <Link
                key={agent.id}
                href={agent.href}
                className="group rounded-lg border border-white/10 bg-white/[0.055] p-4 shadow-2xl shadow-black/20 backdrop-blur transition hover:border-accent/40 hover:bg-accent/10"
                aria-label={`Open ${agent.name}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex size-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <Icon className="size-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{agent.role}</Badge>
                    <ArrowUpRight className="size-4 text-white/35 transition group-hover:text-accent" />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-semibold">{agent.name}</h3>
                <p className="mt-2 min-h-20 text-sm leading-6 text-white/58">{agent.purpose}</p>
              </Link>
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
