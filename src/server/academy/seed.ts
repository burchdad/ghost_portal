import type { PrismaClient, RoleName, SOPCategory } from "@prisma/client";

type PrismaLike = PrismaClient;

const operationsRole: RoleName = "Operations";
const founderRole: RoleName = "Founder";
const audience: RoleName[] = [founderRole, operationsRole];

const courses = [
  {
    key: "course_welcome",
    title: "Welcome to Ghost AI Solutions",
    description: "Trial context, company story, mission, vision, values, and working expectations.",
    modules: [
      ["welcome", "Welcome to Ghost AI Solutions", "Understand the paid trial, Stephen's expectations, and how to communicate uncertainty."],
      ["stephen_story", "Stephen's Story and the Origin of Ghost AI Solutions", "Learn the professional origin of Ghost AI Solutions and why it exists."],
      ["mission_values", "Mission, Vision, and Values", "Understand the operating values that guide Ghost AI Solutions work."]
    ]
  },
  {
    key: "course_company",
    title: "How Ghost AI Solutions Works",
    description: "Company structure, product ecosystem, services, and client lifecycle.",
    modules: [
      ["company_structure", "Company Structure", "Understand Stephen, Nova, Vega, Echo, GEO, Ghost Portal, and Mission Control."],
      ["product_ecosystem", "Ghost Product Ecosystem", "Learn how Nova, Vega, Echo, GEO, Ghost Portal, and Mission Control work together."],
      ["service_catalog", "Services Ghost AI Solutions Offers", "Learn the service catalog and what Operations may or may not say."],
      ["client_lifecycle", "Client Lifecycle", "Understand the standard client journey and Alex's role at each stage."]
    ]
  },
  {
    key: "course_operations_role",
    title: "Operations Role and Responsibilities",
    description: "Role boundaries, success criteria, daily rhythm, and report standards.",
    modules: [
      ["trial_role", "Alex's Trial Role", "Clarify core responsibilities and explicit authority limits."],
      ["success_criteria", "What Success Looks Like", "Learn reliable work behaviors and warning signs."],
      ["daily_rhythm", "Daily Operating Rhythm", "Use a repeatable start, during-shift, and closeout checklist."],
      ["report_standards", "End-of-Day Report Standards", "Write accurate reports that describe outcomes, blockers, and next priorities."]
    ]
  },
  {
    key: "course_communication",
    title: "Communication Standards",
    description: "Brand voice, client communication, escalations, and internal communication.",
    modules: [
      ["brand_voice", "Ghost AI Solutions Brand Voice", "Use clear, helpful, honest communication without overpromising."],
      ["client_rules", "Client Communication Rules", "Know what Alex may send, what needs approval, and what must be escalated."],
      ["upset_clients", "Handling Upset or Confused Clients", "Respond calmly, gather facts, and avoid unauthorized commitments."],
      ["internal_communication", "Internal Communication with Stephen", "Choose Waiting on Stephen, task comments, or urgent direct contact appropriately."]
    ]
  },
  {
    key: "course_security",
    title: "Security, Privacy, and Confidentiality",
    description: "Confidential information, access rules, responsible AI, and incident escalation.",
    modules: [
      ["confidential_info", "Confidential Information", "Identify sensitive company, client, technical, and personal data."],
      ["access_rules", "Access Rules", "Use assigned accounts safely and avoid unauthorized storage, downloads, or permission changes."],
      ["ai_safety", "AI Safety and Responsible Use", "Review AI output, protect data, and escalate risky content."],
      ["incident_escalation", "Security Incident Escalation", "Stop, preserve evidence, notify Stephen, and document security concerns."]
    ]
  },
  {
    key: "course_portal",
    title: "Using Ghost Portal",
    description: "Dashboard, tasks, clients, leads, drafts, approvals, reports, and feedback.",
    modules: [
      ["portal_dashboard", "Dashboard", "Read priorities, progress, assigned records, announcements, activity, and timezone context."],
      ["portal_tasks", "My Tasks", "Use Not Started, In Progress, Waiting on Stephen, Waiting on Client, Completed, and Blocked correctly."],
      ["portal_clients", "Clients", "Understand assigned-client access, notes, follow-ups, and Founder-only minimization."],
      ["portal_leads", "Leads", "Manage lead stages, next actions, follow-up dates, and approval requirements."],
      ["draft_communications", "Draft Communications", "Draft, submit, revise, approve, and manually record sent communications."],
      ["waiting_on_stephen", "Waiting on Stephen", "Create strong approval requests with summary, context, impact, recommendation, deadline, and priority."],
      ["portal_daily_reports", "Daily Reports", "Enter work dates, shift times, break minutes, outcomes, blockers, and next priorities."],
      ["mission_feedback", "Mission Feedback", "Report bugs, unclear wording, missing instructions, workflow friction, and improvement ideas."]
    ]
  },
  {
    key: "course_tools",
    title: "Tools and Work Environment",
    description: "Approved channels, GoHighLevel, Google Workspace, Canva, and CapCut.",
    modules: [
      ["approved_channels", "Approved Communication Channels", "Keep work tracking in Ghost Portal and document decisions from transition channels."],
      ["ghl_overview", "GoHighLevel Overview", "Understand GHL use for leads, records, appointments, and communication history when access is ready."],
      ["google_workspace", "Google Workspace", "Use company email, calendar, Drive, Meet, and file naming safely."],
      ["canva_capcut", "Canva and CapCut", "Use approved brand assets, templates, editable source files, and publishing approvals."]
    ]
  },
  {
    key: "course_trial_plan",
    title: "First-Week Trial Plan",
    description: "Day-by-day objectives and mutual trial evaluation.",
    modules: [
      ["day_1", "Day 1", "Complete core onboarding, learn Ghost Portal, record questions, update tasks, and submit a report."],
      ["day_2", "Day 2", "Review demo records, practice task updates, draft a follow-up, and submit an approval request."],
      ["day_3", "Day 3", "Begin controlled operational work, organize records, prepare follow-ups, and document missing SOPs."],
      ["day_4", "Day 4", "Work with less direction while maintaining task accuracy and identifying bottlenecks."],
      ["day_5", "Day 5", "Run morning review, complete assigned work, produce weekly summary, and recommend a 30-day plan."],
      ["trial_evaluation", "Trial Evaluation", "Understand reliability, communication, organization, accuracy, initiative, judgment, and client readiness."]
    ]
  }
] as const;

