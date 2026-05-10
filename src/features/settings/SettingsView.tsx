import { useState } from "react";
import { createDemoGardenState } from "../../domain/fixtures";
import type { GardenState } from "../../domain/models";
import { exportGardenState, importGardenState } from "../../data/importExport";
import { TauriMediaService, type MediaService } from "../../data/mediaService";

export type AiSettings = {
  enabled: boolean;
};

type SettingsViewProps = {
  aiSettings: AiSettings;
  gardenState: GardenState;
  mediaService?: MediaService;
  onAiSettingsChange: (settings: AiSettings) => void;
  onImportGardenState: (state: GardenState) => void;
};

const defaultMediaService = new TauriMediaService();

export function SettingsView({
  aiSettings,
  gardenState,
  mediaService = defaultMediaService,
  onAiSettingsChange,
  onImportGardenState,
}: SettingsViewProps) {
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

  async function updateMapBackground() {
    try {
      const media = await mediaService.pickAndStoreImage();
      if (!media) {
        setMessage("Ingen bild vald.");
        return;
      }

      onImportGardenState({
        ...gardenState,
        map: { ...gardenState.map, backgroundImage: media.reference },
      });
      setMessage("Kartbild uppdaterad.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Kunde inte uppdatera kartbild.");
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
            onChange={(event) => onAiSettingsChange({ enabled: event.target.checked })}
            type="checkbox"
          />
          Aktivera OpenAI-förslag
        </label>
        <p className="helper-text">
          AI använder OPENAI_API_KEY från .env.local. Nyckeln sparas inte i appen eller webbläsaren.
          API-anrop kan kosta pengar via ditt OpenAI API-konto.
        </p>
      </form>
      <div className="editor-form">
        <h3>Kartbild</h3>
        <p className="helper-text">Välj en egen bild över trädgården. Bilden kopieras till appens datamapp.</p>
        <div className="inline-form">
          <button onClick={updateMapBackground} type="button">Byt kartbild</button>
        </div>
        {gardenState.map.backgroundImage && <p className="helper-text">Nuvarande: {gardenState.map.backgroundImage}</p>}
      </div>
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
