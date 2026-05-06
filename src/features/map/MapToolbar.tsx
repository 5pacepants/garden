export type LayerVisibility = {
  zones: boolean;
  beds: boolean;
  existing: boolean;
  planned: boolean;
  wishlist: boolean;
};

type MapToolbarProps = {
  layers: LayerVisibility;
  onToggleLayer: (layer: keyof LayerVisibility) => void;
};

const layerLabels: Array<[keyof LayerVisibility, string]> = [
  ["zones", "Zoner"],
  ["beds", "Rabatter"],
  ["existing", "Befintliga"],
  ["planned", "Planerade"],
  ["wishlist", "Wishlist"],
];

export function MapToolbar({ layers, onToggleLayer }: MapToolbarProps) {
  return (
    <div className="map-toolbar" aria-label="Kartlager">
      {layerLabels.map(([key, label]) => (
        <label className="layer-toggle" key={key}>
          <input checked={layers[key]} onChange={() => onToggleLayer(key)} type="checkbox" />
          <span>{label}</span>
        </label>
      ))}
    </div>
  );
}
