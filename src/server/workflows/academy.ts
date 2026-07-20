"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { writeAuditLog } from "@/server/audit/audit";
import { getPrisma } from "@/server/db/prisma";
import { requirePermission, requireUser } from "@/server/permissions/authorize";
import { hasPermission } from "@/server/permissions/roles";
import { createNotification } from "@/server/workflows/notifications";

export async function submitKnowledgeCheckAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "academy:read")) throw new Error("Forbidden: academy:read");

  const checkId = z.string().min(1).parse(formData.get("checkId"));
  const moduleId = z.string().min(1).parse(formData.get("moduleId"));
  const courseModule = await findVisibleModule(moduleId, user.role);
  if (!courseModule?.knowledgeCheck || courseModule.knowledgeCheck.id !== checkId) throw new Error("Forbidden: knowledge check");

  let correct = 0;
  let scorable = 0;
  let requiresFounderReview = false;
  const answers: Record<string, string> = {};

  for (const question of courseModule.knowledgeCheck.questions) {
    const answer = String(formData.get(`question_${question.id}`) ?? "").trim();
    answers[question.id] = answer;
    if (question.type === "ShortResponse" || question.requiredFounderReview) {
      requiresFounderReview = true;
      continue;
    }
    scorable += 1;
    const option = question.options.find((candidate) => candidate.id === answer);
    if (option?.correct) correct += 1;
  }

  const score = scorable === 0 ? 0 : Math.round((correct / scorable) * 100);
  const status = requiresFounderReview ? "FounderReview" : score >= courseModule.knowledgeCheck.passingScore ? "Passed" : "Failed";

  await getPrisma().knowledgeCheckAttempt.create({
    data: {
      checkId,
      userId: user.id,
      answers,
      score,
      status
    }
  });

  await getPrisma().academyActivity.create({
    data: {
      userId: user.id,
      action: "submitted knowledge check",
      targetType: "CourseModule",
      targetId: courseModule.id,
      target: `${courseModule.title}: ${status}`
    }
  });

  revalidatePath(`/academy/modules/${courseModule.id}`);
}

export async function completeAcademyModuleAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "academy:read")) throw new Error("Forbidden: academy:read");
  const moduleId = z.string().min(1).parse(formData.get("moduleId"));
  const courseModule = await findVisibleModule(moduleId, user.role);
  if (!courseModule) throw new Error("Forbidden: module");

  if (courseModule.acknowledgementRequired && formData.get("acknowledgement") !== "on") {
    throw new Error("Required acknowledgement must be accepted before completion.");
  }

  let passedAttemptId: string | undefined;
  if (courseModule.knowledgeCheckRequired && courseModule.knowledgeCheck) {
    const passedAttempt = await getPrisma().knowledgeCheckAttempt.findFirst({
      where: { checkId: courseModule.knowledgeCheck.id, userId: user.id, status: "Passed" },
      orderBy: { submittedAt: "desc" }
    });
    if (!passedAttempt) throw new Error("Required knowledge check must be passed before completion.");
    passedAttemptId = passedAttempt.id;
  }

  await getPrisma().$transaction(async (tx) => {
    if (courseModule.acknowledgementRequired) {
      await tx.policyAcknowledgement.upsert({
        where: { userId_moduleId_moduleVersion: { userId: user.id, moduleId: courseModule.id, moduleVersion: courseModule.version } },
        update: { statement: courseModule.acknowledgementText ?? "Acknowledged.", acknowledgedAt: new Date() },
        create: {
          userId: user.id,
          moduleId: courseModule.id,
          moduleVersion: courseModule.version,
          statement: courseModule.acknowledgementText ?? "Acknowledged."
        }
      });
    }

    await tx.moduleCompletion.upsert({
      where: { userId_moduleId_moduleVersion: { userId: user.id, moduleId: courseModule.id, moduleVersion: courseModule.version } },
      update: {
        acknowledgementAccepted: courseModule.acknowledgementRequired,
        knowledgeCheckAttemptId: passedAttemptId,
        completedAt: new Date()
      },
      create: {
        userId: user.id,
        moduleId: courseModule.id,
        moduleVersion: courseModule.version,
        acknowledgementAccepted: courseModule.acknowledgementRequired,
        knowledgeCheckAttemptId: passedAttemptId
      }
    });

    await tx.academyActivity.create({
      data: {
        userId: user.id,
        action: "completed module",
        targetType: "CourseModule",
        targetId: courseModule.id,
        target: courseModule.title
      }
    });
  });

  await writeAuditLog({ userId: user.id, action: "academy.module_completed", entity: "CourseModule", entityId: courseModule.id });
  revalidatePath("/academy");
  revalidatePath(`/academy/modules/${courseModule.id}`);
}

export async function saveModuleNoteAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "academy:read")) throw new Error("Forbidden: academy:read");
  const parsed = z.object({ moduleId: z.string().min(1), body: z.string().min(1).max(5000) }).parse({
    moduleId: formData.get("moduleId"),
    body: formData.get("body")
  });
  const courseModule = await findVisibleModule(parsed.moduleId, user.role);
  if (!courseModule) throw new Error("Forbidden: module");

  await getPrisma().employeeModuleNote.upsert({
    where: { userId_moduleId: { userId: user.id, moduleId: parsed.moduleId } },
    update: { body: parsed.body },
    create: { userId: user.id, moduleId: parsed.moduleId, body: parsed.body }
  });
  revalidatePath(`/academy/modules/${parsed.moduleId}`);
}

