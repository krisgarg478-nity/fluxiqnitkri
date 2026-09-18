import { Copy, Share2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { publicAlert, sitrep } from "@/lib/flood/alerts";
import type { Hotspot, Impact, Role } from "@/lib/flood/hotspots";
import { ROLE_LABEL, roleSteps } from "@/lib/flood/hotspots";
import type { DerivedNow, Place } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

export function AlertComposer({
  place,
  now,
  spots,
  impact,
  role,
  onRole,
}: {
  place: Place;
  now: DerivedNow;
  spots: Hotspot[];
  impact: Impact;
  role: Role;
  onRole: (role: Role) => void;
}) {
  const [tab, setTab] = useState<"alert" | "sitrep">("alert");
  const { en, hi, ndma } = publicAlert(place, now, spots, impact);
  const report = sitrep(place, now, spots, impact);
  const steps = roleSteps(role, now.level, spots);

  async function copy(text: string, ok: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(ok);
    } catch {
      toast.error("Could not copy");
    }
  }

  async function share() {
    const text = `${en}\n\n${hi}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `FluxIQ ${ndma} — ${place.name}`, text });
        return;
      } catch {
        /* fall through */
      }
    }
    await copy(text, "Alert copied");
  }

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Operations desk</CardTitle>
          <CardDescription>Bilingual public alert, sitrep, role playbook</CardDescription>
        </div>
        <div className="flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]">
          {(
            [
              ["alert", "Alert"],
              ["sitrep", "Sitrep"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                "h-8 rounded-sm px-3 text-xs font-medium",
                tab === id ? "bg-surface text-fg" : "text-muted",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(ROLE_LABEL) as Role[]).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => onRole(id)}
              className={cn(
                "h-9 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]",
                role === id ? "bg-raised text-fg" : "bg-surface text-muted",
              )}
            >
              {ROLE_LABEL[id]}
            </button>
          ))}
        </div>

        {tab === "alert" ? (
          <div className="space-y-3">
            <p className="rounded-lg bg-raised px-3 py-3 text-sm leading-relaxed text-fg shadow-[var(--shadow-border)]">
              {en}
            </p>
            <p className="rounded-lg bg-raised px-3 py-3 text-sm leading-relaxed text-fg shadow-[var(--shadow-border)]">
              {hi}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={() => void copy(`${en}\n\n${hi}`, "Bilingual alert copied")}>
                <Copy />
                Copy EN + HI
              </Button>
              <Button size="sm" variant="outline" onClick={() => void share()}>
                <Share2 />
                Share
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <pre className="max-h-56 overflow-auto rounded-lg bg-raised px-3 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted shadow-[var(--shadow-border)]">
              {report}
            </pre>
            <Button size="sm" onClick={() => void copy(report, "Sitrep copied")}>
              <Copy />
              Copy sitrep
            </Button>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs text-muted">{ROLE_LABEL[role]} checklist</p>
          <ul className="space-y-2">
            {steps.map((step) => (
              <li key={step} className="flex gap-2 text-sm leading-snug text-fg">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
                {step}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
