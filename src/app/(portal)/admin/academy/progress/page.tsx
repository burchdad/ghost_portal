import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";

export default async function AcademyProgressAdminPage() {
  await requirePermission("academy:manage");
  const assignments = await getPrisma().learningPathAssignment.findMany({
    include: {
      user: true,
      path: { include: { courses: { include: { modules: { include: { completions: true } } } } } }
    },
    orderBy: { assignedAt: "desc" }
  });

  return (
    <PageSection eyebrow="Founder admin" title="Academy Progress" description="Review learning path assignments, completions, required acknowledgements, and remaining work.">
      <SimpleTable
        columns={["Learner", "Path", "Progress", "Status"]}
        empty="No learning path assignments yet."
        rows={assignments.map((assignment) => {
          const modules = assignment.path.courses.flatMap((course) => course.modules).filter((courseModule) => courseModule.required);
          const completed = modules.filter((courseModule) => courseModule.completions.some((completion) => completion.userId === assignment.userId && completion.moduleVersion === courseModule.version));
          const percent = modules.length ? Math.round((completed.length / modules.length) * 100) : 0;
          return [
            assignment.user.preferredName ?? assignment.user.name,
            <Link key="path" href="/admin/academy/content" className="font-medium text-white hover:text-accent">{assignment.path.title}</Link>,
            `${percent}% (${completed.length}/${modules.length})`,
            <Badge key="status">{assignment.status}</Badge>
          ];
        })}
      />
    </PageSection>
  );
}
