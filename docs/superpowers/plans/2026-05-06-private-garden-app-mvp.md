# Private Garden App MVP Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable private garden desktop app: a Tauri/React map-centered garden planner with beds, zones, plants, care schedules, tasks, calendar, history, local persistence, and optional AI plant data suggestions.

**Architecture:** Use a Tauri desktop shell with a React/TypeScript frontend. Keep domain logic in pure TypeScript modules with tests, keep UI components thin, and access data through a repository/service abstraction so the first local JSON/localStorage backend can later be replaced by SQLite or Tauri file storage.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Vitest, Testing Library, CSS modules or plain CSS, optional OpenAI Responses API for structured AI suggestions.

---

## References

- Design spec: `docs/superpowers/specs/2026-05-06-private-garden-app-design.md`
- Tauri create-project docs: `https://v2.tauri.app/start/create-project/`
- create-tauri-app template presets: `https://www.npmjs.com/package/create-tauri-app`
- OpenAI Responses API docs: `https://platform.openai.com/docs/api-reference/responses`
- OpenAI Structured Outputs guide: `https://platform.openai.com/docs/guides/structured-outputs`

## File Structure

The implementation should create this structure:

```text
package.json
vite.config.ts
src/
  main.tsx
  App.tsx
  test/
    setup.ts
  styles/
    app.css
  domain/
    models.ts
    ids.ts
    geometry.ts
    placeMatching.ts
    careSchedule.ts
    notifications.ts
    fixtures.ts
  data/
    gardenRepository.ts
    localStorageGardenRepository.ts
    importExport.ts
  ai/
    plantSuggestionSchema.ts
    plantSuggestionService.ts
    openAiPlantSuggestionService.ts
  components/
    AppShell.tsx
    NotificationCenter.tsx
    Sidebar.tsx
    DetailPanel.tsx
  features/
    map/
      GardenMap.tsx
      MapToolbar.tsx
      mapTransforms.ts
      mapSelection.ts
    plants/
      PlantCard.tsx
      PlantList.tsx
      PlantFilters.tsx
    beds/
      BedEditor.tsx
    zones/
      ZoneEditor.tsx
      PlaceMatchPanel.tsx
    tasks/
      TaskList.tsx
      TaskEditor.tsx
      CalendarView.tsx
    history/
      HistoryTimeline.tsx
      PhotoHistory.tsx
    settings/
      SettingsView.tsx
tests/
  domain/
    geometry.test.ts
    placeMatching.test.ts
    careSchedule.test.ts
    notifications.test.ts
  data/
    gardenRepository.test.ts
  ai/
    plantSuggestionSchema.test.ts
```

Keep domain tests independent from React. UI tests should be added only where behavior is risky or hard to verify manually.

## Chunk 1: Project Foundation

### Task 1: Scaffold Tauri React TypeScript App

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx`
- Create: `src/styles/app.css`
- Create: `src-tauri/`
- Preserve: `docs/superpowers/specs/2026-05-06-private-garden-app-design.md`
- Preserve: `docs/superpowers/plans/2026-05-06-private-garden-app-mvp.md`

- [ ] **Step 1: Scaffold into a temporary directory**

Run:

```powershell
npm create tauri-app@latest garden-scaffold -- --template react-ts --manager npm
```

Expected: a new `garden-scaffold/` directory with a React TypeScript Tauri project.

- [ ] **Step 2: Copy scaffold files into the repository root**

Copy generated app files from `garden-scaffold/` into the repo root while preserving `docs/` and `.git/`.

Expected: repo root has `package.json`, `src/`, and `src-tauri/`.

- [ ] **Step 3: Remove scaffold directory**

Run:

```powershell
Remove-Item -Recurse -Force garden-scaffold
```

Expected: `garden-scaffold/` is gone and the app files are at repo root.

- [ ] **Step 4: Install dependencies**

Run:

```powershell
npm install
```

Expected: `node_modules/` and `package-lock.json` are created.

- [ ] **Step 5: Verify base app builds**

Run:

```powershell
npm run build
```

Expected: Vite build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json index.html src src-tauri vite.config.ts
git commit -m "chore: scaffold tauri react app"
```

### Task 2: Add Test Harness and Base App Shell

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Modify: `src/App.tsx`
- Create: `src/test/setup.ts`
- Create: `src/components/AppShell.tsx`
- Create: `src/components/Sidebar.tsx`
- Create: `src/components/DetailPanel.tsx`
- Create: `src/components/NotificationCenter.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Install test dependencies**

Run:

```powershell
npm install -D vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected: packages are added to `devDependencies`.

