# Mobile PWA Sharing Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prepare the garden app for free mobile sharing as a GitHub Pages-hosted PWA with local device storage, consumer-friendly AI wording, and phone-sized layouts.

**Architecture:** Keep the existing React/Vite app and state abstractions. Add PWA files at the app shell/public layer, keep AI access behind `PlantSuggestionService`, and make Settings plus navigation responsive without changing garden domain models.

**Tech Stack:** React 19, TypeScript, Vite 7, Vitest, Testing Library, plain CSS, GitHub Pages, browser local storage/IndexedDB abstractions already present in the app.

---

## File Structure

- Modify `vite.config.ts`: add a configurable `base` for GitHub Pages builds and keep existing dev middleware behavior.
- Modify `index.html`: replace Tauri/Vite starter metadata with PWA metadata and manifest links.
- Create `public/manifest.webmanifest`: PWA manifest with app name, icons, theme color, display mode, and start URL.
- Create `public/pwa-icon.svg`: source icon for future generated PNG icons.
- Create `public/icons/icon-192.png` and `public/icons/icon-512.png`: PNG icons generated from `public/pwa-icon.svg` and used by the manifest.
- Create `public/sw.js`: lightweight service worker for app-shell caching.
- Create `src/registerServiceWorker.ts`: registers the service worker only in production-capable browser contexts.
- Modify `src/main.tsx`: call service worker registration.
- Modify `src/features/settings/SettingsView.tsx`: rename AI UI to smart suggestions, hide provider/API copy, and move backup into an advanced/discreet area.
- Modify `src/App.tsx`: choose unavailable smart suggestions for public builds without local AI configuration, while keeping local development support.
- Modify or create `src/ai/unavailablePlantSuggestionService.ts`: user-friendly unavailable smart suggestion service.
- Modify `src/components/Sidebar.tsx`: make navigation labels and structure usable for a bottom mobile nav; keep desktop sidebar.
- Modify `src/components/AppShell.tsx`: preserve current shell but add class/landmarks needed for mobile bottom navigation spacing if necessary.
- Modify `src/styles/app.css`: responsive layout for 375px portrait and touch-friendly controls.
- Modify `tests/features/SettingsView.test.tsx`: verify technical AI/OpenAI wording is gone and smart suggestions toggle remains.
- Modify `tests/App.test.tsx` or create `tests/components/Sidebar.test.tsx`: verify primary navigation remains accessible.
- Create `tests/pwa/manifest.test.ts`: validate the manifest shape and required icons.
- Create `tests/pwa/serviceWorkerRegistration.test.ts`: validate registration path/base behavior if practical in jsdom.

---

## Chunk 1: PWA and GitHub Pages Build

### Task 1: Add GitHub Pages base-path support

**Files:**
- Modify: `vite.config.ts`
- Test: `tests/pwa/viteBase.test.ts` if the config can be imported cleanly; otherwise rely on build verification.

- [ ] **Step 1: Write the failing expectation**

If importing the async Vite config is practical, create `tests/pwa/viteBase.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_BASE_PATH", "/garden/");

describe("vite base path", () => {
  it("uses VITE_BASE_PATH for GitHub Pages subpath builds", async () => {
    const { default: configFactory } = await import("../../vite.config");
    const config = await configFactory({ command: "build", mode: "production" });

    expect(config.base).toBe("/garden/");
  });
});
```

If this is too brittle because of plugin imports, document the fallback in the commit and verify with `npm run build` using the env var instead.

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/pwa/viteBase.test.ts
```

Expected: FAIL because `base` is not set from `VITE_BASE_PATH`.

- [ ] **Step 3: Implement minimal config**

In `vite.config.ts`, add a base constant near the existing `host` constant:

```ts
// @ts-expect-error process is a nodejs global
const base = process.env.VITE_BASE_PATH || "/";
```

Then include it in the returned config:

```ts
return {
  base,
  plugins: [react(), localAiPlugin(env.OPENAI_API_KEY, env.OPENAI_MODEL), localDriveSyncPlugin()],
  clearScreen: false,
  // existing server/test config...
};
```

Keep the existing local API and drive-sync Vite middleware unchanged.

- [ ] **Step 4: Run verification**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/pwa/viteBase.test.ts
cmd.exe /c npm.cmd run build
```

