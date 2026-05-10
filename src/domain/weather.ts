export type GardenWeatherHour = {
  time: string;
  temperatureC: number;
  precipitationMm: number;
  windSpeedMs: number;
};

export type GardenWeatherForecast = {
  updatedAt: string;
  locationName: string;
  hours: GardenWeatherHour[];
};

export type GardenWeatherWarningType = "frost" | "watering" | "drought" | "wind";

export type GardenWeatherWarning = {
  id: string;
  type: GardenWeatherWarningType;
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
};

export type MetLocationForecast = {
  properties: {
    meta: {
      updated_at: string;
    };
    timeseries: Array<{
      time: string;
      data: {
        instant: {
          details: {
            air_temperature?: number;
            wind_speed?: number;
          };
        };
        next_1_hours?: {
          details?: {
            precipitation_amount?: number;
          };
        };
      };
    }>;
  };
};

export function normalizeMetForecast(data: MetLocationForecast, locationName: string): GardenWeatherForecast {
  return {
    updatedAt: data.properties.meta.updated_at,
    locationName,
    hours: data.properties.timeseries.map((item) => ({
      time: item.time,
      temperatureC: item.data.instant.details.air_temperature ?? 0,
      precipitationMm: item.data.next_1_hours?.details?.precipitation_amount ?? 0,
      windSpeedMs: item.data.instant.details.wind_speed ?? 0,
    })),
  };
}

export function analyzeGardenWeather(forecast: GardenWeatherForecast): GardenWeatherWarning[] {
  const warnings: GardenWeatherWarning[] = [];
  const next72Hours = forecast.hours.slice(0, 72);
  const minTemperature = Math.min(...next72Hours.map((hour) => hour.temperatureC));
  const totalRain = next72Hours.reduce((sum, hour) => sum + hour.precipitationMm, 0);
  const warmHours = next72Hours.filter((hour) => hour.temperatureC >= 25).length;
  const maxWind = Math.max(...next72Hours.map((hour) => hour.windSpeedMs));

  if (Number.isFinite(minTemperature) && minTemperature < 2) {
    warnings.push({
      id: "weather-frost",
      type: "frost",
      severity: minTemperature <= 0 ? "high" : "medium",
      title: minTemperature <= 0 ? "Frostrisk" : "Risk för nattkyla",
      description:
        minTemperature <= 0
          ? "Prognosen visar minusgrader. Skydda känsliga och nyplanterade växter."
          : "Prognosen går nära noll. Håll koll på känsliga växter.",
    });
  }

  if (next72Hours.length >= 48 && totalRain < 2 && warmHours >= 6) {
    warnings.push({
      id: "weather-watering",
      type: "watering",
      severity: "medium",
      title: "Extra bevattning kan behövas",
      description: "Det väntas varmt väder och lite regn de närmaste dagarna.",
    });
  }

  if (next72Hours.length >= 72 && totalRain < 1) {
    warnings.push({
      id: "weather-drought",
      type: "drought",
      severity: "low",
      title: "Torr period",
      description: "Prognosen visar nästan ingen nederbörd de kommande tre dygnen.",
    });
  }

  if (Number.isFinite(maxWind) && maxWind >= 12) {
    warnings.push({
      id: "weather-wind",
      type: "wind",
      severity: maxWind >= 17 ? "high" : "medium",
      title: "Blåsigt väder",
      description: "Kontrollera stöd för nyplanterade eller höga växter.",
    });
  }

  return warnings;
}
