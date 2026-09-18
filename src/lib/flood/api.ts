import {
  deriveNow,
  floodScore,
  hourlyRisk,
  toDaily,
} from "./scoring";
import type { FloodBundle, GridCell, Place, WatchScore } from "./types";

const FORECAST = "https://api.open-meteo.com/v1/forecast";
const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE = "https://geocoding-api.open-meteo.com/v1/reverse";
const ELEV = "https://api.open-meteo.com/v1/elevation";
const METNO = "https://api.met.no/weatherapi/locationforecast/2.0/complete";
const METNO_COMPACT = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
const NOMINATIM = "https://nominatim.openstreetmap.org";

const HOURLY =
  "precipitation,rain,precipitation_probability,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,runoff,weather_code,temperature_2m,wind_speed_10m";
const CURRENT =
  "temperature_2m,precipitation,rain,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature";
const DAILY =
  "precipitation_sum,precipitation_hours,rain_sum,weather_code,precipitation_probability_max";

type ForecastPayload = {
  latitude: number;
  longitude: number;
  timezone?: string;
  current?: {
    temperature_2m?: number | null;
    precipitation?: number | null;
    weather_code?: number | null;
    wind_speed_10m?: number | null;
    relative_humidity_2m?: number | null;
  };
  hourly?: {
    time: string[];
    precipitation: Array<number | null>;
    runoff: Array<number | null>;
    soil_moisture_0_to_7cm: Array<number | null>;
    soil_moisture_7_to_28cm?: Array<number | null>;
    precipitation_probability?: Array<number | null>;
  };
  daily?: {
    time: string[];
    precipitation_sum: Array<number | null>;
    precipitation_hours?: Array<number | null>;
    weather_code?: Array<number | null>;
    precipitation_probability_max?: Array<number | null>;
  };
};

type MetNoResponse = {
  geometry?: { coordinates?: number[] };
  properties?: {
    timeseries?: Array<{
      time: string;
      data: {
        instant?: {
          details?: {
            air_temperature?: number;
            relative_humidity?: number;
            wind_speed?: number;
          };
        };
        next_1_hours?: {
          summary?: { symbol_code?: string };
          details?: { precipitation_amount?: number };
        };
        next_6_hours?: {
          summary?: { symbol_code?: string };
          details?: { precipitation_amount?: number };
        };
      };
    }>;
  };
};

function asList<T>(data: T | T[]): T[] {
  return Array.isArray(data) ? data : [data];
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Feed unavailable (${res.status})`);
  const data = (await res.json()) as T & { error?: boolean; reason?: string };
  if (data && typeof data === "object" && "error" in data && data.error) {
    throw new Error(data.reason ?? "Feed unavailable");
  }
  return data;
}

export async function searchPlaces(query: string): Promise<Place[]> {
  try {
    const url = `${GEO}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
    const data = await getJson<{
      results?: Array<{
        name: string;
        country_code?: string;
        admin1?: string;
        latitude: number;
        longitude: number;
        elevation?: number;
      }>;
    }>(url);
    const hits = (data.results ?? []).map((x) => ({
      name: [x.name, x.admin1, x.country_code].filter(Boolean).join(", "),
      lat: x.latitude,
      lon: x.longitude,
      country: x.country_code,
      admin: x.admin1,
      elevation: x.elevation,
    }));
    if (hits.length) return hits;
  } catch {
    /* nominatim */
  }
  const url = `${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=6`;
  const data = await getJson<
    Array<{ display_name: string; lat: string; lon: string; name?: string }>
  >(url);
  return data.map((x) => ({
    name: x.name ? x.display_name.split(",").slice(0, 3).join(",") : x.display_name,
    lat: Number(x.lat),
    lon: Number(x.lon),
  }));
}

