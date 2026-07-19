import type { AuthzUser } from "@/server/permissions/roles";
import { canAccessClient, canAccessLead } from "@/server/permissions/authorize";

export async function assertClientAccess(user: AuthzUser, clientId: string) {
  if (!(await canAccessClient(user, clientId))) {
    throw new Error("Forbidden: client");
  }
}

export async function assertLeadAccess(user: AuthzUser, leadId: string) {
  if (!(await canAccessLead(user, leadId))) {
    throw new Error("Forbidden: lead");
  }
}
