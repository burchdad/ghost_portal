import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { updateAcademyModuleAction, updateKnowledgeQuestionMetadataAction } from "@/server/workflows/academy";

export default async function AcademyContentAdminPage({ searchParams }: { searchParams: Promise<{ moduleId?: string }> }) {
  await requirePermission("academy:manage");
  const params = await searchParams;
  const [modules, selected, sops] = await Promise.all([
    getPrisma().courseModule.findMany({ include: { course: true, primarySop: true }, orderBy: [{ founderReviewRequired: "desc" }, { updatedAt: "desc" }], take: 100 }),
    params.moduleId ? getPrisma().courseModule.findUnique({
      where: { id: params.moduleId },
      include: {
        knowledgeCheck: {
          include: {
            questions: {
              include: { sop: true },
              orderBy: { sortOrder: "asc" }
            }
          }
        }
      }
    }) : null,
    getPrisma().sOPArticle.findMany({ where: { archivedAt: null }, orderBy: [{ category: "asc" }, { title: "asc" }], select: { id: true, title: true, category: true } })
  ]);

  return (
    <PageSection eyebrow="Founder admin" title="Academy Content Review" description="Review, edit, publish, unpublish, version, and clear seed-managed training content.">
      <div className="grid gap-5 xl:grid-cols-[1fr_0.85fr]">
        <SimpleTable
          columns={["Module", "Type", "Status", "Version"]}
          empty="No Academy modules found."
          rows={modules.map((courseModule) => [
            <Link key="module" href={`/admin/academy/content?moduleId=${courseModule.id}`} className="font-medium text-white hover:text-accent">{courseModule.title}</Link>,
            courseModule.primarySop ? `SOP: ${courseModule.primarySop.title}` : courseModule.contentType,
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
              <label className="block text-sm font-medium">
                Primary SOP
                <select name="primarySopId" defaultValue={selected.primarySopId ?? ""} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
                  <option value="">No primary SOP</option>
                  {sops.map((sop) => <option key={sop.id} value={sop.id}>{sop.category}: {sop.title}</option>)}
                </select>
              </label>
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
        {selected?.knowledgeCheck ? (
          <Card className="xl:col-span-2">
            <h3 className="font-semibold">Knowledge Question Links</h3>
            <div className="mt-4 grid gap-4">
              {selected.knowledgeCheck.questions.map((question) => (
                <form key={question.id} action={updateKnowledgeQuestionMetadataAction} className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 lg:grid-cols-[1fr_180px_160px]">
                  <input type="hidden" name="questionId" value={question.id} />
                  <input type="hidden" name="moduleId" value={selected.id} />
                  <div className="lg:col-span-3">
                    <p className="text-sm font-medium">{question.prompt}</p>
                    <p className="mt-1 text-xs text-white/42">Current SOP: {question.sop?.title ?? "None"} · {question.status}</p>
                  </div>
                  <label className="block text-xs font-medium text-white/58">
                    Related SOP
                    <select name="sopId" defaultValue={question.sopId ?? ""} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-white">
                      <option value="">Use module primary SOP</option>
                      {sops.map((sop) => <option key={sop.id} value={sop.id}>{sop.category}: {sop.title}</option>)}
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-white/58">
                    Difficulty
                    <select name="difficulty" defaultValue={question.difficulty} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-white">
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-white/58">
                    Status
                    <select name="status" defaultValue={question.status} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-white">
                      <option value="Draft">Draft</option>
                      <option value="Approved">Approved</option>
                      <option value="Retired">Retired</option>
                    </select>
                  </label>
                  <label className="block text-xs font-medium text-white/58 lg:col-span-2">
                    Learning objective
                    <input name="learningObjective" defaultValue={question.learningObjective ?? ""} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-white" />
                  </label>
                  <label className="block text-xs font-medium text-white/58">
                    Incorrect answer coaching
                    <input name="incorrectExplanation" defaultValue={question.incorrectExplanation ?? ""} className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm text-white" />
                  </label>
                  <Button variant="outline" className="lg:col-span-3">Save question link</Button>
                </form>
              ))}
            </div>
          </Card>
        ) : null}
      </div>
    </PageSection>
  );
}
