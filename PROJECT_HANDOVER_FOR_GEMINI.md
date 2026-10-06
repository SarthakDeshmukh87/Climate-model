# Climate Intelligence — Full Project Handover Document

> **Purpose of this document**: Provide complete technical context about the "Climate Intelligence" project so that Google Gemini (or any other AI assistant) can understand the full codebase, its architecture, data flows, API integrations, and current state — and continue development work seamlessly.

---

## 1. Project Overview

**Project Name**: Climate Intelligence — Heatwave Monitoring, Prediction & Early Warning (India Edition)

**What it does**:
A full-stack web application that monitors real-time climate/weather data for user-selected locations (originally 8 Indian cities, now any worldwide location), calculates heatwave risk levels using IMD & WMO calibrated models, generates predictions/alerts/reports, and presents everything in a rich analytics dashboard.

**Core Features**:
1. **Station Selection** — Users choose from 8 pre-seeded Indian weather observatories OR add their own custom location (via GPS auto-detect, city search, or manual lat/lon entry)
2. **Real-Time Weather Dashboard** — Live climate metrics fetched from Open-Meteo API (temperature, humidity, wind, precipitation, UV, pressure, weather condition)
3. **Heatwave Risk Assessment** — Automated risk calculation engine using IMD/WMO thresholds (Safe → Low → Moderate → High → Extreme → Emergency)
4. **Hourly & 7-Day Forecast Charts** — Recharts-based visualization of temperature trends, precipitation probability, wind speeds
5. **Weather Records** — Historical observation log per station
6. **Heatwave Predictions** — Forward-looking risk predictions with confidence percentages
7. **Alert System** — Auto-generated alerts when risk is Moderate or higher, with status management (Active/Resolved/Dismissed)
8. **Report Analysis** — Thermal assessment reports per observation
9. **User Feedback** — Rating & comment system synced to Supabase
10. **Admin Dashboard** — Station management, user management, manual observation entry (admin role only)
11. **Authentication** — Login/Signup modal with Supabase Auth (OTP + fallback to localStorage-based session)

---

## 2. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| **Framework** | Next.js (App Router) | 14.2.15 |
| **Language** | TypeScript | ^5.6.3 |
| **UI Library** | React | ^18.3.1 |
| **Styling** | Tailwind CSS | ^3.4.14 |
| **Charts** | Recharts | ^2.13.0 |
| **Icons** | Lucide React | ^0.453.0 |
| **Backend/DB** | Supabase (PostgreSQL + Auth) | @supabase/supabase-js ^2.45.4, @supabase/ssr ^0.5.1 |
| **Weather API** | Open-Meteo (free, no API key) | REST API |
| **Geocoding** | Open-Meteo Geocoding + OSM Nominatim | REST APIs |
| **Utility** | clsx, tailwind-merge | ^2.1.1, ^2.5.4 |

---

## 3. Directory Structure

