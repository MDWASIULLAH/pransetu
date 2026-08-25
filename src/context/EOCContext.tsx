import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSound } from './SoundContext';
import type { IncidentCluster, SafeVerifyRecord } from '../types/incident';
import type { RescueResource } from '../types/resource';

export interface SOSSignal {
  id: string;
  deviceId?: string;
  timestamp: string;
  createdAt?: string;
  locationTimestamp?: string;
  status: 'Critical' | 'Urgent' | 'Pending' | 'Dispatched' | 'Resolved';
  score: number;
  source: 'Android App' | 'IVR System' | 'Mesh Relay' | 'SMS Gateway' | 'ANDROID' | 'IVR' | 'LORA_MESH' | 'SMS';
  sourceIcon: string;
  people: string;
  peopleCount: number;
  relay: string;
  hop: number;
  hopCount?: number;
  loc: string;
  lat: number;
  lng: number;
  district: string;
  details: string;
  medicalRequired?: boolean;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  assignedTeam?: string;
  etaMinutes?: number;
  color: string;
  badgeBg: string;
  badgeText: string;
  scoreColor: string;
  relayPath: string[];
  userName?: string;
  userPhone?: string;
  contactPhone?: string;
}

export interface VoiceCampaign {
  id: string;
  title: string;
  status: 'Running' | 'Paused' | 'Completed' | 'Aborted';
  audience: string;
  script: string;
  scheduledTime: string;
  totalReach: number;
  answeredCount: number;
  safeCount: number;
  trappedCount: number;
  medicalCount: number;
  foodWaterCount: number;
}

export interface ShelterFacility {
  id: string;
  name: string;
  zone: string;
  district: string;
  lat: number;
  lng: number;
  tier: string;
  tierColor: string;
  tierText: string;
  borderColor: string;
  occupancyColor?: string;
  capacity: number;
  occupied: number;
  drinkingWaterLiters: number;
  generatorStatus: string;
  medicalStaff: string;
  medicalCapability?: boolean;
  facilities?: string[];
  status: string;
}

export interface FleetStock {
  boats: { total: number; deployed: number; ready: number; maintenance: number };
  ambulances: { total: number; deployed: number; ready: number; maintenance: number };
  foodPallets: { total: number; deployed: number; ready: number };
  teams: { total: number; deployed: number; ready: number };
}

export interface StateAlert {
  active: boolean;
  severity: 'RED_CRITICAL' | 'ORANGE_WARNING' | 'YELLOW_WATCH';
  message: string;
  timestamp: string;
}

export interface EOCContextType {
  // Signals & SOS
  signals: SOSSignal[];
  sosList: any[];
  incidents: IncidentCluster[];
  resources: RescueResource[];
  shelters: ShelterFacility[];
  safeVerifyRecords: SafeVerifyRecord[];
  selectedSignalId: string | null;
  setSelectedSignalId: (id: string | null) => void;
  dispatchTeamToSignal: (signalId: string, teamName?: string) => void;
  resolveSignal: (signalId: string) => void;
  injectNewSignal: (customSignal?: Partial<SOSSignal>) => void;
  injectSOS: (sos: any) => void;
  updateSOSState: (id: string, updates: any) => void;
  updateResourceState: (id: string, updates: any) => void;
  addSafeVerify: (record: any) => void;

  // Voice Campaigns
  activeCampaign: VoiceCampaign;
  pastCampaigns: VoiceCampaign[];
  toggleCampaignPause: () => void;
  abortCampaign: () => void;
  createCampaign: (data: { title: string; audience: string; script: string; scheduledTime: string }) => void;
  recordDTMF: (key: '1' | '2' | '3' | '4') => void;

  // Shelters & Resources
  fleet: FleetStock;
  dispatchFleetToShelter: (shelterId: string, resourceType: string, quantity: number) => void;
  updateShelterOccupancy: (shelterId: string, deltaOccupancy: number) => void;
  exportSheltersCSV: () => void;

  // Alerts & Notifications
  activeAlert: StateAlert | null;
  raiseStateAlert: (severity: 'RED_CRITICAL' | 'ORANGE_WARNING' | 'YELLOW_WATCH', message: string) => void;
  clearStateAlert: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Simulation Engine
  autoSimulate: boolean;
  setAutoSimulate: React.Dispatch<React.SetStateAction<boolean>>;

