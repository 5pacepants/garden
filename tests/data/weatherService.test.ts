import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { TauriWeatherService } from "../../src/data/weatherService";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

describe("weather service", () => {
  beforeEach(() => {
    vi.mocked(invoke).mockReset();
  });

  it("loads MET Norway forecast through the Tauri command", async () => {
    vi.mocked(invoke).mockResolvedValueOnce(
      JSON.stringify({
        properties: {
          meta: { updated_at: "2026-05-10T04:00:00Z" },
          timeseries: [],
        },
      }),
    );
    const service = new TauriWeatherService();

    const forecast = await service.loadForecast();

    expect(invoke).toHaveBeenCalledWith("fetch_weather_forecast");
    expect(forecast.locationName).toBe("Getingaryd Rastaborg");
    expect(forecast.updatedAt).toBe("2026-05-10T04:00:00Z");
  });
});
