import { useEffect, useRef } from "react";
import type {
  DataDrivenPropertyValueSpecification,
  GeoJSONSource,
  Map as MapLibreMap,
  StyleSpecification,
} from "maplibre-gl";
import { scoreHotspot, type Hotspot } from "@/lib/flood/hotspots";
import type { GridCell, MapLayer, Place, RiskLevel } from "@/lib/flood/types";

const MAP_STYLE: StyleSpecification = {
  version: 8 as const,
  sources: {
    carto: {
      type: "raster" as const,
      tiles: ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap &copy; CARTO",
    },
  },
  layers: [{ id: "carto", type: "raster" as const, source: "carto" }],
};

const LEVEL_COLOR: Record<RiskLevel, string> = {
  LOW: "#6f9e86",
  MODERATE: "#c4a56a",
  HIGH: "#c47a52",
  CRITICAL: "#c45c5c",
};

function toGeoJSON(grid: GridCell[], layer: MapLayer) {
  return {
    type: "FeatureCollection" as const,
    features: grid.map((cell) => ({
      type: "Feature" as const,
      properties: {
        score: cell.score,
        p3: cell.p3,
        p24: cell.p24,
        elevDelta: cell.elevDelta,
        elevation: cell.elevation,
        level: cell.level,
        metric:
          layer === "rain" ? cell.p3 : layer === "terrain" ? cell.elevDelta : cell.score,
      },
      geometry: {
        type: "Point" as const,
        coordinates: [cell.lon, cell.lat],
      },
    })),
  };
}

function hotspotsGeoJSON(hotspots: Hotspot[], cityScore: number, selectedId?: string) {
  return {
    type: "FeatureCollection" as const,
    features: hotspots.map((h) => {
      const scored = scoreHotspot(cityScore, h);
      return {
        type: "Feature" as const,
        properties: {
          id: h.id,
          name: h.name,
          kind: h.kind,
          action: h.action,
          score: scored.score,
          level: scored.level,
          selected: selectedId === h.id ? 1 : 0,
        },
        geometry: {
          type: "Point" as const,
          coordinates: [h.lon, h.lat],
        },
      };
    }),
  };
}

function colorExpr(layer: MapLayer): DataDrivenPropertyValueSpecification<string> {
  const stops =
    layer === "rain"
      ? ([8, 20, 40] as const)
      : layer === "terrain"
        ? ([8, 16, 28] as const)
        : ([28, 50, 70] as const);
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
    "#c45c5c",
  ];
}

