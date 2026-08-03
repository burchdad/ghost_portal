"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CornerDownLeft, Loader2, Send, TrendingUp, UserRound, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type GrowthAction = {
  label: string;
  href: string;
  detail: string;
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  actions?: GrowthAction[];
};

const promptGroups = [
  {
    label: "Strategy",
    prompts: ["What should grow revenue next?", "What offer should we focus on this week?", "What growth experiment should we run?"]
  },
  {
    label: "Pipeline",
    prompts: ["Which leads are closest to revenue?", "What follow-ups should happen today?", "What pipeline risks should Stephen review?"]
  },
  {
    label: "Positioning",
    prompts: ["How should we position Founder Launch?", "Which offer fits the current lead mix?", "Where are we underusing GEO, Vega, or Nova?"]
  }
];

export function ViktorChat({ summary, userName, userRole }: { summary: string; userName: string; userRole: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: summary }]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const activePromptCount = useMemo(() => promptGroups.reduce((total, group) => total + group.prompts.length, 0), []);

  async function submitMessage(messageText = input) {
    const trimmed = messageText.trim();
    if (!trimmed || pending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setPending(true);

    try {
      const response = await fetch("/api/viktor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.slice(-10) })
      });
      const data = await response.json() as { message?: string; error?: string; actions?: GrowthAction[] };
      setMessages([...nextMessages, { role: "assistant", content: data.message ?? data.error ?? "Viktor could not answer that request.", actions: data.actions }]);
    } catch {
      setMessages([...nextMessages, { role: "assistant", content: "Viktor could not connect. Try again in a moment." }]);
    } finally {
      setPending(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitMessage();
  }

  return (
    <div className="grid min-h-[calc(100vh-11rem)] gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="flex min-h-[640px] flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0d0f14]/90 shadow-2xl shadow-black/20">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-warning text-zinc-950">
              <TrendingUp className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold">Viktor</h2>
              <p className="truncate text-xs text-white/45">Growth strategy for {userName} as {userRole}</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-warning/25 bg-warning/10 px-3 py-1 text-xs text-warning sm:flex">
            <Zap className="size-3.5" />
            {activePromptCount} prompts
          </div>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-4 py-5 sm:px-5">
          {messages.map((message, index) => (
            <MessageBubble key={`${message.role}-${index}`} message={message} />
          ))}
          {pending ? (
            <div className="flex items-center gap-2 text-sm text-white/52">
              <Loader2 className="size-4 animate-spin text-warning" />
              Viktor is analyzing growth
            </div>
          ) : null}
        </div>

        <form ref={formRef} onSubmit={onSubmit} className="border-t border-white/10 bg-black/20 p-3 sm:p-4">
          <div className="flex min-h-24 gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 focus-within:border-warning">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === "Enter") formRef.current?.requestSubmit();
              }}
              placeholder="Ask Viktor about revenue, offers, pipeline, follow-ups, positioning, or growth experiments..."
              className="min-h-16 flex-1 resize-none bg-transparent text-sm leading-6 text-white outline-none placeholder:text-white/35"
            />
            <Button type="submit" variant="outline" size="icon" disabled={!input.trim() || pending} aria-label="Send message" className="border-warning/30 bg-warning text-zinc-950 hover:bg-warning/90">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-white/35">
            <CornerDownLeft className="size-3.5" />
            Ctrl Enter sends
          </div>
        </form>
      </section>

      <aside className="space-y-4">
        {promptGroups.map((group) => (
          <section key={group.label} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
            <h3 className="text-sm font-semibold">{group.label}</h3>
            <div className="mt-3 space-y-2">
              {group.prompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => void submitMessage(prompt)}
                  className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-left text-sm text-white/68 transition hover:border-warning/40 hover:bg-warning/10 hover:text-white"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </section>
        ))}
      </aside>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser && "justify-end")}>
      {!isUser ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-warning text-zinc-950">
          <TrendingUp className="size-4" />
        </div>
      ) : null}
      <div className="max-w-[78ch] space-y-3">
        <div className={cn("whitespace-pre-wrap rounded-lg px-4 py-3 text-sm leading-6", isUser ? "bg-warning text-zinc-950" : "border border-white/10 bg-white/[0.055] text-white/72")}>
          {message.content}
        </div>
        {!isUser && message.actions?.length ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {message.actions.map((action) => (
              <Link
                key={`${action.href}-${action.label}`}
                href={action.href}
                className="group rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/68 transition hover:border-warning/40 hover:bg-warning/10 hover:text-white"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{action.label}</span>
                  <ArrowUpRight className="size-4 text-white/35 transition group-hover:text-warning" />
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/45">{action.detail}</p>
              </Link>
            ))}
          </div>
        ) : null}
      </div>
      {isUser ? (
        <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-white/65">
          <UserRound className="size-4" />
        </div>
      ) : null}
    </div>
  );
}
