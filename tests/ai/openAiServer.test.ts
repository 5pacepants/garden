import { describe, expect, it, vi } from "vitest";
import { handleAiRequest } from "../../src/ai/openAiServer";

describe("openAiServer", () => {
  it("routes plant name suggestion requests when mounted under /api/ai", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ output_text: JSON.stringify({ suggestions: ["Lavendel"] }) }),
      }),
    );

    const response = createResponse();
    await handleAiRequest(createRequest("/plant-name-suggestions", { query: "lav" }), response, "test-key");

    expect(JSON.parse(response.body)).toEqual({ suggestions: ["Lavendel"] });
    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/responses",
      expect.objectContaining({
        body: expect.stringContaining("plant_name_suggestions"),
      }),
    );

    vi.unstubAllGlobals();
  });
});

function createRequest(url: string, body: unknown) {
  return {
    url,
    on(event: string, callback: (chunk?: string | Error) => void) {
      if (event === "data") {
        callback(JSON.stringify(body));
      }

      if (event === "end") {
        callback();
      }
    },
  };
}

function createResponse() {
  return {
    body: "",
    statusCode: 0,
    setHeader: vi.fn(),
    end(body: string) {
      this.body = body;
    },
  };
}
