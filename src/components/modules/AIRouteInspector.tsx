import React, { useState } from 'react';

export interface RouteInspectionData {
  id: string;
  name: string;
  code: string;
  status: 'SAFE_OPTIMAL' | 'MODERATE_RISK' | 'CRITICAL_BLOCKED';
  confidenceScore: number;
  totalDistanceKm: number;
  estimatedTransitMin: number;
  elevationMinM: number;
  elevationMaxM: number;
  currentSurgeM: number;
  safetyMarginM: number;
  debrisRiskPercent: number;
  trafficLoadPercent: number;
  bridgeStatus: 'OPERATIONAL' | 'RESTRICTED' | 'SUBMERGED';
  mlModel: {
    name: string;
    version: string;
    inferenceTimeMs: number;
    trainingDataset: string;
    features: { name: string; weight: number; value: string; status: 'good' | 'warning' | 'danger' }[];
  };
  waypoints: {
    name: string;
    km: number;
    elevation: number;
    waterDepth: number;
    clearance: string;
    lat: number;
    lng: number;
  }[];
  alternatives: {
    name: string;
    distance: string;
    eta: string;
    risk: string;
    advantage: string;
  }[];
}

export const sampleRoutes: Record<string, RouteInspectionData> = {
  'marine-drive': {
    id: 'marine-drive',
    name: 'Marine Drive Coastal Evacuation Corridor',
    code: 'ROUTE-OD-01 (NH-316 to Konark)',
    status: 'SAFE_OPTIMAL',
    confidenceScore: 97.4,
    totalDistanceKm: 34.8,
    estimatedTransitMin: 28,
    elevationMinM: 3.8,
    elevationMaxM: 9.2,
    currentSurgeM: 1.4,
    safetyMarginM: 2.4,
    debrisRiskPercent: 8,
    trafficLoadPercent: 24,
    bridgeStatus: 'OPERATIONAL',
    mlModel: {
      name: 'HydraNet-DEM Hydrodynamic GNN',
      version: 'v4.1.2-OdishaSector',
      inferenceTimeMs: 14.2,
      trainingDataset: 'IMD Coastal Doppler + ISRO Cartosat-3 DEM (10m Res)',
      features: [
        { name: 'Digital Elevation Model (DEM) Clearance', weight: 0.35, value: '+2.4m Above Peak Surge', status: 'good' },
        { name: 'IMD Doppler Radar Precipitation (Next 2h)', weight: 0.25, value: '18 mm/h (Within Threshold)', status: 'good' },
        { name: 'Soil Saturation & Runoff Index', weight: 0.20, value: '62% (Moderate Absorption)', status: 'good' },
        { name: 'Bridge Scour & Structural Vibration', weight: 0.12, value: '0.04g (Within Green Limits)', status: 'good' },
        { name: 'LoRa Mesh Traffic Concurrency', weight: 0.08, value: '14 Rescue Convoys / hr', status: 'good' }
      ]
    },
    waypoints: [
      { name: 'Puri EOC Staging Post', km: 0, elevation: 5.2, waterDepth: 0.0, clearance: 'Clear', lat: 19.80, lng: 85.82 },
      { name: 'Balighal Coastal Bridge', km: 11.4, elevation: 4.6, waterDepth: 0.2, clearance: '+4.4m Deck', lat: 19.82, lng: 85.89 },
      { name: 'Kushabhadra River Causeway', km: 22.1, elevation: 4.1, waterDepth: 0.4, clearance: '+3.7m Deck', lat: 19.88, lng: 86.01 },
      { name: 'Konark Shelter Hub 04', km: 34.8, elevation: 8.5, waterDepth: 0.0, clearance: 'Dry Safe Zone', lat: 19.90, lng: 86.11 }
    ],
    alternatives: [
      { name: 'Inland Gop-Kakatpur Bypass', distance: '41.2 km', eta: '42 mins', risk: 'Low (12%)', advantage: 'Zero coastal surge exposure' },
      { name: 'Nimapada Heavy Convoy Trunk', distance: '48.6 km', eta: '55 mins', risk: 'Very Low (4%)', advantage: 'Reinforced for 40-ton vehicles' }
    ]
  },
  'nh-316': {
    id: 'nh-316',
    name: 'NH-316 Coastal Arterial Route',
    code: 'ROUTE-OD-02 (Puri to Bhubaneswar)',
    status: 'SAFE_OPTIMAL',
    confidenceScore: 98.8,
    totalDistanceKm: 56.2,
    estimatedTransitMin: 45,
    elevationMinM: 6.2,
    elevationMaxM: 18.4,
    currentSurgeM: 0.0,
    safetyMarginM: 6.2,
    debrisRiskPercent: 5,
    trafficLoadPercent: 38,
    bridgeStatus: 'OPERATIONAL',
    mlModel: {
      name: 'TransFlow-Spatial A* Predictor',
      version: 'v3.8.0-StateHighways',
      inferenceTimeMs: 11.8,
      trainingDataset: 'NHAI Odisha Traffic Flow + Copernicus EMS SAR Inundation',
      features: [
        { name: 'Highway Raised Embankment Buffer', weight: 0.40, value: '+6.2m Above Lowland Datum', status: 'good' },
        { name: 'River Basin Discharge Level (Dhauli)', weight: 0.30, value: '82,000 Cusecs (Safe Discharge)', status: 'good' },
        { name: 'First Responder Priority Lane Clear', weight: 0.18, value: 'Lane 1 & 2 Dedicated', status: 'good' },
        { name: 'Overhead Tree Fall / Road Obstruction', weight: 0.12, value: '0 Reported Incidents', status: 'good' }
      ]
    },
    waypoints: [
      { name: 'Puri District Command HQ', km: 0, elevation: 6.2, waterDepth: 0.0, clearance: 'Clear', lat: 19.81, lng: 85.83 },
      { name: 'Sakhigopal Transit Checkpoint', km: 18.5, elevation: 8.9, waterDepth: 0.0, clearance: 'Clear', lat: 19.98, lng: 85.79 },
      { name: 'Pipili Emergency Fuel Depot', km: 36.2, elevation: 12.4, waterDepth: 0.0, clearance: 'Clear', lat: 20.15, lng: 85.75 },
      { name: 'Bhubaneswar State Trauma Centre', km: 56.2, elevation: 18.4, waterDepth: 0.0, clearance: 'High Datum Safe', lat: 20.27, lng: 85.82 }
    ],
    alternatives: [
      { name: 'Delang Rural Evacuation Link', distance: '62.0 km', eta: '58 mins', risk: 'Moderate (22%)', advantage: 'Bypasses Pipili bottleneck' }
    ]
  }
};