- [ ] **Step 2: Add scripts**

Add to `package.json`:

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit"
  }
}
```

Preserve any existing Tauri/Vite scripts.

- [ ] **Step 3: Configure Vitest**

Update `vite.config.ts` with a `test` section:

```ts
test: {
  environment: "jsdom",
  globals: true,
  setupFiles: "./src/test/setup.ts"
}
```

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 4: Build static app shell**

Create `AppShell` with:

- left navigation: Karta, Växter, Uppgifter, Kalender, Historik, Planering, Inställningar
- center work area
- right detail panel
- top notification center

- [ ] **Step 5: Verify**

Run:

```powershell
npm run typecheck
npm test
npm run build
```

Expected: all pass.

- [ ] **Step 6: Commit**

```powershell
git add package.json package-lock.json vite.config.ts src
git commit -m "chore: add test harness and app shell"
```

## Chunk 2: Domain Model and Pure Logic

### Task 3: Define Garden Domain Models

**Files:**
- Create: `src/domain/models.ts`
- Create: `src/domain/ids.ts`
- Create: `src/domain/fixtures.ts`

- [ ] **Step 1: Create domain types**

Add TypeScript types for:

- `GardenState`
- `GardenMap`
- `Point`
- `Polygon`
- `Bed`
- `Zone`
- `Plant`
- `PlantStatus`
- `CareScheduleRule`
- `Task`
- `HistoryEvent`
- `Photo`
- `PurchaseInfo`
- `PlaceMatch`

- [ ] **Step 2: Add ID helpers**

Create `createId(prefix: string): string` in `src/domain/ids.ts`.

- [ ] **Step 3: Add realistic seed state**

Create `createDemoGardenState()` in `src/domain/fixtures.ts` with:

- one map
- two zones
- one bed
- three plants
- three care schedule rows
- two tasks
- two history events

- [ ] **Step 4: Typecheck**

Run:

```powershell
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/domain
git commit -m "feat: define garden domain models"
```

### Task 4: Implement Geometry for Beds, Zones, and Plant Containment

**Files:**
- Create: `src/domain/geometry.ts`
- Create: `tests/domain/geometry.test.ts`

- [ ] **Step 1: Write failing geometry tests**

Add tests:

```ts
import { describe, expect, it } from "vitest";
import {
  pointInPolygon,
  getBoundingBox,
  worldToRelativePoint,
  relativeToWorldPoint,
  scaleRelativePoint
} from "../../src/domain/geometry";

