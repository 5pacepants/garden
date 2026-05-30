import { describe, expect, it } from "vitest";
import { UnavailablePlantSuggestionService } from "../../src/ai/unavailablePlantSuggestionService";

describe("UnavailablePlantSuggestionService", () => {
  it("throws a friendly smart suggestions message", async () => {
    const service = new UnavailablePlantSuggestionService();

    await expect(service.suggestPlant({ name: "ros" })).rejects.toThrow(
      "Smarta forslag ar inte tillgangliga just nu.",
    );
  });

  it("returns no autocomplete suggestions while unavailable", async () => {
    const service = new UnavailablePlantSuggestionService();

    await expect(service.suggestPlantNames?.({ query: "ro" })).resolves.toEqual([]);
  });
});
