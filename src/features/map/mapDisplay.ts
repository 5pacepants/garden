import type { LightCondition } from "../../domain/models";

type ZoneStyle = {
  fill: string;
  stroke: string;
  strokeWidth: number;
};

const zoneStyles: Record<LightCondition, ZoneStyle> = {
  sun: {
    fill: "rgba(229, 126, 38, 0.32)",
    stroke: "rgba(125, 72, 24, 0.32)",
    strokeWidth: 0.12,
  },
  half_sun: {
    fill: "rgba(222, 178, 57, 0.32)",
    stroke: "rgba(128, 104, 29, 0.32)",
    strokeWidth: 0.12,
  },
  part_shade: {
    fill: "rgba(87, 135, 173, 0.32)",
    stroke: "rgba(45, 79, 107, 0.32)",
    strokeWidth: 0.12,
  },
  shade: {
    fill: "rgba(101, 119, 139, 0.32)",
    stroke: "rgba(56, 69, 84, 0.32)",
    strokeWidth: 0.12,
  },
};

export function getZoneStyle(light: LightCondition | undefined): ZoneStyle {
  return light ? zoneStyles[light] : { fill: "rgba(128, 128, 128, 0.18)", stroke: "rgba(80, 80, 80, 0.28)", strokeWidth: 0.12 };
}

export function getPlantNodeStrokeWidth(radius: number): number {
  return Number(Math.max(0.16, radius * 0.194).toFixed(2));
}

