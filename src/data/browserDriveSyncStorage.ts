import type { DriveSyncStorage } from "./driveSyncGardenRepository";

type Fetcher = typeof fetch;
const defaultFetcher: Fetcher = (input, init) => globalThis.fetch(input, init);

const endpoint = "/api/drive-sync/garden-state";

export class BrowserDriveSyncStorage implements DriveSyncStorage {
  constructor(private readonly fetcher: Fetcher = defaultFetcher) {}

  async read(): Promise<string | null> {
    try {
      const response = await this.fetcher(endpoint);
      if (!response.ok) {
        return null;
      }

      return response.text();
    } catch {
      return null;
    }
  }

  async write(json: string): Promise<void> {
    const response = await this.fetcher(endpoint, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: json,
    });

    if (!response.ok) {
      throw new Error("Kunde inte skriva drive-sync backup.");
    }
  }
}
