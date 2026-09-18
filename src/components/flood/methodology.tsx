import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DataSource } from "@/lib/flood/types";

export function MethodologyBody() {
  return (
    <div className="space-y-6 text-sm leading-relaxed text-muted">
      <section className="space-y-2">
        <h3 className="font-medium text-fg">What FluxIQ measures</h3>
        <p>
          FluxIQ estimates urban surface-flood potential from live forecast hydrology, not from a
          river gauge. The index is 0–100 and is designed for municipal operations desks: when to
          watch underpasses, pump stations and low-lying corridors.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-medium text-fg">Index mix</h3>
        <ul className="space-y-1.5">
          <li>
            <span className="text-fg">Flash (36%).</span> 1-hour and 3-hour rainfall intensity — the
            signal behind pluvial / flash flooding in paved basins.
          </li>
          <li>
            <span className="text-fg">Accumulation (34%).</span> 24-hour rainfall plus modelled
            surface runoff.
          </li>
          <li>
            <span className="text-fg">Saturation (20%).</span> Near-surface soil moisture. When ECMWF
            soil fields are unavailable, a rainfall bucket model is used and labelled as such.
          </li>
          <li>
            <span className="text-fg">Terrain (up to +22).</span> Cells below the local mean
            elevation are amplified — water gathers in the dips.
          </li>
        </ul>
      </section>
      <section className="space-y-2">
        <h3 className="font-medium text-fg">Bands</h3>
        <p>LOW 0–27 · MODERATE 28–49 · HIGH 50–69 · CRITICAL 70–100.</p>
        <p>
          24-hour rainfall class follows IMD categories (light through extremely heavy). A 1-hour
          burst above 20 mm with wet soil is treated as a flash-flood watch even if the 24-hour
          total is still moderate.
        </p>
      </section>
      <section className="space-y-2">
        <h3 className="font-medium text-fg">Data provenance</h3>
        <p>
          Primary hydrology: Open-Meteo (ECMWF-backed). Fallback: MET Norway location forecast.
          Terrain: Open-Meteo elevation when available. Basemap: OpenStreetMap / CARTO. Satellite
          rainfall context: NASA GPM IMERG via Worldview. Hotspots: curated municipal corridors
          (underpasses, settlements, drains) for major Indian cities, sensitivity-weighted by the
          live index. Impact counts are an operations model, not a census. Official municipal
          gauges are not connected. This is decision support, not an official warning.
        </p>
      </section>
    </div>
  );
}

export function ProvenanceCard({
  syncedAt,
  status,
  source,
}: {
  syncedAt?: string;
  status: string;
  source?: DataSource;
}) {
  const forecastNote =
    source === "met-norway" ? "MET Norway / Yr location forecast" : "Open-Meteo / ECMWF";
  const hydroNote =
    source === "met-norway" ? "Rainfall bucket + runoff proxy" : "Runoff + soil moisture fields";

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Data provenance</CardTitle>
          <CardDescription>Live feeds, no fabricated gauges</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <Feed
          name="Weather forecast"
          state={status === "LIVE" ? "LIVE" : status}
          note={forecastNote}
        />
        <Feed name="Hydrology" state="ACTIVE" note={hydroNote} />
        <Feed
          name="Terrain"
          state={source === "open-meteo" ? "ACTIVE" : "LIMITED"}
          note="Relative elevation grid when ECMWF path is up"
        />
        <Feed name="Satellite rainfall" state="READY" note="NASA GPM IMERG / Worldview" />
        <Feed name="Official gauge" state="OPTIONAL" note="Municipal sensor not connected" />
        {syncedAt && (
          <p className="pt-1 font-mono text-xs text-subtle">
            Last sync {new Date(syncedAt).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Feed({ name, state, note }: { name: string; state: string; note: string }) {
  const muted = state === "OPTIONAL" || state === "LIMITED";
  return (
    <div className="flex items-start gap-3">
      <span
        className={`mt-1.5 size-1.5 shrink-0 rounded-full ${muted ? "bg-risk-moderate" : "bg-risk-low"}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-fg">{name}</span>
          <span className="font-mono text-xs tracking-wider text-muted">{state}</span>
        </div>
        <p className="text-xs text-subtle">{note}</p>
      </div>
    </div>
  );
}
