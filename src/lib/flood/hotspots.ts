import { clamp, levelFromScore } from "./scoring";
import type { Place, RiskLevel } from "./types";

export type HotspotKind = "underpass" | "settlement" | "river" | "drain" | "basin";

export type Hotspot = {
  id: string;
  name: string;
  nameHi: string;
  kind: HotspotKind;
  lat: number;
  lon: number;
  sensitivity: number;
  action: string;
  actionHi: string;
};

export type CityProfile = {
  id: string;
  name: string;
  lat: number;
  lon: number;
  exposed: number;
  informalShare: number;
  pumpStations: number;
  hotspots: Hotspot[];
};

export type Role = "control" | "field" | "citizen";

export type Impact = {
  people: number;
  underpasses: number;
  settlements: number;
  pumps: number;
  ndma: "GREEN" | "YELLOW" | "ORANGE" | "RED";
  level: RiskLevel;
};

const CITIES: CityProfile[] = [
  {
    id: "delhi",
    name: "New Delhi",
    lat: 28.6139,
    lon: 77.209,
    exposed: 210_000,
    informalShare: 0.28,
    pumpStations: 18,
    hotspots: [
      hs("del-minto", "Minto Underpass", "मिंटो अंडरपास", "underpass", 28.6304, 77.2231, 1.28, "Close to traffic; deploy pumps at both ramps"),
      hs("del-bara", "Barapullah corridor", "बरापुल्ला कॉरिडोर", "underpass", 28.5832, 77.2568, 1.22, "Divert ring-road traffic; staff the pumping kiosk"),
      hs("del-yamuna", "Yamuna Pushta / Geeta Colony", "यमुना पश्ता / गीता कॉलोनी", "settlement", 28.6554, 77.2704, 1.18, "Warn low-lying jhuggis; pre-position boats if stage is rising"),
      hs("del-ito", "ITO / Ring Road dip", "आईटीओ रिंग रोड", "drain", 28.6285, 77.2412, 1.12, "Clear inlets; hold a tow truck at the dip"),
      hs("del-jahangir", "Jahangirpuri drain belt", "जहांगीरपुरी नाला", "drain", 28.7258, 77.1662, 1.15, "Inspect nala outfall; alert night shelter wardens"),
    ],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    lat: 19.076,
    lon: 72.8777,
    exposed: 480_000,
    informalShare: 0.42,
    pumpStations: 32,
    hotspots: [
      hs("mum-milan", "Milan subway", "मिलान सबवे", "underpass", 19.0864, 72.8891, 1.32, "Close subway; reroute airport-bound traffic"),
      hs("mum-sion", "Sion / King Circle", "सायन / किंग सर्कल", "underpass", 19.0368, 72.8596, 1.24, "Station pumps; restrict BEST buses through the dip"),
      hs("mum-dharavi", "Dharavi low pockets", "धारावी", "settlement", 19.043, 72.852, 1.2, "Community warning on loudhailer; keep clinic access open"),
      hs("mum-kurla", "Kurla / LBS flood belt", "कुर्ला एलबीएस", "drain", 19.065, 72.879, 1.16, "Desilt grates; hold BMC ward vans on standby"),
      hs("mum-hindmata", "Hindmata / Parel", "हिंदमाता / परेल", "drain", 18.998, 72.841, 1.14, "Watch the subway mouth; one-way if water exceeds kerb"),
    ],
  },
  {
    id: "chennai",
    name: "Chennai",
    lat: 13.0827,
    lon: 80.2707,
    exposed: 320_000,
    informalShare: 0.31,
    pumpStations: 22,
    hotspots: [
      hs("che-palli", "Pallikaranai marsh edge", "पल्लिकरनई", "basin", 12.9405, 80.2074, 1.26, "Hold development traffic; watch marsh overflow into Velachery"),
      hs("che-vela", "Velachery / Vijayanagar", "वेलाचेरी", "drain", 12.9792, 80.2206, 1.2, "Pump at the bus terminus dip; keep MRTS stairs clear"),
      hs("che-tnagar", "T. Nagar tank bund", "टी. नगर", "drain", 13.0415, 80.2334, 1.12, "Clear storm inlets on Usman Road"),
      hs("che-cooum", "Cooum bank settlements", "कूम नदी तट", "river", 13.0784, 80.2668, 1.18, "Move livestock and stores above plinth; watch high tide + rain"),
      hs("che-mudichur", "Mudichur / Tambaram", "मुदिचूर / तांबरम", "basin", 12.924, 80.101, 1.22, "Warn plotted layouts on the old lake bed"),
    ],
  },
  {
    id: "kolkata",
    name: "Kolkata",
    lat: 22.5726,
    lon: 88.3639,
    exposed: 290_000,
    informalShare: 0.34,
    pumpStations: 20,
    hotspots: [
      hs("kol-howrah", "Howrah station approach", "हावड़ा स्टेशन", "drain", 22.583, 88.342, 1.2, "Keep pedestrian skywalks open; pump the subway"),
      hs("kol-garden", "Garden Reach / Metiabruz", "गार्डन रीच", "settlement", 22.547, 88.268, 1.18, "Community boats if Hooghly stage is high"),
      hs("kol-beleghata", "Beleghata canal", "बेलेघाटा नहर", "drain", 22.562, 88.393, 1.16, "Lock canal gates if outfall is reverse-flowing"),
      hs("kol-salt", "Salt Lake Sector V dips", "सॉल्ट लेक सेक्टर ५", "drain", 22.576, 88.433, 1.1, "IT corridor diversions; keep DG sets above water line"),
    ],
  },
  {
    id: "guwahati",
    name: "Guwahati",
    lat: 26.1445,
    lon: 91.7362,
    exposed: 160_000,
    informalShare: 0.36,
    pumpStations: 9,
    hotspots: [
      hs("ghy-bharalu", "Bharalu / Bharalumukh", "भरालूमुख", "drain", 26.175, 91.74, 1.3, "Bharalu outfall first; sandbags at the market lane"),
      hs("ghy-fancy", "Fancy Bazar", "फैंसी बाजार", "drain", 26.183, 91.745, 1.18, "Raise shop inventory; one-way the inner lanes"),
      hs("ghy-anil", "Anil Nagar / Zoo Road", "अनिल नगर", "basin", 26.155, 91.775, 1.22, "Known bowl — pre-deploy two pumps"),
    ],
  },
  {
    id: "patna",
    name: "Patna",
    lat: 25.5941,
    lon: 85.1376,
    exposed: 190_000,
    informalShare: 0.33,
    pumpStations: 11,
    hotspots: [
      hs("pat-ganga", "Ganga ghats / collectorate", "गंगा घाट", "river", 25.623, 85.168, 1.24, "Watch Ganga gauge; close ghats if combined with cloudburst"),
      hs("pat-kankar", "Kankarbagh dips", "कंकरबाग", "drain", 25.594, 85.158, 1.16, "Clear colony outfalls; keep ambulance lane dry"),
      hs("pat-rajendra", "Rajendra Nagar", "राजेंद्र नगर", "drain", 25.607, 85.163, 1.12, "Inspect railway underbridge"),
    ],
  },
  {
    id: "kochi",
    name: "Kochi",
    lat: 9.9312,
    lon: 76.2673,
    exposed: 140_000,
    informalShare: 0.22,
    pumpStations: 8,
    hotspots: [
      hs("cok-marine", "Marine Drive / high tide", "मरीन ड्राइव", "river", 9.976, 76.275, 1.2, "Tide + rain compound; close the lowest promenade"),
      hs("cok-edap", "Edappally stretch", "इडप्पल्ली", "drain", 10.026, 76.308, 1.14, "NH bypass dips; keep one pump at the metro pillar"),
      hs("cok-fort", "Fort Kochi settlements", "फोर्ट कोच्चि", "settlement", 9.965, 76.242, 1.1, "Warn sea-facing lanes at spring tide"),
    ],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    lat: 17.385,
    lon: 78.4867,
    exposed: 200_000,
    informalShare: 0.27,
    pumpStations: 14,
    hotspots: [
      hs("hyd-musi", "Musi riverbank", "मूसी तट", "river", 17.371, 78.48, 1.22, "Old City lanes; move generators upstairs"),
      hs("hyd-hussain", "Hussain Sagar bund", "हुसैन सागर", "basin", 17.423, 78.473, 1.12, "Watch tank surplus weirs"),
      hs("hyd-kukat", "Kukatpally / KPHB dips", "कूकटपल्ली", "drain", 17.494, 78.399, 1.16, "Underbridge pumping; metro feeder diversions"),
    ],
  },
];

