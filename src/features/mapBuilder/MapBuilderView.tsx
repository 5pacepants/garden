import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import type { GardenState, Point, SavedMapImage } from "../../domain/models";
import { polygonToSvgPoints, screenToNormalizedPoint } from "../map/mapTransforms";
import {
  createMapElement,
  createStarterMapLayout,
  cloneLayout,
  getMapElementCenter,
  insertMapElementPoint,
  moveMapElementByDelta,
  moveMapElementPoint,
  renderGardenMapLayoutDataUrl,
  saveLayoutAsMapImage,
  updateMapElement,
  type GardenMapElement,
  type GardenMapElementType,
  type GardenMapLayout,
} from "./mapBuilderModel";

type MapBuilderViewProps = {
  gardenState: GardenState;
  initialLayout?: GardenMapLayout;
  onApplyGardenState: (state: GardenState) => void;
  onSaveMapImage?: (image: SavedMapImage) => void;
};

type DragState = {
  elementId: string;
} & (
  | {
      type: "point";
      pointIndex: number;
    }
  | {
      type: "element";
      startPoint: Point;
      original: GardenMapElement;
    }
);

const addableTypes: Array<{ type: GardenMapElementType; label: string }> = [
  { type: "house", label: "Lägg till hus" },
  { type: "lawn", label: "Lägg till gräsmatta" },
  { type: "path", label: "Lägg till gång" },
  { type: "tree", label: "Lägg till träd" },
  { type: "shrub", label: "Lägg till buske" },
  { type: "stone", label: "Lägg till sten" },
  { type: "deck", label: "Lägg till altan" },
  { type: "water", label: "Lägg till vatten" },
  { type: "fence", label: "Lägg till staket" },
];

