import React, { useState, useEffect } from 'react';
import type { DistrictWeather, PresetLocation } from '../../services/weatherService';
import {
  GLOBAL_PRESET_LOCATIONS,
  fetchGlobalCityWeather,
  fetchCoordinatesWeather
} from '../../services/weatherService';

interface LiveWeatherWidgetProps {
  onWeatherUpdate?: (weather: DistrictWeather) => void;
  className?: string;
}

export const LiveWeatherWidget: React.FC<LiveWeatherWidgetProps> = ({
  onWeatherUpdate,
  className = ''
}) => {
  const [selectedLocation, setSelectedLocation] = useState<PresetLocation>(GLOBAL_PRESET_LOCATIONS[0]);
  const [currentWeather, setCurrentWeather] = useState<DistrictWeather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'India Disaster Grid' | 'Global Hurricane/Typhoon' | 'World Capitals'>('All');
  const [searchError, setSearchError] = useState<string | null>(null);

  const loadWeather = async (loc?: PresetLocation) => {
    setLoading(true);
    setSearchError(null);
    const targetLoc = loc || selectedLocation;
    const data = await fetchCoordinatesWeather(targetLoc.lat, targetLoc.lon, targetLoc.name);
    setCurrentWeather(data);
    setLoading(false);
    onWeatherUpdate?.(data);
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearchError(null);
    try {
      const data = await fetchGlobalCityWeather(searchQuery.trim());
      setCurrentWeather(data);
      setSelectedLocation({
        name: data.district,
        category: 'World Capitals',
        lat: data.lat,
        lon: data.lon,
        country: data.country || 'GLOBAL'
      });
      onWeatherUpdate?.(data);
    } catch (err) {
      setSearchError('City not found. Please verify spelling.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWeather();
    const interval = setInterval(() => {
      loadWeather();
    }, 60000); // 1-minute auto refresh
    return () => clearInterval(interval);
  }, [selectedLocation]);

  const filteredPresets = activeCategory === 'All'
    ? GLOBAL_PRESET_LOCATIONS
    : GLOBAL_PRESET_LOCATIONS.filter((l) => l.category === activeCategory);

  return (
    <div className={`bg-surface border border-outline-variant/30 shadow-sm rounded-xl p-4 shadow-lg overflow-hidden flex flex-col ${className}`}>
      {/* Header with Global Live Indicator */}
      <div className="flex flex-wrap justify-between items-center pb-3 border-b border-outline-variant gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">public</span>
          </div>
          <div>
            <h3 className="font-sans text-base font-semibold text-on-surface flex items-center gap-1.5">
              Global Atmospheric &amp; Storm Telemetry
            </h3>
            <span className="text-[10px] font-sans text-on-surface-variant block">
              Worldwide Doppler Feed • Live Sync: {currentWeather?.lastUpdated || 'Now'}
            </span>
          </div>
        </div>

        <button
          onClick={() => loadWeather()}
          disabled={loading}
          className="p-1.5 rounded-lg bg-surface hover:bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors cursor-pointer border border-outline-variant flex items-center gap-1 text-xs"
          title="Refresh Live Weather"
        >
          <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
            sync
          </span>
          <span className="hidden sm:inline text-[11px] font-sans">Sync</span>
        </button>
      </div>

      {/* Worldwide City Search Bar */}
      <form onSubmit={handleSearchSubmit} className="pt-2.5 pb-2">
        <div className="flex items-center gap-1.5 bg-surface border border-outline-variant/30 shadow-sm px-2.5 py-1">
          <span className="material-symbols-outlined text-on-surface-variant text-[18px]">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search any city or country worldwide (e.g. Tokyo, Miami, London, Mumbai)..."
            className="w-full bg-transparent text-on-surface text-xs focus:outline-none placeholder:text-on-surface-variant/60 font-sans"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-on-surface-variant hover:text-on-surface text-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !searchQuery.trim()}
            className="px-2.5 py-0.5 bg-primary text-on-primary rounded text-[11px] font-bold hover:bg-primary-fixed cursor-pointer transition-colors shrink-0 disabled:opacity-50"
          >
            Locate
          </button>
        </div>
        {searchError && (
          <span className="text-[11px] text-error font-sans mt-1 block">{searchError}</span>
        )}
      </form>

      {/* Region Category Filter Pills */}
      <div className="flex gap-1 py-1.5 overflow-x-auto border-b border-outline-variant text-[11px] font-sans">
        {(['All', 'India Disaster Grid', 'Global Hurricane/Typhoon', 'World Capitals'] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-2 py-0.5 rounded transition-colors cursor-pointer whitespace-nowrap ${
              activeCategory === cat
                ? 'bg-primary/10 text-primary font-semibold border border-primary/20'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Preset Location Badges */}
      <div className="flex gap-1.5 py-2 overflow-x-auto border-b border-outline-variant">
        {filteredPresets.map((loc) => {
          const isSelected = selectedLocation.name === loc.name;
          return (
            <button
              key={loc.name}
              onClick={() => {
                setSelectedLocation(loc);
                setSearchQuery('');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1 ${
                isSelected
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm border border-primary/20'
                  : 'bg-surface border border-outline-variant/50 text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="text-[10px] opacity-75 font-sans">[{loc.country}]</span>
              <span>{loc.name.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Current Weather Display */}
      {currentWeather && (
        <div className="pt-3 space-y-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-xl border border-outline-variant/30 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold font-sans text-on-surface">
                {currentWeather.temp}°C
              </span>
              <div>
                <span className="font-bold text-xs text-primary block">
                  {currentWeather.district} {currentWeather.country ? `(${currentWeather.country})` : ''}
                </span>
                <span className="text-[10px] text-on-surface-variant font-sans">
                  {currentWeather.condition} • Feels {currentWeather.feelsLike}°C
                </span>
              </div>
            </div>

            {/* Cyclone / Hazard Classification */}
            <div className="text-right">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-sans font-bold uppercase tracking-wider inline-block ${
                  currentWeather.cycloneRiskLevel === 'EMERGENCY_RED'
                    ? 'bg-error/10 text-error border border-error/20'
                    : currentWeather.cycloneRiskLevel === 'WARNING'
                    ? 'bg-amber-600/10 text-amber-600 border border-amber-600/20'
                    : currentWeather.cycloneRiskLevel === 'WATCH'
                    ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                }`}
              >
                {currentWeather.cycloneRiskLevel.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-on-surface-variant font-sans block mt-0.5">
                Surge Risk: +{currentWeather.surgePotentialM}m
              </span>
            </div>
          </div>

          {/* 4 Telemetry Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-surface border border-outline-variant/30 shadow-sm/50">
              <span className="text-[10px] text-on-surface-variant font-sans block">WIND SPEED &amp; GUSTS</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold font-sans text-on-surface">{currentWeather.windSpeedKmh}</span>
                <span className="text-[10px] text-on-surface-variant font-sans">km/h</span>
              </div>
              <span className="text-[10px] text-amber-600 font-sans">Gusts: {currentWeather.windGustKmh} km/h</span>
            </div>

            <div className="p-2.5 bg-surface border border-outline-variant/30 shadow-sm/50">
              <span className="text-[10px] text-on-surface-variant font-sans block">BAROMETRIC PRESSURE</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-sm font-bold font-sans ${currentWeather.pressure < 995 ? 'text-error' : 'text-on-surface'}`}>
                  {currentWeather.pressure}
                </span>
                <span className="text-[10px] text-on-surface-variant font-sans">hPa</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-sans">
                {currentWeather.pressure < 995 ? '⚠️ Low Depression' : 'Stable Atmospheric'}
              </span>
            </div>

            <div className="p-2.5 bg-surface border border-outline-variant/30 shadow-sm/50">
              <span className="text-[10px] text-on-surface-variant font-sans block">PRECIPITATION (1H)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold font-sans text-primary">{currentWeather.rain1hMm}</span>
                <span className="text-[10px] text-on-surface-variant font-sans">mm/h</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-sans">Humidity: {currentWeather.humidity}%</span>
            </div>

            <div className="p-2.5 bg-surface border border-outline-variant/30 shadow-sm/50">
              <span className="text-[10px] text-on-surface-variant font-sans block">CLOUD &amp; VISIBILITY</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold font-sans text-on-surface">{currentWeather.visibilityKm}</span>
                <span className="text-[10px] text-on-surface-variant font-sans">km</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-sans">Clouds: {currentWeather.clouds}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
