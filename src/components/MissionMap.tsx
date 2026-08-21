import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import { InteractiveEOCMap } from './map/InteractiveEOCMap';
import { AIRouteInspector } from './modules/AIRouteInspector';
import { RescueDispatchModal } from './dispatch/RescueDispatchModal';

export const MissionMap: React.FC = () => {
  const { signals } = useEOC();

  // Layer Toggles
  const [showSOS, setShowSOS] = useState(true);
  const [showIncidents, setShowIncidents] = useState(true);
  const [showAmbulances, setShowAmbulances] = useState(true);
  const [showRescueTeams, setShowRescueTeams] = useState(true);
  const [showBoats, setShowBoats] = useState(true);
  const [showMedicalTeams, setShowMedicalTeams] = useState(true);
  const [showRescueVehicles, setShowRescueVehicles] = useState(true);
  const [showShelters, setShowShelters] = useState(true);
  const [showEmergencyResources, setShowEmergencyResources] = useState(true);
  const [showDisasterZones, setShowDisasterZones] = useState(true);
  const [showFloodZones, setShowFloodZones] = useState(true);
  const [showRoutes, setShowRoutes] = useState(true);

  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(signals[0]?.id || 'INC-2026-PURI-01');
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [operationsPanelOpen, setOperationsPanelOpen] = useState(true);
  const [inspectedRouteId, setInspectedRouteId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'light' | 'dark' | 'satellite'>('dark');

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full w-full overflow-y-auto lg:overflow-hidden bg-background text-on-background relative">
      {/* AI Machine Learning Route Inspector Modal */}
      {inspectedRouteId && (
        <AIRouteInspector
          routeId={inspectedRouteId}
          onClose={() => setInspectedRouteId(null)}
        />
      )}

      {/* Authorized Rescue Dispatch Modal */}
      {deployModalOpen && (
        <RescueDispatchModal
          incidentId={selectedIncidentId || 'INC-2026-PURI-01'}
          onClose={() => setDeployModalOpen(false)}
        />
      )}

      {/* Map Canvas */}
      <div className="flex-1 relative bg-surface-container-lowest overflow-hidden min-h-[480px] lg:min-h-full" id="map-container">
        <InteractiveEOCMap
          showSOS={showSOS}
          showIncidents={showIncidents}
          showAmbulances={showAmbulances}
          showRescueTeams={showRescueTeams}
          showBoats={showBoats}
          showMedicalTeams={showMedicalTeams}
          showRescueVehicles={showRescueVehicles}
          showShelters={showShelters}
          showEmergencyResources={showEmergencyResources}
          showDisasterZones={showDisasterZones}
          showFloodZones={showFloodZones}
          showRoutes={showRoutes}
          mapType={mapType}
          onMapTypeToggle={setMapType}
          onInspectRoute={(routeId) => setInspectedRouteId(routeId)}
          height="100%"
        />

        {/* Floating Button to Reopen Operations Sidebar when closed */}
        {!operationsPanelOpen && (
          <button
            onClick={() => setOperationsPanelOpen(true)}
            className="absolute top-4 right-4 z-[400] bg-surface/95 hover:bg-surface-bright text-on-surface border border-outline-variant py-2 px-3 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-2 font-sans text-xs font-bold cursor-pointer transition-all hover:scale-[1.02]"
            title="Open Mission Operations Panel"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">view_sidebar</span>
            <span>Mission Operations</span>
            <span className="bg-secondary-container text-on-secondary-container px-1.5 py-0.2 rounded text-[10px]">
              {signals.length}
            </span>
          </button>
        )}

        {/* Tactical Legend (Floating Left) */}
        <div className="absolute top-4 left-4 bg-surface/95 border border-outline-variant/30 p-3.5 rounded-xl shadow-lg backdrop-blur-md z-[400] hidden sm:block max-w-[240px]">
          <div className="flex items-center justify-between border-b border-outline-variant/30 pb-2 mb-3">
            <h3 className="font-semibold text-on-surface text-[12px] flex items-center gap-2 font-sans tracking-tight">
              <span className="material-symbols-outlined text-primary text-[16px]">map</span>
              Map Legend
            </h3>
          </div>
          
          <div className="space-y-2.5 text-[11px] font-sans">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-error shadow-sm"></span>
              <span className="text-on-surface-variant font-medium">Live GPS Radar</span>
            </div>
            <div className="flex items-center gap-2.5">
              
              <span className="text-on-surface-variant font-medium">Stale GPS Location</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 border-[1.5px] border-primary rounded-full"></span>
              <span className="text-on-surface-variant font-medium">Incident Cluster</span>
            </div>
            <div className="flex items-center gap-2.5">
              
              <span className="text-on-surface-variant font-medium">Ambulances</span>
            </div>
            <div className="flex items-center gap-2.5">
              
              <span className="text-on-surface-variant font-medium">Rescue Teams</span>
            </div>
            <div className="flex items-center gap-2.5">
              
              <span className="text-on-surface-variant font-medium">Rescue Boats</span>
            </div>
            <div className="flex items-center gap-2.5">
              
              <span className="text-on-surface-variant font-medium">Medical Teams</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-sm bg-emerald-600 shadow-sm"></span>
              <span className="text-on-surface-variant font-medium">Shelter Network</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-blue-500/20 border border-blue-400/50 rounded-sm"></span>
              <span className="text-on-surface-variant font-medium">Flood / Surge Zone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Operations Panel Sidebar (Right Side on Desktop) */}
      {operationsPanelOpen && (
        <div className="w-full lg:w-[400px] bg-surface border-t lg:border-t-0 lg:border-l border-outline-variant flex flex-col h-auto lg:h-full z-20 overflow-y-auto shrink-0 animate-in fade-in duration-200">
          
          {/* Panel Header */}
          <div className="p-4 border-b border-outline-variant/50 sticky top-0 bg-surface/95 backdrop-blur-sm z-30 flex justify-between items-center">
            <div>
              <h2 className="font-sans font-semibold text-on-surface text-base tracking-tight">
                Mission Operations
              </h2>
              <p className="font-sans text-on-surface-variant text-[11px]">
                Odisha Coastal Sector ({signals.length} Active Signals)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDeployModalOpen(true)}
                className="bg-primary/10 text-primary border border-primary/20 font-semibold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 cursor-pointer hover:bg-primary/20 transition-colors"
              >
                Deploy
              </button>
              <button
                onClick={() => setOperationsPanelOpen(false)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Tactical Layers Selector */}
          <div className="p-4 border-b border-outline-variant/50 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-on-surface text-xs font-sans">
                Map Layers
              </h3>
              <span className="text-[10px] text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded">12 Active</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-sans">
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showSOS} onChange={(e) => setShowSOS(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Distress SOS</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showIncidents} onChange={(e) => setShowIncidents(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Incident Clusters</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showAmbulances} onChange={(e) => setShowAmbulances(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Ambulances</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showRescueTeams} onChange={(e) => setShowRescueTeams(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Rescue Teams</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showBoats} onChange={(e) => setShowBoats(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Rescue Boats</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showMedicalTeams} onChange={(e) => setShowMedicalTeams(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Medical Teams</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showRescueVehicles} onChange={(e) => setShowRescueVehicles(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Rescue Vehicles</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showShelters} onChange={(e) => setShowShelters(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Shelters</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showEmergencyResources} onChange={(e) => setShowEmergencyResources(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Supply Depots</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showDisasterZones} onChange={(e) => setShowDisasterZones(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Disaster Zones</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showFloodZones} onChange={(e) => setShowFloodZones(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Flood Polygons</span>
              </label>
              <label className="flex items-center gap-2 bg-surface hover:bg-surface-container-high p-1.5 rounded cursor-pointer transition-colors">
                <input type="checkbox" checked={showRoutes} onChange={(e) => setShowRoutes(e.target.checked)} className="rounded text-primary focus:ring-primary focus:ring-offset-surface cursor-pointer" />
                <span className="text-on-surface-variant">Evac Corridors</span>
              </label>
            </div>
          </div>

          {/* Active Distress Signals Ingestion Feed */}
          <div className="p-4 flex-1 space-y-4 bg-surface border-t border-outline-variant/30">
            <div className="flex items-center justify-between pb-1 border-b border-outline-variant/30">
              <h3 className="font-semibold text-on-surface text-sm font-sans flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-error">sensors</span>
                Active Distress Signals
              </h3>
              <span className="bg-error/10 text-error px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase">
                {signals.filter((s) => s.status === 'Critical' || s.severity === 'CRITICAL').length} Critical
              </span>
            </div>

            <div className="space-y-3">
              {signals.map((sig) => {
                const isSelected = selectedIncidentId === sig.id;
                const isCrit = sig.status === 'Critical' || sig.severity === 'CRITICAL';
                
                // Get the severity string and guarantee uppercase
                let sevText = (sig.severity || (isCrit ? 'CRITICAL' : 'HIGH')).toUpperCase();

                return (
                  <div 
                    key={sig.id}
                    onClick={() => setSelectedIncidentId(sig.id)}
                    className={`bg-surface border rounded-xl p-3.5 transition-all cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md ${
                      isSelected 
                        ? 'border-primary/50 ring-1 ring-primary/20 bg-primary/5' 
                        : 'border-outline-variant/40 hover:border-outline-variant'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${isCrit ? 'bg-error' : 'bg-amber-500'}`}></div>
                    <div className="pl-2">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-bold text-on-surface text-sm">
                          {sig.id} <span className="text-on-surface-variant font-medium text-xs ml-1.5">• {sig.loc}</span>
                        </span>
                        <span className={`font-bold text-[9px] px-2 py-0.5 rounded-sm tracking-wider ${isCrit ? 'bg-error/10 text-error border border-error/20' : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'}`}>
                          {sevText}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2.5 font-medium">
                        <span>{sig.lat.toFixed(4)}°, {sig.lng.toFixed(4)}°</span>
                        <span className="text-[10px] text-outline-variant">•</span>
                        <span className="text-primary bg-primary/5 px-1.5 py-0.5 rounded font-semibold">{sig.relay} (Hop {sig.hopCount || sig.hop || 1})</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-on-surface-variant pt-2.5 border-t border-outline-variant/30">
                        <span>Pax: <strong className="text-on-surface font-semibold">{sig.peopleCount || sig.people}</strong></span>
                        <span>Med: <strong className={sig.medicalRequired ? 'text-error font-semibold' : 'text-on-surface font-semibold'}>{sig.medicalRequired ? 'Yes' : 'No'}</strong></span>
                        <span className="text-primary font-bold">★ {sig.score || 94} Pts</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
