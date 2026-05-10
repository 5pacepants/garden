import type { GardenState } from "../domain/models";
import { BedEditor } from "../features/beds/BedEditor";
import type { MapSelection } from "../features/map/mapSelection";
import { PlantCard } from "../features/plants/PlantCard";
import { PlaceMatchPanel } from "../features/zones/PlaceMatchPanel";
import { ZoneEditor } from "../features/zones/ZoneEditor";
import type { PlantSuggestionService } from "../ai/plantSuggestionService";

type DetailPanelProps = {
  gardenState: GardenState | null;
  selection: MapSelection;
  onSavePlant: (plant: GardenState["plants"][number]) => void;
  onSaveBed: (bed: GardenState["beds"][number]) => void;
  onSaveZone: (zone: GardenState["zones"][number]) => void;
  onDeleteSelection: (selection: NonNullable<MapSelection>) => void;
  suggestionService: PlantSuggestionService;
};

export function DetailPanel({ gardenState, selection, onDeleteSelection, onSaveBed, onSavePlant, onSaveZone, suggestionService }: DetailPanelProps) {
  const selectedObject = getSelectedObject(gardenState, selection);
  const editor = getEditor(gardenState, selection, onSavePlant, onSaveBed, onSaveZone, suggestionService);

  return (
    <aside className="detail-panel" aria-label="Detaljer">
      <span className="eyebrow">Valt objekt</span>
      <h2>{selectedObject.title}</h2>
      <p>{selectedObject.description}</p>
      {selection && (
        <button
          className="delete-object-button"
          onClick={() => {
            if (window.confirm(`Ta bort ${selectedObject.title}?`)) {
              onDeleteSelection(selection);
            }
          }}
          type="button"
        >
          Ta bort
        </button>
      )}
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
  onSavePlant: (plant: GardenState["plants"][number]) => void,
  onSaveBed: (bed: GardenState["beds"][number]) => void,
  onSaveZone: (zone: GardenState["zones"][number]) => void,
  suggestionService: PlantSuggestionService,
) {
  if (!gardenState || !selection) {
    return null;
  }

  if (selection.type === "plant") {
    const plant = gardenState.plants.find((item) => item.id === selection.id);
    return plant ? <PlantCard gardenState={gardenState} plant={plant} suggestionService={suggestionService} onSave={onSavePlant} /> : null;
  }

  if (selection.type === "bed") {
    const bed = gardenState.beds.find((item) => item.id === selection.id);
    return bed ? <BedEditor bed={bed} onSave={onSaveBed} /> : null;
  }

  const zone = gardenState.zones.find((item) => item.id === selection.id);
  return zone ? <ZoneEditor zone={zone} onSave={onSaveZone} /> : null;
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