Expected: test passes if present, and build completes.

- [ ] **Step 5: Commit**

```powershell
git add vite.config.ts tests/pwa/viteBase.test.ts
git commit -m "build: support github pages base path"
```

### Task 2: Add manifest and app metadata

**Files:**
- Create: `public/manifest.webmanifest`
- Create: `public/pwa-icon.svg`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Modify: `index.html`
- Test: `tests/pwa/manifest.test.ts`

- [ ] **Step 1: Write the failing manifest test**

Create `tests/pwa/manifest.test.ts`:

```ts
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("PWA manifest", () => {
  it("defines installable app metadata and required icons", async () => {
    const manifest = JSON.parse(await readFile("public/manifest.webmanifest", "utf8"));

    expect(manifest.name).toBe("Tradgard");
    expect(manifest.short_name).toBe("Tradgard");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe(".");
    expect(manifest.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ src: "icons/icon-192.png", sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }),
      ]),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/pwa/manifest.test.ts
```

Expected: FAIL because the manifest does not exist.

- [ ] **Step 3: Add manifest**

Create `public/manifest.webmanifest`:

```json
{
  "name": "Tradgard",
  "short_name": "Tradgard",
  "description": "Planera och skot din egen tradgard.",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#f6f8f1",
  "theme_color": "#45624c",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Use ASCII in file content. If Swedish characters are desired later, add them deliberately once encoding is verified.

- [ ] **Step 4: Add icon files**

Create `public/pwa-icon.svg` as the source asset:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="96" fill="#45624c"/>
  <path d="M256 392c-58-72-88-130-88-174 0-54 39-98 88-98s88 44 88 98c0 44-30 102-88 174z" fill="#f6f8f1"/>
  <path d="M256 300c42-28 64-63 64-105-39 3-70 26-84 64-18-27-43-43-76-46 5 45 38 80 96 87z" fill="#a8c686"/>
</svg>
```

Generate valid PNG files from `public/pwa-icon.svg` at:

- `public/icons/icon-192.png`
- `public/icons/icon-512.png`

Use a local image conversion tool such as ImageMagick, Sharp, or another existing project-approved converter. Do not use placeholder icons and do not hand-create unrelated PNGs. Verify both PNG files are valid images with the expected dimensions before committing. If no converter is available locally, pause this task and install or approve a converter rather than shipping placeholder assets.

- [ ] **Step 5: Update `index.html` metadata**

Replace starter metadata with:

```html
<html lang="sv">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#45624c" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-title" content="Tradgard" />
    <link rel="manifest" href="manifest.webmanifest" />
    <link rel="icon" href="icons/icon-192.png" />
    <link rel="apple-touch-icon" href="icons/icon-192.png" />
    <title>Tradgard</title>
  </head>
```

Keep the existing root div and module script.

- [ ] **Step 6: Run verification**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/pwa/manifest.test.ts
cmd.exe /c npm.cmd run build
```

Also verify PNG dimensions with an available local image tool. For example, with ImageMagick:

```powershell
magick identify public/icons/icon-192.png public/icons/icon-512.png
```

Expected: output reports `192x192` for `icon-192.png` and `512x512` for `icon-512.png`. If using a different tool, record equivalent output before committing.

Expected overall: test passes, icon dimensions are correct, and production build includes manifest and icons.

- [ ] **Step 7: Commit**

```powershell
git add index.html public/manifest.webmanifest public/pwa-icon.svg public/icons tests/pwa/manifest.test.ts
git commit -m "feat: add pwa manifest and app metadata"
```

### Task 3: Add service worker registration and app-shell caching

**Files:**
- Create: `public/sw.js`
- Create: `src/registerServiceWorker.ts`
- Modify: `src/main.tsx`
- Test: `tests/pwa/serviceWorkerRegistration.test.ts`

- [ ] **Step 1: Write failing registration tests**

Create `tests/pwa/serviceWorkerRegistration.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerServiceWorker } from "../../src/registerServiceWorker";

