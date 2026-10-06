# 🌡️ Climate Intelligence

> **Heatwave Monitoring, Prediction & Early Warning System**

A professional, full-stack climate intelligence web application for real-time heatwave monitoring, AI-driven risk prediction, and automated emergency alerting.

Built with **Next.js 14 · TypeScript · Tailwind CSS · Supabase · Open-Meteo API**.

---

## ✨ Features

- 📡 **Live Weather Monitoring** — Real-time temperature, humidity, rainfall & wind data from weather stations via Open-Meteo API
- 🔥 **Heatwave Risk Prediction** — ML-inspired risk scoring (Safe → Emergency) with confidence percentages
- 🚨 **Automated Alert System** — Severity-tiered alerts linked to observations and predictions
- 📊 **Interactive Dashboards** — Recharts-powered visualisations with responsive charts
- 📋 **Report Analysis** — Auto-generated climate reports with criteria-based classification
- 👤 **User Management & Auth** — Supabase Auth with role-based access (Admin, Analyst, Viewer)
- 💬 **User Feedback** — In-app feedback and rating system

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 14](https://nextjs.org/) (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database | [Supabase](https://supabase.com/) (PostgreSQL) |
| Auth | Supabase Auth (SSR) |
| Weather API | [Open-Meteo](https://open-meteo.com/) (free, no key needed) |
| Charts | [Recharts](https://recharts.org/) |
| Icons | [Lucide React](https://lucide.dev/) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- A free [Supabase](https://supabase.com/) project

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd climate-model
npm install
```

### 2. Configure Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous (public) key |
| `NEXT_PUBLIC_OPEN_METEO_BASE_URL` | Open-Meteo API base URL (already set in example) |

> **⚠️ Never commit `.env.local`** — it is listed in `.gitignore`.

### 3. Set Up the Database

Open your [Supabase SQL Editor](https://app.supabase.com/) and paste the contents of [`supabase/schema.sql`](supabase/schema.sql) to create all tables, relationships, and RLS policies.

### 4. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Schema

The relational model maps directly to the ERD:

| Table | Primary Key | Foreign Keys |
|---|---|---|
| `Weather_Station` | `Station_ID` | — |
| `Station_Location` | (`Station_ID`, `Location`) | `Station_ID` → `Weather_Station` |
| `Weather_Observation` | `Obs_ID` | `Station_ID` → `Weather_Station` |
| `Report_Analysis` | `R_ID` | `Obs_ID` → `Weather_Observation` |
| `Heatwave_Prediction` | `Pre_ID` | `Station_ID` → `Weather_Station` |
| `Alert` | `Alert_ID` | `Pre_ID` → `Heatwave_Prediction`, `Obs_ID` → `Weather_Observation` |
| `User` | `User_ID` | `auth.users(id)` |
| `User_Feedback` | `F_ID` | `User_ID` → `User` |

---

## 🎨 Design System

**Primary Palette**

| Token | Hex | Usage |
|---|---|---|
| Deep Navy | `#0B1F33` | Sidebar & headers |
| Ocean Blue | `#1261A0` | Primary actions |
| Climate Teal | `#0E7490` | Data visualisations |
| Cyan | `#22B8CF` | Badges & highlights |

**Heatwave Risk Levels**

| Level | Colour |
|---|---|
| Safe | `#16A34A` |
| Low | `#84CC16` |
| Moderate | `#FACC15` |
| High | `#F97316` |
| Extreme | `#DC2626` |
| Emergency | `#991B1B` |

---

## 📁 Project Structure

```
src/
├── app/                  # Next.js App Router pages & layouts
│   ├── layout.tsx
│   └── page.tsx
├── components/           # Reusable UI components
│   ├── Dashboard.tsx
│   ├── AlertsView.tsx
│   ├── PredictionsView.tsx
│   ├── ReportsView.tsx
│   └── ...
└── lib/                  # Supabase client, helpers
supabase/
└── schema.sql            # Full DDL — run this in Supabase SQL Editor
```

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## 📄 License

This project is for academic/educational purposes.
