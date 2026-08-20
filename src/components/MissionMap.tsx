import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import { InteractiveEOCMap } from './map/InteractiveEOCMap';

export const MissionMap: React.FC = () => {
  const { signals, fleet, dispatchTeamToSignal, showToast } = useEOC();

  const [floodZones, setFloodZones] = useState(true);
  const [evacShelters, setEvacShelters] = useState(true);
  const [evacRoutes, setEvacRoutes] = useState(true);
  const [rescueUnits, setRescueUnits] = useState(true);
  const [mapType, setMapType] = useState<'dark' | 'satellite'>('dark');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(signals[0]?.id || 'OD-7A92');
  const [deployModalOpen, setDeployModalOpen] = useState(false);
  const [operationsPanelOpen, setOperationsPanelOpen] = useState(true); // Close/open right sidebar
  const [teamSelection, setTeamSelection] = useState('NDRF-Alpha (Battalion 03)');
  const [assetType, setAssetType] = useState('Inflatable Rescue Boats (IRB)');

  const selectedIncident = signals.find((s) => s.id === selectedIncidentId) || signals[0];

  const handleDeploySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDeployModalOpen(false);
    if (selectedIncidentId) {
      dispatchTeamToSignal(selectedIncidentId, teamSelection);
    } else {
      showToast(`Dispatched ${teamSelection} with ${assetType} to Sector Alpha!`);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-full min-h-[calc(100vh-4rem)] w-full overflow-hidden bg-background text-on-background relative">
      {/* Deploy Assets Modal */}
      {deployModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined text-[26px]">rocket_launch</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">DEPLOY TACTICAL ASSETS</h3>
              </div>
              <button 
                onClick={() => setDeployModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDeploySubmit} className="mt-4 space-y-4">
              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Target Incident / GPS Coordinates
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={
                    selectedIncident
                      ? `${selectedIncident.id} (${selectedIncident.loc}) • GPS: ${selectedIncident.lat.toFixed(4)}, ${selectedIncident.lng.toFixed(4)}`
                      : 'Odisha Sector Alpha'
                  }
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-mono text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Select Rescue Battalion
                </label>
                <select 
                  value={teamSelection}
                  onChange={(e) => setTeamSelection(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="NDRF-Alpha (Battalion 03)">NDRF-Alpha (Battalion 03 - 24 Personnel)</option>
                  <option value="ODRAF-Bravo (Unit 07)">ODRAF-Bravo (Unit 07 - Quick Response)</option>
                  <option value="Odisha Fire & Disaster Maritime Unit">Odisha Fire &amp; Disaster Maritime Unit 2</option>
                  <option value="Indian Coast Guard Surface Team">Indian Coast Guard Surface Team</option>
                </select>
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Equipment / Asset Configuration
                </label>
                <select 
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Inflatable Rescue Boats (IRB) + Medical Kits">Inflatable Rescue Boats (IRB) + Medical Kits</option>
                  <option value="All-Terrain Amphibious Rescue Vehicle">All-Terrain Amphibious Rescue Vehicle</option>
                  <option value="LoRa Tactical Mesh Repeater Node">LoRa Tactical Mesh Repeater Node</option>
                  <option value="Heavy-Lift Drone Pods (Food & Life Jackets)">Heavy-Lift Drone Pods (Food &amp; Life Jackets)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setDeployModalOpen(false)}
                  className="px-4 py-2 bg-surface-bright border border-outline-variant text-on-surface rounded font-data-label text-data-label hover:bg-surface-container-highest cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-secondary text-on-secondary font-bold rounded-lg hover:bg-secondary-fixed transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Confirm Deployment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Map Canvas (Expands to 100% full width when operations panel is closed) */}
      <div className="flex-1 relative bg-surface-container-lowest overflow-hidden min-h-[480px] lg:min-h-full" id="map-container">
        {/* Real Interactive Leaflet Map with Live Cursor GPS Tracker */}
        <InteractiveEOCMap
          mapType={mapType}
          showFloodZones={floodZones}
          showShelters={evacShelters}
          showRoutes={evacRoutes}
          showRescueUnits={rescueUnits}
          height="100%"
        />

        {/* Floating Button to Reopen Operations Sidebar when closed */}
        {!operationsPanelOpen && (
          <button
            onClick={() => setOperationsPanelOpen(true)}
            className="absolute top-4 right-4 z-[400] bg-surface-container-high/95 hover:bg-surface-bright text-on-surface border border-outline-variant py-2 px-3 rounded-xl shadow-2xl backdrop-blur-md flex items-center gap-2 font-headline-sm text-xs font-bold cursor-pointer transition-all hover:scale-105"
            title="Open Mission Operations Panel"
          >
            <span className="material-symbols-outlined text-primary text-[18px]">view_sidebar</span>
            <span>Mission Operations</span>
            <span className="bg-secondary-container text-on-secondary-container px-1.5 py-0.2 rounded text-[10px]">
              {signals.length}
            </span>
          </button>
        )}

        {/* Map Legend (Floating) */}
        <div className="absolute top-4 left-4 bg-surface-container-high/90 border border-outline-variant p-3 sm:p-4 rounded-xl shadow-lg backdrop-blur-md z-[400] hidden sm:block">
          <h3 className="font-body-sm text-body-sm font-semibold text-on-surface mb-2 sm:mb-3 uppercase tracking-wider text-xs">
            Tactical Legend
          </h3>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-secondary-container"></span>
              <span className="font-data-label text-data-label text-on-surface-variant">SOS Beacon Cluster</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-primary-fixed bg-primary-fixed/30"></span>
              <span className="font-data-label text-data-label text-on-surface-variant">Flood Inundation Polygon</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-sm bg-green-500"></span>
              <span className="font-data-label text-data-label text-on-surface-variant">
                Active Units ({fleet.teams.deployed} Deployed)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Overlays / Sidebar Panel (Right Side on Desktop, Bottom on Mobile) */}
      {operationsPanelOpen && (
        <div className="w-full lg:w-96 bg-surface border-t lg:border-t-0 lg:border-l border-outline-variant flex flex-col h-auto lg:h-full z-20 overflow-y-auto shrink-0 animate-in fade-in duration-200">
          {/* Panel Header with Close Sidebar Button */}
          <div className="p-4 sm:p-5 border-b border-outline-variant sticky top-0 bg-surface/95 backdrop-blur-sm z-30 flex justify-between items-center">
            <div>
              <h2 className="font-headline-sm text-headline-sm text-on-surface text-base sm:text-lg font-bold">
                Mission Operations
              </h2>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                Odisha Sector Alpha ({signals.length} Active Targets)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setDeployModalOpen(true)}
                className="bg-secondary text-on-secondary font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1 cursor-pointer hover:bg-secondary-fixed"
                title="Deploy Assets"
              >
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                Deploy
              </button>

              {/* Close Operations Sidebar Button */}
              <button
                onClick={() => setOperationsPanelOpen(false)}
                className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-1.5 rounded-lg transition-colors cursor-pointer"
                title="Close Mission Operations Panel"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Map Layers Section */}
          <div className="p-4 sm:p-5 border-b border-outline-variant">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-body-lg text-body-lg font-semibold text-on-surface text-sm">
                Tactical Map Layers
              </h3>
              <span className="material-symbols-outlined text-on-surface-variant text-sm">layers</span>
            </div>

            <div className="space-y-3">
              {/* Basemap Style */}
              <div className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">public</span>
                  <span className="font-body-sm text-body-sm text-on-surface text-xs sm:text-sm">
                    Basemap GIS
                  </span>
                </div>
                <div className="flex items-center bg-surface-container-highest border border-outline-variant rounded p-0.5">
                  <button
                    onClick={() => setMapType('dark')}
                    className={`px-2 py-0.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                      mapType === 'dark' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Dark
                  </button>
                  <button
                    onClick={() => setMapType('satellite')}
                    className={`px-2 py-0.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                      mapType === 'satellite' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    Satellite
                  </button>
                </div>
              </div>

              {/* Flood Zones */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary-fixed">water</span>
                  <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors text-xs sm:text-sm">
                    Flood Zones
                  </span>
                </div>
                <div 
                  onClick={() => setFloodZones(!floodZones)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    floodZones ? 'bg-green-500/30 border border-green-500' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${
                    floodZones ? 'translate-x-5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'translate-x-0 bg-outline-variant'
                  }`} />
                </div>
              </label>

              {/* Evac Shelters */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-400">home_work</span>
                  <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors text-xs sm:text-sm">
                    Evac Shelters
                  </span>
                </div>
                <div 
                  onClick={() => setEvacShelters(!evacShelters)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    evacShelters ? 'bg-green-500/30 border border-green-500' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${
                    evacShelters ? 'translate-x-5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'translate-x-0 bg-outline-variant'
                  }`} />
                </div>
              </label>

              {/* Evac Routes */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-orange-400">conversion_path</span>
                  <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors text-xs sm:text-sm">
                    Evac Routes
                  </span>
                </div>
                <div 
                  onClick={() => setEvacRoutes(!evacRoutes)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    evacRoutes ? 'bg-green-500/30 border border-green-500' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${
                    evacRoutes ? 'translate-x-5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'translate-x-0 bg-outline-variant'
                  }`} />
                </div>
              </label>

              {/* Rescue Units */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-green-400">local_shipping</span>
                  <span className="font-body-sm text-body-sm text-on-surface group-hover:text-primary transition-colors text-xs sm:text-sm">
                    Deployed Units
                  </span>
                </div>
                <div 
                  onClick={() => setRescueUnits(!rescueUnits)}
                  className={`w-10 h-5 flex items-center rounded-full p-0.5 cursor-pointer transition-colors duration-200 ${
                    rescueUnits ? 'bg-green-500/30 border border-green-500' : 'bg-surface-container-highest border border-outline-variant'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full transition-transform duration-200 ${
                    rescueUnits ? 'translate-x-5 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]' : 'translate-x-0 bg-outline-variant'
                  }`} />
                </div>
              </label>
            </div>
          </div>

          {/* Active Incidents List */}
          <div className="p-4 sm:p-5 flex-1">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-body-lg text-body-lg font-semibold text-on-surface text-sm">
                Active Targets
              </h3>
              <span className="bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded text-xs font-bold">
                {signals.filter((s) => s.status === 'Critical').length} Critical
              </span>
            </div>

            <div className="space-y-3">
              {signals.map((sig) => {
                const isSelected = selectedIncidentId === sig.id;
                const isCrit = sig.status === 'Critical';

                return (
                  <div 
                    key={sig.id}
                    onClick={() => setSelectedIncidentId(sig.id)}
                    className={`bg-surface-container-high border rounded-xl p-3 sm:p-4 transition-colors cursor-pointer relative overflow-hidden ${
                      isSelected 
                        ? 'border-secondary ring-1 ring-secondary/50 bg-surface-bright' 
                        : 'border-outline-variant hover:border-secondary'
                    }`}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCrit ? 'bg-secondary-container' : 'bg-orange-500'}`}></div>
                    <div className="pl-2">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-body-sm text-body-sm font-semibold text-on-surface text-xs sm:text-sm">
                          {sig.loc}
                        </h4>
                        <span className={`font-data-label text-data-label font-bold text-[10px] sm:text-xs ${isCrit ? 'text-secondary' : 'text-orange-400'}`}>
                          {sig.status.toUpperCase()}
                        </span>
                      </div>
                      
                      {/* Prominent GPS Location Display */}
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-status-green font-bold mb-1.5">
                        <span className="material-symbols-outlined text-[13px] text-primary">my_location</span>
                        <span>GPS: {sig.lat.toFixed(4)}° N, {sig.lng.toFixed(4)}° E</span>
                      </div>

                      <p className="font-body-sm text-body-sm text-on-surface-variant mb-2 text-xs line-clamp-2">
                        {sig.details}
                      </p>
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-outline-variant text-xs">
                        <div>
                          <span className="block font-data-label text-data-label text-on-surface-variant text-[10px]">AFFECTED</span>
                          <span className="font-data-value text-data-value text-on-surface">{sig.people}</span>
                        </div>
                        <div>
                          <span className="block font-data-label text-data-label text-on-surface-variant text-[10px]">SCORE</span>
                          <span className="font-data-value text-data-value text-primary">{sig.score} Pts</span>
                        </div>
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
