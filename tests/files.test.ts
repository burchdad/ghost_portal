import { describe, expect, it } from "vitest";
import { allowedMimeTypes, maxFileBytes, sanitizeFilename } from "@/server/workflows/files";

describe("file workflow validation", () => {
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
});
