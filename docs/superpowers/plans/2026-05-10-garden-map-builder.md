# Garden Map Builder Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first manual garden map builder that can generate a simple SVG overhead map and use it as the app's map background.

**Architecture:** Keep the builder model separate from existing `GardenState` and plant/bed/zone data. Add pure domain/render helpers with tests, then a React `MapBuilderView` that stores its draft layout locally and applies a generated SVG data URL to `gardenState.map.backgroundImage`.

**Tech Stack:** React 19, TypeScript, SVG, Vitest, Testing Library.

---

## Chunk 1: Domain And Rendering

### Task 1: Add Builder Model And Renderer

**Files:**
- Create: `src/features/mapBuilder/mapBuilderModel.ts`
- Create: `tests/domain/mapBuilderModel.test.ts`

- [ ] Write failing tests for starter layout, element creation, SVG rendering, and data URL rendering.
- [ ] Run `cmd.exe /c npm.cmd test -- tests/domain/mapBuilderModel.test.ts` and verify it fails because the module is missing.
- [ ] Implement model helpers and pure SVG renderer.
- [ ] Re-run the test and verify it passes.

## Chunk 2: UI Integration

### Task 2: Add Map Builder View

**Files:**
- Create: `src/features/mapBuilder/MapBuilderView.tsx`
- Create: `tests/features/MapBuilderView.test.tsx`
- Modify: `src/styles/app.css`

- [ ] Write failing UI test: render builder, click `Lägg till hus`, click `Använd som kartbild`, assert callback receives a `data:image/svg+xml` background image.
- [ ] Run `cmd.exe /c npm.cmd test -- tests/features/MapBuilderView.test.tsx` and verify it fails.
- [ ] Implement `MapBuilderView` with add buttons, selected object form, SVG preview, and apply button.
- [ ] Add focused CSS for the builder layout.
- [ ] Re-run the UI test and verify it passes.

### Task 3: Add Navigation And App Wiring

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/App.tsx`

- [ ] Add `mapBuilder` view label `Kartbyggare`.
- [ ] Render `MapBuilderView` from `App.tsx`.
- [ ] Pass current `gardenState` and `replaceState` as the apply callback.
- [ ] Run `cmd.exe /c npm.cmd run build`.

## Chunk 3: Verification

### Task 4: Full Verification

**Files:**
- Modify only files needed for fixes.

- [ ] Run `cmd.exe /c npm.cmd test`.
- [ ] Run `cmd.exe /c npm.cmd run build`.
- [ ] Run `cmd.exe /c npm.cmd run desktop:build`.
- [ ] Commit with `feat: add manual garden map builder`.
- [ ] Push to GitHub.