describe("geometry", () => {
  it("detects whether a plant point is inside a bed polygon", () => {
    const bed = [
      { x: 10, y: 10 },
      { x: 50, y: 10 },
      { x: 50, y: 50 },
      { x: 10, y: 50 }
    ];

    expect(pointInPolygon({ x: 25, y: 25 }, bed)).toBe(true);
    expect(pointInPolygon({ x: 75, y: 25 }, bed)).toBe(false);
  });

  it("round-trips a plant point through bed-relative coordinates", () => {
    const polygon = [
      { x: 20, y: 20 },
      { x: 60, y: 20 },
      { x: 60, y: 80 },
      { x: 20, y: 80 }
    ];

    const relative = worldToRelativePoint({ x: 40, y: 50 }, polygon);
    expect(relative).toEqual({ x: 0.5, y: 0.5 });
    expect(relativeToWorldPoint(relative, polygon)).toEqual({ x: 40, y: 50 });
  });

  it("keeps a plant in the same relative position when a bed scales", () => {
    expect(scaleRelativePoint({ x: 0.25, y: 0.75 })).toEqual({ x: 0.25, y: 0.75 });
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm test -- tests/domain/geometry.test.ts
```

Expected: FAIL because functions do not exist.

- [ ] **Step 3: Implement minimal geometry**

Implement:

- `pointInPolygon(point, polygon)`
- `getBoundingBox(polygon)`
- `worldToRelativePoint(point, polygon)`
- `relativeToWorldPoint(relativePoint, polygon)`
- `scaleRelativePoint(relativePoint)`
- `findContainingBed(point, beds)`
- `findZonesAtPoint(point, zones)`

Use normalized map coordinates from `0` to `100`.

- [ ] **Step 4: Verify tests pass**

Run:

```powershell
npm test -- tests/domain/geometry.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/geometry.ts tests/domain/geometry.test.ts
git commit -m "feat: add garden geometry helpers"
```

### Task 5: Implement Place Matching

**Files:**
- Create: `src/domain/placeMatching.ts`
- Create: `tests/domain/placeMatching.test.ts`

- [ ] **Step 1: Write failing matching tests**

Add tests for:

- full sun plant in full sun zone -> `good`
- full sun plant in part shade zone -> `warning`
- plant with unknown light requirement -> `unknown`
- overlapping zone conflict -> `possible`

Example:

```ts
import { describe, expect, it } from "vitest";
import { matchPlantToConditions } from "../../src/domain/placeMatching";

describe("place matching", () => {
  it("warns when a full sun plant is placed in part shade", () => {
    const result = matchPlantToConditions(
      { light: ["full_sun"], moisture: ["normal"] },
      { light: "part_shade", moisture: "normal" }
    );

    expect(result.state).toBe("warning");
    expect(result.reasons[0]).toContain("full sun");
  });
});
```

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm test -- tests/domain/placeMatching.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement matching**

Implement:

- `matchPlantToConditions(plantNeeds, zoneConditions): PlaceMatch`
- `rankPlantsForConditions(plants, zoneConditions)`
- `getPlacementWarning(plant, zonesAtPoint)`

Return one of:

- `good`
- `possible`
- `warning`
- `unknown`

Missing data must return `unknown`, not `warning`.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/domain/placeMatching.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/domain/placeMatching.ts tests/domain/placeMatching.test.ts
git commit -m "feat: add zone-based place matching"
```

### Task 6: Implement Care Schedule, Task Generation, and Notifications

**Files:**
- Create: `src/domain/careSchedule.ts`
- Create: `src/domain/notifications.ts`
- Create: `tests/domain/careSchedule.test.ts`
- Create: `tests/domain/notifications.test.ts`

- [ ] **Step 1: Write failing care schedule tests**

Cover:

- specific date rule creates a task
- month rule creates a task in that month
- weekly recurrence creates multiple due instances
- conditional rule like drought does not create automatic dated tasks

- [ ] **Step 2: Write failing notification tests**

Cover:

- overdue tasks rank first
- due today comes before due this week
- notification center returns top three

Example:

```ts
import { describe, expect, it } from "vitest";
import { selectTopNotifications } from "../../src/domain/notifications";

describe("notifications", () => {
  it("returns overdue, today, and upcoming tasks in priority order", () => {
    const result = selectTopNotifications(
      [
        { id: "late", title: "Late", dueDate: "2026-05-01", status: "open", priority: "normal" },
        { id: "today", title: "Today", dueDate: "2026-05-06", status: "open", priority: "normal" },
        { id: "future", title: "Future", dueDate: "2026-05-10", status: "open", priority: "normal" },
        { id: "later", title: "Later", dueDate: "2026-06-01", status: "open", priority: "normal" }
      ],
      new Date("2026-05-06")
    );

    expect(result.map((item) => item.id)).toEqual(["late", "today", "future"]);
  });
});
```

- [ ] **Step 3: Run failing tests**

Run:

```powershell
npm test -- tests/domain/careSchedule.test.ts tests/domain/notifications.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement schedule and notification logic**

Implement:

- `generateTasksFromCareSchedule(plant, fromDate, toDate)`
- `isCareRuleDue(rule, date)`
- `selectTopNotifications(tasks, today)`
- `groupTasksByCalendarDay(tasks)`

- [ ] **Step 5: Verify**

Run:

```powershell
npm test -- tests/domain/careSchedule.test.ts tests/domain/notifications.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/domain/careSchedule.ts src/domain/notifications.ts tests/domain
git commit -m "feat: add care schedule and notification logic"
```

## Chunk 3: Data Layer

### Task 7: Implement Local Garden Repository

**Files:**
- Create: `src/data/gardenRepository.ts`
- Create: `src/data/localStorageGardenRepository.ts`
- Create: `src/data/importExport.ts`
- Create: `tests/data/gardenRepository.test.ts`

- [ ] **Step 1: Write failing repository tests**

Use an in-memory `localStorage` mock in jsdom.

Cover:

- loading creates demo/empty state if no stored state exists
- saving and loading round-trips garden state
- import validates version
- export returns JSON string

- [ ] **Step 2: Run failing tests**

Run:

```powershell
npm test -- tests/data/gardenRepository.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement repository interface**

Create:

```ts
export interface GardenRepository {
  load(): Promise<GardenState>;
  save(state: GardenState): Promise<void>;
  exportJson(state: GardenState): string;
  importJson(json: string): GardenState;
}
```

Implement `LocalStorageGardenRepository`.

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- tests/data/gardenRepository.test.ts
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/data tests/data
git commit -m "feat: add local garden repository"
```

## Chunk 4: Map-Centered UI

### Task 8: Build Garden State Hook and App Wiring

**Files:**
- Create: `src/data/useGardenState.ts`
- Modify: `src/App.tsx`
- Modify: `src/components/AppShell.tsx`

- [ ] **Step 1: Add `useGardenState`**

The hook should:

- load state from repository on startup
- expose `gardenState`
- expose actions: `addPlant`, `updatePlant`, `addBed`, `updateBed`, `addZone`, `updateZone`, `addTask`, `completeTask`, `addHistoryEvent`
- save after state changes

- [ ] **Step 2: Wire app to repository**

Use `LocalStorageGardenRepository` initially.

- [ ] **Step 3: Manual verify**

Run:

```powershell
npm run dev
```

Expected: app opens in browser dev mode and shows the shell with seeded/demo data.

- [ ] **Step 4: Build verify**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src
git commit -m "feat: wire garden state into app"
```

### Task 9: Build Map Rendering and Selection

**Files:**
- Create: `src/features/map/GardenMap.tsx`
- Create: `src/features/map/MapToolbar.tsx`
- Create: `src/features/map/mapTransforms.ts`
- Create: `src/features/map/mapSelection.ts`
- Modify: `src/App.tsx`
- Modify: `src/styles/app.css`

- [ ] **Step 1: Add map transform helpers**

Implement conversion between screen coordinates and normalized map coordinates.

- [ ] **Step 2: Render map layers**

Render:

- background image placeholder
- zones as translucent polygons
- beds as polygon outlines/fills
- plants as clickable nodes

Use SVG over the image for MVP.

- [ ] **Step 3: Add selection**

Clicking a plant, bed, or zone updates selection and opens the detail panel.

- [ ] **Step 4: Add layer toggles**

Support show/hide for:

- zones
- beds
- existing plants
- planned plants
- wishlist

- [ ] **Step 5: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected:

- seeded plants appear as nodes
- seeded bed and zones appear as polygons
- clicking objects changes the detail panel

- [ ] **Step 6: Commit**

```powershell
git add src/features/map src/App.tsx src/styles/app.css
git commit -m "feat: render interactive garden map"
```

### Task 10: Add Bed, Zone, and Plant Editing

**Files:**
- Create: `src/features/beds/BedEditor.tsx`
- Create: `src/features/zones/ZoneEditor.tsx`
- Create: `src/features/plants/PlantCard.tsx`
- Modify: `src/features/map/GardenMap.tsx`
- Modify: `src/components/DetailPanel.tsx`

- [ ] **Step 1: Add plant editor**

Support:

- name fields
- status
- type
- placement
- light/moisture/soil needs
- notes
- care schedule rows

- [ ] **Step 2: Add bed editor**

Support:

- name
- polygon point list
- move bed
- scale bed

When a bed moves/scales, contained plants keep their relative positions.

- [ ] **Step 3: Add zone editor**

Support:

- name
- polygon point list
- light
- moisture
- soil traits

- [ ] **Step 4: Add simple drawing mode**

Use toolbar modes:

- select
- add plant
- draw bed
- draw zone

Polygon drawing can be simple: click points, finish with a button.

- [ ] **Step 5: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected:

- create a zone polygon
- create a bed polygon
- add a plant inside the bed
- move/scale the bed
- confirm the plant follows

- [ ] **Step 6: Commit**

```powershell
git add src/features src/components
git commit -m "feat: add map object editing"
```

## Chunk 5: Plant Workflows, Tasks, Calendar, and History

### Task 11: Build Plant List and Filters

**Files:**
- Create: `src/features/plants/PlantList.tsx`
- Create: `src/features/plants/PlantFilters.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Implement plant list**

Show all plants with:

- name
- status
- type
- bed/location
- next task summary

- [ ] **Step 2: Implement filters**

Support:

- status
- type
- flowering month
- edible
- pollinator-friendly
- evergreen
- light need
- moisture need
- task this week

- [ ] **Step 3: Reuse filters on map**

Map layer should hide plant nodes that do not match active filters.

- [ ] **Step 4: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected: filters affect both plant list and map.

- [ ] **Step 5: Commit**

```powershell
git add src/features/plants src/App.tsx src/features/map
git commit -m "feat: add plant list and filters"
```

### Task 12: Build Tasks, Notifications, and Calendar

**Files:**
- Create: `src/features/tasks/TaskList.tsx`
- Create: `src/features/tasks/TaskEditor.tsx`
- Create: `src/features/tasks/CalendarView.tsx`
- Modify: `src/components/NotificationCenter.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Show notification center**

Use `selectTopNotifications` to show the three most important items.

- [ ] **Step 2: Add task list**

Support:

- open tasks
- overdue tasks
- completed tasks
- task creation
- task completion

- [ ] **Step 3: Add calendar view**

Support month view first. Week/day can be simple panels or later refinements inside the same route.

- [ ] **Step 4: Generate tasks from care schedules**

Add an action that suggests tasks for the next 30 days from plant care schedules. User confirms before saving.

- [ ] **Step 5: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected:

- notification center shows top three tasks
- calendar shows task dates
- completing a task updates its status

- [ ] **Step 6: Commit**

```powershell
git add src/features/tasks src/components/NotificationCenter.tsx src/App.tsx
git commit -m "feat: add tasks notifications and calendar"
```

### Task 13: Build History and Photo History

**Files:**
- Create: `src/features/history/HistoryTimeline.tsx`
- Create: `src/features/history/PhotoHistory.tsx`
- Modify: `src/features/tasks/TaskList.tsx`
- Modify: `src/features/plants/PlantCard.tsx`
- Modify: `src/components/DetailPanel.tsx`

- [ ] **Step 1: Add history timeline**

Show history events sorted newest first. Filter by selected plant or bed when opened from detail panel.

- [ ] **Step 2: Add manual history entry form**

Support event type, date, comment, and optional linked plant/bed.

- [ ] **Step 3: Add task completion to history**

When completing a task, offer "also log to history".

- [ ] **Step 4: Add simple photo history**

MVP can store image data URLs or local object URLs through import/upload. Keep the repository shape ready for file-path based storage later.

- [ ] **Step 5: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected:

- add a history note to a plant
- complete a task and log it
- add a dated photo entry

- [ ] **Step 6: Commit**

```powershell
git add src/features/history src/features/tasks src/features/plants src/components
git commit -m "feat: add history and photo log"
```

## Chunk 6: Place Matching and Planning

### Task 14: Add Place Match Panel and Placement Warnings

**Files:**
- Create: `src/features/zones/PlaceMatchPanel.tsx`
- Modify: `src/features/map/GardenMap.tsx`
- Modify: `src/features/plants/PlantCard.tsx`
- Modify: `src/components/DetailPanel.tsx`

- [ ] **Step 1: Show match status for selected plant**

When selecting a plant, determine zones under the plant point and show:

- good match
- possible match
- warning
- unknown

- [ ] **Step 2: Warn when placing planned plants**

When adding or moving a planned plant, show a non-blocking warning if the zone does not fit plant requirements.

- [ ] **Step 3: Add "show plants that fit here"**

When selecting a zone or map point, rank existing/planned/wishlist plants by match against that place.

- [ ] **Step 4: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected:

- clicking a sunny zone can list plants that fit sun
- placing a full-sun plant in shade shows a warning
- unknown plant data does not warn

- [ ] **Step 5: Commit**

```powershell
git add src/features/zones src/features/map src/features/plants src/components
git commit -m "feat: add place matching UI"
```

### Task 15: Add Planning and Wishlist Details

**Files:**
- Create: `src/features/planning/PlanningView.tsx`
- Modify: `src/features/plants/PlantCard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add planning view**

Show planned and wishlist plants with:

- price
- store
- link
- priority
- reserved position
- match status if position exists

- [ ] **Step 2: Add planning fields to plant card**

Fields should only show prominently for `planned` or `wishlist` statuses.

- [ ] **Step 3: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected: planned plants can be filtered by price/priority/status and selected on the map.

- [ ] **Step 4: Commit**

```powershell
git add src/features/planning src/features/plants src/App.tsx
git commit -m "feat: add planning and wishlist view"
```

## Chunk 7: Optional AI Suggestions

### Task 16: Add AI Suggestion Schema and Mock Service

**Files:**
- Create: `src/ai/plantSuggestionSchema.ts`
- Create: `src/ai/plantSuggestionService.ts`
- Create: `tests/ai/plantSuggestionSchema.test.ts`
- Modify: `src/features/plants/PlantCard.tsx`

- [ ] **Step 1: Write failing schema tests**

Test that a valid suggestion maps into draft plant fields and invalid suggestions are rejected.

- [ ] **Step 2: Define suggestion schema**

Define a strict TypeScript shape for AI output:

- names
- type
- height/width
- flowering months
- light/moisture/soil needs
- care schedule rows
- tags
- notes

- [ ] **Step 3: Add service interface**

Create:

```ts
export interface PlantSuggestionService {
  suggestPlant(input: { name: string }): Promise<PlantSuggestion>;
}
```

- [ ] **Step 4: Add mock service**

Mock service returns a plausible draft for manual UI testing without API access.

- [ ] **Step 5: Add review UI**

Plant card should show AI output as a draft. User must apply it before saving.

- [ ] **Step 6: Verify**

Run:

```powershell
npm test -- tests/ai/plantSuggestionSchema.test.ts
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/ai tests/ai src/features/plants/PlantCard.tsx
git commit -m "feat: add plant suggestion draft flow"
```

### Task 17: Add Optional OpenAI Adapter

**Files:**
- Create: `src/ai/openAiPlantSuggestionService.ts`
- Create: `src/features/settings/SettingsView.tsx`
- Modify: `src/App.tsx`
- Modify: `src/features/plants/PlantCard.tsx`

- [ ] **Step 1: Add settings fields**

Settings should include:

- OpenAI API key
- model name
- enable/disable AI suggestions

Store locally. Do not require these settings for app startup.

- [ ] **Step 2: Implement OpenAI adapter**

Use the Responses API with structured output. The adapter should:

- send plant name and a concise instruction
- request JSON matching `PlantSuggestion`
- handle errors
- return user-reviewable draft data

- [ ] **Step 3: Add fallback behavior**

If AI is disabled or key is missing:

- hide or disable the AI action
- keep manual plant editing fully available

- [ ] **Step 4: Verify with mocked fetch**

Add tests only if fetch mocking is already simple in the harness. Otherwise manually verify the disabled state and adapter error handling.

- [ ] **Step 5: Verify build**

Run:

```powershell
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/ai src/features/settings src/features/plants src/App.tsx
git commit -m "feat: add optional openai plant suggestions"
```

## Chunk 8: Import, Export, Polish, and Desktop Verification

### Task 18: Add Backup Export and Import UI

**Files:**
- Modify: `src/features/settings/SettingsView.tsx`
- Modify: `src/data/importExport.ts`

- [ ] **Step 1: Add export action**

Export current `GardenState` as JSON.

- [ ] **Step 2: Add import action**

Import JSON, validate schema version, and replace current state after confirmation.

- [ ] **Step 3: Add reset demo data action**

Useful during early private development.

- [ ] **Step 4: Verify**

Run:

```powershell
npm run typecheck
npm run build
```

Manual expected:

- export downloads/copies JSON
- import restores the same data
- invalid JSON shows an error

- [ ] **Step 5: Commit**

```powershell
git add src/features/settings src/data
git commit -m "feat: add backup import and export"
```

### Task 19: Full Verification Pass

**Files:**
- Modify only files needed for fixes found during verification.

- [ ] **Step 1: Run all automated checks**

Run:

```powershell
npm test
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 2: Run Tauri dev app**

Run:

```powershell
npm run tauri dev
```

Expected: native desktop window opens.

- [ ] **Step 3: Manual MVP scenario**

Verify:

- create or load map background placeholder
- draw a sun zone
- draw a bed overlapping the sun zone
- add a planned plant in the bed
- see place match
- move/scale bed and confirm plant follows
- add care schedule row
- generate a task
- see notification center and calendar
- complete task and add history
- export backup JSON
- close and reopen app and confirm persistence

- [ ] **Step 4: Fix issues**

For any failure, write or update the smallest relevant test first if it is domain logic. For UI-only polish, make targeted fixes and re-run checks.

- [ ] **Step 5: Commit final fixes**

```powershell
git add .
git commit -m "fix: polish private garden mvp"
```

## Execution Notes

- Use TDD for domain logic: geometry, place matching, care schedules, notifications, import/export, AI schema validation.
- Keep UI implementation pragmatic. Do not over-test simple presentational components.
- Use SVG for the map overlay in MVP because it gives straightforward polygon and node rendering.
- Keep all coordinates normalized from `0` to `100`.
- Keep unknown plant or zone data neutral in place matching.
- Do not block user placement because of a warning.
- Do not make Windows system notifications part of MVP.
- Do not implement weather, SQLite, advanced photo sliders, or future plant spread visualization in this plan.
