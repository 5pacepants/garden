import { describe, expect, it } from "vitest";
import { getPlantNodeStrokeWidth, getZoneStyle } from "../../src/features/map/mapDisplay";

describe("map display helpers", () => {
  it("uses distinct zone colors for light conditions with low opacity", () => {
    expect(getZoneStyle("sun").fill).toBe("rgba(229, 126, 38, 0.32)");
    expect(getZoneStyle("half_sun").fill).toBe("rgba(222, 178, 57, 0.32)");
    expect(getZoneStyle("part_shade").fill).toBe("rgba(87, 135, 173, 0.32)");
    expect(getZoneStyle("shade").fill).toBe("rgba(101, 119, 139, 0.32)");
  });

  it("scales plant node stroke with radius", () => {
    expect(getPlantNodeStrokeWidth(1.8)).toBe(0.35);
    expect(getPlantNodeStrokeWidth(0.8)).toBeLessThan(0.35);
    expect(getPlantNodeStrokeWidth(6)).toBeGreaterThan(0.35);
  });
});

