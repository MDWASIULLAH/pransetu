import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import { InteractiveEOCMap } from './map/InteractiveEOCMap';
import { AIRouteInspector } from './modules/AIRouteInspector';
import { LiveWeatherWidget } from './modules/LiveWeatherWidget';
import { DisasterDominoEffect } from './modules/DisasterDominoEffect';

export const CommandCenter: React.FC = () => {
  const {
    signals,
    selectedSignalId,
    setSelectedSignalId,
    dispatchTeamToSignal,
    activeCampaign,
    recordDTMF,
    metrics
  } = useEOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [floodZonesActive, setFloodZonesActive] = useState(true);
  const [evacRoutesActive, setEvacRoutesActive] = useState(true);
  const [activeMapType, setActiveMapType] = useState<'dark' | 'satellite'>('dark');
  const [inspectedRouteId, setInspectedRouteId] = useState<string | null>(null);
  const [dominoModalOpen, setDominoModalOpen] = useState<boolean>(false);

  const topCriticalSignal = signals.find((s) => s.status === 'Critical') || signals[0];

  const filteredSignals = signals.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
      
      {inspectedRouteId && (
        <AIRouteInspector routeId={inspectedRouteId} onClose={() => setInspectedRouteId(null)} />
      )}

      {dominoModalOpen && (
        <DisasterDominoEffect onClose={() => setDominoModalOpen(false)} />
      )}

      {/* 1. Metric Ticker (Top) - Clean, Minimalist Panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-surface border border-outline-variant rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="text-data-label text-on-surface-variant">Active SOS</span>
            <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-display-lg text-on-surface">{metrics.activeSOSCount}</span>
            <span className="text-data-value text-error">({metrics.criticalCount} Crit)</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-surface border border-outline-variant rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="text-data-label text-on-surface-variant">Affected (EST)</span>
            <span className="material-symbols-outlined text-[16px] text-on-surface-variant">groups</span>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-display-lg text-on-surface">{metrics.totalAffectedCount.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-surface border border-outline-variant rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="text-data-label text-on-surface-variant">Shelters</span>
            <span className="text-data-value text-on-surface">{metrics.sheltersOccupancyPercent}%</span>
          </div>
          <div className="mt-auto w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full"
              style={{ width: `${metrics.sheltersOccupancyPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-surface border border-outline-variant rounded-lg p-5 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <span className="text-data-label text-on-surface-variant">Rescue Teams</span>
            <span className="text-data-value text-secondary">Active</span>
          </div>
          <div className="flex items-baseline gap-2 mt-auto">
            <span className="text-display-lg text-on-surface">{metrics.teamsDeployedCount}</span>
            <span className="text-body-lg text-on-surface-variant">/ {metrics.teamsTotalCount}</span>
          </div>
        </div>

      </div>

      {/* Main Operations Grid */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* 2. Map Canvas (Center Left) */}
        <div className="col-span-12 xl:col-span-8 bg-surface border border-outline-variant rounded-lg flex flex-col overflow-hidden h-[500px] relative">
          
          {/* Floating Elegant Controls Over Map */}
          <div className="absolute top-4 left-4 z-[400] flex gap-2">
            <div className="bg-surface-container-high/90 backdrop-blur border border-outline-variant rounded flex items-center p-0.5">
              <button
                onClick={() => setActiveMapType('dark')}
                className={`px-3 py-1.5 text-data-label rounded transition-colors ${
                  activeMapType === 'dark' ? 'bg-surface text-on-surface shadow' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setActiveMapType('satellite')}
                className={`px-3 py-1.5 text-data-label rounded transition-colors ${
                  activeMapType === 'satellite' ? 'bg-surface text-on-surface shadow' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sat
              </button>
            </div>
            
            <div className="bg-surface-container-high/90 backdrop-blur border border-outline-variant rounded flex items-center p-0.5">
              <button
                onClick={() => setFloodZonesActive(!floodZonesActive)}
                className={`px-3 py-1.5 text-data-label rounded transition-colors ${
                  floodZonesActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Flood
              </button>
              <button
                onClick={() => setEvacRoutesActive(!evacRoutesActive)}
                className={`px-3 py-1.5 text-data-label rounded transition-colors ${
                  evacRoutesActive ? 'bg-primary/20 text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Routes
              </button>
            </div>
          </div>

          <div className="absolute top-4 right-4 z-[400] flex gap-2">
             <button
                onClick={() => setInspectedRouteId('marine-drive')}
                className="px-3 py-1.5 rounded bg-surface-container-high/90 backdrop-blur border border-outline-variant text-primary text-data-label hover:bg-surface transition-colors shadow"
              >
                AI Route
              </button>
              <button
                onClick={() => setDominoModalOpen(true)}
                className="px-3 py-1.5 rounded bg-error/90 backdrop-blur border border-error/50 text-on-error text-data-label hover:bg-error transition-colors shadow"
              >
                Cascading Risk
              </button>
          </div>

          <div className="flex-1 w-full h-full">
            <InteractiveEOCMap
              mapType={activeMapType}
              showFloodZones={floodZonesActive}
              showRoutes={evacRoutesActive}
              showShelters={true}
              showRescueUnits={true}
              onInspectRoute={(routeId) => setInspectedRouteId(routeId)}
              height="100%"
            />
          </div>
        </div>

        {/* 3. SOS Live Stream (Center Right) - Clean List */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant rounded-lg flex flex-col h-[500px]">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <h2 className="font-headline-sm font-semibold text-on-surface">Live Signals</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-error animate-pulse"></div>
              <span className="text-data-label text-on-surface-variant">{signals.length} Active</span>
            </div>
          </div>

          <div className="p-2 border-b border-outline-variant">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, location..."
              className="w-full bg-surface-container-high border border-outline-variant rounded px-3 py-2 text-body-sm focus:outline-none focus:border-outline"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredSignals.map((item) => {
              const isSelected = selectedSignalId === item.id;
              const isCritical = item.status === 'Critical';
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSignalId(item.id)}
                  className={`p-3 rounded-md cursor-pointer transition-colors border ${
                    isSelected ? 'bg-surface-container-high border-outline-variant' : 'bg-transparent border-transparent hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-data-value text-on-surface">{item.id}</span>
                      {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-error"></span>}
                    </div>
                    <span className="font-data-value text-on-surface-variant text-[11px]">Score {item.score}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 text-[11px] text-on-surface-variant">
                    <span>{item.source} • {item.people} pax</span>
                    <span className="font-data-label text-primary">{item.relay}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. AI Priority Engine (Bottom Left) */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-sm font-semibold">Priority Triage</h2>
              <span className="text-data-label text-primary">Algorithmic</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 border-2 border-error rounded-full flex items-center justify-center text-center">
                <span className="font-display-lg text-2xl text-error">{topCriticalSignal?.score || 94}</span>
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Medical Factor</span>
                  <span className="font-data-value">+40</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Density Factor</span>
                  <span className="font-data-value">+30</span>
                </div>
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Age Factor</span>
                  <span className="font-data-value">+24</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => dispatchTeamToSignal(topCriticalSignal?.id || 'OD-7A92')}
            className="w-full mt-6 py-2.5 bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest rounded text-body-sm font-medium transition-colors"
          >
            Deploy to {topCriticalSignal?.id || 'OD-7A92'}
          </button>
        </div>

        {/* 5. IVR Broadcast Status */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-headline-sm font-semibold">IVR Telemetry</h2>
              <span className="text-data-label text-on-surface-variant">{activeCampaign.title}</span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-body-sm">
                <span className="text-on-surface-variant">
                  Reach: {activeCampaign.answeredCount.toLocaleString()} / {activeCampaign.totalReach.toLocaleString()}
                </span>
                <span className="font-data-value text-on-surface">
                  {Math.round((activeCampaign.answeredCount / activeCampaign.totalReach) * 100)}%
                </span>
              </div>
              <div className="w-full bg-surface-container-high h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-on-surface h-full"
                  style={{ width: `${(activeCampaign.answeredCount / activeCampaign.totalReach) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => recordDTMF('1')} className="bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest p-3 rounded text-center transition-colors">
              <span className="block text-data-label text-on-surface-variant mb-1">Key 1</span>
              <span className="font-data-value text-secondary">{activeCampaign.safeCount}</span>
            </button>
            <button onClick={() => recordDTMF('2')} className="bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest p-3 rounded text-center transition-colors">
              <span className="block text-data-label text-on-surface-variant mb-1">Key 2</span>
              <span className="font-data-value text-tertiary">{activeCampaign.foodWaterCount}</span>
            </button>
            <button onClick={() => recordDTMF('3')} className="bg-surface-container-high border border-outline-variant hover:bg-surface-container-highest p-3 rounded text-center transition-colors">
              <span className="block text-data-label text-on-surface-variant mb-1">Key 3</span>
              <span className="font-data-value text-error">{activeCampaign.medicalCount}</span>
            </button>
          </div>
        </div>

        {/* 6. Weather Widget */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant rounded-lg overflow-hidden flex">
          <LiveWeatherWidget className="w-full h-full" />
        </div>

      </div>
    </div>
  );
};
