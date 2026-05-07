import { useEffect, useState } from "react";
import type { CareActionType, Plant, PlantStatus, PlantType } from "../../domain/models";
import { createId } from "../../domain/ids";
import type { PlantSuggestionService } from "../../ai/plantSuggestionService";
import { resizePlantMapNode } from "../../domain/gardenEdits";
import { careActionLabel, plantStatusLabel, plantTypeLabel } from "../../domain/labels";

type PlantCardProps = {
  plant: Plant;
  suggestionService: PlantSuggestionService;
  onSave: (plant: Plant) => void;
};

const plantStatuses: PlantStatus[] = ["existing", "planned", "wishlist", "removed"];
const plantTypes: PlantType[] = ["perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"];
const careActionTypes: CareActionType[] = ["water", "prune", "fertilize", "plant", "move", "divide", "harvest", "weed", "inspect", "custom"];
const months = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];

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

  function addCareScheduleRow(formData: FormData) {
    const actionType = String(formData.get("actionType")) as CareActionType;
    const mode = String(formData.get("timingMode"));
    const instructions = String(formData.get("instructions") ?? "").trim();
    if (!instructions) return;

    setDraft((current) => ({
      ...current,
      careSchedule: [
        ...current.careSchedule,
        {
          id: createId("care"),
          plantId: current.id,
          actionType,
          timing:
            mode === "weekly"
              ? {
                  type: "weekly",
                  startMonth: 1,
                  endMonth: 12,
                  intervalWeeks: Math.max(1, Math.round(Number(formData.get("intervalDays") ?? 7) / 7)),
                }
              : {
                  type: "month",
                  month: Number(formData.get("month") ?? 5),
                },
          instructions,
          priority: "normal",
          taskMode: "automatic",
          source: "manual",
        },
      ],
    }));
  }

  return (
    <div className="editor-form">
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
      <div className="node-size-controls">
        <span>Nodstorlek</span>
        <button onClick={() => setDraft(resizePlantMapNode(draft, -1))} type="button">-</button>
        <strong>{(draft.mapRadius ?? 1.8).toFixed(1)}</strong>
        <button onClick={() => setDraft(resizePlantMapNode(draft, 1))} type="button">+</button>
      </div>
      <div className="editor-actions">
        <button onClick={() => onSave(draft)} type="button">Spara</button>
        <button className="secondary" onClick={() => setDraft(plant)} type="button">Avbryt</button>
      </div>
      <div className="detail-section compact">
        <h3>Skötselschema</h3>
        <div className="care-schedule-list">
          {draft.careSchedule.map((rule) => (
            <div className="care-schedule-row" key={rule.id}>
              <p className="helper-text">{careActionLabel(rule.actionType)}: {rule.instructions}</p>
              <button
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    careSchedule: current.careSchedule.filter((item) => item.id !== rule.id),
                  }))
                }
                type="button"
              >
                Ta bort
              </button>
            </div>
          ))}
        </div>
        <form
          className="care-schedule-form"
          onSubmit={(event) => {
            event.preventDefault();
            addCareScheduleRow(new FormData(event.currentTarget));
            event.currentTarget.reset();
          }}
        >
          <select name="actionType" defaultValue="water">
            {careActionTypes.map((type) => (
              <option key={type} value={type}>{careActionLabel(type)}</option>
            ))}
          </select>
          <select name="timingMode" defaultValue="month">
            <option value="month">I månad</option>
            <option value="weekly">Var 7:e dag</option>
          </select>
          <select name="month" defaultValue="5">
            {months.map((month, index) => (
              <option key={month} value={index + 1}>{month}</option>
            ))}
          </select>
          <input min="7" name="intervalDays" step="7" type="number" defaultValue="7" />
          <input name="instructions" placeholder="Ex. Beskär i maj" />
          <button type="submit">Lägg till skötselrad</button>
        </form>
      </div>
    </div>
  );
}
