'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { WeatherStation } from '@/types/database';
import {
  LayoutDashboard,
  Database,
  TrendingUp,
  Siren,
  FileText,
  MessageSquareHeart,
  ShieldAlert,
  CloudSun,
  RefreshCw,
  LogOut,
  Building2,
  MapPin,
  Menu,
  X,
  Radio,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'records'
  | 'predictions'
  | 'alerts'
  | 'reports'
  | 'feedback'
  | 'admin';

interface NavigationProps {
  activeTab: NavTab;
  setActiveTab: (tab: NavTab) => void;
  selectedStation: WeatherStation;
  onChangeStation: () => void;
  onRefreshData: () => void;
  isRefreshing: boolean;
  onOpenAuthModal: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  selectedStation,
  onChangeStation,
  onRefreshData,
  isRefreshing,
  onOpenAuthModal,
}) => {
  const { user, role, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Live Dashboard', icon: LayoutDashboard, adminOnly: false },
    { id: 'records' as NavTab, label: 'Weather Records', icon: Database, adminOnly: false },
    { id: 'predictions' as NavTab, label: 'Heatwave Predictions', icon: TrendingUp, adminOnly: false },
    { id: 'alerts' as NavTab, label: 'Early-Warning Alerts', icon: Siren, adminOnly: false },
    { id: 'reports' as NavTab, label: 'Climate Reports', icon: FileText, adminOnly: false },
    { id: 'feedback' as NavTab, label: 'Submit Feedback', icon: MessageSquareHeart, adminOnly: false },
    { id: 'admin' as NavTab, label: 'Admin Analytics', icon: ShieldAlert, adminOnly: true },
  ];

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-climate-navy text-white min-h-screen fixed left-0 top-0 bottom-0 z-30 shadow-xl border-r border-slate-800/80">
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center gap-3 bg-slate-950/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-md ring-1 ring-white/10">
            <CloudSun className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-sm tracking-tight text-white leading-tight">
              INDIA CLIMATE INTEL
            </h1>
            <p className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase mt-0.5">
              Heatwave Early Warning
            </p>
          </div>
        </div>

        {/* Active Station Card */}
        <div className="px-4 py-3.5 bg-slate-900/50 border-b border-slate-800/80">
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Building2 className="w-3 h-3 text-teal-400" /> Active Station
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" /> LIVE
            </span>
          </label>
          <div className="bg-slate-850/80 rounded-xl p-3 border border-slate-700/80 shadow-inner">
            <div className="flex items-center justify-between gap-1 mb-1">
              <p className="text-white text-xs font-bold font-display leading-tight truncate">
                {selectedStation.Station_Name}
              </p>
              {selectedStation.isCustom && (
                <span className="text-[9px] font-bold bg-teal-950 text-teal-300 border border-teal-700 px-1.5 py-0.2 rounded uppercase shrink-0">
                  Custom
                </span>
              )}
            </div>
            <p className="text-teal-400 text-[10px] font-mono">{selectedStation.Station_Code}</p>
            <button
              onClick={onChangeStation}
              className="mt-2.5 w-full text-[10px] font-semibold text-slate-300 hover:text-teal-200 bg-slate-800/80 hover:bg-slate-750 border border-slate-700 hover:border-teal-500/50 rounded-lg py-1.5 transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press"
            >
              <MapPin className="w-3 h-3 text-teal-400" /> Change / Add Station
            </button>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            if (item.adminOnly && role !== 'admin') return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all btn-press ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-200 border-l-[3px] border-teal-400 shadow-sm font-bold'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.id === 'alerts' && (
                  <span className="ml-auto bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-1.5 py-0.2 rounded font-bold">
                    LIVE
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sync Button */}
        <div className="p-3 px-4 border-t border-slate-800/80 bg-slate-950/40">
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="w-full bg-slate-800/90 hover:bg-slate-750 text-teal-300 hover:text-teal-200 border border-slate-700 hover:border-teal-500/40 py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-sm btn-press disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-teal-400 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Syncing Live Telemetry...' : 'Sync Station Live Data'}</span>
          </button>
        </div>
        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 text-slate-950 font-bold flex items-center justify-center text-xs shrink-0 shadow-sm">
                {user?.User_Name ? user.User_Name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate font-display">{user?.User_Name || 'Guest Visitor'}</p>
                <p className="text-[10px] text-slate-400 truncate">{user?.Email || 'Unauthenticated'}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 pt-2.5 border-t border-slate-800/60">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                role === 'admin' && user
                  ? 'bg-teal-950 text-teal-300 border border-teal-700/80'
                  : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              {user ? `${role} Role` : 'Guest'}
            </span>

            {user ? (
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors btn-press"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="text-xs bg-teal-600 hover:bg-teal-500 text-white font-semibold py-1 px-3 rounded-lg border border-teal-400/40 shadow-sm transition-all btn-press"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Top Navbar */}
      <div className="lg:hidden bg-climate-navy text-white p-3.5 px-4 flex items-center justify-between sticky top-0 z-40 shadow-md border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-sm">
            <CloudSun className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-xs tracking-tight text-white font-display">INDIA CLIMATE INTEL</span>
            <p className="text-[10px] text-teal-400 font-mono leading-none mt-0.5">{selectedStation.Station_Code}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onRefreshData}
            disabled={isRefreshing}
            className="p-2 bg-slate-800/90 rounded-lg text-teal-300 hover:text-white border border-slate-700 btn-press"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 bg-slate-800/90 rounded-lg text-slate-300 hover:text-white border border-slate-700 btn-press"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 space-y-1.5 z-40 fixed left-0 right-0 top-14 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <button
            onClick={() => {
              onChangeStation();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold text-teal-300 bg-teal-950/40 border border-teal-800/50 mb-3"
          >
            <MapPin className="w-4 h-4 text-teal-400" /> Change Station ({selectedStation.Station_Code})
          </button>

          {navItems.map((item) => {
            if (item.adminOnly && role !== 'admin') return null;
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive ? 'bg-teal-600 text-white shadow font-bold' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
};