function hs(
  id: string,
  name: string,
  nameHi: string,
  kind: HotspotKind,
  lat: number,
  lon: number,
  sensitivity: number,
  action: string,
): Hotspot {
  const actionHi =
    kind === "underpass"
      ? "अंडरपास बंद करें और पंप तैनात करें"
      : kind === "settlement"
        ? "बस्ती में चेतावनी दें, ऊँचे स्थान पर शिफ्ट करें"
        : kind === "river"
          ? "नदी स्तर देखें, घाट बंद करें"
          : "नालों की सफाई करें, पंप तैयार रखें";
  return { id, name, nameHi, kind, lat, lon, sensitivity, action, actionHi };
}

function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function matchCity(place: Place): CityProfile | null {
  const n = place.name.toLowerCase();
  const byName = CITIES.find(
    (c) => n.includes(c.name.toLowerCase()) || n.includes(c.id),
  );
  if (byName) return byName;
  let best: CityProfile | null = null;
  let bestD = 38;
  for (const c of CITIES) {
    const d = haversineKm(place, c);
    if (d < bestD) {
      best = c;
      bestD = d;
    }
  }
  return best;
}

export function hotspotsFor(place: Place): Hotspot[] {
  const city = matchCity(place);
  if (city) return city.hotspots;
  return [
    {
      id: "local-basin",
      name: "Mapped basin centre",
      nameHi: "बेसिन केंद्र",
      kind: "basin",
      lat: place.lat,
      lon: place.lon,
      sensitivity: 1,
      action: "No municipal catalog for this city yet — treat the searched point as the basin centre",
      actionHi: "इस शहर की सूची जुड़ी नहीं है — खोजे गए बिंदु को बेसिन मानें",
    },
  ];
}