```
Climate model/
├── .env.example                    # Template for environment variables
├── .env.local                      # Actual env vars (Supabase URL, keys, Open-Meteo URL)
├── next.config.mjs                 # Next.js config (reactStrictMode: true)
├── tailwind.config.ts              # Tailwind config with custom climate/risk color tokens
├── postcss.config.js               # PostCSS config for Tailwind
├── tsconfig.json                   # TypeScript configuration
├── package.json                    # Dependencies and scripts
│
├── supabase/
│   └── schema.sql                  # Complete PostgreSQL schema with seed data
│
└── src/
    ├── app/
    │   ├── globals.css             # Global CSS (Tailwind directives + risk badge classes + scrollbar)
    │   ├── layout.tsx              # Root layout (AuthProvider wraps children)
    │   ├── page.tsx                # Main page component (station selection → dashboard routing)
    │   └── login/
    │       └── page.tsx            # Dedicated login page (alternative to modal)
    │
    ├── components/
    │   ├── StationSelector.tsx     # Full-page station selection with GPS/search/manual add (674 lines)
    │   ├── DashboardView.tsx       # Main analytics dashboard with live weather + charts (589 lines)
    │   ├── Navigation.tsx          # Sidebar navigation component (252 lines)
    │   ├── AdminDashboardView.tsx  # Admin panel for station/user/obs management (18,822 bytes)
    │   ├── WeatherRecordsView.tsx  # Observation history table
    │   ├── PredictionsView.tsx     # Heatwave predictions list
    │   ├── AlertsView.tsx          # Alert management view
    │   ├── ReportsView.tsx         # Report analysis view
    │   ├── FeedbackView.tsx        # User feedback submission & listing
    │   ├── AuthModal.tsx           # Login/Signup/Reset password modal
    │   └── RiskBadge.tsx           # Reusable risk level badge component
    │
    ├── context/
    │   └── AuthContext.tsx          # Auth context provider (user session, login, signup, logout)
    │
    ├── lib/
    │   ├── services/
    │   │   ├── openmeteo.ts        # Open-Meteo API client + heatwave risk engine + weather parser
    │   │   └── geocoding.ts        # Location search (Open-Meteo) + reverse geocoding (Nominatim)
    │   └── supabase/
    │       └── client.ts           # Supabase client + ClimateDataService class (all CRUD operations)
    │
    └── types/
        └── database.ts             # TypeScript interfaces for all data models
```

---

## 4. Database Schema (Supabase PostgreSQL)

The full schema is in `supabase/schema.sql`. Here's the relational model:

### Tables

#### 1. `Weather_Station`
```sql
Station_ID    BIGINT (PK, auto-increment)
Station_Code  VARCHAR(50) UNIQUE NOT NULL     -- e.g., "ST-DEL-01", "MY-PUN-42"
Station_Name  VARCHAR(255) NOT NULL           -- e.g., "New Delhi Central Observatory"
Latitude      DECIMAL(10,6) NOT NULL
Longitude     DECIMAL(10,6) NOT NULL
Status        VARCHAR(50) DEFAULT 'Active'    -- CHECK: 'Active' | 'Maintenance' | 'Inactive'
```

#### 2. `Station_Location`
```sql
Station_ID    BIGINT (FK → Weather_Station, CASCADE)
Location      VARCHAR(255) NOT NULL           -- Human-readable address
PRIMARY KEY   (Station_ID, Location)          -- Composite key
```

#### 3. `Weather_Observation`
```sql
Obs_ID        BIGINT (PK, auto-increment)
Station_ID    BIGINT (FK → Weather_Station, CASCADE)
Recorded_At   TIMESTAMPTZ DEFAULT NOW()
Temperature   DECIMAL(5,2) NOT NULL           -- in °C
Humidity      DECIMAL(5,2) NOT NULL           -- in %
Rainfall      DECIMAL(6,2) DEFAULT 0.00      -- in mm
Wind_Speed    DECIMAL(5,2) DEFAULT 0.00      -- in km/h
```

#### 4. `Heatwave_Prediction`
```sql
Pre_ID              BIGINT (PK, auto-increment)
Station_ID          BIGINT (FK → Weather_Station, CASCADE)
Pre_Temp            DECIMAL(5,2) NOT NULL     -- Predicted temperature
Target_Data         TIMESTAMPTZ               -- Target forecast date
Risk_level          VARCHAR(50) NOT NULL       -- CHECK: Safe|Low|Moderate|High|Extreme|Emergency
Confidence_Percent  DECIMAL(5,2)              -- 0-100
```

#### 5. `Alert`
```sql
Alert_ID        BIGINT (PK, auto-increment)
Pre_ID          BIGINT (FK → Heatwave_Prediction, SET NULL)
Obs_ID          BIGINT (FK → Weather_Observation, SET NULL)
Alert_msg       TEXT NOT NULL
Severity_level  VARCHAR(50) NOT NULL          -- Same risk levels as predictions
Status          VARCHAR(50) DEFAULT 'Active'  -- CHECK: Active|Resolved|Dismissed
```