  // Metrics & Stats
  metrics: {
    activeSOSCount: number;
    criticalCount: number;
    totalAffectedCount: number;
    sheltersOccupancyPercent: number;
    teamsDeployedCount: number;
    teamsTotalCount: number;
  };
  stats: {
    activeSOS: number;
    criticalSOS: number;
    assistanceSOS: number;
    trapped: number;
    medical: number;
    safe: number;
    unaccounted: number;
    totalAffected: number;
    activeIncidents: number;
    sheltersCount: number;
    shelterOccupancy: number;
    rescueTeams: number;
    availableTeams: number;
    ambulances: number;
    availableBoats: number;
    pendingSync: number;
    avgDeliveryTime: string;
  };
}



const initialShelters: ShelterFacility[] = [
  {
    id: 'SH-01',
    name: 'Cuttack Municipal High School',
    zone: 'Zone Alpha',
    district: 'Cuttack',
    lat: 20.4625,
    lng: 85.8830,
    tier: 'Tier 2 - Urgent',
    tierColor: 'bg-error-container text-on-error-container',
    tierText: 'Tier 2 - Urgent',
    borderColor: 'bg-error-container',
    occupancyColor: 'bg-error',
    capacity: 850,
    occupied: 782,
    drinkingWaterLiters: 4200,
    generatorStatus: 'Online (84% Tank)',
    medicalStaff: '2 Doctors, 6 Paramedics',
    medicalCapability: true,
    facilities: ['Water Rig', 'Food Depot', 'Ambulance Bay'],
    status: 'Active'
  },
  {
    id: 'SH-02',
    name: 'Bhubaneswar Indoor Stadium',
    zone: 'Zone Beta',
    district: 'Khordha',
    lat: 20.2961,
    lng: 85.8245,
    tier: 'Tier 1 - Basic',
    tierColor: 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
    tierText: 'Tier 1 - Basic',
    borderColor: 'bg-on-surface-variant',
    occupancyColor: 'bg-primary',
    capacity: 3200,
    occupied: 1440,
    drinkingWaterLiters: 16000,
    generatorStatus: 'Online (100% Grid & Diesel)',
    medicalStaff: '4 Doctors, 12 Nurses',
    medicalCapability: true,
    facilities: ['Helipad', 'Water Filtration', 'Full Kitchen'],
    status: 'Active'
  },
  {
    id: 'SH-03',
    name: 'Puri District Hospital Annexe',
    zone: 'Zone Delta',
    district: 'Puri',
    lat: 19.8135,
    lng: 85.8312,
    tier: 'Tier 3 - Critical',
    tierColor: 'bg-error text-on-error',
    tierText: 'Tier 3 - Critical',
    borderColor: 'bg-error',
    occupancyColor: 'bg-error',
    capacity: 450,
    occupied: 441,
    drinkingWaterLiters: 1800,
    generatorStatus: 'Warning (Low Fuel 22%)',
    medicalStaff: '6 Trauma Specialists, 14 Nurses',
    medicalCapability: true,
    facilities: ['ICU Backup', 'Trauma Unit', 'Oxygen Cylinders'],
    status: 'Critical'
  },
  {
    id: 'SH-04',
    name: 'Khurda Community Center',
    zone: 'Zone Gamma',
    district: 'Khordha',
    lat: 20.1824,
    lng: 85.6200,
    tier: 'Tier 1 - Basic',
    tierColor: 'bg-surface-container-high text-on-surface',
    tierText: 'Tier 1 - Basic',
    borderColor: 'bg-on-surface-variant',
    occupancyColor: 'bg-outline',
    capacity: 600,
    occupied: 72,
    drinkingWaterLiters: 3500,
    generatorStatus: 'Standby (Full Tank)',
    medicalStaff: '1 Doctor, 2 Nurses',
    medicalCapability: false,
    facilities: ['Dry Ration', 'Hand Pumps'],
    status: 'Standby'
  }
];

