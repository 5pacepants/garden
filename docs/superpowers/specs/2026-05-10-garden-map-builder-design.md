# Garden Map Builder Design

## Purpose

Make the app usable without requiring users to draw a polished overhead garden image elsewhere. Users should be able to create a simple overhead garden layout directly in the app, then use it as the map background. Existing support for importing a custom image remains unchanged.

## Scope

This first pass builds a manual map builder, not AI image generation.

It covers:

- A new app view for building a garden map.
- A starter plot boundary.
- Adding and editing simple map elements: plot, house, path, lawn, fence, stone, tree, shrub, deck, water, and other.
- Rendering those elements as a clean overhead SVG illustration.
- Applying the generated SVG as `gardenState.map.backgroundImage`.

It does not cover:

- AI beautification.
- Photogrammetry or photo reconstruction.
- Precise real-world scale.
- Advanced drawing tools, snapping, rotation, or freehand sketching.
- Reusing builder objects as semantic beds/zones/plants. They are background/map-decoration only in this pass.

## Recommended UX

Add a navigation item named `Kartbyggare`.

The builder opens with a lightweight tool surface:

- Left/central canvas with an overhead SVG preview.
- Controls for adding common objects.
- Object list with name/type.
- Simple fields for selected object: name, x, y, width, height, color.
- Button: `Använd som kartbild`.

Objects use normalized `0..100` coordinates, matching the existing map model. Rectangular/elliptical elements are enough for the first pass. Plot boundaries and paths can also be stored as polygons later, but MVP can use simple rectangles/ellipses to keep editing predictable.

## Data Model

Create a focused builder model separate from `GardenState`:

```ts
type GardenMapElementType =
  | "plot"
  | "house"
  | "path"
  | "lawn"
  | "fence"
  | "stone"
  | "tree"
  | "shrub"
  | "deck"
  | "water"
  | "other";

type GardenMapElement = {
  id: string;
  type: GardenMapElementType;
  name: string;
  shape: "rectangle" | "ellipse";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
};

type GardenMapLayout = {
  id: string;
  name: string;
  elements: GardenMapElement[];
};
```

For this pass the layout can live in component state. Later it can be persisted in `GardenState` if users need to reopen and edit the generated map layout.

## Rendering

The builder renders deterministic SVG. When the user clicks `Använd som kartbild`, the SVG string is encoded as a data URL and saved into `gardenState.map.backgroundImage`.

Using a data URL is acceptable for this first pass because generated SVGs are small, portable in JSON backups, and avoid new file-writing paths. Imported photos and AI-generated bitmaps still use the media folder.

The renderer should be pure and tested:

- `createStarterMapLayout()`
- `createMapElement(type)`
- `updateMapElement(layout, element)`
- `renderGardenMapLayoutSvg(layout)`
- `renderGardenMapLayoutDataUrl(layout)`

## Future AI Step

The later AI beautification should use the saved builder layout as source truth:

1. Render the builder layout to SVG/PNG.
2. Send it plus a concise prompt to AI.
3. Store returned image in media folder.
4. Keep plant nodes, beds, and zones as real app objects above the background.

## Testing

Automated tests should cover:

- Starter layout includes a plot/lawn baseline.
- Adding an element preserves normalized fields and defaults.
- SVG renderer includes expected shapes and escapes labels.
- Builder view can add a house and apply the generated data URL through `onImportGardenState`.

Manual verification should cover:

- Open `Kartbyggare`.
- Add house/path/tree/stone objects.
- Edit selected object dimensions.
- Click `Använd som kartbild`.
- Return to map and see the generated background.
- Existing `Byt kartbild` in settings still works.
