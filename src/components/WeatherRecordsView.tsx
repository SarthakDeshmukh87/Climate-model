'use client';

import React, { useState } from 'react';
import { WeatherObservation, WeatherStation } from '@/types/database';
import { Database, Search, Filter, Download, Calendar, Thermometer, Droplets, Wind, ArrowUpDown } from 'lucide-react';

interface WeatherRecordsViewProps {
  observations: WeatherObservation[];
  stations: WeatherStation[];
  selectedStationId?: number;
}

export const WeatherRecordsView: React.FC<WeatherRecordsViewProps> = ({ observations, stations, selectedStationId }) => {
  const [search, setSearch] = useState('');
  const [stationFilter, setStationFilter] = useState<number | 'all'>(selectedStationId || 'all');
  const [sortField, setSortField] = useState<'Recorded_At' | 'Temperature' | 'Humidity'>('Recorded_At');
  const [sortAsc, setSortAsc] = useState(false);

  React.useEffect(() => {
    if (selectedStationId) setStationFilter(selectedStationId);
  }, [selectedStationId]);

  // Filter logic
  const filtered = observations.filter((obs) => {
    const matchesStation = stationFilter === 'all' || Number(obs.Station_ID) === Number(stationFilter);
    const stationName = obs.Weather_Station?.Station_Name || '';
    const stationCode = obs.Weather_Station?.Station_Code || '';
    const matchesSearch =
      stationName.toLowerCase().includes(search.toLowerCase()) ||
      stationCode.toLowerCase().includes(search.toLowerCase()) ||
      obs.Obs_ID.toString().includes(search);
    return matchesStation && matchesSearch;
  });

  // Sort logic
  const sorted = [...filtered].sort((a, b) => {
    let valA: any = a[sortField];
    let valB: any = b[sortField];
    if (sortField === 'Recorded_At') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    }
    if (valA < valB) return sortAsc ? -1 : 1;
    if (valA > valB) return sortAsc ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: 'Recorded_At' | 'Temperature' | 'Humidity') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Obs_ID', 'Station_Code', 'Station_Name', 'Recorded_At', 'Temperature_C', 'Humidity_Pct', 'Rainfall_mm', 'Wind_Speed_kmh'];
    const rows = sorted.map(o => [
      o.Obs_ID,
      `"${o.Weather_Station?.Station_Code || ''}"`,
      `"${o.Weather_Station?.Station_Name || ''}"`,
      `"${new Date(o.Recorded_At).toLocaleString()}"`,
      o.Temperature,
      o.Humidity,
      o.Rainfall,
      o.Wind_Speed,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Weather_Observations_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
            <Database className="w-5 h-5 text-teal-600" /> Weather Observations Database
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Historical climate records collected across active sensor networks (Table: <code className="text-teal-700 font-mono font-semibold">Weather_Observation</code>)
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-slate-900 hover:bg-slate-800 text-teal-300 border border-teal-500/30 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all self-start md:self-auto btn-press cursor-pointer"
        >
          <Download className="w-4 h-4 text-teal-400" /> Export CSV Data
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card flex flex-col sm:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search observation ID, station code, or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
          />
        </div>

        {/* Station Filter */}
        <div className="w-full sm:w-64">
          <select
            value={stationFilter}
            onChange={(e) => setStationFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="all">All Monitoring Stations</option>
            {stations.map((s) => (
              <option key={s.Station_ID} value={s.Station_ID}>
                {s.Station_Code} - {s.Station_Name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Observation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Obs ID</th>
                <th className="py-3.5 px-4">Station</th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('Recorded_At')}>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" /> Recorded At <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('Temperature')}>
                  <div className="flex items-center gap-1">
                    <Thermometer className="w-3.5 h-3.5 text-orange-500" /> Temperature <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4 cursor-pointer hover:text-slate-900" onClick={() => toggleSort('Humidity')}>
                  <div className="flex items-center gap-1">
                    <Droplets className="w-3.5 h-3.5 text-blue-500" /> Humidity <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Rainfall (mm)</th>
                <th className="py-3.5 px-4">Wind Speed</th>
                <th className="py-3.5 px-4">Thermal Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sorted.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    No matching weather observations found.
                  </td>
                </tr>
              ) : (
                sorted.map((obs) => {
                  const isHot = obs.Temperature >= 38;
                  return (
                    <tr key={obs.Obs_ID} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">#{obs.Obs_ID}</td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">{obs.Weather_Station?.Station_Name || `Station #${obs.Station_ID}`}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{obs.Weather_Station?.Station_Code}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">{new Date(obs.Recorded_At).toLocaleString()}</td>
                      <td className="py-3 px-4 font-extrabold text-slate-900">
                        <span className={`inline-block px-2 py-0.5 rounded ${isHot ? 'bg-orange-100 text-orange-800 font-black' : 'text-slate-800'}`}>
                          {obs.Temperature}°C
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold">{obs.Humidity}%</td>
                      <td className="py-3 px-4">{obs.Rainfall} mm</td>
                      <td className="py-3 px-4">{obs.Wind_Speed} km/h</td>
                      <td className="py-3 px-4">
                        {obs.Temperature >= 40 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-200">EXTREME HEAT</span>
                        ) : obs.Temperature >= 35 ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">HIGH STRESS</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 font-sans">NORMAL</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
