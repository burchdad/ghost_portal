"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";
import { portalNavItems } from "@/components/portal/layout/nav-items";
import { cn } from "@/lib/utils";
import { hasPermission, type AuthzUser } from "@/server/permissions/roles";

export function PortalSidebar({ user }: { user: AuthzUser }) {
  const pathname = usePathname();
  const visibleItems = portalNavItems
    .filter((item) => !item.permission || hasPermission(user, item.permission))
    .filter((item) => user.role !== "Operations" || operationsTrialNav.includes(item.label))
    .map((item) => user.role === "Operations" && item.label === "Settings" ? { ...item, label: "Profile" } : item);

  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-r border-white/10 bg-black/20 px-4 py-5 backdrop-blur-xl lg:block">
      <div className="mb-8 flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-white text-zinc-950">
          <Home className="size-5" />
        </div>
        <div>
          <p className="text-sm text-white/50">Ghost AI Solutions</p>
          <h1 className="text-lg font-semibold">Ghost Portal</h1>
        </div>
      </div>

      <nav className="space-y-1" aria-label="Portal navigation">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition",
                active ? "bg-white text-zinc-950" : "text-white/68 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-4" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

const operationsTrialNav = [
  "Dashboard",
  "Ghost Academy",
  "My Tasks",
  "Service Catalog",
  "Pricing",
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
