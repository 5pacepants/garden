# Shareable Garden Media Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shareable local media support for garden backgrounds and plant photos, plus clearer placement warnings while placing or moving plants.

**Architecture:** Keep garden JSON in `useGardenState` and store only logical media references there. Add Tauri commands for native image picking, media copying, and appmedia URL resolution, then hide those commands behind a small frontend `MediaService`. Update Settings, PlantCard, and GardenMap through existing save/update actions.

**Tech Stack:** Tauri 2, React 19, TypeScript, Vitest, Testing Library, native file dialog, local app data media folder.

---

## File Structure

- Modify `src-tauri/Cargo.toml`: add dialog/fs related Tauri plugin dependencies if needed.
- Modify `src-tauri/src/lib.rs`: add media commands.
- Modify `src-tauri/tauri.conf.json`: allow asset protocol/media access if required by Tauri.
- Create `src/data/mediaService.ts`: frontend boundary for picking/storing/resolving images.
- Create `tests/data/mediaService.test.ts`: media service tests.
- Modify `src/domain/models.ts`: ensure `Photo.filePath` or a new media reference field can hold `appmedia://...`.
- Modify `src/data/useGardenState.ts`: add map update action if current actions do not expose it.
- Modify `src/features/settings/SettingsView.tsx`: add background image picker.
- Create or modify `tests/features/SettingsView.test.tsx`: background picker behavior.
- Modify `src/features/plants/PlantCard.tsx`: add plant photo picker and previews.
- Modify `tests/features/PlantCard.test.tsx`: photo add behavior.
- Create `src/features/map/placementWarning.ts`: proposed placement warning helper.
- Create `tests/domain/placementWarning.test.ts`: warning helper tests.
- Modify `src/features/map/GardenMap.tsx`: show non-blocking proposed placement warnings.
- Modify `src/styles/app.css`: media controls, previews, warning panel.

## Chunk 1: Media Service and Tauri Commands

### Task 1: Add Frontend Media Service

**Files:**
- Create: `src/data/mediaService.ts`
- Create: `tests/data/mediaService.test.ts`

- [ ] **Step 1: Write failing media service test**

Test that `TauriMediaService.pickAndStoreImage()` calls `pick_and_store_image` and returns `null` on cancel.

- [ ] **Step 2: Run failing test**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/data/mediaService.test.ts
```

Expected: FAIL because `src/data/mediaService.ts` does not exist.

- [ ] **Step 3: Implement minimal service**

Create `StoredMedia`, `MediaService`, and `TauriMediaService`.

- [ ] **Step 4: Verify**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/data/mediaService.test.ts
```

Expected: PASS.

### Task 2: Add Tauri Media Commands

**Files:**
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: Add command dependencies**

Add Tauri dialog/fs/plugin dependencies needed for image picking and local media file access.

- [ ] **Step 2: Implement commands**

Add:

- `pick_and_store_image() -> Result<Option<StoredMedia>, String>`
- `resolve_media_url(reference: String) -> Result<String, String>`

Use app data media directory and copy selected images into it.

- [ ] **Step 3: Register commands/plugins**

Add commands to `generate_handler!` and plugins to builder.

- [ ] **Step 4: Verify Rust/Desktop build**

Run:

```powershell
cmd.exe /c npm.cmd run desktop:build
```

Expected: PASS.

## Chunk 2: Background Image Picker

### Task 3: Add Map Background Update Flow

**Files:**
- Modify: `src/data/useGardenState.ts`
- Modify: `src/App.tsx`
- Modify: `src/features/settings/SettingsView.tsx`
- Create: `tests/features/SettingsView.test.tsx`

- [ ] **Step 1: Write failing SettingsView test**

Render SettingsView with a fake media service. Click "Byt kartbild" and assert `onImportGardenState` receives state with updated `map.backgroundImage`.

- [ ] **Step 2: Run failing test**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/SettingsView.test.tsx
```

Expected: FAIL because SettingsView has no picker.

- [ ] **Step 3: Implement background picker UI**

Inject `mediaService`, call `pickAndStoreImage`, update garden state with `stored.reference`, and show error/cancel messages.

- [ ] **Step 4: Verify**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/SettingsView.test.tsx
cmd.exe /c npm.cmd run build
```

Expected: PASS.

## Chunk 3: Plant Photos

### Task 4: Add Plant Photo Picker and Previews

**Files:**
- Modify: `src/features/plants/PlantCard.tsx`
- Modify: `src/components/DetailPanel.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`
- Modify: `tests/features/PlantCard.test.tsx`

- [ ] **Step 1: Write failing PlantCard test**

Render PlantCard with a fake media service. Click "Lägg till foto" and assert `onAddPhoto` receives a photo linked to the plant id with the returned media reference.

- [ ] **Step 2: Run failing test**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/PlantCard.test.tsx
```

Expected: FAIL because PlantCard has no media photo action.

- [ ] **Step 3: Add photo action**

Add optional `photos`, `onAddPhoto`, and `mediaService` props. Show previews for linked photos and add a file picker button.

- [ ] **Step 4: Verify**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/PlantCard.test.tsx
cmd.exe /c npm.cmd run build
```

Expected: PASS.

## Chunk 4: Placement Warnings

### Task 5: Add Proposed Placement Warning Helper

**Files:**
- Create: `src/features/map/placementWarning.ts`
- Create: `tests/domain/placementWarning.test.ts`

- [ ] **Step 1: Write failing warning tests**

Cover: full-sun plant proposed in shade returns warning; unknown plant needs returns null.

- [ ] **Step 2: Run failing test**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/domain/placementWarning.test.ts
```

Expected: FAIL because helper does not exist.

- [ ] **Step 3: Implement helper**

Use `findZonesAtPoint` and `getPlacementWarning`.

- [ ] **Step 4: Verify**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/domain/placementWarning.test.ts
```

Expected: PASS.

### Task 6: Show Warnings in GardenMap

**Files:**
- Modify: `src/features/map/GardenMap.tsx`
- Modify: `src/styles/app.css`
- Modify: `tests/features/GardenMap.test.tsx`

- [ ] **Step 1: Add or update GardenMap test**

Test that moving a plant into a mismatched zone renders a warning text without blocking Save.

- [ ] **Step 2: Implement UI warning**

Show warning below toolbar or above map caption while a placement candidate has warning state.

- [ ] **Step 3: Verify**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/GardenMap.test.tsx tests/domain/placementWarning.test.ts
cmd.exe /c npm.cmd run build
```

Expected: PASS.

## Chunk 5: Final Verification

### Task 7: Full Verification and Push

**Files:**
- Modify only files needed for fixes found during verification.

- [ ] **Step 1: Run all tests**

```powershell
cmd.exe /c npm.cmd test
```

Expected: PASS.

- [ ] **Step 2: Run frontend build**

```powershell
cmd.exe /c npm.cmd run build
```

Expected: PASS.

- [ ] **Step 3: Run desktop build**

```powershell
cmd.exe /c npm.cmd run desktop:build
```

Expected: PASS.

- [ ] **Step 4: Commit and push**

```powershell
git add .
git commit -m "feat: add shareable garden media support"
git push
```
