import { parsePlantSuggestion, type PlantSuggestion } from "./plantSuggestionSchema";
import type { PlantSuggestionService } from "./plantSuggestionService";

export type OpenAiPlantSuggestionConfig = {
  apiKey: string;
  model: string;
};

export class OpenAiPlantSuggestionService implements PlantSuggestionService {
  constructor(private readonly config: OpenAiPlantSuggestionConfig) {}

  async suggestPlant(input: { name: string }): Promise<PlantSuggestion> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.config.model || "gpt-4.1-mini",
        input: [
          {
            role: "system",
            content:
              "Du föreslår strukturerad växtdata för en privat svensk trädgårdsapp. Svara bara med JSON som matchar schemat.",
          },
          {
            role: "user",
            content: `Föreslå växtdata och skötselschema för: ${input.name}`,
          },
        ],
        text: {
          format: {
            type: "json_object",
          },
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI request failed: ${response.status}`);
    }

    const payload = await response.json();
    const text = extractResponseText(payload);

    if (!text) {
      throw new Error("OpenAI response did not include text output");
    }

    return parsePlantSuggestion(JSON.parse(text));
  }
}

function extractResponseText(payload: unknown): string | undefined {
  const response = payload as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
  };

  if (response.output_text) {
    return response.output_text;
  }

  return response.output?.flatMap((item) => item.content ?? []).find((content) => content.text)?.text;
}
