import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { unlockKnowledgeCheckAttemptAction } from "@/server/workflows/academy";

export default async function AcademyProgressAdminPage() {
  await requirePermission("academy:manage");
  const assignments = await getPrisma().learningPathAssignment.findMany({
    include: {
      user: true,
      path: {
        include: {
          courses: {
            include: {
              modules: {
                include: {
                  completions: true,
                  knowledgeCheck: {
                    include: {
                      attempts: { orderBy: { submittedAt: "desc" } },
                      unlocks: { where: { usedAt: null } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    orderBy: { assignedAt: "desc" }
  });
  const reviewItems = assignments.flatMap((assignment) =>
    assignment.path.courses.flatMap((course) =>
      course.modules.flatMap((courseModule) => {
        const check = courseModule.knowledgeCheck;
        if (!check) return [];
        const learnerAttempts = check.attempts.filter((attempt) => attempt.userId === assignment.userId);
        const latestAttempt = learnerAttempts[0];
        const hasOpenUnlock = check.unlocks.some((unlock) => unlock.userId === assignment.userId);
        if (latestAttempt?.status !== "NeedsReview") return [];
        return [{ assignment, courseModule, check, latestAttempt, hasOpenUnlock }];
      })
    )
  );

  return (
    <PageSection eyebrow="Founder admin" title="Academy Progress" description="Review learning path assignments, completions, required acknowledgements, and remaining work.">
      <div className="space-y-5">
        {reviewItems.length ? (
          <Card>
            <h3 className="font-semibold">Knowledge Checks Needing Review</h3>
            <div className="mt-4 grid gap-4">
              {reviewItems.map(({ assignment, courseModule, check, latestAttempt, hasOpenUnlock }) => (
                <form key={`${assignment.userId}-${check.id}`} action={unlockKnowledgeCheckAttemptAction} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-[1fr_220px]">
                  <input type="hidden" name="checkId" value={check.id} />
                  <input type="hidden" name="learnerId" value={assignment.userId} />
                  <input type="hidden" name="moduleId" value={courseModule.id} />
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{assignment.user.preferredName ?? assignment.user.name}</Badge>
                      <Badge>{latestAttempt.status}: {latestAttempt.score}%</Badge>
                      {hasOpenUnlock ? <Badge>Unlocked</Badge> : null}
                    </div>
                    <Link href={`/academy/modules/${courseModule.id}`} className="mt-3 block font-medium text-white hover:text-accent">{courseModule.title}</Link>
                    <textarea name="reason" placeholder="Review notes or missed concepts discussed" className="mt-3 min-h-20 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
                  </div>
                  <div className="flex items-end">
                    <Button variant="accent" disabled={hasOpenUnlock}>{hasOpenUnlock ? "Attempt already unlocked" : "Unlock one attempt"}</Button>
                  </div>
                </form>
              ))}
            </div>
          </Card>
        ) : null}
        <SimpleTable
          columns={["Learner", "Path", "Progress", "Status"]}
          empty="No learning path assignments yet."
          rows={assignments.map((assignment) => {
            const modules = assignment.path.courses.flatMap((course) => course.modules).filter((courseModule) => courseModule.required);
            const completed = modules.filter((courseModule) => courseModule.completions.some((completion) => completion.userId === assignment.userId && completion.moduleVersion === courseModule.version));
            const needsReview = modules.some((courseModule) => courseModule.knowledgeCheck?.attempts.some((attempt) => attempt.userId === assignment.userId && attempt.status === "NeedsReview"));
            const percent = modules.length ? Math.round((completed.length / modules.length) * 100) : 0;
            return [
              assignment.user.preferredName ?? assignment.user.name,
              <Link key="path" href="/admin/academy/content" className="font-medium text-white hover:text-accent">{assignment.path.title}</Link>,
              `${percent}% (${completed.length}/${modules.length})`,
              <Badge key="status">{needsReview ? "Needs Review" : assignment.status}</Badge>
            ];
          })}
        />
      </div>
    </PageSection>
  );
}
