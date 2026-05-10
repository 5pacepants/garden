import { useMemo, useState } from "react";
import type { GardenState } from "../../domain/models";
import {
  createMapElement,
  createStarterMapLayout,
  renderGardenMapLayoutDataUrl,
  renderGardenMapLayoutSvg,
  updateMapElement,
  type GardenMapElement,
  type GardenMapElementType,
} from "./mapBuilderModel";

type MapBuilderViewProps = {
  gardenState: GardenState;
  onApplyGardenState: (state: GardenState) => void;
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
  const selectedElement = layout.elements.find((element) => element.id === selectedId) ?? layout.elements[0] ?? null;
  const svg = useMemo(() => renderGardenMapLayoutSvg(layout), [layout]);

  function addElement(type: GardenMapElementType) {
    const element = createMapElement(type);
    setLayout((current) => ({ ...current, elements: [...current.elements, element] }));
    setSelectedId(element.id);
  }

  function saveElement(element: GardenMapElement) {
    setLayout((current) => updateMapElement(current, element));
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
        <div className="map-builder-preview" dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </section>
  );
}

function ElementEditor({ element, onChange }: { element: GardenMapElement; onChange: (element: GardenMapElement) => void }) {
  function updateField(field: keyof GardenMapElement, value: string) {
    onChange({
      ...element,
      [field]: ["x", "y", "width", "height"].includes(field) ? Number(value) : value,
    });
  }

  return (
    <div className="map-builder-editor">
      <label>
        Namn
        <input value={element.name} onChange={(event) => updateField("name", event.target.value)} />
      </label>
      <div className="interval-row">
        <label>
          X
          <input min="0" max="100" type="number" value={element.x} onChange={(event) => updateField("x", event.target.value)} />
        </label>
        <label>
          Y
          <input min="0" max="56.82" type="number" value={element.y} onChange={(event) => updateField("y", event.target.value)} />
        </label>
      </div>
      <div className="interval-row">
        <label>
          Bredd
          <input min="1" max="100" type="number" value={element.width} onChange={(event) => updateField("width", event.target.value)} />
        </label>
        <label>
          Höjd
          <input min="1" max="56.82" type="number" value={element.height} onChange={(event) => updateField("height", event.target.value)} />
        </label>
      </div>
      <label>
        Färg
        <input type="color" value={element.color} onChange={(event) => updateField("color", event.target.value)} />
      </label>
    </div>
  );
}