#### 6. `Report_Analysis`
```sql
R_ID          BIGINT (PK, auto-increment)
Obs_ID        BIGINT (FK → Weather_Observation, CASCADE)
Report_Type   VARCHAR(100) NOT NULL
Criteria      TEXT NOT NULL
Description   TEXT NOT NULL
Generated_At  TIMESTAMPTZ DEFAULT NOW()
```

#### 7. `User`
```sql
User_ID    UUID (PK, DEFAULT gen_random_uuid())
User_Name  VARCHAR(255) NOT NULL
Email      VARCHAR(255) UNIQUE NOT NULL
Phone_no   VARCHAR(50)
DOB        DATE
Role       VARCHAR(50) DEFAULT 'user'        -- CHECK: 'user' | 'admin'
```

#### 8. `User_Feedback`
```sql
F_ID          BIGINT (PK, auto-increment)
User_ID       UUID (FK → User, CASCADE)
F_Type        VARCHAR(100) NOT NULL
Comments      TEXT NOT NULL
Rating        INTEGER CHECK (1-5)
Submitted_at  TIMESTAMPTZ DEFAULT NOW()
```

### Row Level Security (RLS)
- All tables have RLS enabled
- All tables have **public read** policies (`FOR SELECT USING (true)`)
- `User` table has **public insert and update** policies
- `User_Feedback` has **public insert** policy
- Admin has **full access** policies on Weather_Station, Weather_Observation, Heatwave_Prediction, Alert, User_Feedback

### Seed Data
8 Indian weather stations are pre-seeded:
1. New Delhi Central Observatory (28.6139, 77.2090)
2. Mumbai Coastal Climate Station (18.9220, 72.8347)
3. Kolkata Alipore Observatory (22.5326, 88.3278)
4. Chennai Nungambakkam Post (13.0604, 80.2496)
5. Bengaluru Electronics City Unit (12.9716, 77.5946)
6. Hyderabad Begumpet Station (17.4435, 78.4772)
7. Ahmedabad Sabarmati Monitor (23.0225, 72.5714)
8. Jaipur Thar Fringe Observatory (26.9124, 75.7873)

---

## 5. TypeScript Interfaces (src/types/database.ts)

```typescript
export type RiskLevel = 'Safe' | 'Low' | 'Moderate' | 'High' | 'Extreme' | 'Emergency';
export type UserRole = 'user' | 'admin';

export interface WeatherStation {
  Station_ID: number;
  Station_Code: string;
  Station_Name: string;
  Latitude: number;
  Longitude: number;
  Status: 'Active' | 'Maintenance' | 'Inactive';
  isCustom?: boolean;      // true if user-added (not in DB schema, client-side flag)
  createdBy?: string;      // user ID who created it
}

export interface StationLocation {
  Station_ID: number;
  Location: string;        // Human-readable address string
}

export interface WeatherObservation {
  Obs_ID: number;
  Station_ID: number;
  Recorded_At: string;
  Temperature: number;
  Humidity: number;
  Rainfall: number;
  Wind_Speed: number;
  Weather_Station?: WeatherStation;        // Joined data
  Station_Location?: StationLocation[];    // Joined data
}

export interface HeatwavePrediction {
  Pre_ID: number;
  Station_ID: number;
  Pre_Temp: number;
  Target_Data: string;
  Risk_level: RiskLevel;
  Confidence_Percent: number;
  Weather_Station?: WeatherStation;
}

export interface Alert {
  Alert_ID: number;
  Pre_ID: number | null;
  Obs_ID: number | null;
  Alert_msg: string;
  Severity_level: RiskLevel;
  Status: 'Active' | 'Resolved' | 'Dismissed';
  Heatwave_Prediction?: HeatwavePrediction;
  Weather_Observation?: WeatherObservation;
}

export interface ReportAnalysis {
  R_ID: number;
  Obs_ID: number;
  Report_Type: string;
  Criteria: string;
  Description: string;
  Generated_At: string;
  Weather_Observation?: WeatherObservation;
}

export interface User {
  User_ID: string;
  User_Name: string;
  Email: string;
  Phone_no: string | null;
  DOB: string | null;
  Role: UserRole;
}

export interface UserFeedback {
  F_ID: number;
  User_ID: string;
  F_Type: string;
  Comments: string;
  Rating: number;
  Submitted_at: string;
  User?: User;
}

export interface WeatherAPIResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    precipitation: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    precipitation: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    wind_speed_10m_max: number[];
  };
}
```

