import { invoke } from "@tauri-apps/api/core";
import { normalizeMetForecast, type GardenWeatherForecast, type MetLocationForecast } from "../domain/weather";

const gardenLocationName = "Getingaryd Rastaborg";

export interface WeatherService {
  loadForecast(): Promise<GardenWeatherForecast>;
}

export class TauriWeatherService implements WeatherService {
  async loadForecast(): Promise<GardenWeatherForecast> {
    const json = await invoke<string>("fetch_weather_forecast");
    return normalizeMetForecast(JSON.parse(json) as MetLocationForecast, gardenLocationName);
  }
}
