import { Router, type IRouter } from "express";
import { randomUUID } from "node:crypto";

const router: IRouter = Router();

const DEPTHS = [0, 10, 25, 50, 100, 200, 500, 1000];
const TIMES = Array.from({ length: 10 }, (_, index) => `2026-01-${String(index + 1).padStart(2, "0")}`);
const LATITUDES = Array.from({ length: 16 }, (_, index) => -18 + index * 3.2);
const LONGITUDES = Array.from({ length: 20 }, (_, index) => 45 + index * 2.9);

type VariableId = "temperature" | "salinity" | "current_speed" | "current_direction" | "chlorophyll";

const VARIABLE_META: Record<VariableId, {
  id: VariableId;
  label: string;
  unit: string;
  description: string;
  palette: string;
  min: number;
  max: number;
}> = {
  temperature: {
    id: "temperature",
    label: "Temperature",
    unit: "°C",
    description: "Potential temperature of the upper ocean",
    palette: "Thermal",
    min: 16,
    max: 32,
  },
  salinity: {
    id: "salinity",
    label: "Salinity",
    unit: "PSU",
    description: "Practical salinity of seawater",
    palette: "Haline",
    min: 33.2,
    max: 36.8,
  },
  current_speed: {
    id: "current_speed",
    label: "Current speed",
    unit: "m/s",
    description: "Magnitude of the modeled surface current",
    palette: "Velocity",
    min: 0,
    max: 1.8,
  },
  current_direction: {
    id: "current_direction",
    label: "Current direction",
    unit: "°",
    description: "Bearing of the modeled surface current",
    palette: "Phase",
    min: 0,
    max: 360,
  },
  chlorophyll: {
    id: "chlorophyll",
    label: "Chlorophyll",
    unit: "mg/m³",
    description: "Surface chlorophyll-a concentration",
    palette: "Algae",
    min: 0.08,
    max: 1.6,
  },
};

type Observation = {
  id: string;
  platform_type: string;
  platform_name: string;
  latitude: number;
  longitude: number;
  depth: number;
  timestamp: string;
  status: string;
  mission: string;
  coverage: string;
};

const observations: Observation[] = [
  ...Array.from({ length: 24 }, (_, index) => {
    const latitude = 4 + (index % 8) * 2.4;
    const longitude = 53 + Math.floor(index / 8) * 13.5 + (index % 3) * 1.8;
    return {
      id: `argo-${2901200 + index}`,
      platform_type: "Argo",
      platform_name: `ARGO-${2901200 + index}`,
      latitude,
      longitude,
      depth: 1000,
      timestamp: TIMES[(index + 4) % TIMES.length],
      status: index % 7 === 0 ? "Surfacing" : "Active",
      mission: "Indian Ocean profiling mission",
      coverage: index % 5 === 0 ? "Partial" : "Good",
    };
  }),
  ...Array.from({ length: 6 }, (_, index) => ({
    id: `glider-${String(index + 1).padStart(2, "0")}`,
    platform_type: "Glider",
    platform_name: `GLIDER-${String(index + 1).padStart(2, "0")}`,
    latitude: 7 + index * 1.9,
    longitude: 60 + index * 4.8,
    depth: 450 + index * 40,
    timestamp: TIMES[(index + 5) % TIMES.length],
    status: "Active",
    mission: index % 2 === 0 ? "Arabian Sea Survey" : "Bay of Bengal Transect",
    coverage: "Good",
  })),
  ...Array.from({ length: 8 }, (_, index) => ({
    id: `ctd-${String(index + 1).padStart(2, "0")}`,
    platform_type: "CTD",
    platform_name: `CTD-${String(index + 1).padStart(2, "0")}`,
    latitude: -3 + index * 3.2,
    longitude: 66 + (index % 4) * 6,
    depth: 200 + index * 25,
    timestamp: TIMES[index % TIMES.length],
    status: "Processed",
    mission: "Coastal reference station",
    coverage: "Good",
  })),
  ...Array.from({ length: 4 }, (_, index) => ({
    id: `bgc-${String(index + 1).padStart(2, "0")}`,
    platform_type: "BGC",
    platform_name: `BGC-${String(index + 1).padStart(2, "0")}`,
    latitude: 11 + index * 2.7,
    longitude: 75 + index * 3.6,
    depth: 100,
    timestamp: TIMES[(index + 2) % TIMES.length],
    status: "Active",
    mission: "Biogeochemical sampling",
    coverage: "Partial",
  })),
];

