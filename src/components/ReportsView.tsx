'use client';

import React, { useState } from 'react';
import { ReportAnalysis } from '@/types/database';
import { FileText, Search, Printer, Calendar, CheckCircle2, ChevronRight, X, SlidersHorizontal } from 'lucide-react';

interface ReportsViewProps {
  reports: ReportAnalysis[];
  selectedStationId?: number;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ reports, selectedStationId }) => {
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState<ReportAnalysis | null>(null);

  const stationReports = selectedStationId
    ? reports.filter((r) => Number(r.Weather_Observation?.Station_ID) === Number(selectedStationId))
    : reports;

  const filtered = stationReports.filter(
    (r) =>
      r.Report_Type.toLowerCase().includes(search.toLowerCase()) ||
      r.Criteria.toLowerCase().includes(search.toLowerCase()) ||
      r.Description.toLowerCase().includes(search.toLowerCase()) ||
      r.R_ID.toString().includes(search)
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 font-display">
            <FileText className="w-5 h-5 text-teal-600" /> Historical Climate Reports &amp; Analysis
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Automated Evaluation Logs (Table: <code className="text-teal-700 font-mono font-semibold">Report_Analysis</code>)
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search report criteria or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-slate-800 transition-all"
          />
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-200/90 text-slate-400">
            No report analysis records found matching "{search}".
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.R_ID}
              className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-card nature-card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <span className="text-[11px] font-mono font-bold bg-teal-50 text-teal-800 border border-teal-200 px-2 py-0.5 rounded-full">
                    REPORT #{r.R_ID}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3 text-slate-400" /> {new Date(r.Generated_At).toLocaleString()}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 mb-2 font-display">{r.Report_Type}</h4>

                <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100 mb-3">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1 font-display">Evaluation Criteria</span>
                  <p className="text-xs font-mono text-slate-700">{r.Criteria}</p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{r.Description}</p>
              </div>

              <div className="pt-3.5 border-t border-slate-100 mt-4 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-mono">Linked Obs: #{r.Obs_ID}</span>
                <button
                  onClick={() => setSelectedReport(r)}
                  className="text-xs text-teal-700 font-bold hover:text-slate-900 flex items-center gap-1 btn-press cursor-pointer"
                >
                  View Analysis <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Detailed Report View */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-climate-navy text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-cyan-300" />
                <div>
                  <h3 className="font-bold text-base">Climate Analysis Report #{selectedReport.R_ID}</h3>
                  <p className="text-xs text-slate-300">{new Date(selectedReport.Generated_At).toLocaleString()}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-800">
              <div className="border-b pb-3">
                <span className="text-slate-400 font-semibold uppercase tracking-wider block text-[10px]">Report Classification</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedReport.Report_Type}</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px]">Technical Criteria Evaluated</span>
                <p className="font-mono text-slate-800 font-bold">{selectedReport.Criteria}</p>
              </div>

              <div>
                <span className="text-slate-500 font-semibold uppercase tracking-wider block text-[10px] mb-1">Detailed Findings & Impact Assessment</span>
                <p className="text-slate-700 text-xs leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                  {selectedReport.Description}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-slate-500 text-[11px]">
                <span>Source Observation: #{selectedReport.Obs_ID}</span>
                <span>System Verified</span>
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-4 rounded-lg text-xs flex items-center gap-2 shadow"
              >
                <Printer className="w-4 h-4 text-cyan-300" /> Print Formal Report
              </button>
              <button
                onClick={() => setSelectedReport(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-lg text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
