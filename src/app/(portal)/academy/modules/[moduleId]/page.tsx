import { notFound, redirect } from "next/navigation";
import { MarkdownRenderer } from "@/components/portal/markdown-renderer";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { completeAcademyModuleAction, saveModuleNoteAction, submitEmployeeQuestionAction, submitKnowledgeCheckAction } from "@/server/workflows/academy";

export default async function AcademyModulePage({ params }: { params: Promise<{ moduleId: string }> }) {
  const user = await requireUser();
  const { moduleId } = await params;
  const courseModule = await getPrisma().courseModule.findFirst({
    where: {
      id: moduleId,
      archivedAt: null,
      ...(user.role === "Founder" ? {} : { published: true, audienceRoles: { has: user.role } })
    },
    include: {
      course: { include: { path: true } },
      sections: { orderBy: { sortOrder: "asc" } },
      resources: { orderBy: { sortOrder: "asc" } },
      knowledgeCheck: { include: { questions: { include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } }, attempts: { where: { userId: user.id }, orderBy: { submittedAt: "desc" }, take: 3 } } },
      completions: { where: { userId: user.id } },
      acknowledgements: { where: { userId: user.id } },
      notes: { where: { userId: user.id } },
      questions: { where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 5 }
    }
  });

  if (!courseModule) notFound();
  const assigned = await getPrisma().learningPathAssignment.findFirst({ where: { userId: user.id, pathId: courseModule.course.pathId } });
  if (user.role !== "Founder" && !assigned) redirect("/access-denied");

  const completed = courseModule.completions.some((completion) => completion.moduleVersion === courseModule.version);
  const passed = courseModule.knowledgeCheck?.attempts.some((attempt) => attempt.status === "Passed") ?? false;
  const canComplete = (!courseModule.knowledgeCheckRequired || passed) && !completed;

  return (
    <PageSection eyebrow="Ghost Academy" title={courseModule.title} description={courseModule.summary}>
      <div className="grid gap-5 xl:grid-cols-[1fr_330px]">
        <div className="space-y-5">
          <Card>
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge>{courseModule.required ? "Required" : "Optional"}</Badge>
              <Badge>v{courseModule.version}</Badge>
              <Badge>{courseModule.estimatedMinutes} min</Badge>
              <Badge>{completed ? "Completed" : "Open"}</Badge>
              {courseModule.founderReviewRequired ? <Badge className="border-warning/40 bg-warning/10 text-warning">Founder review required</Badge> : null}
            </div>
            <h3 className="mb-3 font-semibold">Learning Objectives</h3>
            <ul className="mb-6 list-disc space-y-1 pl-5 text-sm text-white/58">
              {courseModule.learningObjectives.map((objective) => <li key={objective}>{objective}</li>)}
            </ul>
            <MarkdownRenderer content={courseModule.body} />
          </Card>

          {courseModule.sections.map((section) => (
            <Card key={section.id}>
              <h3 className="mb-3 font-semibold">{section.heading}</h3>
              <MarkdownRenderer content={section.body} />
            </Card>
          ))}

          {courseModule.knowledgeCheck ? (
            <Card>
              <h3 className="font-semibold">Knowledge Check</h3>
              <p className="mt-2 text-sm text-white/52">Passing score: {courseModule.knowledgeCheck.passingScore}% · unlimited retries for the trial.</p>
              {courseModule.knowledgeCheck.attempts[0] ? (
                <Badge className="mt-4">{courseModule.knowledgeCheck.attempts[0].status}: {courseModule.knowledgeCheck.attempts[0].score}%</Badge>
              ) : null}
              <form action={submitKnowledgeCheckAction} className="mt-5 space-y-5">
                <input type="hidden" name="checkId" value={courseModule.knowledgeCheck.id} />
                <input type="hidden" name="moduleId" value={courseModule.id} />
                {courseModule.knowledgeCheck.questions.map((question) => (
                  <div key={question.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                    <p className="font-medium">{question.prompt}</p>
                    {question.type === "ShortResponse" ? (
                      <textarea name={`question_${question.id}`} required className="mt-3 min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
                    ) : (
                      <div className="mt-3 space-y-2">
                        {question.options.map((option) => (
                          <label key={option.id} className="flex items-start gap-2 text-sm text-white/64">
                            <input name={`question_${question.id}`} type="radio" value={option.id} required />
                            <span>{option.label}</span>
                          </label>
                        ))}
                      </div>
                    )}
                    <p className="mt-3 text-xs text-white/38">Explanation appears in Founder review and after scoring history is inspected.</p>
                  </div>
                ))}
                <Button variant="accent">Submit knowledge check</Button>
              </form>
            </Card>
          ) : null}
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="font-semibold">Completion</h3>
            <form action={completeAcademyModuleAction} className="mt-4 space-y-4">
              <input type="hidden" name="moduleId" value={courseModule.id} />
              {courseModule.acknowledgementRequired ? (
                <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm text-white/62">
                  <input name="acknowledgement" type="checkbox" required />
                  <span>{courseModule.acknowledgementText}</span>
                </label>
              ) : null}
              {courseModule.knowledgeCheckRequired && !passed ? <p className="text-sm text-warning">Pass the knowledge check before completing this module.</p> : null}
              <Button className="w-full" variant="accent" disabled={!canComplete}>{completed ? "Completed" : "Complete module"}</Button>
            </form>
          </Card>

          <Card>
            <h3 className="font-semibold">Employee Notes</h3>
            <p className="mt-2 text-xs text-white/42">Private to your account by default.</p>
            <form action={saveModuleNoteAction} className="mt-4 space-y-3">
              <input type="hidden" name="moduleId" value={courseModule.id} />
              <textarea name="body" defaultValue={courseModule.notes[0]?.body ?? ""} className="min-h-32 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <Button variant="outline">Save note</Button>
            </form>
          </Card>

          <Card>
            <h3 className="font-semibold">Ask Stephen</h3>
            <form action={submitEmployeeQuestionAction} className="mt-4 space-y-3">
              <input type="hidden" name="moduleId" value={courseModule.id} />
              <select name="urgency" className="h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
              </select>
              <textarea name="question" required placeholder="What is unclear?" className="min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <Button variant="outline">Submit question</Button>
            </form>
            <div className="mt-4 space-y-2">
              {courseModule.questions.map((question) => (
                <p key={question.id} className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-xs text-white/52">{question.status}: {question.question}</p>
              ))}
            </div>
          </Card>

          {courseModule.resources.length ? (
            <Card>
              <h3 className="font-semibold">Resources</h3>
              <div className="mt-4 space-y-2">
                {courseModule.resources.map((resource) => (
                  resource.url ? <a key={resource.id} className="block text-sm text-accent" href={resource.url}>{resource.label}</a> : <p key={resource.id} className="text-sm text-white/58">{resource.label}</p>
                ))}
              </div>
            </Card>
          ) : null}
        </div>
      </div>
    </PageSection>
  );
}
