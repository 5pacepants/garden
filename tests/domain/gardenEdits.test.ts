import { describe, expect, it } from "vitest";
import type { Bed, GardenState, Plant } from "../../src/domain/models";
import { deleteBed, deletePlant, deleteZone, resizePlantMapNode } from "../../src/domain/gardenEdits";

const bed: Bed = {
  id: "bed-1",
  name: "Rabatt",
  polygon: [
    { x: 10, y: 10 },
    { x: 50, y: 10 },
    { x: 50, y: 50 },
    { x: 10, y: 50 },
  ],
};

const plantInBed: Plant = {
  id: "plant-1",
  swedishName: "Lavendel",
  status: "planned",
  type: "perennial",
  placement: { type: "bed", bedId: "bed-1", relativePosition: { x: 0.5, y: 0.5 } },
  needs: {},
  tags: [],
  careSchedule: [],
};

const state: GardenState = {
  version: 1,
  map: { id: "map", name: "Karta" },
  beds: [bed],
  zones: [{ id: "zone-1", name: "Zon", polygon: bed.polygon }],
  plants: [plantInBed],
  tasks: [{ id: "task-1", title: "Plantera", actionType: "plant", status: "open", priority: "normal", plantId: "plant-1" }],
  historyEvents: [{ id: "history-1", type: "planted", date: "2026-05-07", title: "Planterade Lavendel", plantId: "plant-1" }],
  photos: [],
};

describe("garden edits", () => {
  it("deletes a plant and its linked tasks and history", () => {
    const next = deletePlant(state, "plant-1");

    expect(next.plants).toHaveLength(0);
    expect(next.tasks).toHaveLength(0);
    expect(next.historyEvents).toHaveLength(0);
  });

  it("deletes a bed but keeps contained plants at their world positions", () => {
    const next = deleteBed(state, "bed-1");

    expect(next.beds).toHaveLength(0);
    expect(next.plants[0].placement).toEqual({ type: "map", position: { x: 30, y: 30 } });
  });

  it("deletes a zone without changing plants", () => {
    const next = deleteZone(state, "zone-1");

    expect(next.zones).toHaveLength(0);
    expect(next.plants).toHaveLength(1);
  });

  it("resizes plant map nodes within useful limits", () => {
    expect(resizePlantMapNode({ ...plantInBed, mapRadius: 1.8 }, 1).mapRadius).toBe(2.2);
    expect(resizePlantMapNode({ ...plantInBed, mapRadius: 0.8 }, -1).mapRadius).toBe(0.8);
    expect(resizePlantMapNode({ ...plantInBed, mapRadius: 6 }, 1).mapRadius).toBe(6);
  });
});
