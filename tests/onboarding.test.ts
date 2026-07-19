import { beforeEach, describe, expect, it, vi } from "vitest";
import { completeOnboardingModuleAction } from "@/server/workflows/onboarding";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn()
}));

const prismaMock = {
  onboardingModule: {
    findUnique: vi.fn()
  },
  onboardingCompletion: {
    upsert: vi.fn()
  },
  activity: {
    create: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("@/server/permissions/authorize", () => ({
  requireUser: mocks.requireUser
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

describe("onboarding completion permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.onboardingModule.findUnique.mockResolvedValue({
      id: "module_1",
      title: "Welcome",
      published: true,
      visibleToRoles: ["Operations"]
    });
  });

  it("allows Operations users to complete their own visible module", async () => {
    mocks.requireUser.mockResolvedValue({
      id: "user_alex",
      name: "Alexandra Marie Canto",
      email: "amariexc@gmail.com",
      role: "Operations",
      preferredName: "Alex",
      status: "Active",
      timezone: "Asia/Manila"
    });
    const form = new FormData();
    form.set("moduleId", "module_1");

    await completeOnboardingModuleAction(form);

    expect(prismaMock.onboardingCompletion.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: { userId_moduleId: { userId: "user_alex", moduleId: "module_1" } }
    }));
    expect(prismaMock.activity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ actorId: "user_alex", action: "completed onboarding", target: "Welcome" })
    }));
  });

  it("blocks Founder from using the learner completion control as an override", async () => {
    mocks.requireUser.mockResolvedValue({
      id: "user_stephen",
      name: "Stephen Burch",
      email: "stephen@ghostai.solutions",
      role: "Founder",
      preferredName: "Stephen",
      status: "Active",
      timezone: "America/Chicago"
    });
    const form = new FormData();
    form.set("moduleId", "module_1");

    await expect(completeOnboardingModuleAction(form)).rejects.toThrow("Founder onboarding override");
    expect(prismaMock.onboardingCompletion.upsert).not.toHaveBeenCalled();
  });
});
