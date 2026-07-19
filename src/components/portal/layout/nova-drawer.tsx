import { Bot, ChevronRight, PanelRightOpen } from "lucide-react";
import type { SessionUser } from "@/server/permissions/authorize";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function NovaDrawer({ user, summary }: { user: SessionUser; summary: string }) {
  return (
    <aside className="sticky top-0 hidden h-screen overflow-y-auto border-l border-white/10 bg-black/24 px-5 py-5 backdrop-blur-xl 2xl:block">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent">Nova</p>
          <h2 className="text-xl font-semibold">AI Drawer</h2>
        </div>
        <Button variant="outline" size="icon" aria-label="Open Nova drawer">
          <PanelRightOpen className="size-4" />
        </Button>
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-accent text-zinc-950">
            <Bot className="size-5" />
          </div>
          <div>
            <p className="font-medium">Permission-safe summary</p>
            <p className="text-xs text-white/45">Scoped to {user.role}</p>
          </div>
        </div>
        <p className="text-sm leading-6 text-white/62">{summary}</p>
      </Card>

      <div className="mt-5 space-y-3">
        {["What should I work on?", "Draft a client follow-up", "Show overdue work", "Explain this SOP"].map((prompt) => (
          <button
            key={prompt}
            className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-sm text-white/70 transition hover:bg-white/[0.08]"
          >
            {prompt}
            <ChevronRight className="size-4 text-white/35" />
          </button>
        ))}
      </div>
    </aside>
  );
}
