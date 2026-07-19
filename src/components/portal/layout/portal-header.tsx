import { Bell, Bot, Command, LogOut, Plus, Search } from "lucide-react";
import type { SessionUser } from "@/server/permissions/authorize";
import { logoutAction } from "@/server/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function PortalHeader({ user, unreadNotifications }: { user: SessionUser; unreadNotifications: number }) {
  return (
    <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-white/10 bg-[#08090d]/80 px-5 backdrop-blur-2xl lg:px-8">
      <div className="flex h-11 w-full max-w-xl items-center gap-3 rounded-lg border border-white/10 bg-white/[0.055] px-4 text-white/50">
        <Search className="size-4" />
        <span className="truncate text-sm">Search clients, tasks, SOPs, files, leads...</span>
        <kbd className="ml-auto hidden rounded border border-white/10 px-2 py-1 font-mono text-[11px] text-white/45 sm:block">
          <Command className="mr-1 inline size-3" />K
        </kbd>
      </div>

      <div className="ml-4 flex items-center gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Notifications">
          <a href="/notifications" className="relative">
          <Bell className="size-4" />
            {unreadNotifications > 0 ? <span className="absolute right-1 top-1 size-2 rounded-full bg-danger" /> : null}
          </a>
        </Button>
        <Button variant="outline" size="sm" className="hidden sm:inline-flex">
          <Plus className="size-4" />
          Quick Action
        </Button>
        <Button variant="accent" size="sm" className="hidden sm:inline-flex">
          <Bot className="size-4" />
          Nova
        </Button>
        <div className="hidden items-center gap-3 rounded-lg border border-white/10 bg-white/[0.055] px-3 py-2 md:flex">
          <div className="size-8 rounded-full bg-gradient-to-br from-white to-white/50" />
          <div className="leading-tight">
            <p className="text-sm font-medium">{user.preferredName ?? user.name}</p>
            <Badge className="mt-1 h-5 px-2 text-[10px]">{user.role}</Badge>
          </div>
        </div>
        <form action={logoutAction}>
          <Button variant="outline" size="icon" aria-label="Log out">
            <LogOut className="size-4" />
          </Button>
        </form>
      </div>
    </header>
  );
}