---

## 6. Core Data Service (src/lib/supabase/client.ts)

This is the **central data layer** of the application (751 lines). Key architecture:

### Supabase Client
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zrvdlvqjayhewgvkyskl.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '...';
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Data Persistence Strategy (Hybrid)
The app uses a **dual-persistence** approach:
1. **Supabase (remote DB)** — Primary data source. All CRUD tries Supabase first.
2. **localStorage (browser)** — Fallback + cache. If Supabase fails, localStorage data is used.

Data keys in localStorage:
- `ci_stations` — WeatherStation[]
- `ci_locations` — StationLocation[]
- `ci_observations` — WeatherObservation[]
- `ci_predictions` — HeatwavePrediction[]
- `ci_alerts` — Alert[]
- `ci_reports` — ReportAnalysis[]
- `ci_users` — User[]
- `ci_feedback` — UserFeedback[]
- `ci_user_custom_stations` — WeatherStation[] (user's personal custom locations)
- `ci_user_custom_locations` — StationLocation[] (custom location addresses)
- `ci_selected_station_id` — number (last selected station)
- `ci_active_user` — User (currently logged-in user)

### Default Data
When localStorage is empty, these defaults are initialized:
- **DEFAULT_STATIONS** — The 8 Indian weather stations (hardcoded array)
- **DEFAULT_LOCATIONS** — Location strings for the 8 stations
- **DEFAULT_USERS** — 3 sample users (1 admin: `admin@climate-intel.in`, 2 regular users)
- Mock observations, predictions, alerts, reports are **auto-generated** using random data seeded from the default stations

### `ClimateDataService` Class — Static Methods

| Method | Description |
|---|---|
| `getStations()` | Fetches stations from Supabase → fallback localStorage → fallback DEFAULT_STATIONS. Merges user's custom stations from `ci_user_custom_stations`. |
| `getLocations()` | Same strategy. Merges custom locations from `ci_user_custom_locations`. |
| `getObservations()` | Fetches from Supabase + localStorage, deduplicates by Obs_ID, sorts by date desc. Joins Weather_Station data. |
| `getPredictions()` | Same pattern as observations. |
| `getAlerts()` | Same pattern. |
| `getReports()` | Same pattern. |
| `getFeedbacks()` | Supabase → localStorage fallback. |
| `getUsers()` | Supabase → localStorage → DEFAULT_USERS fallback. |
| `submitFeedback(...)` | Upserts user, inserts feedback to Supabase + localStorage. |
| `addObservationAndAnalyze(obs)` | Creates observation, auto-derives prediction/alert/report using heatwave risk engine, stores everywhere. |
| `refreshLiveWeatherForStation(stationId)` | Fetches live Open-Meteo data for station's lat/lon, seeds hourly history if sparse, creates new observation. |
| `addStation(code, name, lat, lon, location, isCustom)` | Inserts station to Supabase + localStorage. If isCustom=true, also saves to `ci_user_custom_stations`. |
| `deleteStation(stationId)` | Removes from Supabase + all localStorage keys. |
| `updateAlertStatus(alertId, status)` | Updates alert status in Supabase + localStorage. |
| `updateUserRole(userId, newRole)` | Updates user role in Supabase + localStorage. |

---

## 7. Weather API Integration (src/lib/services/openmeteo.ts)

### Open-Meteo API Call
```
GET https://api.open-meteo.com/v1/forecast
  ?latitude={lat}&longitude={lon}
  &current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,surface_pressure,wind_speed_10m,wind_direction_10m,uv_index
  &hourly=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,wind_speed_10m
  &daily=temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,uv_index_max,precipitation_sum,precipitation_probability_max
  &timezone=auto
```

**No API key required.** Free and open.

### Parsed Response (`LiveClimateMetrics`)
```typescript
interface LiveClimateMetrics {
  temperature: number;       // Current temp in Celsius
  apparentTemp: number;      // Feels-like in Celsius
  humidity: number;          // Percentage
  precipitation: number;     // mm
  windSpeed: number;         // km/h
  windDirection: number;     // degrees
  surfacePressure: number;   // hPa
  uvIndex: number;
  weatherCode: number;       // WMO code
  weatherCondition: string;  // e.g., "Clear Sky", "Rain"
  weatherIcon: string;       // Emoji
  time: string;
  hourly: {
    times: string[];
    temperatures: number[];
    apparentTemps: number[];
    humidities: number[];
    precipitationProbs: number[];
    precipitations: number[];
    windSpeeds: number[];
  };
  daily: {
    dates: string[];
    maxTemps: number[];
    minTemps: number[];
    apparentMaxTemps: number[];
    precipitationSums: number[];
    popMax: number[];
    uvMax: number[];
  };
}
```

### Heatwave Risk Engine (`calculateHeatwaveRisk`)
Uses IMD (India Meteorological Department) & WMO calibrated thresholds:

| Condition | Risk Level |
|---|---|
| temp >= 45 C OR heatIndex >= 52 C | **Emergency** |
| temp >= 42 C OR heatIndex >= 47 C | **Extreme** |
| temp >= 38 C OR heatIndex >= 42 C | **High** |
| temp >= 34 C OR heatIndex >= 37 C | **Moderate** |
| temp >= 30 C OR heatIndex >= 32 C | **Low** |
| Below all thresholds | **Safe** |

Heat Index is calculated using a modified Rothfusz equation when temp >= 26 C.
Confidence percentage is 85%-99.5%, modulated by wind speed.

### `derivePredictionAlertAndReport(obs)`
Given a WeatherObservation, automatically generates:
1. A `HeatwavePrediction` for the next day
2. An `Alert` (only if risk >= Moderate)
3. A `ReportAnalysis`

---

## 8. Geocoding Service (src/lib/services/geocoding.ts)

### Forward Geocoding (City Search)
```
GET https://geocoding-api.open-meteo.com/v1/search?name={query}&count=8&language=en&format=json
```
Returns: `GeocodingResult[]` with `{ id, name, latitude, longitude, admin1, country, country_code, displayName }`

### Reverse Geocoding (GPS to Address)
```
GET https://nominatim.openstreetmap.org/reverse?lat={lat}&lon={lon}&format=json
User-Agent: IndiaClimateIntel/1.0
```
Returns: `{ name: "City Local Station", location: "City, State, Country", code: "MY-CIT-XX" }`

Has a 4-second timeout with AbortController. Falls back to coordinate-based naming if Nominatim fails.

---

## 9. Authentication System (src/context/AuthContext.tsx)

### How Auth Works
1. **Supabase Auth** — Attempts `signInWithOtp({ email })` on login, `signUp()` with a temporary password on register
2. **localStorage fallback** — Stores user in `ci_active_user` for instant session restoration
3. **User sync** — Every login/signup upserts the user to Supabase's `public."User"` table

### Auth Context Interface
```typescript
interface AuthContextType {
  user: User | null;           // Currently logged-in user (null = guest)
  role: UserRole;              // 'user' | 'admin'
  isLoading: boolean;
  login: (email, password?, name?) => Promise<boolean>;
  signUp: (name, email, phone?, dob?, role?) => Promise<boolean>;
  logout: () => void;
  resetPassword: (email) => Promise<{ success, message }>;
}
```

### Admin Detection
An email is auto-detected as admin if:
- It contains the word "admin" (case-insensitive)
- OR it equals `sarthak@climate-intel.in`

### Session Flow
1. On mount: Check Supabase `auth.getSession()` for an active session
2. If no Supabase session: Check `localStorage.ci_active_user`
3. If neither: User is `null` (guest mode, user-level access, no admin)

---

## 10. Component Architecture

### `page.tsx` — Main Page (Root Component)
- **State**: selectedStationId, activeTab, all data arrays, loading flags
- **Flow**:
  1. If no station selected: renders `<StationSelector>` full-page
  2. If station selected: renders `<Navigation>` sidebar + main content area with view routing
- **Data Loading**: `loadData()` fetches all entities via `ClimateDataService` in parallel
- **Station Selection**: `handleStationSelect(id)` saves to localStorage, fetches live Open-Meteo data, reloads all data

### `StationSelector.tsx` — Location Selection Screen (674 lines)
- **GPS Auto-Detect**: Uses `navigator.geolocation.getCurrentPosition()`, reverse geocodes, creates station via `ClimateDataService.addStation()`
- **City Search**: Debounced search input using Open-Meteo Geocoding API, dropdown results, click to create station
- **Manual Entry Modal**: Form for custom station name, location, latitude, longitude
- **Station Grid**: Displays pre-seeded Indian stations with themed gradient cards (CITY_META lookup)
- **Custom Stations Section**: Shows user-added stations separately with delete option
- **Station Cards**: Show station name, code, lat/lon, status indicator, state/tagline

### `DashboardView.tsx` — Analytics Dashboard (589 lines)
- Fetches live weather via `fetchLiveWeatherFromOpenMeteo()` on mount and when station changes
- **Live Metrics Cards**: Temperature, Humidity, Wind Speed, Rainfall, UV Index, Pressure, Weather Condition
- **Heatwave Risk Panel**: Real-time risk assessment with explanation
- **Temperature Trend Chart**: Recharts AreaChart showing hourly temperatures
- **Precipitation Chart**: BarChart showing precipitation probability
- **7-Day Forecast**: Daily max/min temperatures and precipitation
- **Recent Observations Table**: Latest records for the selected station
- **Active Alerts**: Shows current alerts for the station

### `Navigation.tsx` — Sidebar (252 lines)
- Tabs: Dashboard, Weather Records, Predictions, Alerts, Reports, Feedback, Admin (admin only)
- Shows selected station info, change/refresh buttons
- Responsive: collapsible hamburger menu on mobile

### `AdminDashboardView.tsx` — Admin Panel
- **Station Management**: Add new stations, view all stations
- **User Management**: View users, change roles
- **Manual Observation Entry**: Add weather readings manually
- **System Statistics**: Total counts for stations, observations, alerts, etc.

### Other Views
- `WeatherRecordsView.tsx` — Filterable observation table
- `PredictionsView.tsx` — Heatwave predictions list with risk badges
- `AlertsView.tsx` — Alerts with status management (Resolve/Dismiss buttons)
- `ReportsView.tsx` — Report analysis listing
- `FeedbackView.tsx` — Submit new feedback + view all feedback
- `AuthModal.tsx` — Login/Signup/Reset Password modal with tab switching
- `RiskBadge.tsx` — Reusable colored badge for risk levels

---

## 11. Styling & Design System

### Tailwind Custom Colors (tailwind.config.ts)
```typescript
climate: {
  navy: "#0B1F33",      // Dark navy background
  ocean: "#1261A0",     // Primary action blue
  teal: "#0E7490",      // Secondary accent
  cyan: "#22B8CF",      // Highlight/accent
  bg: "#F8FAFC",        // Page background
  gray: "#E2E8F0",      // Borders
  dark: "#172033",      // Text primary
  muted: "#64748B",     // Text secondary
}
risk: {
  safe: "#16A34A",      // Green
  low: "#84CC16",       // Yellow-green
  moderate: "#FACC15",  // Yellow
  high: "#F97316",      // Orange
  extreme: "#DC2626",   // Red
  emergency: "#991B1B", // Dark red
}
```

### Custom Shadows
- `shadow-card` — Subtle card shadow
- `shadow-elevated` — Elevated card shadow

### CSS Risk Badge Classes (globals.css)
`.badge-risk-safe`, `.badge-risk-low`, `.badge-risk-moderate`, `.badge-risk-high`, `.badge-risk-extreme`, `.badge-risk-emergency`

### Font
Inter (Google Font) as primary, with system-ui fallback.

---

## 12. Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional (defaults to Open-Meteo public API)
NEXT_PUBLIC_OPEN_METEO_BASE_URL=https://api.open-meteo.com/v1/forecast
```

**Note**: The codebase has hardcoded fallback Supabase credentials in `client.ts` (line 19-20). The actual project's Supabase instance is at `https://zrvdlvqjayhewgvkyskl.supabase.co`.

---

## 13. Application Flow

```
User Opens App
       |
       v
   Load Data (8 default stations + any custom stations)
       |
       v
  +-------------------------------------+
  |  Station Selector (Full Page)       |
  |  +-----------------------------+    |
  |  | GPS Auto-Detect             |    |
  |  | Search Any City             |    |
  |  | Manual Coordinates          |    |
  |  +-----------------------------+    |
  |  | Your Saved Locations        |    |
  |  | (custom stations, delete)   |    |
  |  +-----------------------------+    |
  |  | Indian Observatories        |    |
  |  | (8 themed station cards)    |    |
  |  +-----------------------------+    |
  +-------------------------------------+
       | User clicks a station
       v
  Fetch Live Weather from Open-Meteo API
  (using station's lat/lon)
       |
       v
  Create WeatherObservation -> Derive Prediction + Alert + Report
       |
       v
  +---------------------------------------------+
  | Main Dashboard Layout                        |
  | +----------+  +--------------------------+  |
  | | Sidebar  |  | Content Area             |  |
  | | Nav      |  |                          |  |
  | |          |  | Dashboard (live metrics   |  |
  | | Dashboard|  |   + charts + risk)       |  |
  | | Records  |  |                          |  |
  | | Predict. |  | OR Records table         |  |
  | | Alerts   |  | OR Predictions list      |  |
  | | Reports  |  | OR Alerts management     |  |
  | | Feedback |  | OR Reports listing       |  |
  | | Admin*   |  | OR Feedback view         |  |
  | |          |  | OR Admin dashboard*      |  |
  | +----------+  +--------------------------+  |
  +---------------------------------------------+
```

---

## 14. API Endpoints Used

### Open-Meteo Forecast API
- **URL**: `https://api.open-meteo.com/v1/forecast`
- **Method**: GET
- **Auth**: None (free, open)
- **Params**: latitude, longitude, current/hourly/daily variable lists, timezone=auto
- **Rate Limit**: ~10,000 requests/day (generous)

### Open-Meteo Geocoding API
- **URL**: `https://geocoding-api.open-meteo.com/v1/search`
- **Method**: GET
- **Auth**: None
- **Params**: name (search query), count, language, format

### OpenStreetMap Nominatim
- **URL**: `https://nominatim.openstreetmap.org/reverse`
- **Method**: GET
- **Auth**: None (User-Agent header required: `IndiaClimateIntel/1.0`)
- **Rate Limit**: 1 request/second
- **Used for**: Reverse geocoding GPS coordinates to city/state/country names

### Supabase
- **URL**: From `NEXT_PUBLIC_SUPABASE_URL`
- **Auth**: Anon key via `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Operations**: SELECT, INSERT, UPDATE, UPSERT, DELETE on all tables
- **Auth API**: `supabase.auth.signInWithOtp()`, `supabase.auth.signUp()`, `supabase.auth.getSession()`, `supabase.auth.signOut()`, `supabase.auth.resetPasswordForEmail()`

---

## 15. Known Issues & Current State

### Issues to Be Aware Of
1. **Hardcoded Supabase credentials** — The Supabase URL and anon key are hardcoded as fallback defaults in `client.ts` (security concern for production)
2. **Data is mostly client-side** — Heavy reliance on localStorage means data is per-browser, not truly persisted across devices unless Supabase operations succeed
3. **Mock data initialization** — On first visit, random mock observations/predictions/alerts are generated. There's logic to purge old "New York" data from a previous version (`initializeMockData()`)
4. **Custom station `isCustom` flag** — This field exists only in TypeScript interfaces, not in the Supabase DB schema. Custom stations are tracked via `ci_user_custom_stations` in localStorage
5. **Auth is simplified** — Supabase OTP is attempted but failures are silently caught; the app falls back to localStorage-based session management
6. **Temporary password on signup** — `signUp()` uses `'TemporaryPassword123!'` as a placeholder password
7. **Admin detection is email-based** — Any email containing "admin" gets admin privileges (not secure for production)

### Recent Changes Made
1. Added `isCustom` and `createdBy` fields to `WeatherStation` interface
2. Created `geocoding.ts` service for location search and reverse geocoding
3. Enhanced `StationSelector.tsx` with GPS auto-detect, city search, and manual coordinate entry
4. Updated `ClimateDataService.getStations()` and `getLocations()` to merge user custom stations
5. Added `addStation()` and `deleteStation()` methods to `ClimateDataService`
6. The system now fetches **real weather data** for any location worldwide via Open-Meteo API

### What Works
- Real-time weather data for any lat/lon coordinate worldwide
- GPS-based location detection in browser
- City search with autocomplete (global)
- Manual lat/lon entry for custom locations
- Custom locations persist across sessions (localStorage)
- Heatwave risk calculation based on real temperature/humidity
- Recharts visualizations for hourly/daily forecasts
- User authentication (basic email-based)
- Admin dashboard for station and user management
- Supabase integration for persistent data storage

---

## 16. How to Run the Project

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

The app runs at `http://localhost:3000` by default.

---

## 17. Key Design Decisions

1. **Hybrid data persistence** — Supabase + localStorage ensures the app works even when Supabase is unreachable (offline-first approach)
2. **Open-Meteo over other weather APIs** — Chosen because it's free, requires no API key, has generous rate limits, and provides global coverage
3. **Client-side risk calculations** — Heatwave risk is computed in the browser using the `calculateHeatwaveRisk()` function rather than a backend ML model. This keeps the app serverless.
4. **Static exports** — The app is designed to work as a mostly-static Next.js app (no API routes). All data operations happen client-side.
5. **Tailwind CSS** — Used throughout for styling. Custom color tokens defined in `tailwind.config.ts`.
6. **Recharts** — Chosen for charting because it's React-native and integrates well with the component model.

---

## 18. File Size Reference

| File | Lines | Bytes |
|---|---|---|
| `src/lib/supabase/client.ts` | 751 | 28,937 |
| `src/components/StationSelector.tsx` | 674 | 31,459 |
| `src/components/DashboardView.tsx` | 589 | 28,552 |
| `src/components/AdminDashboardView.tsx` | ~450 | 18,822 |
| `src/components/AuthModal.tsx` | 298 | 13,209 |
| `src/app/page.tsx` | 313 | 12,563 |
| `src/components/Navigation.tsx` | 252 | 10,536 |
| `src/lib/services/openmeteo.ts` | 259 | 9,724 |
| `src/components/WeatherRecordsView.tsx` | ~250 | 9,865 |
| `src/components/ReportsView.tsx` | ~200 | 7,763 |
| `src/components/FeedbackView.tsx` | ~200 | 7,700 |
| `src/components/AlertsView.tsx` | ~200 | 7,684 |
| `src/components/PredictionsView.tsx` | ~180 | 7,096 |
| `src/lib/services/geocoding.ts` | 117 | 3,414 |
| `src/types/database.ts` | 108 | 2,313 |
| `src/context/AuthContext.tsx` | 234 | 7,025 |
| `supabase/schema.sql` | 171 | 9,319 |

---

*This document was generated on 2026-09-14 to facilitate project handover to Google Gemini. For the most up-to-date file contents, always refer to the actual source code.*
