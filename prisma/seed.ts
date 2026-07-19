import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../src/server/auth/password";
import { permissions, rolePermissions, roles } from "../src/server/permissions/roles";

const prisma = new PrismaClient();

const onboardingModules = [
  "Welcome to Ghost AI Solutions",
  "Company story",
  "Mission and vision",
  "Core services",
  "Ghost product ecosystem",
  "Nova overview",
  "Vega overview",
  "Echo overview",
  "GEO overview",
  "Mission Control and Ghost Portal overview",
  "Communication expectations",
  "Client confidentiality",
  "Security policies",
  "Approval boundaries",
  "First-week trial plan",
  "Daily-report expectations"
];

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
      const permission = await prisma.permission.findUniqueOrThrow({ where: { key: permissionKey } });
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: role.id,
            permissionId: permission.id
          }
        },
        update: {},
        create: { roleId: role.id, permissionId: permission.id }
      });
    }
  }

  const founderRole = await prisma.role.findUniqueOrThrow({ where: { name: "Founder" } });
  const operationsRole = await prisma.role.findUniqueOrThrow({ where: { name: "Operations" } });

  const founderEmail = process.env.FOUNDER_SEED_EMAIL ?? "stephen@ghostai.solutions";
  const operationsEmail = process.env.OPERATIONS_SEED_EMAIL ?? "amariexc@gmail.com";
  const founderPassword = process.env.FOUNDER_SEED_PASSWORD;
  const operationsPassword = process.env.OPERATIONS_SEED_PASSWORD;

  const stephen = await prisma.user.upsert({
    where: { email: founderEmail.toLowerCase() },
    update: {
      roleId: founderRole.id,
      status: "Active",
      timezone: "America/Chicago",
      preferredName: "Stephen",
      ...(founderPassword ? { passwordHash: hashPassword(founderPassword) } : {})
    },
    create: {
      name: "Stephen Burch",
      preferredName: "Stephen",
      email: founderEmail.toLowerCase(),
      emailVerified: true,
      passwordHash: founderPassword ? hashPassword(founderPassword) : null,
      status: "Active",
      timezone: "America/Chicago",
      roleId: founderRole.id
    }
  });

  const alex = await prisma.user.upsert({
    where: { email: operationsEmail.toLowerCase() },
    update: {
      roleId: operationsRole.id,
      status: operationsPassword ? "Active" : "Invited",
      timezone: "Asia/Manila",
      preferredName: "Alex",
      ...(operationsPassword ? { passwordHash: hashPassword(operationsPassword) } : {})
    },
    create: {
      name: "Alexandra Marie Canto",
      preferredName: "Alex",
      email: operationsEmail.toLowerCase(),
      emailVerified: false,
      passwordHash: operationsPassword ? hashPassword(operationsPassword) : null,
      status: operationsPassword ? "Active" : "Invited",
      timezone: "Asia/Manila",
      roleId: operationsRole.id
    }
  });

  for (const [index, title] of onboardingModules.entries()) {
    await prisma.onboardingModule.upsert({
      where: { id: `seed_onboarding_${index + 1}` },
      update: {
        title,
        sortOrder: index + 1,
        published: true
      },
      create: {
        id: `seed_onboarding_${index + 1}`,
        title,
        description: `Trial onboarding module: ${title}.`,
        content: `# ${title}\n\nThis seed module is placeholder onboarding content for Alex's one-week Operations trial. Stephen can replace it in the Founder onboarding admin workflow.`,
        estimatedMinutes: index < 4 ? 8 : 12,
        required: true,
        sortOrder: index + 1,
        published: true
      }
    });
  }

  const client = await prisma.client.upsert({
    where: { id: "seed_client_demo_northstar" },
    update: {},
    create: {
      id: "seed_client_demo_northstar",
      company: "Demo Client - Northstar Operations",
      status: "Active",
      services: ["Automation", "CRM", "Follow-up Systems"],
      riskStatus: "Medium",
      operationalNotes: "Demo client used for Alex's trial workflow. No sensitive real client information.",
      founderOnlyNotes: "Founder-only notes should never be exposed to Operations users."
    }
  });

  await prisma.clientAccess.upsert({
    where: {
      userId_clientId: {
        userId: alex.id,
        clientId: client.id
      }
    },
    update: { access: "Edit", grantedBy: stephen.id },
    create: {
      userId: alex.id,
      clientId: client.id,
      access: "Edit",
      grantedBy: stephen.id
    }
  });

  const lead = await prisma.lead.upsert({
    where: { id: "seed_lead_demo_atlas" },
    update: {},
    create: {
      id: "seed_lead_demo_atlas",
      company: "Demo Lead - Atlas Workflow Co.",
      contactName: "Demo Contact",
      serviceInterest: "Operations automation",
      estimatedValue: 18000,
      stage: "Qualified",
      followUpDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      nextAction: "Draft a follow-up for Stephen review.",
      approvalRequired: true,
      assignedUserId: alex.id
    }
  });

  await prisma.leadAccess.upsert({
    where: {
      userId_leadId: {
        userId: alex.id,
        leadId: lead.id
      }
    },
    update: { access: "Edit", grantedBy: stephen.id },
    create: {
      userId: alex.id,
      leadId: lead.id,
      access: "Edit",
      grantedBy: stephen.id
    }
  });

  const project = await prisma.project.upsert({
    where: { id: "seed_project_trial_ops" },
    update: {},
    create: {
      id: "seed_project_trial_ops",
      name: "Alex Operations Trial",
      description: "One-week Operations and Executive Assistant trial readiness.",
      status: "In Progress"
    }
  });

  await prisma.task.upsert({
    where: { id: "seed_task_trial_onboarding" },
    update: {},
    create: {
      id: "seed_task_trial_onboarding",
      title: "Complete Ghost Portal onboarding modules",
      description: "Finish required onboarding modules and note questions for Stephen.",
      status: "Assigned",
      priority: "High",
      ownerId: alex.id,
      approverId: stephen.id,
      createdById: stephen.id,
      projectId: project.id,
      dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000)
    }
  });

  await prisma.approval.upsert({
    where: { id: "seed_approval_followup" },
    update: {},
    create: {
      id: "seed_approval_followup",
      summary: "Approve demo lead follow-up direction",
      context: "Alex needs approval before any message is treated as ready to send.",
      businessImpact: "Keeps client commitments and pricing controlled by Founder.",
      recommendation: "Review the draft and request changes before approving.",
      priority: "High",
      status: "Open",
      requesterId: alex.id,
      leadId: lead.id
    }
  });

  await prisma.announcement.upsert({
    where: { id: "seed_announcement_welcome_alex" },
    update: {},
    create: {
      id: "seed_announcement_welcome_alex",
      title: "Welcome Alex to the Ghost Portal trial",
      body: "Welcome to the one-week Operations trial. Start with onboarding, then assigned tasks and the end-of-day report.",
      category: "Operations",
      priority: "High",
      pinned: true,
      audienceRoles: ["Founder", "Operations"],
      authorId: stephen.id
    }
  });

  await prisma.knowledgeArticle.upsert({
    where: { id: "seed_article_security_rules" },
    update: {},
    create: {
      id: "seed_article_security_rules",
      title: "Trial Security Rules",
      category: "Security",
      body: "Never request, store, or share credentials in Ghost Portal. Escalate anything sensitive to Stephen.",
      status: "Published",
      ownerId: stephen.id,
      visibleToRoles: ["Founder", "Operations"],
      requiredReading: true
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
