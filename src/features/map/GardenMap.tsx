import { useMemo, useState, type MouseEvent } from "react";
import { findContainingBed, relativeToWorldPoint, worldToRelativePoint } from "../../domain/geometry";
import { createId } from "../../domain/ids";
import type { Bed, GardenState, Plant, Point, Zone } from "../../domain/models";
import { MapToolbar, type LayerVisibility, type MapMode } from "./MapToolbar";
import { isSelected, type MapSelection } from "./mapSelection";
import { polygonToSvgPoints, screenToNormalizedPoint } from "./mapTransforms";

type GardenMapProps = {
  gardenState: GardenState;
  onAddBed: (bed: Bed) => void;
  onAddPlant: (plant: Plant) => void;
  onAddZone: (zone: Zone) => void;
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

export function GardenMap({ gardenState, onAddBed, onAddPlant, onAddZone, onSelectionChange, selection }: GardenMapProps) {
  const [layers, setLayers] = useState(defaultLayers);
  const [mode, setMode] = useState<MapMode>("select");
  const [draftPolygon, setDraftPolygon] = useState<Point[]>([]);
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

  function handleModeChange(nextMode: MapMode) {
    setMode(nextMode);
    setDraftPolygon([]);
  }

  function handleCanvasClick(event: MouseEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget && mode === "select") {
      return;
    }

    const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());

    if (mode === "addPlant") {
      const containingBed = findContainingBed(point, gardenState.beds);
      const plant: Plant = {
        id: createId("plant"),
        swedishName: "Ny växt",
        status: "planned",
        type: "perennial",
        placement: containingBed
          ? { type: "bed", bedId: containingBed.id, relativePosition: worldToRelativePoint(point, containingBed.polygon) }
          : { type: "map", position: point },
        needs: {},
        tags: [],
        careSchedule: [],
      };
      onAddPlant(plant);
      onSelectionChange({ type: "plant", id: plant.id });
      setMode("select");
      return;
    }

    if (mode === "drawBed" || mode === "drawZone") {
      setDraftPolygon((current) => [...current, point]);
      return;
    }

    onSelectionChange(null);
  }

  function finishPolygon() {
    if (draftPolygon.length < 3) {
      return;
    }

    if (mode === "drawBed") {
      const bed: Bed = {
        id: createId("bed"),
        name: "Ny rabatt",
        polygon: draftPolygon,
      };
      onAddBed(bed);
      onSelectionChange({ type: "bed", id: bed.id });
    }

    if (mode === "drawZone") {
      const zone: Zone = {
        id: createId("zone"),
        name: "Ny zon",
        polygon: draftPolygon,
      };
      onAddZone(zone);
      onSelectionChange({ type: "zone", id: zone.id });
    }

    setDraftPolygon([]);
    setMode("select");
  }

  return (
    <section className="map-panel" aria-label="Trädgårdskarta">
      <MapToolbar
        canFinishPolygon={draftPolygon.length >= 3}
        layers={layers}
        mode={mode}
        onCancelPolygon={() => setDraftPolygon([])}
        onFinishPolygon={finishPolygon}
        onModeChange={handleModeChange}
        onToggleLayer={toggleLayer}
      />
      <div className="map-canvas">
        <svg className={`map-svg mode-${mode}`} onClick={handleCanvasClick} role="img" viewBox="0 0 100 100" preserveAspectRatio="none">
          <rect className="map-background" height="100" width="100" x="0" y="0" />
          {layers.zones &&
            gardenState.zones.map((zone) => (
              <polygon
                className={isSelected(selection, "zone", zone.id) ? "zone-polygon selected" : "zone-polygon"}
                key={zone.id}
                points={polygonToSvgPoints(zone.polygon)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectionChange({ type: "zone", id: zone.id });
                }}
              />
            ))}
          {layers.beds &&
            gardenState.beds.map((bed) => (
              <polygon
                className={isSelected(selection, "bed", bed.id) ? "bed-polygon selected" : "bed-polygon"}
                key={bed.id}
                points={polygonToSvgPoints(bed.polygon)}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectionChange({ type: "bed", id: bed.id });
                }}
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
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectionChange({ type: "plant", id: plant.id });
                }}
                r="1.8"
              >
                <title>{plant.swedishName}</title>
              </circle>
            ))}
          {draftPolygon.length > 0 && (
            <>
              <polyline className="draft-polygon" points={polygonToSvgPoints(draftPolygon)} />
              {draftPolygon.map((point, index) => (
                <circle className="draft-point" cx={point.x} cy={point.y} key={`${point.x}-${point.y}-${index}`} r="1.2" />
              ))}
            </>
          )}
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
