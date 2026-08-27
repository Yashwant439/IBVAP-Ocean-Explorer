#!/usr/bin/env python3
"""Generate small, scientifically plausible demo files for IBVAP.

The browser demo uses the same deterministic formulas in the API's demo
provider, so it does not depend on these files at runtime. This script creates
portable CSV samples and, when xarray/netCDF4 are installed, a compact NetCDF
file for the SIH presentation.
"""

from __future__ import annotations

import csv
import math
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEMO = ROOT / "data" / "demo"
DEMO.mkdir(parents=True, exist_ok=True)

DEPTHS = [0, 10, 25, 50, 100, 200, 500, 1000]
LATS = [-18 + index * 3.2 for index in range(16)]
LONS = [45 + index * 2.9 for index in range(20)]
TIMES = [date(2026, 1, 1) + timedelta(days=index) for index in range(10)]


def field_values(latitude: float, longitude: float, depth: float, time_index: int) -> tuple[float, float, float, float, float]:
    lat_wave = math.sin((latitude + 8) / 12)
    lon_wave = math.cos((longitude - 66) / 10)
    seasonal = math.sin(time_index / 2.2)
    depth_factor = math.exp(-depth / 420)
    temperature = 28.8 + 1.8 * lat_wave + 0.9 * lon_wave + 1.15 * seasonal * depth_factor - depth / 82
    salinity = 35.1 + 0.45 * math.cos((latitude + longitude) / 18) + 0.3 * seasonal + depth / 1800
    u = 0.45 + 0.25 * math.sin((longitude - 50) / 12) + 0.1 * math.cos(latitude / 8) - depth / 4500
    v = 0.18 + 0.22 * math.cos((latitude + 4) / 10) - 0.12 * math.sin(longitude / 14)
    speed = math.sqrt(u * u + v * v)
    chlorophyll = 0.24 + 0.46 * math.exp(-((latitude - 5) / 11) ** 2) + 0.14 * (1 + seasonal) / 2 + depth / 3000
    return temperature, salinity, u, v, chlorophyll


def write_observations() -> None:
    with (DEMO / "observations.csv").open("w", newline="", encoding="utf-8") as file:
        writer = csv.writer(file)
        writer.writerow(["platform_id", "platform_type", "latitude", "longitude", "depth", "time", "temperature", "salinity", "chlorophyll"])
        for index in range(24):
            latitude = 4 + (index % 8) * 2.4
            longitude = 53 + (index // 8) * 13.5 + (index % 3) * 1.8
            timestamp = TIMES[(index + 4) % len(TIMES)]
            temperature, salinity, _, _, chlorophyll = field_values(latitude, longitude, 50, (index + 4) % len(TIMES))
            writer.writerow([
                f"ARGO-{2901200 + index}",
                "Argo",
                round(latitude, 3),
                round(longitude, 3),
                1000,
                timestamp.isoformat(),
                round(temperature + 0.35, 3),
                round(salinity - 0.08, 3),
                round(chlorophyll + 0.04, 3),
            ])


def write_netcdf() -> None:
    try:
        import numpy as np
        import xarray as xr
    except ImportError:
        print("xarray/numpy not installed; CSV generated, NetCDF skipped.")
        return

    temperature = np.empty((len(TIMES), len(DEPTHS), len(LATS), len(LONS)))
    salinity = np.empty_like(temperature)
    u_current = np.empty_like(temperature)
    v_current = np.empty_like(temperature)
    chlorophyll = np.empty_like(temperature)
    for time_index in range(len(TIMES)):
        for depth_index, depth in enumerate(DEPTHS):
            for lat_index, latitude in enumerate(LATS):
                for lon_index, longitude in enumerate(LONS):
                    values = field_values(latitude, longitude, depth, time_index)
                    temperature[time_index, depth_index, lat_index, lon_index] = values[0]
                    salinity[time_index, depth_index, lat_index, lon_index] = values[1]
                    u_current[time_index, depth_index, lat_index, lon_index] = values[2]
                    v_current[time_index, depth_index, lat_index, lon_index] = values[3]
                    chlorophyll[time_index, depth_index, lat_index, lon_index] = values[4]

    dataset = xr.Dataset(
        {
            "temperature": (("time", "depth", "latitude", "longitude"), temperature, {"units": "degC"}),
            "salinity": (("time", "depth", "latitude", "longitude"), salinity, {"units": "PSU"}),
            "u_current": (("time", "depth", "latitude", "longitude"), u_current, {"units": "m s-1"}),
            "v_current": (("time", "depth", "latitude", "longitude"), v_current, {"units": "m s-1"}),
            "chlorophyll": (("time", "depth", "latitude", "longitude"), chlorophyll, {"units": "mg m-3"}),
        },
        coords={"time": [value.isoformat() for value in TIMES], "depth": DEPTHS, "latitude": LATS, "longitude": LONS},
        attrs={"title": "IBVAP Indian Ocean demo model", "source": "DEMO / SYNTHETIC", "conventions": "CF-style metadata"},
    )
    dataset.to_netcdf(DEMO / "ocean_model.nc")
    print("Generated data/demo/ocean_model.nc")


if __name__ == "__main__":
    write_observations()
    write_netcdf()
    print("Generated data/demo/observations.csv")