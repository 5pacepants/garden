import type { GardenState } from "../domain/models";
import { BedEditor } from "../features/beds/BedEditor";
import type { MapSelection } from "../features/map/mapSelection";
import { PlantCard } from "../features/plants/PlantCard";
import { PlaceMatchPanel } from "../features/zones/PlaceMatchPanel";
import { ZoneEditor } from "../features/zones/ZoneEditor";

type DetailPanelProps = {
  gardenState: GardenState | null;
  selection: MapSelection;
  onUpdatePlant: (plant: GardenState["plants"][number]) => void;
  onUpdateBed: (bed: GardenState["beds"][number]) => void;
  onUpdateZone: (zone: GardenState["zones"][number]) => void;
};

export function DetailPanel({ gardenState, selection, onUpdateBed, onUpdatePlant, onUpdateZone }: DetailPanelProps) {
  const selectedObject = getSelectedObject(gardenState, selection);
  const editor = getEditor(gardenState, selection, onUpdatePlant, onUpdateBed, onUpdateZone);

  return (
    <aside className="detail-panel" aria-label="Detaljer">
      <span className="eyebrow">Valt objekt</span>
      <h2>{selectedObject.title}</h2>
      <p>{selectedObject.description}</p>
      {gardenState && <PlaceMatchPanel gardenState={gardenState} selection={selection} />}
      {editor}
      {!editor && <div className="detail-section">
        <h3>Kommande innehåll</h3>
        <ul>
          <li>Växtkort</li>
          <li>Skötselschema</li>
          <li>Historik</li>
          <li>Platsmatchning</li>
        </ul>
      </div>}
    </aside>
  );
}

function getEditor(
  gardenState: GardenState | null,
  selection: MapSelection,
  onUpdatePlant: (plant: GardenState["plants"][number]) => void,
  onUpdateBed: (bed: GardenState["beds"][number]) => void,
  onUpdateZone: (zone: GardenState["zones"][number]) => void,
) {
  if (!gardenState || !selection) {
    return null;
  }

  if (selection.type === "plant") {
    const plant = gardenState.plants.find((item) => item.id === selection.id);
    return plant ? <PlantCard plant={plant} onChange={onUpdatePlant} /> : null;
  }

  if (selection.type === "bed") {
    const bed = gardenState.beds.find((item) => item.id === selection.id);
    return bed ? <BedEditor bed={bed} onChange={onUpdateBed} /> : null;
  }

  const zone = gardenState.zones.find((item) => item.id === selection.id);
  return zone ? <ZoneEditor zone={zone} onChange={onUpdateZone} /> : null;
}

function getSelectedObject(gardenState: GardenState | null, selection: MapSelection): { title: string; description: string } {
  if (!gardenState || !selection) {
    return {
      title: "Ingen växt vald",
      description: "Välj en växt, rabatt eller zon på kartan för att se och redigera information.",
    };
  }

  if (selection.type === "plant") {
    const plant = gardenState.plants.find((item) => item.id === selection.id);
    return {
      title: plant?.swedishName ?? "Okänd växt",
      description: plant?.latinName ?? "Växtkort öppnas här i nästa steg.",
    };
  }

  if (selection.type === "bed") {
    const bed = gardenState.beds.find((item) => item.id === selection.id);
    return {
      title: bed?.name ?? "Okänd rabatt",
      description: "Rabattens form, växter och historik visas här.",
    };
  }

  const zone = gardenState.zones.find((item) => item.id === selection.id);
  return {
    title: zone?.name ?? "Okänd zon",
    description: "Zonens sol, fukt och jorddata visas här.",
  };
}
