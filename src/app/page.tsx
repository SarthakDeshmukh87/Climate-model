'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ClimateDataService } from '@/lib/supabase/client';
import { Navigation, NavTab } from '@/components/Navigation';
import { DashboardView } from '@/components/DashboardView';
import { WeatherRecordsView } from '@/components/WeatherRecordsView';
import { PredictionsView } from '@/components/PredictionsView';
import { AlertsView } from '@/components/AlertsView';
import { ReportsView } from '@/components/ReportsView';
import { FeedbackView } from '@/components/FeedbackView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { AuthModal } from '@/components/AuthModal';
import { StationSelector } from '@/components/StationSelector';
import {
  WeatherStation,
  StationLocation,
  WeatherObservation,
  HeatwavePrediction,
  Alert,
  ReportAnalysis,
  User,
  UserFeedback,
} from '@/types/database';
import { Shield, Building2, MapPin, RefreshCw } from 'lucide-react';

export default function ClimateIntelligencePage() {
  const { user, role, isLoading: isAuthLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [selectedStationId, setSelectedStationId] = useState<number | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isFetchingLive, setIsFetchingLive] = useState<boolean>(false);

  // Data Store State
  const [stations, setStations] = useState<WeatherStation[]>([]);
  const [locations, setLocations] = useState<StationLocation[]>([]);
  const [observations, setObservations] = useState<WeatherObservation[]>([]);
  const [predictions, setPredictions] = useState<HeatwavePrediction[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [reports, setReports] = useState<ReportAnalysis[]>([]);
  const [feedbacks, setFeedbacks] = useState<UserFeedback[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // User-scoped localStorage key so active station isn't shared across accounts
  const userStorageKey = `ci_selected_station_id_${user?.User_ID || 'guest'}`;

  // Restore saved station from localStorage whenever active user changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(userStorageKey);
      if (saved) {
        setSelectedStationId(Number(saved));
      } else {
        setSelectedStationId(null);
      }
    }
  }, [user?.User_ID, userStorageKey]);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [st, loc, obs, pred, al, rep, fb, us] = await Promise.all([
        ClimateDataService.getStations(),
        ClimateDataService.getLocations(),
        ClimateDataService.getObservations(),
        ClimateDataService.getPredictions(),
        ClimateDataService.getAlerts(),
        ClimateDataService.getReports(),
        ClimateDataService.getFeedbacks(),
        ClimateDataService.getUsers(),
      ]);

      setStations(st);
      setLocations(loc);
      setObservations(obs);
      setPredictions(pred);
      setAlerts(al);
      setReports(rep);
      setFeedbacks(fb);
      setUsers(us);
    } catch (err) {
      console.error('Error loading climate data:', err);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter stations: Official public stations + user-owned custom stations (or all if Admin)
  const visibleStations = stations.filter((st) => {
    if (!st.isCustom) return true;
    if (role === 'admin') return true;
    if (user && st.createdBy) return String(st.createdBy) === String(user.User_ID);
    // Custom station with no createdBy: show to guests and to any logged-in user
    // (covers stations added before login or when userId wasn't captured)
    if (!st.createdBy) return true;
    return false;
  });

  const handleStationSelect = async (stationId: number) => {
    setSelectedStationId(stationId);
    if (typeof window !== 'undefined') {
      localStorage.setItem(userStorageKey, String(stationId));
    }
    // Update live weather in background without blocking screen
    ClimateDataService.refreshLiveWeatherForStation(stationId)
      .then(() => loadData())
      .catch((err) => console.error('Live fetch error:', err));
  };

  const handleRefreshOpenMeteo = async () => {
    if (!selectedStationId) return;
    setIsRefreshing(true);
    try {
      await ClimateDataService.refreshLiveWeatherForStation(selectedStationId);
      await loadData();
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleChangeStation = () => {
    setSelectedStationId(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(userStorageKey);
    }
  };

  const selectedStation = visibleStations.find((s) => Number(s.Station_ID) === Number(selectedStationId));

  // ─── Loading stations list ───
  if (isLoadingData && stations.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3.5">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-white font-display font-semibold text-sm">Loading India Climate Intelligence System...</p>
          <p className="text-slate-400 text-xs">Connecting to meteorological observatory network</p>
        </div>
      </div>
    );
  }

  // ─── No station selected → show full-page selector ───
  if (!selectedStationId || !selectedStation) {
    return (
      <>
        {isFetchingLive ? (
          <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-white font-display font-bold text-base">Fetching Live Climate Telemetry...</p>
              <p className="text-slate-400 text-xs">Connecting to IMD Climate API network for real-time readings</p>
            </div>
          </div>
        ) : (
          <StationSelector
            stations={visibleStations}
            onSelect={handleStationSelect}
            currentUserId={user?.User_ID}
            onStationAdded={(newStation) => {
              const updatedStation = user ? { ...newStation, createdBy: user.User_ID } : newStation;
              setStations((prev) => [updatedStation, ...prev.filter((s) => s.Station_ID !== updatedStation.Station_ID)]);
            }}
            onStationDeleted={(deletedId) => {
              setStations((prev) => prev.filter((s) => s.Station_ID !== deletedId));
              if (selectedStationId === deletedId) {
                setSelectedStationId(null);
              }
            }}
          />
        )}
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </>
    );
  }

  // ─── Station selected → show full dashboard ───
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Navigation Sidebar */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedStation={selectedStation}
        onChangeStation={handleChangeStation}
        onRefreshData={handleRefreshOpenMeteo}
        isRefreshing={isRefreshing}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 p-4 md:p-8 max-w-7xl mx-auto w-full">
        {/* Top Header Bar */}
        <header className="mb-6 bg-white p-4.5 rounded-2xl border border-slate-200/90 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 font-extrabold flex items-center justify-center text-xs shadow-sm">
              {user ? (role === 'admin' ? 'ADM' : 'USR') : 'GST'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display font-bold text-slate-900 text-sm">{user?.User_Name || 'Guest Visitor'}</h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    role === 'admin' && user
                      ? 'bg-teal-950 text-teal-300 border border-teal-700'
                      : 'bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {user ? `${role} Authorized` : 'Guest Access'}
                </span>
                {selectedStation.isCustom && (
                  <span className="bg-teal-950 text-teal-300 border border-teal-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 text-teal-400" />
                    Personal Location
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-teal-600" />
                <span>
                  Station: <strong>{selectedStation.Station_Code} — {selectedStation.Station_Name}</strong>
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={handleChangeStation}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-subtle transition-all flex items-center gap-1.5 border border-slate-300 cursor-pointer btn-press"
            >
              <MapPin className="w-3.5 h-3.5 text-teal-600" />
              Change Location
            </button>
            <button
              onClick={handleRefreshOpenMeteo}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer btn-press disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Live Refresh'}
            </button>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 cursor-pointer btn-press"
            >
              <Shield className="w-3.5 h-3.5 text-teal-300" />
              {user ? 'Account' : 'Portal Login'}
            </button>
          </div>
        </header>

        {/* View Router */}
        {isLoadingData ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-card space-y-3">
            <div className="w-10 h-10 border-4 border-climate-ocean border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Loading Climate Analytics...</p>
            <p className="text-xs text-slate-400">Retrieving real-time data for {selectedStation.Station_Name}</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                station={selectedStation}
                locations={locations}
                observations={observations}
                predictions={predictions}
                alerts={alerts}
                onRefresh={handleRefreshOpenMeteo}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'records' && (
              <WeatherRecordsView observations={observations} stations={visibleStations} selectedStationId={selectedStationId} />
            )}

            {activeTab === 'predictions' && (
              <PredictionsView predictions={predictions} stations={visibleStations} selectedStationId={selectedStationId} />
            )}

            {activeTab === 'alerts' && (
              <AlertsView alerts={alerts} onAlertUpdated={loadData} selectedStationId={selectedStationId} />
            )}

            {activeTab === 'reports' && (
              <ReportsView reports={reports} selectedStationId={selectedStationId} />
            )}

            {activeTab === 'feedback' && (
              <FeedbackView feedbacks={feedbacks} onFeedbackSubmitted={loadData} />
            )}

            {activeTab === 'admin' && role === 'admin' && (
              <AdminDashboardView
                stations={visibleStations}
                locations={locations}
                users={users}
                feedbacks={feedbacks}
                alerts={alerts}
                observations={observations}
                onDataRefresh={loadData}
              />
            )}
          </>
        )}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
}