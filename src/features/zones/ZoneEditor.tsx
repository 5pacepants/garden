import { useEffect, useState } from "react";
import type { LightCondition, MoistureCondition, Zone } from "../../domain/models";
import { lightConditionLabel, moistureConditionLabel } from "../../domain/labels";

type ZoneEditorProps = {
  zone: Zone;
  onSave: (zone: Zone) => void;
};

const lightOptions: Array<LightCondition | ""> = ["", "sun", "half_sun", "part_shade", "shade"];
const moistureOptions: Array<MoistureCondition | ""> = ["", "dry", "normal", "moist"];

export function ZoneEditor({ zone, onSave }: ZoneEditorProps) {
  const [draft, setDraft] = useState(zone);

  useEffect(() => {
    setDraft(zone);
  }, [zone]);

  return (
    <form className="editor-form">
      <label>
        Namn
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <label>
        Ljus
        <select
          value={draft.light ?? ""}
          onChange={(event) => setDraft({ ...draft, light: emptyToUndefined(event.target.value) as LightCondition | undefined })}
        >
          {lightOptions.map((value) => (
            <option key={value || "none"} value={value}>
              {value ? lightConditionLabel(value) : "Okänt"}
            </option>
          ))}
        </select>
      </label>
      <label>
        Fukt
        <select
          value={draft.moisture ?? ""}
          onChange={(event) =>
            setDraft({ ...draft, moisture: emptyToUndefined(event.target.value) as MoistureCondition | undefined })
          }
        >
          {moistureOptions.map((value) => (
            <option key={value || "none"} value={value}>
              {value ? moistureConditionLabel(value) : "Okänt"}
            </option>
          ))}
        </select>
      </label>
      <div className="editor-actions">
        <button onClick={() => onSave(draft)} type="button">Spara</button>
        <button className="secondary" onClick={() => setDraft(zone)} type="button">Avbryt</button>
      </div>
      <p className="helper-text">{zone.polygon.length} punkter i polygonen.</p>
    </form>
  );
}

function emptyToUndefined(value: string): string | undefined {
  return value === "" ? undefined : value;
}

