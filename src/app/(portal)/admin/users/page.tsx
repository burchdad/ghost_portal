import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";

export default async function AdminUsersPage() {
  await requirePermission("users:manage");
  const users = await getPrisma().user.findMany({ include: { role: true }, orderBy: { name: "asc" } });

  return (
    <PageSection eyebrow="Founder admin" title="Users" description="Founder-only user and role administration.">
      <SimpleTable
        columns={["Name", "Email", "Role", "Status"]}
        empty="No users found."
        rows={users.map((user) => [user.preferredName ?? user.name, user.email, user.role.name, <Badge key="status">{user.status}</Badge>])}
      />
    </PageSection>
  );
}
