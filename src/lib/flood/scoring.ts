import type {
  DailyPoint,
  DerivedNow,
  HourPoint,
  Place,
  RiskBreakdown,
  RiskLevel,
} from "./types";

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function levelFromScore(score: number): RiskLevel {
  if (score >= 70) return "CRITICAL";
  if (score >= 50) return "HIGH";
  if (score >= 28) return "MODERATE";
  return "LOW";
}

export function rainClass(mm24: number): string {
  if (mm24 >= 244.5) return "Extremely heavy";
  if (mm24 >= 124.5) return "Very heavy";
  if (mm24 >= 64.5) return "Heavy";
  if (mm24 >= 35.6) return "Rather heavy";
  if (mm24 >= 7.6) return "Moderate";
  if (mm24 >= 2.5) return "Light";
  if (mm24 > 0) return "Trace";
  return "Dry";
}

export function weatherLabel(code: number | null | undefined): string {
  if (code == null) return "Unknown";
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow / ice";
  if (code <= 82) return "Rain showers";
  if (code <= 86) return "Snow showers";
  if (code <= 99) return "Thunderstorm";
  return "Unknown";
}

/**
 * Composite urban flood index.
 * Flash = short-burst intensity (1h / 3h).
 * Riverine = 24h accumulation + runoff.
 * Saturation = near-surface soil moisture (antecedent wetness).
 * Terrain = how far the cell sits below the local mean elevation.
 */
export function floodScore(input: {
  p1: number;
  p3: number;
  p24: number;
  soil: number;
  runoff: number;
  elevDelta?: number;
}): RiskBreakdown {
  const flash = clamp(input.p1 * 4.2 + input.p3 * 1.7, 0, 100);
  const riverine = clamp(input.p24 * 0.72 + input.runoff * 2.1, 0, 100);
  const saturation = clamp(input.soil * 95, 0, 100);
  const terrain = clamp((input.elevDelta ?? 0) * 0.42, 0, 22);

  const score = clamp(
    flash * 0.36 + riverine * 0.34 + saturation * 0.2 + terrain,
    0,
    100,
  );

  return {
    score: Math.round(score),
    level: levelFromScore(score),
    flash: Math.round(flash),
    riverine: Math.round(riverine),
    saturation: Math.round(saturation),
    terrain: Math.round(terrain),
  };
}

function sumRange(arr: Array<number | null | undefined>, from: number, to: number) {
  let s = 0;
  for (let i = from; i <= to; i++) s += arr[i] ?? 0;
  return s;
}

export function hourlyRisk(input: {
  time: string[];
  precipitation: Array<number | null>;
  runoff: Array<number | null>;
  soil: Array<number | null>;
  probability?: Array<number | null>;
}): HourPoint[] {
  const n = input.time.length;
  const out: HourPoint[] = [];
  for (let i = 0; i < n; i++) {
    const p1 = input.precipitation[i] ?? 0;
    const p3 = sumRange(input.precipitation, Math.max(0, i - 2), i);
    const p24 = sumRange(input.precipitation, Math.max(0, i - 23), i);
    const soil = input.soil[i] ?? 0;
    const runoff = input.runoff[i] ?? 0;
    const r = floodScore({ p1, p3, p24, soil, runoff });
    out.push({
      time: input.time[i] ?? "",
      precip: p1,
      probability: input.probability?.[i] ?? null,
      runoff,
      soil,
      score: r.score,
      level: r.level,
    });
  }
  return out;
}

export function deriveNow(
  place: Place,
  hourly: HourPoint[],
  current: {
    temperature: number | null;
    humidity: number | null;
    wind: number | null;
    weatherCode: number | null;
    precipitation: number | null;
  },
  soilDeep: number,
): DerivedNow {
  const now = hourly[0];
  const window24 = hourly.slice(0, 24);
  const p1 = now?.precip ?? current.precipitation ?? 0;
  const p3 = window24.slice(0, 3).reduce((a, b) => a + b.precip, 0);
  const p24 = window24.reduce((a, b) => a + b.precip, 0);
  const soil = now?.soil ?? 0;
  const runoff = now?.runoff ?? 0;
  const risk = floodScore({ p1, p3, p24, soil, runoff });

  let peak: DerivedNow["peak"] = null;
  for (const h of window24) {
    if (!peak || h.score > peak.score) {
      peak = { time: h.time, score: h.score, precip: h.precip };
    }
  }

  return {
    ...risk,
    p1,
    p3,
    p24,
    soil,
    soilDeep,
    runoff,
    temperature: current.temperature,
    humidity: current.humidity,
    wind: current.wind,
    weatherCode: current.weatherCode,
    weatherLabel: weatherLabel(current.weatherCode),
    rainClass: rainClass(p24),
    peak,
    next24MaxPrecip: window24.reduce((m, h) => Math.max(m, h.precip), 0),
  };
}

