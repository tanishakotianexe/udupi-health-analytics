# Udupi Health Analytics

[![React](https://img.shields.io/badge/React-frontend-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-backend-5FA04E?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Docker Compose](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docs.docker.com/compose/)

A visual healthcare analytics application for exploring facility locations, service activity, and district health trends across Udupi, Karnataka.

## Stack

- **Frontend:** React, Vite, Recharts, React Leaflet
- **Backend:** Node.js and Express REST API
- **Data tools:** Excel and CSV upload, validation, template download, and dataset reset
- **Deployment:** Docker Compose locally; single Docker web service on Render

## Run with Docker Compose

Install Docker Desktop, then run from this folder:

```bash
docker compose up --build
```

Open `http://localhost:8080`. The API health check is at `http://localhost:4000/api/health`.

Stop the containers with:

```bash
docker compose down
```

## Run without Docker

Requires Node.js 20+ and npm. In two terminals:

```bash
cd backend
npm install
npm start
```

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

## Included

- Interactive facility map with taluk, ownership, and facility-type filters
- Visual stories for facility mix and historical district health indicators
- Excel/CSV facility upload, downloadable template, and sample-data reset
- Findings and planning options based on the active dataset
- Browser-local signup and login for demonstrations

## Data notes

Uploaded facility files replace the active facility list for map and facility charts. Historical indicator series stay with the bundled source unless replacement history is supplied. Missing values are not treated as zero. Activity counts do not represent unique patients, coverage, quality, or unmet need. Planning suggestions are exploratory and need additional evidence before use in decisions.

Login accounts are stored in each browser and are not shared across devices. The free hosted service keeps uploaded data in memory, which resets when the instance restarts. Use demonstration data only; do not upload patient-identifiable information.

Map tiles use OpenStreetMap and require an internet connection.
