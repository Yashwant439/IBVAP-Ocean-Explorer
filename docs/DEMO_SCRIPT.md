# SIH judge demo script

## 1. Frame the problem

“Model outputs and instrument observations are valuable, but they usually live in separate scientific tools. IBVAP brings both into one browser-based exploration and analysis workflow.”

## 2. Open the dashboard

Point out the **DEMO DATA** disclosure, the Indian Ocean domain, the 16 × 20 × 8 × 10 model grid, and the integrated Argo/glider coverage.

## 3. Explore the model

Open **3D Explorer**. Change the variable from Temperature to Salinity and Chlorophyll. Move the depth from 50 m to 500 m and advance the time slider. Explain that every change requests a filtered field from the API.

## 4. Add currents and observations

Turn on current vectors, then enable observation markers. Select an Argo marker or the observation list to open its profile. Switch the profile variable to Salinity.

## 5. Compare

Open **Model vs Observation**. Show the model value, observed value, signed difference, absolute error, MAE, bias, and agreement. Explain that the MVP uses nearest-neighbor matching across space, depth, and time.

## 6. Use the map and analytics

Open **Ocean Map** to show the model domain, platform markers, and glider tracks. Open **Analytics** to show temperature/salinity/current metrics and the error distribution.

## 7. Show ingestion

Open **Data Ingestion**, choose a sample CSV or NetCDF file, and submit it. Point out file validation, detected columns, and registration in the dataset catalog.

## 8. Connect to disaster management

Return to the dashboard. Explain that this supports rapid ocean-state assessment, search-and-rescue context, marine situational awareness, and coastal monitoring. The app does not claim operational forecasting.

## 9. Close with extensibility

“The same API/provider boundary can connect to real INCOIS feeds, more sensors such as BGC and ADCP, and production-scale OPeNDAP/Zarr infrastructure when those are available.”