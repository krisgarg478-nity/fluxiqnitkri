export type RiskLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export type FeedStatus = "LIVE" | "SYNCING" | "DEGRADED";

export type DataSource = "open-meteo" | "met-norway";

export type Place = {
  name: string;
  lat: number;
  lon: number;
  country?: string;
  admin?: string;
  elevation?: number;
};

export type RiskBreakdown = {
  score: number;
  level: RiskLevel;
  flash: number;
  riverine: number;
  saturation: number;
  terrain: number;
};

export type HourPoint = {
  time: string;
  precip: number;
  probability: number | null;
  runoff: number;
  soil: number;
  score: number;
  level: RiskLevel;
};

export type GridCell = {
  lat: number;
  lon: number;
  elevation: number;
  elevDelta: number;
  p3: number;
  p24: number;
  soil: number;
  runoff: number;
  score: number;
  level: RiskLevel;
};

export type DailyPoint = {
  date: string;
  precip: number;
  hours: number;
  weatherCode: number;
  probability: number | null;
};

export type DerivedNow = RiskBreakdown & {
  p1: number;
  p3: number;
  p24: number;
  soil: number;
  soilDeep: number;
  runoff: number;
  temperature: number | null;
  humidity: number | null;
  wind: number | null;
  weatherCode: number | null;
  weatherLabel: string;
  rainClass: string;
  peak: { time: string; score: number; precip: number } | null;
  next24MaxPrecip: number;
};

export type FloodBundle = {
  place: Place;
  derived: DerivedNow;
  hourly: HourPoint[];
  daily: DailyPoint[];
  grid: GridCell[];
  syncedAt: string;
  source: DataSource;
};

export type WatchScore = {
  place: Place;
  score: number;
  level: RiskLevel;
  p24: number;
};

export type MapLayer = "risk" | "rain" | "terrain";
