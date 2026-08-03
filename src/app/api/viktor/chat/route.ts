import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/server/auth/session";
import { env } from "@/server/env/env";
import { buildViktorGrowthContext, formatViktorContext } from "@/server/viktor/growth-context";

export const dynamic = "force-dynamic";

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(4000)
  })).min(1).max(12)
});

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid Viktor request." }, { status: 400 });

  const messages = parsed.data.messages.slice(-8);
  const context = await buildViktorGrowthContext(user);
  const actions = [...context.opportunities, ...context.risks, { label: "Open CRM board", href: "/crm", detail: "Review pipeline columns and active revenue opportunities." }, { label: "Open pricing", href: "/pricing", detail: "Review approved offers and pricing guardrails." }].slice(0, 6);

  if (!env.OPENAI_API_KEY) {
    return NextResponse.json({
      message: [
        "Viktor is ready, but the OpenAI API key is not configured in this environment.",
        "",
        context.summary,
        "",
        "Start with the warmest opportunities, clear sync gaps, and keep pricing exceptions routed to Stephen."
      ].join("\n"),
      actions
    });
  }

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.VIKTOR_OPENAI_MODEL ?? process.env.NOVA_OPENAI_MODEL ?? "gpt-4o-mini",
      instructions: viktorInstructions(user.role),
      input: formatViktorInput(context, messages),
      temperature: 0.35,
      max_output_tokens: 950
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error("Viktor OpenAI request failed", response.status, detail.slice(0, 500));
    return NextResponse.json({ error: "Viktor could not complete that request. Try again in a moment." }, { status: 502 });
  }

  const data = await response.json() as { output_text?: string };
  return NextResponse.json({ message: data.output_text?.trim() || "Viktor did not return a response.", actions });
}

function viktorInstructions(role: string) {
  return [
    "You are Viktor, Ghost AI Solutions' growth strategy agent.",
    "Focus on revenue growth, offer strategy, pipeline movement, sales experiments, positioning, and expansion opportunities.",
    "Use the supplied growth context. Do not invent leads, prices, revenue, client facts, commitments, or campaign results.",
    "Coordinate with Nova as the executive command layer. Flag founder decisions, pricing exceptions, legal/contract issues, risky claims, and client-facing promises for Stephen.",
    "When giving recommendations, make them operational: what to pursue, why, next action, owner suggestion, and risk.",
    `The current user role is ${role}; respect that role in recommendations.`
  ].join("\n");
}

function formatViktorInput(context: Awaited<ReturnType<typeof buildViktorGrowthContext>>, messages: Array<{ role: "user" | "assistant"; content: string }>) {
  return [
    "Growth context:",
    formatViktorContext(context),
    "",
    "Conversation:",
    ...messages.map((message) => `${message.role === "user" ? "User" : "Viktor"}: ${message.content}`)
  ].join("\n");
}
