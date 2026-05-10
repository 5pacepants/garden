import type { PlantSuggestionService } from "./plantSuggestionService";
import {
  parsePlantNameSuggestions,
  parsePlantRecommendations,
  parsePlantSuggestion,
  type PlantRecommendation,
  type PlantSuggestion,
} from "./plantSuggestionSchema";

type Fetcher = typeof fetch;

export class BrowserAiPlantSuggestionService implements PlantSuggestionService {
  constructor(private readonly fetcher: Fetcher = (input, init) => globalThis.fetch(input, init)) {}

  async suggestPlant(input: { name: string }): Promise<PlantSuggestion> {
    return parsePlantSuggestion(await this.post("/api/ai/plant-suggestion", input));
  }

  async suggestPlantNames(input: { query: string }): Promise<string[]> {
    return parsePlantNameSuggestions(await this.post("/api/ai/plant-name-suggestions", input));
  }

  async recommendPlants(input: { context: string }): Promise<PlantRecommendation[]> {
    return parsePlantRecommendations(await this.post("/api/ai/plant-recommendations", input));
  }

  private async post(path: string, body: unknown): Promise<unknown> {
    const response = await this.fetcher(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const message = await readErrorMessage(response);
      throw new Error(message || `AI-anrop misslyckades (${response.status}).`);
    }

    return response.json();
  }
}

async function readErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error;
  } catch {
    return undefined;
  }
}
