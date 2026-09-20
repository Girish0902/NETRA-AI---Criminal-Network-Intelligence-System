<div align="center">

<img src="./screenshots/sidebar-logo.png" alt="NETRA Logo" width="80" />

# NETRA
### Criminal Network Intelligence System

**Network Entity Tracking &amp; Reconnaissance Application**

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)](https://expressjs.com)
[![License](https://img.shields.io/badge/License-MIT-orange?style=flat-square)](LICENSE)
[![Live Demo](https://img.shields.io/badge/Live-netra--snowy.vercel.app-FF6B35?style=flat-square&logo=vercel)](https://netra-snowy.vercel.app)

A full-stack intelligence platform for law enforcement agencies to analyze criminal networks, visualize crime hotspots, track repeat offenders, and generate actionable insights from FIR records — all in a unified dark-themed dashboard.

---

![Dashboard](./screenshots/01-dashboard.png)

</div>

---

## Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Screenshots](#-screenshots)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)

---

## Overview

NETRA (Network Entity Tracking & Reconnaissance Application) is a purpose-built criminal intelligence platform designed to help police departments and investigative agencies make data-driven decisions. It ingests structured CSV data from police record management systems and transforms raw case data into interactive visual intelligence.

> **Demo Mode** — When the local API server is unavailable, NETRA gracefully falls back to embedded sample data so the dashboard remains usable for demonstration purposes.

---

## Features

### 🧠 Intelligence & Analytics
- **Crime Intelligence Dashboard** — Real-time KPIs: total cases, active investigations, heinous offences, and highest-volume districts
- **Crime Trends** — Time-series charts with district and category filters to identify seasonal patterns
- **Predictive Intelligence** — Risk scoring and forward-looking crime probability indicators
- **Pattern Library** — Catalogued modus operandi and recurring crime signatures

### 🗺️ Geospatial
- **Hotspot Map** — Interactive Leaflet map with marker clustering, heatmap overlays, and per-district drill-down
- **District Analysis** — Comparative district-level crime statistics with socioeconomic correlation indicators

### 🕸️ Network Analysis
- **Criminal Network Graph** — Cytoscape.js-powered force-directed graph linking accused, victims, cases, and locations
- **Repeat Offenders** — Ranked registry of individuals with multiple case associations and recidivism scores

### 🔍 Case Management
- **Case Search** — Full-text and filtered search across all FIR records
- **Case Overview** — Detailed case view with accused, victims, chargesheet status, and linked evidence
- **Investigation Workspace** — Structured workspace per case with notes and evidence tracking
- **Evidence Upload & Viewer** — Document management for case evidence files

### 🤖 AI Assistant
- **AI Crime Assistant** — Conversational chatbot interface for natural language queries against case data, trend summaries, and investigative suggestions

### 🛡️ Administration
- **Admin Console** — User management and system configuration
- **Access Requests** — Role-based access request workflow
- **Audit Logs** — Tamper-evident log of all user actions
- **Alerts** — Configurable threshold-based crime alerts
- **Reports** — Exportable statistical reports

---

## Screenshots

| | |
|---|---|
| ![Dashboard](./screenshots/01-dashboard.png) | ![Crime Trends](./screenshots/02-crime-trends.png) |
| *Crime Intelligence Dashboard* | *Crime Trends & Time-Series Analysis* |
| ![Hotspot Map](./screenshots/03-hotspot-map.png) | ![AI Assistant](./screenshots/04-ai-assistant.png) |
| *Interactive Hotspot Map* | *AI Crime Assistant* |
| ![Criminal Network](./screenshots/05-criminal-network.png) | ![District Analysis](./screenshots/06-district-analysis.png) |
| *Criminal Network Graph* | *District-Level Analysis* |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 19 + React Router 7 |
| **Build Tool** | Vite 8 |
| **Styling** | Tailwind CSS 4 + Vanilla CSS |
| **Charts** | Recharts |
| **Maps** | Leaflet + React-Leaflet + MarkerCluster |
| **Network Graphs** | Cytoscape.js + React-CytoscapeJS |
| **Icons** | Lucide React |
| **Backend** | Node.js 24 + Express 4 |
| **Data** | CSV files parsed with `csv-parse` |
| **Compression** | `compression` middleware |
| **Frontend Hosting** | Vercel |
| **Linting** | OXLint |

---

## Project Structure

```
netra/
├── src/
│   ├── pages/              # All route-level page components
│   │   ├── Dashboard.jsx
│   │   ├── AIChatbot.jsx
│   │   ├── HotspotMap.jsx
│   │   ├── CrimeTrends.jsx
│   │   ├── CriminalNetwork.jsx
│   │   ├── CaseSearch.jsx
│   │   ├── DistrictAnalysis.jsx
│   │   ├── Predictions.jsx
│   │   ├── RepeatOffenders.jsx
│   │   └── ...
│   ├── components/         # Shared UI components
│   ├── layouts/            # DashboardLayout (sidebar + topbar)
│   ├── auth/               # Auth guard & protected routes
│   ├── services/           # API client & data-fetching layer
│   ├── context/            # React context providers
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Helper utilities
│   ├── i18n/               # Internationalisation (multi-language)
│   ├── data/               # Fallback demo data
│   └── config/             # App-wide configuration
│
├── backend/
│   ├── server.js           # Express API server (single file)
│   └── data/               # CSV data files (police records)
│       ├── CaseMaster.csv
│       ├── Accused.csv
│       ├── Victim.csv
│       ├── District.csv
│       ├── ArrestSurrender.csv
│       ├── ChargesheetDetails.csv
│       └── ...
│
├── screenshots/            # App screenshots
├── public/                 # Static assets
├── index.html
├── vite.config.js
└── .env.example
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher

### 1. Clone the repository

```bash
git clone https://github.com/Girish0902/NETRA-AI---Criminal-Network-Intelligence-System.git
cd NETRA-AI---Criminal-Network-Intelligence-System
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd backend
npm install
cd ..
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your settings (see [Environment Variables](#-environment-variables)).

### 5. Start the backend API server

```bash
# In a separate terminal
cd backend
npm run dev
# Server starts at http://localhost:5000
```

### 6. Start the frontend dev server

```bash
# In the project root
npm run dev
# App starts at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

> **Note:** If the backend is not running, the app will automatically fall back to demo data mode.

---

## Environment Variables

### Frontend (`.env` in project root)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000` | URL of the local Express API server |
| `VITE_APP_NAME` | `NETRA AI` | Application display name |
| `VITE_APP_ENV` | `development` | Environment identifier |

### Backend (`.env` in `backend/`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `5000` | Port the Express server listens on |
| `CORS_ORIGINS` | `http://localhost:5173,...` | Comma-separated list of allowed CORS origins |

---

## API Reference

The Express backend exposes a REST API consumed by the frontend. All endpoints are prefixed with `/api`.

| Endpoint | Method | Description |
|---|---|---|
| `/api/dashboard/summary` | GET | KPI metrics for the main dashboard |
| `/api/cases` | GET | Paginated, filterable list of all cases |
| `/api/cases/:id` | GET | Full details for a single case |
| `/api/trends` | GET | Aggregated time-series crime trend data |
| `/api/hotspots` | GET | Geo-coordinates and crime counts per location |
| `/api/network` | GET | Graph nodes and edges for criminal network |
| `/api/repeat-offenders` | GET | Ranked list of repeat accused |
| `/api/districts` | GET | District lookup table |
| `/api/predictions` | GET | Predictive risk indicators |
| `/api/alerts` | GET | Active crime alerts |
| `/api/resources` | GET | Raw CSV dataset browser |

> Query parameters common to list endpoints: `districtId`, `crimeHeadId`, `statusId`, `from` (ISO date), `to` (ISO date).

---

## Deployment

### Frontend — Vercel

The frontend is configured for Vercel with `vercel.json`. All routes are rewritten to `index.html` for SPA routing.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set the `VITE_API_BASE_URL` environment variable in your Vercel project settings to point to your deployed backend.

### Backend

The Express server can be deployed to any Node.js host (Railway, Render, Fly.io, etc.):

```bash
cd backend
npm start
```

Set the `CORS_ORIGINS` environment variable to include your Vercel frontend URL.

---

<div align="center">

Built with ❤️ for law enforcement intelligence

**[Live Demo](https://netra-snowy.vercel.app)** · **[Report a Bug](https://github.com/Girish0902/NETRA-AI---Criminal-Network-Intelligence-System/issues)** · **[Request a Feature](https://github.com/Girish0902/NETRA-AI---Criminal-Network-Intelligence-System/issues)**

</div>
