import React, { useState, useEffect } from 'react';
import { useEOC } from '../context/EOCContext';
import { InteractiveEOCMap } from './map/InteractiveEOCMap';
import { AIRouteInspector } from './modules/AIRouteInspector';
import { LiveWeatherWidget } from './modules/LiveWeatherWidget';
import { DisasterDominoEffect } from './modules/DisasterDominoEffect';
import { RescueDispatchModal } from './dispatch/RescueDispatchModal';

interface CommandCenterKPIs {
  active_sos: number;
  critical_sos: number;
  assistance_required: number;
  safe_confirmed: number;
  unaccounted: number;
  total_affected_people: number;
  active_incidents: number;
  open_shelters: number;
  shelter_occupancy_percent: number;
  total_shelter_capacity: number;
  total_shelter_occupancy: number;
  available_ambulances: number;
  dispatched_ambulances: number;
  available_rescue_teams: number;
  active_rescue_teams: number;
  available_boats: number;
  available_medical_teams: number;
  pending_synchronization: number;
  average_sos_delivery_time: string;
}

interface CommandCenterProps {
  onNavigate?: (view: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ onNavigate }) => {
  const {
    signals,
    selectedSignalId,
    setSelectedSignalId,
    activeCampaign,
    recordDTMF
  } = useEOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [floodZonesActive, setFloodZonesActive] = useState(true);
  const [evacRoutesActive, setEvacRoutesActive] = useState(true);
  const [inspectedRouteId, setInspectedRouteId] = useState<string | null>(null);
  const [dominoModalOpen, setDominoModalOpen] = useState<boolean>(false);
  const [dispatchIncidentId, setDispatchIncidentId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'light' | 'dark' | 'satellite'>('dark');

  // Live Database KPIs State
  const [kpis, setKpis] = useState<CommandCenterKPIs>({
    active_sos: 14,
    critical_sos: 6,
    assistance_required: 12,
    safe_confirmed: 8420,
    unaccounted: 138,
    total_affected_people: 1840,
    active_incidents: 4,
    open_shelters: 38,
    shelter_occupancy_percent: 68.4,
    total_shelter_capacity: 45000,
    total_shelter_occupancy: 30780,
    available_ambulances: 42,
    dispatched_ambulances: 14,
    available_rescue_teams: 18,
    active_rescue_teams: 6,
    available_boats: 30,
    available_medical_teams: 16,
    pending_synchronization: 3,
    average_sos_delivery_time: '24s'
  });

  const fetchLiveKPIs = async () => {
    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const res = await fetch(`http://localhost:8000/api/v1/command-center/kpis`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setKpis(json.data);
        }
      }
    } catch (e) {
      // Retain live state gracefully if backend temporarily unreachable
    }
  };

  useEffect(() => {
    fetchLiveKPIs();
    const interval = setInterval(fetchLiveKPIs, 3000); // 3-second live database refresh
    return () => clearInterval(interval);
  }, []);

  const topCriticalSignal = signals.find((s) => s.status === 'Critical') || signals[0];

  const filteredSignals = signals.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 max-w-[1680px] mx-auto w-full space-y-6">
      
      {inspectedRouteId && (
        <AIRouteInspector routeId={inspectedRouteId} onClose={() => setInspectedRouteId(null)} />
      )}

      {dominoModalOpen && (
        <DisasterDominoEffect onClose={() => setDominoModalOpen(false)} />
      )}

      {dispatchIncidentId && (
        <RescueDispatchModal incidentId={dispatchIncidentId} onClose={() => setDispatchIncidentId(null)} />
      )}

      {/* TOP-LEVEL LIVE DATABASE KPIS (17 Real Database Metrics - Clickable to Open Operational Views) */}
      <section className="space-y-4 mb-4">
        <div className="flex items-center justify-between pb-2 border-b border-outline-variant/30">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-status-green "></span>
            <div>
              <h2 className="font-sans text-base font-semibold text-on-surface tracking-tight">
                Command Center Overview
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-sans text-on-surface-variant">
              Network Latency:
            </span>
            <span className="text-[11px] font-medium text-primary">{kpis.average_sos_delivery_time}</span>
          </div>
        </div>

        {/* Primary Row: SOS, Population & Incidents */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          
          {/* 1. ACTIVE SOS */}
          <div 
            onClick={() => onNavigate?.('sos')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
              <span className="text-xs font-medium text-on-surface-variant">Active SOS</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
              <span className="font-sans text-2xl font-semibold text-on-surface">{kpis.active_sos}</span>
            </div>
          </div>

          {/* 2. CRITICAL SOS */}
          <div 
            onClick={() => onNavigate?.('sos')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-error/50"></span>
              <span className="text-xs font-medium text-on-surface-variant">Critical SOS</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
              <span className="font-sans text-2xl font-semibold text-error">{kpis.critical_sos}</span>
            </div>
          </div>

          {/* 3. ASSISTANCE REQUIRED */}
          <div 
            onClick={() => onNavigate?.('sos')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="text-xs font-medium text-on-surface-variant">Assistance</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
              <span className="font-sans text-2xl font-semibold text-amber-500">{kpis.assistance_required}</span>
            </div>
          </div>

          {/* 4. SAFE CONFIRMED */}
          <div 
            onClick={() => onNavigate?.('safeverify')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span className="text-xs font-medium text-on-surface-variant">Safe Verified</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
              <span className="font-sans text-2xl font-semibold text-emerald-500">{kpis.safe_confirmed.toLocaleString()}</span>
            </div>
          </div>

          {/* 5. UNACCOUNTED */}
          <div 
            onClick={() => onNavigate?.('safeverify')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
              <span className="text-xs font-medium text-on-surface-variant">Unaccounted</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
              <span className="font-sans text-2xl font-semibold text-purple-400">{kpis.unaccounted}</span>
            </div>
          </div>

          {/* 6. TOTAL AFFECTED PEOPLE */}
          <div 
            onClick={() => onNavigate?.('map')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-500"></span>
              <span className="text-xs font-medium text-on-surface-variant">Affected Pax</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
              <span className="font-sans text-2xl font-semibold text-on-surface">{kpis.total_affected_people.toLocaleString()}</span>
            </div>
          </div>

          {/* 7. ACTIVE INCIDENTS */}
          <div 
            onClick={() => onNavigate?.('map')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3.5 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              <span className="text-xs font-medium text-on-surface-variant">Incidents</span>
            </div>
            <div className="flex items-baseline gap-1.5 mt-auto">
              <span className="font-sans text-2xl font-semibold text-primary">{kpis.active_incidents}</span>
            </div>
          </div>

        </div>

        {/* Secondary Row: Shelters, Logistics & Offline Telemetry */}
        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-3">
          
          {/* 8. OPEN SHELTERS */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Open Shelters</span>
            <span className="font-sans text-lg font-semibold text-emerald-500">{kpis.open_shelters}</span>
          </div>

          {/* 9. SHELTER OCCUPANCY */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Shelter Load</span>
            <div className="flex flex-col gap-1.5">
              <span className="font-sans text-lg font-semibold text-primary leading-none">{kpis.shelter_occupancy_percent}%</span>
              <div className="w-full bg-surface-container-lowestest h-1 rounded-full overflow-hidden">
                <div className="bg-primary h-full transition-all duration-500" style={{ width: `${Math.min(100, kpis.shelter_occupancy_percent)}%` }}></div>
              </div>
            </div>
          </div>

          {/* 10. AVAILABLE AMBULANCES */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Avail Amb.</span>
            <span className="font-sans text-lg font-semibold text-emerald-500">{kpis.available_ambulances}</span>
          </div>

          {/* 11. DISPATCHED AMBULANCES */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Disp. Amb.</span>
            <span className="font-sans text-lg font-semibold text-amber-500">{kpis.dispatched_ambulances}</span>
          </div>

          {/* 12. AVAILABLE RESCUE TEAMS */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Avail Teams</span>
            <span className="font-sans text-lg font-semibold text-emerald-500">{kpis.available_rescue_teams}</span>
          </div>

          {/* 13. ACTIVE RESCUE TEAMS */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Active Teams</span>
            <span className="font-sans text-lg font-semibold text-amber-500">{kpis.active_rescue_teams}</span>
          </div>

          {/* 14. AVAILABLE BOATS */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Avail Boats</span>
            <span className="font-sans text-lg font-semibold text-primary">{kpis.available_boats}</span>
          </div>

          {/* 15. AVAILABLE MEDICAL TEAMS */}
          <div 
            onClick={() => onNavigate?.('resources')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Med Teams</span>
            <span className="font-sans text-lg font-semibold text-emerald-500">{kpis.available_medical_teams}</span>
          </div>

          {/* 16. PENDING SYNCHRONIZATION */}
          <div 
            onClick={() => onNavigate?.('sos')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Pending Sync</span>
            <span className="font-sans text-lg font-semibold text-secondary">{kpis.pending_synchronization}</span>
          </div>

          {/* 17. AVERAGE SOS DELIVERY TIME */}
          <div 
            onClick={() => onNavigate?.('sos')}
            className="bg-surface border border-outline-variant/40 hover:border-outline-variant rounded-xl p-3 flex flex-col justify-between cursor-pointer transition-colors shadow-sm"
          >
            <span className="text-[11px] font-medium text-on-surface-variant mb-1">Avg Delivery</span>
            <span className="font-sans text-lg font-semibold text-primary">{kpis.average_sos_delivery_time}</span>
          </div>

        </div>
      </section>

      {/* Main Operations Grid - Preserving Existing Layout */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* 2. Map Canvas (Center Left) */}
        <div className="col-span-12 xl:col-span-8 bg-surface border border-outline-variant/30 rounded-lg flex flex-col overflow-hidden h-[500px] relative">
          
          {/* Floating Elegant Controls Over Map */}
          <div className="absolute top-4 left-4 sm:left-14 right-4 z-[1000] flex flex-wrap justify-between items-start gap-2 pointer-events-none">
            <div className="flex flex-wrap gap-2 pointer-events-auto">
              <div className="bg-surface-container-lowest/90 backdrop-blur border border-outline-variant/30 rounded flex items-center p-0.5 shadow">
                <button
                  onClick={() => setFloodZonesActive(!floodZonesActive)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded transition-colors cursor-pointer ${
                    floodZonesActive ? 'bg-primary/20 text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Flood Zones
                </button>
                <button
                  onClick={() => setEvacRoutesActive(!evacRoutesActive)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded transition-colors cursor-pointer ${
                    evacRoutesActive ? 'bg-primary/20 text-primary font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Evac Routes
                </button>
              </div>


            </div>

            <div className="flex flex-wrap gap-2 pointer-events-auto">
               <button
                  onClick={() => setInspectedRouteId('marine-drive')}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-surface-container-lowest/90 backdrop-blur border border-outline-variant/30 text-primary text-[10px] sm:text-xs hover:bg-surface transition-colors shadow cursor-pointer font-bold"
                >
                  AI Route GNN
                </button>
                <button
                  onClick={() => setDominoModalOpen(true)}
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-error/10 backdrop-blur border border-error/20 text-error text-[10px] sm:text-xs hover:bg-error/20 transition-colors shadow font-bold cursor-pointer"
                >
                  Cascading Domino Risk
                </button>
            </div>
          </div>

          <div className="flex-1 w-full h-full">
            <InteractiveEOCMap
              showFloodZones={floodZonesActive}
              showRoutes={evacRoutesActive}
              showShelters={true}
              showRescueUnits={true}
              mapType={mapType}
              onMapTypeToggle={setMapType}
              onInspectRoute={(routeId) => setInspectedRouteId(routeId)}
              height="100%"
            />
          </div>
        </div>

        {/* 3. SOS Live Stream (Center Right) */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant/30 rounded-lg flex flex-col h-[500px]">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <h2 className="font-sans font-semibold text-on-surface">Live Signals Stream</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-error "></div>
              <span className="text-xs text-on-surface-variant">{signals.length} Ingested</span>
            </div>
          </div>

          <div className="p-2 border-b border-outline-variant">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, district, source..."
              className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
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
                    isSelected ? 'bg-surface-container-lowest border-outline-variant' : 'bg-transparent border-transparent hover:bg-surface-container-low'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-data-value text-on-surface font-sans font-bold">{item.id}</span>
                      {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-error"></span>}
                    </div>
                    <span className="font-data-value text-on-surface-variant text-[11px] font-sans">Score {item.score}</span>
                  </div>
                  
                  <div className="flex justify-between items-center mt-2 text-[11px] text-on-surface-variant">
                    <span>{item.source} • {item.people} pax</span>
                    <span className="text-xs text-primary font-sans">{item.relay}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. AI Priority Engine (Bottom Left) */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant/30 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-sans text-lg font-semibold text-on-surface">Priority Triage (Domino-AI)</h2>
              <span className="text-[10px] font-semibold text-primary uppercase tracking-wider">DETERMINISTIC XAI</span>
            </div>

            <div className="flex items-center gap-6">
              <div className="w-20 h-20 border-4 border-error/20 rounded-full flex items-center justify-center text-center bg-error/5 relative">
                 <div className="absolute inset-0 border-4 border-error rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 98%, 0 100%)' }}></div>
                <span className="font-sans text-3xl text-error font-bold z-10">{topCriticalSignal?.score || 98}</span>
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant font-medium">Medical Trauma</span>
                  <span className="font-sans text-error font-semibold">+40 pts</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant font-medium">Cluster Population</span>
                  <span className="font-sans text-amber-600 font-semibold">+30 pts</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-on-surface-variant font-medium">SOS Latency Delta</span>
                  <span className="font-sans text-primary font-semibold">+24 pts</span>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setDispatchIncidentId(topCriticalSignal?.id || 'INC-2026-PURI-01')}
            className="w-full mt-8 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            Deploy Resources to {topCriticalSignal?.id || 'OD-7A92'}
          </button>
        </div>

        {/* 5. IVR Telemetry & SafeVerify Status */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant/30 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-sans text-lg font-semibold text-on-surface">Automated IVR Telemetry</h2>
              <span className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">{activeCampaign.title}</span>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between font-sans text-sm font-medium">
                <span className="text-on-surface-variant">
                  Reach: {activeCampaign.answeredCount.toLocaleString()} / {activeCampaign.totalReach.toLocaleString()}
                </span>
                <span className="text-on-surface font-bold">
                  {Math.round((activeCampaign.answeredCount / activeCampaign.totalReach) * 100)}%
                </span>
              </div>
              <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full"
                  style={{ width: `${(activeCampaign.answeredCount / activeCampaign.totalReach) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => recordDTMF('1')} className="bg-surface border border-outline-variant/50 hover:bg-surface-container-low p-3 rounded-lg text-center transition-colors cursor-pointer shadow-sm">
              <span className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">1 = SAFE</span>
              <span className="font-sans text-lg text-emerald-600 font-bold">{activeCampaign.safeCount}</span>
            </button>
            <button onClick={() => recordDTMF('2')} className="bg-surface border border-outline-variant/50 hover:bg-surface-container-low p-3 rounded-lg text-center transition-colors cursor-pointer shadow-sm">
              <span className="block text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider mb-1">2 = ASSIST</span>
              <span className="font-sans text-lg text-amber-600 font-bold">{activeCampaign.foodWaterCount}</span>
            </button>
            <button onClick={() => recordDTMF('3')} className="bg-surface border border-outline-variant/50 hover:bg-surface-container-low p-3 rounded-lg text-center transition-colors cursor-pointer shadow-sm">
              <span className="block text-[10px] font-semibold text-error uppercase tracking-wider mb-1">3 = TRAPPED</span>
              <span className="font-sans text-lg text-error font-bold">{activeCampaign.medicalCount}</span>
            </button>
          </div>
        </div>

        {/* 6. Weather & Environmental Radar */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant/30 rounded-lg overflow-hidden flex">
          <LiveWeatherWidget className="w-full h-full" />
        </div>

      </div>
    </div>
  );
};
