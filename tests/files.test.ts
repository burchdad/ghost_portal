import { beforeEach, describe, expect, it, vi } from "vitest";
import { allowedMimeTypes, createLocalFileMetadataAction, maxFileBytes, sanitizeFilename } from "@/server/workflows/files";

const prismaMock = {
  task: {
    findUnique: vi.fn()
  },
  fileAsset: {
    create: vi.fn()
  },
  auditLog: {
    create: vi.fn()
  }
};

vi.mock("@/server/db/prisma", () => ({
  getPrisma: () => prismaMock
}));

vi.mock("@/server/permissions/authorize", async () => {
  const actual = await vi.importActual<typeof import("@/server/permissions/authorize")>("@/server/permissions/authorize");
  return {
    ...actual,
    requireUser: vi.fn().mockResolvedValue({
      id: "user_alex",
      name: "Alexandra Marie Canto",
      email: "amariexc@gmail.com",
      role: "Operations",
      preferredName: "Alex",
      status: "Active",
      timezone: "Asia/Manila"
    })
  };
});

describe("file workflow validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sanitizes filenames", () => {
    expect(sanitizeFilename("../client secret?.pdf")).toBe(".._client_secret_.pdf");
  });

  it("allows only explicit phase 1 mime types", () => {
    expect(allowedMimeTypes).toContain("application/pdf");
    expect(allowedMimeTypes).not.toContain("application/x-msdownload");
  });

  it("uses a 10MB maximum size", () => {
    expect(maxFileBytes).toBe(10 * 1024 * 1024);
  });

  it("rejects attachment metadata for another user's task", async () => {
    prismaMock.task.findUnique.mockResolvedValue({ id: "task_1", ownerId: "someone_else", archivedAt: null });
    const form = new FormData();
    form.set("name", "note.pdf");
    form.set("mimeType", "application/pdf");
    form.set("size", "100");
    form.set("taskId", "task_1");

    await expect(createLocalFileMetadataAction(form)).rejects.toThrow("Forbidden: file task target");
  });
});
