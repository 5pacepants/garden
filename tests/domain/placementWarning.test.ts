import { describe, expect, it } from "vitest";
import type { Plant, Zone } from "../../src/domain/models";
import { getProposedPlacementWarning } from "../../src/features/map/placementWarning";

const shadeZone: Zone = {
  id: "zone-shade",
  name: "Skugga",
  polygon: [
    { x: 0, y: 0 },
    { x: 50, y: 0 },
    { x: 50, y: 50 },
    { x: 0, y: 50 },
  ],
  light: "shade",
};

const fullSunPlant: Plant = {
  id: "plant-1",
  swedishName: "Lavendel",
  status: "planned",
  type: "perennial",
  placement: { type: "map", position: { x: 75, y: 75 } },
  needs: { light: ["sun"] },
  tags: [],
  careSchedule: [],
};

describe("placement warnings", () => {
  it("warns when a proposed plant position does not match the zone", () => {
    const warning = getProposedPlacementWarning(fullSunPlant, { x: 25, y: 25 }, [shadeZone]);

    expect(warning?.state).toBe("warning");
    expect(warning?.message).toContain("Lavendel");
  });

  it("stays neutral when plant needs are unknown", () => {
    const warning = getProposedPlacementWarning({ ...fullSunPlant, needs: {} }, { x: 25, y: 25 }, [shadeZone]);

    expect(warning).toBeNull();
  });
});
