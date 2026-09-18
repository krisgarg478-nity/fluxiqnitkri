import { useEffect, useState } from "react";
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatHour } from "@/lib/flood/format";
import type { HourPoint } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

export function RiskChart({ hourly }: { hourly: HourPoint[] }) {
  const [hours, setHours] = useState<24 | 48>(24);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const rows = hourly.slice(0, hours).map((h) => ({
    ...h,
    label: formatHour(h.time),
  }));

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div>
          <CardTitle>Flood index timeline</CardTitle>
          <CardDescription>
            Rolling 1h / 3h / 24h rainfall with soil moisture and runoff
          </CardDescription>
        </div>
        <div className="flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]">
          {([24, 48] as const).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setHours(n)}
              className={cn(
                "h-8 rounded-sm px-3 text-xs font-medium",
                hours === n ? "bg-surface text-fg" : "text-muted",
              )}
            >
              {n}h
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="rgba(232,234,237,0.06)" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fill: "#8b929c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  interval={hours === 48 ? 5 : 2}
                />
                <YAxis
                  yAxisId="score"
                  domain={[0, 100]}
                  tick={{ fill: "#8b929c", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="rain"
                  orientation="right"
                  hide
                  domain={[0, (max: number) => Math.max(8, max * 1.4)]}
                />
                <Tooltip
                  cursor={{ fill: "rgba(232,234,237,0.04)" }}
                  contentStyle={{
                    background: "#181c22",
                    border: "1px solid #262b33",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#e8eaed",
                  }}
                  formatter={(value, name) => {
                    const n = typeof value === "number" ? value : Number(value);
                    if (name === "score") return [`${n} / 100`, "Flood index"];
                    if (name === "precip") return [`${n.toFixed(1)} mm`, "Rainfall"];
                    return [n, String(name)];
                  }}
                />
                <Area
                  yAxisId="score"
                  type="monotone"
                  dataKey="score"
                  stroke="#8fb4c0"
                  fill="#8fb4c0"
                  fillOpacity={0.12}
                  strokeWidth={1.6}
                  dot={false}
                  isAnimationActive={false}
                />
                <Bar
                  yAxisId="rain"
                  dataKey="precip"
                  fill="#6a717b"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={10}
                  isAnimationActive={false}
                />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full rounded-md bg-raised" />
          )}
        </div>
        <div className="mt-3 flex gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <i className="h-0.5 w-4 bg-primary" /> Flood index
          </span>
          <span className="inline-flex items-center gap-1.5">
            <i className="size-2 rounded-sm bg-subtle" /> Hourly rainfall
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