const policies = [
  "Confidentiality Policy",
  "Password and Access Policy",
  "Acceptable Use Policy",
  "AI Usage Policy",
  "Client Communication Policy",
  "Data Handling Policy",
  "Remote Work Security Policy",
  "Conflict of Interest Policy",
  "Work Product and Intellectual Property Policy",
  "Time Reporting Policy",
  "Incident Reporting Policy",
  "Social Media and Public Representation Policy",
  "Approval and Authority Policy",
  "Trial Contractor Expectations",
  "Records Retention and Documentation Policy"
];

const sopGroups: Array<{ category: SOPCategory; titles: string[] }> = [
  { category: "Operations", titles: ["Start-of-shift review", "End-of-shift closeout", "Submit an end-of-day report", "Update a task", "Add a task comment", "Request Stephen's approval", "Report a Portal issue", "Escalate urgent work", "Organize assigned priorities", "Document a new recurring process"] },
  { category: "ClientOperations", titles: ["Review an assigned client", "Update client operational notes", "Request missing information from a client", "Prepare a client status update", "Escalate a client complaint", "Record client communication", "Track a pending client decision", "Handle a revision request", "Close a client follow-up", "Identify an at-risk client"] },
  { category: "LeadOperations", titles: ["Review an assigned lead", "Update lead next action", "Draft a lead follow-up", "Submit a draft for approval", "Record a follow-up outcome", "Schedule a discovery call", "Move a lead to nurture", "Flag a pricing question", "Flag a lead requiring Stephen", "Clean an incomplete lead record"] },
  { category: "MeetingsExecutiveSupport", titles: ["Schedule a meeting", "Confirm a meeting", "Prepare a meeting brief", "Record meeting notes", "Track action items", "Reschedule a meeting", "Cancel a meeting professionally", "Prepare Stephen's daily priority summary", "Maintain Waiting on Stephen", "Follow up on an unanswered decision"] },
  { category: "ContentMarketingSupport", titles: ["Prepare a social-post draft", "Schedule approved content", "Organize content assets", "Repurpose long-form content", "Review content for brand consistency", "Submit content for approval", "Record published content", "Identify missing content assets", "Maintain a content calendar", "Escalate public-comment risk"] }
];

const knowledgeArticles = [
  "What is Nova?",
  "What is Vega?",
  "What is Echo?",
  "What is GEO?",
  "What is Ghost Portal?",
  "What is Mission Control?",
  "Ghost AI Solutions service catalog",
  "Brand voice guide",
  "Company terminology",
  "Technology overview",
  "Pricing philosophy",
  "Client lifecycle"
];

