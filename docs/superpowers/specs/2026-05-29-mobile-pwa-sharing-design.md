# Mobile PWA Sharing Design

## Goal

Make the garden app suitable to share with friends and family as a mobile-first progressive web app. Users should be able to open a GitHub Pages URL, add the app to their phone home screen, and use it as a personal garden app without seeing development details.

This first release is not a native iOS or Android app, and it does not require App Store, Play Store, paid developer accounts, user accounts, or a custom domain.

## Non-Goals

- Native app packaging for iOS or Android.
- App Store or Play Store distribution.
- Shared family gardens.
- User accounts.
- Cloud backup or cross-device sync.
- Public API-key entry by end users.

## Distribution

The app will be prepared for GitHub Pages hosting. The expected user flow is:

1. User receives a GitHub Pages URL.
2. User opens the URL on iPhone or Android.
3. User adds the web app to the home screen.
4. User uses the app as their own local garden planner.

The app should include the PWA basics:

- Web app manifest with app name, short name, icons, display mode, theme color, and start URL.
- Mobile-friendly meta tags.
- Offline-capable static asset caching where practical.
- Build configuration compatible with GitHub Pages path hosting.

## Data Model and Storage

The app remains personal and local-first. Each user's garden is saved automatically on the device through browser storage. No backend database is required for the first public sharing version.

The existing export/import backup flow can remain, but it should be treated as an optional utility, not a primary onboarding or everyday feature. Backup UI should be moved below the main settings content or into an "Advanced" area so non-technical users are not confronted with JSON early.

Known limitation: local browser data can be lost if the user clears website data, changes phone, or uses a different browser. This is acceptable for the first stage.

## AI Experience

AI remains a user-facing feature, but provider and implementation details are removed from normal UI.

User-facing language should use terms like:

- Smart suggestions
- Suggest plant details
- Recommend plants

The UI should not mention:

- OpenAI
- API keys
- `.env.local`
- API cost warnings
- Internal endpoint names

The app must not expose an OpenAI API key in frontend code. GitHub Pages cannot run backend code, so production AI calls must go through a small hosted proxy or serverless function later. Until that backend is configured, the app can use mock suggestions or show a plain, non-technical message that smart suggestions are unavailable.

Error messages should be written for normal users, for example: "Smart suggestions are not available right now. Try again later or fill in the details manually."

## Settings UX

Settings should be reorganized around user tasks:

- Smart suggestions: simple on/off control or status if unavailable.
- Garden map: choose and manage map images.
- App data: optional export/import backup.

The settings screen should no longer be titled "AI and appdata" or lead with technical AI configuration. Development/demo controls should be hidden, removed from public UI, or placed in an advanced area if still needed during testing.

## Mobile Layout

The app should become usable on phone-sized screens before sharing.

Required behavior:

- Navigation works well on narrow screens, likely as bottom navigation, top tabs, or a compact menu instead of a desktop sidebar.
- Primary map view gets as much vertical space as possible.
- Detail panels and editors stack cleanly below or open as mobile-friendly panels.
- Forms use touch-friendly controls and spacing.
- Buttons and labels do not overflow their containers.
- The layout remains usable in both portrait phone and desktop browser widths.

The first mobile pass should favor reliable usability over a full visual redesign.

## Architecture

The implementation should stay close to the existing React/Vite app:

- Keep local-first garden state through the existing repository/state abstraction.
- Add PWA assets and registration at the app shell/build layer.
- Keep AI behind the existing `PlantSuggestionService` interface so mock, local development, and future hosted proxy implementations remain interchangeable.
- Update SettingsView and related text without changing domain models unless necessary.
- Add responsive CSS to the existing stylesheet or adjacent component-level styles, matching current conventions.

## Testing

Add or update focused tests for:

- Settings no longer displays provider/API-key wording.
- Smart suggestions controls still update app state.
- Local storage repository continues to persist garden state.
- Mobile navigation/settings rendering where existing test utilities make this practical.

Manual verification should include:

- `npm run typecheck`
- `npm test`
- `npm run build`
- Open the app at a phone-width viewport and verify the main map, settings, and plant editor are usable.

## Open Follow-Up

AI production hosting is intentionally separate from this first UI/PWA pass. A later spec should choose the backend option, likely Cloudflare Worker, Vercel Function, or another small serverless proxy with budget and rate limits.
