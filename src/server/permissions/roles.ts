export const roles = [
  "Founder",
  "Executive",
  "Operations",
  "Sales",
  "Marketing",
  "Developer",
  "Support",
  "Finance",
  "Contractor",
  "Client"
] as const;

export type Role = (typeof roles)[number];

export const permissions = [
  "analytics:read",
  "admin:access",
  "academy:manage",
  "academy:read",
  "announcements:create",
  "announcements:read",
  "approvals:decide",
  "approvals:request",
  "audit:read",
  "clients:read:assigned",
  "clients:read:all",
  "clients:manage",
  "clients:update:notes",
  "credentials:read",
  "feedback:create",
  "feedback:read",
  "files:upload",
  "finance:read",
  "knowledge:manage",
  "knowledge:read",
  "leads:read:assigned",
  "leads:update:assigned",
  "leads:manage",
  "nova:configure",
  "onboarding:complete",
  "onboarding:manage",
  "permissions:manage",
  "pricing:manage",
  "projects:read:assigned",
  "projects:update:status",
  "reports:review",
  "reports:submit",
  "settings:manage",
  "tasks:create",
  "tasks:manage",
  "tasks:read:assigned",
  "tasks:update:assigned",
  "users:manage"
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<Role, Permission[]> = {
  Founder: [...permissions],
  Executive: [
    "analytics:read",
    "academy:manage",
    "academy:read",
    "announcements:create",
    "announcements:read",
    "approvals:decide",
    "audit:read",
    "clients:read:all",
    "feedback:read",
    "academy:read",
    "knowledge:read",
    "projects:update:status",
    "reports:submit"
  ],
  Operations: [
    "academy:read",
    "approvals:request",
    "clients:read:assigned",
    "clients:update:notes",
    "files:upload",
    "feedback:create",
    "knowledge:read",
    "leads:read:assigned",
    "leads:update:assigned",
    "projects:read:assigned",
    "projects:update:status",
    "reports:submit",
    "announcements:read",
    "onboarding:complete",
    "tasks:read:assigned",
    "tasks:update:assigned"
  ],
  Sales: [
    "academy:read",
    "approvals:request",
    "clients:read:assigned",
    "clients:update:notes",
    "knowledge:read",
    "leads:read:assigned",
    "leads:update:assigned",
    "reports:submit",
    "tasks:read:assigned",
    "tasks:update:assigned"
  ],
  Marketing: ["academy:read", "approvals:request", "knowledge:read", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
  Developer: ["academy:read", "approvals:request", "files:upload", "knowledge:read", "projects:read:assigned", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
  Support: ["academy:read", "clients:read:assigned", "clients:update:notes", "knowledge:read", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
  Finance: ["academy:read", "finance:read", "knowledge:read", "reports:submit", "tasks:read:assigned"],
  Contractor: ["academy:read", "knowledge:read", "projects:read:assigned", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
  Client: []
};

export type AuthzUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export function hasPermission(user: AuthzUser, permission: Permission) {
  return rolePermissions[user.role].includes(permission);
}

export function assertPermission(user: AuthzUser, permission: Permission) {
  if (!hasPermission(user, permission)) {
    throw new Error(`Forbidden: ${permission}`);
  }
}
