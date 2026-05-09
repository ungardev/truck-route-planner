# 🚛 Truck Route Planner & ELD Logs Generator

A Full Stack web application for property-carrying CMV drivers that calculates HOS-compliant routes and generates Electronic Logging Device (ELD) daily logs in accordance with FMCSA regulations.

---

## 🎯 Overview

This application solves the problem of manually planning truck routes while ensuring Hours of Service (HOS) compliance. It provides:

- **Smart Route Calculation** with mandatory rest stops and fuel breaks
- **Real-time Geocoding** using OpenStreetMap's Nominatim API
- **Dynamic ELD Log Generation** with SVG-based visualizations

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  TripForm   │  │  RouteMap   │  │  HOSGrid    │        │
│  │  (Geocoding)│  │  (Leaflet)  │  │  (SVG Log)  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                         │                                   │
│                   Vite + Tailwind CSS                       │
└────────────────────────────┼────────────────────────────────┘
                             │ REST API
┌────────────────────────────┼────────────────────────────────┐
│                     BACKEND (Django)                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              HOS Engine (Python)                     │   │
│  │  • 70hr/8day cycle tracking                         │   │
│  │  • 11hr driving / 14hr window limits                │   │
│  │  • 30min rest break after 8hrs driving             │   │
│  │  • Fuel stop every 1,000 miles                      │   │
│  │  • Pickup/Dropoff time: 1hr each                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                         │                                   │
│                   Django REST Framework                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📜 FMCSA HOS Regulations Implemented

This motor implements **49 CFR Part 395 - Hours of Service Regulations**:

| Rule | Limit | Implementation |
|------|-------|----------------|
| **Driving Time** | 11 hours | Max cumulative driving per duty period |
| **Driving Window** | 14 hours | Max window from start of work to last driving |
| **Rest Break** | 30 minutes | Required after 8 cumulative hours driving |
| **Off-Duty Period** | 10 hours | Required before next driving period |
| **Cycle Limit** | 70hrs/8days | Total on-duty time in rolling 8-day period |
| **Fuel Stops** | 1,000 miles | 1-hour ON_DUTY stop for fueling |
| **Pickup/Dropoff** | 1 hour each | ON_DUTY time for loading/unloading |

---

## 🛠️ Tech Stack

### Backend
- **Django 5.2 LTS** - Robust Python framework for the HOS calculation engine
- **Django REST Framework** - RESTful API architecture
- **Python 3.13+** - Latest Python with enhanced math precision

### Frontend
- **React 18** - Component-based UI architecture
- **Vite** - Fast build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon system
- **React-Leaflet** - Interactive mapping with OpenStreetMap

### External Services
- **Nominatim API** - OpenStreetMap geocoding (no API key required)
- **OpenStreetMap** - Free map tiles

---

## ✨ Key Features

### 1. Smart HOS-Compliant Routing
The engine calculates optimal routes by:
- Inserting mandatory 30-minute rest breaks every 8 hours of driving
- Scheduling 1-hour fuel stops every 1,000 miles
- Accounting for 1-hour pickup and dropoff times
- Tracking cumulative driving time against the 11-hour limit

### 2. Real-time Geocoding
- User enters text addresses (e.g., "New York, NY")
- Nominatim converts to lat/lng coordinates
- No API keys required - uses OpenStreetMap's free service

### 3. Dynamic ELD Log Generation
- SVG-based 24-hour grid visualization
- Four status lanes: Off Duty, Sleeper Berth, Driving, On Duty (Not Driving)
- Hover interaction showing exact status at each hour
- Multi-day support for long trips

### 4. Interactive Route Map
- Leaflet-powered map with OpenStreetMap tiles
- Color-coded markers for origin, pickup, dropoff
- Polyline showing the route path

### 5. Comprehensive Route Timeline
- Chronological list of all events
- Color-coded status badges
- Mileage tracking per segment

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm 9+

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

The backend will be available at `http://localhost:8000`

### Frontend Setup

