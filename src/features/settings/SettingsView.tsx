import { useEffect, useState } from "react";
import { createId } from "../../domain/ids";
import { createDemoGardenState } from "../../domain/fixtures";
import type { GardenState, SavedMapImage } from "../../domain/models";
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
  onEditMapImage?: (image: SavedMapImage) => void;
  onImportGardenState: (state: GardenState) => void;
};

const defaultMediaService = new TauriMediaService();

function mapImageSourceLabel(source: SavedMapImage["source"]): string {
  if (source === "builder") return "Skapad i kartbyggaren";
  if (source === "ai") return "AI-förbättrad";
  return "Uppladdad";
}

export function SettingsView({
  aiSettings,
  gardenState,
  mediaService = defaultMediaService,
  onAiSettingsChange,
  onEditMapImage,
  onImportGardenState,
}: SettingsViewProps) {
  const [backupText, setBackupText] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<SavedMapImage | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    let isActive = true;

    if (!previewImage) {
      setPreviewImageUrl(null);
      return;
    }

    mediaService
      .resolveMediaUrl(previewImage.image)
      .then((url) => {
        if (isActive) {
          setPreviewImageUrl(url);
        }
      })
      .catch(() => {
        if (isActive) {
          setPreviewImageUrl(previewImage.image);
        }
      });

    return () => {
      isActive = false;
    };
  }, [mediaService, previewImage]);

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

      const image: SavedMapImage = {
        id: createId("map_image"),
        name: media.fileName,
        image: media.reference,
        source: "uploaded",
        createdAt: new Date().toISOString(),
      };
      onImportGardenState({
        ...gardenState,
        map: { ...gardenState.map, backgroundImage: media.reference },
        mapImages: [...(gardenState.mapImages ?? []), image],
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
        <h2>Inställningar</h2>
      </div>
      <form className="editor-form">
        <label className="checkbox-filter">
          <input
            checked={aiSettings.enabled}
            onChange={(event) => onAiSettingsChange({ enabled: event.target.checked })}
            type="checkbox"
          />
          Smarta förslag
        </label>
        <p className="helper-text">
          Smarta förslag kan hjälpa till med växtinformation när funktionen är tillgänglig.
        </p>
      </form>
      {message && <p className="helper-text">{message}</p>}
      <div className="editor-form">
        <h3>Kartbild</h3>
        <p className="helper-text">Välj en egen bild över trädgården. Bilden kopieras till appens datamapp.</p>
        <div className="inline-form">
          <button onClick={updateMapBackground} type="button">Byt kartbild</button>
        </div>
        {gardenState.map.backgroundImage && <p className="helper-text">Nuvarande: {gardenState.map.backgroundImage}</p>}
      </div>
      <div className="editor-form">
        <h3>Mina kartbilder</h3>
        <div className="map-image-list">
          {(gardenState.mapImages ?? []).map((image) => (
            <div className="map-image-row" key={image.id}>
              <div>
                <strong>{image.name}</strong>
                <p className="helper-text">{mapImageSourceLabel(image.source)}</p>
              </div>
              <div className="inline-form">
                <button aria-label={`Visa ${image.name}`} onClick={() => setPreviewImage(image)} type="button">
                  Visa
                </button>
                <button
                  aria-label={`Använd ${image.name}`}
                  onClick={() => {
                    onImportGardenState({
                      ...gardenState,
                      map: { ...gardenState.map, backgroundImage: image.image },
                    });
                    setMessage("Kartbild uppdaterad.");
                  }}
                  type="button"
                >
                  Använd
                </button>
                {image.source === "builder" && Boolean(image.layout) && (
                  <button aria-label={`Redigera ${image.name}`} onClick={() => onEditMapImage?.(image)} type="button">
                    Redigera
                  </button>
                )}
              </div>
            </div>
          ))}
          {!(gardenState.mapImages ?? []).length && <p className="helper-text">Inga sparade kartbilder ännu.</p>}
        </div>
        {previewImage && (
          <div className="map-image-preview" aria-label="Kartbildsvisning">
            <div className="map-image-preview-header">
              <h4>{previewImage.name}</h4>
              <button aria-label="Stäng visning" onClick={() => setPreviewImage(null)} type="button">
                Stäng
              </button>
            </div>
            {previewImageUrl && <img alt={previewImage.name} src={previewImageUrl} />}
          </div>
        )}
      </div>
      <div className="editor-form">
        <button onClick={() => setShowAdvanced((current) => !current)} type="button">
          Avancerat
        </button>
        {showAdvanced && (
          <div className="advanced-settings">
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
          </div>
        )}
      </div>
    </section>
  );
}
