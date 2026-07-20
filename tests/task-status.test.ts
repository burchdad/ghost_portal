import { describe, expect, it } from "vitest";
import { describeTaskStatus, formatTaskActivityTarget, formatTaskStatus, taskStatusOptions } from "@/lib/task-status";

describe("task status presentation", () => {
  it("maps raw task enum values to human-friendly labels", () => {
    expect(formatTaskStatus("Assigned")).toBe("Not Started");
    expect(formatTaskStatus("InProgress")).toBe("In Progress");
    expect(formatTaskStatus("WaitingOnStephen")).toBe("Waiting on Stephen");
    expect(formatTaskStatus("WaitingOnClient")).toBe("Waiting on Client");
    expect(formatTaskStatus("Completed")).toBe("Completed");
    expect(formatTaskStatus("Blocked")).toBe("Blocked");
  });

  it("keeps descriptions centralized for the status control", () => {
    expect(taskStatusOptions).toHaveLength(6);
    expect(describeTaskStatus("WaitingOnStephen")).toBe("A decision or approval is required from Stephen.");
  });

  it("formats historical activity targets that stored raw enum values", () => {
    expect(formatTaskActivityTarget("InProgress")).toBe("In Progress");
    expect(formatTaskActivityTarget("created task")).toBe("created task");
  });
});
