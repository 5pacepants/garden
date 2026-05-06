import { useMemo, useState } from "react";
import { relativeToWorldPoint } from "../../domain/geometry";
import type { GardenState, Plant, Point } from "../../domain/models";
import { MapToolbar, type LayerVisibility } from "./MapToolbar";
import { isSelected, type MapSelection } from "./mapSelection";
import { polygonToSvgPoints } from "./mapTransforms";

type GardenMapProps = {
  gardenState: GardenState;
  onSelectionChange: (selection: MapSelection) => void;
  selection: MapSelection;
};

const defaultLayers: LayerVisibility = {
  zones: true,
  beds: true,
  existing: true,
  planned: true,
  wishlist: true,
};

export function GardenMap({ gardenState, onSelectionChange, selection }: GardenMapProps) {
  const [layers, setLayers] = useState(defaultLayers);
  const plantsWithPositions = useMemo(
    () =>
      gardenState.plants.map((plant) => ({
        plant,
        position: getPlantWorldPosition(plant, gardenState),
      })),
    [gardenState],
  );

  function toggleLayer(layer: keyof LayerVisibility) {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  return (
    <section className="map-panel" aria-label="Trädgårdskarta">
      <MapToolbar layers={layers} onToggleLayer={toggleLayer} />
      <div className="map-canvas">
        <svg className="map-svg" role="img" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect className="map-background" height="100" width="100" x="0" y="0" />
          {layers.zones &&
            gardenState.zones.map((zone) => (
              <polygon
                className={isSelected(selection, "zone", zone.id) ? "zone-polygon selected" : "zone-polygon"}
                key={zone.id}
                points={polygonToSvgPoints(zone.polygon)}
                onClick={() => onSelectionChange({ type: "zone", id: zone.id })}
              />
            ))}
          {layers.beds &&
            gardenState.beds.map((bed) => (
              <polygon
                className={isSelected(selection, "bed", bed.id) ? "bed-polygon selected" : "bed-polygon"}
                key={bed.id}
                points={polygonToSvgPoints(bed.polygon)}
                onClick={() => onSelectionChange({ type: "bed", id: bed.id })}
              />
            ))}
          {plantsWithPositions
            .filter(({ plant }) => isPlantLayerVisible(plant, layers))
            .map(({ plant, position }) => (
              <circle
                className={isSelected(selection, "plant", plant.id) ? `plant-circle ${plant.status} selected` : `plant-circle ${plant.status}`}
                cx={position.x}
                cy={position.y}
                key={plant.id}
                onClick={() => onSelectionChange({ type: "plant", id: plant.id })}
                r="1.8"
              >
                <title>{plant.swedishName}</title>
              </circle>
            ))}
        </svg>
      </div>
      <div className="map-caption">
        <span className="eyebrow">Karta</span>
        <h2>{gardenState.map.name}</h2>
        <p>
          {gardenState.plants.length} växter, {gardenState.beds.length} rabatt och {gardenState.zones.length} zoner
          laddade från lokal lagring.
        </p>
      </div>
    </section>
  );
}

function isPlantLayerVisible(plant: Plant, layers: LayerVisibility): boolean {
  if (plant.status === "removed") {
    return false;
  }

  return layers[plant.status];
}

function getPlantWorldPosition(plant: Plant, gardenState: GardenState): Point {
  if (plant.placement.type === "map") {
    return plant.placement.position;
  }

  const bedPlacement = plant.placement;
  return relativeToWorldPoint(
    bedPlacement.relativePosition,
    gardenState.beds.find((bed) => bed.id === bedPlacement.bedId)?.polygon ?? [],
  );
}
