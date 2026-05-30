import { BrowserAiPlantSuggestionService } from "./browserAiPlantSuggestionService";
import type { PlantSuggestionService } from "./plantSuggestionService";
import { UnavailablePlantSuggestionService } from "./unavailablePlantSuggestionService";

type PlantSuggestionServiceOptions = {
  enabled: boolean;
  isDevelopment: boolean;
};

export function createPlantSuggestionService(options: PlantSuggestionServiceOptions): PlantSuggestionService {
  if (!options.enabled) {
    return new UnavailablePlantSuggestionService();
  }

  if (options.isDevelopment) {
    return new BrowserAiPlantSuggestionService();
  }

  return new UnavailablePlantSuggestionService();
}
