import Link from "next/link";
import { PageSection } from "@/components/portal/page-section";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requireUser } from "@/server/permissions/authorize";

export default async function PoliciesPage() {
  const user = await requireUser();
  const policies = await getPrisma().courseModule.findMany({
    where: {
      contentType: "Policy",
      archivedAt: null,
      ...(user.role === "Founder" ? {} : { published: true, audienceRoles: { has: user.role } })
    },
    include: { completions: { where: { userId: user.id } } },
    orderBy: { title: "asc" }
  });

  return (
    <PageSection eyebrow="Ghost Academy" title="Policies" description="Internal operational guidance. These policies do not replace signed agreements or applicable law.">
      <div className="grid gap-4 md:grid-cols-2">
        {policies.map((policy) => (
          <Link key={policy.id} href={`/academy/modules/${policy.id}`}>
            <Card className="h-full transition hover:bg-white/[0.055]">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{policy.title}</h3>
                <Badge>{policy.completions.length ? "Acknowledged" : policy.acknowledgementRequired ? "Acknowledgement required" : "Reference"}</Badge>
              </div>
              <p className="mt-3 text-sm leading-6 text-white/54">{policy.summary}</p>
            </Card>
          </Link>
        ))}
      </div>
    </PageSection>
  );
}
