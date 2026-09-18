import { useCallback, useEffect, useState } from "react";
import { fetchFloodBundle, fetchWatchScores } from "@/lib/flood/api";
import type { FeedStatus, FloodBundle, Place, WatchScore } from "@/lib/flood/types";

export function useFloodData(place: Place) {
  const [status, setStatus] = useState<FeedStatus>("SYNCING");
  const [bundle, setBundle] = useState<FloodBundle | null>(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    setStatus("SYNCING");
    try {
      const next = await fetchFloodBundle(place);
      setBundle(next);
      setError("");
      setStatus("LIVE");
    } catch (e) {
      setStatus("DEGRADED");
      setError(e instanceof Error ? e.message : "Forecast feed unavailable");
    }
  }, [place]);

  useEffect(() => {
    let alive = true;
    setBundle(null);
    setStatus("SYNCING");
    fetchFloodBundle(place)
      .then((next) => {
        if (!alive) return;
        setBundle(next);
        setError("");
        setStatus("LIVE");
      })
      .catch((e) => {
        if (!alive) return;
        setStatus("DEGRADED");
        setError(e instanceof Error ? e.message : "Forecast feed unavailable");
      });
    const id = window.setInterval(() => {
      if (!alive) return;
      void reload();
    }, 600_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [place, reload]);

  return { status, bundle, error, reload };
}

export function useWatchScores(places: Place[]) {
  const [scores, setScores] = useState<WatchScore[]>([]);
  const key = places.map((p) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`).join("|");

  useEffect(() => {
    let alive = true;
    fetchWatchScores(places)
      .then((s) => {
        if (alive) setScores(s);
      })
      .catch(() => {
        if (alive) setScores([]);
      });
    return () => {
      alive = false;
    };
    // places is mirrored by key so we don't refetch on new array identity
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return scores;
}
