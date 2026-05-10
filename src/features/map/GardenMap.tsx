import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from "react";
import { TauriMediaService, type MediaService } from "../../data/mediaService";
import { getPlantMapRadius } from "../../domain/gardenEdits";
import { findContainingBed, relativeToWorldPoint, worldToRelativePoint } from "../../domain/geometry";
import { createId } from "../../domain/ids";
import type { Bed, GardenState, Plant, Point, Zone } from "../../domain/models";
import type { PlantFilterState } from "../plants/PlantFilters";
import { getPlantNodeStrokeWidth, getZoneStyle } from "./mapDisplay";
import { moveBedToDelta, movePlantToPoint, moveZoneToDelta, updatePolygonVertex } from "./mapDrag";
import { MapToolbar, type LayerVisibility, type MapMode } from "./MapToolbar";
import { isSelected, type MapSelection } from "./mapSelection";
import { polygonToSvgPoints, screenToNormalizedPoint } from "./mapTransforms";
import { getProposedPlacementWarning } from "./placementWarning";

type GardenMapProps = {
  gardenState: GardenState;
  plantFilters: PlantFilterState;
  visiblePlantIds: Set<string>;
  onAddBed: (bed: Bed) => void;
  onAddPlant: (plant: Plant) => void;
  onAddZone: (zone: Zone) => void;
  onUpdateBed: (bed: Bed) => void;
  onUpdatePlant: (plant: Plant) => void;
  onUpdateZone: (zone: Zone) => void;
  onSelectionChange: (selection: MapSelection) => void;
  selection: MapSelection;
  mediaService?: MediaService;
};

type DragDraft =
  | { type: "plant"; id: string; original: Plant; draft: Plant; startPoint: Point; hasMoved: boolean }
  | { type: "bed"; id: string; original: Bed; draft: Bed; startPoint: Point; hasMoved: boolean }
  | { type: "zone"; id: string; original: Zone; draft: Zone; startPoint: Point; hasMoved: boolean };

type PolygonVertexEdit =
  | {
      type: "bed";
      original: Bed;
      draft: Bed;
      activeIndex: number | null;
      hasMoved: boolean;
    }
  | {
      type: "zone";
      original: Zone;
      draft: Zone;
      activeIndex: number | null;
      hasMoved: boolean;
    };

const defaultLayers: LayerVisibility = {
  zones: true,
  beds: true,
  existing: true,
  planned: true,
  wishlist: true,
};

const minZoom = 1;
const maxZoom = 3;
const zoomStep = 0.25;
const dragThreshold = 0.5;
const defaultMediaService = new TauriMediaService();

