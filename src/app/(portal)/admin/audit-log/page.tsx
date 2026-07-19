import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";

export default async function AuditLogPage() {
  await requirePermission("audit:read");
  const logs = await getPrisma().auditLog.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 });

  return (
    <PageSection eyebrow="Founder admin" title="Audit Log" description="Append-only operational security trail for important portal actions.">
      <SimpleTable
        columns={["Time", "User", "Action", "Entity"]}
        empty="No audit events yet."
        rows={logs.map((log) => [log.createdAt.toISOString(), log.user?.preferredName ?? log.user?.name ?? "System", log.action, `${log.entity}${log.entityId ? `:${log.entityId}` : ""}`])}
      />
    </PageSection>
  );
}
