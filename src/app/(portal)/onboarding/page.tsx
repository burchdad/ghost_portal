import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function OnboardingPage() {
  const user = await requireUser();
  const modules = await getPrisma().onboardingModule.findMany({
    where: { published: true },
    include: { completions: { where: { userId: user.id } } },
    orderBy: { sortOrder: "asc" }
  });

  return (
    <PageSection eyebrow="Trial readiness" title="Onboarding Center" description="Required Ghost AI Solutions trial materials, completion tracking, and approval boundaries.">
      <div className="grid gap-4">
        {modules.map((module) => (
          <Card key={module.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{module.title}</h3>
                <p className="mt-2 text-sm leading-6 text-white/56">{module.description}</p>
              </div>
              <Badge>{module.completions.length ? "Completed" : module.required ? "Required" : "Optional"}</Badge>
            </div>
            <p className="mt-4 text-sm text-white/44">{module.estimatedMinutes} min</p>
          </Card>
        ))}
      </div>
    </PageSection>
  );
}