const mockIncidents: IncidentCluster[] = [
  {
    id: 'INC-018',
    district: 'Puri',
    lat: 19.8135,
    lng: 85.8312,
    radiusKm: 2.2,
    sosCount: 12,
    affectedPeople: 124,
    criticalCount: 4,
    medicalCount: 3,
    latestActivity: new Date().toISOString(),
    priorityScore: 94,
    priorityFactors: {
      medicalUrgency: 40,
      peopleAffected: 30,
      trapped: 20,
      hazardSeverity: 20,
      sosAge: 14,
      accessibility: 8
    },
    status: 'ACTIVE'
  },
  {
    id: 'INC-011',
    district: 'Cuttack',
    lat: 20.4625,
    lng: 85.8830,
    radiusKm: 1.8,
    sosCount: 6,
    affectedPeople: 48,
    criticalCount: 2,
    medicalCount: 2,
    latestActivity: new Date(Date.now() - 300000).toISOString(),
    priorityScore: 78,
    priorityFactors: {
      medicalUrgency: 25,
      peopleAffected: 20,
      trapped: 15,
      hazardSeverity: 15,
      sosAge: 10,
      accessibility: 5
    },
    status: 'ACTIVE'
  }
];

const mockResources: RescueResource[] = [
  { id: 'RES-T1', name: 'NDRF-Alpha (Battalion 03)', type: 'RESCUE_TEAM', status: 'AVAILABLE', members: 24, lat: 19.80, lng: 85.85 },
  { id: 'RES-T2', name: 'ODRAF-Bravo (Unit 07)', type: 'RESCUE_TEAM', status: 'EN_ROUTE', members: 16, lat: 19.81, lng: 85.84, assignedIncidentId: 'INC-018', etaMinutes: 14 },
  { id: 'RES-A1', name: 'ALS Ambulance Unit 12', type: 'AMBULANCE', status: 'AVAILABLE', medicalCapability: 'Advanced', lat: 19.84, lng: 85.81 },
  { id: 'RES-B1', name: 'Rescue Boat Flotilla 07', type: 'BOAT', status: 'AVAILABLE', capacity: 18, lat: 19.82, lng: 85.82 }
];

const EOCContext = createContext<EOCContextType | undefined>(undefined);

const mapDatabaseToSOSSignal = (row: any): SOSSignal => {
  const isCritical = row.severityCode >= 3 || row.medicalRequired;
  const statusMap: Record<string, any> = {
    'CLOSED': 'Resolved',
    'DISPATCHED': 'Dispatched',
    'ACKNOWLEDGED': 'Urgent'
  };
  const statusStr = statusMap[row.deliveryState] || (isCritical ? 'Critical' : 'Pending');

  return {
    id: row.sosId,
    timestamp: new Date(row.createdAt || Date.now()).toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
    status: statusStr,
    score: row.severityCode ? 60 + (row.severityCode * 10) : (isCritical ? 92 : 75),
    source: row.source === 'android_app' ? 'Android App' : 'Mesh Relay',
    sourceIcon: row.source === 'android_app' ? 'smartphone' : 'bluetooth',
    people: `${row.peopleCount || 1} Persons`,
    peopleCount: row.peopleCount || 1,
    relay: row.hopCount > 0 ? 'Mesh Relay' : 'Direct API',
    hop: row.hopCount || 1,
    hopCount: row.hopCount || 1,
    loc: `Lat: ${row.latitude?.toFixed(4)}, Lng: ${row.longitude?.toFixed(4)}`,
    lat: row.latitude || 19.8,
    lng: row.longitude || 85.8,
    district: 'Puri',
    details: row.message || (row.medicalRequired ? 'Medical emergency reported.' : 'Distress beacon received.'),
    medicalRequired: row.medicalRequired,
    severity: isCritical ? 'CRITICAL' : 'HIGH',
    color: statusStr === 'Resolved' ? 'border-outline-variant' : (isCritical ? 'border-error-container' : 'border-tertiary'),
    badgeBg: statusStr === 'Resolved' ? 'bg-surface-container-high' : (isCritical ? 'bg-error-container' : 'bg-tertiary-container'),
    badgeText: statusStr === 'Resolved' ? 'text-on-surface-variant' : (isCritical ? 'text-on-error-container' : 'text-on-tertiary-container'),
    scoreColor: statusStr === 'Resolved' ? 'text-on-surface-variant' : (isCritical ? 'text-error' : 'text-tertiary'),
    relayPath: row.hopCount > 0 ? [`Node ${row.deviceIdentifier || 'Unknown'}`, 'Gateway'] : ['Direct API'],
    userName: row.userName,
    userPhone: row.userPhone,
    contactPhone: row.userPhone
  };
};

