import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useSound } from './SoundContext';
import type { IncidentCluster, SafeVerifyRecord } from '../types/incident';
import type { RescueResource } from '../types/resource';

export interface RealtimeEvent {
  event_id: string;
  event_type: string;
  event_version: number;
  occurred_at: string;
  server_received_at?: string;
  user_id?: string;
  device_id?: string;
  sos_id?: string;
  incident_id?: string;
  campaign_id?: string;
  source: string;
  sequence?: number;
  payload: Record<string, any>;
}

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
  mode: 'AI_TRIAGE' | 'DTMF_LEGACY';
  audience: string;
  script: string;
  scheduledTime: string;
  totalReach: number;
  answeredCount: number;
  safeCount: number;
  trappedCount: number;
  medicalCount: number;
  foodWaterCount: number;
  // AI Voice Triage metrics
  aiTranscribedCount: number;
  p1CriticalCount: number;
  p2UrgentCount: number;
  p3ModerateCount: number;
  p4SafeCount: number;
}

export interface VoiceTriageResult {
  id: string;
  callId: string;
  citizenName: string;
  phone: string;
  district: string;
  locationName: string;
  language: string;
  rawTranscript: string;
  translatedTranscript: string;
  priority: 'P1_CRITICAL' | 'P2_URGENT' | 'P3_MODERATE' | 'P4_SAFE';
  sentiment: 'PANIC' | 'DISTRESSED' | 'CALM' | 'STABLE';
  extractedEntities: {
    peopleCount: number;
    landmark: string;
    threatType: 'FLOOD_INUNDATION' | 'ROOF_COLLAPSE' | 'MEDICAL_EMERGENCY' | 'ISOLATED_WITHOUT_FOOD' | 'SAFE_IN_SHELTER';
    medicalNeed: boolean;
    evacuationUrgency: 'IMMEDIATE' | 'HIGH' | 'ROUTINE' | 'NONE';
    coordinates: { lat: number; lng: number };
  };
  confidenceScore: number;
  audioDurationSeconds: number;
  status: 'ANALYZED' | 'DISPATCHED' | 'ACKNOWLEDGED' | 'RESOLVED';
  timestamp: string;
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
  realtimeEvents: RealtimeEvent[];
  sosList: any[];
  incidents: IncidentCluster[];
  resources: RescueResource[];
  shelters: ShelterFacility[];
  safeVerifyRecords: SafeVerifyRecord[];
  selectedSignalId: string | null;
  setSelectedSignalId: (id: string | null) => void;
  dispatchTeamToSignal: (signalId: string, teamName?: string) => void;
  acknowledgeSignal: (signalId: string) => Promise<void>;
  resolveSignal: (signalId: string) => void;
  injectNewSignal: (customSignal?: Partial<SOSSignal>) => void;
  injectSOS: (sos: any) => void;
  updateSOSState: (id: string, updates: any) => void;
  updateResourceState: (id: string, updates: any) => void;
  addSafeVerify: (record: any) => void;
  clearAllSOSLogs: () => Promise<void>;
  refetchSignals: () => Promise<void>;

  // Voice Campaigns & AI Voice Triage
  activeCampaign: VoiceCampaign;
  pastCampaigns: VoiceCampaign[];
  toggleCampaignPause: () => void;
  abortCampaign: () => void;
  createCampaign: (data: { title: string; audience: string; script: string; scheduledTime: string; mode?: 'AI_TRIAGE' | 'DTMF_LEGACY' }) => void;
  recordDTMF: (key: '1' | '2' | '3' | '4') => void;
  voiceTriageResults: VoiceTriageResult[];
  addVoiceTriageResult: (result: VoiceTriageResult) => void;
  dispatchRescueFromTriage: (triageId: string, teamName?: string) => void;
  simulateIncomingAITriageCall: () => void;

  // Shelters & Resources
  fleet: FleetStock;
  dispatchFleetToShelter: (shelterId: string, resourceType: string, quantity: number) => void;
  updateShelterOccupancy: (shelterId: string, deltaOccupancy: number) => void;
  exportSheltersCSV: () => void;

