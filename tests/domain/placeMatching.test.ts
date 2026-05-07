import { describe, expect, it } from "vitest";
import {
  getPlacementWarning,
  matchPlantToConditions,
  rankPlantsForConditions,
} from "../../src/domain/placeMatching";
import type { Plant, Zone } from "../../src/domain/models";

describe("place matching", () => {
  it("returns good when plant needs match zone conditions", () => {
    const result = matchPlantToConditions(
      { light: ["sun"], moisture: ["normal"], soilTraits: ["well_drained"] },
      { light: "sun", moisture: "normal", soilTraits: ["well_drained"] },
    );

    expect(result.state).toBe("good");
    expect(result.reasons).toContain("Platsen matchar växtens ljusbehov.");
  });

  it("warns when a full sun plant is placed in part shade", () => {
    const result = matchPlantToConditions(
      { light: ["sun"], moisture: ["normal"] },
      { light: "part_shade", moisture: "normal" },
    );

    expect(result.state).toBe("warning");
    expect(result.reasons[0]).toContain("sol");
  });

  it("returns unknown when plant needs are missing", () => {
    const result = matchPlantToConditions({}, { light: "sun", moisture: "normal" });

    expect(result.state).toBe("unknown");
    expect(result.reasons).toContain("Växtens krav saknas.");
  });

  it("returns possible when overlapping zone data conflicts", () => {
    const result = getPlacementWarning(
      plantWithNeeds({ light: ["sun"], moisture: ["normal"] }),
      [
        zoneWithConditions("sun", { light: "sun", moisture: "normal" }),
        zoneWithConditions("shade", { light: "shade", moisture: "normal" }),
      ],
    );

    expect(result.state).toBe("possible");
    expect(result.reasons.some((reason) => reason.includes("motstridiga"))).toBe(true);
  });

  it("ranks plants that fit a place before possible matches and warnings", () => {
    const plants = [
      plantWithNeeds({ id: "shade", light: ["shade"], moisture: ["moist"] }),
      plantWithNeeds({ id: "sun", light: ["sun"], moisture: ["normal"] }),
      plantWithNeeds({ id: "unknown" }),
    ];

    const ranked = rankPlantsForConditions(plants, { light: "sun", moisture: "normal" });

    expect(ranked.map((item) => item.plant.id)).toEqual(["sun", "unknown", "shade"]);
    expect(ranked.map((item) => item.match.state)).toEqual(["good", "unknown", "warning"]);
  });
});

function plantWithNeeds(overrides: Partial<Plant["needs"]> & { id?: string } = {}): Plant {
  return {
    id: overrides.id ?? "plant",
    swedishName: "Testväxt",
    status: "planned",
    type: "perennial",
    placement: { type: "map", position: { x: 50, y: 50 } },
    needs: {
      light: overrides.light,
      moisture: overrides.moisture,
      soilTraits: overrides.soilTraits,
    },
    tags: [],
    careSchedule: [],
  };
}

function zoneWithConditions(id: string, conditions: Pick<Zone, "light" | "moisture" | "soilTraits">): Zone {
  return {
    id,
    name: id,
    polygon: [],
    ...conditions,
  };
}