export async function seedAcademy(prisma: PrismaLike) {
  const founder = await prisma.user.findFirst({ where: { role: { name: "Founder" }, status: "Active" } });
  const alex = await prisma.user.findFirst({ where: { email: (process.env.OPERATIONS_SEED_EMAIL ?? "amariexc@gmail.com").toLowerCase() } });

  const path = await prisma.learningPath.upsert({
    where: { sourceKey: "operations_assistant_trial_path" },
    update: {
      title: "Operations and Executive Assistant - Trial Onboarding",
      description: "A complete Ghost Academy path for Alex's one-week paid Operations and Executive Assistant trial.",
      visibleToRoles: audience,
      active: true,
      version: 1,
      estimatedTotalMinutes: 300,
      updatedById: founder?.id
    },
    create: {
      sourceKey: "operations_assistant_trial_path",
      slug: "operations-assistant-trial-onboarding",
      title: "Operations and Executive Assistant - Trial Onboarding",
      description: "A complete Ghost Academy path for Alex's one-week paid Operations and Executive Assistant trial.",
      visibleToRoles: audience,
      active: true,
      version: 1,
      estimatedTotalMinutes: 300,
      createdById: founder?.id,
      updatedById: founder?.id
    }
  });

  if (alex) {
    await prisma.learningPathAssignment.upsert({
      where: { pathId_userId: { pathId: path.id, userId: alex.id } },
      update: { status: "Assigned", required: true, customNotes: "Complete before unsupervised client-facing work." },
      create: {
        pathId: path.id,
        userId: alex.id,
        assignedById: founder?.id,
        dueDate: new Date(Date.UTC(2026, 6, 26)),
        required: true,
        customNotes: "Complete before unsupervised client-facing work."
      }
    });
  }

  let sortOrder = 1;
  for (const [courseIndex, courseData] of courses.entries()) {
    const course = await prisma.course.upsert({
      where: { sourceKey: courseData.key },
      update: { title: courseData.title, description: courseData.description, sortOrder: courseIndex + 1, published: true },
      create: {
        sourceKey: courseData.key,
        slug: slug(courseData.title),
        pathId: path.id,
        title: courseData.title,
        description: courseData.description,
        sortOrder: courseIndex + 1
      }
    });

    for (const moduleData of courseData.modules) {
      await syncModule(prisma, {
        key: `module_${moduleData[0]}`,
        courseId: course.id,
        title: moduleData[1],
        summary: moduleData[2],
        body: buildModuleBody(moduleData[1], moduleData[2]),
        sortOrder,
        estimatedMinutes: moduleData[0].startsWith("day_") ? 6 : 10,
        acknowledgementRequired: ["welcome", "incident_escalation", "client_rules", "access_rules", "ai_safety"].includes(moduleData[0]),
        acknowledgementText: acknowledgementFor(moduleData[1]),
        contentType: "Learning"
      });
      sortOrder += 1;
    }
  }

  const policyCourse = await prisma.course.upsert({
    where: { sourceKey: "course_policies" },
    update: { title: "Policies and Required Acknowledgements", description: "Internal policies that govern safe Operations work.", sortOrder: 99, published: true },
    create: {
      sourceKey: "course_policies",
      slug: "policies-and-required-acknowledgements",
      pathId: path.id,
      title: "Policies and Required Acknowledgements",
      description: "Internal policies that govern safe Operations work.",
      sortOrder: 99
    }
  });

  for (const [index, title] of policies.entries()) {
    const courseModule = await syncModule(prisma, {
      key: `policy_${slug(title)}`,
      courseId: policyCourse.id,
      title,
      summary: `${title} provides operational guidance and does not replace signed agreements or applicable law.`,
      body: buildPolicyBody(title),
      sortOrder: 200 + index,
      estimatedMinutes: 4,
      acknowledgementRequired: true,
      acknowledgementText: `I acknowledge that I have read and understand the ${title} as internal operational guidance.`,
      contentType: "Policy",
      founderReviewRequired: true
    });
    if (alex) {
      await prisma.requiredReadingAssignment.upsert({
        where: { userId_contentType_contentId: { userId: alex.id, contentType: "Policy", contentId: courseModule.id } },
        update: { required: true },
        create: { userId: alex.id, contentType: "Policy", contentId: courseModule.id, assignedById: founder?.id, required: true }
      });
    }
  }

  let sopCount = 1;
  for (const group of sopGroups) {
    for (const title of group.titles) {
      await syncSOP(prisma, sopCount, group.category, title);
      sopCount += 1;
    }
  }

  for (const title of knowledgeArticles) {
    const article = await prisma.knowledgeArticle.upsert({
      where: { id: `academy_${slug(title)}` },
      update: {
        title,
        category: "Ghost Academy",
        body: buildKnowledgeBody(title),
        status: "Published",
        visibleToRoles: audience,
        requiredReading: false
      },
      create: {
        id: `academy_${slug(title)}`,
        title,
        category: "Ghost Academy",
        body: buildKnowledgeBody(title),
        status: "Published",
        ownerId: founder?.id,
        visibleToRoles: audience,
        requiredReading: false
      }
    });
    await prisma.knowledgeArticleVersion.upsert({
      where: { articleId_version: { articleId: article.id, version: article.version } },
      update: { title: article.title, body: article.body },
      create: { articleId: article.id, version: article.version, title: article.title, body: article.body, changedById: founder?.id }
    });
  }
}