export function GardenMap({
  gardenState,
  plantFilters: _plantFilters,
  visiblePlantIds,
  onAddBed,
  onAddPlant,
  onAddZone,
  onUpdateBed,
  onUpdatePlant,
  onUpdateZone,
  onSelectionChange,
  selection,
  mediaService = defaultMediaService,
}: GardenMapProps) {
  const [layers, setLayers] = useState(defaultLayers);
  const [mode, setMode] = useState<MapMode>("select");
  const [draftPolygon, setDraftPolygon] = useState<Point[]>([]);
  const [zoom, setZoom] = useState(1);
  const [dragDraft, setDragDraft] = useState<DragDraft | null>(null);
  const [polygonVertexEdit, setPolygonVertexEdit] = useState<PolygonVertexEdit | null>(null);
  const [backgroundImageUrl, setBackgroundImageUrl] = useState<string | undefined>(gardenState.map.backgroundImage);
  const dragMovedRef = useRef(false);
  const isPointerDraggingRef = useRef(false);
  const vertexMovedRef = useRef(false);

  const displayBeds = useMemo(
    () =>
      gardenState.beds.map((bed) => {
        if (polygonVertexEdit?.type === "bed" && polygonVertexEdit.draft.id === bed.id) return polygonVertexEdit.draft;
        return dragDraft?.type === "bed" && dragDraft.id === bed.id ? dragDraft.draft : bed;
      }),
    [dragDraft, gardenState.beds, polygonVertexEdit],
  );
  const displayZones = useMemo(
    () =>
      gardenState.zones.map((zone) => {
        if (polygonVertexEdit?.type === "zone" && polygonVertexEdit.draft.id === zone.id) return polygonVertexEdit.draft;
        return dragDraft?.type === "zone" && dragDraft.id === zone.id ? dragDraft.draft : zone;
      }),
    [dragDraft, gardenState.zones, polygonVertexEdit],
  );
  const displayPlants = useMemo(
    () => gardenState.plants.map((plant) => (dragDraft?.type === "plant" && dragDraft.id === plant.id ? dragDraft.draft : plant)),
    [dragDraft, gardenState.plants],
  );
  const displayState = useMemo(
    () => ({ ...gardenState, beds: displayBeds, zones: displayZones, plants: displayPlants }),
    [displayBeds, displayPlants, displayZones, gardenState],
  );
  const plantsWithPositions = useMemo(
    () =>
      displayPlants.map((plant) => ({
        plant,
        position: getPlantWorldPosition(plant, displayState),
      })),
    [displayPlants, displayState],
  );
  const proposedPlacementWarning = useMemo(() => {
    if (dragDraft?.type !== "plant" || !dragDraft.hasMoved) {
      return null;
    }

    return getProposedPlacementWarning(
      dragDraft.draft,
      getPlantWorldPosition(dragDraft.draft, displayState),
      displayState.zones,
    );
  }, [displayState, dragDraft]);

  useEffect(() => {
    let isActive = true;

    if (!gardenState.map.backgroundImage) {
      setBackgroundImageUrl(undefined);
      return;
    }

    mediaService
      .resolveMediaUrl(gardenState.map.backgroundImage)
      .then((url) => {
        if (isActive) {
          setBackgroundImageUrl(url);
        }
      })
      .catch(() => {
        if (isActive) {
          setBackgroundImageUrl(undefined);
        }
      });

    return () => {
      isActive = false;
    };
  }, [gardenState.map.backgroundImage, mediaService]);

  function toggleLayer(layer: keyof LayerVisibility) {
    setLayers((current) => ({ ...current, [layer]: !current[layer] }));
  }

  function handleModeChange(nextMode: MapMode) {
    setMode(nextMode);
    setDraftPolygon([]);
    setDragDraft(null);
    setPolygonVertexEdit(null);
    isPointerDraggingRef.current = false;
  }

  function handleCanvasClick(event: MouseEvent<SVGSVGElement>) {
    const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());

    if (dragDraft?.hasMoved) {
      return;
    }

    if (mode === "addPlant") {
      addPlantAtPoint(point);
      return;
    }

    if (event.target !== event.currentTarget && mode === "select") {
      return;
    }

    if (mode === "drawBed" || mode === "drawZone") {
      setDraftPolygon((current) => [...current, point]);
      return;
    }

    onSelectionChange(null);
  }

  function addPlantAtPoint(point: Point) {
    const containingBed = findContainingBed(point, gardenState.beds);
    const plant: Plant = {
      id: createId("plant"),
      swedishName: "Ny växt",
      status: "planned",
      type: "perennial",
      mapRadius: 1.8,
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

  function startDrag(event: PointerEvent<SVGElement>, nextDraft: DragDraft) {
    if (mode !== "select") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    dragMovedRef.current = false;
    isPointerDraggingRef.current = true;
    setDragDraft(nextDraft);
    onSelectionChange({ type: nextDraft.type, id: nextDraft.id });
  }

  function updateDrag(event: PointerEvent<SVGSVGElement>) {
    if (polygonVertexEdit?.activeIndex !== null && polygonVertexEdit?.activeIndex !== undefined) {
      const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
      vertexMovedRef.current = true;
      setPolygonVertexEdit((current) => {
        if (!current || current.activeIndex === null) return current;
        const polygon = updatePolygonVertex(current.draft.polygon, current.activeIndex, point);
        return { ...current, draft: { ...current.draft, polygon }, hasMoved: true };
      });
      return;
    }

    if (!dragDraft || mode !== "select" || !isPointerDraggingRef.current) {
      return;
    }

    const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
    const delta = { x: point.x - dragDraft.startPoint.x, y: point.y - dragDraft.startPoint.y };
    if (event.buttons === 0) {
      isPointerDraggingRef.current = false;
      finishDragDraftAtPoint(dragDraft, point, delta);
      return;
    }

    const hasMoved = dragDraft.hasMoved || Math.abs(delta.x) > dragThreshold || Math.abs(delta.y) > dragThreshold;
    if (hasMoved) {
      dragMovedRef.current = true;
    }

    if (dragDraft.type === "plant") {
      setDragDraft({
        ...dragDraft,
        draft: movePlantToPoint(dragDraft.original, point, gardenState.beds),
        hasMoved,
      });
      return;
    }

    if (dragDraft.type === "bed") {
      setDragDraft({
        ...dragDraft,
        draft: moveBedToDelta(dragDraft.original, delta),
        hasMoved,
      });
      return;
    }

    setDragDraft({
      ...dragDraft,
      draft: moveZoneToDelta(dragDraft.original, delta),
      hasMoved,
    });
  }

  function endDrag(event: PointerEvent<SVGSVGElement>) {
    if (polygonVertexEdit?.activeIndex !== null && polygonVertexEdit?.activeIndex !== undefined) {
      const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
      setPolygonVertexEdit((current) => {
        if (!current || current.activeIndex === null) return current;
        const polygon = updatePolygonVertex(current.draft.polygon, current.activeIndex, point);
        return { ...current, draft: { ...current.draft, polygon }, activeIndex: null, hasMoved: true };
      });
      return;
    }

    if (!dragDraft) {
      return;
    }

    isPointerDraggingRef.current = false;
    const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.getBoundingClientRect());
    const delta = { x: point.x - dragDraft.startPoint.x, y: point.y - dragDraft.startPoint.y };
    finishDragDraftAtPoint(dragDraft, point, delta);
  }

  function finishDragDraftAtPoint(currentDraft: DragDraft, point: Point, delta: Point) {
    const hasMoved = currentDraft.hasMoved || dragMovedRef.current || Math.abs(delta.x) > dragThreshold || Math.abs(delta.y) > dragThreshold;

    if (!hasMoved) {
      setDragDraft(null);
      return;
    }

    setDragDraft(createDragDraftAtPoint(currentDraft, point, delta, gardenState.beds));
  }

  function saveMove() {
    isPointerDraggingRef.current = false;
    if (polygonVertexEdit?.hasMoved) {
      if (polygonVertexEdit.type === "bed") {
        onUpdateBed(polygonVertexEdit.draft);
      } else {
        onUpdateZone(polygonVertexEdit.draft);
      }
      setPolygonVertexEdit(null);
      return;
    }

    if (!dragDraft) {
      return;
    }

    if (dragDraft.type === "plant") {
      onUpdatePlant(dragDraft.draft);
    } else if (dragDraft.type === "bed") {
      onUpdateBed(dragDraft.draft);
    } else {
      onUpdateZone(dragDraft.draft);
    }

    setDragDraft(null);
  }

  function handleAdapt() {
    isPointerDraggingRef.current = false;
    if (selection?.type === "bed") {
      const bed = gardenState.beds.find((item) => item.id === selection.id);
      if (bed) {
        setDragDraft(null);
        setPolygonVertexEdit({ type: "bed", original: bed, draft: bed, activeIndex: null, hasMoved: false });
        return;
      }
    }

    if (selection?.type === "zone") {
      const zone = gardenState.zones.find((item) => item.id === selection.id);
      if (zone) {
        setDragDraft(null);
        setPolygonVertexEdit({ type: "zone", original: zone, draft: zone, activeIndex: null, hasMoved: false });
        return;
      }
    }

    setZoom(1);
  }

  return (
    <section className="map-panel" aria-label="Trädgårdskarta">
      <MapToolbar
        canFinishPolygon={draftPolygon.length >= 3}
        canZoomIn={zoom < maxZoom}
        canZoomOut={zoom > minZoom}
        layers={layers}
        mode={mode}
        pendingMove={Boolean(dragDraft?.hasMoved || polygonVertexEdit?.hasMoved)}
        onCancelPolygon={() => setDraftPolygon([])}
        onFinishPolygon={finishPolygon}
        onModeChange={handleModeChange}
        onResetZoom={handleAdapt}
        onSaveMove={saveMove}
        onToggleLayer={toggleLayer}
        onUndoMove={() => {
          isPointerDraggingRef.current = false;
          setDragDraft(null);
          setPolygonVertexEdit(null);
        }}
        onZoomIn={() => setZoom((current) => Math.min(maxZoom, current + zoomStep))}
        onZoomOut={() => setZoom((current) => Math.max(minZoom, current - zoomStep))}
      />
      {proposedPlacementWarning && (
        <div className="placement-warning" role="status">
          <strong>Platsvarning</strong>
          <span>{proposedPlacementWarning.message}</span>
          {proposedPlacementWarning.reasons.map((reason) => (
            <span key={reason}>{reason}</span>
          ))}
        </div>
      )}
      <div className="map-viewport">
        <div className="map-stage" style={{ "--map-zoom": zoom } as CSSProperties}>
          <svg
            className={`map-svg mode-${mode}${dragDraft?.hasMoved ? " has-pending-move" : ""}`}
            onClick={handleCanvasClick}
            onPointerMove={updateDrag}
            onPointerUp={endDrag}
            role="img"
            viewBox="0 0 100 56.82"
            preserveAspectRatio="none"
          >
            <rect className="map-background" height="56.82" width="100" x="0" y="0" />
            {backgroundImageUrl && (
              <image
                className="map-background-image"
                href={backgroundImageUrl}
                height="56.82"
                preserveAspectRatio="xMidYMid meet"
                width="100"
                x="0"
                y="0"
              />
            )}
            {layers.zones &&
              displayZones.map((zone) => (
                <polygon
                  className={isSelected(selection, "zone", zone.id) ? "zone-polygon selected" : "zone-polygon"}
                  key={zone.id}
                  points={polygonToSvgPoints(zone.polygon)}
                  style={getZoneStyle(zone.light)}
                  onClick={(event) => {
                    if (mode !== "select") return;
                    event.stopPropagation();
                    onSelectionChange({ type: "zone", id: zone.id });
                  }}
                  onPointerDown={(event) => {
                    const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? new DOMRect());
                    startDrag(event, { type: "zone", id: zone.id, original: zone, draft: zone, startPoint: point, hasMoved: false });
                  }}
                />
              ))}
            {layers.beds &&
              displayBeds.map((bed) => (
                <polygon
                  className={isSelected(selection, "bed", bed.id) ? "bed-polygon selected" : "bed-polygon"}
                  key={bed.id}
                  points={polygonToSvgPoints(bed.polygon)}
                  onClick={(event) => {
                    if (mode !== "select") return;
                    event.stopPropagation();
                    onSelectionChange({ type: "bed", id: bed.id });
                  }}
                  onPointerDown={(event) => {
                    const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? new DOMRect());
                    startDrag(event, { type: "bed", id: bed.id, original: bed, draft: bed, startPoint: point, hasMoved: false });
                  }}
                />
              ))}
            {polygonVertexEdit &&
              polygonVertexEdit.draft.polygon.map((point, index) => (
                <circle
                  className="polygon-vertex-handle"
                  cx={point.x}
                  cy={point.y}
                  key={`${polygonVertexEdit.draft.id}-${index}`}
                  onPointerDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    event.currentTarget.setPointerCapture?.(event.pointerId);
                    vertexMovedRef.current = false;
                    setPolygonVertexEdit((current) => (current ? { ...current, activeIndex: index } : current));
                  }}
                  r="1.1"
                />
              ))}
            {plantsWithPositions
              .filter(({ plant }) => isPlantLayerVisible(plant, layers) && visiblePlantIds.has(plant.id))
              .map(({ plant, position }) => (
                <circle
                  className={isSelected(selection, "plant", plant.id) ? `plant-circle ${plant.status} selected` : `plant-circle ${plant.status}`}
                  cx={position.x}
                  cy={position.y}
                  key={plant.id}
                  onClick={(event) => {
                    if (mode !== "select") return;
                    event.stopPropagation();
                    onSelectionChange({ type: "plant", id: plant.id });
                  }}
                  onPointerDown={(event) => {
                    const point = screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, event.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? new DOMRect());
                    startDrag(event, { type: "plant", id: plant.id, original: plant, draft: plant, startPoint: point, hasMoved: false });
                  }}
                  r={getPlantMapRadius(plant)}
                  strokeWidth={getPlantNodeStrokeWidth(getPlantMapRadius(plant))}
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

function createDragDraftAtPoint(dragDraft: DragDraft, point: Point, delta: Point, beds: Bed[]): DragDraft {
  if (dragDraft.type === "plant") {
    return {
      ...dragDraft,
      draft: movePlantToPoint(dragDraft.original, point, beds),
      hasMoved: true,
    };
  }

  if (dragDraft.type === "bed") {
    return {
      ...dragDraft,
      draft: moveBedToDelta(dragDraft.original, delta),
      hasMoved: true,
    };
  }

  return {
    ...dragDraft,
    draft: moveZoneToDelta(dragDraft.original, delta),
    hasMoved: true,
  };
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

