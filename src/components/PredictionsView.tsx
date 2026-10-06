'use client';

import React, { useState } from 'react';
import { HeatwavePrediction, RiskLevel, WeatherStation } from '@/types/database';
import { RiskBadge } from '@/components/RiskBadge';
import { TrendingUp, Filter, Calendar, Thermometer, ShieldCheck, Flame, Percent } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface PredictionsViewProps {
  predictions: HeatwavePrediction[];
  stations: WeatherStation[];
  selectedStationId?: number;
}

export const PredictionsView: React.FC<PredictionsViewProps> = ({ predictions, stations, selectedStationId }) => {
  const [riskFilter, setRiskFilter] = useState<RiskLevel | 'all'>('all');

  const stationPredictions = selectedStationId
    ? predictions.filter((p) => Number(p.Station_ID) === Number(selectedStationId))
    : predictions;

  const filtered = stationPredictions.filter(
    (p) => riskFilter === 'all' || p.Risk_level === riskFilter
  );

  const chartData = stationPredictions.map((p) => ({
    name: p.Weather_Station?.Station_Code || `ST-${p.Station_ID}`,
    temp: p.Pre_Temp,
    confidence: p.Confidence_Percent,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
            <TrendingUp className="w-5 h-5 text-teal-600" /> Heatwave Prediction &amp; Risk Analytics
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Machine Learning Predictive Engine Output (Table: <code className="text-teal-700 font-mono font-semibold">Heatwave_Prediction</code>)
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-400 mr-1 flex items-center gap-1 font-display">
            <Filter className="w-3.5 h-3.5 text-teal-600" /> Risk Level:
          </span>
          {['all', 'Safe', 'Low', 'Moderate', 'High', 'Extreme', 'Emergency'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setRiskFilter(lvl as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all btn-press ${
                riskFilter === lvl
                  ? 'bg-slate-900 text-teal-300 border-slate-900 shadow-sm font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card">
        <h3 className="font-bold text-slate-900 text-sm mb-1 flex items-center gap-2 font-display">
          <Percent className="w-4 h-4 text-teal-600" /> Model Confidence % &amp; Predicted Target Temperatures
        </h3>
        <p className="text-xs text-slate-500 mb-4">Forecasting precision across station sensor locations</p>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0A192F', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)', color: '#F8FAFC', fontSize: '12px' }}
              />
              <Bar dataKey="temp" fill="#EA580C" name="Predicted Temp (°C)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="confidence" fill="#0D9488" name="Confidence (%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Predictions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-10 text-center rounded-2xl border border-slate-200/90 text-slate-400">
            No heatwave predictions found matching risk filter "{riskFilter}".
          </div>
        ) : (
          filtered.map((p) => (
            <div
              key={p.Pre_ID}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card nature-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                    PRE #{p.Pre_ID}
                  </span>
                  <RiskBadge level={p.Risk_level} size="sm" />
                </div>

                <h4 className="font-bold text-sm text-slate-900 mb-1 font-display">
                  {p.Weather_Station?.Station_Name || `Station #${p.Station_ID}`}
                </h4>
                <p className="text-xs text-slate-500 mb-4 font-mono">{p.Weather_Station?.Station_Code}</p>

                <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-100 space-y-2.5 mb-3.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Thermometer className="w-3.5 h-3.5 text-amber-600" /> Target Temp
                    </span>
                    <span className="font-extrabold text-amber-700 text-base font-display tabular-nums">{p.Pre_Temp}°C</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" /> Target Date
                    </span>
                    <span className="font-semibold text-slate-800">{new Date(p.Target_Data).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Model Confidence
                    </span>
                    <span className="font-bold text-teal-700 font-display tabular-nums">{p.Confidence_Percent}%</span>
                  </div>
                </div>
              </div>

              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${p.Confidence_Percent}%` }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
