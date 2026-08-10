import { describe, expect, it } from "vitest";
import { defaultTimezone, isValidTimezone, normalizeTimezone, safeTimezone } from "@/lib/timezones";

describe("timezone utilities", () => {
  it("normalizes accidental spacing in IANA timezone names", () => {
    expect(normalizeTimezone("Asia/ Manila")).toBe("Asia/Manila");
    expect(isValidTimezone("Asia/ Manila")).toBe(true);
    expect(safeTimezone("Asia/ Manila")).toBe("Asia/Manila");
  });

  it("falls back when timezone values cannot be repaired", () => {
    expect(safeTimezone("Not/AZone")).toBe(defaultTimezone);
  });
});
