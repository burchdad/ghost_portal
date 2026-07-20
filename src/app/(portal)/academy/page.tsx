import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function AcademyPage() {
  const user = await requireUser();
  const assignment = await getPrisma().learningPathAssignment.findFirst({
    where: { userId: user.id, status: { not: "Archived" } },
    include: {
      path: {
        include: {
          courses: {
            where: { published: true },
            include: {
              modules: {
                where: { published: true, audienceRoles: { has: user.role } },
                include: { completions: { where: { userId: user.id } } },
                orderBy: { sortOrder: "asc" }
              }
            },
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    },
    orderBy: { assignedAt: "desc" }
  });

  if (!assignment) {
    return (
      <PageSection eyebrow="Ghost Academy" title="My Learning" description="Assigned learning paths, SOPs, policies, and role training.">
        <Card>
          <p className="text-sm text-white/58">No learning path is assigned yet.</p>
          {user.role === "Founder" ? (
            <Button asChild className="mt-4" variant="accent"><Link href="/admin/academy">Open Academy admin</Link></Button>
          ) : null}
        </Card>
      </PageSection>
    );
  }

  const modules = assignment.path.courses.flatMap((course) => course.modules);
  const requiredModules = modules.filter((courseModule) => courseModule.required);
  const completed = modules.filter((courseModule) => courseModule.completions.some((completion) => completion.moduleVersion === courseModule.version));
  const requiredCompleted = requiredModules.filter((courseModule) => courseModule.completions.some((completion) => completion.moduleVersion === courseModule.version));
  const progress = requiredModules.length ? Math.round((requiredCompleted.length / requiredModules.length) * 100) : 0;
  const remainingMinutes = requiredModules.filter((courseModule) => !courseModule.completions.some((completion) => completion.moduleVersion === courseModule.version)).reduce((total, courseModule) => total + courseModule.estimatedMinutes, 0);
  const nextModule = requiredModules.find((courseModule) => !courseModule.completions.some((completion) => completion.moduleVersion === courseModule.version)) ?? modules[0];

  return (
    <PageSection eyebrow="Ghost Academy" title="My Learning" description="Your current role training, policies, SOPs, notes, questions, and completion tracking.">
      <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]">
        <Card>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge>Current path</Badge>
              <h3 className="mt-4 text-2xl font-semibold">{assignment.path.title}</h3>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/56">{assignment.path.description}</p>
            </div>
            <Badge>{assignment.required ? "Required" : "Optional"}</Badge>
          </div>
          <div className="mt-6 h-2 rounded-full bg-white/10">
            <div className="h-2 rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 grid gap-3 text-sm text-white/58 sm:grid-cols-4">
            <p><span className="block text-2xl font-semibold text-white">{progress}%</span>complete</p>
            <p><span className="block text-2xl font-semibold text-white">{requiredModules.length - requiredCompleted.length}</span>required left</p>
            <p><span className="block text-2xl font-semibold text-white">{remainingMinutes}</span>minutes left</p>
            <p><span className="block text-2xl font-semibold text-white">{assignment.dueDate ? assignment.dueDate.toISOString().slice(0, 10) : "No date"}</span>due date</p>
          </div>
          {nextModule ? (
            <Button asChild className="mt-6" variant="accent">
              <Link href={`/academy/modules/${nextModule.id}`}>Continue learning</Link>
            </Button>
          ) : null}
        </Card>

        <Card>
          <h3 className="font-semibold">Academy Tools</h3>
          <div className="mt-4 grid gap-3">
            <Button asChild variant="outline"><Link href="/sops">Open SOP Library</Link></Button>
            <Button asChild variant="outline"><Link href="/policies">Open Policies</Link></Button>
            <Button asChild variant="outline"><Link href="/academy/questions">My Questions</Link></Button>
            <Button asChild variant="outline"><Link href="/knowledge">Knowledge Base</Link></Button>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid gap-5">
        {assignment.path.courses.map((course) => (
          <Card key={course.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{course.title}</h3>
                <p className="mt-1 text-sm text-white/52">{course.description}</p>
              </div>
              <Badge>{course.modules.filter((courseModule) => courseModule.completions.length).length}/{course.modules.length}</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {course.modules.map((courseModule) => {
                const isComplete = courseModule.completions.some((completion) => completion.moduleVersion === courseModule.version);
                return (
                  <Link key={courseModule.id} href={`/academy/modules/${courseModule.id}`} className="rounded-lg border border-white/10 bg-white/[0.035] p-4 transition hover:bg-white/[0.065]">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-medium">{courseModule.title}</h4>
                      <Badge>{isComplete ? "Completed" : courseModule.required ? "Required" : "Optional"}</Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-white/52">{courseModule.summary}</p>
                    <p className="mt-3 text-xs text-white/40">v{courseModule.version} · {courseModule.estimatedMinutes} min</p>
                  </Link>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      {completed.length ? (
        <Card className="mt-5">
          <h3 className="font-semibold">Recently completed</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {completed.slice(0, 8).map((courseModule) => <Badge key={courseModule.id}>{courseModule.title}</Badge>)}
          </div>
        </Card>
      ) : null}
    </PageSection>
  );
}
