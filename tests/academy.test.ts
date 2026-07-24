import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeAcademyModuleAction, markEmployeeQuestionResolvedAction, submitKnowledgeCheckAction, unlockKnowledgeCheckAttemptAction, updateKnowledgeQuestionMetadataAction } from "@/server/workflows/academy";

const prismaMock = {
  courseModule: {
    findFirst: vi.fn()
  },
  knowledgeCheckAttempt: {
    create: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn()
  },
  knowledgeCheckAttemptUnlock: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn()
  },
  academyActivity: {
    create: vi.fn()
  },
  employeeQuestion: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  knowledgeCheckQuestion: {
    update: vi.fn()
  },
  $transaction: vi.fn()
};

const txMock = {
  policyAcknowledgement: { upsert: vi.fn() },
  moduleCompletion: { upsert: vi.fn() },
  knowledgeCheckAttempt: { create: vi.fn() },
  knowledgeCheckAttemptUnlock: { update: vi.fn() },
  academyActivity: { create: vi.fn() }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("@/server/permissions/authorize", () => ({
  requireUser: vi.fn().mockResolvedValue({
    id: "user_alex",
    name: "Alexandra Marie Canto",
    email: "amariexc@gmail.com",
    role: "Operations",
    preferredName: "Alex",
    status: "Active",
    timezone: "Asia/Manila"
  }),
  requirePermission: vi.fn().mockResolvedValue({
    id: "user_stephen",
    role: "Founder"
  })
}));

vi.mock("@/server/audit/audit", () => ({
  writeAuditLog: vi.fn()
}));

vi.mock("@/server/workflows/notifications", () => ({
  createNotification: vi.fn()
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const visibleModule = {
  id: "module_1",
  title: "Welcome",
  version: 1,
  acknowledgementRequired: true,
  acknowledgementText: "I understand.",
  knowledgeCheckRequired: true,
  knowledgeCheck: {
    id: "check_1",
    passingScore: 80,
    questions: [
      {
        id: "question_1",
        type: "MultipleChoice",
        requiredFounderReview: false,
        options: [
          { id: "option_wrong", correct: false },
          { id: "option_right", correct: true }
        ]
      }
    ]
  }
};

describe("academy workflows", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback) => callback(txMock));
    prismaMock.knowledgeCheckAttempt.findMany.mockResolvedValue([]);
    prismaMock.knowledgeCheckAttemptUnlock.findFirst.mockResolvedValue(null);
  });

  it("scores knowledge checks and records passing attempts", async () => {
    prismaMock.courseModule.findFirst.mockResolvedValue(visibleModule);
    txMock.knowledgeCheckAttempt.create.mockResolvedValue({ id: "attempt_1" });
    prismaMock.academyActivity.create.mockResolvedValue({ id: "activity_1" });

    const form = new FormData();
    form.set("checkId", "check_1");
    form.set("moduleId", "module_1");
    form.set("question_question_1", "option_right");

    await submitKnowledgeCheckAction(form);

    expect(txMock.knowledgeCheckAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ score: 100, status: "Passed" })
    }));
  });

  it("marks the second failed knowledge check as NeedsReview", async () => {
    prismaMock.courseModule.findFirst.mockResolvedValue(visibleModule);
    prismaMock.knowledgeCheckAttempt.findMany.mockResolvedValue([{ id: "attempt_1", status: "Failed" }]);
    txMock.knowledgeCheckAttempt.create.mockResolvedValue({ id: "attempt_2" });
    prismaMock.academyActivity.create.mockResolvedValue({ id: "activity_1" });

    const form = new FormData();
    form.set("checkId", "check_1");
    form.set("moduleId", "module_1");
    form.set("question_question_1", "option_wrong");

    await submitKnowledgeCheckAction(form);

    expect(txMock.knowledgeCheckAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ score: 0, status: "NeedsReview" })
    }));
  });

  it("blocks additional attempts after two failed attempts without manager unlock", async () => {
    prismaMock.courseModule.findFirst.mockResolvedValue(visibleModule);
    prismaMock.knowledgeCheckAttempt.findMany.mockResolvedValue([
      { id: "attempt_2", status: "NeedsReview" },
      { id: "attempt_1", status: "Failed" }
    ]);

    const form = new FormData();
    form.set("checkId", "check_1");
    form.set("moduleId", "module_1");
    form.set("question_question_1", "option_wrong");

    await expect(submitKnowledgeCheckAction(form)).rejects.toThrow("needs manager review");
    expect(txMock.knowledgeCheckAttempt.create).not.toHaveBeenCalled();
  });

  it("uses a manager unlock for one additional knowledge check attempt", async () => {
    prismaMock.courseModule.findFirst.mockResolvedValue(visibleModule);
    prismaMock.knowledgeCheckAttempt.findMany.mockResolvedValue([
      { id: "attempt_2", status: "NeedsReview" },
      { id: "attempt_1", status: "Failed" }
    ]);
    prismaMock.knowledgeCheckAttemptUnlock.findFirst.mockResolvedValue({ id: "unlock_1" });
    txMock.knowledgeCheckAttempt.create.mockResolvedValue({ id: "attempt_3" });
    prismaMock.academyActivity.create.mockResolvedValue({ id: "activity_1" });

    const form = new FormData();
    form.set("checkId", "check_1");
    form.set("moduleId", "module_1");
    form.set("question_question_1", "option_right");

    await submitKnowledgeCheckAction(form);

    expect(txMock.knowledgeCheckAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "Passed" })
    }));
    expect(txMock.knowledgeCheckAttemptUnlock.update).toHaveBeenCalledWith({
      where: { id: "unlock_1" },
      data: expect.objectContaining({ usedAt: expect.any(Date) })
    });
  });

  it("blocks module completion until acknowledgement is accepted", async () => {
    prismaMock.courseModule.findFirst.mockResolvedValue(visibleModule);

    const form = new FormData();
    form.set("moduleId", "module_1");

    await expect(completeAcademyModuleAction(form)).rejects.toThrow("acknowledgement");
    expect(txMock.moduleCompletion.upsert).not.toHaveBeenCalled();
  });

  it("blocks required module completion until a knowledge check is passed", async () => {
    prismaMock.courseModule.findFirst.mockResolvedValue(visibleModule);
    prismaMock.knowledgeCheckAttempt.findFirst.mockResolvedValue(null);

    const form = new FormData();
    form.set("moduleId", "module_1");
    form.set("acknowledgement", "on");

    await expect(completeAcademyModuleAction(form)).rejects.toThrow("knowledge check");
    expect(txMock.moduleCompletion.upsert).not.toHaveBeenCalled();
  });

  it("prevents users from resolving another employee's question", async () => {
    prismaMock.employeeQuestion.findUnique.mockResolvedValue({ id: "question_2", userId: "someone_else" });

    const form = new FormData();
    form.set("questionId", "question_2");

    await expect(markEmployeeQuestionResolvedAction(form)).rejects.toThrow("Forbidden");
  });

  it("lets Founder link a knowledge question to module-specific SOP metadata", async () => {
    prismaMock.knowledgeCheckQuestion.update.mockResolvedValue({ id: "question_1", status: "Approved" });

    const form = new FormData();
    form.set("questionId", "question_1");
    form.set("moduleId", "module_1");
    form.set("sopId", "sop_1");
    form.set("learningObjective", "Identify the correct handoff rule.");
    form.set("incorrectExplanation", "Review the handoff checklist before retaking.");
    form.set("difficulty", "Intermediate");
    form.set("status", "Approved");

    await updateKnowledgeQuestionMetadataAction(form);

    expect(prismaMock.knowledgeCheckQuestion.update).toHaveBeenCalledWith({
      where: { id: "question_1" },
      data: expect.objectContaining({
        moduleId: "module_1",
        sopId: "sop_1",
        learningObjective: "Identify the correct handoff rule.",
        incorrectExplanation: "Review the handoff checklist before retaking.",
        difficulty: "Intermediate",
        status: "Approved",
        approvedById: "user_stephen"
      })
    });
  });

  it("creates a one-use manager unlock for a learner", async () => {
    prismaMock.knowledgeCheckAttemptUnlock.findFirst.mockResolvedValue(null);
    prismaMock.knowledgeCheckAttemptUnlock.create.mockResolvedValue({ id: "unlock_1" });

    const form = new FormData();
    form.set("checkId", "check_1");
    form.set("learnerId", "user_alex");
    form.set("moduleId", "module_1");
    form.set("reason", "Reviewed missed SOP concepts.");

    await unlockKnowledgeCheckAttemptAction(form);

    expect(prismaMock.knowledgeCheckAttemptUnlock.create).toHaveBeenCalledWith({
      data: {
        checkId: "check_1",
        userId: "user_alex",
        unlockedById: "user_stephen",
        reason: "Reviewed missed SOP concepts."
      }
    });
  });
});
