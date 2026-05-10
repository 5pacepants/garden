import { useEffect, useRef, useState } from "react";
import { findZonesAtPoint, relativeToWorldPoint } from "../../domain/geometry";
import type {
  CareActionType,
  CareIntervalUnit,
  CareScheduleRule,
  GardenState,
  LightCondition,
  MoistureCondition,
  Plant,
  PlantStatus,
  PlantType,
} from "../../domain/models";
import { createId } from "../../domain/ids";
import type { PlantSuggestionService } from "../../ai/plantSuggestionService";
import type { PlantRecommendation } from "../../ai/plantSuggestionSchema";
import { resizePlantMapNode } from "../../domain/gardenEdits";
import { careActionLabel, lightConditionLabel, moistureConditionLabel, plantStatusLabel, plantTypeLabel, soilTraitLabel, tagLabel } from "../../domain/labels";

type PlantCardProps = {
  gardenState: GardenState;
  plant: Plant;
  suggestionService: PlantSuggestionService;
  onSave: (plant: Plant) => void;
};

type RecurrenceMode = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const plantStatuses: PlantStatus[] = ["existing", "planned", "wishlist", "removed"];
const plantTypes: PlantType[] = ["perennial", "shrub", "tree", "vegetable", "herb", "bulb", "grass", "other"];
const careActionTypes: CareActionType[] = ["water", "prune", "fertilize", "plant", "move", "divide", "harvest", "weed", "inspect", "custom"];
const lightOptions: LightCondition[] = ["sun", "half_sun", "part_shade", "shade"];
const moistureOptions: MoistureCondition[] = ["dry", "normal", "moist"];
const tagOptions = ["edible", "pollinator-friendly", "evergreen", "fragrant"];
const months = ["Januari", "Februari", "Mars", "April", "Maj", "Juni", "Juli", "Augusti", "September", "Oktober", "November", "December"];
const shortMonths = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

