import { describe, expect, it } from "vitest";
import { selectTopNotifications } from "../../src/domain/notifications";
import type { Task } from "../../src/domain/models";

describe("notifications", () => {
  it("returns overdue, today, and upcoming tasks in priority order", () => {
    const result = selectTopNotifications(
      [
        task({ id: "later", title: "Later", dueDate: "2026-06-01" }),
        task({ id: "future", title: "Future", dueDate: "2026-05-10" }),
        task({ id: "today", title: "Today", dueDate: "2026-05-06" }),
        task({ id: "late", title: "Late", dueDate: "2026-05-01" }),
      ],
      new Date("2026-05-06"),
    );

    expect(result.map((item) => item.id)).toEqual(["late", "today", "future"]);
  });

  it("ignores completed tasks", () => {
    const result = selectTopNotifications(
      [
        task({ id: "done", dueDate: "2026-05-01", status: "completed" }),
        task({ id: "open", dueDate: "2026-05-06" }),
      ],
      new Date("2026-05-06"),
    );

    expect(result.map((item) => item.id)).toEqual(["open"]);
  });

  it("prioritizes high priority tasks within the same date group", () => {
    const result = selectTopNotifications(
      [
        task({ id: "normal", dueDate: "2026-05-06", priority: "normal" }),
        task({ id: "high", dueDate: "2026-05-06", priority: "high" }),
      ],
      new Date("2026-05-06"),
    );

    expect(result.map((item) => item.id)).toEqual(["high", "normal"]);
  });
});

function task(overrides: Partial<Task>): Task {
  return {
    id: "task",
    title: "Task",
    actionType: "water",
    status: "open",
    priority: "normal",
    ...overrides,
  };
}
