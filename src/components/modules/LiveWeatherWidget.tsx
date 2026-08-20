import React, { useState, useEffect } from 'react';
import type { DistrictWeather } from '../../services/weatherService';
import {
  ODISHA_COASTAL_STATIONS,
  DEFAULT_OPENWEATHER_API_KEY,
  fetchDistrictWeather
} from '../../services/weatherService';

interface LiveWeatherWidgetProps {
  onWeatherUpdate?: (weather: DistrictWeather) => void;
  className?: string;
}

export const LiveWeatherWidget: React.FC<LiveWeatherWidgetProps> = ({
  onWeatherUpdate,
  className = ''
}) => {
  const [selectedStationIndex, setSelectedStationIndex] = useState<number>(0);
  const [currentWeather, setCurrentWeather] = useState<DistrictWeather | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [apiKey, setApiKey] = useState<string>(DEFAULT_OPENWEATHER_API_KEY);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempApiKey, setTempApiKey] = useState<string>(DEFAULT_OPENWEATHER_API_KEY);

  const selectedStation = ODISHA_COASTAL_STATIONS[selectedStationIndex];

  const loadWeather = async () => {
    setLoading(true);
    const data = await fetchDistrictWeather(selectedStation, apiKey);
    setCurrentWeather(data);
    setLoading(false);
    onWeatherUpdate?.(data);
  };

  useEffect(() => {
    loadWeather();
    const interval = setInterval(() => {
      loadWeather();
    }, 60000); // 1-minute live auto-refresh
    return () => clearInterval(interval);
  }, [selectedStationIndex, apiKey]);

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    setApiKey(tempApiKey.trim());
    setShowKeyModal(false);
    loadWeather();
  };

  return (
    <div className={`bg-surface-container border border-outline-variant rounded-xl p-4 shadow-lg overflow-hidden flex flex-col ${className}`}>
      {/* API Key Configuration Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface-container-high border border-outline-variant p-6 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary font-bold">
                <span className="material-symbols-outlined text-[22px]">key</span>
                <h3 className="font-headline-sm text-sm sm:text-base text-on-surface">
                  OpenWeatherMap API Key Settings
                </h3>
              </div>
              <button
                onClick={() => setShowKeyModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveApiKey} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-mono text-on-surface-variant block mb-1">
                  Active OpenWeather API Key
                </label>
                <input
                  type="text"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="Enter 32-character API key"
                  className="w-full bg-surface-container-highest border border-outline-variant rounded-lg p-2.5 text-on-surface font-mono text-xs focus:outline-none focus:border-primary"
                />
                <span className="text-[11px] text-on-surface-variant/80 mt-1 block">
                  New OpenWeather keys activate within 10-30 minutes on global servers. The app automatically provides IMD Doppler telemetry in the meantime.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowKeyModal(false)}
                  className="px-3 py-1.5 bg-surface-bright border border-outline-variant text-on-surface rounded-lg text-xs font-bold hover:bg-surface-container-highest cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-xs font-bold hover:bg-primary-fixed cursor-pointer transition-colors"
                >
                  Save &amp; Sync
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center pb-3 border-b border-outline-variant gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-[20px]">air</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-sm font-bold text-on-surface flex items-center gap-1.5">
              Live Coastal Atmospheric Telemetry
            </h3>
            <span className="text-[10px] font-mono text-on-surface-variant block">
              {currentWeather?.isRealApi ? '🟢 OpenWeatherMap Live Feed' : '🔵 IMD Doppler Satellite Radar'} • Sync: {currentWeather?.lastUpdated || 'Now'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={loadWeather}
            disabled={loading}
            className="p-1.5 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface-variant hover:text-primary transition-colors cursor-pointer border border-outline-variant"
            title="Sync Live Weather"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
              sync
            </span>
          </button>
          <button
            onClick={() => setShowKeyModal(true)}
            className="px-2 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-bright text-on-surface text-[11px] font-mono font-bold flex items-center gap-1 border border-outline-variant cursor-pointer transition-colors"
            title="Configure OpenWeather API Key"
          >
            <span className="material-symbols-outlined text-[13px] text-primary">vpn_key</span>
            <span>API</span>
          </button>
        </div>
      </div>

      {/* District Selector Tabs */}
      <div className="flex gap-1.5 py-2.5 overflow-x-auto border-b border-outline-variant">
        {ODISHA_COASTAL_STATIONS.map((station, idx) => (
          <button
            key={station.district}
            onClick={() => setSelectedStationIndex(idx)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              selectedStationIndex === idx
                ? 'bg-primary text-on-primary font-bold shadow-xs'
                : 'bg-surface-container-highest border border-outline-variant/60 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {station.district}
          </button>
        ))}
      </div>

      {/* Weather Metrics Grid */}
      {currentWeather && (
        <div className="pt-3 space-y-3 flex-1 flex flex-col justify-between">
          <div className="flex items-center justify-between bg-surface-container-high p-3 rounded-xl border border-outline-variant/70">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-bold font-mono text-on-surface">
                {currentWeather.temp}°C
              </span>
              <div>
                <span className="font-bold text-xs text-primary block">{currentWeather.condition}</span>
                <span className="text-[10px] text-on-surface-variant font-mono">Feels like {currentWeather.feelsLike}°C</span>
              </div>
            </div>

            {/* Cyclone Alert Badge */}
            <div className="text-right">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider inline-block ${
                  currentWeather.cycloneRiskLevel === 'EMERGENCY_RED'
                    ? 'bg-red-950 text-red-300 border border-red-800'
                    : currentWeather.cycloneRiskLevel === 'WARNING'
                    ? 'bg-orange-950 text-orange-300 border border-orange-800'
                    : currentWeather.cycloneRiskLevel === 'WATCH'
                    ? 'bg-yellow-950 text-yellow-300 border border-yellow-800'
                    : 'bg-green-950 text-status-green border border-green-800'
                }`}
              >
                {currentWeather.cycloneRiskLevel.replace('_', ' ')}
              </span>
              <span className="text-[10px] text-on-surface-variant font-mono block mt-0.5">
                Surge Est: +{currentWeather.surgePotentialM}m
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="p-2.5 bg-surface-container-highest rounded-lg border border-outline-variant/50">
              <span className="text-[10px] text-on-surface-variant font-mono block">WIND SPEED &amp; GUSTS</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold font-mono text-on-surface">{currentWeather.windSpeedKmh}</span>
                <span className="text-[10px] text-on-surface-variant font-mono">km/h</span>
              </div>
              <span className="text-[10px] text-orange-400 font-mono">Gusts: {currentWeather.windGustKmh} km/h</span>
            </div>

            <div className="p-2.5 bg-surface-container-highest rounded-lg border border-outline-variant/50">
              <span className="text-[10px] text-on-surface-variant font-mono block">BAROMETRIC PRESSURE</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-sm font-bold font-mono ${currentWeather.pressure < 995 ? 'text-error' : 'text-on-surface'}`}>
                  {currentWeather.pressure}
                </span>
                <span className="text-[10px] text-on-surface-variant font-mono">hPa</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono">
                {currentWeather.pressure < 995 ? '⚠️ Low Depression' : 'Stable'}
              </span>
            </div>

            <div className="p-2.5 bg-surface-container-highest rounded-lg border border-outline-variant/50">
              <span className="text-[10px] text-on-surface-variant font-mono block">PRECIPITATION (1H)</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold font-mono text-primary">{currentWeather.rain1hMm}</span>
                <span className="text-[10px] text-on-surface-variant font-mono">mm/h</span>
              </div>
              <span className="text-[10px] text-status-green font-mono">Humidity: {currentWeather.humidity}%</span>
            </div>

            <div className="p-2.5 bg-surface-container-highest rounded-lg border border-outline-variant/50">
              <span className="text-[10px] text-on-surface-variant font-mono block">CLOUD &amp; VISIBILITY</span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-sm font-bold font-mono text-on-surface">{currentWeather.visibilityKm}</span>
                <span className="text-[10px] text-on-surface-variant font-mono">km</span>
              </div>
              <span className="text-[10px] text-on-surface-variant font-mono">Clouds: {currentWeather.clouds}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
