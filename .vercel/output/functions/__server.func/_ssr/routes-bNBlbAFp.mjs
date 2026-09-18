import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { _ as CloudRain, a as Share2, c as RefreshCw, d as Locate, f as LoaderCircle, g as Copy, h as Droplets, l as Pin, m as ExternalLink, n as Waypoints, o as Search, p as Landmark, r as Waves, s as Satellite, t as X, u as Mountain, v as BookOpen } from "../_libs/lucide-react.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { a as DialogOverlay, c as DialogTrigger, i as DialogDescription, n as DialogClose, o as DialogPortal, r as DialogContent, s as DialogTitle, t as Dialog, u as Slot } from "../_libs/@radix-ui/react-dialog+[...].mjs";
import { n as toast } from "../_libs/sonner.mjs";
import { n as format, t as parseISO } from "../_libs/date-fns.mjs";
import { t as Root } from "../_libs/radix-ui__react-separator.mjs";
import { a as CartesianGrid, c as Tooltip, i as Area, n as YAxis, o as Bar, r as XAxis, s as ResponsiveContainer, t as ComposedChart } from "../_libs/recharts+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-bNBlbAFp.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
function clamp(n, a, b) {
	return Math.max(a, Math.min(b, n));
}
function levelFromScore(score) {
	if (score >= 70) return "CRITICAL";
	if (score >= 50) return "HIGH";
	if (score >= 28) return "MODERATE";
	return "LOW";
}
function rainClass(mm24) {
	if (mm24 >= 244.5) return "Extremely heavy";
	if (mm24 >= 124.5) return "Very heavy";
	if (mm24 >= 64.5) return "Heavy";
	if (mm24 >= 35.6) return "Rather heavy";
	if (mm24 >= 7.6) return "Moderate";
	if (mm24 >= 2.5) return "Light";
	if (mm24 > 0) return "Trace";
	return "Dry";
}
function weatherLabel(code) {
	if (code == null) return "Unknown";
	if (code === 0) return "Clear";
	if (code <= 3) return "Partly cloudy";
	if (code <= 48) return "Fog";
	if (code <= 57) return "Drizzle";
	if (code <= 67) return "Rain";
	if (code <= 77) return "Snow / ice";
	if (code <= 82) return "Rain showers";
	if (code <= 86) return "Snow showers";
	if (code <= 99) return "Thunderstorm";
	return "Unknown";
}
/**
* Composite urban flood index.
* Flash = short-burst intensity (1h / 3h).
* Riverine = 24h accumulation + runoff.
* Saturation = near-surface soil moisture (antecedent wetness).
* Terrain = how far the cell sits below the local mean elevation.
*/
function floodScore(input) {
	const flash = clamp(input.p1 * 4.2 + input.p3 * 1.7, 0, 100);
	const riverine = clamp(input.p24 * .72 + input.runoff * 2.1, 0, 100);
	const saturation = clamp(input.soil * 95, 0, 100);
	const terrain = clamp((input.elevDelta ?? 0) * .42, 0, 22);
	const score = clamp(flash * .36 + riverine * .34 + saturation * .2 + terrain, 0, 100);
	return {
		score: Math.round(score),
		level: levelFromScore(score),
		flash: Math.round(flash),
		riverine: Math.round(riverine),
		saturation: Math.round(saturation),
		terrain: Math.round(terrain)
	};
}
function sumRange(arr, from, to) {
	let s = 0;
	for (let i = from; i <= to; i++) s += arr[i] ?? 0;
	return s;
}
function hourlyRisk(input) {
	const n = input.time.length;
	const out = [];
	for (let i = 0; i < n; i++) {
		const p1 = input.precipitation[i] ?? 0;
		const p3 = sumRange(input.precipitation, Math.max(0, i - 2), i);
		const p24 = sumRange(input.precipitation, Math.max(0, i - 23), i);
		const soil = input.soil[i] ?? 0;
		const runoff = input.runoff[i] ?? 0;
		const r = floodScore({
			p1,
			p3,
			p24,
			soil,
			runoff
		});
		out.push({
			time: input.time[i] ?? "",
			precip: p1,
			probability: input.probability?.[i] ?? null,
			runoff,
			soil,
			score: r.score,
			level: r.level
		});
	}
	return out;
}
function deriveNow(place, hourly, current, soilDeep) {
	const now = hourly[0];
	const window24 = hourly.slice(0, 24);
	const p1 = now?.precip ?? current.precipitation ?? 0;
	const p3 = window24.slice(0, 3).reduce((a, b) => a + b.precip, 0);
	const p24 = window24.reduce((a, b) => a + b.precip, 0);
	const soil = now?.soil ?? 0;
	const runoff = now?.runoff ?? 0;
	const risk = floodScore({
		p1,
		p3,
		p24,
		soil,
		runoff
	});
	let peak = null;
	for (const h of window24) if (!peak || h.score > peak.score) peak = {
		time: h.time,
		score: h.score,
		precip: h.precip
	};
	return {
		...risk,
		p1,
		p3,
		p24,
		soil,
		soilDeep,
		runoff,
		temperature: current.temperature,
		humidity: current.humidity,
		wind: current.wind,
		weatherCode: current.weatherCode,
		weatherLabel: weatherLabel(current.weatherCode),
		rainClass: rainClass(p24),
		peak,
		next24MaxPrecip: window24.reduce((m, h) => Math.max(m, h.precip), 0)
	};
}
function applyScenario(now, extraMm3h) {
	if (extraMm3h <= 0) return now;
	const p1 = now.p1 + extraMm3h / 3;
	const p3 = now.p3 + extraMm3h;
	const p24 = now.p24 + extraMm3h;
	const runoff = now.runoff + extraMm3h * .28;
	const soil = clamp(now.soil + extraMm3h * .004, 0, .72);
	const risk = floodScore({
		p1,
		p3,
		p24,
		soil,
		runoff,
		elevDelta: now.terrain > 0 ? now.terrain / .42 : 0
	});
	return {
		...now,
		...risk,
		p1,
		p3,
		p24,
		soil,
		runoff,
		rainClass: rainClass(p24)
	};
}
function toDaily(input) {
	return input.time.map((date, i) => ({
		date,
		precip: input.precipitation_sum[i] ?? 0,
		hours: input.precipitation_hours?.[i] ?? 0,
		weatherCode: input.weather_code?.[i] ?? 0,
		probability: input.precipitation_probability_max?.[i] ?? null
	}));
}
var PLAYBOOK = {
	CRITICAL: {
		title: "Activate flood operations",
		steps: [
			"Close underpasses and known inundation corridors",
			"Pre-deploy pumps at drainage bottlenecks",
			"Issue a public warning for low-lying settlements",
			"Stand up a 24-hour operations desk"
		]
	},
	HIGH: {
		title: "Elevated surface-flood watch",
		steps: [
			"Inspect storm drains and pumping stations",
			"Restrict movement through historic flood points",
			"Brief first responders and keep crews on standby",
			"Re-check the 3-hour accumulation every hour"
		]
	},
	MODERATE: {
		title: "Heightened monitoring",
		steps: [
			"Clear debris from inlets and culverts",
			"Increase inspection cadence on low-lying roads",
			"Watch intensity bursts over the next 6 hours",
			"Keep field crews reachable"
		]
	},
	LOW: {
		title: "Routine monitoring",
		steps: [
			"No elevated surface-flood signal in the current window",
			"Continue scheduled drain maintenance",
			"Revisit if 3-hour rainfall exceeds 20 mm"
		]
	}
};
var DEFAULT_PLACE = {
	name: "New Delhi, IN",
	lat: 28.6139,
	lon: 77.209,
	country: "IN",
	elevation: 216
};
var DEFAULT_WATCHLIST = [
	DEFAULT_PLACE,
	{
		name: "Mumbai, IN",
		lat: 19.076,
		lon: 72.8777,
		country: "IN"
	},
	{
		name: "Chennai, IN",
		lat: 13.0827,
		lon: 80.2707,
		country: "IN"
	},
	{
		name: "Kolkata, IN",
		lat: 22.5726,
		lon: 88.3639,
		country: "IN"
	},
	{
		name: "Guwahati, IN",
		lat: 26.1445,
		lon: 91.7362,
		country: "IN"
	},
	{
		name: "Patna, IN",
		lat: 25.5941,
		lon: 85.1376,
		country: "IN"
	},
	{
		name: "Kochi, IN",
		lat: 9.9312,
		lon: 76.2673,
		country: "IN"
	}
];
function worldviewUrl(lat, lon) {
	const d = 1.6;
	return `https://worldview.earthdata.nasa.gov/?v=${`${(lon - d).toFixed(3)},${(lat - d).toFixed(3)},${(lon + d).toFixed(3)},${(lat + d).toFixed(3)}`}&l=GPM_3IMERGHHE_06_precipitationCal,Coastlines_15m,Reference_Labels_15m,Reference_Features_15m&lg=true`;
}
function samePlace(a, b) {
	return Math.abs(a.lat - b.lat) < .01 && Math.abs(a.lon - b.lon) < .01;
}
var CITIES = [
	{
		id: "delhi",
		name: "New Delhi",
		lat: 28.6139,
		lon: 77.209,
		exposed: 21e4,
		informalShare: .28,
		pumpStations: 18,
		hotspots: [
			hs("del-minto", "Minto Underpass", "मिंटो अंडरपास", "underpass", 28.6304, 77.2231, 1.28, "Close to traffic; deploy pumps at both ramps"),
			hs("del-bara", "Barapullah corridor", "बरापुल्ला कॉरिडोर", "underpass", 28.5832, 77.2568, 1.22, "Divert ring-road traffic; staff the pumping kiosk"),
			hs("del-yamuna", "Yamuna Pushta / Geeta Colony", "यमुना पश्ता / गीता कॉलोनी", "settlement", 28.6554, 77.2704, 1.18, "Warn low-lying jhuggis; pre-position boats if stage is rising"),
			hs("del-ito", "ITO / Ring Road dip", "आईटीओ रिंग रोड", "drain", 28.6285, 77.2412, 1.12, "Clear inlets; hold a tow truck at the dip"),
			hs("del-jahangir", "Jahangirpuri drain belt", "जहांगीरपुरी नाला", "drain", 28.7258, 77.1662, 1.15, "Inspect nala outfall; alert night shelter wardens")
		]
	},
	{
		id: "mumbai",
		name: "Mumbai",
		lat: 19.076,
		lon: 72.8777,
		exposed: 48e4,
		informalShare: .42,
		pumpStations: 32,
		hotspots: [
			hs("mum-milan", "Milan subway", "मिलान सबवे", "underpass", 19.0864, 72.8891, 1.32, "Close subway; reroute airport-bound traffic"),
			hs("mum-sion", "Sion / King Circle", "सायन / किंग सर्कल", "underpass", 19.0368, 72.8596, 1.24, "Station pumps; restrict BEST buses through the dip"),
			hs("mum-dharavi", "Dharavi low pockets", "धारावी", "settlement", 19.043, 72.852, 1.2, "Community warning on loudhailer; keep clinic access open"),
			hs("mum-kurla", "Kurla / LBS flood belt", "कुर्ला एलबीएस", "drain", 19.065, 72.879, 1.16, "Desilt grates; hold BMC ward vans on standby"),
			hs("mum-hindmata", "Hindmata / Parel", "हिंदमाता / परेल", "drain", 18.998, 72.841, 1.14, "Watch the subway mouth; one-way if water exceeds kerb")
		]
	},
	{
		id: "chennai",
		name: "Chennai",
		lat: 13.0827,
		lon: 80.2707,
		exposed: 32e4,
		informalShare: .31,
		pumpStations: 22,
		hotspots: [
			hs("che-palli", "Pallikaranai marsh edge", "पल्लिकरनई", "basin", 12.9405, 80.2074, 1.26, "Hold development traffic; watch marsh overflow into Velachery"),
			hs("che-vela", "Velachery / Vijayanagar", "वेलाचेरी", "drain", 12.9792, 80.2206, 1.2, "Pump at the bus terminus dip; keep MRTS stairs clear"),
			hs("che-tnagar", "T. Nagar tank bund", "टी. नगर", "drain", 13.0415, 80.2334, 1.12, "Clear storm inlets on Usman Road"),
			hs("che-cooum", "Cooum bank settlements", "कूम नदी तट", "river", 13.0784, 80.2668, 1.18, "Move livestock and stores above plinth; watch high tide + rain"),
			hs("che-mudichur", "Mudichur / Tambaram", "मुदिचूर / तांबरम", "basin", 12.924, 80.101, 1.22, "Warn plotted layouts on the old lake bed")
		]
	},
	{
		id: "kolkata",
		name: "Kolkata",
		lat: 22.5726,
		lon: 88.3639,
		exposed: 29e4,
		informalShare: .34,
		pumpStations: 20,
		hotspots: [
			hs("kol-howrah", "Howrah station approach", "हावड़ा स्टेशन", "drain", 22.583, 88.342, 1.2, "Keep pedestrian skywalks open; pump the subway"),
			hs("kol-garden", "Garden Reach / Metiabruz", "गार्डन रीच", "settlement", 22.547, 88.268, 1.18, "Community boats if Hooghly stage is high"),
			hs("kol-beleghata", "Beleghata canal", "बेलेघाटा नहर", "drain", 22.562, 88.393, 1.16, "Lock canal gates if outfall is reverse-flowing"),
			hs("kol-salt", "Salt Lake Sector V dips", "सॉल्ट लेक सेक्टर ५", "drain", 22.576, 88.433, 1.1, "IT corridor diversions; keep DG sets above water line")
		]
	},
	{
		id: "guwahati",
		name: "Guwahati",
		lat: 26.1445,
		lon: 91.7362,
		exposed: 16e4,
		informalShare: .36,
		pumpStations: 9,
		hotspots: [
			hs("ghy-bharalu", "Bharalu / Bharalumukh", "भरालूमुख", "drain", 26.175, 91.74, 1.3, "Bharalu outfall first; sandbags at the market lane"),
			hs("ghy-fancy", "Fancy Bazar", "फैंसी बाजार", "drain", 26.183, 91.745, 1.18, "Raise shop inventory; one-way the inner lanes"),
			hs("ghy-anil", "Anil Nagar / Zoo Road", "अनिल नगर", "basin", 26.155, 91.775, 1.22, "Known bowl — pre-deploy two pumps")
		]
	},
	{
		id: "patna",
		name: "Patna",
		lat: 25.5941,
		lon: 85.1376,
		exposed: 19e4,
		informalShare: .33,
		pumpStations: 11,
		hotspots: [
			hs("pat-ganga", "Ganga ghats / collectorate", "गंगा घाट", "river", 25.623, 85.168, 1.24, "Watch Ganga gauge; close ghats if combined with cloudburst"),
			hs("pat-kankar", "Kankarbagh dips", "कंकरबाग", "drain", 25.594, 85.158, 1.16, "Clear colony outfalls; keep ambulance lane dry"),
			hs("pat-rajendra", "Rajendra Nagar", "राजेंद्र नगर", "drain", 25.607, 85.163, 1.12, "Inspect railway underbridge")
		]
	},
	{
		id: "kochi",
		name: "Kochi",
		lat: 9.9312,
		lon: 76.2673,
		exposed: 14e4,
		informalShare: .22,
		pumpStations: 8,
		hotspots: [
			hs("cok-marine", "Marine Drive / high tide", "मरीन ड्राइव", "river", 9.976, 76.275, 1.2, "Tide + rain compound; close the lowest promenade"),
			hs("cok-edap", "Edappally stretch", "इडप्पल्ली", "drain", 10.026, 76.308, 1.14, "NH bypass dips; keep one pump at the metro pillar"),
			hs("cok-fort", "Fort Kochi settlements", "फोर्ट कोच्चि", "settlement", 9.965, 76.242, 1.1, "Warn sea-facing lanes at spring tide")
		]
	},
	{
		id: "hyderabad",
		name: "Hyderabad",
		lat: 17.385,
		lon: 78.4867,
		exposed: 2e5,
		informalShare: .27,
		pumpStations: 14,
		hotspots: [
			hs("hyd-musi", "Musi riverbank", "मूसी तट", "river", 17.371, 78.48, 1.22, "Old City lanes; move generators upstairs"),
			hs("hyd-hussain", "Hussain Sagar bund", "हुसैन सागर", "basin", 17.423, 78.473, 1.12, "Watch tank surplus weirs"),
			hs("hyd-kukat", "Kukatpally / KPHB dips", "कूकटपल्ली", "drain", 17.494, 78.399, 1.16, "Underbridge pumping; metro feeder diversions")
		]
	}
];
function hs(id, name, nameHi, kind, lat, lon, sensitivity, action) {
	return {
		id,
		name,
		nameHi,
		kind,
		lat,
		lon,
		sensitivity,
		action,
		actionHi: kind === "underpass" ? "अंडरपास बंद करें और पंप तैनात करें" : kind === "settlement" ? "बस्ती में चेतावनी दें, ऊँचे स्थान पर शिफ्ट करें" : kind === "river" ? "नदी स्तर देखें, घाट बंद करें" : "नालों की सफाई करें, पंप तैयार रखें"
	};
}
function haversineKm(a, b) {
	const R = 6371;
	const dLat = (b.lat - a.lat) * Math.PI / 180;
	const dLon = (b.lon - a.lon) * Math.PI / 180;
	const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}
