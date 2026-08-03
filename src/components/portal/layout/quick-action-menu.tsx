"use client";

import Link from "next/link";
import { CheckSquare, FileText, LifeBuoy, Plus, Send, Target, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const actions = [
  { label: "Add lead", href: "/leads", icon: Target },
  { label: "New report", href: "/daily-reports/new", icon: FileText },
  { label: "Draft communication", href: "/communications", icon: Send },
  { label: "Request approval", href: "/approvals", icon: CheckSquare },
  { label: "Support ticket", href: "/support", icon: LifeBuoy }
];

export function QuickActionMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative hidden sm:block">
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-haspopup="menu">
        <Plus className="size-4" />
        Quick Action
      </Button>
      {open ? (
        <div className="absolute right-0 top-12 z-30 w-64 rounded-lg border border-white/10 bg-[#111217] p-2 shadow-2xl">
          <div className="mb-1 flex items-center justify-between px-2 py-1">
            <p className="text-xs uppercase tracking-[0.16em] text-white/42">Create</p>
            <button type="button" className="rounded p-1 text-white/50 hover:bg-white/10 hover:text-white" onClick={() => setOpen(false)} aria-label="Close quick actions">
              <X className="size-4" />
            </button>
          </div>
          <div role="menu" className="space-y-1">
            {actions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href} onClick={() => setOpen(false)} role="menuitem" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-white/72 transition hover:bg-white/10 hover:text-white">
                  <Icon className="size-4 text-accent" />
                  {action.label}
                </Link>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