export function PlantCard({ gardenState, plant, suggestionService, onSave }: PlantCardProps) {
  const [draft, setDraft] = useState(plant);
  const draftRef = useRef(plant);
  const [isEditing, setIsEditing] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [recurrenceMode, setRecurrenceMode] = useState<RecurrenceMode>("weekly");
  const [nameSuggestions, setNameSuggestions] = useState<string[]>([]);
  const [recommendations, setRecommendations] = useState<PlantRecommendation[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  useEffect(() => {
    draftRef.current = plant;
    setDraft(plant);
    setIsEditing(false);
  }, [plant]);

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  function updateDraft(updater: (current: Plant) => Plant) {
    setDraft((current) => {
      const next = updater(current);
      draftRef.current = next;
      return next;
    });
  }

  useEffect(() => {
    if (!isEditing || !suggestionService.suggestPlantNames || draft.swedishName.trim().length < 2) {
      setNameSuggestions([]);
      return;
    }

    const timeoutId = window.setTimeout(() => {
      suggestionService
        .suggestPlantNames?.({ query: draft.swedishName })
        .then(setNameSuggestions)
        .catch(() => setNameSuggestions([]));
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [draft.swedishName, isEditing, suggestionService]);

  async function applyAiSuggestion() {
    try {
      setSuggestionError(null);
      await applyAiSuggestionForName(draft.swedishName);
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : "Kunde inte hämta växtförslag.");
    }
  }

  async function applyAiSuggestionForName(name: string) {
    const suggestion = await suggestionService.suggestPlant({ name });
    setDraft((current) => ({
      ...current,
      swedishName: suggestion.swedishName,
      latinName: suggestion.latinName,
      type: suggestion.type,
      needs: suggestion.needs,
      floweringMonths: suggestion.floweringMonths,
      harvestMonths: suggestion.harvestMonths,
      size: {
        heightCm: suggestion.heightCm,
        widthCm: suggestion.widthCm,
      },
      tags: suggestion.tags,
      plantInfo: suggestion.plantInfo,
      careSchedule: suggestion.careSchedule.map((rule) => ({
        ...rule,
        id: createId("care"),
        plantId: plant.id,
      })),
    }));
    setNameSuggestions([]);
  }

  async function loadRecommendations() {
    if (!suggestionService.recommendPlants) {
      return;
    }

    try {
      setSuggestionError(null);
      setIsRecommending(true);
      setRecommendations(await suggestionService.recommendPlants({ context: createPlacementContext(draft, gardenState) }));
    } catch (error) {
      setSuggestionError(error instanceof Error ? error.message : "Kunde inte hämta växtrekommendationer.");
    } finally {
      setIsRecommending(false);
    }
  }

  function addCareScheduleRow(formData: FormData) {
    const actionType = String(formData.get("actionType")) as CareActionType;
    const instructions = String(formData.get("instructions") ?? "").trim();
    if (!instructions) return;

    const monthsForRule = formData.getAll("careMonths").map((value) => Number(value));
    const customUnit = String(formData.get("customUnit") ?? "week") as CareIntervalUnit;
    const customInterval = Math.max(1, Math.round(Number(formData.get("customInterval") ?? 1)));
    const timing = createRecurringTiming(recurrenceMode, monthsForRule, customUnit, customInterval);

    updateDraft((current) => ({
      ...current,
      careSchedule: [
        ...current.careSchedule,
        {
          id: createId("care"),
          plantId: current.id,
          actionType,
          timing,
          instructions,
          priority: "normal",
          taskMode: "automatic",
          source: "manual",
        },
      ],
    }));
  }

  function toggleFloweringMonth(month: number) {
    setDraft((current) => ({
      ...current,
      floweringMonths: toggleNumber(current.floweringMonths ?? [], month).sort((a, b) => a - b),
    }));
  }

  function toggleHarvestMonth(month: number) {
    setDraft((current) => ({
      ...current,
      harvestMonths: toggleNumber(current.harvestMonths ?? [], month).sort((a, b) => a - b),
    }));
  }

  function toggleTag(tag: string) {
    setDraft((current) => {
      const tags = toggleString(current.tags, tag);
      return {
        ...current,
        tags,
        harvestMonths: tag === "edible" && !tags.includes("edible") ? [] : current.harvestMonths,
      };
    });
  }

  function toggleLight(light: LightCondition) {
    setDraft((current) => ({
      ...current,
      needs: {
        ...current.needs,
        light: toggleString(current.needs.light ?? [], light) as LightCondition[],
      },
    }));
  }

  function toggleMoisture(moisture: MoistureCondition) {
    setDraft((current) => ({
      ...current,
      needs: {
        ...current.needs,
        moisture: toggleString(current.needs.moisture ?? [], moisture) as MoistureCondition[],
      },
    }));
  }

  function saveDraft() {
    onSave(draftRef.current);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div className="plant-summary">
        <div className="plant-summary-header">
          <div>
            <h3>{plant.swedishName}</h3>
            <p>{[plant.latinName, plantTypeLabel(plant.type), plantStatusLabel(plant.status)].filter(Boolean).join(" · ")}</p>
          </div>
          <button onClick={() => setIsEditing(true)} type="button">Redigera</button>
        </div>

        <div className="plant-chip-grid" aria-label="Växtöversikt">
          <PlantInfoChip label="Typ" value={plantTypeLabel(plant.type)} />
          <PlantInfoChip label="Ljus" value={formatList(plant.needs.light?.map(lightConditionLabel))} />
          <PlantInfoChip label="Växtens fukt" value={formatList(plant.needs.moisture?.map(moistureConditionLabel))} />
          <PlantInfoChip label="Jordkrav" value={formatList(plant.needs.soilTraits?.map(soilTraitLabel))} />
          <PlantInfoChip label="Blomning" value={formatMonthList(plant.floweringMonths)} />
          {plant.tags.includes("edible") && <PlantInfoChip label="Ätmognad" value={formatMonthList(plant.harvestMonths)} />}
          <PlantInfoChip label="Taggar" value={formatList(plant.tags.map(tagLabel))} />
        </div>

        {plant.plantInfo && (
          <div className="detail-section compact">
            <h3>Växtinformation</h3>
            <p>{plant.plantInfo}</p>
          </div>
        )}

        {plant.notes && (
          <div className="detail-section compact">
            <h3>Anteckningar</h3>
            <p>{plant.notes}</p>
          </div>
        )}

        <div className="detail-section compact">
          <h3>Skötselschema</h3>
          {plant.careSchedule.length === 0 ? (
            <p className="helper-text">Inga skötselråd ännu.</p>
          ) : (
            <div className="care-schedule-list">
              {plant.careSchedule.map((rule) => (
                <div className="care-schedule-card" key={rule.id}>
                  <strong>{careActionLabel(rule.actionType)}</strong>
                  <span>{describeTiming(rule)}</span>
                  <p>{rule.instructions}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="editor-form">
      <button onClick={applyAiSuggestion} type="button">Föreslå växtdata</button>
      {suggestionError && <p className="form-error">{suggestionError}</p>}
      <label>
        Svenskt namn
        <input value={draft.swedishName} onChange={(event) => setDraft({ ...draft, swedishName: event.target.value })} />
      </label>
      {nameSuggestions.length > 0 && (
        <div className="ai-suggestion-list" aria-label="Växtnamnsförslag">
          {nameSuggestions.map((name) => (
            <button
              key={name}
              onClick={() => {
                setDraft((current) => ({ ...current, swedishName: name }));
                void applyAiSuggestionForName(name);
              }}
              type="button"
            >
              {name}
            </button>
          ))}
        </div>
      )}
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

      <FieldSet title="Blomningstid">
        <div className="checkbox-grid month-checkbox-grid">
          {months.map((month, index) => (
            <label className="checkbox-option" key={month}>
              <input
                checked={draft.floweringMonths?.includes(index + 1) ?? false}
                onChange={() => toggleFloweringMonth(index + 1)}
                type="checkbox"
              />
              Blommar i {month.toLowerCase()}
            </label>
          ))}
        </div>
      </FieldSet>

      <FieldSet title="Ljusläge">
        <div className="checkbox-grid">
          {lightOptions.map((light) => (
            <label className="checkbox-option" key={light}>
              <input checked={draft.needs.light?.includes(light) ?? false} onChange={() => toggleLight(light)} type="checkbox" />
              {lightConditionLabel(light)}
            </label>
          ))}
        </div>
      </FieldSet>

      <FieldSet title="Växtens önskade fuktläge">
        <div className="checkbox-grid">
          {moistureOptions.map((moisture) => (
            <label className="checkbox-option" key={moisture}>
              <input checked={draft.needs.moisture?.includes(moisture) ?? false} onChange={() => toggleMoisture(moisture)} type="checkbox" />
              {moistureConditionLabel(moisture)}
            </label>
          ))}
        </div>
      </FieldSet>

      <FieldSet title="Taggar">
        <div className="checkbox-grid">
          {tagOptions.map((tag) => (
            <label className="checkbox-option" key={tag}>
              <input checked={draft.tags.includes(tag)} onChange={() => toggleTag(tag)} type="checkbox" />
              {tagLabel(tag)}
            </label>
          ))}
        </div>
      </FieldSet>

      {draft.tags.includes("edible") && (
        <FieldSet title="Ätmognad">
          <div className="checkbox-grid month-checkbox-grid">
            {months.map((month, index) => (
              <label className="checkbox-option" key={month}>
                <input
                  checked={draft.harvestMonths?.includes(index + 1) ?? false}
                  onChange={() => toggleHarvestMonth(index + 1)}
                  type="checkbox"
                />
                Ätmogen i {month.toLowerCase()}
              </label>
            ))}
          </div>
        </FieldSet>
      )}

      <label>
        Växtinformation
        <textarea value={draft.plantInfo ?? ""} onChange={(event) => setDraft({ ...draft, plantInfo: event.target.value })} />
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

      <div className="detail-section compact">
        <h3>AI-förslag för platsen</h3>
        <p className="helper-text">{createPlacementContext(draft, gardenState)}</p>
        <button onClick={loadRecommendations} type="button">{isRecommending ? "Hämtar..." : "Rekommendera växt att köpa"}</button>
        {recommendations.length > 0 && (
          <div className="care-schedule-list">
            {recommendations.map((recommendation) => (
              <div className="care-schedule-card" key={`${recommendation.swedishName}-${recommendation.latinName ?? ""}`}>
                <strong>{recommendation.swedishName}</strong>
                <span>{[recommendation.latinName, plantTypeLabel(recommendation.type)].filter(Boolean).join(" · ")}</span>
                <p>{recommendation.reason}</p>
                <button
                  onClick={() => {
                    setDraft((current) => ({ ...current, swedishName: recommendation.swedishName }));
                    void applyAiSuggestionForName(recommendation.swedishName);
                  }}
                  type="button"
                >
                  Använd och fyll i
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="detail-section compact">
        <h3>Skötselschema</h3>
        <div className="care-schedule-list">
          {draft.careSchedule.map((rule) => (
            <div className="care-schedule-row" key={rule.id}>
              <div>
                <strong>{careActionLabel(rule.actionType)}</strong>
                <p className="helper-text">{describeTiming(rule)} · {rule.instructions}</p>
              </div>
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
            setRecurrenceMode("weekly");
          }}
        >
          <label>
            Åtgärd
            <select name="actionType" defaultValue="water">
              {careActionTypes.map((type) => (
                <option key={type} value={type}>{careActionLabel(type)}</option>
              ))}
            </select>
          </label>
          <label>
            Upprepning
            <select value={recurrenceMode} onChange={(event) => setRecurrenceMode(event.target.value as RecurrenceMode)}>
              <option value="daily">Varje dag</option>
              <option value="weekly">Varje vecka</option>
              <option value="monthly">Varje månad</option>
              <option value="yearly">Varje år</option>
              <option value="custom">Anpassad</option>
            </select>
          </label>
          {recurrenceMode === "custom" && (
            <div className="interval-row">
              <label>
                Intervall
                <input min="1" name="customInterval" type="number" defaultValue="1" />
              </label>
              <label>
                Enhet
                <select name="customUnit" defaultValue="week">
                  <option value="day">dag</option>
                  <option value="week">vecka</option>
                  <option value="month">månad</option>
                  <option value="year">år</option>
                </select>
              </label>
            </div>
          )}
          <FieldSet title="Månader">
            <div className="checkbox-grid">
              {months.map((month, index) => (
                <label className="checkbox-option" key={month}>
                  <input name="careMonths" type="checkbox" value={index + 1} />
                  {month}
                </label>
              ))}
            </div>
          </FieldSet>
          <label>
            Skötselråd
            <input name="instructions" placeholder="Ex. Beskär i maj" />
          </label>
          <button type="submit">Lägg till skötselråd</button>
        </form>
      </div>

      <div className="editor-actions">
        <button onClick={saveDraft} type="button">Spara</button>
        <button
          className="secondary"
          onClick={() => {
            setDraft(plant);
            setIsEditing(false);
          }}
          type="button"
        >
          Avbryt
        </button>
      </div>
    </div>
  );
}

function FieldSet({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="editor-fieldset">
      <legend>{title}</legend>
      {children}
    </fieldset>
  );
}

function PlantInfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="plant-info-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function createRecurringTiming(mode: RecurrenceMode, monthsForRule: number[], customUnit: CareIntervalUnit, customInterval: number): CareScheduleRule["timing"] {
  if (mode === "daily") {
    return { type: "recurring", unit: "day", interval: 1, months: monthsForRule };
  }

  if (mode === "monthly") {
    return { type: "recurring", unit: "month", interval: 1, months: monthsForRule };
  }

  if (mode === "yearly") {
    return { type: "recurring", unit: "year", interval: 1, months: monthsForRule };
  }

  if (mode === "custom") {
    return { type: "recurring", unit: customUnit, interval: customInterval, months: monthsForRule };
  }

  return { type: "recurring", unit: "week", interval: 1, months: monthsForRule };
}

function describeTiming(rule: CareScheduleRule): string {
  if (rule.timing.type === "recurring") {
    const interval = rule.timing.interval > 1 ? `Var ${rule.timing.interval}:e ${unitLabel(rule.timing.unit)}` : everyUnitLabel(rule.timing.unit);
    return `${interval}${rule.timing.months.length > 0 ? ` i ${formatMonthList(rule.timing.months)}` : ""}`;
  }

  if (rule.timing.type === "month") {
    return `I ${months[rule.timing.month - 1].toLowerCase()}`;
  }

  if (rule.timing.type === "weekly") {
    return `Var ${rule.timing.intervalWeeks}:e vecka ${formatMonthRange(rule.timing.startMonth, rule.timing.endMonth)}`;
  }

  if (rule.timing.type === "date") {
    return `${rule.timing.day} ${months[rule.timing.month - 1].toLowerCase()}`;
  }

  if (rule.timing.type === "range") {
    return formatMonthRange(rule.timing.startMonth, rule.timing.endMonth);
  }

  return rule.timing.label;
}

function unitLabel(unit: CareIntervalUnit): string {
  const labels: Record<CareIntervalUnit, string> = {
    day: "dag",
    week: "vecka",
    month: "månad",
    year: "år",
  };
  return labels[unit];
}

function everyUnitLabel(unit: CareIntervalUnit): string {
  const labels: Record<CareIntervalUnit, string> = {
    day: "Varje dag",
    week: "Varje vecka",
    month: "Varje månad",
    year: "Varje år",
  };
  return labels[unit];
}

function formatMonthList(monthNumbers: number[] | undefined): string {
  if (!monthNumbers || monthNumbers.length === 0) {
    return "Ej angivet";
  }

  return monthNumbers.map((month) => shortMonths[month - 1]).join(", ");
}

function formatMonthRange(startMonth: number, endMonth: number): string {
  return `${shortMonths[startMonth - 1]}-${shortMonths[endMonth - 1]}`;
}

function formatList(values: string[] | undefined): string {
  return values && values.length > 0 ? values.join(", ") : "Ej angivet";
}

function toggleNumber(values: number[], value: number): number[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function toggleString<T extends string>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function createPlacementContext(plant: Plant, gardenState: GardenState): string {
  const point = getPlantWorldPosition(plant, gardenState);
  const zones = findZonesAtPoint(point, gardenState.zones);
  const bed = findPlacementBed(plant, gardenState);

  const zoneDescriptions = zones.length
    ? zones
        .map((zone) =>
          [
            zone.name,
            zone.light ? `ljus: ${lightConditionLabel(zone.light)}` : undefined,
            zone.moisture ? `fukt: ${moistureConditionLabel(zone.moisture)}` : undefined,
            zone.soilTraits?.length ? `jord: ${zone.soilTraits.map(soilTraitLabel).join(", ")}` : undefined,
          ]
            .filter(Boolean)
            .join(", "),
        )
        .join("; ")
    : "Ingen zon markerar platsen ännu.";

  return [
    `Position: x ${point.x.toFixed(1)}, y ${point.y.toFixed(1)}.`,
    bed ? `Rabatt: ${bed.name}${bed.soilTraits?.length ? `, jord: ${bed.soilTraits.map(soilTraitLabel).join(", ")}` : ""}.` : "Inte placerad i rabatt.",
    `Zoner: ${zoneDescriptions}`,
  ].join(" ");
}

function getPlantWorldPosition(plant: Plant, gardenState: GardenState) {
  if (plant.placement.type === "map") {
    return plant.placement.position;
  }

  const placement = plant.placement;
  return relativeToWorldPoint(
    placement.relativePosition,
    gardenState.beds.find((bed) => bed.id === placement.bedId)?.polygon ?? [],
  );
}

function findPlacementBed(plant: Plant, gardenState: GardenState) {
  const placement = plant.placement;
  if (placement.type !== "bed") {
    return undefined;
  }

  return gardenState.beds.find((item) => item.id === placement.bedId);
}
