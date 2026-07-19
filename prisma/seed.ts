import { PrismaClient } from "@prisma/client";
import { permissions, rolePermissions, roles } from "../src/server/permissions/roles";

const prisma = new PrismaClient();

async function main() {
  await prisma.permission.createMany({
    data: permissions.map((key) => ({ key })),
    skipDuplicates: true
  });

  for (const roleName of roles) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: {},
      create: { name: roleName }
    });

    for (const permissionKey of rolePermissions[roleName]) {
      const permission = await prisma.permission.findUniqueOrThrow({
        where: { key: permissionKey }
      });

      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: {
          roleId: role.id,
          permissionId: permission.id
        }
      });
    }
  }

  const founderRole = await prisma.role.findUniqueOrThrow({ where: { name: "Founder" } });
  const operationsRole = await prisma.role.findUniqueOrThrow({ where: { name: "Operations" } });

  const stephen = await prisma.user.upsert({
    where: { email: "stephen@ghostai.solutions" },
    update: { roleId: founderRole.id },
    create: {
      name: "Stephen Burch",
      email: "stephen@ghostai.solutions",
      emailVerified: true,
      roleId: founderRole.id
    }
  });

  const alex = await prisma.user.upsert({
    where: { email: "alexandra@ghostai.solutions" },
    update: { roleId: operationsRole.id },
    create: {
      name: "Alexandra Canto",
      email: "alexandra@ghostai.solutions",
      emailVerified: true,
      roleId: operationsRole.id
    }
  });

  const client = await prisma.client.upsert({
    where: { id: "seed_client_northstar" },
    update: {},
    create: {
      id: "seed_client_northstar",
      company: "Northstar Dental",
      services: ["Automation", "CRM", "Follow-up Systems"],
      riskStatus: "Medium",
      internalNotes: "Approval pending for launch communication."
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "seed_project_portal" },
    update: {},
    create: {
      id: "seed_project_portal",
      name: "Ghost Portal Foundation",
      description: "Internal operations portal baseline.",
      status: "In Progress"
    }
  });

  await prisma.task.upsert({
    where: { id: "seed_task_review_crm" },
    update: {},
    create: {
      id: "seed_task_review_crm",
      title: "Approve initial CRM workflow",
      description: "Review the proposed CRM notes and follow-up flow.",
      status: "WaitingOnStephen",
      priority: "High",
      ownerId: stephen.id,
      approverId: stephen.id,
      clientId: client.id,
      projectId: project.id
    }
  });

  await prisma.task.upsert({
    where: { id: "seed_task_ops_checklist" },
    update: {},
    create: {
      id: "seed_task_ops_checklist",
      title: "Create Operations first-week checklist",
      description: "Build onboarding checklist for Alexandra Canto.",
      status: "Assigned",
      priority: "Medium",
      ownerId: alex.id,
      projectId: project.id
    }
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
