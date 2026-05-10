import { describe, expect, it } from "vitest";
import {
  analyzeGardenWeather,
  normalizeMetForecast,
  type GardenWeatherForecast,
  type MetLocationForecast,
} from "../../src/domain/weather";

describe("garden weather", () => {
  it("warns about frost when the forecast drops below two degrees", () => {
    const forecast: GardenWeatherForecast = {
      updatedAt: "2026-05-10T04:00:00Z",
      locationName: "Getingaryd Rastaborg",
      hours: [
        { time: "2026-05-10T22:00:00Z", temperatureC: 3, precipitationMm: 0, windSpeedMs: 2 },
        { time: "2026-05-11T02:00:00Z", temperatureC: -1, precipitationMm: 0, windSpeedMs: 2 },
      ],
    };

    const warnings = analyzeGardenWeather(forecast);

    expect(warnings).toContainEqual(
      expect.objectContaining({
        type: "frost",
        severity: "high",
      }),
    );
  });

  it("suggests extra watering after warm days with little rain", () => {
    const forecast: GardenWeatherForecast = {
      updatedAt: "2026-07-10T04:00:00Z",
      locationName: "Getingaryd Rastaborg",
      hours: Array.from({ length: 72 }, (_, index) => ({
        time: `2026-07-${String(10 + Math.floor(index / 24)).padStart(2, "0")}T${String(index % 24).padStart(2, "0")}:00:00Z`,
        temperatureC: index % 24 >= 11 && index % 24 <= 17 ? 28 : 18,
        precipitationMm: 0,
        windSpeedMs: 2,
      })),
    };

    const warnings = analyzeGardenWeather(forecast);

    expect(warnings).toContainEqual(
      expect.objectContaining({
        type: "watering",
        severity: "medium",
      }),
    );
  });

  it("normalizes MET Norway compact timeseries into hourly garden forecast data", () => {
    const metForecast: MetLocationForecast = {
      properties: {
        meta: { updated_at: "2026-05-10T04:00:00Z" },
        timeseries: [
          {
            time: "2026-05-10T05:00:00Z",
            data: {
              instant: {
                details: {
                  air_temperature: 6.5,
                  wind_speed: 3.2,
                },
              },
              next_1_hours: {
                details: {
                  precipitation_amount: 0.4,
                },
              },
            },
          },
        ],
      },
    };

    const forecast = normalizeMetForecast(metForecast, "Getingaryd Rastaborg");

    expect(forecast).toEqual({
      updatedAt: "2026-05-10T04:00:00Z",
      locationName: "Getingaryd Rastaborg",
      hours: [{ time: "2026-05-10T05:00:00Z", temperatureC: 6.5, precipitationMm: 0.4, windSpeedMs: 3.2 }],
    });
  });
});
