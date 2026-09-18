# FluxIQ — Urban Flood Intelligence

FluxIQ is a flood-monitoring command center built with React, TanStack Start, MapLibre GL, and Open-Meteo weather data.

## Deploy to Vercel from GitHub

1. Push this folder to a GitHub repository.
2. In Vercel, import the repository.
3. Keep the default install command (`npm install`/`npm ci`) and use the included build command: `npm run build`.
4. If you want persistent production authentication/data, add a PostgreSQL `DATABASE_URL` in Vercel. Without it, the app uses its embedded PGlite fallback.
5. Deploy.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:8080`.

## Map fix

The map no longer depends on a remote OpenFreeMap style JSON. It starts from a MapLibre-compatible raster style using CARTO/OpenStreetMap tiles, so a failure to download a third-party style document cannot leave the map blank. Flood-risk overlays and hotspot layers are still rendered by MapLibre on top of the basemap.

## Data sources

- Open-Meteo for forecast/geocoding/elevation data
- CARTO/OpenStreetMap tiles for the basemap
