"use client";

import { CheckCircle2 } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { describeTaskStatus, formatTaskStatus, taskStatusOptions, type TaskStatusValue } from "@/lib/task-status";

export function TaskStatusForm({
  taskId,
  currentStatus,
  unresolvedApprovalCount,
  action
}: {
  taskId: string;
  currentStatus: TaskStatusValue;
  unresolvedApprovalCount: number;
  action: (formData: FormData) => Promise<void>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<TaskStatusValue>(currentStatus);
  const [toast, setToast] = useState("");
  const [state, formAction, pending] = useActionState(async (_previous: { ok: boolean; message: string } | null, formData: FormData) => {
    await action(formData);
    return { ok: true, message: `Task status updated to ${formatTaskStatus(String(formData.get("status")))}.` };
  }, null);
  const unchanged = selectedStatus === currentStatus;

  useEffect(() => {
    if (state?.ok) setToast(state.message);
  }, [state]);

  return (
    <form
      action={formAction}
      className="mt-5 space-y-4"
      onSubmit={(event) => {
        if (selectedStatus === "Completed" && unresolvedApprovalCount > 0) {
          const confirmed = window.confirm("This task has unresolved approvals. Mark it completed anyway?");
          if (!confirmed) event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="taskId" value={taskId} />
      <input type="hidden" name="status" value={selectedStatus} />
      <div>
        <p className="mb-2 text-sm font-medium text-white/84">Task status</p>
        <Badge>{formatTaskStatus(currentStatus)}</Badge>
      </div>
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as TaskStatusValue)}
        className="h-10 w-full rounded-lg border border-white/10 bg-black/40 px-3 text-sm text-white outline-none focus:border-accent"
      >
        {taskStatusOptions.map((status) => (
          <option key={status.value} value={status.value}>{status.label}</option>
        ))}
      </select>
      <p className="rounded-lg border border-white/10 bg-white/[0.035] p-3 text-sm leading-6 text-white/58">
        {describeTaskStatus(selectedStatus)}
      </p>
      <Button className="w-full" variant="accent" disabled={unchanged || pending}>
        {pending ? "Updating..." : "Update task status"}
      </Button>
      {toast ? (
        <p className="flex items-center gap-2 rounded-lg border border-accent/30 bg-accent/10 p-3 text-sm text-accent" role="status">
          <CheckCircle2 className="size-4" />
          {toast}
        </p>
      ) : null}
    </form>
  );
}