export async function reversePlace(lat: number, lon: number): Promise<Place> {
  try {
    const url = `${REVERSE}?latitude=${lat}&longitude=${lon}&language=en&format=json`;
    const data = await getJson<{
      results?: Array<{
        name: string;
        country_code?: string;
        admin1?: string;
        elevation?: number;
      }>;
    }>(url);
    const hit = data.results?.[0];
    if (hit) {
      return {
        name: [hit.name, hit.admin1, hit.country_code].filter(Boolean).join(", "),
        lat,
        lon,
        country: hit.country_code,
        admin: hit.admin1,
        elevation: hit.elevation,
      };
    }
  } catch {
    /* nominatim */
  }
  try {
    const url = `${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`;
    const data = await getJson<{ display_name?: string; name?: string }>(url);
    return {
      name: data.name ?? data.display_name ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
      lat,
      lon,
    };
  } catch {
    return { name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`, lat, lon };
  }
}

function gridPoints(place: Place) {
  const steps = [-1, 0, 1];
  const dlat = 0.06;
  const dlon = 0.06 / Math.max(0.35, Math.cos((place.lat * Math.PI) / 180));
  const cells: { lat: number; lon: number }[] = [];
  for (const dy of steps) {
    for (const dx of steps) {
      cells.push({ lat: place.lat + dy * dlat, lon: place.lon + dx * dlon });
    }
  }
  return cells;
}

async function fetchElevations(points: { lat: number; lon: number }[]) {
  const url = `${ELEV}?latitude=${points.map((p) => p.lat.toFixed(4)).join(",")}&longitude=${points.map((p) => p.lon.toFixed(4)).join(",")}`;
  const data = await getJson<{ elevation: number[] }>(url);
  return data.elevation ?? points.map(() => 0);
}

async function fetchRiskGrid(place: Place): Promise<GridCell[]> {
  const points = gridPoints(place);
  const lats = points.map((p) => p.lat.toFixed(4)).join(",");
  const lons = points.map((p) => p.lon.toFixed(4)).join(",");
  const url = `${FORECAST}?latitude=${lats}&longitude=${lons}&hourly=precipitation,soil_moisture_0_to_7cm,runoff&forecast_days=1&timezone=auto`;

  const [forecasts, elevations] = await Promise.all([
    getJson<ForecastPayload | ForecastPayload[]>(url).then(asList),
    fetchElevations(points).catch(() => points.map(() => place.elevation ?? 0)),
  ]);

  const meanElev =
    elevations.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) /
    Math.max(1, elevations.length);

  return points.map((p, i) => {
    const f = forecasts[i] ?? forecasts[0];
    const h = f?.hourly;
    const precip = h?.precipitation ?? [];
    const soil = h?.soil_moisture_0_to_7cm ?? [];
    const runoff = h?.runoff ?? [];
    const p3 = precip.slice(0, 3).reduce<number>((a, b) => a + (b ?? 0), 0);
    const p24 = precip.slice(0, 24).reduce<number>((a, b) => a + (b ?? 0), 0);
    const soil0 = soil[0] ?? 0;
    const run0 = runoff[0] ?? 0;
    const elevation = elevations[i] ?? meanElev;
    const elevDelta = meanElev - elevation;
    const risk = floodScore({
      p1: precip[0] ?? 0,
      p3,
      p24,
      soil: soil0,
      runoff: run0,
      elevDelta,
    });
    return {
      lat: p.lat,
      lon: p.lon,
      elevation,
      elevDelta,
      p3,
      p24,
      soil: soil0,
      runoff: run0,
      score: risk.score,
      level: risk.level,
    };
  });
}

async function fetchOpenMeteoBundle(place: Place): Promise<FloodBundle> {
  const url =
    `${FORECAST}?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=${CURRENT}&hourly=${HOURLY}&daily=${DAILY}` +
    `&forecast_days=7&timezone=auto`;

  const [forecast, grid] = await Promise.all([
    getJson<ForecastPayload>(url),
    fetchRiskGrid(place).catch(() => [] as GridCell[]),
  ]);

  const hourlySrc = forecast.hourly;
  if (!hourlySrc?.time?.length) throw new Error("Forecast feed returned no hourly series");

  const hourly = hourlyRisk({
    time: hourlySrc.time,
    precipitation: hourlySrc.precipitation,
    runoff: hourlySrc.runoff,
    soil: hourlySrc.soil_moisture_0_to_7cm,
    probability: hourlySrc.precipitation_probability,
  });

  const daily = forecast.daily ? toDaily(forecast.daily) : [];

  const derived = deriveNow(
    place,
    hourly,
    {
      temperature: forecast.current?.temperature_2m ?? null,
      humidity: forecast.current?.relative_humidity_2m ?? null,
      wind: forecast.current?.wind_speed_10m ?? null,
      weatherCode: forecast.current?.weather_code ?? null,
      precipitation: forecast.current?.precipitation ?? null,
    },
    hourlySrc.soil_moisture_7_to_28cm?.[0] ?? 0,
  );

  return {
    place: {
      ...place,
      elevation:
        place.elevation ??
        grid.find((c) => Math.abs(c.lat - place.lat) < 0.02)?.elevation,
    },
    derived,
    hourly,
    daily,
    grid,
    syncedAt: new Date().toISOString(),
    source: "open-meteo",
  };
}

function symbolToCode(symbol?: string): number {
  const s = symbol ?? "";
  if (s.includes("thunder")) return 95;
  if (s.includes("heavyrain")) return 65;
  if (s.includes("rainshowers") || s.includes("lightrain")) return 80;
  if (s.includes("rain")) return 63;
  if (s.includes("fog")) return 45;
  if (s.includes("cloudy")) return 3;
  if (s.includes("fair") || s.includes("partly")) return 2;
  return 0;
}

function moistureBucket(precip: number[]) {
  const soil: number[] = [];
  const runoff: number[] = [];
  let wet = 0.16;
  for (let i = 0; i < precip.length; i++) {
    const p = precip[i] ?? 0;
    wet = Math.max(0.1, Math.min(0.65, wet * 0.986 + p * 0.014));
    soil.push(wet);
    const abstraction = 7.5 * (1 - wet);
    runoff.push(Math.max(0, p - abstraction) * (0.3 + wet * 0.55));
  }
  return { soil, runoff };
}

function parseMetNo(data: MetNoResponse, place: Place): FloodBundle {
  const series = data.properties?.timeseries ?? [];
  if (series.length === 0) throw new Error("MET Norway returned an empty series");

  const time: string[] = [];
  const precipitation: number[] = [];
  for (const step of series) {
    const p1 = step.data.next_1_hours?.details?.precipitation_amount;
    if (p1 == null) continue;
    time.push(step.time);
    precipitation.push(p1);
  }
  if (time.length < 6) {
    for (const step of series) {
      const p6 = step.data.next_6_hours?.details?.precipitation_amount;
      if (p6 == null) continue;
      time.push(step.time);
      precipitation.push(p6 / 6);
    }
  }
  if (time.length === 0) throw new Error("MET Norway returned no precipitation steps");

  const { soil, runoff } = moistureBucket(precipitation);
  const hourly = hourlyRisk({
    time,
    precipitation,
    runoff,
    soil,
  });

  const byDay = new Map<string, { precip: number; hours: number; code: number }>();
  series.forEach((step, i) => {
    const day = step.time.slice(0, 10);
    const amount =
      step.data.next_1_hours?.details?.precipitation_amount ??
      (step.data.next_6_hours?.details?.precipitation_amount ?? 0) / 6;
    const cur = byDay.get(day) ?? { precip: 0, hours: 0, code: 0 };
    cur.precip += amount;
    if (amount > 0.1) cur.hours += 1;
    if (i === 12 || !cur.code) cur.code = symbolToCode(step.data.next_1_hours?.summary?.symbol_code);
    byDay.set(day, cur);
  });
  const daily = [...byDay.entries()].slice(0, 7).map(([date, v]) => ({
    date,
    precip: v.precip,
    hours: v.hours,
    weatherCode: v.code,
    probability: null,
  }));

  const now = series[0]?.data;
  const derived = deriveNow(
    place,
    hourly,
    {
      temperature: now?.instant?.details?.air_temperature ?? null,
      humidity: now?.instant?.details?.relative_humidity ?? null,
      wind: now?.instant?.details?.wind_speed ?? null,
      weatherCode: symbolToCode(now?.next_1_hours?.summary?.symbol_code),
      precipitation: now?.next_1_hours?.details?.precipitation_amount ?? null,
    },
    soil[0] ?? 0.16,
  );

  const elev = data.geometry?.coordinates?.[2];
  const center: GridCell = {
    lat: place.lat,
    lon: place.lon,
    elevation: elev ?? place.elevation ?? 0,
    elevDelta: 0,
    p3: derived.p3,
    p24: derived.p24,
    soil: derived.soil,
    runoff: derived.runoff,
    score: derived.score,
    level: derived.level,
  };

  return {
    place: { ...place, elevation: place.elevation ?? elev },
    derived,
    hourly,
    daily,
    grid: [center],
    syncedAt: new Date().toISOString(),
    source: "met-norway",
  };
}

async function fetchMetNoBundle(place: Place): Promise<FloodBundle> {
  const url = `${METNO}?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}`;
  const data = await getJson<MetNoResponse>(url);
  return parseMetNo(data, place);
}

export async function fetchFloodBundle(place: Place): Promise<FloodBundle> {
  try {
    return await fetchMetNoBundle(place);
  } catch {
    return await fetchOpenMeteoBundle(place);
  }
}

export async function fetchWatchScores(places: Place[]): Promise<WatchScore[]> {
  if (places.length === 0) return [];
  try {
    const results = await Promise.all(
      places.map(async (place) => {
        const url = `${METNO_COMPACT}?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}`;
        const data = await getJson<MetNoResponse>(url);
        const series = data.properties?.timeseries ?? [];
        const precip = series
          .map((s) => s.data.next_1_hours?.details?.precipitation_amount)
          .filter((n): n is number => n != null);
        const p1 = precip[0] ?? 0;
        const p3 = precip.slice(0, 3).reduce((a, b) => a + b, 0);
        const p24 = precip.slice(0, 24).reduce((a, b) => a + b, 0);
        const { soil, runoff } = moistureBucket(precip);
        const risk = floodScore({
          p1,
          p3,
          p24,
          soil: soil[0] ?? 0.16,
          runoff: runoff[0] ?? 0,
        });
        return { place, score: risk.score, level: risk.level, p24 };
      }),
    );
    return results;
  } catch {
    const lats = places.map((p) => p.lat.toFixed(4)).join(",");
    const lons = places.map((p) => p.lon.toFixed(4)).join(",");
    const url = `${FORECAST}?latitude=${lats}&longitude=${lons}&hourly=precipitation,soil_moisture_0_to_7cm,runoff&forecast_days=1&timezone=auto`;
    const forecasts = asList(await getJson<ForecastPayload | ForecastPayload[]>(url));
    return places.map((place, i) => {
      const h = forecasts[i]?.hourly ?? forecasts[0]?.hourly;
      const precip = h?.precipitation ?? [];
      const p1 = precip[0] ?? 0;
      const p3 = precip.slice(0, 3).reduce<number>((a, b) => a + (b ?? 0), 0);
      const p24 = precip.slice(0, 24).reduce<number>((a, b) => a + (b ?? 0), 0);
      const soil = h?.soil_moisture_0_to_7cm?.[0] ?? 0;
      const runoff = h?.runoff?.[0] ?? 0;
      const risk = floodScore({ p1, p3, p24, soil, runoff });
      return { place, score: risk.score, level: risk.level, p24 };
    });
  }
}