describe("registerServiceWorker", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("registers the service worker from the Vite base path", async () => {
    const register = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { serviceWorker: { register } });
    vi.stubEnv("BASE_URL", "/garden/");

    await registerServiceWorker();

    expect(register).toHaveBeenCalledWith("/garden/sw.js", { scope: "/garden/" });
  });

  it("does nothing when service workers are unavailable", async () => {
    vi.stubGlobal("navigator", {});

    await expect(registerServiceWorker()).resolves.toBeUndefined();
  });
});
```

Adjust env mocking to match Vitest/Vite behavior if `import.meta.env.BASE_URL` cannot be stubbed directly. A helper parameter is acceptable:

```ts
registerServiceWorker({ baseUrl: "/garden/" });
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/pwa/serviceWorkerRegistration.test.ts
```

Expected: FAIL because `registerServiceWorker` does not exist.

- [ ] **Step 3: Implement registration helper**

Create `src/registerServiceWorker.ts`:

```ts
type RegisterOptions = {
  baseUrl?: string;
};

export async function registerServiceWorker(options: RegisterOptions = {}): Promise<void> {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const baseUrl = options.baseUrl ?? import.meta.env.BASE_URL ?? "/";
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  try {
    await navigator.serviceWorker.register(`${normalizedBase}sw.js`, { scope: normalizedBase });
  } catch {
    // PWA support is progressive; the app must keep working if registration fails.
  }
}
```

Modify `src/main.tsx`:

```ts
import { registerServiceWorker } from "./registerServiceWorker";

// existing render call...
void registerServiceWorker();
```

- [ ] **Step 4: Add service worker**

Create `public/sw.js` with app-shell fallback plus runtime caching for same-origin build assets:

```js
const CACHE_NAME = "tradgard-app-shell-v1";
const APP_SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("./");
          }
          return caches.match(event.request);
        });
    }),
  );
});
```

This intentionally runtime-caches the hashed Vite JS/CSS/assets after the first successful online load, so the app shell can reload offline. During implementation, verify this works under the configured Vite base path. If relative cache entries do not behave correctly after build, replace with a generated build asset list or use `self.registration.scope`.

- [ ] **Step 5: Run verification**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/pwa/serviceWorkerRegistration.test.ts
cmd.exe /c npm.cmd run typecheck
cmd.exe /c npm.cmd run build
```

Expected: tests pass, TypeScript passes, build succeeds.

- [ ] **Step 6: Commit**

```powershell
git add public/sw.js src/registerServiceWorker.ts src/main.tsx tests/pwa/serviceWorkerRegistration.test.ts
git commit -m "feat: cache app shell for pwa installs"
```

---

## Chunk 2: Public Settings and Smart Suggestions UX

### Task 4: Hide provider/API wording from Settings

**Files:**
- Modify: `src/features/settings/SettingsView.tsx`
- Modify: `tests/features/SettingsView.test.tsx`

- [ ] **Step 1: Write failing Settings tests**

Add tests to `tests/features/SettingsView.test.tsx`:

```ts
it("uses consumer-friendly smart suggestion wording", () => {
  render(
    <SettingsView
      aiSettings={{ enabled: true }}
      gardenState={gardenState}
      onAiSettingsChange={vi.fn()}
      onImportGardenState={vi.fn()}
    />,
  );

  expect(screen.getByRole("heading", { name: "Installningar" })).toBeInTheDocument();
  expect(screen.getByLabelText("Smarta forslag")).toBeChecked();
  expect(screen.queryByText(/OpenAI/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/API/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/\.env\.local/i)).not.toBeInTheDocument();
});
```

