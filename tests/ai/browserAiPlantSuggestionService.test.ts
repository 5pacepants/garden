import { describe, expect, it, vi } from "vitest";
import { BrowserAiPlantSuggestionService } from "../../src/ai/browserAiPlantSuggestionService";

describe("BrowserAiPlantSuggestionService", () => {
  it("calls the default browser fetch with the window/global context", async () => {
    const fetchMock = vi.fn(function (this: unknown) {
      if (this !== globalThis) {
        throw new TypeError("'fetch' called on an object that does not implement interface Window.");
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({ suggestions: ["Lavendel"] }),
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new BrowserAiPlantSuggestionService();

    await expect(service.suggestPlantNames({ query: "lav" })).resolves.toEqual(["Lavendel"]);

    vi.unstubAllGlobals();
  });

  it("fetches plant suggestions from the local API endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        swedishName: "Lavendel",
        latinName: "Lavandula angustifolia",
        type: "perennial",
        needs: { light: ["sun"], moisture: ["dry"] },
        floweringMonths: [7, 8],
        heightCm: 45,
        widthCm: 45,
        tags: ["pollinator-friendly", "fragrant"],
        notes: "Trivs i soligt och väldränerat läge.",
        careSchedule: [],
      }),
    });
    const service = new BrowserAiPlantSuggestionService(fetchMock);

    const suggestion = await service.suggestPlant({ name: "Lavendel" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/plant-suggestion",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ name: "Lavendel" }),
      }),
    );
    expect(suggestion.tags).toContain("fragrant");
  });

  it("fetches autocomplete plant names from the local API endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ suggestions: ["Lavendel", "Lavandin"] }),
    });
    const service = new BrowserAiPlantSuggestionService(fetchMock);

    await expect(service.suggestPlantNames({ query: "lav" })).resolves.toEqual(["Lavendel", "Lavandin"]);
  });

  it("fetches plant recommendations from the local API endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        recommendations: [
          {
            swedishName: "Stäppsalvia",
            latinName: "Salvia nemorosa",
            reason: "Passar i soligt läge med normal fukt.",
            type: "perennial",
            light: ["sun"],
            moisture: ["normal"],
            tags: ["pollinator-friendly"],
          },
        ],
      }),
    });
    const service = new BrowserAiPlantSuggestionService(fetchMock);

    const recommendations = await service.recommendPlants({ context: "Solig zon" });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/ai/plant-recommendations",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ context: "Solig zon" }),
      }),
    );
    expect(recommendations[0].swedishName).toBe("Stäppsalvia");
  });
});
