import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { MarkdownRenderer } from "@/components/portal/markdown-renderer";
import { knowledgeArticleDefinitions, renderKnowledgeBody, renderSOPBody, sopDefinitions } from "@/server/academy/content";

const validRoutes = new Set([
  "/academy",
  "/admin/academy",
  "/approvals",
  "/calendar",
  "/clients",
  "/communications",
  "/dashboard",
  "/daily-reports",
  "/feedback",
  "/files",
  "/knowledge",
  "/leads",
  "/projects",
  "/sops",
  "/tasks"
]);

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

describe("academy content definitions", () => {
  it("defines every expected SOP with specific procedural content", () => {
    expect(sopDefinitions).toHaveLength(50);
    expect(new Set(sopDefinitions.map((definition) => definition.sourceKey)).size).toBe(50);

    for (const definition of sopDefinitions) {
      expect(definition.steps.length).toBeGreaterThanOrEqual(5);
      expect(definition.completionCriteria.length).toBeGreaterThan(0);
      expect(definition.escalationConditions.length).toBeGreaterThan(0);
      expect(definition.approvalPoints.length).toBeGreaterThan(0);
      expect(definition.qualityChecklist.length).toBeGreaterThan(0);
      expect(definition.examples.good).not.toEqual(definition.examples.bad);
      expect(renderSOPBody(definition)).not.toContain("Perform ");
      expect(renderSOPBody(definition)).not.toContain("using approved systems and keep sensitive information inside approved channels");
    }
  });

  it("keeps SOP steps meaningfully different across articles", () => {
    const signatures = sopDefinitions.map((definition) => normalized(definition.steps.map((step) => `${step.title} ${step.instruction}`).join(" ")));
    expect(new Set(signatures).size).toBe(sopDefinitions.length);
  });

  it("does not ship suspiciously identical SOP or Knowledge bodies", () => {
    const sopBodies = sopDefinitions.map((definition) => normalized(renderSOPBody(definition)));
    const articleBodies = knowledgeArticleDefinitions.map((definition) => normalized(renderKnowledgeBody(definition)));

    expect(new Set(sopBodies).size).toBe(sopDefinitions.length);
    expect(new Set(articleBodies).size).toBe(knowledgeArticleDefinitions.length);
  });

  it("defines every expected Knowledge Base article with topic-specific sections", () => {
    expect(knowledgeArticleDefinitions).toHaveLength(12);
    expect(new Set(knowledgeArticleDefinitions.map((definition) => definition.id)).size).toBe(12);

    for (const definition of knowledgeArticleDefinitions) {
      expect(definition.sections.length).toBeGreaterThanOrEqual(4);
      expect(definition.practicalExamples.length).toBeGreaterThan(0);
      expect(definition.roleImpact.length).toBeGreaterThan(0);
      expect(definition.misconceptions.length).toBeGreaterThan(0);
      expect(renderKnowledgeBody(definition)).toContain(definition.summary);
    }
  });

  it("uses only known Portal routes in related content links", () => {
    const routes = [
      ...sopDefinitions.flatMap((definition) => definition.relatedPortalRoutes),
      ...knowledgeArticleDefinitions.flatMap((definition) => definition.relatedPortalRoutes)
    ];

    for (const route of routes) {
      expect(validRoutes.has(route.path)).toBe(true);
    }
  });

  it("keeps unsafe HTML escaped through the Markdown renderer", () => {
    const html = renderToStaticMarkup(MarkdownRenderer({ content: "# Test\n\n<script>alert('x')</script>" }));

    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>alert");
  });
});