export default function MapCanvas({
  place,
  grid,
  layer,
  level,
  hotspots,
  cityScore,
  selectedId,
  onSelectHotspot,
}: {
  place: Place;
  grid: GridCell[];
  layer: MapLayer;
  level: RiskLevel;
  hotspots: Hotspot[];
  cityScore: number;
  selectedId?: string;
  onSelectHotspot?: (id: string) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const readyRef = useRef(false);
  const gridRef = useRef(grid);
  const layerRef = useRef(layer);
  const placeRef = useRef(place);
  const levelRef = useRef(level);
  const hotspotsRef = useRef(hotspots);
  const scoreRef = useRef(cityScore);
  const selectedRef = useRef(selectedId);
  const selectRef = useRef(onSelectHotspot);
  gridRef.current = grid;
  layerRef.current = layer;
  placeRef.current = place;
  levelRef.current = level;
  hotspotsRef.current = hotspots;
  scoreRef.current = cityScore;
  selectedRef.current = selectedId;
  selectRef.current = onSelectHotspot;

  useEffect(() => {
    if (!hostRef.current) return;
    let cancelled = false;
    let map: MapLibreMap | undefined;
    let ro: ResizeObserver | undefined;

    (async () => {
      const maplibregl = await import("maplibre-gl");
      await import("maplibre-gl/dist/maplibre-gl.css");
      if (cancelled || !hostRef.current) return;

      map = new maplibregl.Map({
        container: hostRef.current,
        style: MAP_STYLE,
        center: [placeRef.current.lon, placeRef.current.lat],
        zoom: 10.2,
        attributionControl: { compact: true },
      });
      const instance = map;
      instance.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      instance.addControl(new maplibregl.ScaleControl({ maxWidth: 100 }), "bottom-right");

      ro = new ResizeObserver(() => instance.resize());
      ro.observe(hostRef.current);

      const addSourcesAndLayers = () => {
        if (!instance.getSource("grid")) {
          instance.addSource("grid", {
            type: "geojson",
            data: toGeoJSON(gridRef.current, layerRef.current),
          });
        }
        if (!instance.getLayer("grid-halo")) {
          instance.addLayer({
            id: "grid-halo",
            type: "circle",
            source: "grid",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["get", "score"], 0, 18, 100, 42],
              "circle-color": colorExpr(layerRef.current),
              "circle-opacity": 0.28,
              "circle-blur": 0.65,
            },
          });
          instance.addLayer({
            id: "grid-core",
            type: "circle",
            source: "grid",
            paint: {
              "circle-radius": ["interpolate", ["linear"], ["get", "score"], 0, 5, 100, 11],
              "circle-color": colorExpr(layerRef.current),
              "circle-opacity": 0.85,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#e8eaed",
              "circle-stroke-opacity": 0.35,
            },
          });
        }
        const p = placeRef.current;
        if (!instance.getSource("center")) {
          instance.addSource("center", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: { type: "Point", coordinates: [p.lon, p.lat] },
                },
              ],
            },
          });
          instance.addLayer({
            id: "center-ring",
            type: "circle",
            source: "center",
            paint: {
              "circle-radius": 10,
              "circle-color": LEVEL_COLOR[levelRef.current],
              "circle-opacity": 0.9,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#e8eaed",
            },
          });
        }
        if (!instance.getSource("hotspots")) {
          instance.addSource("hotspots", {
            type: "geojson",
            data: hotspotsGeoJSON(hotspotsRef.current, scoreRef.current, selectedRef.current),
          });
          instance.addLayer({
            id: "hotspot-halo",
            type: "circle",
            source: "hotspots",
            paint: {
              "circle-radius": ["case", ["==", ["get", "selected"], 1], 16, 11],
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
                "#c45c5c",
              ],
              "circle-opacity": 0.9,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#e8eaed",
            },
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
                "text-optional": true,
              },
              paint: {
                "text-color": "#e8eaed",
                "text-halo-color": "#090b0d",
                "text-halo-width": 1.2,
              },
            });
          } catch {
            /* raster fallback has no glyphs */
          }
        }
      };

      const popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12,
      });
      instance.on("mousemove", "grid-core", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        instance.getCanvas().style.cursor = "pointer";
        const props = f.properties as {
          score: number;
          p3: number;
          p24: number;
          elevation: number;
          level: string;
        };
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${props.level} · ${props.score}/100</strong><br/>3h ${Number(props.p3).toFixed(1)} mm · 24h ${Number(props.p24).toFixed(1)} mm<br/>Elev ${Math.round(props.elevation)} m`,
          )
          .addTo(instance);
      });
      instance.on("mouseleave", "grid-core", () => {
        instance.getCanvas().style.cursor = "";
        popup.remove();
      });
      instance.on("mousemove", "hotspot-halo", (e) => {
        const f = e.features?.[0];
        if (!f) return;
        instance.getCanvas().style.cursor = "pointer";
        const props = f.properties as {
          name: string;
          kind: string;
          action: string;
          score: number;
        };
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<strong>${props.name}</strong><br/>${props.kind} · index ${props.score}<br/>${props.action}`,
          )
          .addTo(instance);
      });
      instance.on("mouseleave", "hotspot-halo", () => {
        instance.getCanvas().style.cursor = "";
        popup.remove();
      });
      instance.on("click", "hotspot-halo", (e) => {
        const id = e.features?.[0]?.properties?.id as string | undefined;
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

  useEffect(() => {
    const current = mapRef.current;
    if (!current || !readyRef.current) return;
    current.flyTo({
      center: [place.lon, place.lat],
      zoom: 11,
      essential: true,
      duration: 900,
    });
    const center = current.getSource("center") as GeoJSONSource | undefined;
    center?.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: [place.lon, place.lat] },
        },
      ],
    });
    if (current.getLayer("center-ring")) {
      current.setPaintProperty("center-ring", "circle-color", LEVEL_COLOR[level]);
    }
  }, [place.lat, place.lon, level]);

  useEffect(() => {
    const current = mapRef.current;
    if (!current || !readyRef.current) return;
    const src = current.getSource("grid") as GeoJSONSource | undefined;
    src?.setData(toGeoJSON(grid, layer));
    const expr = colorExpr(layer);
    if (current.getLayer("grid-halo")) current.setPaintProperty("grid-halo", "circle-color", expr);
    if (current.getLayer("grid-core")) current.setPaintProperty("grid-core", "circle-color", expr);
  }, [grid, layer]);

  useEffect(() => {
    const current = mapRef.current;
    if (!current || !readyRef.current) return;
    const src = current.getSource("hotspots") as GeoJSONSource | undefined;
    src?.setData(hotspotsGeoJSON(hotspots, cityScore, selectedId));
  }, [hotspots, cityScore, selectedId]);

  useEffect(() => {
    const current = mapRef.current;
    if (!current || !readyRef.current || !selectedId) return;
    const hit = hotspots.find((h) => h.id === selectedId);
    if (hit) {
      current.easeTo({ center: [hit.lon, hit.lat], zoom: 13, duration: 700 });
    }
  }, [selectedId, hotspots]);

  return <div ref={hostRef} className="h-full w-full" />;
}
