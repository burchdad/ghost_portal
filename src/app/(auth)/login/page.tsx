"use client";

import { useActionState } from "react";
import { Bot, LockKeyhole } from "lucide-react";
import { loginAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined);

  return (
    <main className="grid min-h-screen grid-cols-[1.05fr_0.95fr]">
      <section className="flex items-center justify-center px-8">
        <form action={action} className="glass w-full max-w-md rounded-lg p-8">
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-white text-zinc-950">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <p className="text-sm text-white/48">Ghost AI Solutions</p>
              <h1 className="text-2xl font-semibold">Sign in to Ghost Portal</h1>
            </div>
          </div>

          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent"
          />

          <label className="mt-5 block text-sm font-medium" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent"
          />

          {state?.error ? <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{state.error}</p> : null}

          <Button className="mt-6 w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </section>
      <section className="hidden border-l border-white/10 bg-black/20 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-accent">
          <Bot className="size-5" />
          <span className="text-sm uppercase tracking-[0.24em]">Nova guarded workspace</span>
        </div>
        <div>
          <h2 className="max-w-xl text-5xl font-semibold leading-tight">Operations, approvals, and daily focus in one secure portal.</h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/56">
            Role checks and record access are enforced on the server so Alex sees only assigned operational work.
          </p>
        </div>
      </section>
    </main>
  );
}