export function applyScenario(now: DerivedNow, extraMm3h: number): DerivedNow {
  if (extraMm3h <= 0) return now;
  const p1 = now.p1 + extraMm3h / 3;
  const p3 = now.p3 + extraMm3h;
  const p24 = now.p24 + extraMm3h;
  const runoff = now.runoff + extraMm3h * 0.28;
  const soil = clamp(now.soil + extraMm3h * 0.004, 0, 0.72);
  const risk = floodScore({
    p1,
    p3,
    p24,
    soil,
    runoff,
    elevDelta: now.terrain > 0 ? now.terrain / 0.42 : 0,
  });
  return {
    ...now,
    ...risk,
    p1,
    p3,
    p24,
    soil,
    runoff,
    rainClass: rainClass(p24),
  };
}

export function toDaily(input: {
  time: string[];
  precipitation_sum: Array<number | null>;
  precipitation_hours?: Array<number | null>;
  weather_code?: Array<number | null>;
  precipitation_probability_max?: Array<number | null>;
}): DailyPoint[] {
  return input.time.map((date, i) => ({
    date,
    precip: input.precipitation_sum[i] ?? 0,
    hours: input.precipitation_hours?.[i] ?? 0,
    weatherCode: input.weather_code?.[i] ?? 0,
    probability: input.precipitation_probability_max?.[i] ?? null,
  }));
}

export const PLAYBOOK: Record<RiskLevel, { title: string; steps: string[] }> = {
  CRITICAL: {
    title: "Activate flood operations",
    steps: [
      "Close underpasses and known inundation corridors",
      "Pre-deploy pumps at drainage bottlenecks",
      "Issue a public warning for low-lying settlements",
      "Stand up a 24-hour operations desk",
    ],
  },
  HIGH: {
    title: "Elevated surface-flood watch",
    steps: [
      "Inspect storm drains and pumping stations",
      "Restrict movement through historic flood points",
      "Brief first responders and keep crews on standby",
      "Re-check the 3-hour accumulation every hour",
    ],
  },
  MODERATE: {
    title: "Heightened monitoring",
    steps: [
      "Clear debris from inlets and culverts",
      "Increase inspection cadence on low-lying roads",
      "Watch intensity bursts over the next 6 hours",
      "Keep field crews reachable",
    ],
  },
  LOW: {
    title: "Routine monitoring",
    steps: [
      "No elevated surface-flood signal in the current window",
      "Continue scheduled drain maintenance",
      "Revisit if 3-hour rainfall exceeds 20 mm",
    ],
  },
};

export const DEFAULT_PLACE: Place = {
  name: "New Delhi, IN",
  lat: 28.6139,
  lon: 77.209,
  country: "IN",
  elevation: 216,
};

export const DEFAULT_WATCHLIST: Place[] = [
  DEFAULT_PLACE,
  { name: "Mumbai, IN", lat: 19.076, lon: 72.8777, country: "IN" },
  { name: "Chennai, IN", lat: 13.0827, lon: 80.2707, country: "IN" },
  { name: "Kolkata, IN", lat: 22.5726, lon: 88.3639, country: "IN" },
  { name: "Guwahati, IN", lat: 26.1445, lon: 91.7362, country: "IN" },
  { name: "Patna, IN", lat: 25.5941, lon: 85.1376, country: "IN" },
  { name: "Kochi, IN", lat: 9.9312, lon: 76.2673, country: "IN" },
];

export function worldviewUrl(lat: number, lon: number) {
  const d = 1.6;
  const bbox = `${(lon - d).toFixed(3)},${(lat - d).toFixed(3)},${(lon + d).toFixed(3)},${(lat + d).toFixed(3)}`;
  return `https://worldview.earthdata.nasa.gov/?v=${bbox}&l=GPM_3IMERGHHE_06_precipitationCal,Coastlines_15m,Reference_Labels_15m,Reference_Features_15m&lg=true`;
}

export function samePlace(a: Place, b: Place) {
  return Math.abs(a.lat - b.lat) < 0.01 && Math.abs(a.lon - b.lon) < 0.01;
}