async function syncModule(prisma: PrismaLike, input: {
  key: string;
  courseId: string;
  title: string;
  summary: string;
  body: string;
  sortOrder: number;
  estimatedMinutes: number;
  acknowledgementRequired: boolean;
  acknowledgementText: string;
  contentType: "Learning" | "Policy";
  founderReviewRequired?: boolean;
}) {
  const existing = await prisma.courseModule.findUnique({ where: { sourceKey: input.key } });
  const data = {
    courseId: input.courseId,
    slug: slug(input.title),
    title: input.title,
    summary: input.summary,
    learningObjectives: objectivesFor(input.title),
    body: input.body,
    sortOrder: input.sortOrder,
    estimatedMinutes: input.estimatedMinutes,
    required: true,
    contentType: input.contentType,
    published: !input.founderReviewRequired || input.contentType !== "Learning",
    audienceRoles: audience,
    version: 1,
    acknowledgementRequired: input.acknowledgementRequired,
    acknowledgementText: input.acknowledgementText,
    knowledgeCheckRequired: true,
    minimumPassingScore: 80,
    founderReviewRequired: input.founderReviewRequired ?? false,
    seedManaged: true,
    lastReviewed: new Date(Date.UTC(2026, 6, 20)),
    nextReviewDate: new Date(Date.UTC(2026, 9, 20))
  };

  const courseModule = existing
    ? existing.seedManaged
      ? await prisma.courseModule.update({ where: { id: existing.id }, data })
      : existing
    : await prisma.courseModule.create({ data: { ...data, sourceKey: input.key } });

  if (courseModule.seedManaged) {
    await prisma.moduleSection.deleteMany({ where: { moduleId: courseModule.id } });
    await prisma.moduleSection.createMany({
      data: [
        { moduleId: courseModule.id, sortOrder: 1, heading: "Practical Examples", body: examplesFor(input.title) },
        { moduleId: courseModule.id, sortOrder: 2, heading: "Role Boundaries", body: boundariesFor(input.title) },
        { moduleId: courseModule.id, sortOrder: 3, heading: "Founder Review", body: founderReviewFor(input.title) }
      ]
    });
    await syncKnowledgeCheck(prisma, courseModule.id, input.title);
  }

  await prisma.contentAudience.upsert({
    where: { contentType_contentId_role: { contentType: input.contentType, contentId: courseModule.id, role: operationsRole } },
    update: { required: true },
    create: { contentType: input.contentType, contentId: courseModule.id, role: operationsRole, required: true }
  });
  return courseModule;
}

async function syncKnowledgeCheck(prisma: PrismaLike, moduleId: string, title: string) {
  const check = await prisma.knowledgeCheck.upsert({
    where: { moduleId },
    update: { passingScore: 80, unlimitedRetries: true },
    create: { moduleId, passingScore: 80, unlimitedRetries: true }
  });
  await prisma.knowledgeCheckQuestion.deleteMany({ where: { checkId: check.id } });
  const questions = [
    {
      type: "MultipleChoice" as const,
      prompt: `Instructions for ${title} are unclear. What should Alex do first?`,
      explanation: "Alex should ask a clear question, document uncertainty, and avoid guessing.",
      options: ["Guess and move quickly", "Ask Stephen or use the appropriate Portal question/approval path", "Skip the work silently"]
    },
    {
      type: "ScenarioChoice" as const,
      prompt: "A client asks Alex to confirm a $500 discount and a Friday launch date. What should Alex do?",
      explanation: "Pricing, discounts, and launch commitments require Stephen's approval.",
      options: ["Confirm both to keep momentum", "Acknowledge the request, avoid confirming commitments, document it, and submit to Stephen", "Ignore the client"]
    },
    {
      type: "TrueFalse" as const,
      prompt: "Accurate, transparent work matters more than pretending to understand every system immediately.",
      explanation: "The trial values communication, judgment, and reliable learning.",
      options: ["True", "False"]
    }
  ];

  for (const [index, question] of questions.entries()) {
    const created = await prisma.knowledgeCheckQuestion.create({
      data: { checkId: check.id, type: question.type, prompt: question.prompt, explanation: question.explanation, sortOrder: index + 1 }
    });
    await prisma.knowledgeCheckOption.createMany({
      data: question.options.map((label, optionIndex) => ({
        questionId: created.id,
        label,
        sortOrder: optionIndex + 1,
        correct: optionIndex === 1 || (question.type === "TrueFalse" && optionIndex === 0)
      }))
    });
  }
}

