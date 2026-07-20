import { notFound, redirect } from "next/navigation";
import { MarkdownRenderer } from "@/components/portal/markdown-renderer";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function SOPDetailPage({ params }: { params: Promise<{ sopId: string }> }) {
  const user = await requireUser();
  const { sopId } = await params;
  const sop = await getPrisma().sOPArticle.findUnique({ where: { id: sopId }, include: { steps: { orderBy: { stepNumber: "asc" } } } });
  if (!sop) notFound();
  if (user.role !== "Founder" && (!sop.published || !sop.audienceRoles.includes(user.role))) redirect("/access-denied");

  return (
    <PageSection eyebrow="SOP Library" title={sop.title} description={sop.purpose}>
      <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
        <Card>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge>{sop.category}</Badge>
            <Badge>v{sop.version}</Badge>
            {sop.founderReviewRequired ? <Badge className="border-warning/40 bg-warning/10 text-warning">Founder review required</Badge> : null}
          </div>
          <MarkdownRenderer content={sop.body} />
          <div className="mt-6 space-y-3">
            {sop.steps.map((step) => (
              <div key={step.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                <h3 className="font-semibold">{step.stepNumber}. {step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{step.instruction}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="font-semibold">Procedure Details</h3>
          <Info label="Owner" value={sop.owner} />
          <Info label="Trigger" value={sop.trigger} />
          <List label="Required inputs" values={sop.requiredInputs} />
          <List label="Approval points" values={sop.approvalPoints} />
          <List label="Escalation conditions" values={sop.escalationConditions} />
          <List label="Completion criteria" values={sop.completionCriteria} />
        </Card>
      </div>
    </PageSection>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <p className="mt-4 text-sm text-white/58"><span className="block text-xs uppercase tracking-[0.16em] text-white/34">{label}</span>{value}</p>;
}

function List({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4">
      <p className="text-xs uppercase tracking-[0.16em] text-white/34">{label}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-white/58">
        {values.map((value) => <li key={value}>{value}</li>)}
      </ul>
    </div>
  );
}