function matchCity(place) {
	const n = place.name.toLowerCase();
	const byName = CITIES.find((c) => n.includes(c.name.toLowerCase()) || n.includes(c.id));
	if (byName) return byName;
	let best = null;
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
function hotspotsFor(place) {
	const city = matchCity(place);
	if (city) return city.hotspots;
	return [{
		id: "local-basin",
		name: "Mapped basin centre",
		nameHi: "बेसिन केंद्र",
		kind: "basin",
		lat: place.lat,
		lon: place.lon,
		sensitivity: 1,
		action: "No municipal catalog for this city yet — treat the searched point as the basin centre",
		actionHi: "इस शहर की सूची जुड़ी नहीं है — खोजे गए बिंदु को बेसिन मानें"
	}];
}
function ndmaColor(level) {
	if (level === "CRITICAL") return "RED";
	if (level === "HIGH") return "ORANGE";
	if (level === "MODERATE") return "YELLOW";
	return "GREEN";
}
function scoreHotspot(cityScore, hotspot) {
	const score = Math.round(clamp(cityScore * hotspot.sensitivity, 0, 100));
	return {
		score,
		level: levelFromScore(score)
	};
}
function estimateImpact(place, cityScore) {
	const city = matchCity(place);
	const level = levelFromScore(cityScore);
	const factor = cityScore / 100;
	const exposed = city?.exposed ?? 4e4;
	const informal = city?.informalShare ?? .2;
	const people = Math.round(exposed * factor * (.22 + informal * .55));
	const spots = hotspotsFor(place).map((h) => ({
		h,
		...scoreHotspot(cityScore, h)
	}));
	return {
		people,
		underpasses: spots.filter((s) => s.h.kind === "underpass" && s.score >= 40).length,
		settlements: spots.filter((s) => s.h.kind === "settlement" && s.score >= 36).length,
		pumps: cityScore >= 70 ? city?.pumpStations ?? 4 : cityScore >= 50 ? Math.ceil((city?.pumpStations ?? 4) * .6) : cityScore >= 28 ? Math.ceil((city?.pumpStations ?? 4) * .3) : 0,
		ndma: ndmaColor(level),
		level
	};
}
var ROLE_LABEL = {
	control: "Control room",
	field: "Field crew",
	citizen: "Citizen"
};
function roleSteps(role, level, spots) {
	const names = spots.slice(0, 3).map((s) => s.name);
	const list = names.length ? names.join(", ") : "known low-lying corridors";
	if (role === "citizen") {
		if (level === "CRITICAL") return [
			"Stay on upper floors. Do not walk or drive through moving water",
			`Avoid ${list}`,
			"Keep phone charged; follow NDRF / municipal loudspeaker instructions"
		];
		if (level === "HIGH") return [
			"Delay non-essential travel. Underpasses may close without notice",
			`Stay clear of ${list}`,
			"Move documents and medicines above waist height"
		];
		if (level === "MODERATE") return ["Allow extra time; avoid flooded shortcuts", "Do not enter a dipped underpass if you cannot see the kerb"];
		return ["No public warning in force. Recheck before evening travel"];
	}
	if (role === "field") {
		if (level === "CRITICAL" || level === "HIGH") return [
			`Patrol ${list} and report water depth at kerb`,
			"Start assigned pumps; photograph inlet screens",
			"Hold one lane for emergency vehicles"
		];
		if (level === "MODERATE") return [
			"Walk the listed drains and clear debris",
			"Confirm pump fuel and couplings",
			"Report any blocked outfall"
		];
		return ["Routine inlet check on the named corridors", "Log defects before the next forecast pulse"];
	}
	if (level === "CRITICAL") return [
		"Stand up the 24-hour desk. Issue the bilingual public alert",
		`Close ${list}`,
		"Request NDRF / SDRF boats if settlements are in the amber list",
		"Open identified night shelters"
	];
	if (level === "HIGH") return [
		"Pre-deploy pumps at the named underpasses",
		`Restrict movement through ${list}`,
		"Brief ward officers every 60 minutes"
	];
	if (level === "MODERATE") return [
		"Raise inspection cadence",
		"Keep the public alert in draft",
		"Confirm shelter keys and diesel"
	];
	return ["Routine monitoring. No road closures recommended"];
}
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[opacity,transform,background-color,color,box-shadow] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.98]", {
	variants: {
		variant: {
			default: "bg-primary text-primary-fg hover:opacity-90",
			outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:bg-raised",
			ghost: "text-muted hover:bg-raised hover:text-fg",
			secondary: "bg-raised text-fg shadow-[var(--shadow-border)] hover:bg-surface"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			icon: "size-11",
			"icon-sm": "size-9"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
var Button = import_react.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size,
			className
		})),
		ref,
		...props
	});
});
Button.displayName = "Button";
function Card({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("rounded-xl bg-surface text-fg shadow-[var(--shadow-border)]", className),
		...props
	});
}
function CardHeader({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("flex items-start justify-between gap-3 px-5 pt-4 pb-3", className),
		...props
	});
}
function CardTitle({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: cn("text-sm font-medium text-fg", className),
		...props
	});
}
function CardDescription({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: cn("text-xs text-muted", className),
		...props
	});
}
function CardContent({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("px-5 pb-5", className),
		...props
	});
}
function formatHour(iso) {
	try {
		return format(parseISO(iso), "HH:mm");
	} catch {
		return iso.slice(11, 16);
	}
}
function formatDay(iso) {
	try {
		return format(parseISO(iso.length === 10 ? `${iso}T12:00:00` : iso), "EEE d");
	} catch {
		return iso;
	}
}
function formatWhen(iso) {
	try {
		return format(parseISO(iso), "d MMM, HH:mm");
	} catch {
		return iso;
	}
}
function riskTone(level) {
	switch (level) {
		case "CRITICAL": return "text-risk-critical";
		case "HIGH": return "text-risk-high";
		case "MODERATE": return "text-risk-moderate";
		default: return "text-risk-low";
	}
}
function riskDot(level) {
	switch (level) {
		case "CRITICAL": return "bg-risk-critical";
		case "HIGH": return "bg-risk-high";
		case "MODERATE": return "bg-risk-moderate";
		default: return "bg-risk-low";
	}
}
function mm(n, digits = 1) {
	return `${n.toFixed(digits)} mm`;
}
function leadTimeLabel(peakIso, nowMs = Date.now()) {
	if (!peakIso) return "No peak in the 24-hour window";
	const t = Date.parse(peakIso);
	if (!Number.isFinite(t)) return "Peak time unknown";
	const diff = t - nowMs;
	if (diff <= 0) return "Peak is in the current hour";
	const h = Math.floor(diff / 36e5);
	const m = Math.floor(diff % 36e5 / 6e4);
	if (h <= 0) return `${m} min to peak`;
	return `${h}h ${m.toString().padStart(2, "0")}m to peak`;
}
function publicAlert(place, now, spots, impact) {
	const ndma = ndmaColor(now.level);
	const avoid = spots.slice(0, 4).map((s) => s.name).join(", ");
	const avoidHi = spots.slice(0, 4).map((s) => s.nameHi).join(", ");
	const peak = now.peak ? formatWhen(now.peak.time) : "the next 12 hours";
	const lead = leadTimeLabel(now.peak?.time);
	return {
		en: now.level === "LOW" ? `FluxIQ advisory — ${place.name}. NDMA colour GREEN. Flood index ${now.score}/100. No public warning. Recheck before travel if skies darken.` : `FluxIQ ${now.level} flood alert — ${place.name}. NDMA colour ${ndma}. Index ${now.score}/100. 24h rainfall ${now.p24.toFixed(1)} mm (${now.rainClass}). ${lead}. Avoid ${avoid || "low-lying roads and underpasses"}. Peak window ${peak}. This is decision support, not an IMD / NDMA order.`,
		hi: now.level === "LOW" ? `फ्लक्सआईक्यू सूचना — ${place.name}. एनडीएमए रंग हरा. बाढ़ सूचकांक ${now.score}/100. कोई सार्वजनिक चेतावनी नहीं। यात्रा से पहले मौसम जाँचें।` : `फ्लक्सआईक्यू ${now.level === "CRITICAL" ? "आपात" : now.level === "HIGH" ? "उच्च" : "मध्यम"} बाढ़ चेतावनी — ${place.name}. एनडीएमए रंग ${ndma === "RED" ? "लाल" : ndma === "ORANGE" ? "नारंगी" : "पीला"}. सूचकांक ${now.score}/100. 24 घंटे की वर्षा ${now.p24.toFixed(1)} मिमी. ${lead}. बचें: ${avoidHi || "निचली सड़कें और अंडरपास"}. अधिकतम जोखिम ${peak}. यह निर्णय सहायता है, आधिकारिक चेतावनी नहीं.`,
		ndma,
		lead
	};
}
function sitrep(place, now, spots, impact) {
	const { en, hi, ndma, lead } = publicAlert(place, now, spots, impact);
	return [
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
		`Disclaimer: Not a substitute for IMD / CWC / NDMA official bulletins.`
	].join("\n");
}
function AlertComposer({ place, now, spots, impact, role, onRole }) {
	const [tab, setTab] = (0, import_react.useState)("alert");
	const { en, hi, ndma } = publicAlert(place, now, spots, impact);
	const report = sitrep(place, now, spots, impact);
	const steps = roleSteps(role, now.level, spots);
	async function copy(text, ok) {
		try {
			await navigator.clipboard.writeText(text);
			toast.success(ok);
		} catch {
			toast.error("Could not copy");
		}
	}
	async function share() {
		const text = `${en}\n\n${hi}`;
		if (navigator.share) try {
			await navigator.share({
				title: `FluxIQ ${ndma} — ${place.name}`,
				text
			});
			return;
		} catch {}
		await copy(text, "Alert copied");
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Operations desk" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Bilingual public alert, sitrep, role playbook" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]",
		children: [["alert", "Alert"], ["sitrep", "Sitrep"]].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => setTab(id),
			className: cn("h-8 rounded-sm px-3 text-xs font-medium", tab === id ? "bg-surface text-fg" : "text-muted"),
			children: label
		}, id))
	})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex flex-wrap gap-2",
				children: Object.keys(ROLE_LABEL).map((id) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: () => onRole(id),
					className: cn("h-9 rounded-full px-3 text-xs font-medium shadow-[var(--shadow-border)]", role === id ? "bg-raised text-fg" : "bg-surface text-muted"),
					children: ROLE_LABEL[id]
				}, id))
			}),
			tab === "alert" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-lg bg-raised px-3 py-3 text-sm leading-relaxed text-fg shadow-[var(--shadow-border)]",
						children: en
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "rounded-lg bg-raised px-3 py-3 text-sm leading-relaxed text-fg shadow-[var(--shadow-border)]",
						children: hi
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: () => void copy(`${en}\n\n${hi}`, "Bilingual alert copied"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}), "Copy EN + HI"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => void share(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, {}), "Share"]
						})]
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
					className: "max-h-56 overflow-auto rounded-lg bg-raised px-3 py-3 font-mono text-xs leading-relaxed whitespace-pre-wrap text-muted shadow-[var(--shadow-border)]",
					children: report
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => void copy(report, "Sitrep copied"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {}), "Copy sitrep"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mb-2 text-xs text-muted",
				children: [ROLE_LABEL[role], " checklist"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "space-y-2",
				children: steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
					className: "flex gap-2 text-sm leading-snug text-fg",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1.5 size-1 shrink-0 rounded-full bg-primary" }), step]
				}, step))
			})] })
		]
	})] });
}
function Separator({ className, orientation = "horizontal", decorative = true, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Root, {
		decorative,
		orientation,
		className: cn("shrink-0 bg-border", orientation === "horizontal" ? "h-px w-full" : "h-full w-px", className),
		...props
	});
}
function Meter({ label, value, icon: Icon }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between text-xs",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5 text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), label]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono tabular-nums text-fg",
				children: value
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-1.5 overflow-hidden rounded-full bg-raised",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-full rounded-full bg-primary",
				style: { width: `${Math.min(100, value)}%` }
			})
		})]
	});
}
function BriefPanel({ place, now }) {
	const play = PLAYBOOK[now.level];
	function copyBrief() {
		const lines = [
			`FluxIQ flood brief — ${place.name}`,
			`Index ${now.score}/100 · ${now.level}`,
			`3h ${now.p3.toFixed(1)} mm · 24h ${now.p24.toFixed(1)} mm (${now.rainClass})`,
			`Soil ${(now.soil * 100).toFixed(0)}% · Runoff ${now.runoff.toFixed(2)} mm`,
			now.peak ? `Peak window ${formatWhen(now.peak.time)} · index ${now.peak.score}` : "",
			play.title,
			...play.steps.map((s) => `- ${s}`)
		].filter(Boolean).join("\n");
		navigator.clipboard.writeText(lines).then(() => toast.success("Brief copied"), () => toast.error("Could not copy"));
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Decision brief" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Transparent flood index for this basin" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
				variant: "ghost",
				size: "icon-sm",
				onClick: copyBrief,
				"aria-label": "Copy brief",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Copy, {})
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("font-mono text-4xl font-medium tabular-nums tracking-tight", riskTone(now.level)),
						children: now.level
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 font-mono text-sm text-muted tabular-nums",
						children: [
							"Index ",
							now.score,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-subtle",
								children: " / 100"
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm leading-relaxed text-muted",
						children: [play.title, "."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
						className: "space-y-2",
						children: play.steps.map((step) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
							className: "flex gap-2 text-sm leading-snug text-fg",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "mt-1.5 size-1 shrink-0 rounded-full bg-primary" }), step]
						}, step))
					}),
					now.peak && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted",
						children: [
							"Peak index ",
							now.peak.score,
							" at ",
							formatWhen(now.peak.time),
							now.peak.precip > 0 ? ` · ${now.peak.precip.toFixed(1)} mm that hour` : "",
							"."
						]
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Signal mix" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "What is driving the index" })] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Flash (1–3h)",
						value: now.flash,
						icon: Droplets
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Accumulation",
						value: now.riverine,
						icon: Waves
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Soil saturation",
						value: now.saturation,
						icon: Droplets
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Meter, {
						label: "Low-lying terrain",
						value: now.terrain,
						icon: Mountain
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Thresholds" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "IMD-aligned rainfall classes" })] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-3 text-sm",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "24h class",
						v: now.rainClass
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "1h rainfall",
						v: mm(now.p1)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "3h rainfall",
						v: mm(now.p3)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "24h rainfall",
						v: mm(now.p24)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Separator, {}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Runoff",
						v: mm(now.runoff, 2)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Soil 0–7 cm",
						v: `${(now.soil * 100).toFixed(0)}%`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						k: "Soil 7–28 cm",
						v: `${(now.soilDeep * 100).toFixed(0)}%`
					})
				]
			})] })
		]
	});
}
function Row({ k, v }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted",
			children: k
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs tabular-nums text-fg",
			children: v
		})]
	});
}
var KIND_LABEL = {
	underpass: "Underpass",
	settlement: "Settlement",
	river: "River",
	drain: "Drain",
	basin: "Basin"
};
function KindIcon({ kind }) {
	if (kind === "underpass") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waypoints, { className: "size-3.5" });
	if (kind === "river" || kind === "basin") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-3.5" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "size-3.5" });
}
function HotspotPanel({ spots, cityScore, selectedId, onSelect }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Flood hotspots" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Municipal catalog — underpasses, settlements, drains. Sensitivity-weighted by the live index." })] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "space-y-1 px-2 pb-3",
		children: spots.map((spot) => {
			const { score, level } = scoreHotspot(cityScore, spot);
			const active = selectedId === spot.id;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => onSelect(spot.id),
				className: cn("flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left", active ? "bg-raised" : "hover:bg-raised/60"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("mt-1.5 size-1.5 shrink-0 rounded-full", riskDot(level)) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm text-fg",
								children: spot.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("font-mono text-xs tabular-nums", riskTone(level)),
								children: score
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "mt-0.5 flex items-center gap-1.5 text-xs text-muted",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KindIcon, { kind: spot.kind }), KIND_LABEL[spot.kind]]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "mt-1 block text-xs leading-snug text-subtle",
							children: spot.action
						})
					]
				})]
			}, spot.id);
		})
	})] });
}
function ndmaClass(code) {
	if (code === "RED") return "text-risk-critical";
	if (code === "ORANGE") return "text-risk-high";
	if (code === "YELLOW") return "text-risk-moderate";
	return "text-risk-low";
}
function Cell({ label, value, hint, tone }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-1 font-mono text-xl font-medium tabular-nums tracking-tight", tone),
				children: value
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-subtle",
				children: hint
			}) : null
		]
	});
}
function ImpactBoard({ impact, peakIso }) {
	const [, setTick] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const id = window.setInterval(() => setTick((n) => n + 1), 3e4);
		return () => window.clearInterval(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
				label: "NDMA colour",
				value: impact.ndma,
				hint: impact.level,
				tone: ndmaClass(impact.ndma)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
				label: "People on low ground",
				value: impact.people.toLocaleString("en-IN"),
				hint: "Catalogued wards × live index"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
				label: "Underpasses",
				value: String(impact.underpasses),
				hint: impact.underpasses ? "Recommend closure" : "None at threshold"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Cell, {
				label: "Lead time",
				value: leadTimeLabel(peakIso),
				hint: impact.pumps ? `${impact.pumps} pump crews` : "Peak in the 24h window"
			})
		]
	});
}
function MethodologyBody() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6 text-sm leading-relaxed text-muted",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-medium text-fg",
					children: "What FluxIQ measures"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "FluxIQ estimates urban surface-flood potential from live forecast hydrology, not from a river gauge. The index is 0–100 and is designed for municipal operations desks: when to watch underpasses, pump stations and low-lying corridors." })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-medium text-fg",
					children: "Index mix"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "space-y-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: "Flash (36%)."
						}), " 1-hour and 3-hour rainfall intensity — the signal behind pluvial / flash flooding in paved basins."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: "Accumulation (34%)."
						}), " 24-hour rainfall plus modelled surface runoff."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: "Saturation (20%)."
						}), " Near-surface soil moisture. When ECMWF soil fields are unavailable, a rainfall bucket model is used and labelled as such."] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-fg",
							children: "Terrain (up to +22)."
						}), " Cells below the local mean elevation are amplified — water gathers in the dips."] })
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "font-medium text-fg",
						children: "Bands"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "LOW 0–27 · MODERATE 28–49 · HIGH 50–69 · CRITICAL 70–100." }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "24-hour rainfall class follows IMD categories (light through extremely heavy). A 1-hour burst above 20 mm with wet soil is treated as a flash-flood watch even if the 24-hour total is still moderate." })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "font-medium text-fg",
					children: "Data provenance"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Primary hydrology: Open-Meteo (ECMWF-backed). Fallback: MET Norway location forecast. Terrain: Open-Meteo elevation when available. Basemap: OpenStreetMap / CARTO. Satellite rainfall context: NASA GPM IMERG via Worldview. Hotspots: curated municipal corridors (underpasses, settlements, drains) for major Indian cities, sensitivity-weighted by the live index. Impact counts are an operations model, not a census. Official municipal gauges are not connected. This is decision support, not an official warning." })]
			})
		]
	});
}
function ProvenanceCard({ syncedAt, status, source }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Data provenance" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Live feeds, no fabricated gauges" })] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
		className: "space-y-3 text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feed, {
				name: "Weather forecast",
				state: status === "LIVE" ? "LIVE" : status,
				note: source === "met-norway" ? "MET Norway / Yr location forecast" : "Open-Meteo / ECMWF"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feed, {
				name: "Hydrology",
				state: "ACTIVE",
				note: source === "met-norway" ? "Rainfall bucket + runoff proxy" : "Runoff + soil moisture fields"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feed, {
				name: "Terrain",
				state: source === "open-meteo" ? "ACTIVE" : "LIMITED",
				note: "Relative elevation grid when ECMWF path is up"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feed, {
				name: "Satellite rainfall",
				state: "READY",
				note: "NASA GPM IMERG / Worldview"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feed, {
				name: "Official gauge",
				state: "OPTIONAL",
				note: "Municipal sensor not connected"
			}),
			syncedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "pt-1 font-mono text-xs text-subtle",
				children: ["Last sync ", new Date(syncedAt).toLocaleTimeString()]
			})
		]
	})] });
}
function Feed({ name, state, note }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: `mt-1.5 size-1.5 shrink-0 rounded-full ${state === "OPTIONAL" || state === "LIMITED" ? "bg-risk-moderate" : "bg-risk-low"}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0 flex-1",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-fg",
					children: name
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "font-mono text-xs tracking-wider text-muted",
					children: state
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-subtle",
				children: note
			})]
		})]
	});
}
function RiskChart({ hourly }) {
	const [hours, setHours] = (0, import_react.useState)(24);
	const [mounted, setMounted] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setMounted(true), []);
	const rows = hourly.slice(0, hours).map((h) => ({
		...h,
		label: formatHour(h.time)
	}));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Flood index timeline" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Rolling 1h / 3h / 24h rainfall with soil moisture and runoff" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]",
			children: [24, 48].map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => setHours(n),
				className: cn("h-8 rounded-sm px-3 text-xs font-medium", hours === n ? "bg-surface text-fg" : "text-muted"),
				children: [n, "h"]
			}, n))
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "h-56",
			children: mounted ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResponsiveContainer, {
				width: "100%",
				height: "100%",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ComposedChart, {
					data: rows,
					margin: {
						top: 8,
						right: 8,
						left: -18,
						bottom: 0
					},
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CartesianGrid, {
							stroke: "rgba(232,234,237,0.06)",
							vertical: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(XAxis, {
							dataKey: "label",
							tick: {
								fill: "#8b929c",
								fontSize: 11
							},
							axisLine: false,
							tickLine: false,
							interval: hours === 48 ? 5 : 2
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							yAxisId: "score",
							domain: [0, 100],
							tick: {
								fill: "#8b929c",
								fontSize: 11
							},
							axisLine: false,
							tickLine: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(YAxis, {
							yAxisId: "rain",
							orientation: "right",
							hide: true,
							domain: [0, (max) => Math.max(8, max * 1.4)]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Tooltip, {
							cursor: { fill: "rgba(232,234,237,0.04)" },
							contentStyle: {
								background: "#181c22",
								border: "1px solid #262b33",
								borderRadius: 10,
								fontSize: 12,
								color: "#e8eaed"
							},
							formatter: (value, name) => {
								const n = typeof value === "number" ? value : Number(value);
								if (name === "score") return [`${n} / 100`, "Flood index"];
								if (name === "precip") return [`${n.toFixed(1)} mm`, "Rainfall"];
								return [n, String(name)];
							}
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Area, {
							yAxisId: "score",
							type: "monotone",
							dataKey: "score",
							stroke: "#8fb4c0",
							fill: "#8fb4c0",
							fillOpacity: .12,
							strokeWidth: 1.6,
							dot: false,
							isAnimationActive: false
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bar, {
							yAxisId: "rain",
							dataKey: "precip",
							fill: "#6a717b",
							radius: [
								3,
								3,
								0,
								0
							],
							maxBarSize: 10,
							isAnimationActive: false
						})
					]
				})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full rounded-md bg-raised" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-3 flex gap-4 text-xs text-muted",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "h-0.5 w-4 bg-primary" }), " Flood index"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "inline-flex items-center gap-1.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("i", { className: "size-2 rounded-sm bg-subtle" }), " Hourly rainfall"]
			})]
		})] })]
	});
}
var Input = import_react.forwardRef(({ className, type, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		className: cn("flex h-11 w-full rounded-md bg-raised px-3 py-2 text-sm text-fg shadow-[var(--shadow-border)] placeholder:text-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", className),
		ref,
		...props
	});
});
Input.displayName = "Input";
var FORECAST = "https://api.open-meteo.com/v1/forecast";
var GEO = "https://geocoding-api.open-meteo.com/v1/search";
var REVERSE = "https://geocoding-api.open-meteo.com/v1/reverse";
var ELEV = "https://api.open-meteo.com/v1/elevation";
var METNO = "https://api.met.no/weatherapi/locationforecast/2.0/complete";
var METNO_COMPACT = "https://api.met.no/weatherapi/locationforecast/2.0/compact";
var NOMINATIM = "https://nominatim.openstreetmap.org";
var HOURLY = "precipitation,rain,precipitation_probability,soil_moisture_0_to_7cm,soil_moisture_7_to_28cm,runoff,weather_code,temperature_2m,wind_speed_10m";
var CURRENT = "temperature_2m,precipitation,rain,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature";
var DAILY = "precipitation_sum,precipitation_hours,rain_sum,weather_code,precipitation_probability_max";
function asList(data) {
	return Array.isArray(data) ? data : [data];
}
async function getJson(url) {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Feed unavailable (${res.status})`);
	const data = await res.json();
	if (data && typeof data === "object" && "error" in data && data.error) throw new Error(data.reason ?? "Feed unavailable");
	return data;
}
async function searchPlaces(query) {
	try {
		const hits = ((await getJson(`${GEO}?name=${encodeURIComponent(query)}&count=6&language=en&format=json`)).results ?? []).map((x) => ({
			name: [
				x.name,
				x.admin1,
				x.country_code
			].filter(Boolean).join(", "),
			lat: x.latitude,
			lon: x.longitude,
			country: x.country_code,
			admin: x.admin1,
			elevation: x.elevation
		}));
		if (hits.length) return hits;
	} catch {}
	return (await getJson(`${NOMINATIM}/search?q=${encodeURIComponent(query)}&format=json&limit=6`)).map((x) => ({
		name: x.name ? x.display_name.split(",").slice(0, 3).join(",") : x.display_name,
		lat: Number(x.lat),
		lon: Number(x.lon)
	}));
}
async function reversePlace(lat, lon) {
	try {
		const hit = (await getJson(`${REVERSE}?latitude=${lat}&longitude=${lon}&language=en&format=json`)).results?.[0];
		if (hit) return {
			name: [
				hit.name,
				hit.admin1,
				hit.country_code
			].filter(Boolean).join(", "),
			lat,
			lon,
			country: hit.country_code,
			admin: hit.admin1,
			elevation: hit.elevation
		};
	} catch {}
	try {
		const data = await getJson(`${NOMINATIM}/reverse?lat=${lat}&lon=${lon}&format=json`);
		return {
			name: data.name ?? data.display_name ?? `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
			lat,
			lon
		};
	} catch {
		return {
			name: `${lat.toFixed(3)}, ${lon.toFixed(3)}`,
			lat,
			lon
		};
	}
}
function gridPoints(place) {
	const steps = [
		-1,
		0,
		1
	];
	const dlat = .06;
	const dlon = .06 / Math.max(.35, Math.cos(place.lat * Math.PI / 180));
	const cells = [];
	for (const dy of steps) for (const dx of steps) cells.push({
		lat: place.lat + dy * dlat,
		lon: place.lon + dx * dlon
	});
	return cells;
}
async function fetchElevations(points) {
	return (await getJson(`${ELEV}?latitude=${points.map((p) => p.lat.toFixed(4)).join(",")}&longitude=${points.map((p) => p.lon.toFixed(4)).join(",")}`)).elevation ?? points.map(() => 0);
}
async function fetchRiskGrid(place) {
	const points = gridPoints(place);
	const url = `${FORECAST}?latitude=${points.map((p) => p.lat.toFixed(4)).join(",")}&longitude=${points.map((p) => p.lon.toFixed(4)).join(",")}&hourly=precipitation,soil_moisture_0_to_7cm,runoff&forecast_days=1&timezone=auto`;
	const [forecasts, elevations] = await Promise.all([getJson(url).then(asList), fetchElevations(points).catch(() => points.map(() => place.elevation ?? 0))]);
	const meanElev = elevations.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0) / Math.max(1, elevations.length);
	return points.map((p, i) => {
		const h = (forecasts[i] ?? forecasts[0])?.hourly;
		const precip = h?.precipitation ?? [];
		const soil = h?.soil_moisture_0_to_7cm ?? [];
		const runoff = h?.runoff ?? [];
		const p3 = precip.slice(0, 3).reduce((a, b) => a + (b ?? 0), 0);
		const p24 = precip.slice(0, 24).reduce((a, b) => a + (b ?? 0), 0);
		const soil0 = soil[0] ?? 0;
		const run0 = runoff[0] ?? 0;
		const elevation = elevations[i] ?? meanElev;
		const elevDelta = meanElev - elevation;
		const risk = floodScore({
			p1: precip[0] ?? 0,
			p3,
			p24,
			soil: soil0,
			runoff: run0,
			elevDelta
		});
		return {
			lat: p.lat,
			lon: p.lon,
			elevation,
			elevDelta,
			p3,
			p24,
			soil: soil0,
			runoff: run0,
			score: risk.score,
			level: risk.level
		};
	});
}
async function fetchOpenMeteoBundle(place) {
	const url = `${FORECAST}?latitude=${place.lat}&longitude=${place.lon}&current=${CURRENT}&hourly=${HOURLY}&daily=${DAILY}&forecast_days=7&timezone=auto`;
	const [forecast, grid] = await Promise.all([getJson(url), fetchRiskGrid(place).catch(() => [])]);
	const hourlySrc = forecast.hourly;
	if (!hourlySrc?.time?.length) throw new Error("Forecast feed returned no hourly series");
	const hourly = hourlyRisk({
		time: hourlySrc.time,
		precipitation: hourlySrc.precipitation,
		runoff: hourlySrc.runoff,
		soil: hourlySrc.soil_moisture_0_to_7cm,
		probability: hourlySrc.precipitation_probability
	});
	const daily = forecast.daily ? toDaily(forecast.daily) : [];
	const derived = deriveNow(place, hourly, {
		temperature: forecast.current?.temperature_2m ?? null,
		humidity: forecast.current?.relative_humidity_2m ?? null,
		wind: forecast.current?.wind_speed_10m ?? null,
		weatherCode: forecast.current?.weather_code ?? null,
		precipitation: forecast.current?.precipitation ?? null
	}, hourlySrc.soil_moisture_7_to_28cm?.[0] ?? 0);
	return {
		place: {
			...place,
			elevation: place.elevation ?? grid.find((c) => Math.abs(c.lat - place.lat) < .02)?.elevation
		},
		derived,
		hourly,
		daily,
		grid,
		syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
		source: "open-meteo"
	};
}
function symbolToCode(symbol) {
	const s = symbol ?? "";
	if (s.includes("thunder")) return 95;
	if (s.includes("heavyrain")) return 65;
	if (s.includes("rainshowers") || s.includes("lightrain")) return 80;
	if (s.includes("rain")) return 63;
	if (s.includes("fog")) return 45;
	if (s.includes("cloudy")) return 3;
	if (s.includes("fair") || s.includes("partly")) return 2;
	return 0;
}
function moistureBucket(precip) {
	const soil = [];
	const runoff = [];
	let wet = .16;
	for (let i = 0; i < precip.length; i++) {
		const p = precip[i] ?? 0;
		wet = Math.max(.1, Math.min(.65, wet * .986 + p * .014));
		soil.push(wet);
		const abstraction = 7.5 * (1 - wet);
		runoff.push(Math.max(0, p - abstraction) * (.3 + wet * .55));
	}
	return {
		soil,
		runoff
	};
}
function parseMetNo(data, place) {
	const series = data.properties?.timeseries ?? [];
	if (series.length === 0) throw new Error("MET Norway returned an empty series");
	const time = [];
	const precipitation = [];
	for (const step of series) {
		const p1 = step.data.next_1_hours?.details?.precipitation_amount;
		if (p1 == null) continue;
		time.push(step.time);
		precipitation.push(p1);
	}
	if (time.length < 6) for (const step of series) {
		const p6 = step.data.next_6_hours?.details?.precipitation_amount;
		if (p6 == null) continue;
		time.push(step.time);
		precipitation.push(p6 / 6);
	}
	if (time.length === 0) throw new Error("MET Norway returned no precipitation steps");
	const { soil, runoff } = moistureBucket(precipitation);
	const hourly = hourlyRisk({
		time,
		precipitation,
		runoff,
		soil
	});
	const byDay = /* @__PURE__ */ new Map();
	series.forEach((step, i) => {
		const day = step.time.slice(0, 10);
		const amount = step.data.next_1_hours?.details?.precipitation_amount ?? (step.data.next_6_hours?.details?.precipitation_amount ?? 0) / 6;
		const cur = byDay.get(day) ?? {
			precip: 0,
			hours: 0,
			code: 0
		};
		cur.precip += amount;
		if (amount > .1) cur.hours += 1;
		if (i === 12 || !cur.code) cur.code = symbolToCode(step.data.next_1_hours?.summary?.symbol_code);
		byDay.set(day, cur);
	});
	const daily = [...byDay.entries()].slice(0, 7).map(([date, v]) => ({
		date,
		precip: v.precip,
		hours: v.hours,
		weatherCode: v.code,
		probability: null
	}));
	const now = series[0]?.data;
	const derived = deriveNow(place, hourly, {
		temperature: now?.instant?.details?.air_temperature ?? null,
		humidity: now?.instant?.details?.relative_humidity ?? null,
		wind: now?.instant?.details?.wind_speed ?? null,
		weatherCode: symbolToCode(now?.next_1_hours?.summary?.symbol_code),
		precipitation: now?.next_1_hours?.details?.precipitation_amount ?? null
	}, soil[0] ?? .16);
	const elev = data.geometry?.coordinates?.[2];
	const center = {
		lat: place.lat,
		lon: place.lon,
		elevation: elev ?? place.elevation ?? 0,
		elevDelta: 0,
		p3: derived.p3,
		p24: derived.p24,
		soil: derived.soil,
		runoff: derived.runoff,
		score: derived.score,
		level: derived.level
	};
	return {
		place: {
			...place,
			elevation: place.elevation ?? elev
		},
		derived,
		hourly,
		daily,
		grid: [center],
		syncedAt: (/* @__PURE__ */ new Date()).toISOString(),
		source: "met-norway"
	};
}
async function fetchMetNoBundle(place) {
	return parseMetNo(await getJson(`${METNO}?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}`), place);
}
async function fetchFloodBundle(place) {
	try {
		return await fetchMetNoBundle(place);
	} catch {
		return await fetchOpenMeteoBundle(place);
	}
}
async function fetchWatchScores(places) {
	if (places.length === 0) return [];
	try {
		return await Promise.all(places.map(async (place) => {
			const precip = ((await getJson(`${METNO_COMPACT}?lat=${place.lat.toFixed(4)}&lon=${place.lon.toFixed(4)}`)).properties?.timeseries ?? []).map((s) => s.data.next_1_hours?.details?.precipitation_amount).filter((n) => n != null);
			const p1 = precip[0] ?? 0;
			const p3 = precip.slice(0, 3).reduce((a, b) => a + b, 0);
			const p24 = precip.slice(0, 24).reduce((a, b) => a + b, 0);
			const { soil, runoff } = moistureBucket(precip);
			const risk = floodScore({
				p1,
				p3,
				p24,
				soil: soil[0] ?? .16,
				runoff: runoff[0] ?? 0
			});
			return {
				place,
				score: risk.score,
				level: risk.level,
				p24
			};
		}));
	} catch {
		const forecasts = asList(await getJson(`${FORECAST}?latitude=${places.map((p) => p.lat.toFixed(4)).join(",")}&longitude=${places.map((p) => p.lon.toFixed(4)).join(",")}&hourly=precipitation,soil_moisture_0_to_7cm,runoff&forecast_days=1&timezone=auto`));
		return places.map((place, i) => {
			const h = forecasts[i]?.hourly ?? forecasts[0]?.hourly;
			const precip = h?.precipitation ?? [];
			const p1 = precip[0] ?? 0;
			const p3 = precip.slice(0, 3).reduce((a, b) => a + (b ?? 0), 0);
			const p24 = precip.slice(0, 24).reduce((a, b) => a + (b ?? 0), 0);
			const risk = floodScore({
				p1,
				p3,
				p24,
				soil: h?.soil_moisture_0_to_7cm?.[0] ?? 0,
				runoff: h?.runoff?.[0] ?? 0
			});
			return {
				place,
				score: risk.score,
				level: risk.level,
				p24
			};
		});
	}
}
function SearchBox({ onSelect }) {
	const [query, setQuery] = (0, import_react.useState)("");
	const [hits, setHits] = (0, import_react.useState)([]);
	const [open, setOpen] = (0, import_react.useState)(false);
	const [active, setActive] = (0, import_react.useState)(0);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const boxRef = (0, import_react.useRef)(null);
	const inputRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const onKey = (e) => {
			if (e.key === "/" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
				e.preventDefault();
				inputRef.current?.focus();
			}
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	(0, import_react.useEffect)(() => {
		if (query.trim().length < 3) {
			setHits([]);
			setLoading(false);
			return;
		}
		setLoading(true);
		const t = setTimeout(() => {
			searchPlaces(query.trim()).then((r) => {
				setHits(r);
				setActive(0);
				setOpen(true);
			}).catch(() => setHits([])).finally(() => setLoading(false));
		}, 280);
		return () => clearTimeout(t);
	}, [query]);
	(0, import_react.useEffect)(() => {
		const onDoc = (e) => {
			if (!boxRef.current?.contains(e.target)) setOpen(false);
		};
		document.addEventListener("mousedown", onDoc);
		return () => document.removeEventListener("mousedown", onDoc);
	}, []);
	function choose(place) {
		onSelect(place);
		setQuery("");
		setHits([]);
		setOpen(false);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: boxRef,
		className: "relative min-w-0 flex-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
				ref: inputRef,
				value: query,
				onChange: (e) => setQuery(e.target.value),
				onFocus: () => hits.length > 0 && setOpen(true),
				onKeyDown: (e) => {
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
				},
				placeholder: "Search city or basin",
				"aria-label": "Search location",
				className: "pl-9 pr-10",
				autoComplete: "off"
			}),
			loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted" }),
			open && hits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "absolute top-12 z-30 w-full overflow-hidden rounded-lg bg-raised py-1 shadow-[var(--shadow-border)]",
				children: hits.map((hit, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onMouseDown: (e) => e.preventDefault(),
					onClick: () => choose(hit),
					className: cn("flex w-full flex-col items-start px-3 py-2.5 text-left text-sm", i === active ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hit.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-mono text-xs text-subtle",
						children: [
							hit.lat.toFixed(3),
							", ",
							hit.lon.toFixed(3)
						]
					})]
				}, `${hit.lat}-${hit.lon}-${i}`))
			})
		]
	});
}
function useFloodData(place) {
	const [status, setStatus] = (0, import_react.useState)("SYNCING");
	const [bundle, setBundle] = (0, import_react.useState)(null);
	const [error, setError] = (0, import_react.useState)("");
	const reload = (0, import_react.useCallback)(async () => {
		setStatus("SYNCING");
		try {
			const next = await fetchFloodBundle(place);
			setBundle(next);
			setError("");
			setStatus("LIVE");
		} catch (e) {
			setStatus("DEGRADED");
			setError(e instanceof Error ? e.message : "Forecast feed unavailable");
		}
	}, [place]);
	(0, import_react.useEffect)(() => {
		let alive = true;
		setBundle(null);
		setStatus("SYNCING");
		fetchFloodBundle(place).then((next) => {
			if (!alive) return;
			setBundle(next);
			setError("");
			setStatus("LIVE");
		}).catch((e) => {
			if (!alive) return;
			setStatus("DEGRADED");
			setError(e instanceof Error ? e.message : "Forecast feed unavailable");
		});
		const id = window.setInterval(() => {
			if (!alive) return;
			reload();
		}, 6e5);
		return () => {
			alive = false;
			window.clearInterval(id);
		};
	}, [place, reload]);
	return {
		status,
		bundle,
		error,
		reload
	};
}
function useWatchScores(places) {
	const [scores, setScores] = (0, import_react.useState)([]);
	const key = places.map((p) => `${p.lat.toFixed(3)},${p.lon.toFixed(3)}`).join("|");
	(0, import_react.useEffect)(() => {
		let alive = true;
		fetchWatchScores(places).then((s) => {
			if (alive) setScores(s);
		}).catch(() => {
			if (alive) setScores([]);
		});
		return () => {
			alive = false;
		};
	}, [key]);
	return scores;
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide", {
	variants: { variant: {
		default: "bg-raised text-muted shadow-[var(--shadow-border)]",
		live: "bg-risk-low/15 text-risk-low",
		warn: "bg-risk-moderate/15 text-risk-moderate",
		high: "bg-risk-high/15 text-risk-high",
		critical: "bg-risk-critical/15 text-risk-critical"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var Sheet = Dialog;
var SheetTrigger = DialogTrigger;
function SheetContent({ className, children, title, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogPortal, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogOverlay, { className: "fixed inset-0 z-50 bg-bg/70" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
		className: cn("fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-md flex-col bg-surface shadow-[var(--shadow-border)]", className),
		...props,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between gap-3 border-b border-border px-5 py-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-sm font-medium",
					children: title
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
					className: "sr-only",
					children: [title, " details"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogClose, {
					asChild: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						size: "icon-sm",
						"aria-label": "Close",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {})
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 overflow-y-auto px-5 py-5",
			children
		})]
	})] });
}
function Skeleton({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("animate-pulse rounded-md bg-raised", className),
		...props
	});
}
var PLACE_KEY = "fluxiq.place.v1";
var WATCH_KEY = "fluxiq.watchlist.v1";
function read(key, fallback) {
	if (typeof window === "undefined") return fallback;
	try {
		const raw = window.localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}
function write(key, value) {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem(key, JSON.stringify(value));
	} catch {}
}
function loadSavedPlace() {
	const p = read(PLACE_KEY, null);
	if (p && typeof p.lat === "number" && typeof p.lon === "number") return p;
	return DEFAULT_PLACE;
}
function savePlace(place) {
	write(PLACE_KEY, place);
}
function loadWatchlist() {
	const list = read(WATCH_KEY, null);
	if (Array.isArray(list) && list.length > 0) return list;
	return DEFAULT_WATCHLIST;
}
function saveWatchlist(list) {
	write(WATCH_KEY, list);
}
function MapCanvasLazy(props) {
	const [Comp, setComp] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		import("./map-canvas-YeQwXrUZ.mjs").then((m) => setComp(() => m.default));
	}, []);
	if (!Comp) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-full w-full bg-raised" });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Comp, { ...props });
}
function statusBadge(status) {
	if (status === "LIVE") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "live",
		children: "LIVE"
	});
	if (status === "DEGRADED") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
		variant: "warn",
		children: "DEGRADED"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, { children: "SYNCING" });
}
function Metric({ label, value, unit, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "px-4 py-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-1 font-mono text-2xl font-medium tabular-nums tracking-tight",
				children: [value, unit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "ml-1 text-sm font-normal text-subtle",
					children: unit
				}) : null]
			}),
			hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-xs text-subtle",
				children: hint
			}) : null
		]
	});
}
function CommandCenter() {
	const [place, setPlace] = (0, import_react.useState)(DEFAULT_PLACE);
	const [watch, setWatch] = (0, import_react.useState)(DEFAULT_WATCHLIST);
	const [layer, setLayer] = (0, import_react.useState)("risk");
	const [locating, setLocating] = (0, import_react.useState)(false);
	const [role, setRole] = (0, import_react.useState)("control");
	const [selectedHotspot, setSelectedHotspot] = (0, import_react.useState)();
	const [scenario, setScenario] = (0, import_react.useState)(0);
	const { status, bundle, error, reload } = useFloodData(place);
	const scores = useWatchScores(watch);
	const now = (0, import_react.useMemo)(() => bundle ? applyScenario(bundle.derived, scenario) : void 0, [bundle, scenario]);
	const pinned = watch.some((w) => samePlace(w, place));
	const spots = (0, import_react.useMemo)(() => hotspotsFor(place), [place]);
	const impact = (0, import_react.useMemo)(() => estimateImpact(place, now?.score ?? 0), [place, now?.score]);
	(0, import_react.useEffect)(() => {
		setPlace(loadSavedPlace());
		setWatch(loadWatchlist());
	}, []);
	(0, import_react.useEffect)(() => {
		setSelectedHotspot(void 0);
	}, [place.lat, place.lon]);
	function selectPlace(next) {
		setPlace(next);
		savePlace(next);
	}
	function togglePin() {
		const next = pinned ? watch.filter((w) => !samePlace(w, place)) : [...watch.filter((w) => !samePlace(w, place)), place];
		setWatch(next);
		saveWatchlist(next);
	}
	function locate() {
		if (!navigator.geolocation) {
			toast.error("Location is not available in this browser");
			return;
		}
		setLocating(true);
		navigator.geolocation.getCurrentPosition(async (pos) => {
			try {
				selectPlace(await reversePlace(pos.coords.latitude, pos.coords.longitude));
			} catch {
				selectPlace({
					name: "Current location",
					lat: pos.coords.latitude,
					lon: pos.coords.longitude
				});
			} finally {
				setLocating(false);
			}
		}, () => {
			setLocating(false);
			toast.error("Could not read location");
		}, {
			enableHighAccuracy: true,
			timeout: 12e3
		});
	}
	const outlook = (0, import_react.useMemo)(() => bundle?.daily.slice(0, 7) ?? [], [bundle]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-dvh flex-col",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "sticky top-0 z-20 border-b border-border bg-bg/90 backdrop-blur-md",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-screen-2xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex size-9 items-center justify-center rounded-md bg-raised shadow-[var(--shadow-border)]",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Waves, { className: "size-4 text-primary" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium leading-none",
									children: "FluxIQ"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-1 text-xs tracking-wide text-muted uppercase",
									children: "Flood detection"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-0 flex-1 items-center gap-2 lg:px-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SearchBox, { onSelect: selectPlace }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								size: "icon",
								onClick: locate,
								"aria-label": "Use my location",
								disabled: locating,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Locate, { className: locating ? "animate-pulse" : void 0 })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [
								statusBadge(status),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTrigger, {
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
										variant: "ghost",
										size: "sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, {}), "Method"]
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetContent, {
									title: "Detection method",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MethodologyBody, {})
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => void reload(),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: status === "SYNCING" ? "animate-spin" : void 0 }), "Refresh"]
								})
							]
						})
					]
				})
			}),
			scenario > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-primary/25 bg-primary/10 px-4 py-2.5 text-sm text-primary sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-screen-2xl",
					children: [
						"Scenario overlay: +",
						scenario,
						" mm in 3 hours is added on top of the live forecast. Not observed rainfall — use this to drill the desk before a cloudburst."
					]
				})
			}),
			now && (now.level === "HIGH" || now.level === "CRITICAL") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("border-b px-4 py-2.5 text-sm sm:px-6", now.level === "CRITICAL" ? "border-risk-critical/30 bg-risk-critical/10 text-risk-critical" : "border-risk-high/30 bg-risk-high/10 text-risk-high"),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto flex max-w-screen-2xl items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CloudRain, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
						now.level === "CRITICAL" ? "Critical flood signal" : "Elevated flood watch",
						" at",
						" ",
						place.name,
						". 24h ",
						mm(now.p24),
						" · ",
						now.rainClass.toLowerCase(),
						" rain class."
					] })]
				})
			}),
			error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-risk-moderate/30 bg-risk-moderate/10 px-4 py-2.5 text-sm text-risk-moderate sm:px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mx-auto max-w-screen-2xl",
					children: [
						"Forecast feed issue: ",
						error,
						". Last successful model state is shown where available."
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
				className: "mx-auto flex w-full max-w-screen-2xl flex-1 flex-col gap-4 px-4 py-5 sm:px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs tracking-widest text-primary uppercase",
									children: "Real-time decision support"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "mt-1 text-3xl font-medium tracking-tight sm:text-4xl",
									children: place.name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "mt-2 max-w-2xl text-sm leading-relaxed text-muted",
									children: "Municipal flood desk: live hydrology, catalogued hotspots, NDMA colour, bilingual public alerts and a role-based playbook. Not a substitute for IMD or NDMA warnings."
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "mt-2 font-mono text-xs text-subtle tabular-nums",
									children: [
										place.lat.toFixed(4),
										"° N, ",
										place.lon.toFixed(4),
										"° E",
										place.elevation != null ? ` · ${Math.round(place.elevation)} m` : ""
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]",
									children: [
										[0, "Observed"],
										[20, "+20 mm"],
										[40, "+40 mm"],
										[80, "Cloudburst"]
									].map(([mmAdd, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setScenario(mmAdd),
										className: cn("h-9 rounded-sm px-3 text-xs font-medium", scenario === mmAdd ? "bg-surface text-fg" : "text-muted"),
										children: label
									}, mmAdd))
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: pinned ? "secondary" : "outline",
									size: "sm",
									onClick: togglePin,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pin, {}), pinned ? "Watching" : "Watch location"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									size: "sm",
									asChild: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
										href: worldviewUrl(place.lat, place.lon),
										target: "_blank",
										rel: "noreferrer",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Satellite, {}),
											"NASA GPM",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })
										]
									})
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0",
						children: watch.map((w) => {
							const s = scores.find((x) => samePlace(x.place, w));
							const active = samePlace(w, place);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => selectPlace(w),
								className: cn("flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm shadow-[var(--shadow-border)]", active ? "bg-raised text-fg" : "bg-surface text-muted hover:text-fg"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", s ? riskDot(s.level) : "bg-subtle") }),
									w.name.split(",")[0],
									s ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-mono text-xs tabular-nums text-subtle",
										children: s.score
									}) : null
								]
							}, `${w.lat}-${w.lon}`);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
						className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
						children: now ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Flood index",
								value: String(now.score),
								unit: "/100",
								hint: now.level
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "3h rainfall",
								value: now.p3.toFixed(1),
								unit: "mm",
								hint: "Flash window"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "24h rainfall",
								value: now.p24.toFixed(1),
								unit: "mm",
								hint: now.rainClass
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Metric, {
								label: "Soil moisture",
								value: (now.soil * 100).toFixed(0),
								unit: "%",
								hint: now.weatherLabel
							})
						] }) : Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-xl" }, i))
					}),
					now ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImpactBoard, {
						impact,
						peakIso: now.peak?.time
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-2 gap-3 lg:grid-cols-4",
						children: Array.from({ length: 4 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-24 rounded-xl" }, i))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "grid grid-cols-1 gap-4 xl:grid-cols-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
							className: "overflow-hidden p-0 xl:col-span-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
								className: "border-b border-border",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Flood risk surface" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: bundle && bundle.grid.length > 1 ? `${bundle.grid.length}-cell hydrology grid, terrain-weighted` : "Basin-centred flood halo from the live forecast" })] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex rounded-md bg-raised p-0.5 shadow-[var(--shadow-border)]",
									children: [
										["risk", "Risk"],
										["rain", "Rain"],
										["terrain", "Terrain"]
									].map(([id, label]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										onClick: () => setLayer(id),
										className: cn("h-8 rounded-sm px-3 text-xs font-medium", layer === id ? "bg-surface text-fg" : "text-muted"),
										children: label
									}, id))
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative h-80 md:h-96",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapCanvasLazy, {
										place,
										grid: bundle?.grid ?? [],
										layer,
										level: now?.level ?? "LOW",
										hotspots: spots,
										cityScore: now?.score ?? 0,
										selectedId: selectedHotspot,
										onSelectHotspot: setSelectedHotspot
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "pointer-events-none absolute bottom-3 left-3 rounded-md bg-bg/85 px-2.5 py-1.5 font-mono text-xs text-muted shadow-[var(--shadow-border)]",
										children: now ? `${now.level} · ${layer} layer` : "Synchronising"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pointer-events-none absolute right-3 bottom-10 hidden rounded-md bg-bg/85 px-2.5 py-2 text-xs text-muted shadow-[var(--shadow-border)] sm:block",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mb-1.5 tracking-wide uppercase",
												children: "Index"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-risk-low" }), " Low"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-1 flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-risk-moderate" }), " Moderate"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-1 flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-risk-high" }), " High"]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-1 flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-2 rounded-full bg-risk-critical" }), " Critical"]
											})
										]
									})
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col gap-3",
							children: [
								now ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BriefPanel, {
									place: bundle?.place ?? place,
									now
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-64 rounded-xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-40 rounded-xl" })] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HotspotPanel, {
									spots,
									cityScore: now?.score ?? 0,
									selectedId: selectedHotspot,
									onSelect: setSelectedHotspot
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProvenanceCard, {
									syncedAt: bundle?.syncedAt,
									status,
									source: bundle?.source
								})
							]
						})]
					}),
					now ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AlertComposer, {
						place: bundle?.place ?? place,
						now,
						spots,
						impact,
						role,
						onRole: setRole
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72 rounded-xl" }),
					bundle ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiskChart, { hourly: bundle.hourly }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-72 rounded-xl" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Seven-day accumulation" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardDescription, { children: "Daily rainfall totals from the same forecast cycle" })] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: outlook.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Skeleton, { className: "h-20" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex gap-2 overflow-x-auto",
						children: outlook.map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex min-w-16 flex-1 flex-col items-center gap-1 rounded-lg bg-raised px-2 py-3 text-center shadow-[var(--shadow-border)]",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted",
									children: formatDay(d.date)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Droplets, { className: cn("size-4", d.precip >= 64.5 ? "text-risk-critical" : d.precip >= 35.6 ? "text-risk-high" : d.precip >= 7.6 ? "text-primary" : "text-subtle") }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-mono text-xs tabular-nums",
									children: d.precip.toFixed(1)
								})
							]
						}, d.date))
					}) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("footer", {
						className: "pb-8 text-center text-xs text-subtle",
						children: "FluxIQ flood detection · Open-Meteo + NASA GPM context · Not an official emergency warning"
					})
				]
			})
		]
	});
}
var routes_exports = /* @__PURE__ */ __exportAll({ component: () => Home });
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CommandCenter, {});
}
//#endregion
export { scoreHotspot as n, routes_exports as t };
