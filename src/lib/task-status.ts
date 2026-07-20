export const taskStatusOptions = [
  {
    value: "Assigned",
    label: "Not Started",
    description: "Assigned but work has not begun."
  },
  {
    value: "InProgress",
    label: "In Progress",
    description: "Work is actively underway."
  },
  {
    value: "WaitingOnStephen",
    label: "Waiting on Stephen",
    description: "A decision or approval is required from Stephen."
  },
  {
    value: "WaitingOnClient",
    label: "Waiting on Client",
    description: "Work depends on client information or action."
  },
  {
    value: "Completed",
    label: "Completed",
    description: "The assigned work is finished."
  },
  {
    value: "Blocked",
    label: "Blocked",
    description: "Work cannot continue because of another issue."
  }
] as const;

export type TaskStatusValue = (typeof taskStatusOptions)[number]["value"];

export const taskStatusPresentation = Object.fromEntries(
  taskStatusOptions.map((status) => [status.value, status])
) as Record<TaskStatusValue, (typeof taskStatusOptions)[number]>;

export function formatTaskStatus(status: string | null | undefined) {
  if (!status) return "Not Started";
  return taskStatusPresentation[status as TaskStatusValue]?.label ?? status;
}

export function describeTaskStatus(status: string | null | undefined) {
  if (!status) return taskStatusPresentation.Assigned.description;
  return taskStatusPresentation[status as TaskStatusValue]?.description ?? "";
}

export function formatTaskActivityTarget(target: string) {
  return taskStatusPresentation[target as TaskStatusValue]?.label ?? target;
}
