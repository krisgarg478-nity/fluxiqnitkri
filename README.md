# FluxIQ 2.0.1 — Urban Flood Intelligence

Standalone SIH-ready frontend prototype for urban flood nowcasting. It uses live Open-Meteo weather data, Open-Meteo geocoding, rainfall accumulation, soil moisture and runoff indicators, plus MapLibre GL for the GIS view.

## Requirements
- Node.js 18+ (Node.js 20+ recommended)
- Internet connection (the demo APIs and map tiles are online services)

## Run
```bash
npm install
npm run dev
```
Open the URL printed by Vite (normally `http://localhost:5173`).

## Build
```bash
npm run build
npm run preview
```

## Important
Do **not** open `index.html` directly. Vite must serve the app so JSX modules and assets load correctly.

The official municipal gauge is intentionally marked OPTIONAL; the prototype does not fabricate sensor readings. NASA Worldview is a navigation link, not a fake live satellite feed.
