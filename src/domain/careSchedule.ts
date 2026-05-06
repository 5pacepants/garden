import type { CareScheduleRule, Plant, Task } from "./models";

export function generateTasksFromCareSchedule(plant: Plant, fromDate: Date, toDate: Date): Task[] {
  return plant.careSchedule.flatMap((rule) => generateTasksForRule(plant, rule, fromDate, toDate));
}

export function isCareRuleDue(rule: CareScheduleRule, date: Date): boolean {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (rule.timing.type === "date") {
    return rule.timing.month === month && rule.timing.day === day;
  }

  if (rule.timing.type === "month") {
    return rule.timing.month === month;
  }

  if (rule.timing.type === "range") {
    return isMonthInRange(month, rule.timing.startMonth, rule.timing.endMonth);
  }

  if (rule.timing.type === "weekly") {
    return isMonthInRange(month, rule.timing.startMonth, rule.timing.endMonth);
  }

  return false;
}

export function groupTasksByCalendarDay(tasks: Task[]): Record<string, Task[]> {
  return tasks.reduce<Record<string, Task[]>>((groups, task) => {
    if (!task.dueDate) {
      return groups;
    }

    groups[task.dueDate] = [...(groups[task.dueDate] ?? []), task];
    return groups;
  }, {});
}

function generateTasksForRule(plant: Plant, rule: CareScheduleRule, fromDate: Date, toDate: Date): Task[] {
  if (rule.timing.type === "condition" || rule.timing.type === "relative") {
    return [];
  }

  if (rule.timing.type === "date") {
    const dueDate = new Date(fromDate.getFullYear(), rule.timing.month - 1, rule.timing.day);
    return isDateInRange(dueDate, fromDate, toDate) ? [createTask(plant, rule, dueDate)] : [];
  }

  if (rule.timing.type === "month") {
    const dueDate = new Date(fromDate.getFullYear(), rule.timing.month - 1, 1);
    return isDateInRange(dueDate, fromDate, toDate) ? [createTask(plant, rule, dueDate)] : [];
  }

  if (rule.timing.type === "range") {
    const dueDate = new Date(fromDate.getFullYear(), rule.timing.startMonth - 1, 1);
    return isDateInRange(dueDate, fromDate, toDate) ? [createTask(plant, rule, dueDate)] : [];
  }

  return generateWeeklyTasks(plant, rule, fromDate, toDate);
}

function generateWeeklyTasks(plant: Plant, rule: CareScheduleRule, fromDate: Date, toDate: Date): Task[] {
  if (rule.timing.type !== "weekly") {
    return [];
  }

  const tasks: Task[] = [];
  const cursor = new Date(fromDate);
  const intervalDays = rule.timing.intervalWeeks * 7;

  while (cursor <= toDate) {
    const month = cursor.getMonth() + 1;

    if (isMonthInRange(month, rule.timing.startMonth, rule.timing.endMonth)) {
      tasks.push(createTask(plant, rule, cursor));
    }

    cursor.setDate(cursor.getDate() + intervalDays);
  }

  return tasks;
}

function createTask(plant: Plant, rule: CareScheduleRule, dueDate: Date): Task {
  return {
    id: `task_${rule.id}_${formatDate(dueDate)}`,
    title: `${formatAction(rule.actionType)} ${plant.swedishName}`,
    actionType: rule.actionType,
    status: "open",
    dueDate: formatDate(dueDate),
    priority: rule.priority,
    plantId: plant.id,
    notes: rule.instructions,
    sourceCareRuleId: rule.id,
  };
}

function isDateInRange(date: Date, fromDate: Date, toDate: Date): boolean {
  return stripTime(date) >= stripTime(fromDate) && stripTime(date) <= stripTime(toDate);
}

function stripTime(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function isMonthInRange(month: number, startMonth: number, endMonth: number): boolean {
  if (startMonth <= endMonth) {
    return month >= startMonth && month <= endMonth;
  }

  return month >= startMonth || month <= endMonth;
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatAction(actionType: CareScheduleRule["actionType"]): string {
  const labels: Record<CareScheduleRule["actionType"], string> = {
    water: "Vattna",
    prune: "Beskär",
    fertilize: "Gödsla",
    plant: "Plantera",
    move: "Flytta",
    divide: "Dela",
    harvest: "Skörda",
    weed: "Rensa",
    inspect: "Kontrollera",
    custom: "Sköt",
  };

  return labels[actionType];
}