export function MapBuilderView({ gardenState, initialLayout, onApplyGardenState, onSaveMapImage }: MapBuilderViewProps) {
  const [layout, setLayout] = useState(() => (initialLayout ? cloneLayout(initialLayout) : createStarterMapLayout()));
  const [selectedId, setSelectedId] = useState<string | null>(() => layout.elements[0]?.id ?? null);
  const [message, setMessage] = useState<string | null>(null);
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [isWidePreviewOpen, setIsWidePreviewOpen] = useState(false);
  const [pendingInsertPoint, setPendingInsertPoint] = useState<Point | null>(null);
  const dragState = useRef<DragState | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isMobileViewport = useIsMobileViewport();
  const selectedElement = layout.elements.find((element) => element.id === selectedId) ?? layout.elements[0] ?? null;

  useEffect(() => {
    if (!isMobileViewport) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isMobileViewport]);

  useEffect(() => {
    const nextLayout = initialLayout ? cloneLayout(initialLayout) : createStarterMapLayout();
    setLayout(nextLayout);
    setSelectedId(nextLayout.elements[0]?.id ?? null);
  }, [initialLayout]);

  function addElement(type: GardenMapElementType) {
    const element = createPlacedElement(type, pendingInsertPoint);
    setLayout((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
    setPendingInsertPoint(null);
    setIsInsertMenuOpen(false);
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

  function moveElement(elementId: string, original: GardenMapElement, startPoint: Point, nextPoint: Point) {
    const delta = {
      x: nextPoint.x - startPoint.x,
      y: nextPoint.y - startPoint.y,
    };
    setLayout((current) => updateMapElement(current, moveMapElementByDelta(original, delta)));
    setSelectedId(elementId);
  }

  function moveDrag(event: MouseEvent<SVGElement> | PointerEvent<SVGElement>) {
    const currentDrag = dragState.current;
    if (!currentDrag) return;

    const nextPoint = pointFromPointer(event);
    if (currentDrag.type === "point") {
      movePoint(currentDrag.elementId, currentDrag.pointIndex, nextPoint);
      return;
    }

    moveElement(currentDrag.elementId, currentDrag.original, currentDrag.startPoint, nextPoint);
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

  function handlePreviewClick(event: MouseEvent<SVGSVGElement>) {
    if (event.target !== event.currentTarget) {
      return;
    }

    setSelectedId(null);
  }

  function handlePreviewDoubleClick(event: MouseEvent<SVGSVGElement>) {
    if (!isMobileViewport) {
      return;
    }

    event.preventDefault();
    setPendingInsertPoint(pointFromPointer(event));
    setIsInsertMenuOpen(true);
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

  function saveCurrentLayout() {
    onSaveMapImage?.(saveLayoutAsMapImage(layout));
    setMessage("Kartbild sparad.");
  }

  function renderElementControls(element: GardenMapElement) {
    return (
      <>
        {element.points.map((point, index) => {
          const next = element.points[(index + 1) % element.points.length];
          const midpoint = { x: (point.x + next.x) / 2, y: (point.y + next.y) / 2 };

          return (
            <line
              aria-label={`Lägg till punkt efter ${index + 1} för ${element.name}`}
              className="map-builder-edge-hit"
              key={`${element.id}-edge-${index}`}
              onDoubleClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                insertPoint(element.id, index, pointFromPointer(event, midpoint));
              }}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
                event.currentTarget.setPointerCapture?.(event.pointerId);
                setSelectedId(element.id);
                dragState.current = {
                  elementId: element.id,
                  original: element,
                  startPoint: pointFromPointer(event, midpoint),
                  type: "element",
                };
              }}
              onPointerMove={moveDrag}
              onPointerUp={() => {
                dragState.current = null;
              }}
              x1={point.x}
              x2={next.x}
              y1={point.y}
              y2={next.y}
            />
          );
        })}
        {element.points.map((point, index) => (
          <circle
            aria-label={`Punkt ${index + 1} för ${element.name}`}
            className="map-builder-vertex"
            cx={point.x}
            cy={point.y}
            key={`${element.id}-vertex-${index}`}
            onPointerDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
              event.currentTarget.setPointerCapture?.(event.pointerId);
              dragState.current = { elementId: element.id, pointIndex: index, type: "point" };
            }}
            onPointerMove={moveDrag}
            onPointerUp={() => {
              dragState.current = null;
            }}
            r="1.1"
          />
        ))}
      </>
    );
  }

  return (
    <section className={`map-builder content-panel${isMobileViewport && isWidePreviewOpen ? " map-builder-wide-mode" : ""}`}>
      <div className="list-header">
        <span className="eyebrow">Kartbyggare</span>
        <h2>Skapa kartbild i appen</h2>
      </div>
      <div className={`map-builder-layout${isMobileViewport && isWidePreviewOpen ? " map-builder-layout-wide" : ""}`}>
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
          <div className="inline-form">
            <button className="tool-button" onClick={saveCurrentLayout} type="button">
              Spara
            </button>
          </div>
          {message && <p className="helper-text">{message}</p>}
          <button className="tool-button primary" onClick={applyAsMapBackground} type="button">
            Använd som kartbild
          </button>
        </div>
        <div className={`map-builder-preview${isMobileViewport && isWidePreviewOpen ? " map-builder-preview-wide" : ""}`}>
          <svg
            aria-label="Redigerbar kartbild"
            className="map-builder-svg"
            onClick={handlePreviewClick}
            onDoubleClick={handlePreviewDoubleClick}
            onPointerMove={moveDrag}
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
                    onPointerDown={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      event.currentTarget.setPointerCapture?.(event.pointerId);
                      setSelectedId(element.id);
                      dragState.current = {
                        elementId: element.id,
                        original: element,
                        startPoint: pointFromPointer(event),
                        type: "element",
                      };
                    }}
                    onPointerMove={moveDrag}
                    onPointerUp={() => {
                      dragState.current = null;
                    }}
                    points={polygonToSvgPoints(element.points)}
                  />
                  <text className="map-builder-label" x={center.x} y={center.y}>
                    {element.name}
                  </text>
                </g>
              );
            })}
            {selectedElement && <g className="map-builder-controls">{renderElementControls(selectedElement)}</g>}
          </svg>
          {isMobileViewport && (
            <button
              aria-label={isWidePreviewOpen ? "Stäng förstorad karta" : "Förstora karta"}
              className="map-builder-expand-button"
              onClick={() => setIsWidePreviewOpen((current) => !current)}
              title={isWidePreviewOpen ? "Stäng förstorad karta" : "Förstora karta"}
              type="button"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path
                  d={
                    isWidePreviewOpen
                      ? "M7 7h4V3M17 17h-4v4M17 7h4v4M7 17H3v-4"
                      : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
                  }
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
          )}
        </div>
      </div>
      {isMobileViewport && isInsertMenuOpen && (
        <div aria-label="Välj objekt att lägga till" aria-modal="true" className="map-builder-insert-backdrop" role="dialog">
          <div className="map-builder-insert-sheet">
            <div className="map-builder-insert-header">
              <strong>Välj objekt att lägga till</strong>
              <button
                className="tool-button"
                onClick={() => {
                  setPendingInsertPoint(null);
                  setIsInsertMenuOpen(false);
                }}
                type="button"
              >
                Stäng
              </button>
            </div>
            <div className="map-builder-actions map-builder-actions-mobile">
              {addableTypes.map((item) => (
                <button key={item.type} onClick={() => addElement(item.type)} type="button">
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
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

function useIsMobileViewport(): boolean {
  const query = "(max-width: 760px)";
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false,
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const update = () => setIsMobile(mediaQuery.matches);
    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, []);

  return isMobile;
}

function createPlacedElement(type: GardenMapElementType, point: Point | null): GardenMapElement {
  const element = createMapElement(type);
  if (!point) {
    return element;
  }

  const center = getMapElementCenter(element);
  return moveMapElementByDelta(element, {
    x: point.x - center.x,
    y: point.y - center.y,
  });
}
