import { describe, expect, it } from "vitest";
import { generateTasksFromCareSchedule, groupTasksByCalendarDay, isCareRuleDue } from "../../src/domain/careSchedule";
import type { CareScheduleRule, Plant } from "../../src/domain/models";

describe("care schedule", () => {
  it("creates a task for a specific date rule inside the range", () => {
    const plant = plantWithRules([
      rule({
        id: "rule_prune",
        actionType: "prune",
        timing: { type: "date", month: 5, day: 1 },
        instructions: "Beskär fjolårets stjälkar.",
      }),
    ]);

    const tasks = generateTasksFromCareSchedule(plant, new Date("2026-05-01"), new Date("2026-05-31"));

    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      title: "Beskär Röd solhatt",
      dueDate: "2026-05-01",
      actionType: "prune",
      plantId: "plant_echinacea",
      sourceCareRuleId: "rule_prune",
    });
  });

  it("creates a task for a month rule in that month", () => {
    const plant = plantWithRules([
      rule({
        id: "rule_harvest",
        actionType: "harvest",
        timing: { type: "month", month: 7 },
        instructions: "Skörda när bären är mogna.",
      }),
    ]);

    const tasks = generateTasksFromCareSchedule(plant, new Date("2026-07-01"), new Date("2026-07-31"));

    expect(tasks.map((task) => task.dueDate)).toEqual(["2026-07-01"]);
  });

  it("creates weekly recurrence instances within the range", () => {
    const plant = plantWithRules([
      rule({
        id: "rule_water",
        actionType: "water",
        timing: { type: "weekly", startMonth: 6, endMonth: 6, intervalWeeks: 1 },
        instructions: "Vattna under etablering.",
      }),
    ]);

    const tasks = generateTasksFromCareSchedule(plant, new Date("2026-06-01"), new Date("2026-06-21"));

    expect(tasks.map((task) => task.dueDate)).toEqual(["2026-06-01", "2026-06-08", "2026-06-15"]);
  });

  it("does not create automatic dated tasks for conditional rules", () => {
    const plant = plantWithRules([
      rule({
        id: "rule_drought",
        actionType: "water",
        timing: { type: "condition", label: "vid torka" },
        instructions: "Vattna extra vid torka.",
      }),
    ]);

    expect(generateTasksFromCareSchedule(plant, new Date("2026-06-01"), new Date("2026-06-30"))).toEqual([]);
  });

  it("checks whether a care rule is due on a date", () => {
    expect(isCareRuleDue(rule({ timing: { type: "date", month: 5, day: 1 } }), new Date("2026-05-01"))).toBe(true);
    expect(isCareRuleDue(rule({ timing: { type: "month", month: 5 } }), new Date("2026-05-16"))).toBe(true);
    expect(isCareRuleDue(rule({ timing: { type: "condition", label: "vid torka" } }), new Date("2026-05-16"))).toBe(false);
  });

  it("groups tasks by calendar day", () => {
    const grouped = groupTasksByCalendarDay([
      {
        id: "task_1",
        title: "A",
        actionType: "water",
        status: "open",
        priority: "normal",
        dueDate: "2026-05-01",
      },
      {
        id: "task_2",
        title: "B",
        actionType: "prune",
        status: "open",
        priority: "normal",
        dueDate: "2026-05-01",
      },
    ]);

    expect(grouped["2026-05-01"].map((task) => task.id)).toEqual(["task_1", "task_2"]);
  });
});

function plantWithRules(careSchedule: CareScheduleRule[]): Plant {
  return {
    id: "plant_echinacea",
    swedishName: "Röd solhatt",
    status: "existing",
    type: "perennial",
    placement: { type: "map", position: { x: 50, y: 50 } },
    needs: {},
    tags: [],
    careSchedule,
  };
}

function rule(overrides: Partial<CareScheduleRule>): CareScheduleRule {
  return {
    id: "rule",
    plantId: "plant_echinacea",
    actionType: "water",
    timing: { type: "month", month: 5 },
    instructions: "Gör något.",
    priority: "normal",
    taskMode: "suggested",
    source: "manual",
    ...overrides,
  };
}
