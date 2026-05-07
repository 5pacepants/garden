export type LayerVisibility = {
  zones: boolean;
  beds: boolean;
  existing: boolean;
  planned: boolean;
  wishlist: boolean;
};

export type MapMode = "select" | "addPlant" | "drawBed" | "drawZone";

type MapToolbarProps = {
  layers: LayerVisibility;
  mode: MapMode;
  canFinishPolygon: boolean;
  canZoomIn: boolean;
  canZoomOut: boolean;
  pendingMove: boolean;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
  onModeChange: (mode: MapMode) => void;
  onFinishPolygon: () => void;
  onCancelPolygon: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onSaveMove: () => void;
  onUndoMove: () => void;
};

const layerLabels: Array<[keyof LayerVisibility, string]> = [
  ["zones", "Zoner"],
  ["beds", "Rabatter"],
  ["existing", "Befintliga"],
  ["planned", "Planerade"],
  ["wishlist", "Önskelista"],
];

const modeLabels: Array<[MapMode, string]> = [
  ["select", "Välj"],
  ["addPlant", "Ny växt"],
  ["drawBed", "Rita rabatt"],
  ["drawZone", "Rita zon"],
];

export function MapToolbar({
  layers,
  mode,
  canFinishPolygon,
  canZoomIn,
  canZoomOut,
  pendingMove,
  onToggleLayer,
  onModeChange,
  onFinishPolygon,
  onCancelPolygon,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onSaveMove,
  onUndoMove,
}: MapToolbarProps) {
  return (
    <div className="map-toolbar" aria-label="Kartlager">
      <div className="mode-group" aria-label="Kartverktyg">
        {modeLabels.map(([key, label]) => (
          <button className={mode === key ? "tool-button active" : "tool-button"} key={key} onClick={() => onModeChange(key)} type="button">
            {label}
          </button>
        ))}
        {(mode === "drawBed" || mode === "drawZone") && (
          <>
            <button className="tool-button" disabled={!canFinishPolygon} onClick={onFinishPolygon} type="button">
              Slutför
            </button>
            <button className="tool-button" onClick={onCancelPolygon} type="button">
              Avbryt
            </button>
          </>
        )}
      </div>
      <div className="mode-group" aria-label="Zoom">
        <button className="tool-button" disabled={!canZoomOut} onClick={onZoomOut} title="Zooma ut" type="button">-</button>
        <button className="tool-button" disabled={!canZoomIn} onClick={onZoomIn} title="Zooma in" type="button">+</button>
        <button className="tool-button" onClick={onResetZoom} type="button">Anpassa</button>
      </div>
      {pendingMove && (
        <div className="mode-group pending-move-actions" aria-label="Osparad kartflytt">
          <button className="tool-button primary" onClick={onSaveMove} type="button">Spara flytt</button>
          <button className="tool-button" onClick={onUndoMove} type="button">Ångra</button>
        </div>
      )}
      {layerLabels.map(([key, label]) => (
        <label className="layer-toggle" key={key}>
          <input checked={layers[key]} onChange={() => onToggleLayer(key)} type="checkbox" />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
