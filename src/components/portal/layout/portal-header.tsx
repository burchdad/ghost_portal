import Link from "next/link";
import { Bell, Bot, Command, LogOut, Search } from "lucide-react";
import type { SessionUser } from "@/server/permissions/authorize";
import { logoutAction } from "@/server/auth/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MobileNavMenu } from "@/components/portal/layout/mobile-nav-menu";
import { QuickActionMenu } from "@/components/portal/layout/quick-action-menu";

export function PortalHeader({ user, unreadNotifications }: { user: SessionUser; unreadNotifications: number }) {
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-white/10 bg-[#08090d]/80 px-4 backdrop-blur-2xl sm:h-20 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MobileNavMenu user={user} />
        <form action="/search" method="GET" className="flex h-11 min-w-0 flex-1 items-center gap-3 rounded-lg border border-white/10 bg-white/[0.055] px-3 text-white/50 focus-within:border-accent lg:max-w-xl">
          <button type="submit" aria-label="Search" className="grid size-7 shrink-0 place-items-center rounded-md text-white/55 transition hover:bg-white/10 hover:text-white">
            <Search className="size-4" />
          </button>
          <input name="q" placeholder="Search clients, tasks, SOPs, files, leads..." className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/40" />
          <kbd className="ml-auto hidden rounded border border-white/10 px-2 py-1 font-mono text-[11px] text-white/45 sm:block">
            <Command className="mr-1 inline size-3" />K
          </kbd>
        </form>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <Button asChild variant="outline" size="icon" aria-label="Notifications">
          <a href="/notifications" className="relative">
          <Bell className="size-4" />
            {unreadNotifications > 0 ? <span className="absolute right-1 top-1 size-2 rounded-full bg-danger" /> : null}
          </a>
        </Button>
        <QuickActionMenu />
        <Button asChild variant="accent" size="sm" className="hidden sm:inline-flex">
          <Link href="/nova">
            <Bot className="size-4" />
            Agents
          </Link>
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
