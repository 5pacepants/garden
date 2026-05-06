import type { GardenState } from "../domain/models";
import type { MapSelection } from "../features/map/mapSelection";

type DetailPanelProps = {
  gardenState: GardenState | null;
  selection: MapSelection;
};

export function DetailPanel({ gardenState, selection }: DetailPanelProps) {
  const selectedObject = getSelectedObject(gardenState, selection);

  return (
    <aside className="detail-panel" aria-label="Detaljer">
      <span className="eyebrow">Valt objekt</span>
      <h2>{selectedObject.title}</h2>
      <p>{selectedObject.description}</p>
      <div className="detail-section">
        <h3>Kommande innehåll</h3>
        <ul>
          <li>Växtkort</li>
          <li>Skötselschema</li>
          <li>Historik</li>
          <li>Platsmatchning</li>
        </ul>
      </div>
    </aside>
  );
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
