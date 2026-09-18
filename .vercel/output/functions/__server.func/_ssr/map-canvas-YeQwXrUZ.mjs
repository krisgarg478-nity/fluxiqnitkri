import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as scoreHotspot } from "./routes-bNBlbAFp.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/map-canvas-YeQwXrUZ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var STYLE = "https://tiles.openfreemap.org/styles/dark";
var RASTER_FALLBACK = {
	version: 8,
	sources: { carto: {
		type: "raster",
		tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
		tileSize: 256,
		attribution: "&copy; OpenStreetMap &copy; CARTO"
	} },
	layers: [{
		id: "carto",
		type: "raster",
		source: "carto"
	}]
};
var LEVEL_COLOR = {
	LOW: "#6f9e86",
	MODERATE: "#c4a56a",
	HIGH: "#c47a52",
	CRITICAL: "#c45c5c"
};
function toGeoJSON(grid, layer) {
	return {
		type: "FeatureCollection",
		features: grid.map((cell) => ({
			type: "Feature",
			properties: {
				score: cell.score,
				p3: cell.p3,
				p24: cell.p24,
				elevDelta: cell.elevDelta,
				elevation: cell.elevation,
				level: cell.level,
				metric: layer === "rain" ? cell.p3 : layer === "terrain" ? cell.elevDelta : cell.score
			},
			geometry: {
				type: "Point",
				coordinates: [cell.lon, cell.lat]
			}
		}))
	};
}
function hotspotsGeoJSON(hotspots, cityScore, selectedId) {
	return {
		type: "FeatureCollection",
		features: hotspots.map((h) => {
			const scored = scoreHotspot(cityScore, h);
			return {
				type: "Feature",
				properties: {
					id: h.id,
					name: h.name,
					kind: h.kind,
					action: h.action,
					score: scored.score,
					level: scored.level,
					selected: selectedId === h.id ? 1 : 0
				},
				geometry: {
					type: "Point",
					coordinates: [h.lon, h.lat]
				}
			};
		})
	};
}
function colorExpr(layer) {
	const stops = layer === "rain" ? [
		8,
		20,
		40
	] : layer === "terrain" ? [
		8,
		16,
		28
	] : [
		28,
		50,
		70
	];
	return [
		"interpolate",
		["linear"],
		["get", "metric"],
		0,
		"#6f9e86",
		stops[0],
		"#c4a56a",
		stops[1],
		"#c47a52",
		stops[2],
		"#c45c5c"
	];
}
function MapCanvas({ place, grid, layer, level, hotspots, cityScore, selectedId, onSelectHotspot }) {
	const hostRef = (0, import_react.useRef)(null);
	const mapRef = (0, import_react.useRef)(null);
	const readyRef = (0, import_react.useRef)(false);
	const gridRef = (0, import_react.useRef)(grid);
	const layerRef = (0, import_react.useRef)(layer);
	const placeRef = (0, import_react.useRef)(place);
	const levelRef = (0, import_react.useRef)(level);
	const hotspotsRef = (0, import_react.useRef)(hotspots);
	const scoreRef = (0, import_react.useRef)(cityScore);
	const selectedRef = (0, import_react.useRef)(selectedId);
	const selectRef = (0, import_react.useRef)(onSelectHotspot);
	gridRef.current = grid;
	layerRef.current = layer;
	placeRef.current = place;
	levelRef.current = level;
	hotspotsRef.current = hotspots;
	scoreRef.current = cityScore;
	selectedRef.current = selectedId;
	selectRef.current = onSelectHotspot;
	(0, import_react.useEffect)(() => {
		if (!hostRef.current) return;
		let cancelled = false;
		let map;
		let ro;
		(async () => {
			const maplibregl = await import("../_libs/maplibre-gl.mjs").then((n) => n.t);
			await Promise.resolve({});
			if (cancelled || !hostRef.current) return;
			map = new maplibregl.Map({
				container: hostRef.current,
				style: STYLE,
				center: [placeRef.current.lon, placeRef.current.lat],
				zoom: 10.2,
				attributionControl: { compact: true }
			});
			const instance = map;
			instance.on("error", (e) => {
				const msg = e.error?.message ?? "";
				if (msg.includes("style") || msg.includes("fetch")) instance.setStyle(RASTER_FALLBACK);
			});
			instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
			instance.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), "bottom-right");
			ro = new ResizeObserver(() => instance.resize());
			ro.observe(hostRef.current);
			const addSourcesAndLayers = () => {
				if (!instance.getSource("grid")) instance.addSource("grid", {
					type: "geojson",
					data: toGeoJSON(gridRef.current, layerRef.current)
				});
				if (!instance.getLayer("grid-halo")) {
					instance.addLayer({
						id: "grid-halo",
						type: "circle",
						source: "grid",
						paint: {
							"circle-radius": [
								"interpolate",
								["linear"],
								["get", "score"],
								0,
								18,
								100,
								42
							],
							"circle-color": colorExpr(layerRef.current),
							"circle-opacity": .28,
							"circle-blur": .65
						}
					});
					instance.addLayer({
						id: "grid-core",
						type: "circle",
						source: "grid",
						paint: {
							"circle-radius": [
								"interpolate",
								["linear"],
								["get", "score"],
								0,
								5,
								100,
								11
							],
							"circle-color": colorExpr(layerRef.current),
							"circle-opacity": .85,
							"circle-stroke-width": 1,
							"circle-stroke-color": "#e8eaed",
							"circle-stroke-opacity": .35
						}
					});
				}
				const p = placeRef.current;
				if (!instance.getSource("center")) {
					instance.addSource("center", {
						type: "geojson",
						data: {
							type: "FeatureCollection",
							features: [{
								type: "Feature",
								properties: {},
								geometry: {
									type: "Point",
									coordinates: [p.lon, p.lat]
								}
							}]
						}
					});
					instance.addLayer({
						id: "center-ring",
						type: "circle",
						source: "center",
						paint: {
							"circle-radius": 10,
							"circle-color": LEVEL_COLOR[levelRef.current],
							"circle-opacity": .9,
							"circle-stroke-width": 2,
							"circle-stroke-color": "#e8eaed"
						}
					});
				}
				if (!instance.getSource("hotspots")) {
					instance.addSource("hotspots", {
						type: "geojson",
						data: hotspotsGeoJSON(hotspotsRef.current, scoreRef.current, selectedRef.current)
					});
					instance.addLayer({
						id: "hotspot-halo",
						type: "circle",
						source: "hotspots",
						paint: {
							"circle-radius": [
								"case",
								[
									"==",
									["get", "selected"],
									1
								],
								16,
								11
							],
							"circle-color": [
								"interpolate",
								["linear"],
								["get", "score"],
								0,
								"#6f9e86",
								28,
								"#c4a56a",
								50,
								"#c47a52",
								70,
								"#c45c5c"
							],
							"circle-opacity": .9,
							"circle-stroke-width": 2,
							"circle-stroke-color": "#e8eaed"
						}
					});
					try {
						instance.addLayer({
							id: "hotspot-label",
							type: "symbol",
							source: "hotspots",
							layout: {
								"text-field": ["get", "name"],
								"text-size": 11,
								"text-offset": [0, 1.15],
								"text-anchor": "top",
								"text-optional": true
							},
							paint: {
								"text-color": "#e8eaed",
								"text-halo-color": "#090b0d",
								"text-halo-width": 1.2
							}
						});
					} catch {}
				}
			};
			const popup = new maplibregl.Popup({
				closeButton: false,
				closeOnClick: false,
				offset: 12
			});
			instance.on("mousemove", "grid-core", (e) => {
				const f = e.features?.[0];
				if (!f) return;
				instance.getCanvas().style.cursor = "pointer";
				const props = f.properties;
				popup.setLngLat(e.lngLat).setHTML(`<strong>${props.level} · ${props.score}/100</strong><br/>3h ${Number(props.p3).toFixed(1)} mm · 24h ${Number(props.p24).toFixed(1)} mm<br/>Elev ${Math.round(props.elevation)} m`).addTo(instance);
			});
			instance.on("mouseleave", "grid-core", () => {
				instance.getCanvas().style.cursor = "";
				popup.remove();
			});
			instance.on("mousemove", "hotspot-halo", (e) => {
				const f = e.features?.[0];
				if (!f) return;
				instance.getCanvas().style.cursor = "pointer";
				const props = f.properties;
				popup.setLngLat(e.lngLat).setHTML(`<strong>${props.name}</strong><br/>${props.kind} · index ${props.score}<br/>${props.action}`).addTo(instance);
			});
			instance.on("mouseleave", "hotspot-halo", () => {
				instance.getCanvas().style.cursor = "";
				popup.remove();
			});
			instance.on("click", "hotspot-halo", (e) => {
				const id = e.features?.[0]?.properties?.id;
				if (id) selectRef.current?.(id);
			});
			instance.on("load", () => {
				instance.resize();
				requestAnimationFrame(() => instance.resize());
				addSourcesAndLayers();
				readyRef.current = true;
				mapRef.current = instance;
			});
			instance.on("style.load", () => {
				addSourcesAndLayers();
			});
		})();
		return () => {
			cancelled = true;
			readyRef.current = false;
			mapRef.current = null;
			ro?.disconnect();
			map?.remove();
		};
	}, []);
	(0, import_react.useEffect)(() => {
		const current = mapRef.current;
		if (!current || !readyRef.current) return;
		current.flyTo({
			center: [place.lon, place.lat],
			zoom: 11,
			essential: true,
			duration: 900
		});
		current.getSource("center")?.setData({
			type: "FeatureCollection",
			features: [{
				type: "Feature",
				properties: {},
				geometry: {
					type: "Point",
					coordinates: [place.lon, place.lat]
				}
			}]
		});
		if (current.getLayer("center-ring")) current.setPaintProperty("center-ring", "circle-color", LEVEL_COLOR[level]);
	}, [
		place.lat,
		place.lon,
		level
	]);
	(0, import_react.useEffect)(() => {
		const current = mapRef.current;
		if (!current || !readyRef.current) return;
		current.getSource("grid")?.setData(toGeoJSON(grid, layer));
		const expr = colorExpr(layer);
		if (current.getLayer("grid-halo")) current.setPaintProperty("grid-halo", "circle-color", expr);
		if (current.getLayer("grid-core")) current.setPaintProperty("grid-core", "circle-color", expr);
	}, [grid, layer]);
	(0, import_react.useEffect)(() => {
		const current = mapRef.current;
		if (!current || !readyRef.current) return;
		current.getSource("hotspots")?.setData(hotspotsGeoJSON(hotspots, cityScore, selectedId));
	}, [
		hotspots,
		cityScore,
		selectedId
	]);
	(0, import_react.useEffect)(() => {
		const current = mapRef.current;
		if (!current || !readyRef.current || !selectedId) return;
		const hit = hotspots.find((h) => h.id === selectedId);
		if (hit) current.easeTo({
			center: [hit.lon, hit.lat],
			zoom: 13,
			duration: 700
		});
	}, [selectedId, hotspots]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		ref: hostRef,
		className: "h-full w-full"
	});
}
//#endregion
export { MapCanvas as default };
