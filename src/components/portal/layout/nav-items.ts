import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock3,
  FileText,
  Folder,
  Handshake,
  LayoutDashboard,
  LifeBuoy,
  Megaphone,
  Send,
  MessageSquareText,
  PackageOpen,
  ReceiptText,
  Settings,
  Target,
  TrendingUp,
  Users,
  Wrench,
  Workflow
} from "lucide-react";
import { hasPermission, type AuthzUser, type Permission } from "@/server/permissions/roles";

export const portalNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Ghost Academy", href: "/academy", icon: CheckSquare, permission: "academy:read" },
  { label: "My Tasks", href: "/tasks", icon: Clock3, permission: "tasks:read:assigned" },
  { label: "Service Catalog", href: "/services", icon: PackageOpen, permission: "pricing:read" },
  { label: "Pricing", href: "/pricing", icon: ReceiptText, permission: "pricing:read" },
  { label: "Clients", href: "/clients", icon: Users, permission: "clients:read:assigned" },
  { label: "Employees", href: "/admin/users", icon: Users, permission: "users:manage" },
  { label: "Tools", href: "/tools", icon: Wrench, permission: "clients:read:all" },
  { label: "CRM", href: "/crm", icon: Handshake, permission: "crm:read" },
  { label: "Viktor", href: "/viktor", icon: TrendingUp, permission: "crm:read" },
  { label: "Leads", href: "/leads", icon: Target, permission: "leads:read:assigned" },
  { label: "Projects", href: "/projects", icon: Workflow, permission: "projects:read:assigned" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "SOP Library", href: "/sops", icon: BookOpen, permission: "academy:read" },
  { label: "Knowledge Base", href: "/knowledge", icon: BookOpen, permission: "knowledge:read" },
  { label: "Files", href: "/files", icon: Folder, permission: "files:upload" },
  { label: "Daily Reports", href: "/daily-reports", icon: FileText, permission: "reports:submit" },
  { label: "Draft Communications", href: "/communications", icon: Send, permission: "approvals:request" },
  { label: "Waiting on Stephen", href: "/approvals", icon: Bell, permission: "approvals:request" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, permission: "announcements:read" },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Support Agent", href: "/support", icon: LifeBuoy, permission: "support:create" },
  { label: "Mission Control Support", href: "/admin/support", icon: MessageSquareText, permission: "support:triage" },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Pricing Workshop", href: "/admin/pricing-workshop", icon: PackageOpen, permission: "pricing:manage" },
  { label: "Admin", href: "/admin/users", icon: MessageSquareText, permission: "admin:access" }
] satisfies Array<{ label: string; href: string; icon: typeof LayoutDashboard; permission?: Permission }>;

export function getVisiblePortalNavItems(user: Pick<AuthzUser, "role">) {
  return portalNavItems
    .filter((item) => !item.permission || hasPermission(user as AuthzUser, item.permission))
    .filter((item) => user.role !== "Operations" || operationsTrialNav.includes(item.label))
    .map((item) => user.role === "Operations" && item.label === "Settings" ? { ...item, label: "Profile" } : item);
}

const operationsTrialNav = [
  "Dashboard",
  "Ghost Academy",
  "My Tasks",
  "Service Catalog",
  "Pricing",
  "Clients",
  "Employees",
  "CRM",
  "Viktor",
  "Leads",
  "Calendar",
  "SOP Library",
  "Daily Reports",
  "Draft Communications",
  "Waiting on Stephen",
  "Notifications",
  "Mission Feedback",
  "Settings"
];
