'use client';

import React, { useState } from 'react';
import { Alert, RiskLevel } from '@/types/database';
import { useAuth } from '@/context/AuthContext';
import { RiskBadge } from '@/components/RiskBadge';
import { ClimateDataService } from '@/lib/supabase/client';
import { Siren, ShieldAlert, CheckCircle, XCircle, Filter, AlertTriangle, BellRing } from 'lucide-react';

interface AlertsViewProps {
  alerts: Alert[];
  onAlertUpdated: () => void;
  selectedStationId?: number;
}

export const AlertsView: React.FC<AlertsViewProps> = ({ alerts, onAlertUpdated, selectedStationId }) => {
  const { role } = useAuth();
  const [severityFilter, setSeverityFilter] = useState<RiskLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Resolved' | 'Dismissed'>('Active');

  const stationAlerts = selectedStationId
    ? alerts.filter((a) => Number(a.Weather_Observation?.Station_ID || a.Heatwave_Prediction?.Station_ID) === Number(selectedStationId))
    : alerts;

  const filtered = stationAlerts.filter((a) => {
    const matchesSev = severityFilter === 'all' || a.Severity_level === severityFilter;
    const matchesStat = statusFilter === 'all' || a.Status === statusFilter;
    return matchesSev && matchesStat;
  });

  const handleStatusChange = async (alertId: number, newStatus: 'Active' | 'Resolved' | 'Dismissed') => {
    await ClimateDataService.updateAlertStatus(alertId, newStatus);
    onAlertUpdated();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-climate-navy to-slate-900 p-6 rounded-2xl border border-slate-800/80 text-white shadow-elevated flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Siren className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight font-display">Early-Warning Alert Management Center</h2>
          </div>
          <p className="text-xs text-slate-300">
            Real-Time Broadcast & Warning System (Table: <code className="text-teal-300 font-mono">Alert</code>)
          </p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-2">
          {(['Active', 'Resolved', 'Dismissed', 'all'] as const).map((stat) => (
            <button
              key={stat}
              onClick={() => setStatusFilter(stat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all btn-press ${
                statusFilter === stat
                  ? 'bg-teal-600 text-white border-teal-400 shadow-sm'
                  : 'bg-slate-800/90 text-slate-300 border-slate-700 hover:bg-slate-750'
              }`}
            >
              {stat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Severity Filter Sub-Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-card flex items-center justify-between gap-2 overflow-x-auto">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 shrink-0 font-display">
          <Filter className="w-3.5 h-3.5 text-teal-600" /> Severity Filter:
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {['all', 'Safe', 'Low', 'Moderate', 'High', 'Extreme', 'Emergency'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSeverityFilter(lvl as any)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all btn-press ${
                severityFilter === lvl
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Items List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200/90 text-slate-400">
            <BellRing className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            No warning alerts found matching selected filter criteria.
          </div>
        ) : (
          filtered.map((alert) => {
            const isEmergency = alert.Severity_level === 'Emergency' || alert.Severity_level === 'Extreme';
            return (
              <div
                key={alert.Alert_ID}
                className={`p-5 rounded-2xl border transition-all shadow-card nature-card-hover flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isEmergency ? 'bg-rose-50/60 border-rose-200 hover:border-rose-300' : 'bg-white border-slate-200/90 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    isEmergency ? 'bg-rose-600 text-white shadow-md' : 'bg-amber-100 text-amber-800 border border-amber-200'
                  }`}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900">ALERT #{alert.Alert_ID}</span>
                      <RiskBadge level={alert.Severity_level} size="sm" />
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        alert.Status === 'Active' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        Status: {alert.Status}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-800 leading-relaxed font-display">{alert.Alert_msg}</p>

                    <div className="flex items-center gap-4 text-xs text-slate-500 mt-2 font-mono">
                      <span>Linked Prediction: #{alert.Pre_ID || 'N/A'}</span>
                      <span>Linked Observation: #{alert.Obs_ID || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Admin Status Controls */}
                {role === 'admin' && alert.Status === 'Active' && (
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 w-full md:w-auto">
                    <button
                      onClick={() => handleStatusChange(alert.Alert_ID, 'Resolved')}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm flex items-center justify-center gap-1.5 transition-colors btn-press cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" /> Resolve Alert
                    </button>
                    <button
                      onClick={() => handleStatusChange(alert.Alert_ID, 'Dismissed')}
                      className="flex-1 md:flex-none px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors btn-press cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Dismiss
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
