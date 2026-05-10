import { useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { GardenState, Point } from "../../domain/models";
import { polygonToSvgPoints, screenToNormalizedPoint } from "../map/mapTransforms";
import {
  createMapElement,
  createStarterMapLayout,
  getMapElementCenter,
  insertMapElementPoint,
  moveMapElementPoint,
  renderGardenMapLayoutDataUrl,
  updateMapElement,
  type GardenMapElement,
  type GardenMapElementType,
} from "./mapBuilderModel";

type MapBuilderViewProps = {
  gardenState: GardenState;
  onApplyGardenState: (state: GardenState) => void;
};

type DragState = {
  elementId: string;
  pointIndex: number;
};

const addableTypes: Array<{ type: GardenMapElementType; label: string }> = [
  { type: "house", label: "Lägg till hus" },
  { type: "path", label: "Lägg till gång" },
  { type: "tree", label: "Lägg till träd" },
  { type: "shrub", label: "Lägg till buske" },
  { type: "stone", label: "Lägg till sten" },
  { type: "deck", label: "Lägg till altan" },
  { type: "water", label: "Lägg till vatten" },
  { type: "fence", label: "Lägg till staket" },
];

export function MapBuilderView({ gardenState, onApplyGardenState }: MapBuilderViewProps) {
  const [layout, setLayout] = useState(() => createStarterMapLayout());
  const [selectedId, setSelectedId] = useState(() => layout.elements[0]?.id ?? null);
  const dragState = useRef<DragState | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const selectedElement = layout.elements.find((element) => element.id === selectedId) ?? layout.elements[0] ?? null;

  function addElement(type: GardenMapElementType) {
    const element = createMapElement(type);
    setLayout((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
  }

  function saveElement(element: GardenMapElement) {
    setLayout((current) => updateMapElement(current, element));
  }

  function movePoint(elementId: string, pointIndex: number, point: Point) {
    setLayout((current) => {
      const element = current.elements.find((candidate) => candidate.id === elementId);
      return element ? updateMapElement(current, moveMapElementPoint(element, pointIndex, point)) : current;
    });
  }

  function insertPoint(elementId: string, edgeStartIndex: number, point: Point) {
    setLayout((current) => {
      const element = current.elements.find((candidate) => candidate.id === elementId);
      return element ? updateMapElement(current, insertMapElementPoint(element, edgeStartIndex, point)) : current;
    });
  }

  function pointFromPointer(event: MouseEvent<SVGElement> | PointerEvent<SVGElement>, fallback?: Point): Point {
    const bounds = svgRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width === 0 || bounds.height === 0) {
      return fallback ?? { x: 50, y: 28.41 };
    }

    return screenToNormalizedPoint({ x: event.clientX, y: event.clientY }, bounds);
  }

  function applyAsMapBackground() {
    onApplyGardenState({
      ...gardenState,
      map: {
        ...gardenState.map,
        backgroundImage: renderGardenMapLayoutDataUrl(layout),
      },
    });
  }

  return (
    <section className="map-builder content-panel">
      <div className="list-header">
        <span className="eyebrow">Kartbyggare</span>
        <h2>Skapa kartbild i appen</h2>
      </div>
      <div className="map-builder-layout">
        <div className="map-builder-tools">
          <div className="map-builder-actions">
            {addableTypes.map((item) => (
              <button key={item.type} onClick={() => addElement(item.type)} type="button">
                {item.label}
              </button>
            ))}
          </div>
          <div className="map-builder-object-list" aria-label="Kartobjekt">
            {layout.elements.map((element) => (
              <button
                className={element.id === selectedElement?.id ? "active" : ""}
                key={element.id}
                onClick={() => setSelectedId(element.id)}
                type="button"
              >
                {element.name}
              </button>
            ))}
          </div>
          {selectedElement && <ElementEditor element={selectedElement} onChange={saveElement} />}
          <button className="tool-button primary" onClick={applyAsMapBackground} type="button">
            Använd som kartbild
          </button>
        </div>
        <div className="map-builder-preview">
          <svg
            aria-label="Redigerbar kartbild"
            className="map-builder-svg"
            onPointerMove={(event) => {
              if (!dragState.current) return;
              movePoint(dragState.current.elementId, dragState.current.pointIndex, pointFromPointer(event));
            }}
            onPointerUp={() => {
              dragState.current = null;
            }}
            ref={svgRef}
            role="img"
            viewBox="0 0 100 56.82"
          >
            <rect width="100" height="56.82" fill="#f5f2e8" />
            {layout.elements.map((element) => {
              const center = getMapElementCenter(element);
              const isSelected = element.id === selectedElement?.id;

              return (
                <g key={element.id}>
                  <polygon
                    className={isSelected ? "map-builder-element selected" : "map-builder-element"}
                    fill={element.color}
                    onClick={(event) => {
                      event.stopPropagation();
                      setSelectedId(element.id);
                    }}
                    points={polygonToSvgPoints(element.points)}
                  />
                  <text className="map-builder-label" x={center.x} y={center.y}>
                    {element.name}
                  </text>
                  {isSelected &&
                    element.points.map((point, index) => {
                      const next = element.points[(index + 1) % element.points.length];
                      const midpoint = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };

                      return (
                        <g key={`${element.id}-${index}`}>
                          <line
                            aria-label={`Lägg till punkt efter ${index + 1} för ${element.name}`}
                            className="map-builder-edge-hit"
                            onDoubleClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              insertPoint(element.id, index, pointFromPointer(event, midpoint));
                            }}
                            x1={point.x}
                            x2={next.x}
                            y1={point.y}
                            y2={next.y}
                          />
                          <circle
                            aria-label={`Punkt ${index + 1} för ${element.name}`}
                            className="map-builder-vertex"
                            cx={point.x}
                            cy={point.y}
                            onPointerDown={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              event.currentTarget.setPointerCapture?.(event.pointerId);
                              dragState.current = { elementId: element.id, pointIndex: index };
                            }}
                            r="1.1"
                          />
                        </g>
                      );
                    })}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </section>
  );
}

function ElementEditor({ element, onChange }: { element: GardenMapElement; onChange: (element: GardenMapElement) => void }) {
  return (
    <div className="map-builder-editor">
      <label>
        Namn
        <input value={element.name} onChange={(event) => onChange({ ...element, name: event.target.value })} />
      </label>
      <label>
        Färg
        <input type="color" value={element.color} onChange={(event) => onChange({ ...element, color: event.target.value })} />
      </label>
    </div>
  );
}
