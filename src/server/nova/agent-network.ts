export type GhostAgent = {
  id: "nova" | "viktor" | "vega" | "geo" | "echo";
  name: string;
  role: string;
  purpose: string;
  owns: string[];
  escalation: string;
  href: string;
};

export const ghostAgentNetwork: GhostAgent[] = [
  {
    id: "nova",
    name: "Nova",
    role: "Executive command",
    purpose: "CEO-style operating intelligence for priorities, decisions, risk, delegation, and company awareness.",
    owns: ["Founder briefing", "Decision triage", "Cross-tool summaries", "Delegation", "Risk and escalation"],
    escalation: "Routes decisions, authority questions, and high-risk commitments to Stephen.",
    href: "/nova"
  },
  {
    id: "viktor",
    name: "Viktor",
    role: "Growth strategy",
    purpose: "Growth loops, revenue strategy, offer direction, experiments, positioning, and expansion planning.",
    owns: ["Growth experiments", "Revenue strategy", "Offer refinement", "Weekly growth focus", "Expansion opportunities"],
    escalation: "Nova should bring Viktor into growth questions, but Stephen approves final strategy.",
    href: "/crm"
  },
  {
    id: "vega",
    name: "Vega",
    role: "Sales and lead generation",
    purpose: "Lead discovery, qualification, prioritization, outreach support, and pipeline movement.",
    owns: ["Lead scoring", "Pipeline prioritization", "Outreach angles", "Follow-up strategy", "Discovery handoffs"],
    escalation: "Vega can recommend sales moves, but pricing exceptions and commitments need Stephen.",
    href: "/leads"
  },
  {
    id: "geo",
    name: "GEO",
    role: "Visibility intelligence",
    purpose: "SEO, AEO, and generative engine visibility signals for discoverability and reputation.",
    owns: ["Visibility audits", "Search/AEO/GEO signals", "Content visibility gaps", "Citation opportunities", "Performance questions"],
    escalation: "GEO cannot guarantee rankings or AI-search placement; Stephen approves client-facing claims.",
    href: "/pricing?filter=seo"
  },
  {
    id: "echo",
    name: "Echo",
    role: "Marketing and content operations",
    purpose: "Content drafting, campaign organization, social media, repurposing, and brand consistency.",
    owns: ["Campaign drafts", "Content calendars", "Social posts", "Repurposing", "Brand voice"],
    escalation: "Echo drafts need review before public publishing, especially claims, pricing, and client references.",
    href: "/communications"
  }
];

export function formatAgentNetworkForNova() {
  return ghostAgentNetwork
    .map((agent) => `${agent.name}: ${agent.role}. ${agent.purpose} Owns: ${agent.owns.join(", ")}. Escalation: ${agent.escalation}`)
    .join("\n");
}

export function agentsForMessage(message: string) {
  const lower = message.toLowerCase();
  return ghostAgentNetwork.filter((agent) => {
    if (agent.id === "nova") return mentions(lower, ["nova", "ceo", "executive", "decision", "priority", "delegate", "risk", "company"]);
    if (agent.id === "viktor") return mentions(lower, ["viktor", "growth", "grow", "revenue", "strategy", "experiment", "positioning", "offer"]);
    if (agent.id === "vega") return mentions(lower, ["vega", "sales", "lead", "leads", "pipeline", "outreach", "prospect", "call"]);
    if (agent.id === "geo") return mentions(lower, ["geo", "seo", "aeo", "visibility", "search", "ranking", "discoverability"]);
    if (agent.id === "echo") return mentions(lower, ["echo", "marketing", "content", "social", "campaign", "post", "newsletter", "brand"]);
    return false;
  });
}

function mentions(input: string, words: string[]) {
  return words.some((word) => input.includes(word));
}
