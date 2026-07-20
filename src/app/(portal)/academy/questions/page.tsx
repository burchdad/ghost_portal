import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { markEmployeeQuestionResolvedAction } from "@/server/workflows/academy";

export default async function AcademyQuestionsPage() {
  const user = await requireUser();
  const questions = await getPrisma().employeeQuestion.findMany({
    where: { userId: user.id },
    include: { module: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <PageSection eyebrow="Ghost Academy" title="My Questions" description="Questions submitted to Stephen from Academy modules.">
      <div className="grid gap-4">
        {questions.length === 0 ? <Card><p className="text-sm text-white/48">No questions submitted yet.</p></Card> : null}
        {questions.map((question) => (
          <Card key={question.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge>{question.status}</Badge>
                <h3 className="mt-3 font-semibold">{question.module?.title ?? "General Academy question"}</h3>
                <p className="mt-2 text-sm leading-6 text-white/58">{question.question}</p>
                {question.answer ? <p className="mt-4 rounded-lg border border-accent/25 bg-accent/10 p-3 text-sm text-white/70">{question.answer}</p> : null}
              </div>
              {question.answer && question.status !== "Resolved" ? (
                <form action={markEmployeeQuestionResolvedAction}>
                  <input type="hidden" name="questionId" value={question.id} />
                  <Button variant="outline">Mark resolved</Button>
                </form>
              ) : null}
            </div>
          </Card>
        ))}
      </div>
    </PageSection>
  );
}
