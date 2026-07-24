import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { MarkdownRenderer } from "@/components/portal/markdown-renderer";
import { PageSection } from "@/components/portal/page-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";
import { completeAcademyModuleAction, saveModuleNoteAction, submitEmployeeQuestionAction, submitKnowledgeCheckAction } from "@/server/workflows/academy";
import { submitFeedbackAction } from "@/server/workflows/feedback";

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
      primarySop: true,
      sections: { orderBy: { sortOrder: "asc" } },
      resources: { orderBy: { sortOrder: "asc" } },
      knowledgeCheck: {
        include: {
          questions: { include: { options: { orderBy: { sortOrder: "asc" } } }, orderBy: { sortOrder: "asc" } },
          attempts: { where: { userId: user.id }, orderBy: { submittedAt: "desc" }, take: 10 },
          unlocks: { where: { userId: user.id, usedAt: null }, orderBy: { createdAt: "asc" }, take: 1 }
        }
      },
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
  const siblingModules = await getPrisma().courseModule.findMany({
    where: { courseId: courseModule.courseId, archivedAt: null, ...(user.role === "Founder" ? {} : { published: true, audienceRoles: { has: user.role } }) },
    orderBy: { sortOrder: "asc" },
    select: { id: true, title: true, sortOrder: true, completions: { where: { userId: user.id }, select: { id: true } } }
  });
  const currentIndex = siblingModules.findIndex((item) => item.id === courseModule.id);
  const previousModule = currentIndex > 0 ? siblingModules[currentIndex - 1] : null;
  const nextModule = currentIndex >= 0 ? siblingModules[currentIndex + 1] : null;
  const latestAttempt = courseModule.knowledgeCheck?.attempts[0];
  const latestAnswers = latestAttempt?.answers && typeof latestAttempt.answers === "object" && !Array.isArray(latestAttempt.answers) ? latestAttempt.answers as Record<string, string> : {};
  const failedAttemptCount = courseModule.knowledgeCheck?.attempts.filter((attempt) => attempt.status === "Failed" || attempt.status === "NeedsReview").length ?? 0;
  const hasAttemptUnlock = Boolean(courseModule.knowledgeCheck?.unlocks.length);
  const knowledgeCheckLocked = Boolean(courseModule.knowledgeCheck && !passed && failedAttemptCount >= 2 && !hasAttemptUnlock);
  const attemptLabel = courseModule.knowledgeCheck ? `${Math.min(failedAttemptCount + 1, 2)} of 2 standard attempts` : "";

  return (
    <PageSection eyebrow="Ghost Academy" title={courseModule.title} description={courseModule.summary}>
      <div className="grid gap-5 xl:grid-cols-[260px_1fr_330px]">
        <aside className="space-y-3">
          <Card className="sticky top-5">
            <h3 className="font-semibold">Lessons</h3>
            <div className="mt-4 space-y-2">
              {siblingModules.map((item) => (
                <Link key={item.id} href={`/academy/modules/${item.id}`} className={`block rounded-lg border px-3 py-2 text-sm ${item.id === courseModule.id ? "border-accent bg-accent/10 text-accent" : "border-white/10 bg-white/[0.035] text-white/62"}`}>
                  {item.completions.length ? "Done: " : ""}{item.title}
                </Link>
              ))}
            </div>
            <Button asChild variant="outline" className="mt-4 w-full">
              <Link href="/academy">Return to Learning Path</Link>
            </Button>
          </Card>
        </aside>
        <div className="space-y-5">
          <Card>
            <div className="mb-5 flex flex-wrap gap-2">
              <Badge>{courseModule.required ? "Required" : "Optional"}</Badge>
              <Badge>v{courseModule.version}</Badge>
              <Badge>{courseModule.estimatedMinutes} min</Badge>
              <Badge>{completed ? "Completed" : "Open"}</Badge>
              {courseModule.primarySop ? <Badge>Linked SOP: {courseModule.primarySop.title}</Badge> : null}
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
              <p className="mt-2 text-sm text-white/52">Passing score: {courseModule.knowledgeCheck.passingScore}% · initial attempt plus one retry before manager review.</p>
              {latestAttempt ? (
                <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.035] p-4">
                  <Badge>{latestAttempt.status}: {latestAttempt.score}%</Badge>
                  <p className="mt-3 text-sm text-white/56">
                    {latestAttempt.status === "Passed"
                      ? "Nice. You passed this check and can continue when the module is complete."
                      : knowledgeCheckLocked
                        ? "This module needs manager review before another attempt. Revisit the SOP, then ask Stephen or your trainer to unlock a follow-up attempt."
                        : hasAttemptUnlock
                          ? "A manager unlocked one additional attempt. Review the missed concepts below before trying again."
                          : "This check needs review. Read the explanations below, then retake when ready."}
                  </p>
                  {!passed ? <p className="mt-2 text-xs text-white/42">{hasAttemptUnlock ? "Manager-unlocked attempt available" : attemptLabel}</p> : null}
                </div>
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
                    {latestAttempt ? (
                      <div className="mt-3 rounded-lg border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/54">
                        {question.options.length ? (
                          <p>Your answer: {question.options.find((option) => option.id === latestAnswers[question.id])?.label ?? "No answer"}.</p>
                        ) : null}
                        <p>Correct answer: {question.options.filter((option) => option.correct).map((option) => option.label).join(", ") || "Founder review required"}.</p>
                        <p>{question.explanation}</p>
                        {question.sopId ? <Link href={`/sops/${question.sopId}`} className="text-accent">Review related SOP</Link> : courseModule.primarySop ? <Link href={`/sops/${courseModule.primarySop.id}`} className="text-accent">Review related SOP</Link> : null}
                      </div>
                    ) : null}
                  </div>
                ))}
                <div className="flex flex-wrap gap-2">
                  <Button variant="accent" disabled={knowledgeCheckLocked || passed}>{latestAttempt ? "Retake Knowledge Check" : "Submit knowledge check"}</Button>
                  {nextModule ? <Button asChild variant="outline"><Link href={`/academy/modules/${nextModule.id}`}>Continue to Next Module</Link></Button> : null}
                  {courseModule.primarySop ? <Button asChild variant="outline"><Link href={`/sops/${courseModule.primarySop.id}`}>Review SOP</Link></Button> : null}
                </div>
              </form>
            </Card>
          ) : null}

          <Card className="sticky bottom-4 z-10 border-accent/30 bg-zinc-950/95">
            <div className="flex flex-wrap gap-2">
              {previousModule ? <Button asChild variant="outline"><Link href={`/academy/modules/${previousModule.id}`}>Previous</Link></Button> : null}
              <Button asChild variant="outline"><Link href="/academy">Return to Academy</Link></Button>
              {nextModule ? <Button asChild variant="accent"><Link href={`/academy/modules/${nextModule.id}`}>Continue</Link></Button> : null}
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="font-semibold">Academy Feedback</h3>
            <form action={submitFeedbackAction} className="mt-4 space-y-3">
              <input type="hidden" name="type" value="EmployeeOnboardingBeta" />
              <input type="hidden" name="pageOrFeature" value={`/academy/modules/${courseModule.id}`} />
              <input type="hidden" name="severity" value="Medium" />
              <input name="title" required placeholder="Short title" className="h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
              <textarea name="description" required placeholder="Navigation issue, confusing wording, repetitive content, missing content, incorrect answer, broken timer, broken button, permission problem, suggested improvement, product question, or SOP question." className="min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
              <Button variant="outline">Send Academy feedback</Button>
            </form>
          </Card>

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
