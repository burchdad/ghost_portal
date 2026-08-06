"use client";

import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createEmployeeAction, type CreateEmployeeState } from "@/server/workflows/users";

const initialState: CreateEmployeeState = { status: "idle" };

export function CreateEmployeeForm({ roles }: { roles: string[] }) {
  const [state, formAction, pending] = useActionState(createEmployeeAction, initialState);

  return (
    <form action={formAction} className="grid gap-4 lg:grid-cols-2">
      <label className="text-sm font-medium">
        Full name
        <input name="name" required placeholder="Eriz Lastname" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent" />
      </label>
      <label className="text-sm font-medium">
        Preferred name
        <input name="preferredName" placeholder="Eriz" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent" />
      </label>
      <label className="text-sm font-medium">
        Email
        <input name="email" type="email" required placeholder="eriz@example.com" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent" />
      </label>
      <label className="text-sm font-medium">
        Role
        <select name="role" defaultValue="Sales" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent">
          {roles.map((role) => <option key={role} value={role}>{role}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">
        Timezone
        <input name="timezone" defaultValue="America/Chicago" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent" />
      </label>
      <label className="text-sm font-medium">
        Status
        <select name="status" defaultValue="Active" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent">
          <option value="Active">Active</option>
          <option value="Invited">Invited</option>
        </select>
      </label>
      <label className="text-sm font-medium lg:col-span-2">
        Temporary password
        <input name="temporaryPassword" placeholder="Leave blank to auto-generate" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm outline-none transition focus:border-accent" />
      </label>
      <div className="flex flex-wrap items-center gap-3 lg:col-span-2">
        <Button variant="accent" disabled={pending}>
          <UserPlus className="size-4" />
          {pending ? "Adding employee..." : "Add employee"}
        </Button>
        {state.message ? (
          <span className={`rounded-lg border px-3 py-2 text-sm ${state.status === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-accent/30 bg-accent/10 text-accent"}`}>
            {state.message}
          </span>
        ) : null}
      </div>
      {state.temporaryPassword ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-sm text-warning lg:col-span-2">
          Temporary password: <span className="font-mono font-semibold">{state.temporaryPassword}</span>
        </div>
      ) : null}
    </form>
  );
}
