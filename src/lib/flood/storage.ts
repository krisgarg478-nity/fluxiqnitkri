import { DEFAULT_PLACE, DEFAULT_WATCHLIST } from "./scoring";
import type { Place } from "./types";

const PLACE_KEY = "fluxiq.place.v1";
const WATCH_KEY = "fluxiq.watchlist.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota */
  }
}

export function loadSavedPlace(): Place {
  const p = read<Place | null>(PLACE_KEY, null);
  if (p && typeof p.lat === "number" && typeof p.lon === "number") return p;
  return DEFAULT_PLACE;
}

export function savePlace(place: Place) {
  write(PLACE_KEY, place);
}

export function loadWatchlist(): Place[] {
  const list = read<Place[] | null>(WATCH_KEY, null);
  if (Array.isArray(list) && list.length > 0) return list;
  return DEFAULT_WATCHLIST;
}

export function saveWatchlist(list: Place[]) {
  write(WATCH_KEY, list);
}
