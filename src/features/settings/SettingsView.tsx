export type AiSettings = {
  enabled: boolean;
  apiKey: string;
  model: string;
};

type SettingsViewProps = {
  aiSettings: AiSettings;
  onAiSettingsChange: (settings: AiSettings) => void;
};

export function SettingsView({ aiSettings, onAiSettingsChange }: SettingsViewProps) {
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
    </section>
  );
}
