import type { PlantSuggestionService } from "./plantSuggestionService";
import type { PlantRecommendation, PlantSuggestion } from "./plantSuggestionSchema";

const unavailableMessage =
  "Smarta forslag ar inte tillgangliga just nu. Fyll i detaljerna manuellt och forsok igen senare.";

export class UnavailablePlantSuggestionService implements PlantSuggestionService {
  async suggestPlant(): Promise<PlantSuggestion> {
    throw new Error(unavailableMessage);
  }

  async suggestPlantNames() {
    return [];
  }

  async recommendPlants(): Promise<PlantRecommendation[]> {
    throw new Error(unavailableMessage);
  }
}
