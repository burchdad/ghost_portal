ALTER TYPE "RoleName" ADD VALUE IF NOT EXISTS 'Admin';

INSERT INTO "Role" ("id", "name", "createdAt", "updatedAt")
VALUES ('role_admin', 'Admin', NOW(), NOW())
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT admin_role."id", permission."id"
FROM "Role" admin_role
CROSS JOIN "Permission" permission
WHERE admin_role."name" = 'Admin'
  AND permission."key" NOT IN ('credentials:read', 'finance:read', 'permissions:manage')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