const uploadedDatasets: Array<Record<string, unknown>> = [];

function numberParam(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function closest<T>(values: T[], value: number, getValue: (item: T) => number) {
  return values.reduce((best, item) =>
    Math.abs(getValue(item) - value) < Math.abs(getValue(best) - value) ? item : best,
  );
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function fieldValue(variable: string, latitude: number, longitude: number, depth: number, timeIndex: number) {
  const latWave = Math.sin((latitude + 8) / 12);
  const lonWave = Math.cos((longitude - 66) / 10);
  const seasonal = Math.sin(timeIndex / 2.2);
  const depthFactor = Math.exp(-depth / 420);
  const temp = 28.8 + 1.8 * latWave + 0.9 * lonWave + 1.15 * seasonal * depthFactor - depth / 82;
  const salinity = 35.1 + 0.45 * Math.cos((latitude + longitude) / 18) + 0.3 * seasonal + depth / 1800;
  const u = 0.52 + 0.23 * Math.sin((longitude - 50) / 12) + 0.12 * Math.cos(latitude / 8) - depth / 4200;
  const v = 0.16 + 0.24 * Math.cos((latitude + 4) / 10) - 0.14 * Math.sin(longitude / 14) + seasonal * 0.06;
  const speed = Math.sqrt(u * u + v * v);
  const chlorophyll = 0.24 + 0.46 * Math.exp(-Math.pow((latitude - 5) / 11, 2)) + 0.14 * (1 + seasonal) / 2 + depth / 3000;
  if (variable === "salinity") return salinity;
  if (variable === "current_speed") return speed;
  if (variable === "current_direction") return (Math.atan2(v, u) * 180) / Math.PI + 180;
  if (variable === "chlorophyll") return chlorophyll;
  return temp;
}

function timeIndex(time: string | undefined) {
  const index = TIMES.indexOf(time ?? "");
  return index >= 0 ? index : 4;
}

function depthLevel(depth: number) {
  return closest(DEPTHS, depth, (item) => item);
}

function profileFor(observation: Observation, variable: string) {
  const index = timeIndex(observation.timestamp);
  const unit = VARIABLE_META[variable as VariableId]?.unit ?? "°C";
  return DEPTHS.map((depth) => {
    const base = fieldValue(variable, observation.latitude, observation.longitude, depth, index);
    const offset = variable === "temperature" ? 0.35 : variable === "salinity" ? -0.08 : 0.04;
    return {
      depth,
      value: Number((base + offset + Math.sin(depth / 130 + index) * 0.09).toFixed(3)),
      model: Number(base.toFixed(3)),
    };
  });
}

const demoDataset = {
  id: "indian-ocean-demo",
  name: "Indian Ocean Demo Model",
  type: "NETCDF",
  source: "DEMO / SYNTHETIC",
  status: "READY",
  variables: ["Temperature", "Salinity", "Currents", "Chlorophyll"],
  time_range: [TIMES[0], TIMES[TIMES.length - 1]],
  depth_range: [0, 1000],
  spatial_range: [-18, 102, 45, 100],
  grid: "16 × 20 × 8 × 10",
  updated_at: "2026-01-05T12:00:00Z",
  metadata: {
    coordinate_convention: "latitude / longitude / positive-down depth",
    processing: "Downsampled demo field generated by DemoOceanProvider",
    temporal_resolution: "24 hours",
  },
  validation: {
    missing_values: "0.0%",
    spatial_coverage: "94%",
    temporal_coverage: "100%",
    quality: "GOOD",
  },
};

function modelValueAt(observation: Observation, variable: string, depth: number) {
  return fieldValue(variable, observation.latitude, observation.longitude, depth, timeIndex(observation.timestamp));
}

router.get("/datasets", (_req, res) => {
  res.json([demoDataset, ...uploadedDatasets]);
});

router.get("/datasets/:id", (req, res) => {
  const dataset = [demoDataset, ...uploadedDatasets].find((item) => item.id === req.params.id);
  if (!dataset) {
    res.status(404).json({ error: "Dataset not found" });
    return;
  }
  res.json(dataset);
});

router.post("/datasets/upload", (req, res) => {
  const body = req.body as { filename?: unknown; format?: unknown; size_bytes?: unknown; columns?: unknown };
  const filename = typeof body.filename === "string" ? body.filename.trim() : "";
  const sizeBytes = numberParam(body.size_bytes, -1);
  const format = typeof body.format === "string" ? body.format.toUpperCase() : "";
  const allowedFormats = new Set(["CSV", "TXT", "NETCDF", "NC"]);
  if (!filename || filename.length > 180 || sizeBytes < 0 || sizeBytes > 50_000_000 || !allowedFormats.has(format)) {
    res.status(400).json({ error: "Upload must include a valid CSV, TXT, or NetCDF filename under 50 MB." });
    return;
  }
  const id = `uploaded-${randomUUID().slice(0, 8)}`;
  const columns = Array.isArray(body.columns) ? body.columns.filter((column): column is string => typeof column === "string").slice(0, 50) : [];
  const dataset = {
    id,
    name: filename.replace(/\.[^.]+$/, ""),
    type: format === "NETCDF" || format === "NC" ? "NETCDF" : format,
    source: "USER UPLOAD",
    status: "INSPECTED",
    variables: columns.length ? columns : ["latitude", "longitude", "depth", "time"],
    time_range: ["Detected on upload", "Pending processing"],
    depth_range: [0, 0],
    spatial_range: [0, 0, 0, 0],
    grid: "Pending inspection",
    updated_at: new Date().toISOString(),
    metadata: {
      filename,
      size: `${(sizeBytes / 1024).toFixed(1)} KB`,
      parser: format === "NETCDF" || format === "NC" ? "xarray-ready inspector" : "CSV/TXT column inspector",
    },
    validation: {
      file: "VALIDATED",
      columns: columns.length ? "DETECTED" : "REVIEW REQUIRED",
      status: "READY FOR REVIEW",
    },
  };
  uploadedDatasets.push(dataset);
  res.status(201).json(dataset);
});

router.get("/variables", (_req, res) => {
  res.json(Object.values(VARIABLE_META));
});

router.get("/times", (_req, res) => {
  res.json(TIMES);
});

router.get("/depths", (_req, res) => {
  res.json(DEPTHS);
});

router.get("/ocean/slice", (req, res) => {
  const query = req.query as Record<string, string | undefined>;
  const variable = (query.variable ?? "temperature") as VariableId;
  const meta = VARIABLE_META[variable] ?? VARIABLE_META.temperature;
  const depth = depthLevel(numberParam(query.depth, 50));
  const time = TIMES[timeIndex(query.time)];
  const values = LATITUDES.map((latitude) =>
    LONGITUDES.map((longitude) => Number(fieldValue(meta.id, latitude, longitude, depth, timeIndex(time)).toFixed(3))),
  );
  const flatValues = values.flat();
  res.json({
    variable: meta.id,
    unit: meta.unit,
    depth,
    time,
    min: Number(Math.min(...flatValues).toFixed(3)),
    max: Number(Math.max(...flatValues).toFixed(3)),
    mean: Number((flatValues.reduce((sum, value) => sum + value, 0) / flatValues.length).toFixed(3)),
    latitude: LATITUDES,
    longitude: LONGITUDES,
    values,
  });
});

router.get("/ocean/current", (req, res) => {
  const query = req.query as Record<string, string | undefined>;
  const depth = depthLevel(numberParam(query.depth, 50));
  const time = TIMES[timeIndex(query.time)];
  const points = LATITUDES.filter((_value, index) => index % 2 === 0).flatMap((latitude) =>
    LONGITUDES.filter((_value, index) => index % 2 === 0).map((longitude) => {
      const u = fieldValue("current_u", latitude, longitude, depth, timeIndex(time)) - 27;
      const v = fieldValue("current_v", latitude, longitude, depth, timeIndex(time)) - 27;
      // The demo field helper returns temperature for unknown variables, so use
      // coherent vector components derived from the same spatial waves here.
      const east = 0.45 + 0.25 * Math.sin((longitude - 50) / 12) + 0.1 * Math.cos(latitude / 8) - depth / 4500;
      const north = 0.18 + 0.22 * Math.cos((latitude + 4) / 10) - 0.12 * Math.sin(longitude / 14);
      void u;
      void v;
      return {
        latitude,
        longitude,
        u: Number(east.toFixed(3)),
        v: Number(north.toFixed(3)),
        speed: Number(Math.sqrt(east * east + north * north).toFixed(3)),
      };
    }),
  );
  res.json({ depth, time, points });
});

router.get("/observations", (req, res) => {
  const type = (req.query as Record<string, string | undefined>).platform_type;
  res.json(type ? observations.filter((observation) => observation.platform_type.toLowerCase() === type.toLowerCase()) : observations);
});

router.get("/observations/:id", (req, res) => {
  const observation = observations.find((item) => item.id === req.params.id);
  if (!observation) {
    res.status(404).json({ error: "Observation not found" });
    return;
  }
  res.json(observation);
});

router.get("/observations/:id/profile", (req, res) => {
  const observation = observations.find((item) => item.id === req.params.id);
  if (!observation) {
    res.status(404).json({ error: "Observation not found" });
    return;
  }
  const variable = typeof req.query.variable === "string" ? req.query.variable : "temperature";
  const safeVariable = VARIABLE_META[variable as VariableId] ? variable : "temperature";
  res.json({
    observation_id: observation.id,
    platform_name: observation.platform_name,
    variable: safeVariable,
    unit: VARIABLE_META[safeVariable as VariableId].unit,
    points: profileFor(observation, safeVariable),
  });
});

router.get("/comparison", (req, res) => {
  const query = req.query as Record<string, string | undefined>;
  const observation = observations.find((item) => item.id === query.observation_id) ?? observations[0];
  const variable = VARIABLE_META[(query.variable ?? "temperature") as VariableId] ? (query.variable ?? "temperature") : "temperature";
  const model = modelValueAt(observation, variable, observation.depth);
  const profile = profileFor(observation, variable);
  const observationValue = profile.find((point) => point.depth === depthLevel(observation.depth))?.value ?? model;
  const difference = model - observationValue;
  const absoluteError = Math.abs(difference);
  const errors = profile.map((point) => point.model - point.value);
  const mae = errors.reduce((sum, value) => sum + Math.abs(value), 0) / errors.length;
  const bias = errors.reduce((sum, value) => sum + value, 0) / errors.length;
  res.json({
    observation_id: observation.id,
    variable,
    unit: VARIABLE_META[variable as VariableId].unit,
    model_value: Number(model.toFixed(3)),
    observation_value: Number(observationValue.toFixed(3)),
    difference: Number(difference.toFixed(3)),
    absolute_error: Number(absoluteError.toFixed(3)),
    mae: Number(mae.toFixed(3)),
    bias: Number(bias.toFixed(3)),
    agreement: Number(clamp(100 - absoluteError * 9, 0, 99.9).toFixed(1)),
    points: profile,
  });
});

router.get("/statistics", (req, res) => {
  const query = req.query as Record<string, string | undefined>;
  const depth = depthLevel(numberParam(query.depth, 50));
  const time = TIMES[timeIndex(query.time)];
  const valuesFor = (variable: VariableId) => LATITUDES.flatMap((latitude) =>
    LONGITUDES.map((longitude) => fieldValue(variable, latitude, longitude, depth, timeIndex(time))),
  );
  const metrics = (values: number[]) => {
    const ordered = [...values].sort((a, b) => a - b);
    return {
      min: Number(Math.min(...values).toFixed(2)),
      max: Number(Math.max(...values).toFixed(2)),
      mean: Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2)),
      median: Number(ordered[Math.floor(ordered.length / 2)].toFixed(2)),
    };
  };
  const errors = observations.slice(0, 18).map((observation) => Number((modelValueAt(observation, "temperature", depth) - (modelValueAt(observation, "temperature", depth) + 0.35)).toFixed(2)));
  res.json({
    temperature: metrics(valuesFor("temperature")),
    salinity: metrics(valuesFor("salinity")),
    current_speed: metrics(valuesFor("current_speed")),
    observation_count: observations.length,
    agreement: 87.4,
    error_distribution: errors,
  });
});

router.get("/map", (_req, res) => {
  const domain = [
    { latitude: -18, longitude: 45 },
    { latitude: 25, longitude: 45 },
    { latitude: 25, longitude: 100 },
    { latitude: -18, longitude: 100 },
  ];
  const tracks = observations
    .filter((observation) => observation.platform_type === "Glider")
    .map((observation, index) => ({
      id: observation.id,
      points: Array.from({ length: 6 }, (_, step) => ({
        latitude: observation.latitude + Math.sin(step / 1.8) * 1.4,
        longitude: observation.longitude - step * 1.1 + index * 0.12,
      })),
    }));
  res.json({ domain, observations, tracks });
});

export default router;