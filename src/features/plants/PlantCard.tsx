import type { Plant, PlantStatus, PlantType } from "../../domain/models";
import { createId } from "../../domain/ids";
import { MockPlantSuggestionService } from "../../ai/plantSuggestionService";

type PlantCardProps = {
  plant: Plant;
  onChange: (plant: Plant) => void;
};

const plantStatuses: PlantStatus[] = ["existing", "planned", "wishlist", "removed"];
const plantTypes: PlantType[] = ["perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"];

export function PlantCard({ plant, onChange }: PlantCardProps) {
  async function applyAiSuggestion() {
    const suggestion = await new MockPlantSuggestionService().suggestPlant({ name: plant.swedishName });
    onChange({
      ...plant,
      swedishName: suggestion.swedishName,
      latinName: suggestion.latinName,
      type: suggestion.type,
      needs: suggestion.needs,
      floweringMonths: suggestion.floweringMonths,
      size: {
        heightCm: suggestion.heightCm,
        widthCm: suggestion.widthCm,
      },
      tags: suggestion.tags,
      notes: suggestion.notes,
      careSchedule: suggestion.careSchedule.map((rule) => ({
        ...rule,
        id: createId("care"),
        plantId: plant.id,
      })),
    });
  }

  return (
    <form className="editor-form">
      <button onClick={applyAiSuggestion} type="button">Föreslå växtdata</button>
      <label>
        Svenskt namn
        <input value={plant.swedishName} onChange={(event) => onChange({ ...plant, swedishName: event.target.value })} />
      </label>
      <label>
        Latinskt namn
        <input value={plant.latinName ?? ""} onChange={(event) => onChange({ ...plant, latinName: event.target.value })} />
      </label>
      <label>
        Status
        <select value={plant.status} onChange={(event) => onChange({ ...plant, status: event.target.value as PlantStatus })}>
          {plantStatuses.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label>
        Typ
        <select value={plant.type} onChange={(event) => onChange({ ...plant, type: event.target.value as PlantType })}>
          {plantTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label>
        Anteckningar
        <textarea value={plant.notes ?? ""} onChange={(event) => onChange({ ...plant, notes: event.target.value })} />
      </label>
      <div className="detail-section compact">
        <h3>Skötselschema</h3>
        {plant.careSchedule.map((rule) => (
          <p className="helper-text" key={rule.id}>{rule.actionType}: {rule.instructions}</p>
        ))}
      </div>
    </form>
  );
}
