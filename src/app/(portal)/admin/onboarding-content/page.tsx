import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";

export default async function AdminOnboardingContentPage() {
  await requirePermission("onboarding:manage");
  const modules = await getPrisma().onboardingModule.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <PageSection eyebrow="Founder admin" title="Onboarding Content" description="Founder-managed trial onboarding modules. Operations users cannot alter this content.">
      <SimpleTable
        columns={["Order", "Module", "Required", "Published"]}
        empty="No onboarding modules found."
        rows={modules.map((module) => [module.sortOrder, module.title, module.required ? "Required" : "Optional", <Badge key="published">{module.published ? "Published" : "Draft"}</Badge>])}
      />
    </PageSection>
  );
}