Use the exact Swedish text that renders correctly in the repo's encoding. If existing tests show mojibake, match accessible roles rather than raw accented text where possible.

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/SettingsView.test.tsx
```

Expected: FAIL because Settings still says OpenAI/API.

- [ ] **Step 3: Update Settings UI**

In `SettingsView.tsx`:

- Change heading from `AI och appdata` to `Installningar` or `Appinstallningar`.
- Change checkbox label from `Aktivera OpenAI-forslag` to `Smarta forslag`.
- Replace helper copy with consumer language:

```tsx
<p className="helper-text">
  Smarta forslag kan hjalpa till med vaxtinformation nar funktionen ar tillganglig.
</p>
```

- Remove `.env.local`, `OPENAI_API_KEY`, cost warning, and provider terms from public UI.

- [ ] **Step 4: Run verification**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/SettingsView.test.tsx
```

Expected: Settings tests pass.

- [ ] **Step 5: Commit**

```powershell
git add src/features/settings/SettingsView.tsx tests/features/SettingsView.test.tsx
git commit -m "feat: simplify smart suggestions settings"
```

### Task 5: Make unavailable smart suggestions user-friendly

**Files:**
- Create or modify: `src/ai/unavailablePlantSuggestionService.ts`
- Modify: `src/App.tsx`
- Create: `tests/ai/unavailablePlantSuggestionService.test.ts`
- Modify: `tests/features/PlantCard.test.tsx` or `tests/App.test.tsx` only if additional UI coverage is needed.

- [ ] **Step 1: Write failing service test**

Create a small unit test if there is no suitable `PlantCard` test hook:

```ts
import { describe, expect, it } from "vitest";
import { UnavailablePlantSuggestionService } from "../../src/ai/unavailablePlantSuggestionService";

describe("UnavailablePlantSuggestionService", () => {
  it("throws a friendly smart suggestions message", async () => {
    const service = new UnavailablePlantSuggestionService();

    await expect(service.suggestPlant({ name: "ros" })).rejects.toThrow(
      "Smarta forslag ar inte tillgangliga just nu.",
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/ai/unavailablePlantSuggestionService.test.ts
```

Expected: FAIL because the service does not exist.

- [ ] **Step 3: Implement unavailable service**

Create `src/ai/unavailablePlantSuggestionService.ts`:

```ts
import type { PlantSuggestionInput, PlantSuggestionService } from "./plantSuggestionService";

const unavailableMessage = "Smarta forslag ar inte tillgangliga just nu. Fyll i detaljerna manuellt och forsok igen senare.";

export class UnavailablePlantSuggestionService implements PlantSuggestionService {
  async suggestPlant(_input: PlantSuggestionInput) {
    throw new Error(unavailableMessage);
  }

  async suggestPlantNames() {
    return [];
  }

  async recommendPlants() {
    throw new Error(unavailableMessage);
  }
}
```

Use the exact type names exported by `plantSuggestionService.ts`; adjust imports after reading that file.

- [ ] **Step 4: Wire public fallback in `App.tsx`**

Keep local development behavior intact, but avoid mock suggestions in shared production builds unless explicitly enabled. Example:

```ts
const suggestionService = useMemo(() => {
  if (!aiSettings.enabled) return new UnavailablePlantSuggestionService();
  if (import.meta.env.DEV) return new BrowserAiPlantSuggestionService();
  if (import.meta.env.VITE_AI_PROXY_URL) return new BrowserAiPlantSuggestionService(import.meta.env.VITE_AI_PROXY_URL);
  return new UnavailablePlantSuggestionService();
}, [aiSettings]);
```

If `BrowserAiPlantSuggestionService` does not currently accept a base URL, either add that small constructor option or leave the proxy URL integration for the later backend spec. The key requirement for this stage is no fake AI in the shared build.

