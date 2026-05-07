import { findZonesAtPoint, relativeToWorldPoint } from "../../domain/geometry";
import { placeMatchStateLabel } from "../../domain/labels";
import { getPlacementWarning, rankPlantsForConditions } from "../../domain/placeMatching";
import type { GardenState, Plant, Point, Zone } from "../../domain/models";
import type { MapSelection } from "../map/mapSelection";

type PlaceMatchPanelProps = {
  gardenState: GardenState;
  selection: MapSelection;
};

export function PlaceMatchPanel({ gardenState, selection }: PlaceMatchPanelProps) {
  if (!selection) {
    return <p className="helper-text">Välj en växt eller zon för platsmatchning.</p>;
  }

  if (selection.type === "plant") {
    const plant = gardenState.plants.find((item) => item.id === selection.id);
    if (!plant) return null;
    const zones = findZonesAtPoint(getPlantWorldPosition(plant, gardenState), gardenState.zones);
    const match = getPlacementWarning(plant, zones);
    return (
      <div className={`place-match ${match.state}`}>
        <strong>{placeMatchStateLabel(match.state)}</strong>
        {match.reasons.map((reason) => (
          <p key={reason}>{reason}</p>
        ))}
      </div>
    );
  }

  if (selection.type === "zone") {
    const zone = gardenState.zones.find((item) => item.id === selection.id);
    if (!zone) return null;
    const ranked = rankPlantsForConditions(gardenState.plants, zoneToConditions(zone)).slice(0, 5);
    return (
      <div className="place-match">
        <strong>Växter som passar här</strong>
        {ranked.map(({ plant, match }) => (
          <p key={plant.id}>{plant.swedishName}: {placeMatchStateLabel(match.state)}</p>
        ))}
      </div>
    );
  }

  return <p className="helper-text">Välj en växt eller zon för platsmatchning.</p>;
}

function getPlantWorldPosition(plant: Plant, gardenState: GardenState): Point {
  if (plant.placement.type === "map") {
    return plant.placement.position;
  }

  const placement = plant.placement;
  return relativeToWorldPoint(
    placement.relativePosition,
    gardenState.beds.find((bed) => bed.id === placement.bedId)?.polygon ?? [],
  );
}

function zoneToConditions(zone: Zone) {
  return {
    light: zone.light,
    moisture: zone.moisture,
    soilTraits: zone.soilTraits,
  };
}
