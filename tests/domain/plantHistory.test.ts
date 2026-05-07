import { describe, expect, it } from "vitest";
import type { HistoryEvent, Plant } from "../../src/domain/models";
import { createPlantingHistoryEventIfNeeded } from "../../src/domain/plantHistory";

const basePlant: Plant = {
  id: "plant-lavender",
  swedishName: "Lavendel",
  status: "planned",
  type: "perennial",
  placement: { type: "map", position: { x: 20, y: 20 } },
  needs: {},
  tags: [],
  careSchedule: [],
};

describe("plant history", () => {
  it("creates a planting event when a plant becomes existing", () => {
    const event = createPlantingHistoryEventIfNeeded(
      basePlant,
      { ...basePlant, status: "existing" },
      [],
      "2026-05-07",
    );

    expect(event?.title).toBe("Planterade Lavendel");
    expect(event?.type).toBe("planted");
    expect(event?.plantId).toBe("plant-lavender");
    expect(event?.date).toBe("2026-05-07");
  });

  it("creates a planting event when a new plant is saved as existing", () => {
    const event = createPlantingHistoryEventIfNeeded(null, { ...basePlant, status: "existing" }, [], "2026-05-07");

    expect(event?.title).toBe("Planterade Lavendel");
  });

  it("does not duplicate an existing planting event", () => {
    const existing: HistoryEvent[] = [
      {
        id: "history-1",
        type: "planted",
        date: "2026-05-07",
        title: "Planterade Lavendel",
        plantId: "plant-lavender",
      },
    ];

    expect(createPlantingHistoryEventIfNeeded(basePlant, { ...basePlant, status: "existing" }, existing, "2026-05-07")).toBeNull();
  });
});
