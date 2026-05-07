import { useEffect, useState } from "react";
import type { Plant, PlantStatus, PlantType } from "../../domain/models";
import { createId } from "../../domain/ids";
import type { PlantSuggestionService } from "../../ai/plantSuggestionService";
import { careActionLabel, plantStatusLabel, plantTypeLabel } from "../../domain/labels";

type PlantCardProps = {
  plant: Plant;
  suggestionService: PlantSuggestionService;
  onSave: (plant: Plant) => void;
};

const plantStatuses: PlantStatus[] = ["existing", "planned", "wishlist", "removed"];
const plantTypes: PlantType[] = ["perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"];

export function PlantCard({ plant, suggestionService, onSave }: PlantCardProps) {
  const [draft, setDraft] = useState(plant);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(plant);
  }, [plant]);

  async function applyAiSuggestion() {
    try {
      setSuggestionError(null);
      const suggestion = await suggestionService.suggestPlant({ name: draft.swedishName });
      setDraft((current) => ({
        ...current,
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
      }));
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : "Kunde inte hämta växtförslag.");
    }
  }

  return (
    <form className="editor-form">
      <button onClick={applyAiSuggestion} type="button">Föreslå växtdata</button>
      {suggestionError && <p className="form-error">{suggestionError}</p>}
      <label>
        Svenskt namn
        <input value={draft.swedishName} onChange={(event) => setDraft({ ...draft, swedishName: event.target.value })} />
      </label>
      <label>
        Latinskt namn
        <input value={draft.latinName ?? ""} onChange={(event) => setDraft({ ...draft, latinName: event.target.value })} />
      </label>
      <label>
        Status
        <select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as PlantStatus })}>
          {plantStatuses.map((status) => (
            <option key={status} value={status}>
              {plantStatusLabel(status)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Typ
        <select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as PlantType })}>
          {plantTypes.map((type) => (
            <option key={type} value={type}>
              {plantTypeLabel(type)}
            </option>
          ))}
        </select>
      </label>
      <label>
        Anteckningar
        <textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      </label>
      <div className="editor-actions">
        <button onClick={() => onSave(draft)} type="button">Spara</button>
        <button className="secondary" onClick={() => setDraft(plant)} type="button">Avbryt</button>
      </div>
      <div className="detail-section compact">
        <h3>Skötselschema</h3>
        {draft.careSchedule.map((rule) => (
          <p className="helper-text" key={rule.id}>{careActionLabel(rule.actionType)}: {rule.instructions}</p>
        ))}
      </div>
    </form>
  );
}