async function syncSOP(prisma: PrismaLike, number: number, category: SOPCategory, title: string) {
  const key = `sop_${number}_${slug(title)}`;
  const existing = await prisma.sOPArticle.findUnique({ where: { sourceKey: key } });
  const data = {
    slug: slug(title),
    title,
    category,
    purpose: `Provide a repeatable standard for ${title.toLowerCase()} inside Ghost AI Solutions operations.`,
    owner: "Founder",
    audienceRoles: audience,
    trigger: `Use this SOP whenever the work requires ${title.toLowerCase()}.`,
    requiredInputs: ["Assigned task or record", "Current facts", "Relevant deadline", "Known approval requirements"],
    body: buildSOPBody(title),
    approvalPoints: ["Pricing, scope, sensitive client communication, deadlines, and public statements require Stephen approval."],
    escalationConditions: ["Client risk", "Security concern", "Legal or payment issue", "Unclear authority", "Blocked deadline"],
    completionCriteria: ["Record updated", "Task/comment/report reflects outcome", "Any approval request created", "Next action is clear"],
    relatedTemplates: ["Daily report form", "Waiting on Stephen request", "Task comment"],
    version: 1,
    published: true,
    seedManaged: true,
    founderReviewRequired: true,
    lastReviewed: new Date(Date.UTC(2026, 6, 20)),
    nextReviewDate: new Date(Date.UTC(2026, 9, 20))
  };
  const sop = existing
    ? existing.seedManaged
      ? await prisma.sOPArticle.update({ where: { id: existing.id }, data })
      : existing
    : await prisma.sOPArticle.create({ data: { ...data, sourceKey: key } });
  if (sop.seedManaged) {
    await prisma.sOPStep.deleteMany({ where: { sopId: sop.id } });
    await prisma.sOPStep.createMany({
      data: [
        { sopId: sop.id, stepNumber: 1, title: "Confirm scope", instruction: "Open the related Portal record and confirm the task, client, lead, due date, and approval requirements before acting." },
        { sopId: sop.id, stepNumber: 2, title: "Gather facts", instruction: "Review notes, comments, previous communication, and attached context. Do not rely on memory when the Portal has a source of truth." },
        { sopId: sop.id, stepNumber: 3, title: "Do the work", instruction: `Perform ${title.toLowerCase()} using approved systems and keep sensitive information inside approved channels.` },
        { sopId: sop.id, stepNumber: 4, title: "Document outcome", instruction: "Add a meaningful task comment or record update that states what changed, what remains open, and any blocker." },
        { sopId: sop.id, stepNumber: 5, title: "Escalate or close", instruction: "Create a Waiting on Stephen request when authority is unclear; otherwise mark the next action and close the loop." }
      ]
    });
  }
}

function buildModuleBody(title: string, summary: string) {
  return `# ${title}

## Purpose
${summary} This module teaches the operational judgment Alex needs before doing work without live explanation from Stephen. It is written for the current Operations trial and should remain useful for future Operations employees after Founder review.

## Core Content
Ghost AI Solutions is an AI-first business that combines practical automation, modern software, websites, client systems, lead-generation support, marketing coordination, and internal intelligent systems. Alex's role is to reduce operational friction by keeping records accurate, surfacing decisions early, preparing clear drafts, and protecting confidential information.

The standard operating expectation is simple: use Ghost Portal as the source of truth, keep Stephen informed when a decision is required, and never pretend that unclear instructions are clear. Good Operations work is visible. It leaves behind task comments, updated records, clear daily reports, and questions that help the company improve its systems.

## What Good Looks Like
Good work is specific, verified, and documented. Alex should name the client, lead, task, date, blocker, and next action when reporting progress. When AI helps with drafts or summaries, Alex must review names, dates, prices, promises, and facts before trusting the output.

## What To Avoid
Avoid guessing, silent confusion, unapproved client commitments, vague updates, copying sensitive data into unapproved tools, and treating placeholder content as final policy. When a decision affects pricing, deadlines, scope, public representation, security, or client risk, it belongs in Waiting on Stephen.`;
}

