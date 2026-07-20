import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { updateAcademyModuleAction } from "@/server/workflows/academy";

export default async function AcademyContentAdminPage({ searchParams }: { searchParams: Promise<{ moduleId?: string }> }) {
  await requirePermission("academy:manage");
  const params = await searchParams;
  const [modules, selected] = await Promise.all([
    getPrisma().courseModule.findMany({ include: { course: true }, orderBy: [{ founderReviewRequired: "desc" }, { updatedAt: "desc" }], take: 100 }),
    params.moduleId ? getPrisma().courseModule.findUnique({ where: { id: params.moduleId } }) : null
  ]);

  return (
    <PageSection eyebrow="Founder admin" title="Academy Content Review" description="Review, edit, publish, unpublish, version, and clear seed-managed training content.">
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <SimpleTable
          columns={["Module", "Type", "Status", "Version"]}
          empty="No Academy modules found."
          rows={modules.map((courseModule) => [
            <Link key="module" href={`/admin/academy/content?moduleId=${courseModule.id}`} className="font-medium text-white hover:text-accent">{courseModule.title}</Link>,
            courseModule.contentType,
            <Badge key="status">{courseModule.published ? "Published" : "Draft"}{courseModule.founderReviewRequired ? " · Review" : ""}</Badge>,
            `v${courseModule.version}`
          ])}
        />
        <Card>
          {selected ? (
            <form action={updateAcademyModuleAction} className="space-y-3">
              <input type="hidden" name="moduleId" value={selected.id} />
              <label className="block text-sm font-medium">Title<input name="title" defaultValue={selected.title} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" /></label>
              <label className="block text-sm font-medium">Summary<textarea name="summary" defaultValue={selected.summary} className="mt-2 min-h-20 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" /></label>
              <label className="block text-sm font-medium">Body<textarea name="body" defaultValue={selected.body} className="mt-2 min-h-72 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" /></label>
              <label className="flex items-center gap-2 text-sm text-white/64"><input name="published" type="checkbox" defaultChecked={selected.published} /> Published</label>
              <label className="flex items-center gap-2 text-sm text-white/64"><input name="founderReviewRequired" type="checkbox" defaultChecked={selected.founderReviewRequired} /> Founder review required</label>
              <label className="flex items-center gap-2 text-sm text-white/64"><input name="incrementVersion" type="checkbox" /> Increment version and require new completion for this version</label>
              <div className="flex gap-3">
                <Button variant="accent">Save module</Button>
                <Button asChild variant="outline"><Link href={`/academy/modules/${selected.id}`}>Preview</Link></Button>
              </div>
            </form>
          ) : (
            <p className="text-sm text-white/48">Select a module to edit, publish, unpublish, or version it.</p>
          )}
        </Card>
      </div>
    </PageSection>
  );
}