- [ ] **Step 5: Run verification**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/ai/unavailablePlantSuggestionService.test.ts
cmd.exe /c npm.cmd run typecheck
```

Expected: test and typecheck pass.

- [ ] **Step 6: Commit**

```powershell
git add src/ai/unavailablePlantSuggestionService.ts src/App.tsx tests/ai/unavailablePlantSuggestionService.test.ts
git commit -m "feat: add friendly smart suggestions fallback"
```

### Task 6: Make backup optional and less dominant

**Files:**
- Modify: `src/features/settings/SettingsView.tsx`
- Modify: `tests/features/SettingsView.test.tsx`

- [ ] **Step 1: Write failing test**

Add:

```ts
it("keeps backup tools in an advanced section", () => {
  render(
    <SettingsView
      aiSettings={{ enabled: false }}
      gardenState={gardenState}
      onAiSettingsChange={vi.fn()}
      onImportGardenState={vi.fn()}
    />,
  );

  expect(screen.getByRole("button", { name: "Avancerat" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Exportera JSON" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/SettingsView.test.tsx
```

Expected: FAIL because backup is always visible.

- [ ] **Step 3: Implement advanced toggle**

Add state:

```ts
const [showAdvanced, setShowAdvanced] = useState(false);
```

Render a button near the bottom:

```tsx
<button onClick={() => setShowAdvanced((current) => !current)} type="button">
  Avancerat
</button>
{showAdvanced && (
  <div className="editor-form">
    <h3>Backup</h3>
    {/* existing backup controls */}
  </div>
)}
```

Move demo reset into the same advanced area or remove it from public UI if tests and development flow allow.

- [ ] **Step 4: Run verification**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/features/SettingsView.test.tsx
```

Expected: tests pass and backup still works after opening advanced controls.

- [ ] **Step 5: Commit**

```powershell
git add src/features/settings/SettingsView.tsx tests/features/SettingsView.test.tsx
git commit -m "feat: tuck backup tools into advanced settings"
```

---

## Chunk 3: Mobile Layout

### Task 7: Add accessible bottom navigation behavior

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/AppShell.tsx` if needed
- Create: `tests/components/Sidebar.test.tsx`

- [ ] **Step 1: Write navigation test**

Create `tests/components/Sidebar.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "../../src/components/Sidebar";

describe("Sidebar", () => {
  it("renders primary navigation and switches views", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();

    render(<Sidebar activeView="map" onViewChange={onViewChange} />);

    expect(screen.getByRole("navigation", { name: "Huvudnavigation" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Vaxter" }));

    expect(onViewChange).toHaveBeenCalledWith("plants");
  });
});
```

Adjust labels for the repo's current encoding if needed.

- [ ] **Step 2: Run test**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/components/Sidebar.test.tsx
```

Expected: PASS before CSS changes; this protects navigation behavior while layout changes.

- [ ] **Step 3: Add mobile-friendly hooks**

In `Sidebar.tsx`, consider:

- Keep `<aside className="sidebar">` for desktop.
- Keep `<nav className="nav-list">`.
- Add concise `aria-current={activeView === item.id ? "page" : undefined}` to active buttons.
- Do not remove any views yet; mobile can scroll horizontally if all items do not fit.

- [ ] **Step 4: Run verification**

Run:

```powershell
cmd.exe /c npm.cmd test -- tests/components/Sidebar.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/components/Sidebar.tsx tests/components/Sidebar.test.tsx
git commit -m "feat: prepare navigation for mobile layout"
```

### Task 8: Add responsive CSS for 375px portrait

**Files:**
- Modify: `src/styles/app.css`

- [ ] **Step 1: Inspect current layout CSS**

Read the surrounding blocks for:

- `.app-shell`
- `.sidebar`
- `.workspace`
- `.detail-panel`
- `.content-panel`
- `.map-panel`
- `.map-toolbar`
- `.map-viewport`
- form and button rules

- [ ] **Step 2: Add mobile media query**

Append a focused media query near the end of `src/styles/app.css`:

```css
@media (max-width: 760px) {
  .app-shell {
    min-height: 100dvh;
    display: block;
    padding-bottom: calc(72px + env(safe-area-inset-bottom));
  }

  .sidebar {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 20;
    width: auto;
    min-height: 0;
    border-right: 0;
    border-top: 1px solid var(--border-color);
    padding: 8px max(8px, env(safe-area-inset-left)) calc(8px + env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-right));
  }

  .brand {
    display: none;
  }

  .nav-list {
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: minmax(76px, 1fr);
    gap: 6px;
    overflow-x: auto;
  }

  .nav-item {
    min-height: 44px;
    justify-content: center;
    padding: 8px;
    font-size: 0.82rem;
    white-space: nowrap;
  }

  .workspace {
    padding: 12px;
    gap: 12px;
  }

  .detail-panel,
  .content-panel,
  .map-panel {
    border-radius: 8px;
  }

  .map-viewport {
    min-height: min(62dvh, 560px);
  }

  .editor-form,
  .inline-form {
    grid-template-columns: 1fr;
  }

  button,
  input,
  select,
  textarea {
    min-height: 44px;
  }
}
```

Adjust variable names to match the existing CSS. If no `--border-color` exists, use the existing border variable or current border color.

- [ ] **Step 3: Run build verification**

Run:

```powershell
cmd.exe /c npm.cmd run build
```

Expected: CSS compiles through Vite build.

- [ ] **Step 4: Manual viewport verification**

Start the server:

```powershell
cmd.exe /c npm.cmd run dev
```

Open `http://localhost:1420/` and check at `375x812`:

- Bottom navigation is reachable.
- Map remains visible and usable.
- Settings text and buttons do not overflow.
- Plant editor controls are touch-friendly.
- Desktop width still uses the sidebar.

- [ ] **Step 5: Commit**

```powershell
git add src/styles/app.css
git commit -m "feat: add mobile responsive layout"
```

### Task 9: Final verification for shareable PWA stage

**Files:**
- No required edits unless verification reveals issues.

- [ ] **Step 1: Run full automated checks**

Run:

```powershell
cmd.exe /c npm.cmd run typecheck
cmd.exe /c npm.cmd test
cmd.exe /c npm.cmd run build
```

Expected: all pass.

- [ ] **Step 2: Run GitHub Pages base build**

Run:

```powershell
$env:VITE_BASE_PATH="/garden/"; cmd.exe /c npm.cmd run build
```

Expected: build succeeds. Inspect `dist/index.html` and confirm built JS/CSS asset references use the configured `/garden/` base path. Confirm `dist/manifest.webmanifest`, `dist/icons/icon-192.png`, `dist/icons/icon-512.png`, and `dist/sw.js` exist.

- [ ] **Step 3: Preview production build**

Run:

```powershell
cmd.exe /c npm.cmd run preview -- --port 3000
```

Check:

- App loads.
- Manifest is reachable.
- Service worker registers without breaking app load.
- Settings has no technical AI/OpenAI/API wording.
- Smart suggestions unavailable state is friendly if no proxy is configured.
- After one online load, switch the browser/devtools network state to offline, reload the app, and confirm the app shell still opens and existing local garden data remains visible.

- [ ] **Step 4: iOS/Android manual checks when deployed**

After GitHub Pages deployment:

- Open the URL on iPhone Safari and use Add to Home Screen.
- Launch from home screen and confirm standalone behavior.
- Open the URL on Android Chrome and install/add to home screen.
- Add or edit a plant, close the app, reopen, and confirm local data persists.
- After the deployed app has loaded once, enable airplane mode or otherwise go offline, relaunch from the home screen, and confirm the app shell plus existing garden data still appear.

- [ ] **Step 5: Commit fixes if needed**

If verification requires changes:

```powershell
git add <changed-files>
git commit -m "fix: complete mobile pwa verification"
```

---

## Notes for Implementation

- The worktree already contains unrelated modified files. Do not revert them. Review each touched file before editing and preserve existing user work.
- Keep deployment/backend AI out of this implementation. This stage only prepares UI and PWA behavior; hosted AI proxy gets its own later spec.
- Avoid adding a PWA plugin unless manual manifest/service worker becomes too brittle. The current scope is small enough for explicit files.
- Use ASCII in new files unless editing existing Swedish copy that already uses non-ASCII safely.
