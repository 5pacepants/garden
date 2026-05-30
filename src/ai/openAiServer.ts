import {
  plantNameSuggestionsJsonSchema,
  plantRecommendationsJsonSchema,
  plantSuggestionJsonSchema,
} from "./openAiSchemas";

declare const process: { cwd(): string };

type AiEndpoint = "plant-suggestion" | "plant-name-suggestions" | "plant-recommendations";
type LocalAiRequest = {
  url?: string;
  on(event: "data", callback: (chunk: string) => void): void;
  on(event: "end", callback: () => void): void;
  on(event: "error", callback: (error: Error) => void): void;
};
type LocalAiResponse = {
  statusCode: number;
  setHeader(name: string, value: string): void;
  end(body: string): void;
};

export async function handleAiRequest(
  request: LocalAiRequest,
  response: LocalAiResponse,
  apiKey: string | undefined,
  model = "gpt-4.1-mini",
) {
  const endpoint = parseAiEndpoint(request.url);
  if (!endpoint) {
    sendJson(response, 404, { error: "Okänd AI-route." });
    return;
  }

  if (!apiKey) {
    sendJson(response, 503, { error: "OPENAI_API_KEY saknas i .env.local." });
    return;
  }

  const body = await readJsonBody(request);
  const result = await requestOpenAi(apiKey, model, endpoint, body);
  sendJson(response, 200, result);
}

async function requestOpenAi(apiKey: string, model: string, endpoint: AiEndpoint, body: unknown): Promise<unknown> {
  const spec = createEndpointSpec(endpoint, body as Record<string, unknown>);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "system",
          content:
            "Du är en svensk trädgårdsassistent. Svara med strukturerad JSON för en privat trädgårdsapp. Använd svenska växtnamn och praktiska, försiktiga råd. Lägg generell växtbeskrivning i plantInfo. Skriv aldrig personliga anteckningar i notes.",
        },
        {
          role: "user",
          content: spec.prompt,
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: spec.schemaName,
          strict: false,
          schema: spec.schema,
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(await formatOpenAiError(response));
  }

  const payload = await response.json();
  const text = extractResponseText(payload);
  if (!text) {
    throw new Error("OpenAI-svaret saknade text.");
  }

  return JSON.parse(text);
}

function createEndpointSpec(endpoint: AiEndpoint, body: Record<string, unknown>) {
  if (endpoint === "plant-name-suggestions") {
    return {
      schemaName: "plant_name_suggestions",
      schema: plantNameSuggestionsJsonSchema,
      prompt: `Föreslå upp till 6 sannolika växtnamn på svenska för sökningen: ${String(body.query ?? "")}`,
    };
  }

  if (endpoint === "plant-recommendations") {
    return {
      schemaName: "plant_recommendations",
      schema: plantRecommendationsJsonSchema,
      prompt: `Rekommendera 3 växter att köpa för denna plats. Motivera kort och praktiskt.\n\nPlatsdata:\n${String(body.context ?? "")}`,
    };
  }

  return {
    schemaName: "plant_suggestion",
    schema: plantSuggestionJsonSchema,
    prompt: `Föreslå komplett växtdata och skötselschema för växten: ${String(body.name ?? "")}\n\nOm växten ger ätbar frukt, bär, nötter, blad, rot, frö, krydda eller annan ätbar del ska tags alltid innehålla "edible". Fyll harvestMonths med månaderna då den ätbara delen normalt är skördeklar eller ätmogen i Sverige. Detta gäller även när blommorna inte är ätbara.\n\nOm växten lockar eller är viktig för pollinatörer, bin, humlor, fjärilar eller ger nektar ska tags alltid innehålla "pollinator-friendly".`,
  };
}

function parseAiEndpoint(url: string | undefined): AiEndpoint | null {
  const path = (url ?? "").split("?")[0].replace(/^\/api\/ai\/?/, "").replace(/^\//, "");
  if (path === "plant-name-suggestions" || path === "plant-recommendations" || path === "plant-suggestion") {
    return path;
  }

  return null;
}

async function formatOpenAiError(response: Response): Promise<string> {
  const fallback = `OpenAI svarade ${response.status}.`;

  try {
    const text = await response.text();
    if (!text) return fallback;
    const parsed = JSON.parse(text) as { error?: { message?: string } };
    return `OpenAI svarade ${response.status}: ${parsed.error?.message ?? text}`;
  } catch {
    return fallback;
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

function readJsonBody(request: LocalAiRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

function sendJson(response: LocalAiResponse, status: number, payload: unknown) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}
