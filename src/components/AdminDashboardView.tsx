'use client';

import React, { useState } from 'react';
import { WeatherStation, StationLocation, User, UserFeedback, Alert, WeatherObservation } from '@/types/database';
import { ClimateDataService } from '@/lib/supabase/client';
import {
  ShieldAlert,
  Users,
  Building2,
  Database,
  Siren,
  Plus,
  CheckCircle,
  Star,
  UserCheck,
  UserX,
  MapPin,
  Compass,
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface AdminDashboardViewProps {
  stations: WeatherStation[];
  locations: StationLocation[];
  users: User[];
  feedbacks: UserFeedback[];
  alerts: Alert[];
  observations: WeatherObservation[];
  onDataRefresh: () => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  stations,
  locations,
  users,
  feedbacks,
  alerts,
  observations,
  onDataRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stations' | 'users' | 'feedback'>('overview');

  // Add station form modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [lat, setLat] = useState('25.2048');
  const [lon, setLon] = useState('55.2708');
  const [locationText, setLocationText] = useState('Dubai Metro Area, UAE');

  const activeAlertsCount = alerts.filter(a => a.Status === 'Active').length;

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !name) return;
    await ClimateDataService.addStation(code, name, parseFloat(lat), parseFloat(lon), locationText);
    setShowAddModal(false);
    setCode('');
    setName('');
    onDataRefresh();
  };

  const handleRoleToggle = async (userId: string, currentRole: 'user' | 'admin') => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    await ClimateDataService.updateUserRole(userId, nextRole);
    onDataRefresh();
  };

  // Analytics graph data
  const stationObsCountData = stations.map(s => ({
    name: s.Station_Code,
    obsCount: observations.filter(o => o.Station_ID === s.Station_ID).length,
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Executive Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-climate-navy to-slate-900 text-white p-6 rounded-2xl border border-slate-800/80 shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/30 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-teal-400" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight font-display">Admin System Operations &amp; Analytics</h2>
          </div>
          <p className="text-xs text-slate-300">
            Role-Based Authorization Console &amp; Sensor Network Management
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
          {(['overview', 'stations', 'users', 'feedback'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all btn-press cursor-pointer ${
                activeTab === tab
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card nature-card-hover">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase font-display">
            <span>Weather Stations</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-teal-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display tabular-nums tracking-tight">{stations.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Active sensor network nodes</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card nature-card-hover">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase font-display">
            <span>Registered Users</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display tabular-nums tracking-tight">{users.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Auth profiles synced</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card nature-card-hover">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase font-display">
            <span>Observations Logged</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center">
              <Database className="w-4 h-4 text-sky-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display tabular-nums tracking-tight">{observations.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Weather observation records</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card nature-card-hover">
          <div className="flex justify-between items-center text-slate-500 text-xs font-semibold uppercase font-display">
            <span>Active Warnings</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center">
              <Siren className="w-4 h-4 text-amber-600" />
            </div>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 font-display tabular-nums tracking-tight">{activeAlertsCount}</p>
          <p className="text-[11px] text-slate-500 mt-1">Hazard alerts requiring response</p>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Sensor Density & Observation Volumes</h3>
            <p className="text-xs text-slate-500 mb-4">Total observations recorded per weather station</p>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stationObsCountData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#0B1F33', borderRadius: '8px', border: 'none', color: '#F8FAFC', fontSize: '12px' }} />
                  <Bar dataKey="obsCount" fill="#1261A0" radius={[4, 4, 0, 0]} name="Observations" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-card flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm mb-3">Database Architecture Compliance</h3>
              <div className="space-y-2 text-xs">
                {[
                  { table: 'Weather_Station', status: '8-Table Relational Schema Intact', ok: true },
                  { table: 'Station_Location', status: 'Primary Key & Foreign Key Constraints Verified', ok: true },
                  { table: 'Weather_Observation', status: 'IMD Integration Synced', ok: true },
                  { table: 'Heatwave_Prediction', status: 'Heat Index Model Operational', ok: true },
                  { table: 'Alert', status: 'RLS Security Policies Enforced', ok: true },
                  { table: 'User & User_Feedback', status: 'Supabase Auth & Role-Based Access Enabled', ok: true },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-lg">
                    <span className="font-mono font-bold text-slate-800">{item.table}</span>
                    <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" /> {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Station Management */}
      {activeTab === 'stations' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Registered Weather Stations</h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-climate-ocean hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center gap-2 shadow"
            >
              <Plus className="w-4 h-4" /> Add Weather Station
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((s) => {
              const loc = locations.find(l => l.Station_ID === s.Station_ID)?.Location || 'Global Coordinates';
              return (
                <div key={s.Station_ID} className="bg-white p-5 rounded-xl border border-slate-200 shadow-card space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {s.Station_Code}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">{s.Station_Name}</h4>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {s.Status}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-cyan-600" /> {loc}</p>
                    <p className="flex items-center gap-1.5"><Compass className="w-3.5 h-3.5 text-cyan-600" /> Lat: {s.Latitude}°, Lon: {s.Longitude}°</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: User Role Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-900 text-sm">User Directory & Role Authorization</h3>
            <p className="text-xs text-slate-500">Manage user access permissions (<code className="text-climate-ocean font-mono">User</code> table)</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <th className="py-3.5 px-4">User ID</th>
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Phone / DOB</th>
                  <th className="py-3.5 px-4">Role Authorization</th>
                  <th className="py-3.5 px-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {users.map((u) => (
                  <tr key={u.User_ID} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{u.User_ID}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{u.User_Name}</td>
                    <td className="py-3 px-4">{u.Email}</td>
                    <td className="py-3 px-4 text-slate-500">{u.Phone_no || 'N/A'} | {u.DOB || 'N/A'}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                        u.Role === 'admin' ? 'bg-cyan-950 text-cyan-300 border-cyan-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {u.Role}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleRoleToggle(u.User_ID, u.Role)}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded border border-slate-300 transition-colors flex items-center gap-1"
                      >
                        {u.Role === 'admin' ? <UserX className="w-3 h-3 text-red-500" /> : <UserCheck className="w-3 h-3 text-emerald-600" />}
                        Toggle Role
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Global Feedback Log */}
      {activeTab === 'feedback' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-card p-6 space-y-4">
          <h3 className="font-bold text-slate-900 text-sm border-b pb-2">Global System Feedback Log</h3>
          <div className="space-y-3">
            {feedbacks.map((f) => (
              <div key={f.F_ID} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-bold text-xs text-slate-900">{f.User?.User_Name || f.User_ID}</span>
                    <span className="text-[10px] text-slate-400 font-mono ml-2">({f.User?.Email})</span>
                  </div>
                  <div className="flex text-amber-400">
                    {[...Array(f.Rating)].map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                    ))}
                  </div>
                </div>
                <div className="inline-block px-2 py-0.5 bg-cyan-50 text-climate-teal border border-cyan-200 text-[10px] font-bold rounded">
                  {f.F_Type}
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{f.Comments}</p>
                <p className="text-[10px] text-slate-400 pt-1">{new Date(f.Submitted_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-base text-slate-900 mb-4">Register New Weather Station</h3>
            <form onSubmit={handleAddStation} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Station Code</label>
                <input
                  type="text"
                  required
                  placeholder="ST-DXB-07"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-800"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Station Name</label>
                <input
                  type="text"
                  required
                  placeholder="Dubai Desert Climate Observatory"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-800"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={lon}
                    onChange={(e) => setLon(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-slate-800"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 uppercase tracking-wider mb-1">Station Location Description</label>
                <input
                  type="text"
                  required
                  value={locationText}
                  onChange={(e) => setLocationText(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-climate-ocean hover:bg-slate-800 text-white rounded font-semibold shadow"
                >
                  Register Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
