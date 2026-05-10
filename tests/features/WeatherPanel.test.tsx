import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WeatherPanel } from "../../src/features/weather/WeatherPanel";
import type { GardenWeatherForecast } from "../../src/domain/weather";

describe("WeatherPanel", () => {
  it("shows garden weather warnings from the weather service", async () => {
    const forecast: GardenWeatherForecast = {
      locationName: "Getingaryd Rastaborg",
      updatedAt: "2026-05-10T08:00:00Z",
      hours: [
        {
          time: "2026-05-10T23:00:00Z",
          temperatureC: -1,
          precipitationMm: 0,
          windSpeedMs: 2,
        },
      ],
    };

    render(
      <WeatherPanel
        weatherService={{
          loadForecast: async () => forecast,
        }}
      />,
    );

    expect(await screen.findByText("Getingaryd Rastaborg")).toBeInTheDocument();
    expect(screen.getByText("Frost")).toBeInTheDocument();
    expect(screen.getByText(/-1.0 °C/)).toBeInTheDocument();
  });
});
