"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getVisiblePortalNavItems } from "@/components/portal/layout/nav-items";
import { cn } from "@/lib/utils";
import type { AuthzUser } from "@/server/permissions/roles";

export function MobileNavMenu({ user }: { user: AuthzUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const visibleItems = getVisiblePortalNavItems(user);

  return (
    <div className="lg:hidden">
      <Button type="button" variant="outline" size="icon" aria-label="Open navigation" onClick={() => setOpen(true)}>
        <Menu className="size-4" />
      </Button>

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Portal navigation">
          <div className="flex h-full w-full max-w-sm flex-col border-r border-white/10 bg-[#08090d] p-4 shadow-2xl">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-950">
                  <Home className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-white/50">Ghost AI Solutions</p>
                  <h1 className="truncate text-lg font-semibold">Ghost Portal</h1>
                </div>
              </div>
              <Button type="button" variant="outline" size="icon" aria-label="Close navigation" onClick={() => setOpen(false)}>
                <X className="size-4" />
              </Button>
            </div>

            <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto" aria-label="Mobile portal navigation">
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition",
                      active ? "bg-white text-zinc-950" : "text-white/72 hover:bg-white/10 hover:text-white"
                    )}
                  >
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      ) : null}
    </div>
  );
}