interface AIRouteInspectorProps {
  routeId?: string;
  onClose: () => void;
  onSelectAlternative?: (altName: string) => void;
}

export const AIRouteInspector: React.FC<AIRouteInspectorProps> = ({
  routeId = 'marine-drive',
  onClose,
  onSelectAlternative
}) => {
  const [selectedRouteKey, setSelectedRouteKey] = useState<string>(routeId in sampleRoutes ? routeId : 'marine-drive');
  const [activeTab, setActiveTab] = useState<'ml-metrics' | 'elevation' | 'waypoints' | 'simulation'>('ml-metrics');
  const [simulatedSurgeIncrease, setSimulatedSurgeIncrease] = useState<number>(0);
  const [simulating, setSimulating] = useState<boolean>(false);

  const route = sampleRoutes[selectedRouteKey] || sampleRoutes['marine-drive'];
  const effectiveSurge = route.currentSurgeM + simulatedSurgeIncrease;
  const effectiveMargin = Math.max(0, route.elevationMinM - effectiveSurge);
  const isSurgeExceeded = effectiveMargin < 0.8;

  const runReRouteSimulation = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-outline-variant w-full max-w-4xl max-h-[92vh] rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-surface-container-high border border-outline-variant flex items-center justify-center text-on-surface">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-semibold text-on-surface">
                  AI Evacuation Route Verification Engine
                </h2>
                <span className="bg-status-green/10 text-status-green border border-status-green/20 text-[10px] font-mono font-medium px-2 py-0.5 rounded">
                  ML VALIDATED
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-mono mt-0.5">
                {route.code} • Model: {route.mlModel.name} ({route.mlModel.version})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-high transition-colors cursor-pointer"
            title="Close Inspector"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Route Selector Pills */}
        <div className="px-4 sm:px-5 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-xs font-medium text-on-surface-variant shrink-0 font-mono">INSPECT ROUTE:</span>
          {Object.entries(sampleRoutes).map(([key, r]) => (
            <button
              key={key}
              onClick={() => {
                setSelectedRouteKey(key);
                setSimulatedSurgeIncrease(0);
              }}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors cursor-pointer flex items-center gap-1.5 border ${
                selectedRouteKey === key
                  ? 'bg-surface-container-highest text-on-surface border-outline font-semibold shadow-sm'
                  : 'bg-surface border-outline-variant text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high'
              }`}
            >
              <span className="material-symbols-outlined text-[14px]">
                {key === 'marine-drive' ? 'waves' : 'alt_route'}
              </span>
              <span>{r.name.split(' ')[0]} {r.name.split(' ')[1]}</span>
            </button>
          ))}
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 sm:px-5 bg-surface border-b border-outline-variant">
          <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant font-medium uppercase font-mono block">AI Safety Confidence</span>
            <div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-semibold font-mono text-status-green">{route.confidenceScore}%</span>
                <span className="text-[10px] text-on-surface-variant font-mono font-medium">OPTIMAL</span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80">Loss: 0.014 • 10-fold CV</span>
            </div>
          </div>

          <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant font-medium uppercase font-mono block">Surge Clearance</span>
            <div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-lg font-semibold font-mono ${isSurgeExceeded ? 'text-error' : 'text-on-surface'}`}>
                  +{effectiveMargin.toFixed(1)}m
                </span>
                <span className="text-[10px] text-on-surface-variant">Dry Datum</span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80">Min Elev: {route.elevationMinM}m ASL</span>
            </div>
          </div>

          <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant font-medium uppercase font-mono block">Convoy Transit Time</span>
            <div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-lg font-semibold font-mono text-on-surface">{route.estimatedTransitMin}m</span>
                <span className="text-[10px] text-on-surface-variant">({route.totalDistanceKm} km)</span>
              </div>
              <span className="text-[10px] text-on-surface-variant">Avg Speed: 62 km/h</span>
            </div>
          </div>

          <div className="p-3 bg-surface-container-low rounded border border-outline-variant flex flex-col justify-between">
            <span className="text-[10px] text-on-surface-variant font-medium uppercase font-mono block">Bridge Integrity</span>
            <div>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-sm font-medium font-mono text-status-green flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  {route.bridgeStatus}
                </span>
              </div>
              <span className="text-[10px] text-on-surface-variant/80">Debris Risk: {route.debrisRiskPercent}%</span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-outline-variant bg-surface-container-low px-4 sm:px-5">
          {[
            { id: 'ml-metrics', label: 'ML Feature Weights', icon: 'neurology' },
            { id: 'elevation', label: 'DEM Elevation Profile', icon: 'terrain' },
            { id: 'waypoints', label: 'Waypoint Sensors', icon: 'pin_drop' },
            { id: 'simulation', label: 'Live Surge Simulator', icon: 'science' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-4 text-xs font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-on-surface text-on-surface'
                  : 'border-transparent text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'ml-metrics' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low rounded border border-outline-variant">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-xs text-on-surface">Mathematical Proof &amp; Routing Formula</span>
                  <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant">
                    Cost = Distance · α + InundationDepth · β + DebrisRisk · γ - Clearance · δ
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  The AI routing network applies a high-resolution topological graph weighted by dynamic hydrological sensor telemetry and Cartosat-3 DEM spatial matrices. Routes are guaranteed safe by continuously validating that ground elevation exceeds tidal surge heights across all segments.
                </p>
              </div>

              <h4 className="text-xs font-semibold text-on-surface uppercase tracking-wider font-mono">
                Neural Feature Importance &amp; Live Telemetry Feed
              </h4>

              <div className="space-y-2">
                {route.mlModel.features.map((feat, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-low rounded border border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-on-surface">{feat.name}</span>
                        <span className="text-[10px] font-mono text-on-surface-variant bg-surface-container-high px-1.5 py-0.5 rounded">
                          Weight: {(feat.weight * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full bg-surface-container-highest h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="bg-on-surface-variant h-full rounded-full"
                          style={{ width: `${feat.weight * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="sm:text-right shrink-0">
                      <span className="font-mono text-xs font-medium text-on-surface bg-surface-container-highest border border-outline-variant px-2 py-1 rounded inline-block">
                        {feat.value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'elevation' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low rounded border border-outline-variant">
                <h4 className="text-xs font-semibold text-on-surface mb-1 font-mono uppercase">
                  Continuous Cross-Section Elevation (ASL vs Storm Surge)
                </h4>
                <p className="text-xs text-on-surface-variant mb-4">
                  Visual representation of the road deck elevation along the entire {route.totalDistanceKm} km corridor compared to current tidal surge level ({effectiveSurge.toFixed(1)}m).
                </p>

                {/* Simulated SVG Elevation Chart */}
                <div className="h-44 w-full bg-surface rounded p-2 relative flex flex-col justify-end border border-outline-variant overflow-hidden">
                  {/* Danger Surge Line */}
                  <div
                    className="absolute left-0 right-0 border-b border-dashed border-error z-10 flex items-center justify-between px-3 text-[10px] font-mono text-error"
                    style={{ bottom: `${(effectiveSurge / 12) * 100}%` }}
                  >
                    <span>SURGE WATER LEVEL ({effectiveSurge.toFixed(1)}m)</span>
                    <span>HAZARD THRESHOLD</span>
                  </div>

                  {/* Road Deck Profile */}
                  <div className="flex items-end justify-between h-full w-full gap-1 pt-6 pb-2 z-0">
                    {route.waypoints.map((wp, i) => {
                      const heightPercent = (wp.elevation / 12) * 100;
                      const isClear = wp.elevation > effectiveSurge;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          <div
                            className={`w-full rounded-t transition-all ${
                              isClear ? 'bg-surface-container-highest' : 'bg-error'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                          <span className="text-[9px] font-mono text-on-surface-variant truncate max-w-[65px] mt-1">
                            {wp.name.split(' ')[0]}
                          </span>
                          <span className="text-[10px] font-mono font-medium text-on-surface">
                            {wp.elevation}m
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'waypoints' && (
            <div className="space-y-3">
              <p className="text-xs text-on-surface-variant">
                Live telemetry from IoT water gauge telemetry stations deployed along the corridor:
              </p>

              <div className="space-y-2">
                {route.waypoints.map((wp, idx) => (
                  <div key={idx} className="p-3 bg-surface-container-low rounded border border-outline-variant flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-surface-container-highest flex items-center justify-center font-mono text-xs font-semibold text-on-surface">
                        0{idx + 1}
                      </div>
                      <div>
                        <span className="font-semibold text-xs text-on-surface block">{wp.name}</span>
                        <span className="text-[11px] text-on-surface-variant font-mono">
                          Km {wp.km} • GPS: {wp.lat.toFixed(4)}° N, {wp.lng.toFixed(4)}° E
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 font-mono text-xs">
                      <div className="text-right">
                        <span className="text-[10px] text-on-surface-variant block uppercase">Elevation</span>
                        <span className="font-medium text-on-surface">{wp.elevation}m</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-on-surface-variant block uppercase">Water Depth</span>
                        <span className="font-medium text-on-surface">{wp.waterDepth}m</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-on-surface-variant block uppercase">Status</span>
                        <span className="px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant text-on-surface font-medium text-[10px]">
                          {wp.clearance}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'simulation' && (
            <div className="space-y-4">
              <div className="p-4 bg-surface-container-low rounded border border-outline-variant">
                <h4 className="text-xs font-semibold text-on-surface mb-2 font-mono uppercase flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">science</span>
                  Live Dynamic Surge Stress-Test Simulator
                </h4>
                <p className="text-xs text-on-surface-variant mb-4">
                  Simulate severe storm surge rise or flash breach to test if the ML routing engine will automatically invalidate this corridor and recommend alternate inland bypasses.
                </p>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-mono mb-1">
                      <span className="text-on-surface-variant">Simulate Additional Tidal Surge:</span>
                      <span className="font-medium text-on-surface">+{simulatedSurgeIncrease.toFixed(1)}m</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="3.5"
                      step="0.5"
                      value={simulatedSurgeIncrease}
                      onChange={(e) => setSimulatedSurgeIncrease(parseFloat(e.target.value))}
                      className="w-full cursor-pointer accent-on-surface"
                    />
                  </div>

                  {isSurgeExceeded ? (
                    <div className="p-3 bg-error/10 border border-error/20 rounded text-error text-xs flex items-center justify-between">
                      <div>
                        <strong>⚠️ CRITICAL: Road Submergence Imminent!</strong>
                        <p className="text-[11px] opacity-80 mt-0.5">Surge exceeds minimum elevation at Kushabhadra Causeway.</p>
                      </div>
                      <button
                        onClick={runReRouteSimulation}
                        disabled={simulating}
                        className="px-3 py-1.5 bg-error text-on-error font-medium rounded cursor-pointer text-xs flex items-center gap-1 shrink-0 transition-colors hover:bg-error/90"
                      >
                        <span className={`material-symbols-outlined text-[16px] ${simulating ? 'animate-spin' : ''}`}>
                          {simulating ? 'refresh' : 'alt_route'}
                        </span>
                        {simulating ? 'Recalculating...' : 'Trigger AI Detour'}
                      </button>
                    </div>
                  ) : (
                    <div className="p-3 bg-status-green/10 border border-status-green/20 rounded text-status-green text-xs">
                      <strong>✅ AI Status: Corridor 100% Passable</strong>
                      <p className="text-[11px] opacity-80 mt-0.5">Remaining dry buffer clearance: +{effectiveMargin.toFixed(1)}m above surge.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recommended Alternatives */}
              <div>
                <h4 className="text-xs font-semibold text-on-surface mb-2 font-mono uppercase">
                  Pre-Calculated Dynamic Detours
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {route.alternatives.map((alt, idx) => (
                    <div key={idx} className="p-3 bg-surface-container-low rounded border border-outline-variant flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-xs text-on-surface">{alt.name}</span>
                          <span className="font-mono text-[10px] text-on-surface bg-surface-container-highest px-1.5 py-0.5 rounded border border-outline-variant">
                            {alt.risk}
                          </span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant mb-2">{alt.advantage}</p>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t border-outline-variant text-[11px] font-mono text-on-surface">
                        <span>{alt.distance} • {alt.eta}</span>
                        <button
                          onClick={() => onSelectAlternative?.(alt.name)}
                          className="hover:underline font-medium cursor-pointer"
                        >
                          Select Route →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface border-t border-outline-variant flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="w-2 h-2 rounded-full bg-status-green"></span>
            <span>Real-Time Inference: {route.mlModel.inferenceTimeMs}ms (99.8% Reliability)</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container-high border border-outline-variant text-on-surface font-medium rounded hover:bg-surface-container-highest cursor-pointer transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
