"use client";

import { useActionState, useState } from "react";
import { Bot, Eye, EyeOff, LockKeyhole } from "lucide-react";
import { loginAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";

type LoginFormProps = {
  redirectTo: string;
  reason?: string;
};

export function LoginForm({ redirectTo, reason }: LoginFormProps) {
  const [state, action, pending] = useActionState(loginAction, undefined);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="grid min-h-screen grid-cols-[1.05fr_0.95fr]">
      <section className="flex items-center justify-center px-8">
        <form action={action} className="glass w-full max-w-md rounded-lg p-8">
          <input type="hidden" name="redirectTo" value={redirectTo} />
          <div className="mb-8 flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-lg bg-white text-zinc-950">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <p className="text-sm text-white/48">Ghost AI Solutions</p>
              <h1 className="text-2xl font-semibold">Sign in to Ghost Portal</h1>
            </div>
          </div>

          <label className="block text-sm font-medium" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent" />

          <label className="mt-5 block text-sm font-medium" htmlFor="password">Password</label>
          <div className="mt-2 flex h-11 items-center rounded-lg border border-white/10 bg-black/24 focus-within:border-accent">
            <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="flex size-10 items-center justify-center text-white/52" aria-label={showPassword ? "Hide password" : "Show password"}>
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {state?.error ? <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">{state.error}</p> : null}
          {reason === "suspended" ? <p className="mt-4 rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">This account is not active.</p> : null}
          {reason === "expired" ? <p className="mt-4 rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning">Your session expired. Sign in again.</p> : null}

          <Button className="mt-6 w-full" disabled={pending}>{pending ? "Signing in..." : "Sign in"}</Button>
          <a href="/forgot-password" className="mt-4 block text-center text-sm text-white/48 hover:text-accent">Forgot password?</a>
        </form>
      </section>
      <section className="hidden border-l border-white/10 bg-black/20 p-10 lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3 text-accent">
          <Bot className="size-5" />
          <span className="text-sm uppercase tracking-[0.24em]">Nova guarded workspace</span>
        </div>
        <div>
          <h2 className="max-w-xl text-5xl font-semibold leading-tight">Operations, approvals, and daily focus in one secure portal.</h2>
          <p className="mt-5 max-w-lg text-sm leading-6 text-white/56">Role checks and record access are enforced on the server so Alex sees only assigned operational work.</p>
        </div>
      </section>
    </main>
  );
}
