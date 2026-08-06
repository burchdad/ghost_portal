import { PageSection } from "@/components/portal/page-section";
import { SimpleTable } from "@/components/portal/simple-table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission } from "@/server/permissions/authorize";
import { CreateEmployeeForm } from "@/app/(portal)/admin/users/create-employee-form";

export default async function AdminUsersPage() {
  const user = await requirePermission("users:manage");
  const users = await getPrisma().user.findMany({ include: { role: true }, orderBy: { name: "asc" } });
  const assignableRoles = user.role === "Founder"
    ? ["Executive", "Operations", "Sales", "Marketing", "Developer", "Support", "Finance", "Contractor", "Client"]
    : ["Sales", "Marketing", "Support", "Contractor"];

  return (
    <PageSection eyebrow="Employee admin" title="Employees" description="Add employees, assign roles, and give them access to their own dashboard, time clock, reports, and role-scoped work.">
      <div className="space-y-5">
        <Card>
          <h3 className="font-semibold">Add employee</h3>
          <p className="mt-2 text-sm leading-6 text-white/58">Create an active employee account with a temporary password. Sales employees get CRM, leads, time clock, daily reports, pricing, tasks, and Academy access through the Sales role.</p>
          <div className="mt-4">
            <CreateEmployeeForm roles={assignableRoles} />
          </div>
        </Card>

        <SimpleTable
          columns={["Name", "Email", "Role", "Status", "Timezone"]}
          empty="No users found."
          rows={users.map((employee) => [
            employee.preferredName ?? employee.name,
            employee.email,
            employee.role.name,
            <Badge key="status">{employee.status}</Badge>,
            employee.timezone
          ])}
        />
      </div>
    </PageSection>
  );
}
