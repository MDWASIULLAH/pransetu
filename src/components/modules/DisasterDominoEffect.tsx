import React, { useState } from 'react';

export interface DominoNode {
  id: string;
  category: 'INITIAL_EVENT' | 'INFRASTRUCTURE' | 'CRITICAL_LIFELINE' | 'HUMAN_HEALTH' | 'RELIEF_BOTTLENECK';
  title: string;
  severity: 'CRITICAL' | 'WARNING' | 'MONITORED';
  impactPercentage: number;
  description: string;
  affectedSector: string;
  mitigationAction: string;
  childrenIds: string[];
}

export const DOMINO_TREE: DominoNode[] = [
  {
    id: 'cyclone_surge',
    category: 'INITIAL_EVENT',
    title: 'Super Cyclone & Coastal Storm Surge (+3.2m)',
    severity: 'CRITICAL',
    impactPercentage: 94,
    description: 'Category 4 cyclonic landfall causing major coastal sea-water ingress across Puri & Paradeep lowlands.',
    affectedSector: 'Bay of Bengal Coastal Belt (Sectors 1 to 4)',
    mitigationAction: 'Activate Tier-1 coastal sea-wall floodgates & mandate 5km inland evacuation',
    childrenIds: ['power_grid_outage', 'road_inundation', 'telecom_mast_damage']
  },
  {
    id: 'power_grid_outage',
    category: 'INFRASTRUCTURE',
    title: 'OPTCL 220kV Grid Substation Submergence',
    severity: 'CRITICAL',
    impactPercentage: 88,
    description: 'Electrical transformer inundation cutting utility power to 420,000 households.',
    affectedSector: 'Puri District Central Transmission Grid',
    mitigationAction: 'Deploy 500kVA mobile diesel generators to emergency hospitals & water pump stations',
    childrenIds: ['hospital_generator_risk', 'water_purification_halt']
  },
  {
    id: 'road_inundation',
    category: 'INFRASTRUCTURE',
    title: 'Marine Drive & Kushabhadra Causeway Cutoff',
    severity: 'CRITICAL',
    impactPercentage: 82,
    description: 'Overtopping water level at +4.1m ASL blocking heavy rescue convoys to Konark Hub 04.',
    affectedSector: 'State Highway 316 & Coastal Arterial Corridor',
    mitigationAction: 'Divert convoys via Inland Gop-Kakatpur Bypass & deploy NDRF Inflatable Rescue Boats',
    childrenIds: ['relief_supply_bottleneck', 'evacuation_transit_delay']
  },
  {
    id: 'telecom_mast_damage',
    category: 'INFRASTRUCTURE',
    title: 'Cellular Tower Failure & Backhaul Severance',
    severity: 'WARNING',
    impactPercentage: 76,
    description: 'Commercial 4G/5G base stations knocked offline by 120km/h wind gusts.',
    affectedSector: 'Coastal Cellular Infrastructure',
    mitigationAction: 'Initialize PRANSETU LoRa Mesh Relay Nodes & activate citizen store-and-forward peer mesh',
    childrenIds: ['sos_communication_gap']
  },
  {
    id: 'hospital_generator_risk',
    category: 'CRITICAL_LIFELINE',
    title: 'Puri District Trauma Center ICU Fuel Threshold',
    severity: 'CRITICAL',
    impactPercentage: 90,
    description: 'Backup diesel reserves below 18 hours runtime for ventilator and neonatal wards.',
    affectedSector: 'Emergency Healthcare Facilities',
    mitigationAction: 'Fast-track priority green corridor emergency fuel tanker convoy escorted by police',
    childrenIds: ['trauma_care_jeopardy']
  },
  {
    id: 'water_purification_halt',
    category: 'CRITICAL_LIFELINE',
    title: 'Municipal Water Intake Contamination Risk',
    severity: 'WARNING',
    impactPercentage: 65,
    description: 'Saline water intrusion into freshwater treatment filtration lagoons.',
    affectedSector: 'Drinking Water Supply Grid',
    mitigationAction: 'Airdrop chlorine purification sachets & mobilize mobile RO filtration vehicles',
    childrenIds: ['waterborne_pathogen_risk']
  },
  {
    id: 'relief_supply_bottleneck',
    category: 'RELIEF_BOTTLENECK',
    title: 'Cyclone Shelter Ration & Medical Kit Depletion',
    severity: 'WARNING',
    impactPercentage: 70,
    description: 'Shelter Hub 03 capacity at 112% with dry food supplies dwindling.',
    affectedSector: 'Civil Supplies & Disaster Logistics',
    mitigationAction: 'Deploy heavy-lift drone pods for aerial payload delivery directly to shelter rooftops',
    childrenIds: []
  },
  {
    id: 'sos_communication_gap',
    category: 'HUMAN_HEALTH',
    title: 'Trapped Citizen Distress Isolation',
    severity: 'CRITICAL',
    impactPercentage: 85,
    description: 'Citizens unable to dial emergency 112 without cellular coverage.',
    affectedSector: 'Public Safety & Citizen Life Support',
    mitigationAction: 'PRANSETU multi-hop offline SOS broadcasting across citizen smartphones',
    childrenIds: []
  },
  {
    id: 'trauma_care_jeopardy',
    category: 'HUMAN_HEALTH',
    title: 'Critical Patient Life-Support Vulnerability',
    severity: 'CRITICAL',
    impactPercentage: 92,
    description: 'High mortality risk for 34 ICU patients if fuel logistics fail.',
    affectedSector: 'Trauma & Intensive Care Units',
    mitigationAction: 'Ambulance evacuation to AIIMS Bhubaneswar tertiary medical center via NH-16 corridor',
    childrenIds: []
  },
  {
    id: 'waterborne_pathogen_risk',
    category: 'HUMAN_HEALTH',
    title: 'Acute Waterborne Epidemic Threat',
    severity: 'MONITORED',
    impactPercentage: 45,
    description: 'Stagnant floodwater microbial proliferation if untreated within 48 hours.',
    affectedSector: 'Public Health & Sanitation',
    mitigationAction: 'Mass distribution of ORS packets & mobile water testing labs deployment',
    childrenIds: []
  },
  {
    id: 'evacuation_transit_delay',
    category: 'RELIEF_BOTTLENECK',
    title: 'Convoy Travel Time Increase (+45 mins)',
    severity: 'WARNING',
    impactPercentage: 60,
    description: 'Inland detour congestion slowing ambulance turnaround cycles.',
    affectedSector: 'First Responder Fleet Logistics',
    mitigationAction: 'Traffic police manual sequencing & dedicated single-lane rapid transit',
    childrenIds: []
  }
];

