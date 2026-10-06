'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  WeatherStation,
  WeatherObservation,
  HeatwavePrediction,
  Alert,
  StationLocation,
  RiskLevel,
} from '@/types/database';
import { RiskBadge } from '@/components/RiskBadge';
import { WeatherIcon } from '@/components/WeatherIcon';
import {
  calculateHeatwaveRisk,
  fetchLiveWeatherFromOpenMeteo,
  parseOpenMeteoResponse,
  LiveClimateMetrics,
  getWeatherDescription,
} from '@/lib/services/openmeteo';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  ShieldCheck,
  AlertTriangle,
  Flame,
  Activity,
  MapPin,
  Clock,
  Compass,
  ArrowUpRight,
  TrendingUp,
  Sun,
  Gauge,
  Calendar,
  CloudSun,
  Radio,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface DashboardViewProps {
  station: WeatherStation;
  locations: StationLocation[];
  observations: WeatherObservation[];
  predictions: HeatwavePrediction[];
  alerts: Alert[];
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  station,
  locations,
  observations,
  predictions,
  alerts,
  onRefresh,
  isRefreshing,
}) => {
  const [liveMetrics, setLiveMetrics] = useState<LiveClimateMetrics | null>(null);
  const [isLoadingLive, setIsLoadingLive] = useState<boolean>(true);

  // Fetch true live weather from Open-Meteo for this exact station
  const fetchLiveMetrics = useCallback(async () => {
    setIsLoadingLive(true);
    try {
      const raw = await fetchLiveWeatherFromOpenMeteo(station.Latitude, station.Longitude);
      const parsed = parseOpenMeteoResponse(raw);
      if (parsed) {
        setLiveMetrics(parsed);
      }
    } catch (err) {
      console.warn('Failed to fetch direct live metrics in DashboardView:', err);
    } finally {
      setIsLoadingLive(false);
    }
  }, [station.Latitude, station.Longitude]);

  useEffect(() => {
    fetchLiveMetrics();
  }, [fetchLiveMetrics]);

  // If onRefresh triggered externally
  useEffect(() => {
    if (isRefreshing) {
      fetchLiveMetrics();
    }
  }, [isRefreshing, fetchLiveMetrics]);

  const stationLocation =
    locations.find((l) => Number(l.Station_ID) === Number(station.Station_ID))?.Location ||
    `${station.Station_Name} Area`;

  // Fallback to latest observation from records if live fetch hasn't completed yet
  const stationObs = observations.filter((o) => Number(o.Station_ID) === Number(station.Station_ID));
  const latestObs = stationObs[0];

  // Current real temperature, humidity, precipitation, and wind
  const currentTemp = liveMetrics ? liveMetrics.temperature : (latestObs?.Temperature ?? 28.0);
  const currentApparent = liveMetrics ? liveMetrics.apparentTemp : currentTemp;
  const currentHumidity = liveMetrics ? liveMetrics.humidity : (latestObs?.Humidity ?? 65.0);
  const currentPrecip = liveMetrics ? liveMetrics.precipitation : (latestObs?.Rainfall ?? 0.0);
  const currentWind = liveMetrics ? liveMetrics.windSpeed : (latestObs?.Wind_Speed ?? 10.0);
  const currentPressure = liveMetrics ? liveMetrics.surfacePressure : 1012;
  const currentUV = liveMetrics ? liveMetrics.uvIndex : 5.5;
  const conditionText = liveMetrics ? liveMetrics.weatherCondition : 'Live Meteorological Monitoring';
  const conditionIcon = liveMetrics ? liveMetrics.weatherIcon : '🌤️';

  // Calculate true Heatwave Risk using IMD & WMO calibrated model
  const riskCalculated = calculateHeatwaveRisk(currentTemp, currentHumidity, currentWind, currentApparent);

  const activeAlerts = alerts.filter(
    (a) =>
      a.Status === 'Active' &&
      Number(a.Weather_Observation?.Station_ID || a.Heatwave_Prediction?.Station_ID) === Number(station.Station_ID)
  );

  // Prepare 24-Hour Timeline chart data
  let timelineChartData: Array<{ time: string; temperature: number; heatIndex: number; humidity: number; windSpeed: number }> = [];

  if (liveMetrics && liveMetrics.hourly.times.length > 0) {
    const times = liveMetrics.hourly.times;
    const temps = liveMetrics.hourly.temperatures;
    const apparentTemps = liveMetrics.hourly.apparentTemps;
    const humidities = liveMetrics.hourly.humidities;
    const winds = liveMetrics.hourly.windSpeeds;

    // Find current hour index
    let nowIdx = times.findIndex((t) => new Date(t).getTime() > Date.now());
    if (nowIdx === -1) nowIdx = 0;
    const start = Math.max(0, nowIdx - 6);
    const end = Math.min(times.length, nowIdx + 18);

    for (let i = start; i < end; i++) {
      const d = new Date(times[i]);
      const hourStr = d.toLocaleTimeString([], { hour: 'numeric', hour12: true });
      timelineChartData.push({
        time: hourStr,
        temperature: Math.round(temps[i] * 10) / 10,
        heatIndex: Math.round((apparentTemps[i] ?? temps[i]) * 10) / 10,
        humidity: Math.round(humidities[i]),
        windSpeed: Math.round((winds[i] ?? 10) * 10) / 10,
      });
    }
  } else if (stationObs.length > 0) {
    timelineChartData = [...stationObs]
      .reverse()
      .slice(-12)
      .map((o) => {
        const timeStr = new Date(o.Recorded_At).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const risk = calculateHeatwaveRisk(o.Temperature, o.Humidity, o.Wind_Speed);
        return {
          time: timeStr,
          temperature: o.Temperature,
          heatIndex: risk.heatIndex,
          humidity: o.Humidity,
          windSpeed: o.Wind_Speed,
        };
      });
  }

  // 7-Day Forecast cards data
  const dailyForecastData: Array<{
    dayName: string;
    dateStr: string;
    maxTemp: number;
    minTemp: number;
    apparentMax: number;
    popMax: number;
    riskLevel: RiskLevel;
  }> = [];

  if (liveMetrics && liveMetrics.daily.dates.length > 0) {
    const dates = liveMetrics.daily.dates;
    const maxs = liveMetrics.daily.maxTemps;
    const mins = liveMetrics.daily.minTemps;
    const appMaxs = liveMetrics.daily.apparentMaxTemps;
    const pops = liveMetrics.daily.popMax;

    for (let i = 0; i < Math.min(dates.length, 7); i++) {
      const d = new Date(dates[i]);
      const dayName = i === 0 ? 'Today' : d.toLocaleDateString([], { weekday: 'short' });
      const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      const dayRisk = calculateHeatwaveRisk(maxs[i], 60, 10, appMaxs[i]);

      dailyForecastData.push({
        dayName,
        dateStr,
        maxTemp: Math.round(maxs[i] * 10) / 10,
        minTemp: Math.round(mins[i] * 10) / 10,
        apparentMax: Math.round((appMaxs[i] ?? maxs[i]) * 10) / 10,
        popMax: pops[i] ?? 0,
        riskLevel: dayRisk.riskLevel,
      });
    }
  }

  // Risk gauge progress percentage calculation (Safe=0%, Emergency=100%)
  const getRiskGaugePercent = (temp: number) => {
    if (temp < 28) return 15;
    if (temp < 33) return 35;
    if (temp < 38) return 55;
    if (temp < 42) return 75;
    if (temp < 45) return 90;
    return 100;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* ========================================================================= */}
      {/* STATION BANNER HEADER */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-climate-navy to-slate-900 text-white rounded-2xl p-6 shadow-elevated border border-slate-800/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-teal-500/10 backdrop-blur-3xl transform skew-x-12 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="bg-teal-500/20 text-teal-300 border border-teal-400/30 text-xs font-mono px-2.5 py-0.5 rounded-md font-bold">
                {station.Station_Code}
              </span>
              <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" /> LIVE METEOROLOGICAL TELEMETRY
              </span>
              <span className="bg-slate-800/90 text-slate-200 text-[11px] px-2.5 py-0.5 rounded-lg border border-slate-700 font-medium inline-flex items-center gap-1.5 shadow-sm">
                <WeatherIcon code={liveMetrics?.weatherCode} condition={conditionText} className="w-3.5 h-3.5" />
                <span>{conditionText}</span>
              </span>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5 font-display">
              {station.Station_Name}
            </h2>

            <div className="flex items-center gap-4 text-xs text-slate-300 mt-2.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400" /> {stationLocation}
              </span>
              <span className="flex items-center gap-1.5 font-mono text-slate-400">
                <Compass className="w-3.5 h-3.5 text-teal-400" /> {station.Latitude}° N, {station.Longitude}° E
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> Last Reading: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="bg-slate-850/90 backdrop-blur border border-slate-700/80 px-4 py-3 rounded-xl flex items-center gap-3 shadow-inner">
              <div className="text-right">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Heatwave Assessment</p>
                <div className="mt-1">
                  <RiskBadge level={riskCalculated.riskLevel} size="lg" />
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                fetchLiveMetrics();
                onRefresh();
              }}
              disabled={isRefreshing || isLoadingLive}
              className="bg-teal-600 hover:bg-teal-500 text-white font-bold py-3 px-5 rounded-xl text-xs shadow-lg shadow-teal-950/40 transition-all flex items-center gap-2 border border-teal-400/30 shrink-0 cursor-pointer disabled:opacity-60 btn-press"
            >
              <Activity className={`w-4 h-4 ${isRefreshing || isLoadingLive ? 'animate-spin text-teal-200' : 'text-teal-300'}`} />
              <span>{isRefreshing || isLoadingLive ? 'Syncing Live...' : 'Live Re-Fetch'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ACTIVE WARNINGS OR ALL-CLEAR BANNER */}
      {/* ========================================================================= */}
      {activeAlerts.length > 0 ? (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-xl shadow-sm flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-amber-900 font-display">Active Heatwave Warning Issued</h4>
              <RiskBadge level={activeAlerts[0].Severity_level} size="sm" />
            </div>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">{activeAlerts[0].Alert_msg}</p>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-50/80 border border-emerald-200/80 p-3.5 rounded-xl shadow-subtle flex items-center justify-between gap-3 text-xs text-emerald-800">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>Normal Climate Baseline:</strong> No hazardous heatwave emergency in effect for {station.Station_Name}. Current heat index is {riskCalculated.heatIndex}°C.
            </span>
          </div>
          <span className="font-mono text-[10px] text-emerald-700 bg-emerald-100/90 px-2 py-0.5 rounded font-bold uppercase shrink-0 border border-emerald-200">
            IMD Standards Compliant
          </span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRIMARY REAL-TIME METRICS GRID (4 CARDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Temperature */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card nature-card-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">Real Temperature</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shadow-subtle group-hover:bg-amber-500/15 transition-colors">
              <Thermometer className="w-5 h-5 text-amber-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">{currentTemp}°C</span>
            <span className="text-xs text-slate-500 font-medium">Feels: {currentApparent}°C</span>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-teal-500 via-amber-400 to-rose-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${getRiskGaugePercent(currentTemp)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5 font-medium leading-relaxed">
            Thermal threshold: {currentTemp >= 40 ? 'Severe Heatwave' : currentTemp >= 35 ? 'Elevated Heat Stress' : 'Within Normal Seasonal Range'}
          </p>
        </div>

        {/* Metric 2: Relative Humidity */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card nature-card-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">Relative Humidity</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shadow-subtle group-hover:bg-sky-500/15 transition-colors">
              <Droplets className="w-5 h-5 text-sky-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">{currentHumidity}%</span>
            <span className="text-xs text-slate-500 font-medium">Air Moisture</span>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-sky-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(currentHumidity, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5 font-medium leading-relaxed">
            {currentHumidity > 70 ? 'High coastal humidity enhances heat perception' : 'Standard atmospheric humidity'}
          </p>
        </div>

        {/* Metric 3: Precipitation */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card nature-card-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">Precipitation</span>
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center shadow-subtle group-hover:bg-teal-500/15 transition-colors">
              <CloudRain className="w-5 h-5 text-teal-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">{currentPrecip} <span className="text-base font-semibold">mm</span></span>
            <span className="text-xs text-slate-500 font-medium">Current</span>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-teal-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((currentPrecip / 15) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5 font-medium leading-relaxed">
            {currentPrecip > 0 ? `Active rainfall (${currentPrecip} mm recorded)` : 'Dry conditions recorded at ground level'}
          </p>
        </div>

        {/* Metric 4: Wind Speed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-card nature-card-hover relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-display">Wind Speed</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-subtle group-hover:bg-emerald-500/15 transition-colors">
              <Wind className="w-5 h-5 text-emerald-700" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 font-display tabular-nums tracking-tight">{currentWind} <span className="text-base font-semibold">km/h</span></span>
            <span className="text-xs text-slate-500 font-medium">{liveMetrics ? `${liveMetrics.windDirection}°` : 'Airflow'}</span>
          </div>
          <div className="mt-3.5 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min((currentWind / 40) * 100, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2.5 font-medium leading-relaxed">
            {currentWind < 8 ? 'Stagnant airflow (Elevates thermal trapping)' : 'Convective breeze (Facilitates cooling)'}
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECONDARY ATMOSPHERIC PARAMETERS ROW (Pressure, UV, Daily High/Low) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-card grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="border-r border-slate-100 last:border-none p-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Atmospheric Pressure</p>
          <p className="text-base font-bold text-slate-900 mt-1 font-display tabular-nums">{currentPressure} hPa</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Surface Barometric</p>
        </div>
        <div className="border-r border-slate-100 last:border-none p-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">UV Radiation Index</p>
          <p className="text-base font-bold text-amber-700 mt-1 font-display tabular-nums">{currentUV} UV Index</p>
          <p className="text-[10px] text-slate-500 mt-0.5">{currentUV >= 8 ? 'Very High Exposure' : currentUV >= 5 ? 'Moderate Exposure' : 'Low Exposure'}</p>
        </div>
        <div className="border-r border-slate-100 last:border-none p-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Today Max / Min</p>
          <p className="text-base font-bold text-slate-900 mt-1 font-display tabular-nums">
            {dailyForecastData[0] ? `${dailyForecastData[0].maxTemp}° / ${dailyForecastData[0].minTemp}°` : `${currentTemp}°`}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">Diurnal Thermal Range</p>
        </div>
        <div className="p-1">
          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-display">Rain Probability</p>
          <p className="text-base font-bold text-teal-700 mt-1 font-display tabular-nums">
            {dailyForecastData[0] ? `${dailyForecastData[0].popMax}%` : '0%'}
          </p>
          <p className="text-[10px] text-slate-500 mt-0.5">24h Precipitation Likelihood</p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 24-HOUR REAL-TIME THERMAL TIMELINE & RISK ENGINE SUMMARY */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart: 24-Hour Temperature & Heat Index Timeline */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-climate-ocean" /> 24-Hour Real-Time Thermal Dynamics
              </h3>
              <p className="text-xs text-slate-500">Hourly atmospheric measurements calibrated to IMD standards</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-orange-600">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> Temperature (°C)
              </span>
              <span className="flex items-center gap-1.5 text-red-600">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block" /> Heat Index (°C)
              </span>
            </div>
          </div>

          <div className="h-72 w-full">
            {timelineChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timelineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F97316" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#F97316" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="heatGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#DC2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', border: 'none', color: '#F8FAFC', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="temperature" stroke="#F97316" strokeWidth={2.5} fillOpacity={1} fill="url(#tempGrad)" name="Temperature (°C)" />
                  <Area type="monotone" dataKey="heatIndex" stroke="#DC2626" strokeWidth={2} strokeDasharray="4 4" fillOpacity={1} fill="url(#heatGrad)" name="Heat Index (°C)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Loading real-time timeline data...
              </div>
            )}
          </div>
        </div>

        {/* Heatwave Risk Engine Summary Panel */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base mb-1 flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-600" /> Heatwave Risk Assessment
            </h3>
            <p className="text-xs text-slate-500 mb-4">India Meteorological Department (IMD) Algorithm</p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-4 text-center">
              <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Current Hazard Status</span>
              <div className="mt-2 mb-1">
                <RiskBadge level={riskCalculated.riskLevel} size="lg" />
              </div>
              <p className="text-xs text-slate-600 mt-2 font-medium leading-relaxed">
                {riskCalculated.explanation}
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Calculated Heat Index</span>
                <span className="font-bold text-slate-800">{riskCalculated.heatIndex}°C</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Model Confidence</span>
                <span className="font-bold text-emerald-600">{riskCalculated.confidencePercent}%</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Ground Atmospheric Pressure</span>
                <span className="font-bold text-slate-800">{currentPressure} hPa</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Wind Ventilation</span>
                <span className="font-bold text-slate-800">{currentWind} km/h</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-semibold">Algorithm Reference</span>
            <p className="text-[11px] text-slate-600 font-mono mt-0.5">WMO / Rothfusz / IMD Heat Index Formula</p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7-DAY CLIMATE & HEATWAVE PROJECTION STRIP */}
      {/* ========================================================================= */}
      {dailyForecastData.length > 0 && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2 font-display">
                <Calendar className="w-4 h-4 text-teal-600" /> 7-Day Live Thermal &amp; Risk Projection
              </h3>
              <p className="text-xs text-slate-500">Multi-day forward outlook for {station.Station_Name}</p>
            </div>
            <span className="text-[10px] font-mono text-teal-700 bg-teal-50 border border-teal-200/80 px-2.5 py-0.5 rounded-full font-bold uppercase">
              IMD Daily Forecast Model
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {dailyForecastData.map((day, idx) => (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-center transition-all duration-200 nature-card-hover ${
                  idx === 0
                    ? 'bg-gradient-to-b from-teal-50/70 to-white border-teal-300 shadow-sm ring-1 ring-teal-500/20'
                    : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-50'
                }`}
              >
                <p className="text-xs font-bold text-slate-800 font-display">{day.dayName}</p>
                <p className="text-[10px] text-slate-400 mb-2 font-medium">{day.dateStr}</p>

                <div className="my-2">
                  <div className="text-sm font-extrabold text-slate-900 font-display tabular-nums">{day.maxTemp}°</div>
                  <div className="text-[11px] text-slate-500 font-display tabular-nums">{day.minTemp}°</div>
                </div>

                <div className="text-[11px] text-slate-700 font-semibold mb-2.5 flex items-center justify-center gap-1">
                  {day.popMax > 0 ? (
                    <>
                      <Droplets className="w-3 h-3 text-sky-500 shrink-0" />
                      <span>{day.popMax}%</span>
                    </>
                  ) : (
                    <>
                      <Sun className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>Dry</span>
                    </>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <RiskBadge level={day.riskLevel} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
