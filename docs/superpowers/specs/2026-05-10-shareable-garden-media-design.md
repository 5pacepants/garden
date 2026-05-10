# Shareable Garden Media Design

## Purpose

Make the desktop app practical for other private gardens by letting a user replace the map background with their own garden image, attach photos to plants, and get clearer placement warnings while placing or moving plants.

The app is still local-first and private. It does not need map services, accounts, cloud sync, app-store packaging, or direct phone integration in this pass.

## Scope

This pass covers:

- Choosing an image file for the garden map background.
- Copying chosen images into the app's own media directory.
- Storing stable media references in garden state.
- Displaying the chosen garden background on the map.
- Adding one or more photos to a plant.
- Displaying plant photos in the plant card.
- Showing clearer non-blocking placement warnings when a plant is placed or moved into a zone that does not match its needs.

This pass does not cover:

- Direct import from phone APIs.
- Image compression, thumbnail generation, or deduplication.
- Exporting a complete portable backup package with media files.
- Advanced photo timelines or before/after sliders.
- Multi-user sync or cloud storage.

## Media Storage

The app should copy selected files into a Tauri-managed app data media directory instead of storing links to the original files. This keeps garden data stable if the original image is moved or deleted.

The first implementation uses Tauri commands:

- Pick an image file with the native file picker.
- Copy it to the app media directory.
- Return a stable `appmedia://...` reference plus display metadata.
- Resolve `appmedia://...` references into URLs the frontend can render.

The media directory can be under Tauri app data, for example:

```text
AppData/Roaming/Min Trädgård/media/
```

Media references stored in JSON should be relative/logical, not absolute original paths. The exact physical path is an implementation detail.

## Garden Background Flow

Settings gets a clear "Byt kartbild" action. When the user selects an image:

1. Tauri opens the native file picker.
2. The selected file is copied into the media directory.
3. The map background stores the new media reference.
4. The map immediately renders the new image.

Coordinates remain normalized. Replacing the image does not move existing plants, beds, or zones. Users are expected to adjust their garden objects manually if the new image has a different framing.

## Plant Photo Flow

Plant cards get a photo section. The user can add photos from files already available to Windows. If a phone is connected and Windows exposes the phone photos as selectable files, the same picker can be used. Direct phone sync is out of scope.

When a plant photo is added:

1. Tauri copies the selected file into the media directory.
2. A `Photo` entry is created with the media reference, date, label, and `plantId`.
3. The plant card shows image previews for that plant.
4. The existing History/Photo view can continue showing all photos, but plant-level photo management starts in the plant card.

## Placement Warnings

Place matching already exists after selecting a plant or zone. This pass makes placement warnings more immediate.

When adding or moving a plant:

- The app evaluates zones under the proposed point.
- If the match state is `warning`, a visible warning appears near the map toolbar/caption.
- The warning does not block placement or save.
- Unknown plant or zone data stays neutral.

For newly added plants with no needs yet, warnings usually remain unknown/neutral. Warnings become more useful once a plant card has light, moisture, or soil needs.

## Data Flow

`useGardenState` remains the persistence boundary for garden JSON. Media file copying and reference resolution belong in a small media service/data module so React components do not know Tauri command names.

Suggested frontend boundary:

```ts
type StoredMedia = {
  reference: string;
  fileName: string;
  url: string;
};

interface MediaService {
  pickAndStoreImage(): Promise<StoredMedia | null>;
  resolveMediaUrl(reference: string): Promise<string>;
}
```

The service can return `null` when the user cancels the picker.

## Error Handling

If image picking is cancelled, nothing changes.

If copying fails, show a short in-app error and leave current garden state unchanged.

If resolving a media reference fails, show the rest of the app and use the existing placeholder/background fallback.

## Testing

Automated tests should cover:

- Media service calls the expected Tauri command and handles cancel.
- Settings updates the map background only after a stored image is returned.
- Plant card adds a plant-linked photo after a stored image is returned.
- Placement warning helper returns a warning for an unsuitable proposed point and no warning for unknown data.

Manual verification should cover:

- Pick a background image and see it on the map.
- Close and reopen app; background remains.
- Add a plant photo from disk and see it in the plant card.
- Close and reopen app; photo remains.
- Move a plant into a mismatched zone and see a non-blocking warning.
