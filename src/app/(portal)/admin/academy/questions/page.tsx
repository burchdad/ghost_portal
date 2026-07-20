import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { answerEmployeeQuestionAction } from "@/server/workflows/academy";

export default async function AcademyQuestionsAdminPage() {
  await requirePermission("academy:manage");
  const questions = await getPrisma().employeeQuestion.findMany({
    include: { user: true, module: true },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }]
  });

  return (
    <PageSection eyebrow="Founder admin" title="Academy Questions" description="Answer employee questions and identify repeated gaps that should become SOP improvements.">
      <div className="grid gap-4">
        {questions.length === 0 ? <Card><p className="text-sm text-white/48">No Academy questions yet.</p></Card> : null}
        {questions.map((question) => (
          <Card key={question.id}>
            <div className="flex flex-wrap gap-2">
              <Badge>{question.status}</Badge>
              <Badge>{question.urgency}</Badge>
              <Badge>{question.user.preferredName ?? question.user.name}</Badge>
            </div>
            <h3 className="mt-4 font-semibold">{question.module?.title ?? "General Academy question"}</h3>
            <p className="mt-2 text-sm leading-6 text-white/58">{question.question}</p>
            {question.answer ? <p className="mt-4 rounded-lg border border-accent/25 bg-accent/10 p-3 text-sm text-white/70">{question.answer}</p> : null}
            <form action={answerEmployeeQuestionAction} className="mt-4 grid gap-3">
              <input type="hidden" name="questionId" value={question.id} />
              <textarea name="answer" defaultValue={question.answer ?? ""} required placeholder="Stephen's answer" className="min-h-24 rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <Button variant="accent">Save answer</Button>
            </form>
          </Card>
        ))}
      </div>
    </PageSection>
  );
}
