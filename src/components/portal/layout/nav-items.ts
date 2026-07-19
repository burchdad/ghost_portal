import {
  Bell,
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock3,
  FileText,
  Folder,
  LayoutDashboard,
  Megaphone,
  MessageSquareText,
  Settings,
  Sparkles,
  Target,
  Users,
  Workflow
} from "lucide-react";
import type { Permission } from "@/server/permissions/roles";

export const portalNavItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Onboarding", href: "/onboarding", icon: CheckSquare, permission: "onboarding:complete" },
  { label: "My Tasks", href: "/tasks", icon: Clock3, permission: "tasks:read:assigned" },
  { label: "Clients", href: "/clients", icon: Users, permission: "clients:read:assigned" },
  { label: "Leads", href: "/leads", icon: Target, permission: "leads:read:assigned" },
  { label: "Projects", href: "/projects", icon: Workflow, permission: "projects:read:assigned" },
  { label: "Calendar", href: "/calendar", icon: CalendarDays },
  { label: "Knowledge Center", href: "/knowledge", icon: BookOpen, permission: "knowledge:read" },
  { label: "Files", href: "/files", icon: Folder, permission: "files:upload" },
  { label: "Daily Reports", href: "/daily-reports", icon: FileText, permission: "reports:submit" },
  { label: "Waiting on Stephen", href: "/approvals", icon: Bell, permission: "approvals:request" },
  { label: "Announcements", href: "/announcements", icon: Megaphone, permission: "announcements:read" },
  { label: "Mission Feedback", href: "/feedback", icon: Sparkles, permission: "feedback:create" },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Admin", href: "/admin/users", icon: MessageSquareText, permission: "admin:access" }
] satisfies Array<{ label: string; href: string; icon: typeof LayoutDashboard; permission?: Permission }>;
