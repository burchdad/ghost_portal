import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeAcademyModuleAction, markEmployeeQuestionResolvedAction, submitKnowledgeCheckAction } from "@/server/workflows/academy";

const prismaMock = {
  courseModule: {
    findFirst: vi.fn()
  },
  knowledgeCheckAttempt: {
    create: vi.fn(),
    findFirst: vi.fn()
  },
  academyActivity: {
    create: vi.fn()
  },
  employeeQuestion: {
    findUnique: vi.fn(),
    update: vi.fn()
  },
  $transaction: vi.fn()
};

const txMock = {
  policyAcknowledgement: { upsert: vi.fn() },
  moduleCompletion: { upsert: vi.fn() },
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
  requirePermission: vi.fn()
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
  });

  it("scores knowledge checks and records passing attempts", async () => {
    prismaMock.courseModule.findFirst.mockResolvedValue(visibleModule);
    prismaMock.knowledgeCheckAttempt.create.mockResolvedValue({ id: "attempt_1" });
    prismaMock.academyActivity.create.mockResolvedValue({ id: "activity_1" });

    const form = new FormData();
    form.set("checkId", "check_1");
    form.set("moduleId", "module_1");
    form.set("question_question_1", "option_right");

    await submitKnowledgeCheckAction(form);

    expect(prismaMock.knowledgeCheckAttempt.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ score: 100, status: "Passed" })
    }));
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
});
