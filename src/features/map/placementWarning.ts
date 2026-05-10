import { findZonesAtPoint } from "../../domain/geometry";
import type { PlaceMatch, Plant, Point, Zone } from "../../domain/models";
import { getPlacementWarning } from "../../domain/placeMatching";

export type ProposedPlacementWarning = PlaceMatch & {
  message: string;
};

export function getProposedPlacementWarning(
  plant: Plant,
  point: Point,
  zones: Zone[],
): ProposedPlacementWarning | null {
  const match = getPlacementWarning(plant, findZonesAtPoint(point, zones));

  if (match.state !== "warning") {
    return null;
  }

  return {
    ...match,
    message: `${plant.swedishName} verkar inte passa perfekt på den här platsen.`,
  };
}
