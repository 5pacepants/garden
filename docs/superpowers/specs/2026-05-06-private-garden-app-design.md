# Private Garden App Design

## Purpose

Build a private desktop garden app for one household. The app is not a scalable public product. It should model one specific garden, one house, and the plants, beds, tasks, plans, and history connected to that garden.

The main experience is a top-down garden map. The user can place plants, draw beds and zones, open plant information, manage care schedules, see upcoming work, and build a useful long-term history.

## Product Scope

The first version is a desktop-first app for Windows, intended primarily for planning and maintenance on a laptop or desktop. Mobile support is not a priority for MVP.

The app should be useful even without internet access or AI configuration. AI-assisted plant data is optional and only enabled when an API key/configuration exists.

## Recommended Approach

Use a map-centered MVP. The app opens into the garden map and treats the map as the primary working surface. Lists, calendar, history, and planning views support the map rather than replacing it.

This is preferred over a data-first MVP because the core value is seeing and managing this specific garden spatially.

## Technology

- Tauri for the desktop application shell.
- React and TypeScript for UI and application logic.
- Local-first storage through a data service abstraction.
- Start with JSON-style persistence or another simple local storage layer.
- Keep the data access layer isolated so SQLite can replace the first storage backend later.
- Optional OpenAI-powered plant data suggestions when API configuration exists.

## Main Views

### Map

The map is the default view. It shows an uploaded top-down background image, likely created manually in Photoshop. The app does not need to draw the whole garden from scratch in MVP.

Objects shown on the map:

- Plant nodes.
- Bed polygons.
- Zone polygons under beds and plants.
- Optional task indicators.
- Layer and filter controls.

The map does not need real-world scale. Positions are visual and stored as percentages or normalized coordinates so the layout can adapt to the displayed image size.

### Plants

The plant view shows the plant library/list with filtering and search. It includes existing plants, planned plants, wishlist plants, and removed plants.

### Tasks

The task view shows pending, upcoming, overdue, and completed tasks. Tasks can be connected to a plant, a bed, the whole garden, or be free-standing.

### Calendar

The calendar shows care work by day, week, and month. It is driven by manually created tasks and tasks generated or suggested from plant care schedules.

### History

The history view is a searchable log of garden events. It can be filtered by plant, bed, event type, and date.

### Planning

The planning view focuses on planned plants and wishlist items. Planned plants can have reserved map positions and purchase details.

### Settings

Settings include background image management, backup/export/import, and optional AI configuration.

## Map Model

### Background Image

The garden map uses one uploaded image as the visual reference. The user can replace this image later. Because coordinates are normalized, objects can stay roughly positioned after image replacement, though manual cleanup may be needed.

### Beds

Beds are drawn as polygons. They are interactive objects that can be selected, moved, resized, and edited.

Beds act as containers for plant nodes. If a plant is inside a bed, its position is stored relative to the bed. When the bed moves, contained plants move with it. When the bed is scaled, contained plant positions scale proportionally.

If a plant is dragged into a bed, the app should automatically associate it with that bed. If dragged out, it can become map-level/free-standing.

### Plants

Plants are clickable nodes. A plant can be:

- Free-standing on the map.
- Contained inside a bed.

MVP does not need plant diameter or future spread visualization on the map. Plant height and width can still be stored in the plant data for later features.

### Zones

Zones are independent polygon layers under garden objects. They represent environmental conditions and are not owned by beds.

Zone properties include:

- Light: full sun, part shade, shade.
- Moisture: dry, normal, moist.
- Optional soil traits: clay, sandy, well-drained, humus-rich.

Zones can overlap beds. A bed can be partly in sun and partly in shade. Placement checks are based on the actual plant node position and the zone polygon or polygons under that point.

If multiple zones overlap a plant, the app combines the relevant properties where possible or shows the match as conflicted/unknown.

## Plant Cards

Each plant has a plant card with:

- Swedish name.
- Latin name.
- Cultivar/variety.
- Status: existing, planned, wishlist, removed.
- Plant type: perennial, shrub, tree, vegetable, herb, bulb, and similar.
- Image.
- Placement: free-standing or in a bed.
- Light needs.
- Soil and moisture needs.
- Hardiness/zone notes.
- Flowering time.
- Pruning time.
- Fertilizing, dividing, harvesting notes.
- Current or estimated height and width.
- Tags such as edible, pollinator-friendly, evergreen, fragrant.
- Free notes.

Planned and wishlist plants can include:

- Price.
- Store.
- Link.
- Priority.
- Reserved map position.

## AI-Assisted Plant Data

AI is optional. The app must work fully without it.

When configured, a user can enter a plant name and click a suggestion action. The AI returns a draft plant card and care schedule. The draft must be reviewed before saving.