```bash
# Navigate to frontend directory (new terminal)
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Testing the HOS Engine

```bash
cd backend
python test_engine.py
```

---

## 📡 API Reference

### POST `/api/calculate-trip/`

Calculate a HOS-compliant route and generate ELD logs.

**Request:**
```json
{
  "origin": {
    "lat": 40.7128,
    "lng": -74.0060,
    "address": "New York, NY"
  },
  "pickup": {
    "lat": 40.7357,
    "lng": -74.1724,
    "address": "Newark, NJ"
  },
  "dropoff": {
    "lat": 39.9527,
    "lng": -75.1635,
    "address": "Philadelphia, PA"
  },
  "current_cycle_hours": 45.5
}
```

**Response:**
```json
{
  "trip_id": "trip_20260509_143052",
  "total_distance_miles": 84.2,
  "estimated_duration_hours": 3.8,
  "current_cycle_hours": 45.5,
  "events": [
    {
      "day": 1,
      "timestamp": "2026-05-09T06:00:00",
      "type": "ON_DUTY",
      "location": "New York, NY",
      "description": "Start of trip - Pre-trip inspection",
      "miles_driven": 0,
      "cumulative_driving_hours": 0,
      "cumulative_on_duty_hours": 0.5
    }
  ],
  "daily_logs": [
    {
      "day": 1,
      "date": "2026-05-09",
      "total_miles": 84.2,
      "grid_data": [
        {"hour": 0, "status": "OFF_DUTY", "location": ""},
        {"hour": 6, "status": "ON_DUTY", "location": "New York, NY"}
      ],
      "remarks": ["Pre-trip inspection", "Driving to Newark"]
    }
  ]
}
```

### GET `/api/health/`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-05-09T14:30:52.123456",
  "service": "HOS Trip Planner API"
}
```

---

## 🗺️ Example: NYC to Los Angeles Trip

Here's what the application processes for a long-haul trip from New York to Los Angeles:

```json
{
  "origin": {"lat": 40.7128, "lng": -74.0060, "address": "New York, NY"},
  "pickup": {"lat": 40.7357, "lng": -74.1724, "address": "Newark, NJ (Warehouse)"},
  "dropoff": {"lat": 34.0522, "lng": -118.2437, "address": "Los Angeles, CA"},
  "current_cycle_hours": 20.0
}
```

**Processing Result:**
- **Total Distance:** ~2,800 miles
- **Estimated Duration:** ~48 hours (2-3 days)
- **Required Stops:**
  - ~3 fuel stops (every 1,000 miles)
  - ~5 rest breaks (every 8 hours of driving)
  - 1-hour pickup at Newark
  - 1-hour dropoff at LA
- **Generated Logs:** 3 daily log sheets

**Sample Event Timeline (Day 1):**
```
06:00 ON_DUTY  - Pre-trip inspection
06:30 ON_DUTY  - Arrived at pickup, loading cargo
07:30 DRIVING  - NYC to rest stop (95 mi)
08:30 OFF_DUTY - 30-min rest break
09:00 DRIVING  - Continuing east (120 mi)
10:00 ON_DUTY  - Fuel stop
11:00 DRIVING  - Toward destination (150 mi)
...
20:00 OFF_DUTY - 10-hour rest period
```

---

## 📁 Project Structure

```
truck-route-planner/
├── backend/
│   ├── hos_engine/
│   │   ├── engine.py          # HOS calculation core
│   │   └── __init__.py
│   ├── api/
│   │   ├── views.py           # API endpoints
│   │   ├── serializers.py      # Request/Response validation
│   │   └── urls.py             # URL routing
│   ├── trip_planner/
│   │   ├── settings.py         # Django settings
│   │   ├── urls.py             # Root URL config
│   │   └── wsgi.py             # WSGI application
│   ├── manage.py
│   ├── requirements.txt
│   └── test_engine.py          # Standalone HOS engine tests
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── HOSGrid.jsx     # SVG daily log chart
│   │   │   ├── RouteMap.jsx    # Leaflet map
│   │   │   └── TripForm.jsx    # Geocoding form
│   │   ├── App.jsx             # Main layout
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind styles
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── README.md
├── .gitignore
└── LICENSE
```

---

## 📄 License

This project is for demonstration purposes as part of a job application assessment.

---

## 👤 Author

Built as a technical assessment for **Spotter AI** - Full Stack Developer position.

**Stack Highlights:**
- **Django + Python** → Precision mathematical calculations for FMCSA HOS compliance
- **React + SVG** → High-fidelity ELD log visualizations
- **OpenStreetMap + Nominatim** → Free, API-key-free mapping service

---

*Last updated: May 2026*
*Complies with 49 CFR Part 395 FMCSA Hours of Service Regulations*