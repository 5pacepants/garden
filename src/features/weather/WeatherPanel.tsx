import { useEffect, useMemo, useState } from "react";
import { TauriWeatherService, type WeatherService } from "../../data/weatherService";
import { analyzeGardenWeather, type GardenWeatherForecast } from "../../domain/weather";

type WeatherPanelProps = {
  weatherService?: WeatherService;
};

type WeatherState =
  | { status: "loading"; forecast: null; error: null }
  | { status: "ready"; forecast: GardenWeatherForecast; error: null }
  | { status: "error"; forecast: null; error: string };

const defaultWeatherService = new TauriWeatherService();

const warningLabels = {
  drought: "Torka",
  frost: "Frost",
  watering: "Bevattning",
  wind: "Vind",
};

export function WeatherPanel({ weatherService = defaultWeatherService }: WeatherPanelProps) {
  const [state, setState] = useState<WeatherState>({ status: "loading", forecast: null, error: null });

  useEffect(() => {
    let isActive = true;

    weatherService
      .loadForecast()
      .then((forecast) => {
        if (isActive) {
          setState({ status: "ready", forecast, error: null });
        }
      })
      .catch((error: unknown) => {
        if (isActive) {
          setState({
            status: "error",
            forecast: null,
            error: error instanceof Error ? error.message : "Kunde inte hamta vader.",
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, [weatherService]);

  const warnings = useMemo(
    () => (state.forecast ? analyzeGardenWeather(state.forecast) : []),
    [state.forecast],
  );

  return (
    <section className="weather-panel" aria-label="Väder">
      <div className="weather-heading">
        <div>
          <span className="eyebrow">V&auml;der</span>
          <h2>{state.forecast?.locationName ?? "Getingaryd Rastaborg"}</h2>
        </div>
        {state.forecast ? <WeatherSnapshot forecast={state.forecast} /> : null}
      </div>

      {state.status === "loading" ? <p className="helper-text">H&auml;mtar v&auml;derprognos...</p> : null}
      {state.status === "error" ? <p className="form-error">Kunde inte h&auml;mta v&auml;der.</p> : null}

      {state.status === "ready" ? (
        warnings.length > 0 ? (
          <div className="weather-warning-list">
            {warnings.map((warning) => (
              <article className={`weather-warning ${warning.severity}`} key={warning.type}>
                <strong>{warningLabels[warning.type]}</strong>
                <span>{warning.description}</span>
              </article>
            ))}
          </div>
        ) : (
          <p className="helper-text">Inga v&auml;dervarningar just nu.</p>
        )
      ) : null}
    </section>
  );
}

function WeatherSnapshot({ forecast }: { forecast: GardenWeatherForecast }) {
  const firstHour = forecast.hours[0];
  const next72Hours = forecast.hours.slice(0, 72);
  const rainTotal = next72Hours.reduce((total, hour) => total + hour.precipitationMm, 0);

  if (!firstHour) {
    return null;
  }

  return (
    <div className="weather-snapshot">
      <span>{firstHour.temperatureC.toFixed(1)} &deg;C</span>
      <span>{rainTotal.toFixed(1)} mm / 72 h</span>
    </div>
  );
}