export async function submitEmployeeQuestionAction(formData: FormData) {
  const user = await requireUser();
  if (!hasPermission(user, "academy:read")) throw new Error("Forbidden: academy:read");
  const parsed = z.object({
    moduleId: z.string().optional(),
    urgency: z.enum(["Normal", "Urgent"]).default("Normal"),
    question: z.string().min(5).max(4000)
  }).parse({
    moduleId: stringOrUndefined(formData.get("moduleId")),
    urgency: formData.get("urgency") ?? "Normal",
    question: formData.get("question")
  });

  if (parsed.moduleId && !(await findVisibleModule(parsed.moduleId, user.role))) throw new Error("Forbidden: module");

  const question = await getPrisma().employeeQuestion.create({
    data: {
      userId: user.id,
      moduleId: parsed.moduleId,
      urgency: parsed.urgency,
      question: parsed.question
    }
  });

  const founder = await getPrisma().user.findFirst({ where: { role: { name: "Founder" }, status: "Active" } });
  if (founder) {
    await createNotification({ userId: founder.id, title: "Academy question from Alex", body: parsed.question.slice(0, 180), href: "/admin/academy/questions" });
  }

  await getPrisma().academyActivity.create({
    data: { userId: user.id, action: "asked academy question", targetType: "EmployeeQuestion", targetId: question.id, target: parsed.question.slice(0, 120) }
  });
  revalidatePath("/academy/questions");
  if (parsed.moduleId) revalidatePath(`/academy/modules/${parsed.moduleId}`);
}

export async function answerEmployeeQuestionAction(formData: FormData) {
  const user = await requirePermission("academy:manage");
  const parsed = z.object({
    questionId: z.string().min(1),
    answer: z.string().min(3).max(5000)
  }).parse({
    questionId: formData.get("questionId"),
    answer: formData.get("answer")
  });

  const question = await getPrisma().employeeQuestion.update({
    where: { id: parsed.questionId },
    data: { answer: parsed.answer, answeredById: user.id, answeredAt: new Date(), status: "Answered" }
  });
  await createNotification({ userId: question.userId, title: "Stephen answered your Academy question", href: "/academy/questions" });
  revalidatePath("/admin/academy/questions");
}

export async function markEmployeeQuestionResolvedAction(formData: FormData) {
  const user = await requireUser();
  const questionId = z.string().min(1).parse(formData.get("questionId"));
  const question = await getPrisma().employeeQuestion.findUnique({ where: { id: questionId } });
  if (!question || question.userId !== user.id) throw new Error("Forbidden: question");
  await getPrisma().employeeQuestion.update({ where: { id: questionId }, data: { status: "Resolved", resolvedAt: new Date() } });
  revalidatePath("/academy/questions");
}

export async function updateAcademyModuleAction(formData: FormData) {
  const user = await requirePermission("academy:manage");
  const parsed = z.object({
    moduleId: z.string().min(1),
    title: z.string().min(3),
    summary: z.string().min(5),
    body: z.string().min(20),
    published: z.boolean().default(false),
    founderReviewRequired: z.boolean().default(false),
    incrementVersion: z.boolean().default(false)
  }).parse({
    moduleId: formData.get("moduleId"),
    title: formData.get("title"),
    summary: formData.get("summary"),
    body: formData.get("body"),
    published: formData.get("published") === "on",
    founderReviewRequired: formData.get("founderReviewRequired") === "on",
    incrementVersion: formData.get("incrementVersion") === "on"
  });

  const current = await getPrisma().courseModule.findUnique({ where: { id: parsed.moduleId } });
  if (!current) throw new Error("Module not found");
  const nextVersion = parsed.incrementVersion ? current.version + 1 : current.version;

  await getPrisma().courseModule.update({
    where: { id: parsed.moduleId },
    data: {
      title: parsed.title,
      summary: parsed.summary,
      body: parsed.body,
      published: parsed.published,
      founderReviewRequired: parsed.founderReviewRequired,
      version: nextVersion,
      seedManaged: false,
      lastReviewed: new Date(),
      ownerId: user.id
    }
  });
  revalidatePath("/admin/academy/content");
  revalidatePath(`/academy/modules/${parsed.moduleId}`);
}

async function findVisibleModule(moduleId: string, role: string) {
  return getPrisma().courseModule.findFirst({
    where: {
      id: moduleId,
      archivedAt: null,
      ...(role === "Founder" ? {} : { published: true, audienceRoles: { has: role as never } })
    },
    include: {
      knowledgeCheck: {
        include: {
          questions: {
            include: { options: { orderBy: { sortOrder: "asc" } } },
            orderBy: { sortOrder: "asc" }
          }
        }
      }
    }
  });
}

function stringOrUndefined(value: FormDataEntryValue | null) {
  if (typeof value !== "string") return undefined;
  return value.trim() ? value.trim() : undefined;
}
