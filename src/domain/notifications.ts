import type { Task } from "./models";

const priorityRank: Record<Task["priority"], number> = {
  high: 0,
  normal: 1,
  low: 2,
};

export function selectTopNotifications(tasks: Task[], today: Date, limit = 3): Task[] {
  const todayTime = toDateOnly(today).getTime();
  const weekAheadTime = todayTime + 7 * 24 * 60 * 60 * 1000;

  return tasks
    .filter((task) => task.status === "open" && task.dueDate)
    .filter((task) => {
      const dueTime = parseDateOnly(task.dueDate).getTime();
      return dueTime <= weekAheadTime;
    })
    .sort((a, b) => {
      const aDue = parseDateOnly(a.dueDate).getTime();
      const bDue = parseDateOnly(b.dueDate).getTime();
      const dateGroupDelta = getDateGroupRank(aDue, todayTime) - getDateGroupRank(bDue, todayTime);

      if (dateGroupDelta !== 0) {
        return dateGroupDelta;
      }

      return aDue - bDue || priorityRank[a.priority] - priorityRank[b.priority] || a.title.localeCompare(b.title);
    })
    .slice(0, limit);
}

function getDateGroupRank(dueTime: number, todayTime: number): number {
  if (dueTime < todayTime) {
    return 0;
  }

  if (dueTime === todayTime) {
    return 1;
  }

  return 2;
}

function parseDateOnly(value: string | undefined): Date {
  if (!value) {
    return new Date(8640000000000000);
  }

  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toDateOnly(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
