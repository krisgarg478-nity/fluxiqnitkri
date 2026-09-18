import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { leadTimeLabel } from "@/lib/flood/alerts";
import type { Impact } from "@/lib/flood/hotspots";
import { cn } from "@/lib/utils";

function ndmaClass(code: Impact["ndma"]) {
  if (code === "RED") return "text-risk-critical";
  if (code === "ORANGE") return "text-risk-high";
  if (code === "YELLOW") return "text-risk-moderate";
  return "text-risk-low";
}

function Cell({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: string;
}) {
  return (
    <Card className="px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className={cn("mt-1 font-mono text-xl font-medium tabular-nums tracking-tight", tone)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </Card>
  );
}

export function ImpactBoard({
  impact,
  peakIso,
}: {
  impact: Impact;
  peakIso?: string;
}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Cell
        label="NDMA colour"
        value={impact.ndma}
        hint={impact.level}
        tone={ndmaClass(impact.ndma)}
      />
      <Cell
        label="People on low ground"
        value={impact.people.toLocaleString("en-IN")}
        hint="Catalogued wards × live index"
      />
      <Cell
        label="Underpasses"
        value={String(impact.underpasses)}
        hint={impact.underpasses ? "Recommend closure" : "None at threshold"}
      />
      <Cell
        label="Lead time"
        value={leadTimeLabel(peakIso)}
        hint={impact.pumps ? `${impact.pumps} pump crews` : "Peak in the 24h window"}
      />
    </section>
  );
}