export function ndmaColor(level: RiskLevel): Impact["ndma"] {
  if (level === "CRITICAL") return "RED";
  if (level === "HIGH") return "ORANGE";
  if (level === "MODERATE") return "YELLOW";
  return "GREEN";
}

export function scoreHotspot(cityScore: number, hotspot: Hotspot): { score: number; level: RiskLevel } {
  const score = Math.round(clamp(cityScore * hotspot.sensitivity, 0, 100));
  return { score, level: levelFromScore(score) };
}

export function estimateImpact(place: Place, cityScore: number): Impact {
  const city = matchCity(place);
  const level = levelFromScore(cityScore);
  const factor = cityScore / 100;
  const exposed = city?.exposed ?? 40_000;
  const informal = city?.informalShare ?? 0.2;
  const people = Math.round(exposed * factor * (0.22 + informal * 0.55));
  const spots = hotspotsFor(place).map((h) => ({ h, ...scoreHotspot(cityScore, h) }));
  const underpasses = spots.filter((s) => s.h.kind === "underpass" && s.score >= 40).length;
  const settlements = spots.filter((s) => s.h.kind === "settlement" && s.score >= 36).length;
  const pumps =
    cityScore >= 70
      ? (city?.pumpStations ?? 4)
      : cityScore >= 50
        ? Math.ceil((city?.pumpStations ?? 4) * 0.6)
        : cityScore >= 28
          ? Math.ceil((city?.pumpStations ?? 4) * 0.3)
          : 0;
  return {
    people,
    underpasses,
    settlements,
    pumps,
    ndma: ndmaColor(level),
    level,
  };
}

export const ROLE_LABEL: Record<Role, string> = {
  control: "Control room",
  field: "Field crew",
  citizen: "Citizen",
};

export function roleSteps(role: Role, level: RiskLevel, spots: Hotspot[]): string[] {
  const names = spots.slice(0, 3).map((s) => s.name);
  const list = names.length ? names.join(", ") : "known low-lying corridors";
  if (role === "citizen") {
    if (level === "CRITICAL")
      return [
        "Stay on upper floors. Do not walk or drive through moving water",
        `Avoid ${list}`,
        "Keep phone charged; follow NDRF / municipal loudspeaker instructions",
      ];
    if (level === "HIGH")
      return [
        "Delay non-essential travel. Underpasses may close without notice",
        `Stay clear of ${list}`,
        "Move documents and medicines above waist height",
      ];
    if (level === "MODERATE")
      return ["Allow extra time; avoid flooded shortcuts", "Do not enter a dipped underpass if you cannot see the kerb"];
    return ["No public warning in force. Recheck before evening travel"];
  }
  if (role === "field") {
    if (level === "CRITICAL" || level === "HIGH")
      return [
        `Patrol ${list} and report water depth at kerb`,
        "Start assigned pumps; photograph inlet screens",
        "Hold one lane for emergency vehicles",
      ];
    if (level === "MODERATE")
      return ["Walk the listed drains and clear debris", "Confirm pump fuel and couplings", "Report any blocked outfall"];
    return ["Routine inlet check on the named corridors", "Log defects before the next forecast pulse"];
  }
  if (level === "CRITICAL")
    return [
      "Stand up the 24-hour desk. Issue the bilingual public alert",
      `Close ${list}`,
      "Request NDRF / SDRF boats if settlements are in the amber list",
      "Open identified night shelters",
    ];
  if (level === "HIGH")
    return [
      "Pre-deploy pumps at the named underpasses",
      `Restrict movement through ${list}`,
      "Brief ward officers every 60 minutes",
    ];
  if (level === "MODERATE")
    return ["Raise inspection cadence", "Keep the public alert in draft", "Confirm shelter keys and diesel"];
  return ["Routine monitoring. No road closures recommended"];
}