function buildPolicyBody(title: string) {
  return `# ${title}

These internal policies provide operational guidance and do not replace signed agreements or applicable law.

## Purpose
The purpose of the ${title} is to give Operations clear rules for safe, reliable work during the paid trial. The policy protects Ghost AI Solutions, clients, employees, contractors, and future systems.

## Scope
This applies to Alex's Ghost Portal work, assigned client or lead records, task comments, daily reports, draft communications, files, AI-assisted work, and any approved third-party tools.

## Rules
- Keep confidential information inside approved systems.
- Do not make commitments about pricing, deadlines, refunds, contracts, security, or scope without Stephen's approval.
- Document decisions, blockers, and completed outcomes in Ghost Portal.
- Use only assigned accounts and never share credentials.
- Escalate risk, confusion, or possible incidents quickly.

## Examples
A safe action is documenting a client request and submitting it for approval. An unsafe action is confirming a discount, launch date, or sensitive technical answer without Founder approval.

## Escalation
Escalate immediately when information is sensitive, a client is upset, a deadline may be missed, a credential may be exposed, or authority is unclear.

## Founder Review
Founder review required before this policy is treated as final legal or contractual language.`;
}

function buildSOPBody(title: string) {
  return `# ${title}

## Purpose
This SOP standardizes ${title.toLowerCase()} so Operations work is repeatable, documented, and reviewable.

## Operating Standard
Start from the Portal record, verify the facts, perform only the authorized work, document the outcome, and escalate anything requiring Stephen's decision. The goal is not just to complete an action, but to leave the next person with enough context to understand what happened.

## Approval Points
Stephen approval is required for pricing, discounts, refunds, scope changes, sensitive client disputes, public statements, security concerns, legal concerns, and commitments that could affect delivery.

## Completion Criteria
The work is complete only when the relevant record is updated, the next action is clear, blockers are documented, and any required Waiting on Stephen request has been created.`;
}

function buildKnowledgeBody(title: string) {
  return `# ${title}

${title} is part of the Ghost Academy Knowledge Base. This article provides quick reference context for Operations and Founder users.

Ghost AI Solutions uses this concept as part of an AI-first operating model. Alex may use this reference to understand terminology, organize records, prepare drafts, and ask better questions. This reference does not authorize pricing, client promises, technical guarantees, public claims, or security decisions without Stephen's approval.

Founder review may refine this article as Ghost AI Solutions formalizes products, service language, and internal operating standards.`;
}

function objectivesFor(title: string) {
  return [
    `Explain the purpose of ${title}.`,
    "Identify what Alex may do independently and what requires Stephen's approval.",
    "Document questions, blockers, and next actions in Ghost Portal."
  ];
}

function examplesFor(title: string) {
  return `Good example: Alex reviews ${title}, updates the relevant Portal record, notes the specific outcome, and asks Stephen a clear question when authority is unclear.

Bad example: Alex guesses, sends an unapproved commitment, or reports "worked on this" without measurable detail.`;
}

function boundariesFor(title: string) {
  return `For ${title}, Alex may organize information, prepare drafts, update assigned records, ask questions, and document outcomes.

Alex needs approval for pricing, deadlines, scope changes, sensitive client communication, public statements, legal concerns, security issues, and anything involving money or contractual authority.

Alex may not share credentials, move client data into personal storage, represent herself as an executive officer, or promise technical outcomes she cannot verify.`;
}

function founderReviewFor(title: string) {
  return `Founder review required for final wording in ${title} if it affects pricing language, client commitments, legal policy, public representation, working hours, or tool access. Alex should treat unpublished or review-flagged material as draft guidance only.`;
}

function acknowledgementFor(title: string) {
  if (title === "Welcome to Ghost AI Solutions") {
    return "I understand that this is a paid trial designed to evaluate mutual fit, communication, initiative, judgment, and operational reliability.";
  }
  return `I understand the requirements and boundaries in ${title} and will ask Stephen when instructions or authority are unclear.`;
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
