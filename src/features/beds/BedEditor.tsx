import { useEffect, useState } from "react";
import type { Bed, SoilTrait } from "../../domain/models";
import { soilTraitLabel } from "../../domain/labels";

type BedEditorProps = {
  bed: Bed;
  onSave: (bed: Bed) => void;
};

const soilOptions: SoilTrait[] = ["clay", "sandy", "well_drained", "humus_rich"];

export function BedEditor({ bed, onSave }: BedEditorProps) {
  const [draft, setDraft] = useState(bed);

  useEffect(() => {
    setDraft(bed);
  }, [bed]);

  return (
    <form className="editor-form">
      <label>
        Namn
        <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
      </label>
      <label>
        Anteckningar
        <textarea value={draft.notes ?? ""} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
      </label>
      <fieldset className="editor-fieldset">
        <legend>Jorddata i rabatten</legend>
        <div className="checkbox-grid">
          {soilOptions.map((trait) => (
            <label className="checkbox-option" key={trait}>
              <input
                checked={draft.soilTraits?.includes(trait) ?? false}
                onChange={() => setDraft((current) => ({ ...current, soilTraits: toggleSoilTrait(current.soilTraits ?? [], trait) }))}
                type="checkbox"
              />
              {soilTraitLabel(trait)}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="editor-actions">
        <button onClick={() => onSave(draft)} type="button">Spara</button>
        <button className="secondary" onClick={() => setDraft(bed)} type="button">Avbryt</button>
      </div>
      <p className="helper-text">{bed.polygon.length} punkter i polygonen.</p>
    </form>
  );
}

function toggleSoilTrait(values: SoilTrait[], value: SoilTrait): SoilTrait[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}
