import type { AuthzUser } from "@/server/permissions/roles";

export async function getCurrentUser(): Promise<AuthzUser> {
  return {
    id: "user_stephen",
    name: "Stephen Burch",
    email: "stephen@ghostai.solutions",
    role: "Founder"
  };
}
