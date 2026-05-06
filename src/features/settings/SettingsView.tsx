import { useState } from "react";
import { createDemoGardenState } from "../../domain/fixtures";
import type { GardenState } from "../../domain/models";
import { exportGardenState, importGardenState } from "../../data/importExport";

export type AiSettings = {
  enabled: boolean;
  apiKey: string;
  model: string;
};

type SettingsViewProps = {
  aiSettings: AiSettings;
  gardenState: GardenState;
  onAiSettingsChange: (settings: AiSettings) => void;
  onImportGardenState: (state: GardenState) => void;
};

export function SettingsView({ aiSettings, gardenState, onAiSettingsChange, onImportGardenState }: SettingsViewProps) {
  const [backupText, setBackupText] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  function exportBackup() {
    setBackupText(exportGardenState(gardenState));
    setMessage("Backup exporterad till textfältet.");
  }

  function importBackup() {
    try {
      onImportGardenState(importGardenState(backupText));
      setMessage("Backup importerad.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunde inte importera backup.");
    }
  }

  return (
    <section className="content-panel">
      <div className="list-header">
        <span className="eyebrow">Inställningar</span>
        <h2>AI och appdata</h2>
      </div>
      <form className="editor-form">
        <label className="checkbox-filter">
          <input
            checked={aiSettings.enabled}
            onChange={(event) => onAiSettingsChange({ ...aiSettings, enabled: event.target.checked })}
            type="checkbox"
          />
          Aktivera OpenAI-förslag
        </label>
        <label>
          OpenAI API-nyckel
          <input
            autoComplete="off"
            type="password"
            value={aiSettings.apiKey}
            onChange={(event) => onAiSettingsChange({ ...aiSettings, apiKey: event.target.value })}
            placeholder="sk-..."
          />
        </label>
        <label>
          Modell
          <input value={aiSettings.model} onChange={(event) => onAiSettingsChange({ ...aiSettings, model: event.target.value })} />
        </label>
        <p className="helper-text">
          AI är valfritt och avstängt tills du aktiverar det. API-anrop kan kosta pengar via ditt OpenAI API-konto.
        </p>
      </form>
      <div className="editor-form">
        <h3>Backup</h3>
        <div className="inline-form">
          <button onClick={exportBackup} type="button">Exportera JSON</button>
          <button onClick={importBackup} type="button">Importera JSON</button>
          <button
            onClick={() => {
              onImportGardenState(createDemoGardenState());
              setMessage("Demo-data återställd.");
            }}
            type="button"
          >
            Återställ demo
          </button>
        </div>
        <textarea
          className="backup-textarea"
          onChange={(event) => setBackupText(event.target.value)}
          placeholder="Exporterad eller importerad JSON visas här"
          value={backupText}
        />
        {message && <p className="helper-text">{message}</p>}
      </div>
    </section>
  );
}
