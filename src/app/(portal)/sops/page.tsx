import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function SOPLibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
  const user = await requireUser();
  const filters = await searchParams;
  const sops = await getPrisma().sOPArticle.findMany({
    where: {
      archivedAt: null,
      ...(user.role === "Founder" ? {} : { published: true, audienceRoles: { has: user.role } }),
      ...(filters.category ? { category: filters.category as never } : {}),
      ...(filters.q ? { title: { contains: filters.q, mode: "insensitive" } } : {})
    },
    orderBy: [{ category: "asc" }, { title: "asc" }]
  });

  return (
    <PageSection eyebrow="Ghost Academy" title="SOP Library" description="Step-by-step operating procedures for recurring Ghost AI Solutions work.">
      <form className="mb-5 grid gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 md:grid-cols-[1fr_220px_auto]">
        <input name="q" defaultValue={filters.q} placeholder="Search SOPs" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
        <select name="category" defaultValue={filters.category ?? ""} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
          <option value="">All categories</option>
          <option value="Operations">Operations</option>
          <option value="ClientOperations">Client operations</option>
          <option value="LeadOperations">Lead operations</option>
          <option value="MeetingsExecutiveSupport">Meetings and executive support</option>
          <option value="ContentMarketingSupport">Content and marketing support</option>
        </select>
        <button className="h-10 rounded-lg border border-white/10 px-4 text-sm">Search</button>
      </form>
      <SimpleTable
        columns={["SOP", "Category", "Owner", "Version"]}
        empty="No SOPs match your search."
        rows={sops.map((sop) => [
          <Link key="title" href={`/sops/${sop.id}`} className="font-medium text-white hover:text-accent">{sop.title}</Link>,
          <Badge key="category">{sop.category}</Badge>,
          sop.owner,
          `v${sop.version}`
        ])}
      />
    </PageSection>
  );
}
