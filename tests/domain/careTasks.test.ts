import { describe, expect, it } from "vitest";
import type { GardenState, Plant } from "../../src/domain/models";
import { savePlantAndSyncCareTasks } from "../../src/domain/gardenEdits";

const plant: Plant = {
  id: "plant-1",
  swedishName: "Lavendel",
  status: "existing",
  type: "perennial",
  placement: { type: "map", position: { x: 10, y: 10 } },
  needs: {},
  tags: [],
  careSchedule: [],
};

const state: GardenState = {
  version: 1,
  map: { id: "map", name: "Karta" },
  beds: [],
  zones: [],
  plants: [plant],
  tasks: [],
  historyEvents: [],
  photos: [],
};

describe("care task sync", () => {
  it("creates calendar tasks from saved care schedule rows", () => {
    const next = savePlantAndSyncCareTasks(
      state,
      {
        ...plant,
        careSchedule: [
          {
            id: "care-1",
            plantId: plant.id,
            actionType: "prune",
            timing: { type: "month", month: 5 },
            instructions: "Beskär i maj",
            priority: "normal",
            taskMode: "automatic",
            source: "manual",
          },
        ],
      },
      new Date("2026-05-01"),
      new Date("2026-05-31"),
    );

    expect(next.tasks).toHaveLength(1);
    expect(next.tasks[0]).toMatchObject({ dueDate: "2026-05-01", sourceCareRuleId: "care-1", plantId: "plant-1" });
  });

  it("does not duplicate care tasks when saving again", () => {
    const withTasks = savePlantAndSyncCareTasks(
      state,
      {
        ...plant,
        careSchedule: [
          {
            id: "care-1",
            plantId: plant.id,
            actionType: "water",
            timing: { type: "weekly", startMonth: 5, endMonth: 5, intervalWeeks: 1 },
            instructions: "Vattna var 7:e dag",
            priority: "normal",
            taskMode: "automatic",
            source: "manual",
          },
        ],
      },
      new Date("2026-05-01"),
      new Date("2026-05-31"),
    );

    const savedAgain = savePlantAndSyncCareTasks(withTasks, withTasks.plants[0], new Date("2026-05-01"), new Date("2026-05-31"));

    expect(savedAgain.tasks).toHaveLength(withTasks.tasks.length);
  });

  it("removes generated care tasks when a care row is removed", () => {
    const withTasks = savePlantAndSyncCareTasks(
      state,
      {
        ...plant,
        careSchedule: [
          {
            id: "care-1",
            plantId: plant.id,
            actionType: "prune",
            timing: { type: "month", month: 5 },
            instructions: "Beskär i maj",
            priority: "normal",
            taskMode: "automatic",
            source: "manual",
          },
        ],
      },
      new Date("2026-05-01"),
      new Date("2026-05-31"),
    );

    const withoutRow = savePlantAndSyncCareTasks(withTasks, { ...withTasks.plants[0], careSchedule: [] }, new Date("2026-05-01"), new Date("2026-05-31"));

    expect(withoutRow.tasks).toHaveLength(0);
  });
});