AI suggestions can include:

- Swedish and Latin names.
- Plant type.
- Height and width.
- Flowering period.
- Light, moisture, and soil needs.
- Pruning, fertilizing, dividing, and harvesting guidance.
- Tags.
- Care schedule rows.

AI-provided data is treated as a suggestion, not truth. The saved plant card is the user-approved version.

## Care Schedules

Each plant has a care schedule section. This is the source for recurring or seasonal care reminders.

Care schedule rows can express:

- A specific date, such as May 1.
- A date range, such as May to June.
- A month or season.
- A relative trigger, such as after flowering.
- A recurrence, such as once per week during June to August.
- A condition, such as during drought.

Each row includes:

- Action type.
- Timing rule.
- Instructions.
- Priority.
- Whether it should create tasks automatically or only suggest them.
- Source: manual or AI-suggested.
- Last performed date.

The app uses care schedules to suggest or generate tasks, notifications, and calendar entries.

## Tasks, Notifications, and Calendar

Tasks can be linked to:

- A plant.
- A bed.
- The whole garden.
- Nothing specific.

Task types include:

- Water.
- Prune.
- Fertilize.
- Plant.
- Move.
- Divide.
- Harvest.
- Weed.
- Inspect problem.
- Custom type.

The map/start view includes a local notification center. It shows the most important current items, such as the top three overdue, due today, or due within seven days.

MVP notifications are in-app only. Windows system notifications are a later feature.

When completing a task, the app can offer to create a matching history event.

## History and Photos

Plants and beds have history. History events include:

- Planted.
- Moved.
- Pruned.
- Fertilized.
- Watered.
- Divided.
- Harvested.
- Disease/problem.
- Frost damage.
- Overwintering success/failure.
- Free comment.
- Photo uploaded.

Photo history is simple in MVP: dated photos with comments connected to a plant, bed, or event. Advanced before/after sliders can come later.

## Filters

Filters should be available in the map and plant list.

MVP filters:

- Existing, planned, wishlist, removed.
- Plant type.
- Flowering month.
- Edible.
- Pollinator-friendly.
- Evergreen.
- Light need.
- Moisture need.
- Needs watering now.
- Has task this week.

## Place Matching

Place matching is part of MVP.

The app compares plant requirements against the zone conditions under a plant's map position.

Match states:

- Good match.
- Possible match.
- Warning.
- Unknown.

The app should support:

- Show plants that fit this place.
- Warn when placing a planned plant in an unsuitable place.
- Explain warnings without blocking placement.

Example warning: "This plant prefers full sun, but this position is marked as part shade."

Unknown data should remain neutral. Missing plant or zone information must not create false warnings.

## Data Model

Core entities:

- GardenMap.
- Plant.
- Bed.
- Zone.
- CareSchedule.
- Task.
- HistoryEvent.
- Photo.
- PurchaseInfo.

The map UI should not own the data model directly. Components should read and write through services/hooks so task, calendar, history, and planning views share the same data without duplicate logic.

## MVP

The first version should include:

- Tauri desktop app.
- React and TypeScript UI.
- Uploaded background image.
- Bed polygon drawing and editing.
- Zone polygon drawing and editing.
- Plant nodes.
- Bed-contained plants that move and scale with beds.
- Plant cards.
- Optional AI plant data suggestions.
- Plant care schedules.
- Tasks generated or suggested from care schedules.
- In-app notification center.
- Calendar.
- History per plant and bed.
- Simple photo history.
- Filters.
- Place matching and placement warnings.
- Local storage.
- Backup/export/import.

## Later Phases

Later improvements:

- SQLite storage if data volume grows.
- Windows system notifications.
- Weather integration.
- Rainfall and frost warning support.
- Advanced photo timeline and before/after slider.
- Future plant size visualization.
- Harvest log with amount and taste rating.
- AI with web search and visible sources.
- Mobile or tablet-friendly layout.
- Image compression and media library.
- More map layers such as paths, fences, irrigation, electricity, and future plans.

## Testing Strategy

Testing should focus on the riskiest behavior:

- Geometry: plant containment in beds, moving beds, scaling beds, and zone lookup.
- Place matching: good/possible/warning/unknown outcomes.
- Care schedule to task generation.
- Notification selection for overdue/today/next seven days.
- Persistence round-trip for map objects, plants, tasks, history, and settings.
- AI suggestion flow with mocked responses so the app works without real API calls in tests.

Manual verification should cover:

- Creating a map.
- Drawing zones and beds.
- Adding plants inside and outside beds.
- Moving/scaling a bed and confirming plants follow.
- Creating a care schedule and seeing calendar/notification output.
- Reopening the app and confirming data persists.

