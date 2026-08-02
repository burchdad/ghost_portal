"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { submitSupportTicketFormAction, type SupportTicketState } from "@/server/workflows/feedback";

const initialState: SupportTicketState = { status: "idle" };

export function SupportTicketForm({
  ticketTypes,
  severities,
  missionAreas
}: {
  ticketTypes: string[];
  severities: string[];
  missionAreas: string[];
}) {
  const [state, action, pending] = useActionState(submitSupportTicketFormAction, initialState);

  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Ticket type
          <select name="type" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            {ticketTypes.map((type) => <option key={type} value={type}>{labelize(type)}</option>)}
          </select>
        </label>
        <label className="text-sm font-medium">
          Severity
          <select name="severity" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
            {severities.map((severity) => <option key={severity} value={severity}>{severity}</option>)}
          </select>
        </label>
      </div>
      <label className="text-sm font-medium">
        Mission Control area
        <select name="missionControlArea" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm">
          {missionAreas.map((area) => <option key={area} value={area}>{area}</option>)}
        </select>
      </label>
      <label className="text-sm font-medium">
        Title
        <input name="title" required placeholder="Short issue title" className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      </label>
      <label className="text-sm font-medium">
        Page or feature
        <input name="pageOrFeature" placeholder="/tasks, Nova drawer, daily report submit..." className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      </label>
      <label className="text-sm font-medium">
        What happened?
        <textarea name="description" required placeholder="Describe the issue, what you were trying to do, and why it matters." className="mt-2 min-h-28 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm font-medium">
          Expected result
          <textarea name="expectedResult" placeholder="What should have happened?" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
        </label>
        <label className="text-sm font-medium">
          Actual result
          <textarea name="actualResult" placeholder="What happened instead?" className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-black/24 p-3 text-sm" />
        </label>
      </div>
      <label className="text-sm font-medium">
        Workaround tried
        <input name="workaroundTried" placeholder="Refresh, different page, manual note, none..." className="mt-2 h-10 w-full rounded-lg border border-white/10 bg-black/24 px-3 text-sm" />
      </label>
      <label className="flex items-center gap-2 text-sm text-white/64">
        <input name="blocked" type="checkbox" />
        This is blocking current work
      </label>
      <Button variant="accent" disabled={pending}>{pending ? "Submitting..." : "Submit support ticket"}</Button>
      {state.message ? (
        <p className={`rounded-lg border px-3 py-2 text-sm ${state.status === "error" ? "border-danger/30 bg-danger/10 text-danger" : "border-accent/30 bg-accent/10 text-accent"}`}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function labelize(value: string) {
  return value.replace(/([a-z])([A-Z])/g, "$1 $2");
}
