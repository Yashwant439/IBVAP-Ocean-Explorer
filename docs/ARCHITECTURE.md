# IBVAP architecture

IBVAP (Interactive 3D Ocean Visualization Platform) is a prototype for SIH problem statement 26067. It demonstrates how numerical model output and in-situ observations can be explored together without claiming to be an operational forecast system.

## MVP data flow

```text
Demo / future INCOIS data
          ↓
Data ingestion + validation
          ↓
DemoOceanProvider / future LocalNetCDFProvider
          ↓
Express API under /api
          ↓
React + Vite client
          ↓
WebGL-inspired ocean field, profiles, comparisons, map
```

The current `DemoOceanProvider` is deterministic and generates smooth temperature, salinity, current, and chlorophyll fields across latitude, longitude, depth, and time. The API sends only the selected downsampled slice and current vectors to the browser.

## Observation pipeline

```text
Argo / Glider / CTD / BGC
          ↓
Demo observation provider
          ↓
Observation metadata + profile endpoint
          ↓
Marker / track selection
          ↓
Profile chart
```

## Comparison pipeline

```text
Observation (lat, lon, depth, time)
          +
Nearest model field value
          ↓
Nearest-neighbor matching
          ↓
Difference, absolute error, MAE, bias, agreement
          ↓
Comparison chart and analytics
```

## Production path

The prototype keeps the provider boundary intentionally small. A future implementation can add a `LocalNetCDFProvider` using xarray and an `OPeNDAPProvider` without changing the client contract. For larger INCOIS datasets, the recommended path is lazy xarray/Zarr reads, server-side time/depth filtering, downsampling, caching, and a standards-aware adapter for OGC WMS/WCS. Those are **FUTURE / PRODUCTION** concerns, not dependencies of this MVP.

## Coordinate convention

Model coordinates are stored as `latitude`, `longitude`, and positive-down `depth` in metres. The explorer maps latitude and longitude into a local Indian Ocean plane and uses depth as the vertical axis; this is a visualization coordinate system, not a navigational projection.