  // Alerts & Notifications
  activeAlert: StateAlert | null;
  raiseStateAlert: (severity: 'RED_CRITICAL' | 'ORANGE_WARNING' | 'YELLOW_WATCH', message: string) => void;
  broadcastSystemAlert: (severity: string, message: string) => Promise<void>;
  clearStateAlert: () => void;
  activeDisasterAlert: { text: string; severity: string } | null;
  clearDisasterAlert: () => void;
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



const EOCContext = createContext<EOCContextType | undefined>(undefined);

const mapDatabaseToSOSSignal = (row: any): SOSSignal => {
  const isCritical = (row.severityCode || row.severity_code || 0) >= 3 || row.medicalRequired || row.medical_required || row.severity === 'CRITICAL';
  const deliveryState = row.deliveryState || row.delivery_state || 'SERVER_RECEIVED';
  const statusMap: Record<string, any> = {
    'CLOSED': 'Resolved',
    'DISPATCHED': 'Dispatched',
    'ACKNOWLEDGED': 'Urgent'
  };
  const statusStr = statusMap[deliveryState] || (isCritical ? 'Critical' : 'Pending');
  const rawId = row.sosId || row.sos_id || row.id || `SOS-${Math.random().toString(36).substr(2, 6)}`;
  const rawCreatedAt = row.createdAt || row.created_at || row.payload?.createdAt || Date.now();
  const createdDate = new Date(rawCreatedAt);
  const now = Date.now();
  const diffSec = Math.floor((now - createdDate.getTime()) / 1000);
  const timeFormatted = diffSec < 60 ? 'Just now' : diffSec < 3600 ? `${Math.floor(diffSec / 60)}m ago` : createdDate.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';

  const rawUserName = row.userName || row.user_name || row.citizen_name || row.payload?.userName || row.payload?.user_name;
  const rawUserPhone = row.userPhone || row.user_phone || row.citizen_phone || row.payload?.userPhone || row.payload?.user_phone;
  const rawSource = (row.source || row.payload?.source || 'ANDROID').toUpperCase();
  const sourceName = rawSource === 'ANDROID' || rawSource === 'ANDROID_APP' ? 'Android App' : (rawSource === 'IVR' ? 'IVR Automated' : 'Mesh Relay');
  const sourceIcon = rawSource === 'ANDROID' || rawSource === 'ANDROID_APP' ? 'smartphone' : (rawSource === 'IVR' ? 'phone_in_talk' : 'bluetooth');

  return {
    id: rawId,
    timestamp: timeFormatted,
    createdAt: createdDate.toISOString(),
    status: statusStr,
    score: row.severityCode || row.severity_code ? 60 + ((row.severityCode || row.severity_code) * 10) : (isCritical ? 92 : 75),
    source: sourceName as any,
    sourceIcon: sourceIcon,
    people: `${row.peopleCount || row.people_count || row.payload?.people_count || 1} Persons`,
    peopleCount: row.peopleCount || row.people_count || row.payload?.people_count || 1,
    relay: (row.hopCount || row.hop_count || 0) > 0 ? 'Mesh Relay' : 'Direct Uplink (Realtime)',
    hop: row.hopCount || row.hop_count || 1,
    hopCount: row.hopCount || row.hop_count || 1,
    loc: `Lat: ${(row.latitude || row.lat || 19.8142)?.toFixed(4)}, Lng: ${(row.longitude || row.lng || 85.8315)?.toFixed(4)}`,
    lat: row.latitude || row.lat || 19.8142,
    lng: row.longitude || row.lng || 85.8315,
    district: row.district || 'Puri Sector',
    details: row.message || row.notes || row.payload?.message || (isCritical ? 'High-priority distress signal received from citizen device.' : 'Standard distress beacon broadcast.'),
    medicalRequired: row.medicalRequired || row.medical_required || false,
    severity: isCritical ? 'CRITICAL' : 'HIGH',
    color: statusStr === 'Resolved' ? 'border-outline-variant' : (isCritical ? 'border-error-container' : 'border-tertiary'),
    badgeBg: statusStr === 'Resolved' ? 'bg-surface-container-high' : (isCritical ? 'bg-error-container' : 'bg-tertiary-container'),
    badgeText: statusStr === 'Resolved' ? 'text-on-surface-variant' : (isCritical ? 'text-on-error-container' : 'text-on-tertiary-container'),
    scoreColor: statusStr === 'Resolved' ? 'text-on-surface-variant' : (isCritical ? 'text-error' : 'text-tertiary'),
    relayPath: (row.hopCount || row.hop_count || 0) > 0 ? [`Node ${row.deviceIdentifier || row.device_id || 'Repeater-01'}`, 'Gateway'] : ['Direct API Uplink'],
    userName: rawUserName || 'Citizen Alert',
    userPhone: rawUserPhone || '',
    contactPhone: rawUserPhone || ''
  };
};

export const EOCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [signals, setSignals] = useState<SOSSignal[]>([]);
  const [selectedSignalId, setSelectedSignalId] = useState<string | null>(null);
  const [shelters, setShelters] = useState<ShelterFacility[]>([]);
  const [incidents] = useState<IncidentCluster[]>([]);
  const [resources, setResources] = useState<RescueResource[]>([]);
  const [safeVerifyRecords, setSafeVerifyRecords] = useState<SafeVerifyRecord[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeAlert, setActiveAlert] = useState<StateAlert | null>(null);
  const [activeDisasterAlert, setActiveDisasterAlert] = useState<{ text: string; severity: string } | null>(null);
  const [autoSimulate, setAutoSimulate] = useState(false);