export const EOCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [signals, setSignals] = useState<SOSSignal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [shelters, setShelters] = useState<ShelterFacility[]>(initialShelters);
  const [incidents] = useState<IncidentCluster[]>(mockIncidents);
  const [resources, setResources] = useState<RescueResource[]>(mockResources);
  const [safeVerifyRecords, setSafeVerifyRecords] = useState<SafeVerifyRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<StateAlert | null>(null);
  const [autoSimulate, setAutoSimulate] = useState(false);

  const { playAlert, playSuccess } = useSound();

  const [fleet, setFleet] = useState<FleetStock>({
    boats: { total: 120, deployed: 90, ready: 24, maintenance: 6 },
    ambulances: { total: 85, deployed: 75, ready: 10, maintenance: 0 },
    foodPallets: { total: 5000, deployed: 2000, ready: 3000 },
    teams: { total: 24, deployed: 18, ready: 6 }
  });

  const [activeCampaign, setActiveCampaign] = useState<VoiceCampaign>({
    id: 'CAMPAIGN-202608-A',
    title: 'Cyclone Alert - Puri District (Phase 1)',
    status: 'Running',
    audience: 'Coastal Districts (Puri, Ganjam, Balasore)',
    script: 'Cyclone Evacuation Notice v2',
    scheduledTime: new Date().toISOString(),
    totalReach: 45200,
    answeredCount: 30736,
    safeCount: 28450,
    trappedCount: 2481,
    medicalCount: 112,
    foodWaterCount: 620
  });

  const [pastCampaigns, setPastCampaigns] = useState<VoiceCampaign[]>([
    {
      id: 'CMP-202309-X',
      title: 'Flash Flood Advisory - Mahanadi Basin',
      status: 'Completed',
      audience: 'Cuttack & Kendrapara Lowlands',
      script: 'Flood Inundation Warning v1',
      scheduledTime: '2023-09-12 08:00',
      totalReach: 12400,
      answeredCount: 10416,
      safeCount: 10207,
      trappedCount: 209,
      medicalCount: 45,
      foodWaterCount: 164
    },
    {
      id: 'CMP-202308-A',
      title: 'Pre-Monsoon Preparedness Drill',
      status: 'Completed',
      audience: 'All Registered EWS Users',
      script: 'Early Check-in Survey',
      scheduledTime: '2023-08-04 18:30',
      totalReach: 8100,
      answeredCount: 5751,
      safeCount: 5751,
      trappedCount: 0,
      medicalCount: 0,
      foodWaterCount: 12
    }
  ]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  useEffect(() => {
    // Initial fetch of active SOS events
    const fetchSignals = async () => {
      const { data, error } = await supabase
        .from('sos_events')
        .select('*')
        .order('createdAt', { ascending: false });

      if (data && !error) {
        setSignals(data.map(mapDatabaseToSOSSignal));
      } else {
        console.error('Error fetching signals:', error);
      }
    };
    fetchSignals();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('sos_events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_events' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newSignal = mapDatabaseToSOSSignal(payload.new);
          setSignals((prev) => [newSignal, ...prev]);
          setSelectedSignalId(newSignal.id);
          playAlert();
          showToast(`Inbound SOS ${newSignal.id} — ${newSignal.loc}, ${newSignal.people}.`);
        } else if (payload.eventType === 'UPDATE') {
          const updatedSignal = mapDatabaseToSOSSignal(payload.new);
          setSignals((prev) => prev.map((s) => (s.id === updatedSignal.id ? updatedSignal : s)));
        } else if (payload.eventType === 'DELETE') {
          setSignals((prev) => prev.filter((s) => s.id !== payload.old.sosId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [playAlert, showToast]);

  const dispatchTeamToSignal = async (signalId: string, teamName = 'NDRF-Alpha (Battalion 03)') => {
    // Update local state optimistically
    setSignals((prev) =>
      prev.map((s) =>
        s.id === signalId
          ? {
              ...s,
              status: 'Dispatched',
              assignedTeam: teamName,
              etaMinutes: 14,
              scoreColor: 'text-tertiary',
              color: 'border-tertiary',
              badgeBg: 'bg-tertiary-container',
              badgeText: 'text-on-tertiary-container'
            }
          : s
      )
    );

    setFleet((prev) => ({
      ...prev,
      teams: {
        ...prev.teams,
        ready: Math.max(prev.teams.ready - 1, 0),
        deployed: Math.min(prev.teams.deployed + 1, prev.teams.total)
      }
    }));

    playSuccess();
    showToast(`Rescue Unit ${teamName} dispatched to signal ${signalId}! ETA: 14 min.`);

    // Persist to Supabase
    await supabase.from('sos_events').update({ deliveryState: 'DISPATCHED' }).eq('sosId', signalId);
  };

  const resolveSignal = async (signalId: string) => {
    // Update local state optimistically
    setSignals((prev) =>
      prev.map((s) =>
        s.id === signalId
          ? {
              ...s,
              status: 'Resolved',
              color: 'border-outline-variant',
              badgeBg: 'bg-surface-container-high',
              badgeText: 'text-on-surface-variant',
              scoreColor: 'text-on-surface-variant'
            }
          : s
      )
    );
    showToast(`Signal ${signalId} marked as Rescued & Verified Safe.`);

    // Persist to Supabase
    await supabase.from('sos_events').update({ deliveryState: 'CLOSED' }).eq('sosId', signalId);
  };

  const injectNewSignal = (customSignal?: Partial<SOSSignal>) => {
    const districts = ['Puri', 'Ganjam', 'Khordha', 'Cuttack', 'Balasore', 'Bhadrak'];
    const randomDistrict = districts[Math.floor(Math.random() * districts.length)];
    const randomHop = Math.floor(Math.random() * 4) + 1;
    const randomPeople = Math.floor(Math.random() * 8) + 2;
    const isCritical = Math.random() > 0.4;
    const newId = `OD-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSignal: SOSSignal = {
      id: newId,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      status: isCritical ? 'Critical' : 'Urgent',
      score: isCritical ? 92 + Math.floor(Math.random() * 7) : 70 + Math.floor(Math.random() * 15),
      source: Math.random() > 0.5 ? 'Mesh Relay' : 'Android App',
      sourceIcon: Math.random() > 0.5 ? 'bluetooth' : 'smartphone',
      people: `${randomPeople} Persons (${isCritical ? 'Medical Urgent' : 'Trapped Water Level'})`,
      peopleCount: randomPeople,
      relay: 'LoRa Mesh Ad-Hoc',
      hop: randomHop,
      loc: `${randomDistrict} Sector ${Math.floor(Math.random() * 6) + 1}`,
      lat: 19.8 + (Math.random() - 0.5) * 0.8,
      lng: 85.8 + (Math.random() - 0.5) * 0.8,
      district: randomDistrict,
      details: 'Automated distress beacon received via multi-hop offline relay chain.',
      color: isCritical ? 'border-error-container' : 'border-tertiary',
      badgeBg: isCritical ? 'bg-error-container' : 'bg-tertiary-container',
      badgeText: isCritical ? 'text-on-error-container' : 'text-on-tertiary-container',
      scoreColor: isCritical ? 'text-error' : 'text-tertiary',
      relayPath: [
        `Node #${Math.floor(Math.random() * 50)} (${randomDistrict} Suburb)`,
        `Relay Node Alpha-${Math.floor(Math.random() * 9)}`,
        'State Command EOC Gate'
      ],
      ...customSignal
    };

    setSignals((prev) => [newSignal, ...prev]);
    setSelectedSignalId(newSignal.id);
    playAlert();
    showToast(`Inbound SOS ${newSignal.id} — ${newSignal.loc}, ${newSignal.people}.`);
  };

  const injectSOS = (sos: any) => {
    injectNewSignal({
      id: sos.id || `OD-${Date.now().toString().slice(-4)}`,
      peopleCount: sos.peopleCount || 2,
      people: `${sos.peopleCount || 2} Persons`,
      details: sos.details || 'Injected test beacon',
      status: sos.severity === 'CRITICAL' ? 'Critical' : 'Urgent'
    });
  };

  const updateSOSState = (id: string, updates: any) => {
    setSignals((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const updateResourceState = (id: string, updates: any) => {
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const addSafeVerify = (record: any) => {
    setSafeVerifyRecords((prev) => [record, ...prev]);
    showToast(`Safe verification verified for citizen code ${record.citizenCode || 'CIT-1042'}`);
  };

  // Toasts stay outside the updater — StrictMode double-invokes updaters, which
  // fired these twice.
  const toggleCampaignPause = () => {
    const nextStatus = activeCampaign.status === 'Running' ? 'Paused' : 'Running';
    setActiveCampaign((prev) => ({ ...prev, status: nextStatus }));
    showToast(`Campaign ${activeCampaign.id} is now ${nextStatus}.`);
  };

  const abortCampaign = () => {
    setActiveCampaign((prev) => ({ ...prev, status: 'Aborted' }));
    showToast(`Campaign ${activeCampaign.id} aborted.`);
  };

  const createCampaign = ({
    title,
    audience,
    script,
    scheduledTime
  }: {
    title: string;
    audience: string;
    script: string;
    scheduledTime: string;
  }) => {
    const newCamp: VoiceCampaign = {
      id: `CAMPAIGN-${Date.now().toString().slice(-6)}`,
      title,
      audience,
      script,
      scheduledTime,
      status: 'Running',
      totalReach: 15000,
      answeredCount: 0,
      safeCount: 0,
      trappedCount: 0,
      medicalCount: 0,
      foodWaterCount: 0
    };

    setPastCampaigns((prev) => [activeCampaign, ...prev]);
    setActiveCampaign(newCamp);
    playSuccess();
    showToast(`Campaign "${title}" live across ${audience}.`);
  };

  // Keypad mapping is fixed by the IVR script the backend reads out
  // (backend/app/api/webhook.py): 1 safe, 2 assistance, 3 trapped, 4 medical.
  // One key, one counter — key 2 used to increment trappedCount as well, which
  // inflated the rescue-needed figure by every supply request.
  const recordDTMF = (key: '1' | '2' | '3' | '4') => {
    setActiveCampaign((prev) => {
      const updated = { ...prev };
      updated.answeredCount += 1;
      if (key === '1') updated.safeCount += 1;
      if (key === '2') updated.foodWaterCount += 1;
      if (key === '3') updated.trappedCount += 1;
      if (key === '4') updated.medicalCount += 1;
      return updated;
    });

    // Keys 3 and 4 are the two the script treats as critical, so both raise a
    // signal in the incoming stream rather than just a toast.
    if (key === '3' || key === '4') {
      injectNewSignal({
        status: 'Critical',
        score: key === '4' ? 96 : 88,
        source: 'IVR System',
        sourceIcon: 'dialpad',
        people: key === '4' ? '1 person — medical emergency' : '1 person — trapped',
        details:
          key === '4'
            ? 'Citizen reported a life-threatening medical emergency during the IVR check-in.'
            : 'Citizen reported being trapped and unable to evacuate during the IVR check-in.'
      });
    } else {
      playSuccess();
      showToast(
        key === '1'
          ? 'Response recorded — citizen confirmed safe'
          : 'Response recorded — citizen needs food or water'
      );
    }
  };

  const dispatchFleetToShelter = (shelterId: string, resourceType: string, quantity: number) => {
    setShelters((prev) =>
      prev.map((s) => {
        if (s.id === shelterId || s.name === shelterId) {
          return {
            ...s,
            drinkingWaterLiters:
              resourceType.includes('Water') ? s.drinkingWaterLiters + quantity * 500 : s.drinkingWaterLiters
          };
        }
        return s;
      })
    );

    setFleet((prev) => {
      const updated = { ...prev };
      if (resourceType.includes('Boat')) {
        updated.boats.ready = Math.max(updated.boats.ready - quantity, 0);
        updated.boats.deployed = Math.min(updated.boats.deployed + quantity, updated.boats.total);
      } else if (resourceType.includes('Ambulance')) {
        updated.ambulances.ready = Math.max(updated.ambulances.ready - quantity, 0);
        updated.ambulances.deployed = Math.min(updated.ambulances.deployed + quantity, updated.ambulances.total);
      } else if (resourceType.includes('Food')) {
        updated.foodPallets.ready = Math.max(updated.foodPallets.ready - quantity * 10, 0);
        updated.foodPallets.deployed += quantity * 10;
      }
      return updated;
    });

    playSuccess();
    showToast(`Dispatched ${quantity} × ${resourceType} to ${shelterId}.`);
  };

  const updateShelterOccupancy = (shelterId: string, delta: number) => {
    setShelters((prev) =>
      prev.map((s) => {
        if (s.id === shelterId || s.name === shelterId) {
          const newOcc = Math.max(0, Math.min(s.capacity, s.occupied + delta));
          const pct = Math.round((newOcc / s.capacity) * 100);
          return {
            ...s,
            occupied: newOcc,
            occupancyPercent: pct,
            tierText: pct > 90 ? 'Tier 3 - Critical' : pct > 70 ? 'Tier 2 - Urgent' : 'Tier 1 - Basic',
            tierColor: pct > 90 ? 'bg-error text-on-error' : pct > 70 ? 'bg-error-container text-on-error-container' : 'bg-surface-container-high text-on-surface-variant border border-outline-variant',
            borderColor: pct > 90 ? 'bg-error' : pct > 70 ? 'bg-error-container' : 'bg-on-surface-variant'
          };
        }
        return s;
      })
    );
  };

  const exportSheltersCSV = () => {
    const headers = 'Facility Name,District,Zone,Capacity,Occupied,Occupancy%,Medical Tier,Water (L),Generator,Status\n';
    const rows = shelters
      .map(
        (s) =>
          `"${s.name}","${s.district}","${s.zone}",${s.capacity},${s.occupied},${Math.round(
            (s.occupied / s.capacity) * 100
          )}%,"${s.tierText}",${s.drinkingWaterLiters},"${s.generatorStatus}","${s.status}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PRANSETU_S_Shelter_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded Odisha Shelter & Resource CSV log file.');
  };

  const raiseStateAlert = (
    severity: 'RED_CRITICAL' | 'ORANGE_WARNING' | 'YELLOW_WATCH',
    message: string
  ) => {
    setActiveAlert({
      active: true,
      severity,
      message,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false })
    });
    playAlert();
    showToast(`STATEWIDE EMERGENCY SIREN & IVR BROADCAST ACTIVE: ${message}`);
  };

  const clearStateAlert = () => {
    setActiveAlert(null);
    showToast('State emergency alert cleared.');
  };

  useEffect(() => {
    if (!autoSimulate) return;
    const interval = setInterval(() => {
      const simChoice = Math.random();
      if (simChoice < 0.45) {
        injectNewSignal();
      } else if (simChoice < 0.75) {
        recordDTMF(Math.random() > 0.2 ? '1' : Math.random() > 0.5 ? '2' : '3');
      } else {
        const randomShelter = shelters[Math.floor(Math.random() * shelters.length)];
        updateShelterOccupancy(randomShelter.id, Math.floor(Math.random() * 25) - 5);
      }
    }, 7000);

    return () => clearInterval(interval);
  }, [autoSimulate, shelters]);

  const activeSOSCount = signals.filter((s) => s.status !== 'Resolved').length;
  const criticalCount = signals.filter((s) => s.status === 'Critical').length;
  const totalAffectedCount = signals.reduce((acc, curr) => acc + curr.peopleCount, 1240);
  const totalCapacity = shelters.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalOccupied = shelters.reduce((acc, curr) => acc + curr.occupied, 0);
  const sheltersOccupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 68;

  const stats = {
    activeSOS: activeSOSCount,
    criticalSOS: criticalCount,
    assistanceSOS: 14,
    trapped: 9,
    medical: 6,
    safe: activeCampaign.safeCount,
    unaccounted: 61,
    totalAffected: totalAffectedCount,
    activeIncidents: incidents.length,
    sheltersCount: shelters.length,
    shelterOccupancy: sheltersOccupancyPercent,
    rescueTeams: fleet.teams.total,
    availableTeams: fleet.teams.ready,
    ambulances: fleet.ambulances.total,
    availableBoats: fleet.boats.ready,
    pendingSync: 23,
    avgDeliveryTime: '2m 14s'
  };

  return (
    <EOCContext.Provider
      value={{
        signals,
        sosList: signals,
        incidents,
        resources,
        shelters,
        safeVerifyRecords,
        selectedSignalId,
        setSelectedSignalId,
        dispatchTeamToSignal,
        resolveSignal,
        injectNewSignal,
        injectSOS,
        updateSOSState,
        updateResourceState,
        addSafeVerify,

        activeCampaign,
        pastCampaigns,
        toggleCampaignPause,
        abortCampaign,
        createCampaign,
        recordDTMF,

        fleet,
        dispatchFleetToShelter,
        updateShelterOccupancy,
        exportSheltersCSV,

        activeAlert,
        raiseStateAlert,
        clearStateAlert,
        toastMessage,
        showToast,

        autoSimulate,
        setAutoSimulate,

        metrics: {
          activeSOSCount,
          criticalCount,
          totalAffectedCount,
          sheltersOccupancyPercent,
          teamsDeployedCount: fleet.teams.deployed,
          teamsTotalCount: fleet.teams.total
        },
        stats
      }}
    >
      {children}
    </EOCContext.Provider>
  );
};

export const useEOC = () => {
  const context = useContext(EOCContext);
  if (!context) {
    throw new Error('useEOC must be used within an EOCProvider');
  }
  return context;
};
