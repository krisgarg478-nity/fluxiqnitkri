import { Copy, Droplets, Mountain, Waves } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatWhen, mm, riskTone } from "@/lib/flood/format";
import { PLAYBOOK } from "@/lib/flood/scoring";
import type { DerivedNow, Place } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

function Meter({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Waves }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="inline-flex items-center gap-1.5 text-muted">
          <Icon className="size-3.5" />
          {label}
        </span>
        <span className="font-mono tabular-nums text-fg">{value}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-raised">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
    </div>
  );
}

export function BriefPanel({ place, now }: { place: Place; now: DerivedNow }) {
  const play = PLAYBOOK[now.level];

  function copyBrief() {
    const lines = [
      `FluxIQ flood brief — ${place.name}`,
      `Index ${now.score}/100 · ${now.level}`,
      `3h ${now.p3.toFixed(1)} mm · 24h ${now.p24.toFixed(1)} mm (${now.rainClass})`,
      `Soil ${(now.soil * 100).toFixed(0)}% · Runoff ${now.runoff.toFixed(2)} mm`,
      now.peak ? `Peak window ${formatWhen(now.peak.time)} · index ${now.peak.score}` : "",
      play.title,
      ...play.steps.map((s) => `- ${s}`),
    ]
      .filter(Boolean)
      .join("\n");
    void navigator.clipboard.writeText(lines).then(
      () => toast.success("Brief copied"),
      () => toast.error("Could not copy"),
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Decision brief</CardTitle>
            <CardDescription>Transparent flood index for this basin</CardDescription>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={copyBrief} aria-label="Copy brief">
            <Copy />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className={cn("font-mono text-4xl font-medium tabular-nums tracking-tight", riskTone(now.level))}>
              {now.level}
            </div>
            <p className="mt-1 font-mono text-sm text-muted tabular-nums">
              Index {now.score}
              <span className="text-subtle"> / 100</span>
            </p>
          </div>
          <p className="text-sm leading-relaxed text-muted">{play.title}.</p>
          <ul className="space-y-2">
            {play.steps.map((step) => (
              <li key={step} className="flex gap-2 text-sm leading-snug text-fg">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                {step}
              </li>
            ))}
          </ul>
          {now.peak && (
            <p className="text-xs text-muted">
              Peak index {now.peak.score} at {formatWhen(now.peak.time)}
              {now.peak.precip > 0 ? ` · ${now.peak.precip.toFixed(1)} mm that hour` : ""}.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Signal mix</CardTitle>
            <CardDescription>What is driving the index</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Meter label="Flash (1–3h)" value={now.flash} icon={Droplets} />
          <Meter label="Accumulation" value={now.riverine} icon={Waves} />
          <Meter label="Soil saturation" value={now.saturation} icon={Droplets} />
          <Meter label="Low-lying terrain" value={now.terrain} icon={Mountain} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Thresholds</CardTitle>
            <CardDescription>IMD-aligned rainfall classes</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Row k="24h class" v={now.rainClass} />
          <Row k="1h rainfall" v={mm(now.p1)} />
          <Row k="3h rainfall" v={mm(now.p3)} />
          <Row k="24h rainfall" v={mm(now.p24)} />
          <Separator />
          <Row k="Runoff" v={mm(now.runoff, 2)} />
          <Row k="Soil 0–7 cm" v={`${(now.soil * 100).toFixed(0)}%`} />
          <Row k="Soil 7–28 cm" v={`${(now.soilDeep * 100).toFixed(0)}%`} />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted">{k}</span>
      <span className="font-mono text-xs tabular-nums text-fg">{v}</span>
    </div>
  );
}
