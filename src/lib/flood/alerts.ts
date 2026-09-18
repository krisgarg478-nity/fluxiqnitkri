import { formatWhen } from "./format";
import { ndmaColor, type Hotspot, type Impact } from "./hotspots";
import type { DerivedNow, Place } from "./types";

export function leadTimeLabel(peakIso: string | undefined, nowMs = Date.now()): string {
  if (!peakIso) return "No peak in the 24-hour window";
  const t = Date.parse(peakIso);
  if (!Number.isFinite(t)) return "Peak time unknown";
  const diff = t - nowMs;
  if (diff <= 0) return "Peak is in the current hour";
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  if (h <= 0) return `${m} min to peak`;
  return `${h}h ${m.toString().padStart(2, "0")}m to peak`;
}

export function publicAlert(place: Place, now: DerivedNow, spots: Hotspot[], impact: Impact) {
  const ndma = ndmaColor(now.level);
  const avoid = spots
    .slice(0, 4)
    .map((s) => s.name)
    .join(", ");
  const avoidHi = spots
    .slice(0, 4)
    .map((s) => s.nameHi)
    .join(", ");
  const peak = now.peak ? formatWhen(now.peak.time) : "the next 12 hours";
  const lead = leadTimeLabel(now.peak?.time);

  const en =
    now.level === "LOW"
      ? `FluxIQ advisory — ${place.name}. NDMA colour GREEN. Flood index ${now.score}/100. No public warning. Recheck before travel if skies darken.`
      : `FluxIQ ${now.level} flood alert — ${place.name}. NDMA colour ${ndma}. Index ${now.score}/100. 24h rainfall ${now.p24.toFixed(1)} mm (${now.rainClass}). ${lead}. Avoid ${avoid || "low-lying roads and underpasses"}. Peak window ${peak}. This is decision support, not an IMD / NDMA order.`;

  const hi =
    now.level === "LOW"
      ? `फ्लक्सआईक्यू सूचना — ${place.name}. एनडीएमए रंग हरा. बाढ़ सूचकांक ${now.score}/100. कोई सार्वजनिक चेतावनी नहीं। यात्रा से पहले मौसम जाँचें।`
      : `फ्लक्सआईक्यू ${now.level === "CRITICAL" ? "आपात" : now.level === "HIGH" ? "उच्च" : "मध्यम"} बाढ़ चेतावनी — ${place.name}. एनडीएमए रंग ${ndma === "RED" ? "लाल" : ndma === "ORANGE" ? "नारंगी" : "पीला"}. सूचकांक ${now.score}/100. 24 घंटे की वर्षा ${now.p24.toFixed(1)} मिमी. ${lead}. बचें: ${avoidHi || "निचली सड़कें और अंडरपास"}. अधिकतम जोखिम ${peak}. यह निर्णय सहायता है, आधिकारिक चेतावनी नहीं.`;

  return { en, hi, ndma, lead };
}

export function sitrep(place: Place, now: DerivedNow, spots: Hotspot[], impact: Impact) {
  const { en, hi, ndma, lead } = publicAlert(place, now, spots, impact);
  const lines = [
    `SITREP — FluxIQ flood desk`,
    `Location: ${place.name} (${place.lat.toFixed(3)}, ${place.lon.toFixed(3)})`,
    `NDMA colour: ${ndma} · Index ${now.score}/100 · ${now.level}`,
    `Rain: 1h ${now.p1.toFixed(1)} mm · 3h ${now.p3.toFixed(1)} mm · 24h ${now.p24.toFixed(1)} mm (${now.rainClass})`,
    `Soil ${(now.soil * 100).toFixed(0)}% · Runoff ${now.runoff.toFixed(2)} mm · ${lead}`,
    `Impact (model): ~${impact.people.toLocaleString("en-IN")} people in catalogued low ground · ${impact.underpasses} underpasses · ${impact.pumps} pump crews`,
    `Hotspots:`,
    ...spots.map((s) => `  - ${s.name}: ${s.action}`),
    ``,
    `Public EN: ${en}`,
    `Public HI: ${hi}`,
    `Disclaimer: Not a substitute for IMD / CWC / NDMA official bulletins.`,
  ];
  return lines.join("\n");
}
