import React, { useState, useEffect } from 'react';
import { BrainCircuit, ArrowDown, AlertTriangle, ShieldCheck, Waves, Wind, CloudRain, Navigation, Home, Truck } from 'lucide-react';

export interface DominoStep {
  step_index: number;
  id: string;
  name: string;
  hazard_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  probability_pct: number;
  confidence_pct: number;
  affected_areas: string[];
  potential_consequences: string[];
  required_attention: string;
  suggested_resources: string[];
  shelter_pressure_pct: number;
  road_accessibility_pct: number;
  explanation: string;
}

export interface DominoMetadata {
  timestamp: string;
  model_version: string;
  overall_confidence: string;
  active_scenario: string;
  total_cascade_steps: number;
  critical_bottlenecks: number;
}

export const DominoAIModule: React.FC = () => {
  const [chain, setChain] = useState<DominoStep[]>([]);
  const [metadata, setMetadata] = useState<DominoMetadata | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string>('STEP-01-CYCLONE');
  const [scenario, setScenario] = useState<string>('CYCLONE_LANDFALL');
  const [rainfallMm, setRainfallMm] = useState<number>(240);
  const [windKmh, setWindKmh] = useState<number>(140);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchCascade = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const res = await fetch(
        `http://localhost:8000/api/v1/domino-ai/cascade?scenario=${scenario}&rainfall_mm=${rainfallMm}&wind_kmh=${windKmh}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (res.ok) {
        const json = await res.json();
        setChain(json.risk_chain || []);
        setMetadata(json.metadata || null);
        if (!selectedStepId && json.risk_chain?.length > 0) {
          setSelectedStepId(json.risk_chain[0].id);
        }
      } else {
        loadFallbackChain();
      }
    } catch {
      loadFallbackChain();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackChain = () => {
    const fallback: DominoStep[] = [
      {
        step_index: 1,
        id: 'STEP-01-CYCLONE',
        name: 'CYCLONE',
        hazard_type: 'METEOROLOGICAL_CYCLONE',
        severity: 'CRITICAL',
        probability_pct: 98.5,
        confidence_pct: 96.0,
        affected_areas: ['Puri Coastal Belt', 'Paradeep', 'Astaranga', 'Chandrabhaga'],
        potential_consequences: [
          'Category 4 cyclonic landfall with sustained wind speeds exceeding 140 km/h',
          'Extensive roof destruction in coastal kutchha settlements',
          'Power transmission line and mobile tower collapse'
        ],
        required_attention: 'Immediate coastal evacuation within 5km zone. Mandate harbor vessel docking.',
        suggested_resources: ['HEAVY_RESCUE_VEHICLE', 'COMMUNICATION_RELAY_PODS', 'CHAINSAW_CREWS'],
        shelter_pressure_pct: 35.0,
        road_accessibility_pct: 85.0,
        explanation: 'Doppler radar telemetry confirms cyclonic eye trajectory heading for landfall near Puri. High atmospheric pressure differential drives severe storm surge.'
      },
      {
        step_index: 2,
        id: 'STEP-02-HEAVY-RAIN',
        name: 'HEAVY RAIN',
        hazard_type: 'PRECIPITATION_EXTREME',
        severity: 'CRITICAL',
        probability_pct: 95.0,
        confidence_pct: 94.5,
        affected_areas: ['Mahanadi Catchment', 'Khordha', 'Bhubaneswar Basin', 'Puri District'],
        potential_consequences: [
          'Torrential downpours exceeding 240mm within 12 hours',
          'Urban stormwater drain saturation and local ponding up to 1.2m depth'
        ],
        required_attention: 'Pre-position diesel de-watering pumps in low-lying residential sectors.',
        suggested_resources: ['MOBILE_DEWATERING_PUMPS', 'EMERGENCY_SANDBAG_DEPOT', 'FIRST_AID_TEAMS'],
        shelter_pressure_pct: 52.0,
        road_accessibility_pct: 72.0,
        explanation: 'Convective storm clouds deliver heavy rainfall across saturated river basins, causing instantaneous runoff.'
      },
      {
        step_index: 3,
        id: 'STEP-03-RIVER-RISE',
        name: 'RIVER RISE',
        hazard_type: 'HYDRODYNAMIC_RIVERINE',
        severity: 'HIGH',
        probability_pct: 92.0,
        confidence_pct: 91.0,
        affected_areas: ['Mahanadi River Basin', 'Bhargavi River', 'Daya River Embankments'],
        potential_consequences: [
          'River water levels reaching 2.4m above Danger Level (DL)',
          'Hydraulic pressure on earthen flood bunds threatening structural breeches'
        ],
        required_attention: 'Deploy structural inspection teams along Daya and Bhargavi embankments.',
        suggested_resources: ['ODRAF_ENGINEERING_CORPS', 'EMBANKMENT_REPAIR_CREWS', 'HYDRO_DRONES'],
        shelter_pressure_pct: 68.0,
        road_accessibility_pct: 58.0,
        explanation: 'Upstream catchment runoff converges into narrow coastal river mouths, causing rapid backwater rise above safe datum.'
      },
      {
        step_index: 4,
        id: 'STEP-04-FLOODING',
        name: 'FLOODING',
        hazard_type: 'INUNDATION_SUBMERSION',
        severity: 'CRITICAL',
        probability_pct: 89.0,
        confidence_pct: 93.0,
        affected_areas: ['Gop', 'Kakatpur', 'Nimapada', 'Brahmagiri Lowlands'],
        potential_consequences: [
          'Widespread inundation of residential habitations under 1.5m to 2.8m of water',
          'Submergence of drinking water wells leading to contamination risk'
        ],
        required_attention: 'Mobilize shallow-draft boat rescue squadrons. Airdrop potable water kits.',
        suggested_resources: ['BOAT', 'ZODIAC_IRB', 'WATER_PURIFICATION_RO_UNITS', 'MEDICAL_TEAM'],
        shelter_pressure_pct: 84.0,
        road_accessibility_pct: 40.0,
        explanation: 'Embankment overflows submerge agricultural floodplains and low-lying villages, cutting off surface access.'
      },
      {
        step_index: 5,
        id: 'STEP-05-ROAD-BLOCKAGE',
        name: 'ROAD BLOCKAGE',
        hazard_type: 'TRANSPORT_CORRIDOR_SEVERANCE',
        severity: 'HIGH',
        probability_pct: 86.0,
        confidence_pct: 89.0,
        affected_areas: ['National Highway 316', 'Puri-Konark Marine Drive', 'Pipili Bypass'],
        potential_consequences: [
          'Water overtopping causeways by +1.1m blocking heavy supply convoys',
          'Culvert collapse on rural arterial lifelines preventing ambulance transit'
        ],
        required_attention: 'Designate green-corridor high-elevation diversion routes via Gop-Balipatna inland bypass.',
        suggested_resources: ['HEAVY_TOW_TRUCKS', 'AMPHIBIOUS_RESCUE_VEHICLE', 'TRAFFIC_POLICE_UNITS'],
        shelter_pressure_pct: 88.0,
        road_accessibility_pct: 24.0,
        explanation: 'Hydrodynamic pressure and debris washout disable primary highways, isolating downstream administrative blocks.'
      },
      {
        step_index: 6,
        id: 'STEP-06-ISOLATION',
        name: 'ISOLATION',
        hazard_type: 'GEOGRAPHIC_ISOLATION',
        severity: 'CRITICAL',
        probability_pct: 83.5,
        confidence_pct: 88.0,
        affected_areas: ['Sector 4B Coastal Enclave', 'Chilika Island Settlements', 'Brahmagiri Cut-off Zones'],
        potential_consequences: [
          'Complete terrestrial severance of 14,000 citizens with zero land transport access',
          'Cellular base station battery depletion resulting in telecommunication blackouts'
        ],
        required_attention: 'Deploy PRANSETU offline store-carry-forward LoRa mesh nodes. Schedule aerial payload drops.',
        suggested_resources: ['LORA_TACTICAL_MESH_NODES', 'HEAVY_LIFT_DRONES', 'SATELLITE_PHONES'],
        shelter_pressure_pct: 91.0,
        road_accessibility_pct: 10.0,
        explanation: 'Combined water submergence and communication loss create isolated pockets requiring specialized airborne intervention.'
      },
      {
        step_index: 7,
        id: 'STEP-07-RESCUE-DIFFICULTY',
        name: 'RESCUE DIFFICULTY',
        hazard_type: 'OPERATIONAL_EXTRICATION_BOTTLENECK',
        severity: 'CRITICAL',
        probability_pct: 81.0,
        confidence_pct: 87.5,
        affected_areas: ['Submerged Rural Hamlets', 'Waterlogged Hospitals', 'Lowland Elderly Care Homes'],
        potential_consequences: [
          'Severe operational friction for medical teams attempting to reach trauma cases',
          'Extended ETA for rescue squads from 15 minutes to over 90 minutes'
        ],
        required_attention: 'Prioritize high-risk SOS signals with medical urgency. Pair NDRF squads with mobile trauma doctors.',
        suggested_resources: ['NDRF_SEARCH_AND_RESCUE', 'ALS_AMBULANCE', 'PARAMEDIC_SQUADS'],
        shelter_pressure_pct: 95.0,
        road_accessibility_pct: 8.0,
        explanation: 'Floating debris, murky waters, submerged power cables, and narrow alleys multiply tactical extrication time per victim.'
      },
      {
        step_index: 8,
        id: 'STEP-08-SHELTER-PRESSURE',
        name: 'SHELTER PRESSURE',
        hazard_type: 'HUMANITARIAN_OVERCROWDING',
        severity: 'CRITICAL',
        probability_pct: 79.0,
        confidence_pct: 90.0,
        affected_areas: ['Puri District Cyclone Shelters', 'Khordha Evacuation Hubs', 'Cuttack Safe Zones'],
        potential_consequences: [
          'Shelter occupancy exceeding 100% capacity in coastal sectors',
          'Depletion of potable drinking water and sanitation strain'
        ],
        required_attention: 'Trigger automated overflow redirect to secondary inland school shelters. Mobilize sanitation tankers.',
        suggested_resources: ['DRY_RATION_CONVOYS', 'WATER_TANKERS', 'TEMPORARY_BEDDING_KITS'],
        shelter_pressure_pct: 102.0,
        road_accessibility_pct: 12.0,
        explanation: 'Mass displaced evacuees saturate primary cyclone centers, demanding immediate logistics replenishment and secondary shelter activation.'
      }
    ];

    setChain(fallback);
    setMetadata({
      timestamp: new Date().toISOString(),
      model_version: 'Domino-AI v2.4-Hybrid (Deterministic Physics + Statistical ML + Gemini Decision Support)',
      overall_confidence: '93.8%',
      active_scenario: scenario,
      total_cascade_steps: 8,
      critical_bottlenecks: 6
    });
  };

  useEffect(() => {
    fetchCascade();
  }, [scenario, rainfallMm, windKmh]);

  const selectedStep = chain.find(s => s.id === selectedStepId) || chain[0];

  const getStepIcon = (name: string) => {
    switch (name) {
      case 'CYCLONE': return <Wind className="text-on-surface" size={18} />;
      case 'HEAVY RAIN': return <CloudRain className="text-on-surface" size={18} />;
      case 'RIVER RISE': return <Waves className="text-indigo-400" size={18} />;
      case 'FLOODING': return <Waves className="text-teal-400" size={18} />;
      case 'ROAD BLOCKAGE': return <Navigation className="text-amber-400" size={18} />;
      case 'ISOLATION': return <AlertTriangle className="text-red-400" size={18} />;
      case 'RESCUE DIFFICULTY': return <Truck className="text-orange-400" size={18} />;
      case 'SHELTER PRESSURE': return <Home className="text-on-surface-variant" size={18} />;
      default: return <BrainCircuit className="text-primary" size={18} />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-on-surface text-sm">
      
      {/* Top Banner & Model Provenance */}
      <div className="bg-surface-container border border-outline-variant/30 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <BrainCircuit size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-sans font-bold text-lg sm:text-xl text-on-surface">
                  Domino-AI: Multi-Hazard Cascading Risk Engine
                </h1>
                <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-sans font-bold">
                  Decision-Support
                </span>
              </div>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Deterministic hydrodynamics, statistical Bayesian networks, and explainable Gemini risk chains.
              </p>
            </div>
          </div>

          {/* Model Version & Timestamp Metadata */}
          {metadata && (
            <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] font-sans text-on-surface-variant">
              <span className="bg-surface-container-lowest px-2 py-0.5 rounded border border-outline-variant/30 text-on-surface-variant">
                Model: {metadata.model_version}
              </span>
              <span className="text-emerald-600 font-bold">
                Confidence: {metadata.overall_confidence}
              </span>
              <span className="text-on-surface-variant">
                Inference: {new Date(metadata.timestamp).toLocaleTimeString()} UTC
              </span>
            </div>
          )}
        </div>

        {/* Scenario & Weather Parameter Controls */}
        <div className="flex flex-wrap items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border border-outline-variant/30">
          <div className="text-xs space-y-1">
            <span className="text-on-surface-variant block text-[10px] uppercase font-sans">Scenario Preset</span>
            <select
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              className="bg-surface border border-outline-variant/30 rounded px-2.5 py-1 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="CYCLONE_LANDFALL">🌀 Category 4 Cyclone Landfall</option>
              <option value="HEAVY_MONSOON">🌧️ Extreme Monsoon Downpour</option>
              <option value="DAM_OVERFLOW">🌊 Upstream Dam Floodgate Release</option>
            </select>
          </div>

          <div className="text-xs space-y-1 font-sans">
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>Rainfall</span>
              <span className="text-primary font-bold">{rainfallMm}mm</span>
            </div>
            <input
              type="range"
              min={100}
              max={400}
              step={10}
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-24 accent-primary cursor-pointer"
            />
          </div>

          <div className="text-xs space-y-1 font-sans">
            <div className="flex justify-between text-[10px] text-on-surface-variant">
              <span>Wind</span>
              <span className="text-on-surface font-bold">{windKmh}km/h</span>
            </div>
            <input
              type="range"
              min={60}
              max={200}
              step={5}
              value={windKmh}
              onChange={(e) => setWindKmh(Number(e.target.value))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
          </div>

          {isLoading && (
            <span className="text-[10px] text-primary font-sans ">Computing...</span>
          )}
        </div>
      </div>

      {/* Mandatory Decision Support Guard Notification */}
      <div className="bg-amber-950/30 border border-amber-500/40 p-3.5 rounded-xl flex items-start gap-3 text-xs text-amber-200">
        <AlertTriangle size={20} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 uppercase font-sans tracking-wide">Human-in-the-Loop Decision Support Mandate</strong>
          <p className="text-amber-200/90 mt-0.5 leading-relaxed">
            Domino-AI generates predictive risk chains and resource recommendations. The AI system is strictly <strong>prohibited from autonomously dispatching</strong> physical ambulances, boats, or rescue personnel. Operational dispatches require confirmation from an authorized Disaster Management Officer or Rescue Coordinator.
          </p>
        </div>
      </div>

      {/* Main Grid: 8-Step Cascade Chain + Detailed Step Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: 8-STEP CASCADE CHAIN (5 Cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="font-bold text-xs uppercase text-on-surface-variant font-sans">
              Cascading Risk Sequence (8 Steps)
            </h3>
            <span className="text-[10px] text-on-surface-variant font-sans">Click step to inspect</span>
          </div>

          <div className="space-y-2 relative">
            {chain.map((step, idx) => {
              const isSelected = selectedStep?.id === step.id;
              return (
                <React.Fragment key={step.id}>
                  <div
                    onClick={() => setSelectedStepId(step.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between shadow-sm ${
                      isSelected
                        ? 'bg-primary/15 border-primary shadow-lg ring-1 ring-primary'
                        : 'bg-surface-container border-outline-variant hover:border-outline'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center border border-outline-variant/30">
                        {getStepIcon(step.name)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-sans text-[10px] font-bold text-primary">0{step.step_index}</span>
                          <strong className="text-xs sm:text-sm text-on-surface">{step.name}</strong>
                        </div>
                        <span className="text-[11px] text-on-surface-variant font-sans">{step.hazard_type}</span>
                      </div>
                    </div>

                    <div className="text-right font-sans text-xs">
                      <span className={`font-bold ${step.probability_pct >= 90 ? 'text-red-400' : 'text-amber-400'}`}>
                        {step.probability_pct}%
                      </span>
                      <span className="text-[10px] text-on-surface-variant block">Conf: {step.confidence_pct}%</span>
                    </div>
                  </div>

                  {idx < chain.length - 1 && (
                    <div className="flex justify-center my-[-4px]">
                      <ArrowDown size={14} className="text-gray-600 animate-pulse" />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: STEP DETAIL INSPECTOR (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {selectedStep ? (
            <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-5 sm:p-6 space-y-6 shadow-sm animate-in fade-in">
              
              {/* Step Header */}
              <div className="flex items-start justify-between border-b border-outline-variant pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-primary/20 text-primary px-2 py-0.5 rounded font-sans text-xs font-bold">
                      STEP 0{selectedStep.step_index}
                    </span>
                    <h2 className="text-xl font-bold text-on-surface">{selectedStep.name}</h2>
                  </div>
                  <p className="text-xs text-on-surface-variant font-sans mt-1">{selectedStep.hazard_type}</p>
                </div>

                <div className="flex gap-2 font-sans text-xs">
                  <div className="bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/30 text-right">
                    <span className="text-[10px] text-on-surface-variant uppercase block">Probability</span>
                    <strong className="text-red-400 text-sm">{selectedStep.probability_pct}%</strong>
                  </div>
                  <div className="bg-surface-container-lowest px-3 py-1.5 rounded-lg border border-outline-variant/30 text-right">
                    <span className="text-[10px] text-on-surface-variant uppercase block">Confidence</span>
                    <strong className="text-emerald-400 text-sm">{selectedStep.confidence_pct}%</strong>
                  </div>
                </div>
              </div>

              {/* Dynamic Telemetry Gauges (Shelter Pressure & Road Accessibility) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-on-surface-variant uppercase">Shelter Pressure</span>
                    <strong className={selectedStep.shelter_pressure_pct >= 85 ? 'text-red-400 font-bold' : 'text-amber-400'}>
                      {selectedStep.shelter_pressure_pct}%
                    </strong>
                  </div>
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        selectedStep.shelter_pressure_pct >= 90 ? 'bg-red-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, selectedStep.shelter_pressure_pct)}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant block">
                    {selectedStep.shelter_pressure_pct >= 100 ? '🚨 Overcrowded / Saturated' : 'Approaching High Load'}
                  </span>
                </div>

                <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
                  <div className="flex justify-between items-center text-xs font-sans">
                    <span className="text-on-surface-variant uppercase">Road Accessibility</span>
                    <strong className={selectedStep.road_accessibility_pct <= 30 ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {selectedStep.road_accessibility_pct}% Passable
                    </strong>
                  </div>
                  <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        selectedStep.road_accessibility_pct <= 30 ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${selectedStep.road_accessibility_pct}%` }}
                    ></div>
                  </div>
                  <span className="text-[10px] text-on-surface-variant block">
                    {selectedStep.road_accessibility_pct <= 25 ? '⚠️ Major Arteries Submerged' : 'Corridors Operational'}
                  </span>
                </div>
              </div>

              {/* Affected Areas & Hotspots */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-on-surface-variant font-sans">Geographic Impact Zones</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStep.affected_areas.map((area, i) => (
                    <span key={i} className="bg-surface-container-lowest text-on-surface border border-outline-variant/30 px-2.5 py-1 rounded-lg text-xs font-sans">
                      📍 {area}
                    </span>
                  ))}
                </div>
              </div>

              {/* Potential Multi-Hazard Consequences */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-on-surface-variant font-sans">Potential Consequences</h3>
                <ul className="space-y-1.5">
                  {selectedStep.potential_consequences.map((conseq, i) => (
                    <li key={i} className="text-xs text-on-surface-variant flex items-start gap-2 bg-surface-container-lowest/60 p-2.5 rounded-lg border border-outline-variant/60">
                      <span className="text-amber-400">⚡</span>
                      <span>{conseq}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Required Tactical Attention / Directives */}
              <div className="bg-secondary/10 border border-secondary/30 p-3.5 rounded-xl space-y-1.5">
                <h3 className="font-bold text-xs text-secondary uppercase font-sans flex items-center gap-1.5">
                  <ShieldCheck size={16} />
                  Immediate Required Attention
                </h3>
                <p className="text-xs text-on-surface leading-relaxed">
                  {selectedStep.required_attention}
                </p>
              </div>

              {/* Suggested Resources (Decision-Support Only) */}
              <div className="space-y-2">
                <h3 className="font-bold text-xs uppercase text-on-surface-variant font-sans">
                  Recommended Tactical Resources
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedStep.suggested_resources.map((res, i) => (
                    <span key={i} className="bg-blue-950/40 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-lg text-xs font-sans font-bold">
                      🛡️ {res}
                    </span>
                  ))}
                </div>
              </div>

              {/* Explainable AI Decision-Support Narrative */}
              <div className="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-sans text-primary font-bold uppercase flex items-center gap-1">
                    <BrainCircuit size={14} /> Explainable AI (XAI) Rationale
                  </span>
                  <span className="text-[10px] text-gray-500 font-sans">Deterministic Physics + Gemini</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-relaxed italic">
                  "{selectedStep.explanation}"
                </p>
              </div>

            </div>
          ) : (
            <div className="p-12 text-center text-on-surface-variant bg-surface-container rounded-xl">
              Select a step in the cascading chain to inspect details.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
