import { describe, expect, it } from "vitest";
import { hasPermission, type AuthzUser } from "@/server/permissions/roles";

const alex: AuthzUser = {
  id: "user_alex",
  name: "Alexandra Canto",
  email: "alex@ghostai.solutions",
  role: "Operations"
};

const stephen: AuthzUser = {
  id: "user_stephen",
  name: "Stephen Burch",
  email: "stephen@ghostai.solutions",
  role: "Founder"
};

describe("role permissions", () => {
  it("allows Operations to update assigned tasks", () => {
    expect(hasPermission(alex, "tasks:update:assigned")).toBe(true);
  });

  it("lets Operations submit support tickets without triaging Mission Control", () => {
    expect(hasPermission(alex, "support:create")).toBe(true);
    expect(hasPermission(alex, "support:triage")).toBe(false);
  });

  it("blocks Operations from credentials and finance", () => {
    expect(hasPermission(alex, "credentials:read")).toBe(false);
    expect(hasPermission(alex, "finance:read")).toBe(false);
  });

  it("allows Operations to view approved pricing but blocks pricing edits", () => {
    expect(hasPermission(alex, "pricing:read")).toBe(true);
    expect(hasPermission(alex, "pricing:manage")).toBe(false);
  });

  it("allows Founder to manage permissions", () => {
    expect(hasPermission(stephen, "permissions:manage")).toBe(true);
    expect(hasPermission(stephen, "pricing:manage")).toBe(true);
  });
});
