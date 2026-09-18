import {
  BookOpen,
  CloudRain,
  Droplets,
  ExternalLink,
  Locate,
  Pin,
  RefreshCw,
  Satellite,
  Waves,
} from "lucide-react";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertComposer } from "@/components/flood/alert-composer";
import { BriefPanel } from "@/components/flood/brief-panel";
import { HotspotPanel } from "@/components/flood/hotspot-panel";
import { ImpactBoard } from "@/components/flood/impact-board";
import { MethodologyBody, ProvenanceCard } from "@/components/flood/methodology";
import { RiskChart } from "@/components/flood/risk-chart";
import { SearchBox } from "@/components/flood/search-box";
import { useFloodData, useWatchScores } from "@/components/flood/use-flood-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { reversePlace } from "@/lib/flood/api";
import { formatDay, mm, riskDot } from "@/lib/flood/format";
import {
  estimateImpact,
  hotspotsFor,
  type Hotspot,
  type Role,
} from "@/lib/flood/hotspots";
import { DEFAULT_PLACE, DEFAULT_WATCHLIST, applyScenario, samePlace, worldviewUrl } from "@/lib/flood/scoring";
import { loadSavedPlace, loadWatchlist, savePlace, saveWatchlist } from "@/lib/flood/storage";
import type { GridCell, MapLayer, Place, RiskLevel } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

type MapProps = {
  place: Place;
  grid: GridCell[];
  layer: MapLayer;
  level: RiskLevel;
  hotspots: Hotspot[];
  cityScore: number;
  selectedId?: string;
  onSelectHotspot?: (id: string) => void;
};

function MapCanvasLazy(props: MapProps) {
  const [Comp, setComp] = useState<ComponentType<MapProps> | null>(null);
  useEffect(() => {
    void import("@/components/flood/map-canvas").then((m) => setComp(() => m.default));
  }, []);
  if (!Comp) return <div className="h-full w-full bg-raised" />;
  return <Comp {...props} />;
}

function statusBadge(status: string) {
  if (status === "LIVE") return <Badge variant="live">LIVE</Badge>;
  if (status === "DEGRADED") return <Badge variant="warn">DEGRADED</Badge>;
  return <Badge>SYNCING</Badge>;
}

