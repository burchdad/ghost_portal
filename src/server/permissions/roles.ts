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
  "announcements:create",
  "approvals:decide",
  "approvals:request",
  "audit:read",
  "clients:read:assigned",
  "clients:read:all",
  "clients:update:notes",
  "credentials:read",
  "files:upload",
  "finance:read",
  "knowledge:read",
  "leads:read:assigned",
  "leads:update:assigned",
  "nova:configure",
  "permissions:manage",
  "pricing:manage",
  "projects:read:assigned",
  "projects:update:status",
  "reports:submit",
  "settings:manage",
  "tasks:read:assigned",
  "tasks:update:assigned",
  "users:manage"
] as const;

export type Permission = (typeof permissions)[number];

export const rolePermissions: Record<Role, Permission[]> = {
  Founder: [...permissions],
  Executive: [
    "analytics:read",
    "announcements:create",
    "approvals:decide",
    "audit:read",
    "clients:read:all",
    "knowledge:read",
    "projects:update:status",
    "reports:submit"
  ],
  Operations: [
    "approvals:request",
    "clients:read:assigned",
    "clients:update:notes",
    "files:upload",
    "knowledge:read",
    "leads:read:assigned",
    "leads:update:assigned",
    "projects:read:assigned",
    "projects:update:status",
    "reports:submit",
    "tasks:read:assigned",
    "tasks:update:assigned"
  ],
  Sales: [
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
  Marketing: ["approvals:request", "knowledge:read", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
  Developer: ["approvals:request", "files:upload", "knowledge:read", "projects:read:assigned", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
  Support: ["clients:read:assigned", "clients:update:notes", "knowledge:read", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
  Finance: ["finance:read", "knowledge:read", "reports:submit", "tasks:read:assigned"],
  Contractor: ["knowledge:read", "projects:read:assigned", "reports:submit", "tasks:read:assigned", "tasks:update:assigned"],
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
