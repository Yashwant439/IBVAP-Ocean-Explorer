# IBVAP — Interactive 3D Ocean Visualization Platform

IBVAP is a browser-based prototype for **SIH Problem Statement 26067** under the Indian National Centre for Ocean Information Services (INCOIS) / Ministry of Earth Sciences context. It integrates a synthetic Indian Ocean model with Argo, glider, CTD, and BGC observations so a judge can explore, observe, and compare ocean conditions in one place.

> **Important:** This is demo/synthetic data for visualization and prototype demonstration. It is not an official INCOIS product or an operational forecast.

## What is included

- Dashboard with Indian Ocean coverage, dataset health, platform counts, and disaster-management context
- Explorer route with temperature, salinity, chlorophyll, current speed/direction, depth and time controls
- 3D-inspired depth-resolved ocean field, current vectors, opacity/palette controls, volume/slice/isosurface approximation, and observation overlays
- Argo, glider, CTD, and BGC observation list with profile charts
- Model-versus-observation comparison with difference, absolute error, MAE, bias, and agreement
- Analytics with temperature, salinity, current-speed statistics and error distribution
- Map view with model domain, markers, and glider tracks
- Dataset catalog and ingestion metadata flow for CSV, TXT, and NetCDF files
- Python demo data generator, FastAPI-compatible architecture notes, and an SIH judge demo script

## Run on Replit

The project uses pnpm workspaces and managed workflows:

```bash
pnpm install
```

The app is already configured to run through the web workflow. Useful checks:

```bash
pnpm --filter @workspace/api-server run typecheck
pnpm --filter @workspace/ibvap-ocean-explorer run typecheck
pnpm --filter @workspace/ibvap-ocean-explorer run build
python3 scripts/generate_demo_data.py
```

The API is served at `/api`, and the frontend is served at `/`.

## Architecture

The frontend is React + TypeScript + Vite with Recharts and lucide-react. The shared API contract lives in `lib/api-spec/openapi.yaml`; generated hooks are emitted into `lib/api-client-react`. The backend is the existing Express service in `artifacts/api-server` and uses a deterministic in-memory demo provider to avoid shipping large raw arrays.

Important files:

```text
artifacts/ibvap-ocean-explorer/  React application
artifacts/api-server/src/routes/ocean.ts  Demo provider and API routes
lib/api-spec/openapi.yaml  API source of truth
scripts/generate_demo_data.py  Optional NetCDF/CSV generator
data/demo/  Generated samples
docs/ARCHITECTURE.md  Data and production-extension notes
docs/DEMO_SCRIPT.md  Judge walkthrough
```

## API surface

```text
GET  /api/datasets
GET  /api/datasets/{id}
POST /api/datasets/upload
GET  /api/variables
GET  /api/times
GET  /api/depths
GET  /api/ocean/slice?variable=temperature&depth=50&time=2026-01-05
GET  /api/ocean/current?depth=50&time=2026-01-05
GET  /api/observations
GET  /api/observations/{id}
GET  /api/observations/{id}/profile?variable=temperature
GET  /api/comparison?observation_id=argo-2901200&variable=temperature
GET  /api/statistics?depth=50&time=2026-01-05
GET  /api/map
```

## Data generation

`scripts/generate_demo_data.py` writes a compact observation CSV. If `numpy` and `xarray` are available, it also writes `data/demo/ocean_model.nc` with temperature, salinity, current components, chlorophyll, and CF-style metadata. The live prototype does not require a NetCDF file because its demo provider generates the same kind of filtered fields on demand.

## Known limitations and future scope

- The first build uses smooth synthetic data rather than live INCOIS data.
- The “3D” scene is a lightweight browser visualization approximation designed to be usable on ordinary laptops.
- Upload currently validates and registers metadata; full xarray ingestion and persistence are integration-ready next steps.
- Matching is nearest-neighbor, not a full interpolation or uncertainty framework.
- OPeNDAP, Zarr, OGC WMS/WCS, PostGIS, streaming observations, and operational alerting are **FUTURE / PRODUCTION** scope.

See `docs/ARCHITECTURE.md` and `docs/DEMO_SCRIPT.md` for the full explanation and walkthrough.