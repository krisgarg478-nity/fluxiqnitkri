import { Landmark, Waves, Waypoints } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { riskDot, riskTone } from "@/lib/flood/format";
import { scoreHotspot, type Hotspot, type HotspotKind } from "@/lib/flood/hotspots";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<HotspotKind, string> = {
  underpass: "Underpass",
  settlement: "Settlement",
  river: "River",
  drain: "Drain",
  basin: "Basin",
};

function KindIcon({ kind }: { kind: HotspotKind }) {
  if (kind === "underpass") return <Waypoints className="size-3.5" />;
  if (kind === "river" || kind === "basin") return <Waves className="size-3.5" />;
  return <Landmark className="size-3.5" />;
}

export function HotspotPanel({
  spots,
  cityScore,
  selectedId,
  onSelect,
}: {
  spots: Hotspot[];
  cityScore: number;
  selectedId?: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Flood hotspots</CardTitle>
          <CardDescription>
            Municipal catalog — underpasses, settlements, drains. Sensitivity-weighted by the live
            index.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-1 px-2 pb-3">
        {spots.map((spot) => {
          const { score, level } = scoreHotspot(cityScore, spot);
          const active = selectedId === spot.id;
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => onSelect(spot.id)}
              className={cn(
                "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left",
                active ? "bg-raised" : "hover:bg-raised/60",
              )}
            >
              <span className={cn("mt-1.5 size-1.5 shrink-0 rounded-full", riskDot(level))} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-fg">{spot.name}</span>
                  <span className={cn("font-mono text-xs tabular-nums", riskTone(level))}>
                    {score}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <KindIcon kind={spot.kind} />
                  {KIND_LABEL[spot.kind]}
                </span>
                <span className="mt-1 block text-xs leading-snug text-subtle">{spot.action}</span>
              </span>
            </button>
          );
        })}
      </CardContent>
    </Card>
  );
}
