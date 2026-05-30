import { describe, expect, it } from "vitest";
import { BrowserAiPlantSuggestionService } from "../../src/ai/browserAiPlantSuggestionService";
import { createPlantSuggestionService } from "../../src/ai/plantSuggestionServiceFactory";
import { UnavailablePlantSuggestionService } from "../../src/ai/unavailablePlantSuggestionService";

describe("createPlantSuggestionService", () => {
  it("uses the browser AI service while developing with smart suggestions enabled", () => {
    const service = createPlantSuggestionService({ enabled: true, isDevelopment: true });

    expect(service).toBeInstanceOf(BrowserAiPlantSuggestionService);
  });

  it("uses the unavailable service when smart suggestions are disabled", () => {
    const service = createPlantSuggestionService({ enabled: false, isDevelopment: true });

    expect(service).toBeInstanceOf(UnavailablePlantSuggestionService);
  });

  it("uses the unavailable service for public builds without an AI proxy", () => {
    const service = createPlantSuggestionService({ enabled: true, isDevelopment: false });

    expect(service).toBeInstanceOf(UnavailablePlantSuggestionService);
  });
});