function Metric({
  label,
  value,
  unit,
  hint,
}: {
  label: string;
  value: string;
  unit?: string;
  hint?: string;
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-mono text-2xl font-medium tabular-nums tracking-tight">
        {value}
        {unit ? <span className="ml-1 text-sm font-normal text-subtle">{unit}</span> : null}
      </p>
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

export function CommandCenter() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [watch, setWatch] = useState<Place[]>(DEFAULT_WATCHLIST);
  const [layer, setLayer] = useState<MapLayer>("risk");
  const [locating, setLocating] = useState(false);
  const [role, setRole] = useState<Role>("control");
  const [selectedHotspot, setSelectedHotspot] = useState<string | undefined>();
  const [scenario, setScenario] = useState(0);
  const { status, bundle, error, reload } = useFloodData(place);
  const scores = useWatchScores(watch);
  const now = useMemo(
    () => (bundle ? applyScenario(bundle.derived, scenario) : undefined),
    [bundle, scenario],
  );
  const pinned = watch.some((w) => samePlace(w, place));
  const spots = useMemo(() => hotspotsFor(place), [place]);
  const impact = useMemo(
    () => estimateImpact(place, now?.score ?? 0),
    [place, now?.score],
  );

  useEffect(() => {
    setPlace(loadSavedPlace());
    setWatch(loadWatchlist());
  }, []);

  useEffect(() => {
    setSelectedHotspot(undefined);
  }, [place.lat, place.lon]);

  function selectPlace(next: Place) {
    setPlace(next);
    savePlace(next);
  }

  function togglePin() {
    const next = pinned
      ? watch.filter((w) => !samePlace(w, place))
      : [...watch.filter((w) => !samePlace(w, place)), place];
    setWatch(next);
    saveWatchlist(next);
  }

  function locate() {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const p = await reversePlace(pos.coords.latitude, pos.coords.longitude);
          selectPlace(p);
        } catch {
          selectPlace({
            name: "Current location",
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast.error("Could not read location");
      },
      { enableHighAccuracy: true, timeout: 12_000 },
    );
  }

  const outlook = useMemo(() => bundle?.daily.slice(0, 7) ?? [], [bundle]);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-raised shadow-[var(--shadow-border)]">
              <Waves className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none">FluxIQ</p>
              <p className="mt-1 text-xs tracking-wide text-muted uppercase">Flood detection</p>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-2 lg:px-6">
            <SearchBox onSelect={selectPlace} />
            <Button
              variant="outline"
              size="icon"
              onClick={locate}
              aria-label="Use my location"
              disabled={locating}
            >
              <Locate className={locating ? "animate-pulse" : undefined} />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {statusBadge(status)}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <BookOpen />
                  Method
                </Button>
              </SheetTrigger>
              <SheetContent title="Detection method">
                <MethodologyBody />
              </SheetContent>
            </Sheet>
            <Button variant="outline" size="sm" onClick={() => void reload()}>
              <RefreshCw className={status === "SYNCING" ? "animate-spin" : undefined} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {scenario > 0 && (
        <div className="border-b border-primary/25 bg-primary/10 px-4 py-2.5 text-sm text-primary sm:px-6">
          <div className="mx-auto max-w-screen-2xl">
            Scenario overlay: +{scenario} mm in 3 hours is added on top of the live forecast. Not
            observed rainfall — use this to drill the desk before a cloudburst.
          </div>
        </div>
      )}

      {now && (now.level === "HIGH" || now.level === "CRITICAL") && (
        <div
          className={cn(
            "border-b px-4 py-2.5 text-sm sm:px-6",
            now.level === "CRITICAL"
              ? "border-risk-critical/30 bg-risk-critical/10 text-risk-critical"
              : "border-risk-high/30 bg-risk-high/10 text-risk-high",
          )}
        >
          <div className="mx-auto flex max-w-screen-2xl items-center gap-2">
            <CloudRain className="size-4 shrink-0" />
            <p>
              {now.level === "CRITICAL" ? "Critical flood signal" : "Elevated flood watch"} at{" "}
              {place.name}. 24h {mm(now.p24)} · {now.rainClass.toLowerCase()} rain class.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="border-b border-risk-moderate/30 bg-risk-moderate/10 px-4 py-2.5 text-sm text-risk-moderate sm:px-6">
          <div className="mx-auto max-w-screen-2xl">
            Forecast feed issue: {error}. Last successful model state is shown where available.
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs tracking-widest text-primary uppercase">
              Real-time decision support
            </p>
            <h1 className="mt-1 text-3xl font-medium tracking-tight sm:text-4xl">{place.name}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
              Municipal flood desk: live hydrology, catalogued hotspots, NDMA colour, bilingual
              public alerts and a role-based playbook. Not a substitute for IMD or NDMA warnings.
            </p>
            <p className="mt-2 font-mono text-xs text-subtle tabular-nums">
              {place.lat.toFixed(4)}° N, {place.lon.toFixed(4)}° E
              {place.elevation != null ? ` · ${Math.round(place.elevation)} m` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]">
              {(
                [
                  [0, "Observed"],
                  [20, "+20 mm"],
                  [40, "+40 mm"],
                  [80, "Cloudburst"],
                ] as const
              ).map(([mmAdd, label]) => (
                <button
                  key={mmAdd}
                  type="button"
                  onClick={() => setScenario(mmAdd)}
                  className={cn(
                    "h-9 rounded-sm px-3 text-xs font-medium",
                    scenario === mmAdd ? "bg-surface text-fg" : "text-muted",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <Button variant={pinned ? "secondary" : "outline"} size="sm" onClick={togglePin}>
              <Pin />
              {pinned ? "Watching" : "Watch location"}
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={worldviewUrl(place.lat, place.lon)} target="_blank" rel="noreferrer">
                <Satellite />
                NASA GPM
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          </div>
        </div>

        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {watch.map((w) => {
            const s = scores.find((x) => samePlace(x.place, w));
            const active = samePlace(w, place);
            return (
              <button
                key={`${w.lat}-${w.lon}`}
                type="button"
                onClick={() => selectPlace(w)}
                className={cn(
                  "flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm shadow-[var(--shadow-border)]",
                  active ? "bg-raised text-fg" : "bg-surface text-muted hover:text-fg",
                )}
              >
                <span className={cn("size-1.5 rounded-full", s ? riskDot(s.level) : "bg-subtle")} />
                {w.name.split(",")[0]}
                {s ? (
                  <span className="font-mono text-xs tabular-nums text-subtle">{s.score}</span>
                ) : null}
              </button>
            );
          })}
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {now ? (
            <>
              <Metric label="Flood index" value={String(now.score)} unit="/100" hint={now.level} />
              <Metric label="3h rainfall" value={now.p3.toFixed(1)} unit="mm" hint="Flash window" />
              <Metric
                label="24h rainfall"
                value={now.p24.toFixed(1)}
                unit="mm"
                hint={now.rainClass}
              />
              <Metric
                label="Soil moisture"
                value={(now.soil * 100).toFixed(0)}
                unit="%"
                hint={now.weatherLabel}
              />
            </>
          ) : (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)
          )}
        </section>

        {now ? (
          <ImpactBoard impact={impact} peakIso={now.peak?.time} />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Card className="overflow-hidden p-0 xl:col-span-2">
            <CardHeader className="border-b border-border">
              <div>
                <CardTitle>Flood risk surface</CardTitle>
                <CardDescription>
                  {bundle && bundle.grid.length > 1
                    ? `${bundle.grid.length}-cell hydrology grid, terrain-weighted`
                    : "Basin-centred flood halo from the live forecast"}
                </CardDescription>
              </div>
              <div className="flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]">
                {(
                  [
                    ["risk", "Risk"],
                    ["rain", "Rain"],
                    ["terrain", "Terrain"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setLayer(id)}
                    className={cn(
                      "h-8 rounded-sm px-3 text-xs font-medium",
                      layer === id ? "bg-surface text-fg" : "text-muted",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </CardHeader>
            <div className="relative h-80 md:h-96">
              <MapCanvasLazy
                place={place}
                grid={bundle?.grid ?? []}
                layer={layer}
                level={now?.level ?? "LOW"}
                hotspots={spots}
                cityScore={now?.score ?? 0}
                selectedId={selectedHotspot}
                onSelectHotspot={setSelectedHotspot}
              />
              <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg/85 px-2.5 py-1.5 font-mono text-xs text-muted shadow-[var(--shadow-border)]">
                {now ? `${now.level} · ${layer} layer` : "Synchronising"}
              </div>
              <div className="pointer-events-none absolute right-3 bottom-10 hidden rounded-md bg-bg/85 px-2.5 py-2 text-xs text-muted shadow-[var(--shadow-border)] sm:block">
                <p className="mb-1.5 tracking-wide uppercase">Index</p>
                <div className="flex items-center gap-2">
                  <span className="size-2 rounded-full bg-risk-low" /> Low
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-risk-moderate" /> Moderate
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-risk-high" /> High
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="size-2 rounded-full bg-risk-critical" /> Critical
                </div>
              </div>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            {now ? (
              <BriefPanel place={bundle?.place ?? place} now={now} />
            ) : (
              <>
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
              </>
            )}
            <HotspotPanel
              spots={spots}
              cityScore={now?.score ?? 0}
              selectedId={selectedHotspot}
              onSelect={setSelectedHotspot}
            />
            <ProvenanceCard
              syncedAt={bundle?.syncedAt}
              status={status}
              source={bundle?.source}
            />
          </div>
        </section>

        {now ? (
          <AlertComposer
            place={bundle?.place ?? place}
            now={now}
            spots={spots}
            impact={impact}
            role={role}
            onRole={setRole}
          />
        ) : (
          <Skeleton className="h-72 rounded-xl" />
        )}

        {bundle ? <RiskChart hourly={bundle.hourly} /> : <Skeleton className="h-72 rounded-xl" />}

        <Card>
          <CardHeader>
            <div>
              <CardTitle>Seven-day accumulation</CardTitle>
              <CardDescription>Daily rainfall totals from the same forecast cycle</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            {outlook.length === 0 ? (
              <Skeleton className="h-20" />
            ) : (
              <div className="flex gap-2 overflow-x-auto">
                {outlook.map((d) => (
                  <div
                    key={d.date}
                    className="flex min-w-16 flex-1 flex-col items-center gap-1 rounded-lg bg-raised px-2 py-3 text-center shadow-[var(--shadow-border)]"
                  >
                    <span className="text-xs text-muted">{formatDay(d.date)}</span>
                    <Droplets
                      className={cn(
                        "size-4",
                        d.precip >= 64.5
                          ? "text-risk-critical"
                          : d.precip >= 35.6
                            ? "text-risk-high"
                            : d.precip >= 7.6
                              ? "text-primary"
                              : "text-subtle",
                      )}
                    />
                    <span className="font-mono text-xs tabular-nums">{d.precip.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <footer className="pb-8 text-center text-xs text-subtle">
          FluxIQ flood detection · Open-Meteo + NASA GPM context · Not an official emergency warning
        </footer>
      </main>
    </div>
  );
}