interface DisasterDominoEffectProps {
  onClose: () => void;
}

export const DisasterDominoEffect: React.FC<DisasterDominoEffectProps> = ({ onClose }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('cyclone_surge');

  const selectedNode = DOMINO_TREE.find((n) => n.id === selectedNodeId) || DOMINO_TREE[0];

  const getSeverityBadge = (sev: DominoNode['severity']) => {
    if (sev === 'CRITICAL') return 'bg-error/10 text-error border-error/20';
    if (sev === 'WARNING') return 'bg-secondary/10 text-secondary border-secondary/20';
    return 'bg-surface-container-lowest text-on-surface-variant border-outline-variant';
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in">
      <div className="bg-surface border border-outline-variant/30 rounded-lg w-full max-w-5xl shadow-sm max-h-[92vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-surface border-b border-outline-variant flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center text-error">
              <span className="material-symbols-outlined text-[24px]">account_tree</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-sans text-base sm:text-lg font-semibold text-on-surface">
                  Disaster Domino Effect: Multi-Hazard Cascading Risk
                </h3>
                <span className="bg-error/10 text-error text-[10px] font-sans font-medium px-2 py-0.5 rounded border border-error/20">
                  AI PREDICTION ACTIVE
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                Predictive consequence propagation analysis &amp; proactive lifeline protection
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface p-1 rounded hover:bg-surface-container-lowest cursor-pointer"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        {/* Interactive Cascading Graph Tree */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-5">
          {/* Main Initial Trigger Banner */}
          <div className="p-4 bg-surface-container-low rounded border border-outline-variant/30">
            <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-error" />
                <span className="text-xs font-sans font-semibold text-error uppercase">PRIMARY DISASTER TRIGGER</span>
              </div>
              <span className="text-xs font-sans text-on-surface-variant">Consequence Radius: 65km</span>
            </div>
            <h4 className="text-sm sm:text-base font-semibold text-on-surface mb-1">
              Super Cyclone Landfall &amp; Tidal Surge Ingress
            </h4>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              When a primary disaster strikes, secondary and tertiary lifelines fail in a predictable chain reaction (Power → Telecom → Healthcare → Logistics). PRANSETU models these cascading bottlenecks in advance so responders can deploy countermeasures before lifelines collapse.
            </p>
          </div>

          {/* 3 Tier Cascading Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Level 1: Primary Infrastructure Consequences */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="w-5 h-5 rounded bg-surface-container-lowest text-on-surface-variant flex items-center justify-center font-sans text-xs font-semibold">1</span>
                <span className="text-xs font-sans font-medium text-on-surface uppercase">Infrastructure Failures</span>
              </div>
              {DOMINO_TREE.filter((n) => n.category === 'INFRASTRUCTURE').map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    selectedNodeId === node.id
                      ? 'bg-surface-container-lowestest border-outline shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-medium text-xs text-on-surface leading-snug">{node.title}</span>
                    <span className={`text-[9px] font-sans px-1.5 py-0.5 rounded border font-medium uppercase shrink-0 ${getSeverityBadge(node.severity)}`}>
                      {node.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] font-sans text-on-surface-variant">
                    <span>Impact: {node.impactPercentage}%</span>
                    <span className="text-on-surface font-medium">Inspect →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Level 2: Critical Lifeline Disruptions */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="w-5 h-5 rounded bg-surface-container-lowest text-on-surface-variant flex items-center justify-center font-sans text-xs font-semibold">2</span>
                <span className="text-xs font-sans font-medium text-on-surface uppercase">Lifeline Disruptions</span>
              </div>
              {DOMINO_TREE.filter((n) => n.category === 'CRITICAL_LIFELINE' || n.category === 'RELIEF_BOTTLENECK').map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    selectedNodeId === node.id
                      ? 'bg-surface-container-lowestest border-outline shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-medium text-xs text-on-surface leading-snug">{node.title}</span>
                    <span className={`text-[9px] font-sans px-1.5 py-0.5 rounded border font-medium uppercase shrink-0 ${getSeverityBadge(node.severity)}`}>
                      {node.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] font-sans text-on-surface-variant">
                    <span>Impact: {node.impactPercentage}%</span>
                    <span className="text-on-surface font-medium">Inspect →</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Level 3: Human Health & Public Safety Impacts */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 pb-2 border-b border-outline-variant">
                <span className="w-5 h-5 rounded bg-surface-container-lowest text-on-surface-variant flex items-center justify-center font-sans text-xs font-semibold">3</span>
                <span className="text-xs font-sans font-medium text-on-surface uppercase">Health Vulnerabilities</span>
              </div>
              {DOMINO_TREE.filter((n) => n.category === 'HUMAN_HEALTH').map((node) => (
                <div
                  key={node.id}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-3 rounded border transition-all cursor-pointer ${
                    selectedNodeId === node.id
                      ? 'bg-surface-container-lowestest border-outline shadow-sm'
                      : 'bg-surface-container-low border-outline-variant hover:bg-surface-container-lowest'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1 gap-2">
                    <span className="font-medium text-xs text-on-surface leading-snug">{node.title}</span>
                    <span className={`text-[9px] font-sans px-1.5 py-0.5 rounded border font-medium uppercase shrink-0 ${getSeverityBadge(node.severity)}`}>
                      {node.severity}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2 text-[11px] font-sans text-on-surface-variant">
                    <span>Impact: {node.impactPercentage}%</span>
                    <span className="text-on-surface font-medium">Inspect →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Consequence Deep-Dive Card */}
          <div className="p-4 sm:p-5 bg-surface-container-low rounded border border-outline-variant/30 space-y-3">
            <div className="flex flex-wrap justify-between items-start gap-2">
              <div>
                <span className="text-[10px] font-sans uppercase tracking-wider text-on-surface-variant font-medium block">
                  SELECTED CASCADING NODE INSPECTION
                </span>
                <h4 className="text-sm sm:text-base font-semibold text-on-surface mt-0.5">
                  {selectedNode.title}
                </h4>
                <span className="text-xs text-on-surface-variant font-sans">
                  Affected Sector: {selectedNode.affectedSector}
                </span>
              </div>

              <span className={`px-2.5 py-1 rounded text-[10px] font-sans font-medium uppercase border ${getSeverityBadge(selectedNode.severity)}`}>
                Severity: {selectedNode.severity} ({selectedNode.impactPercentage}% Risk)
              </span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {selectedNode.description}
            </p>

            {/* Countermeasure Action */}
            <div className="p-3 bg-status-green/10 border border-status-green/20 rounded flex items-start gap-2.5">
              <span className="material-symbols-outlined text-emerald-600 text-[18px] shrink-0 mt-0.5">shield</span>
              <div>
                <span className="text-xs font-sans font-medium text-emerald-600 block uppercase">
                  PRANSETU Proactive Countermeasure / Action Protocol
                </span>
                <p className="text-xs text-on-surface mt-0.5">
                  {selectedNode.mitigationAction}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-surface border-t border-outline-variant flex justify-between items-center text-xs font-sans">
          <span className="text-on-surface-variant">
            ⚡ Algorithmic Dependency Graph: 11 Nodes Active
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-container-lowest text-on-surface font-medium rounded hover:bg-surface-container-lowestest cursor-pointer transition-colors border border-outline-variant/30"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
