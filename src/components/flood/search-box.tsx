import { LoaderCircle, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { searchPlaces } from "@/lib/flood/api";
import type { Place } from "@/lib/flood/types";
import { cn } from "@/lib/utils";

export function SearchBox({
  onSelect,
}: {
  onSelect: (place: Place) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (query.trim().length < 3) {
      setHits([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const t = setTimeout(() => {
      searchPlaces(query.trim())
        .then((r) => {
          setHits(r);
          setActive(0);
          setOpen(true);
        })
        .catch(() => setHits([]))
        .finally(() => setLoading(false));
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function choose(place: Place) {
    onSelect(place);
    setQuery("");
    setHits([]);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative min-w-0 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => Math.min(i + 1, hits.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && hits[active]) {
            e.preventDefault();
            choose(hits[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
            inputRef.current?.blur();
          }
        }}
        placeholder="Search city or basin"
        aria-label="Search location"
        className="pl-9 pr-10"
        autoComplete="off"
      />
      {loading && (
        <LoaderCircle className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted" />
      )}
      {open && hits.length > 0 && (
        <div className="absolute top-12 z-30 w-full overflow-hidden rounded-lg bg-raised py-1 shadow-[var(--shadow-border)]">
          {hits.map((hit, i) => (
            <button
              key={`${hit.lat}-${hit.lon}-${i}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choose(hit)}
              className={cn(
                "flex w-full flex-col items-start px-3 py-2.5 text-left text-sm",
                i === active ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              <span>{hit.name}</span>
              <span className="font-mono text-xs text-subtle">
                {hit.lat.toFixed(3)}, {hit.lon.toFixed(3)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