  const { playAlert, playSuccess } = useSound();

  const [fleet, setFleet] = useState<FleetStock>({
    boats: { total: 0, deployed: 0, ready: 0, maintenance: 0 },
    ambulances: { total: 0, deployed: 0, ready: 0, maintenance: 0 },
    foodPallets: { total: 0, deployed: 0, ready: 0 },
    teams: { total: 0, deployed: 0, ready: 0 }
  });

  const [activeCampaign, setActiveCampaign] = useState<VoiceCampaign>({
    id: 'CAMPAIGN-NONE',
    title: 'No Active Campaign',
    status: 'Completed',
    mode: 'AI_TRIAGE',
    audience: 'None',
    script: 'None',
    scheduledTime: new Date().toISOString(),
    totalReach: 0,
    answeredCount: 0,
    safeCount: 0,
    trappedCount: 0,
    medicalCount: 0,
    foodWaterCount: 0,
    aiTranscribedCount: 0,
    p1CriticalCount: 0,
    p2UrgentCount: 0,
    p3ModerateCount: 0,
    p4SafeCount: 0
  });

  const [voiceTriageResults, setVoiceTriageResults] = useState<VoiceTriageResult[]>([]);
  const [pastCampaigns, setPastCampaigns] = useState<VoiceCampaign[]>([]);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 4500);
  }, []);

  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvent[]>([]);

  const fetchSignals = useCallback(async () => {
    try {
      // Fetch latest active SOS signals ordered by newest first
      const { data, error } = await supabase
        .from('sos_events')
        .select('*')
        .order('createdAt', { ascending: false });

      if (data && !error) {
        setSignals(data.map(mapDatabaseToSOSSignal));
      } else {
        // Fallback try created_at lowercase column
        const { data: dataAlt } = await supabase
          .from('sos_events')
          .select('*')
          .order('created_at', { ascending: false });
        if (dataAlt) {
          setSignals(dataAlt.map(mapDatabaseToSOSSignal));
        }
      }
    } catch (err) {
      console.error('Error fetching signals:', err);
    }
  }, []);

  const refetchSignals = useCallback(async () => {
    await fetchSignals();
    showToast('🔄 Synchronized live SOS canonical logs with server.');
  }, [fetchSignals, showToast]);

  const clearAllSOSLogs = useCallback(async () => {
    try {
      setSignals([]);
      // Purge from Supabase sos_events table
      await supabase
        .from('sos_events')
        .delete()
        .neq('sosId', '00000000-0000-0000-0000-000000000000');
      showToast('🧹 Successfully purged all test / demo SOS telemetry records from database.');
    } catch (err: any) {
      console.warn('Cleared local SOS cache', err);
      setSignals([]);
      showToast('🧹 Local SOS cache reset.');
    }
  }, [showToast]);

  useEffect(() => {
    fetchSignals();

    // Initial fetch of recent Realtime Events
    const fetchRealtimeEvents = async () => {
      try {
        const { data, error } = await supabase
          .from('realtime_events')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(40);

        if (data && !error) {
          setRealtimeEvents(data);
        }
      } catch (err) {
        console.error('Error fetching realtime events:', err);
      }
    };
    fetchRealtimeEvents();

    // Subscribe to realtime_events table for instant cross-platform operational feed
    const eventSubscription = supabase
      .channel('realtime_events_stream')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'realtime_events' }, (payload) => {
        const newEvent = payload.new as RealtimeEvent;
        setRealtimeEvents((prev) => [newEvent, ...prev.slice(0, 49)]);
        
        if (newEvent.event_type === 'EMERGENCY_DISASTER_BROADCAST') {
          // Broadcast is targeted strictly for mobile citizen phones - do not interrupt EOC operator console
          console.log(`[EOC Broadcast Relay] Dispatched to mobile citizen devices: ${newEvent.payload.disaster_text}`);
        } else if (newEvent.event_type === 'SOS_CREATED' || newEvent.event_type === 'SOS_BACKEND_RECEIVED') {
          playAlert();
          showToast(`⚡ Inbound SOS Alert: Citizen ${newEvent.user_id || newEvent.sos_id?.slice(0, 8) || 'N/A'}`);
          
          // Ensure this signal is immediately added to signals list if not already present
          setSignals((prev) => {
            const exists = prev.some((s) => s.id === newEvent.sos_id);
            if (exists) return prev;
            const signalFromEvent = mapDatabaseToSOSSignal({
              sosId: newEvent.sos_id,
              createdAt: newEvent.occurred_at || newEvent.server_received_at,
              source: 'ANDROID',
              userName: newEvent.user_id || 'Citizen (App)',
              payload: newEvent.payload,
              ...newEvent.payload
            });
            return [signalFromEvent, ...prev];
          });
        }
      })
      .subscribe();

    // Subscribe to sos_events changes
    const subscription = supabase
      .channel('sos_events_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sos_events' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newSignal = mapDatabaseToSOSSignal(payload.new);
          setSignals((prev) => [newSignal, ...prev.filter((s) => s.id !== newSignal.id)]);
          setSelectedSignalId(newSignal.id);
          playAlert();
          showToast(`🔴 LIVE SOS Received: ${newSignal.userName} (${newSignal.id.slice(0, 8)})`);
        } else if (payload.eventType === 'UPDATE') {
          const updatedSignal = mapDatabaseToSOSSignal(payload.new);
          setSignals((prev) => prev.map((s) => (s.id === updatedSignal.id ? updatedSignal : s)));
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.sosId || payload.old?.sos_id || payload.old?.id;
          setSignals((prev) => prev.filter((s) => s.id !== deletedId));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(eventSubscription);
    };
  }, [playAlert, showToast]);

  const acknowledgeSignal = async (signalId: string) => {
    // Update local state optimistically
    setSignals((prev) =>
      prev.map((s) =>
        s.id === signalId
          ? {
              ...s,
              status: 'Urgent',
              color: 'border-primary',
              badgeBg: 'bg-primary-container',
              badgeText: 'text-on-primary-container',
              scoreColor: 'text-primary'
            }
          : s
      )
    );
    playSuccess();
    showToast(`Distress Signal #${signalId.slice(0, 8)} acknowledged by Operator.`);

    try {
      await supabase.from('sos_events').update({
        deliveryState: 'ACKNOWLEDGED',
        acknowledgedBy: 'OPERATOR-EOC-01',
        acknowledgedAt: Date.now()
      }).eq('sosId', signalId);
    } catch (e) {
      console.error('Error acknowledging signal:', e);
    }
  };

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

  const addVoiceTriageResult = (result: VoiceTriageResult) => {
    setVoiceTriageResults((prev) => [result, ...prev]);
    setActiveCampaign((prev) => {
      const updated = { ...prev };
      updated.answeredCount += 1;
      updated.aiTranscribedCount += 1;
      if (result.priority === 'P1_CRITICAL') {
        updated.p1CriticalCount += 1;
        updated.trappedCount += 1;
        if (result.extractedEntities.medicalNeed) updated.medicalCount += 1;
      } else if (result.priority === 'P2_URGENT') {
        updated.p2UrgentCount += 1;
        updated.foodWaterCount += 1;
      } else if (result.priority === 'P3_MODERATE') {
        updated.p3ModerateCount += 1;
      } else {
        updated.p4SafeCount += 1;
        updated.safeCount += 1;
      }
      return updated;
    });

    if (result.priority === 'P1_CRITICAL' || result.priority === 'P2_URGENT') {
      playAlert();
    } else {
      playSuccess();
    }
  };

  const dispatchRescueFromTriage = (triageId: string, teamName?: string) => {
    const triage = voiceTriageResults.find((r) => r.id === triageId);
    if (!triage) return;

    // Update status of the triage result
    setVoiceTriageResults((prev) =>
      prev.map((r) => (r.id === triageId ? { ...r, status: 'DISPATCHED' } : r))
    );

    // Inject as live high-priority SOSSignal into the GIS Mission Map
    const coords = triage.extractedEntities.coordinates || { lat: 20.9517, lng: 85.0985 };
    const effectiveTeam = teamName || 'ODRAF Team 4 (Quick Response)';

    injectNewSignal({
      id: `SOS-VT-${triage.id}`,
      status: triage.priority === 'P1_CRITICAL' ? 'Critical' : 'Urgent',
      score: triage.priority === 'P1_CRITICAL' ? 98 : 88,
      source: 'IVR System',
      sourceIcon: 'record_voice_over',
      people: `${triage.extractedEntities.peopleCount} Persons (${triage.citizenName})`,
      peopleCount: triage.extractedEntities.peopleCount,
      loc: triage.locationName,
      lat: coords.lat,
      lng: coords.lng,
      district: triage.district,
      details: `[AI Voice Triage - ${triage.language}] "${triage.translatedTranscript}" | Landmark: ${triage.extractedEntities.landmark}`,
      medicalRequired: triage.extractedEntities.medicalNeed,
      severity: triage.priority === 'P1_CRITICAL' ? 'CRITICAL' : 'HIGH',
      assignedTeam: effectiveTeam,
      etaMinutes: 12,
      userName: triage.citizenName,
      userPhone: triage.phone,
      contactPhone: triage.phone
    });

    playSuccess();
    showToast(`Rescue Unit Dispatched to ${triage.citizenName} (${triage.locationName}) via AI Voice Triage.`);
  };

  const simulateIncomingAITriageCall = () => {
    const simulatedPool: Partial<VoiceTriageResult>[] = [
      {
        citizenName: 'Birendra Pradhan',
        phone: '+91 97761-55823',
        district: 'Kendrapara',
        locationName: 'Pattamundai Block, Near High School',
        language: 'Standard Odia',
        rawTranscript: 'ସ୍କୁଲ ଛାତ ଉପରେ ୭ ଜଣ ବୟସ୍କ ଲୋକ ଫସିଛନ୍ତି, ତଳେ ୪ ଫୁଟ ବନ୍ୟା ଜଳ ଚାଲୁଛି, ଶୀଘ୍ର ଡଙ୍ଗା ପଠାନ୍ତୁ!',
        translatedTranscript: '7 elderly people trapped on school roof, 4 feet floodwater running below, please send rescue boat immediately!',
        priority: 'P1_CRITICAL',
        sentiment: 'PANIC',
        extractedEntities: {
          peopleCount: 7,
          landmark: 'High School Roof, Pattamundai Block',
          threatType: 'FLOOD_INUNDATION',
          medicalNeed: true,
          evacuationUrgency: 'IMMEDIATE',
          coordinates: { lat: 20.5732, lng: 86.5641 }
        },
        confidenceScore: 0.97,
        audioDurationSeconds: 16
      },
      {
        citizenName: 'Radheshyam Gupta',
        phone: '+91 88950-12847',
        district: 'Ganjam',
        locationName: 'Chhatrapur Town Market',
        language: 'Hindi',
        rawTranscript: 'दुकान की छत पर हम 3 लोग हैं, चारों तरफ पानी भर गया है पर अभी कोई घायल नहीं है।',
        translatedTranscript: 'We 3 are on shop roof, surrounded by water but no one is injured right now.',
        priority: 'P2_URGENT',
        sentiment: 'DISTRESSED',
        extractedEntities: {
          peopleCount: 3,
          landmark: 'Town Market Roof, Chhatrapur',
          threatType: 'ISOLATED_WITHOUT_FOOD',
          medicalNeed: false,
          evacuationUrgency: 'HIGH',
          coordinates: { lat: 19.3548, lng: 84.9892 }
        },
        confidenceScore: 0.93,
        audioDurationSeconds: 12
      },
      {
        citizenName: 'Laxmipriya Das',
        phone: '+91 79782-90114',
        district: 'Puri',
        locationName: 'Astaranga Coastal Belt',
        language: 'Sambalpuri Odia',
        rawTranscript: 'ଝଡ଼ ବର୍ଷା ବଢ଼ୁଛି, ଆମେ ୫ ଜଣ ପକ୍କା ଘରେ ସୁରକ୍ଷିତ ଅଛୁ, ଲାଇଟ୍ ନାହିଁ ବାସ୍।',
        translatedTranscript: 'Storm and rain is increasing, we 5 are safe in concrete house, only electricity is out.',
        priority: 'P4_SAFE',
        sentiment: 'CALM',
        extractedEntities: {
          peopleCount: 5,
          landmark: 'Concrete House, Astaranga Coastal Belt',
          threatType: 'SAFE_IN_SHELTER',
          medicalNeed: false,
          evacuationUrgency: 'NONE',
          coordinates: { lat: 19.9821, lng: 86.2713 }
        },
        confidenceScore: 0.96,
        audioDurationSeconds: 10
      }
    ];

    const randomPick = simulatedPool[Math.floor(Math.random() * simulatedPool.length)];
    const newResult: VoiceTriageResult = {
      id: `VT-${Math.floor(1000 + Math.random() * 9000)}`,
      callId: `CALL-EXO-${Math.floor(1000 + Math.random() * 9000)}`,
      citizenName: randomPick.citizenName || 'Citizen',
      phone: randomPick.phone || '+91 94370-00000',
      district: randomPick.district || 'Balasore',
      locationName: randomPick.locationName || 'Coastal Area',
      language: randomPick.language || 'Standard Odia',
      rawTranscript: randomPick.rawTranscript || 'Help needed',
      translatedTranscript: randomPick.translatedTranscript || 'Help needed',
      priority: randomPick.priority || 'P2_URGENT',
      sentiment: randomPick.sentiment || 'DISTRESSED',
      extractedEntities: randomPick.extractedEntities || {
        peopleCount: 3,
        landmark: 'Village Square',
        threatType: 'FLOOD_INUNDATION',
        medicalNeed: false,
        evacuationUrgency: 'HIGH',
        coordinates: { lat: 20.9517, lng: 85.0985 }
      },
      confidenceScore: randomPick.confidenceScore || 0.95,
      audioDurationSeconds: randomPick.audioDurationSeconds || 14,
      status: 'ANALYZED',
      timestamp: new Date().toISOString()
    };

    addVoiceTriageResult(newResult);
    showToast(`🎙️ AI Voice Triage: Transcribed call from ${newResult.citizenName} (${newResult.language}) - ${newResult.priority}`);
  };

  const createCampaign = ({
    title,
    audience,
    script,
    scheduledTime,
    mode = 'AI_TRIAGE'
  }: {
    title: string;
    audience: string;
    script: string;
    scheduledTime: string;
    mode?: 'AI_TRIAGE' | 'DTMF_LEGACY';
  }) => {
    const newCamp: VoiceCampaign = {
      id: `CAMPAIGN-${Date.now().toString().slice(-6)}`,
      title,
      audience,
      script,
      scheduledTime,
      status: 'Running',
      mode,
      totalReach: 15000,
      answeredCount: 0,
      safeCount: 0,
      trappedCount: 0,
      medicalCount: 0,
      foodWaterCount: 0,
      aiTranscribedCount: 0,
      p1CriticalCount: 0,
      p2UrgentCount: 0,
      p3ModerateCount: 0,
      p4SafeCount: 0
    };

    setPastCampaigns((prev) => [activeCampaign, ...prev]);
    setActiveCampaign(newCamp);
    playSuccess();
    showToast(`Campaign "${title}" live across ${audience} (${mode === 'AI_TRIAGE' ? 'AI Conversational Mode' : 'DTMF Mode'}).`);
  };

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

  const broadcastSystemAlert = async (severity: string, message: string) => {
    const code = severity === 'RED_CRITICAL' ? 5 : (severity === 'ORANGE_WARNING' ? 4 : 3);
    const sosId = crypto.randomUUID();
    
    const { error } = await supabase.from('sos_events').insert({
      sosId,
      createdAt: Date.now(),
      source: 'SYSTEM_ALERT',
      severityCode: code,
      message,
      peopleCount: 0,
      medicalRequired: false,
      hopCount: 0,
      ttl: 64,
      deliveryState: 'SERVER_RECEIVED',
      deviceIdentifier: 'EOC_DASHBOARD'
    });

    if (error) {
      console.error('Failed to broadcast alert:', error);
      showToast('Failed to broadcast system alert to devices.');
    } else {
      showToast(`System Alert successfully pushed to all devices.`);
    }
  };

  const clearStateAlert = () => {
    setActiveAlert(null);
    showToast('State emergency alert cleared.');
  };

  const clearDisasterAlert = () => {
    setActiveDisasterAlert(null);
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
  const totalAffectedCount = signals.reduce((acc, curr) => acc + (curr.peopleCount || 1), 0);
  const totalCapacity = shelters.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalOccupied = shelters.reduce((acc, curr) => acc + curr.occupied, 0);
  const sheltersOccupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  const stats = {
    activeSOS: activeSOSCount,
    criticalSOS: criticalCount,
    assistanceSOS: signals.filter((s) => s.status === 'Urgent' || s.status === 'Pending').length,
    trapped: signals.filter((s) => s.details?.toLowerCase().includes('trapped')).length,
    medical: signals.filter((s) => s.medicalRequired).length,
    safe: activeCampaign.safeCount,
    unaccounted: 0,
    totalAffected: totalAffectedCount,
    activeIncidents: incidents.length,
    sheltersCount: shelters.length,
    shelterOccupancy: sheltersOccupancyPercent,
    rescueTeams: fleet.teams.total,
    availableTeams: fleet.teams.ready,
    ambulances: fleet.ambulances.total,
    availableBoats: fleet.boats.ready,
    pendingSync: 0,
    avgDeliveryTime: signals.length > 0 ? '12s' : '0s'
  };

  return (
    <EOCContext.Provider
      value={{
        signals,
        realtimeEvents,
        sosList: signals,
        incidents,
        resources,
        shelters,
        safeVerifyRecords,
        selectedSignalId,
        setSelectedSignalId,
        dispatchTeamToSignal,
        acknowledgeSignal,
        resolveSignal,
        injectNewSignal,
        injectSOS,
        updateSOSState,
        updateResourceState,
        addSafeVerify,
        clearAllSOSLogs,
        refetchSignals,

        activeCampaign,
        pastCampaigns,
        toggleCampaignPause,
        abortCampaign,
        createCampaign,
        recordDTMF,
        voiceTriageResults,
        addVoiceTriageResult,
        dispatchRescueFromTriage,
        simulateIncomingAITriageCall,

        fleet,
        dispatchFleetToShelter,
        updateShelterOccupancy,
        exportSheltersCSV,

        activeAlert,
        raiseStateAlert,
        broadcastSystemAlert,
        clearStateAlert,
        activeDisasterAlert,
        clearDisasterAlert,
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
