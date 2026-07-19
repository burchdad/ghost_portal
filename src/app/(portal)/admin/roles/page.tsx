import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";

export default async function AdminRolesPage() {
  await requirePermission("permissions:manage");
  const roles = await getPrisma().role.findMany({ include: { permissions: true }, orderBy: { name: "asc" } });

  return (
    <PageSection eyebrow="Founder admin" title="Roles" description="Role permission assignments are stored in the database and enforced server-side.">
      <SimpleTable columns={["Role", "Permissions"]} empty="No roles found." rows={roles.map((role) => [role.name, role.permissions.length])} />
    </PageSection>
  );
}
