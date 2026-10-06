'use client';

import React, { useState, useEffect, useRef } from 'react';
import { WeatherStation } from '@/types/database';
import { ClimateDataService } from '@/lib/supabase/client';
import { searchLocations, reverseGeocode, GeocodingResult } from '@/lib/services/geocoding';
import {
  MapPin,
  Thermometer,
  Radio,
  ChevronRight,
  Navigation as NavigationIcon,
  Search,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  X,
  Building2,
  LocateFixed,
  Landmark,
  Waves,
  Sprout,
  SunMedium,
  Trees,
  Layers,
  Flame,
  Compass,
  BookmarkCheck,
  ShieldCheck,
} from 'lucide-react';

interface StationSelectorProps {
  stations: WeatherStation[];
  onSelect: (stationId: number) => void;
  onStationAdded?: (station: WeatherStation) => void;
  onStationDeleted?: (stationId: number) => void;
  currentUserId?: string;
}

const CITY_META: Record<
  string,
  {
    state: string;
    icon: React.ComponentType<{ className?: string }>;
    tagline: string;
    accentColor: string;
    iconBg: string;
    iconColor: string;
  }
> = {
  'ST-DEL-01': {
    state: 'Delhi NCR',
    icon: Landmark,
    tagline: 'Capital thermal hotspot',
    accentColor: 'from-amber-600 via-orange-600 to-red-600',
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  'ST-MUM-02': {
    state: 'Maharashtra',
    icon: Waves,
    tagline: 'Coastal humidity monitor',
    accentColor: 'from-sky-500 via-blue-600 to-teal-600',
    iconBg: 'bg-sky-500/15 border-sky-500/30',
    iconColor: 'text-sky-400',
  },
  'ST-KOL-03': {
    state: 'West Bengal',
    icon: Sprout,
    tagline: 'Delta river climate station',
    accentColor: 'from-emerald-500 via-teal-600 to-cyan-600',
    iconBg: 'bg-emerald-500/15 border-emerald-500/30',
    iconColor: 'text-emerald-400',
  },
  'ST-CHE-04': {
    state: 'Tamil Nadu',
    icon: SunMedium,
    tagline: 'Coastal heat observatory',
    accentColor: 'from-amber-500 via-orange-600 to-amber-700',
    iconBg: 'bg-amber-500/15 border-amber-500/30',
    iconColor: 'text-amber-400',
  },
  'ST-BLR-05': {
    state: 'Karnataka',
    icon: Trees,
    tagline: 'Deccan plateau monitor',
    accentColor: 'from-teal-500 via-emerald-600 to-green-700',
    iconBg: 'bg-teal-500/15 border-teal-500/30',
    iconColor: 'text-teal-400',
  },
  'ST-HYD-06': {
    state: 'Telangana',
    icon: Layers,
    tagline: 'Twin cities heat tracker',
    accentColor: 'from-indigo-500 via-purple-600 to-pink-600',
    iconBg: 'bg-indigo-500/15 border-indigo-500/30',
    iconColor: 'text-indigo-400',
  },
  'ST-AHM-07': {
    state: 'Gujarat',
    icon: Flame,
    tagline: 'Arid zone early warning',
    accentColor: 'from-orange-500 via-amber-600 to-yellow-600',
    iconBg: 'bg-orange-500/15 border-orange-500/30',
    iconColor: 'text-orange-400',
  },
  'ST-JAI-08': {
    state: 'Rajasthan',
    icon: Compass,
    tagline: 'Thar desert frontier',
    accentColor: 'from-rose-500 via-amber-600 to-red-600',
    iconBg: 'bg-rose-500/15 border-rose-500/30',
    iconColor: 'text-rose-400',
  },
};

export const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  onSelect,
  onStationAdded,
  onStationDeleted,
  currentUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);

  // Debounced search with cancel check
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    let isCancelled = false;
    setIsSearching(true);

    const timeoutId = setTimeout(async () => {
      try {
        const results = await searchLocations(searchQuery);
        if (!isCancelled) {
          setSearchResults(results);
          setIsDropdownOpen(true);
          setHighlightedIndex(-1);
        }
      } finally {
        if (!isCancelled) setIsSearching(false);
      }
    }, 320);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  // Handle outside clicks
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for search dropdown
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : searchResults.length - 1));
    } else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      handleSelectSearchResult(searchResults[highlightedIndex]);
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  const handleDetectGPS = () => {
    setGpsError(null);
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = Math.round(position.coords.latitude * 10000) / 10000;
          const lon = Math.round(position.coords.longitude * 10000) / 10000;

          const geocoded = await reverseGeocode(lat, lon);
          const newStation = await ClimateDataService.addStation(
            geocoded.code,
            geocoded.name,
            lat,
            lon,
            geocoded.location,
            true,
            currentUserId
          );

          if (onStationAdded) onStationAdded(newStation);
          onSelect(newStation.Station_ID);
        } catch (err) {
          console.error('Error adding GPS station:', err);
          setGpsError('Could not register your location. Please try manual search.');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (error) => {
        setIsDetectingGps(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Please allow access or search for your city above.');
        } else if (error.code === error.TIMEOUT) {
          setGpsError('GPS request timed out. You can search your city in the box below.');
        } else {
          setGpsError('Unable to detect location. Please use city search below.');
        }
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
    );
  };

  const handleSelectSearchResult = async (result: GeocodingResult) => {
    setIsDropdownOpen(false);
    setSearchQuery('');

    try {
      const codePrefix = result.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'LOC');
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      const stationCode = `MY-${codePrefix}-${randomSuffix}`;
      const stationName = `${result.name} Monitoring Station`;

      const newStation = await ClimateDataService.addStation(
        stationCode,
        stationName,
        result.latitude,
        result.longitude,
        result.displayName,
        true,
        currentUserId
      );

      if (onStationAdded) onStationAdded(newStation);
      onSelect(newStation.Station_ID);
    } catch (err) {
      console.error('Failed to add searched station:', err);
    }
  };

  const handleDeleteStation = async (e: React.MouseEvent, stationId: number) => {
    e.stopPropagation();
    try {
      await ClimateDataService.deleteStation(stationId);
      if (onStationDeleted) onStationDeleted(stationId);
    } catch (err) {
      console.error('Failed to delete station:', err);
    }
  };

  const customStations = stations.filter((s) => s.isCustom);
  const observatoryStations = stations.filter((s) => !s.isCustom);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-climate-navy flex flex-col items-center justify-start px-4 py-10 relative overflow-x-hidden animate-in fade-in duration-500">
      <div className="absolute top-0 left-1/4 w-[32rem] h-[32rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[28rem] h-[28rem] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[36rem] h-[36rem] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-8 relative z-10 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm backdrop-blur-sm">
          <Radio className="w-3 h-3 animate-pulse text-cyan-400" />
          India Climate Intelligence Network — Live
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3 tracking-tight">
          Select Your Monitoring Station
        </h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          Choose a national weather observatory, or <span className="text-cyan-300 font-semibold">add your own location</span> using live GPS or city search.
        </p>
      </div>

      {/* Action Panel */}
      <div className="w-full max-w-4xl relative z-20 mb-10">
        <div className="bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 rounded-2xl p-5 shadow-2xl shadow-cyan-950/40">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-md">
                <LocateFixed className="w-5 h-5 text-white animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  Set Up Your Own Location
                  <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">
                    Personal Station
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Auto-detect with live GPS, search any city or town, or enter custom coordinates
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDetectGPS}
                disabled={isDetectingGps}
                className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
              >
                <NavigationIcon className={`w-3.5 h-3.5 text-slate-950 ${isDetectingGps ? 'animate-spin' : ''}`} />
                {isDetectingGps ? 'Detecting GPS...' : 'Use My Live GPS Location'}
              </button>

              <button
                onClick={() => setShowManualModal(true)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                title="Enter custom coordinates"
              >
                <Plus className="w-3.5 h-3.5 text-cyan-400" />
                <span>Custom Lat/Lon</span>
              </button>
            </div>
          </div>

          {gpsError && (
            <div className="mb-4 p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{gpsError}</span>
              </div>
              <button onClick={() => setGpsError(null)} className="text-amber-400 hover:text-amber-200">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="relative" ref={searchContainerRef}>
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (searchResults.length > 0) setIsDropdownOpen(true);
                }}
                placeholder="Search any city or town worldwide..."
                className="w-full pl-10 pr-10 py-3 bg-slate-800/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 rounded-xl text-xs text-white placeholder-slate-400 outline-none transition-all shadow-inner"
              />
              {isSearching && (
                <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin absolute right-3.5" />
              )}
              {!isSearching && searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-white absolute right-3.5"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-slate-800 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-950/60 px-3">
                  Matching Locations (Click to add &amp; monitor)
                </div>
                {searchResults.map((res, index) => (
                  <button
                    key={`${res.id}-${res.latitude}-${res.longitude}`}
                    onClick={() => handleSelectSearchResult(res)}
                    className={`w-full text-left p-3 transition-colors flex items-center justify-between group cursor-pointer ${
                      highlightedIndex === index ? 'bg-slate-800' : 'hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 text-cyan-300 flex items-center justify-center text-xs shrink-0 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                        <MapPin className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-cyan-200 transition-colors">
                          {res.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {[res.admin1, res.country].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/60 px-2 py-0.5 rounded">
                        {res.latitude}° N, {res.longitude}° E
                      </span>
                      <div className="text-[10px] text-emerald-400 mt-0.5 flex items-center justify-end gap-1 font-semibold">
                        <Sparkles className="w-2.5 h-2.5" /> Set as My Station
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Saved Locations */}
      {customStations.length > 0 && (
        <div className="w-full max-w-6xl relative z-10 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-sm">
                <BookmarkCheck className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight font-display">Your Saved Locations</h2>
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                {customStations.length} Saved
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Locally saved personal monitoring posts</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {customStations.map((station) => (
              <div
                key={station.Station_ID}
                onClick={() => onSelect(station.Station_ID)}
                className="group relative bg-gradient-to-b from-slate-800/90 to-slate-900/90 hover:from-slate-800 hover:to-slate-850 border border-teal-500/40 hover:border-teal-400 rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/15 hover:-translate-y-1 cursor-pointer overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-400 via-emerald-400 to-sky-400" />
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-300 flex items-center justify-center">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-bold bg-teal-950/80 text-teal-300 border border-teal-700/80 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Personal Post
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700 px-1.5 py-0.5 rounded">
                        {station.Station_Code}
                      </span>
                      <button
                        onClick={(e) => handleDeleteStation(e, station.Station_ID)}
                        className="p-1 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Remove saved location"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-tight mb-1 group-hover:text-teal-200 transition-colors font-display">
                    {station.Station_Name}
                  </h3>
                  <p className="text-[11px] text-teal-400 font-mono mb-3">
                    {station.Latitude}° N, {station.Longitude}° E
                  </p>
                </div>
                <div className="pt-3 border-t border-slate-700/60 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    LIVE SENSOR READY
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-teal-500 group-hover:bg-teal-400 text-slate-950 flex items-center justify-center transition-colors shadow">
                    <ChevronRight className="w-4 h-4 font-bold" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Observatory Network */}
      <div className="w-full max-w-6xl relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/15 border border-teal-500/30 text-teal-400 flex items-center justify-center shadow-sm">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight font-display">Meteorological Observatory Network</h2>
            <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
              {observatoryStations.length} Active
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">Pre-calibrated climate observatories</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {observatoryStations.map((station) => {
            const meta = CITY_META[station.Station_Code] || {
              state: 'India',
              icon: Building2,
              tagline: 'Climate monitoring station',
              accentColor: 'from-slate-600 to-slate-700',
              iconBg: 'bg-slate-800 border-slate-700',
              iconColor: 'text-slate-300',
            };
            const StationIcon = meta.icon;

            return (
              <button
                key={station.Station_ID}
                onClick={() => onSelect(station.Station_ID)}
                className="group relative bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/60 rounded-2xl p-5 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/10 hover:-translate-y-1 cursor-pointer overflow-hidden w-full flex flex-col justify-between"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${meta.accentColor} opacity-80 group-hover:opacity-100 transition-opacity`} />
                <div>
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-xl ${meta.iconBg} border flex items-center justify-center shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                      <StationIcon className={`w-5 h-5 ${meta.iconColor}`} />
                    </div>
                    <span className="text-[10px] font-mono bg-slate-700/90 text-teal-300 border border-slate-600 px-2 py-0.5 rounded-md font-bold">
                      {station.Station_Code}
                    </span>
                  </div>
                  <h3 className="font-bold text-white text-sm leading-tight mb-1 group-hover:text-teal-200 transition-colors font-display">
                    {station.Station_Name}
                  </h3>
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>{meta.state}</span>
                  </p>
                  <p className="text-[11px] text-slate-400/90 italic mb-4">{meta.tagline}</p>
                  <div className="text-[10px] text-slate-500 font-mono mb-4 space-y-0.5 bg-slate-900/40 p-2 rounded-lg border border-slate-800/60">
                    <div>Lat: {station.Latitude}° N</div>
                    <div>Lon: {station.Longitude}° E</div>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-700/50">
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                    LIVE DATA READY
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-slate-700 group-hover:bg-teal-500 flex items-center justify-center transition-colors shadow">
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-950 font-bold" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-8 text-xs text-slate-400 relative z-10 flex items-center gap-1.5">
        <Thermometer className="w-3.5 h-3.5 text-orange-400" />
        Real-time climate data powered by IMD Climate Data API — refreshed on every observation
      </p>

      {/* Manual Modal */}
      {showManualModal && (
        <ManualStationModal
          onClose={() => setShowManualModal(false)}
          onStationAdded={onStationAdded}
          onSelect={onSelect}
          currentUserId={currentUserId}
        />
      )}
    </div>
  );
};

interface ManualStationModalProps {
  onClose: () => void;
  onStationAdded?: (station: WeatherStation) => void;
  onSelect: (stationId: number) => void;
  currentUserId?: string;
}

const ManualStationModal: React.FC<ManualStationModalProps> = ({ onClose, onStationAdded, onSelect, currentUserId }) => {
  const [manualName, setManualName] = useState('');
  const [manualLocation, setManualLocation] = useState('');
  const [manualLat, setManualLat] = useState('');
  const [manualLon, setManualLon] = useState('');
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const latNum = parseFloat(manualLat);
    const lonNum = parseFloat(manualLon);

    if (!manualName.trim()) {
      setManualError('Please provide a name for your station.');
      return;
    }
    if (isNaN(latNum) || latNum < -90 || latNum > 90) {
      setManualError('Please enter a valid latitude between -90 and 90.');
      return;
    }
    if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      setManualError('Please enter a valid longitude between -180 and 180.');
      return;
    }

    setManualSubmitting(true);
    try {
      const codePrefix = manualName.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'LOC');
      const randomSuffix = Math.floor(10 + Math.random() * 90);
      const stationCode = `MY-${codePrefix}-${randomSuffix}`;
      const locText = manualLocation.trim() || `${manualName} (Lat: ${latNum}, Lon: ${lonNum})`;

      const newStation = await ClimateDataService.addStation(
        stationCode,
        manualName.trim(),
        latNum,
        lonNum,
        locText,
        true,
        currentUserId
      );

      onClose();
      if (onStationAdded) onStationAdded(newStation);
      onSelect(newStation.Station_ID);
    } catch (err) {
      setManualError('Failed to save custom station. Please try again.');
    } finally {
      setManualSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Add Custom Station</h3>
              <p className="text-xs text-slate-400">Save coordinates to monitor any location</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {manualError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 text-red-300 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{manualError}</span>
          </div>
        )}

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div>
            <label htmlFor="station-name" className="block text-xs font-semibold text-slate-300 mb-1">
              Location / Station Name *
            </label>
            <input
              id="station-name"
              type="text"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Pune City Rooftop Post"
              required
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div>
            <label htmlFor="station-region" className="block text-xs font-semibold text-slate-300 mb-1">
              Region / State / Address
            </label>
            <input
              id="station-region"
              type="text"
              value={manualLocation}
              onChange={(e) => setManualLocation(e.target.value)}
              placeholder="e.g. Pune, Maharashtra, India"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="station-lat" className="block text-xs font-semibold text-slate-300 mb-1">
                Latitude (-90 to 90) *
              </label>
              <input
                id="station-lat"
                type="number"
                step="any"
                value={manualLat}
                onChange={(e) => setManualLat(e.target.value)}
                placeholder="e.g. 18.5204"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
            <div>
              <label htmlFor="station-lon" className="block text-xs font-semibold text-slate-300 mb-1">
                Longitude (-180 to 180) *
              </label>
              <input
                id="station-lon"
                type="number"
                step="any"
                value={manualLon}
                onChange={(e) => setManualLon(e.target.value)}
                placeholder="e.g. 73.8567"
                required
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={manualSubmitting}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {manualSubmitting ? 'Saving...' : 'Save & Start Monitoring'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};