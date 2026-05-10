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

  if (rule.timing.type === "recurring") {
    return isSelectedMonth(month, rule.timing.months);
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

  if (rule.timing.type === "weekly") {
    return generateWeeklyTasks(plant, rule, fromDate, toDate);
  }

  return generateRecurringTasks(plant, rule, fromDate, toDate);
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

function generateRecurringTasks(plant: Plant, rule: CareScheduleRule, fromDate: Date, toDate: Date): Task[] {
  if (rule.timing.type !== "recurring") {
    return [];
  }

  if (rule.timing.unit === "month" || rule.timing.unit === "year") {
    return generateCalendarRecurringTasks(plant, rule, fromDate, toDate);
  }

  const tasks: Task[] = [];
  const cursor = new Date(fromDate);

  while (cursor <= toDate) {
    if (isSelectedMonth(cursor.getMonth() + 1, rule.timing.months)) {
      tasks.push(createTask(plant, rule, cursor));
    }

    cursor.setDate(cursor.getDate() + getIntervalDays(rule.timing.unit, rule.timing.interval));
  }

  return tasks;
}

function generateCalendarRecurringTasks(plant: Plant, rule: CareScheduleRule, fromDate: Date, toDate: Date): Task[] {
  if (rule.timing.type !== "recurring") {
    return [];
  }

  const tasks: Task[] = [];
  const selectedMonths = rule.timing.months.length > 0 ? rule.timing.months : Array.from({ length: 12 }, (_, index) => index + 1);
  const yearInterval = rule.timing.unit === "year" ? rule.timing.interval : 1;

  for (let year = fromDate.getFullYear(); year <= toDate.getFullYear(); year += yearInterval) {
    selectedMonths.forEach((month) => {
      const dueDate = new Date(year, month - 1, 1);
      if (isDateInRange(dueDate, fromDate, toDate) && shouldIncludeCalendarMonth(rule, month)) {
        tasks.push(createTask(plant, rule, dueDate));
      }
    });
  }

  return tasks.sort((first, second) => (first.dueDate ?? "").localeCompare(second.dueDate ?? ""));
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

function isSelectedMonth(month: number, selectedMonths: number[]): boolean {
  return selectedMonths.length === 0 || selectedMonths.includes(month);
}

function getIntervalDays(unit: "day" | "week", interval: number): number {
  const normalizedInterval = Math.max(1, Math.round(interval));
  return unit === "day" ? normalizedInterval : normalizedInterval * 7;
}

function shouldIncludeCalendarMonth(rule: CareScheduleRule, month: number): boolean {
  if (rule.timing.type !== "recurring" || rule.timing.unit !== "month") {
    return true;
  }

  const firstSelectedMonth = rule.timing.months.length > 0 ? Math.min(...rule.timing.months) : 1;
  return (month - firstSelectedMonth) % Math.max(1, rule.timing.interval) === 0;
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
