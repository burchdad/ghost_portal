"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createLeadQuickAddAction, type CreateLeadState } from "@/server/workflows/leads";

const initialState: CreateLeadState = { status: "idle" };

export function QuickAddLeadForm({
  currentUserId,
  users,
  leadSources
}: {
  currentUserId: string;
  users: Array<{ id: string; name: string; preferredName: string | null }>;
  leadSources: string[];
}) {
  const router = useRouter();
  const [state, action, pending] = useActionState(createLeadQuickAddAction, initialState);

  useEffect(() => {
    if (state.status === "success" && state.leadId) {
      router.push(`/leads/${state.leadId}`);
    }
  }, [router, state.leadId, state.status]);

  return (
    <form action={action} className="grid gap-3 lg:grid-cols-4">
      <input name="company" required placeholder="Business name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      <input name="contactMethod" required placeholder="Phone number or email" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      <select name="leadSource" required defaultValue="Manual Cold Call" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
        {leadSources.map((source) => <option key={source} value={source}>{source}</option>)}
      </select>
      <select name="assignedUserId" required defaultValue={currentUserId} className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
        {users.map((row) => <option key={row.id} value={row.id}>{row.preferredName ?? row.name}</option>)}
      </select>
      <input name="contactName" placeholder="Contact name" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      <input name="website" placeholder="Website" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      <input name="industry" placeholder="Industry" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      <input name="location" placeholder="Location" className="h-10 rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      <textarea name="initialNote" placeholder="Initial note" className="min-h-20 rounded-lg border border-white/10 bg-black/24 p-3 text-sm lg:col-span-4" />
      <label className="flex items-center gap-2 text-sm text-white/62 lg:col-span-4">
        <input name="isTestRecord" type="checkbox" />
        QA/test record
      </label>
      {state.status !== "idle" ? (
        <p className={`rounded-lg border p-3 text-sm lg:col-span-4 ${state.status === "success" ? "border-accent/30 bg-accent/10 text-accent" : "border-danger/30 bg-danger/10 text-danger"}`}>
          {state.message}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2 lg:col-span-4">
        <Button name="intent" value="startCall" variant="accent" disabled={pending}>{pending ? "Saving..." : "Create and Start Call"}</Button>
        <Button name="intent" value="create" variant="outline" disabled={pending}>{pending ? "Saving..." : "Create Lead"}</Button>
      </div>
    </form>
  );
}
