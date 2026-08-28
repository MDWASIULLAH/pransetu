import React, { useState, useEffect } from 'react';
import { useEOC } from '../context/EOCContext';
import { InteractiveEOCMap } from './map/InteractiveEOCMap';
import { AIRouteInspector } from './modules/AIRouteInspector';
import { LiveWeatherWidget } from './modules/LiveWeatherWidget';
import { DisasterDominoEffect } from './modules/DisasterDominoEffect';
import { RescueDispatchModal } from './dispatch/RescueDispatchModal';
import { RegisteredCitizensWidget } from './modules/RegisteredCitizensWidget';
import { apiFetch, isBackendOffline } from '../services/api';

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
    realtimeEvents,
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
  const [speakingSignalId, setSpeakingSignalId] = useState<string | null>(null);

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

  const [feedLive, setFeedLive] = useState(false);

  // Poll the KPI endpoint, but back off instead of retrying every 3s forever when
  // the backend is down — that buried real errors under a wall of failed requests.
  useEffect(() => {
    let cancelled = false;
    let timer: number;

    const poll = async () => {
      let delay = 3000;
      try {
        const res = await apiFetch('/api/v1/command-center/kpis');
        const json = await res.json();
        if (!cancelled && json.data) {
          setKpis(json.data);
          setFeedLive(true);
        }
      } catch {
        if (!cancelled) setFeedLive(false);
        delay = isBackendOffline() ? 30000 : 5000;
      }
      if (!cancelled) timer = window.setTimeout(poll, delay);
    };

    poll();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const playSignalText = (signal: typeof signals[number], event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (!('speechSynthesis' in window)) {
      return;
    }

    if (speakingSignalId === signal.id) {
      window.speechSynthesis.cancel();
      setSpeakingSignalId(null);
      return;
    }

    const spokenText = signal.rawText || signal.details;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(spokenText);
    utterance.rate = 0.92;
    utterance.pitch = 1;
    utterance.onend = () => setSpeakingSignalId((current) => (current === signal.id ? null : current));
    utterance.onerror = () => setSpeakingSignalId((current) => (current === signal.id ? null : current));
    setSpeakingSignalId(signal.id);
    window.speechSynthesis.speak(utterance);
  };

  const topCriticalSignal = signals.find((s) => s.status === 'Critical') || signals[0];

  const filteredSignals = signals.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Triage weights, applied to the top signal's own fields. The gauge shows the
  // sum of these three, so the ring and the breakdown can never disagree —
  // previously the ring was a hardcoded 98% clip and the rows summed to 94.
  const triage = (() => {
    const medical = topCriticalSignal?.medicalRequired ? 40 : 0;
    const cluster = Math.min(30, Math.round((topCriticalSignal?.peopleCount ?? 0) * 2.5));
    const relayDelay = Math.min(30, (topCriticalSignal?.hopCount ?? 1) * 8);
    return {
      total: medical + cluster + relayDelay,
      factors: [
        { label: 'Medical need', points: medical },
        { label: `Cluster size (${topCriticalSignal?.peopleCount ?? 0})`, points: cluster },
        { label: `Relay delay (${topCriticalSignal?.hopCount ?? 1} hops)`, points: relayDelay }
      ]
    };
  })();

  const headline = [
    {
      label: 'Active SOS',
      value: kpis.active_sos,
      tone: 'text-on-surface',
      note: `${kpis.assistance_required} awaiting assistance`,
      to: 'sos'
    },
    {
      label: 'Critical',
      value: kpis.critical_sos,
      tone: 'text-error',
      note: 'medical or entrapment',
      to: 'sos'
    },
    {
      label: 'Unaccounted',
      value: kpis.unaccounted,
      tone: 'text-on-surface',
      note: `${kpis.safe_confirmed.toLocaleString()} confirmed safe`,
      to: 'safeverify'
    },
    {
      label: 'Affected population',
      value: kpis.total_affected_people,
      tone: 'text-on-surface',
      note: `across ${kpis.active_incidents} incidents`,
      to: 'map'
    }
  ];

  const logistics: { label: string; value: number | string; of?: number; tone: string; to: string }[] = [
    { label: 'Shelters open', value: kpis.open_shelters, tone: 'text-on-surface', to: 'resources' },
    { label: 'Ambulances', value: kpis.available_ambulances, of: kpis.available_ambulances + kpis.dispatched_ambulances, tone: 'text-on-surface', to: 'resources' },
    { label: 'Rescue teams', value: kpis.available_rescue_teams, of: kpis.available_rescue_teams + kpis.active_rescue_teams, tone: 'text-on-surface', to: 'resources' },
    { label: 'Boats', value: kpis.available_boats, tone: 'text-on-surface', to: 'resources' },
    { label: 'Medical teams', value: kpis.available_medical_teams, tone: 'text-on-surface', to: 'resources' },
    {
      label: 'Pending sync',
      value: kpis.pending_synchronization,
      tone: kpis.pending_synchronization > 0 ? 'text-tertiary' : 'text-on-surface',
      to: 'sos'
    }
  ];

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

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 pb-3 border-b border-outline-variant">
          <div className="flex items-baseline gap-3">
            <h2 className="text-base font-semibold text-on-surface tracking-tight">Situation summary</h2>
            <span className="text-[11px] text-on-surface-variant">Cyclone response &middot; Coastal Odisha</span>
          </div>
          <div className="flex items-center gap-5 text-[11px]">
            <span className="text-on-surface-variant">
              Mesh delivery{' '}
              <span className="text-on-surface font-medium tabular-nums">{kpis.average_sos_delivery_time}</span>
            </span>
            <span className={`inline-flex items-center gap-1.5 ${feedLive ? 'text-secondary' : 'text-on-surface-variant'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${feedLive ? 'bg-secondary' : 'bg-outline'}`} />
              {feedLive ? 'Live feed' : 'Seed data — API offline'}
            </span>
          </div>
        </div>

        {/* The four figures the duty officer reports upward. Everything else is
            detail and lives in the strip below. */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-outline-variant rounded-lg bg-surface lg:divide-x lg:divide-outline-variant">
          {headline.map((m, i) => (
            <button
              key={m.label}
              onClick={() => onNavigate?.(m.to)}
              className={`text-left px-4 py-3.5 hover:bg-surface-container-high transition-colors ${
                i < 2 ? 'border-b border-outline-variant lg:border-b-0' : ''
              } ${i % 2 === 0 ? 'border-r border-outline-variant lg:border-r-0' : ''}`}
            >
              <span className="block text-[11px] text-on-surface-variant">{m.label}</span>
              <span className={`block mt-1 text-[26px] leading-none font-semibold tabular-nums ${m.tone}`}>
                {m.value.toLocaleString()}
              </span>
              <span className="block mt-1.5 text-[11px] text-on-surface-variant">{m.note}</span>
            </button>
          ))}
        </div>

        {/* Logistics readout. Dense on purpose — these get scanned, not studied. */}
        <div className="border border-outline-variant rounded-lg bg-surface px-4 py-3">
          <div className="flex flex-wrap items-start gap-x-7 gap-y-3">
            <div className="min-w-[116px]">
              <span className="block text-[10px] text-on-surface-variant">Shelter load</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-sm font-semibold text-on-surface tabular-nums">{kpis.shelter_occupancy_percent}%</span>
                <span className="text-[11px] text-on-surface-variant tabular-nums">
                  {kpis.total_shelter_occupancy.toLocaleString()}/{kpis.total_shelter_capacity.toLocaleString()}
                </span>
              </div>
              <div className="mt-1.5 h-1 w-full rounded-full bg-surface-container-high overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    kpis.shelter_occupancy_percent > 90 ? 'bg-error' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.min(100, kpis.shelter_occupancy_percent)}%` }}
                />
              </div>
            </div>

            {logistics.map((m) => (
              <button key={m.label} onClick={() => onNavigate?.(m.to)} className="text-left group">
                <span className="block text-[10px] text-on-surface-variant">{m.label}</span>
                <span className="mt-1 flex items-baseline gap-1">
                  <span className={`text-sm font-semibold tabular-nums ${m.tone}`}>{m.value}</span>
                  {m.of !== undefined && (
                    <span className="text-[11px] text-on-surface-variant tabular-nums">/ {m.of}</span>
                  )}
                </span>
                <span className="block mt-0.5 h-px w-full bg-transparent group-hover:bg-outline-variant transition-colors" />
              </button>
            ))}
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
                    floodZonesActive ? 'bg-primary/20 text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Flood Zones
                </button>
                <button
                  onClick={() => setEvacRoutesActive(!evacRoutesActive)}
                  className={`px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs rounded transition-colors cursor-pointer ${
                    evacRoutesActive ? 'bg-primary/20 text-on-primary-container font-bold' : 'text-on-surface-variant hover:text-on-surface'
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
                  className="px-2 sm:px-3 py-1 sm:py-1.5 rounded bg-error/10 backdrop-blur border border-error/20 text-on-error-container text-[10px] sm:text-xs hover:bg-error/20 transition-colors shadow font-bold cursor-pointer"
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
          <div className="p-4 border-b border-outline-variant flex justify-between items-baseline">
            <h2 className="text-base font-semibold text-on-surface">Incoming signals</h2>
            <span className="text-xs text-on-surface-variant tabular-nums">
              {searchQuery ? `${filteredSignals.length} of ${signals.length}` : `${signals.length} ingested`}
            </span>
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
            {filteredSignals.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-1 px-6 text-center">
                <span className="text-sm text-on-surface-variant">No signals match “{searchQuery}”</span>
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-primary hover:underline"
                >
                  Clear search
                </button>
              </div>
            ) : (
              filteredSignals.map((item, index) => {
                const isSelected = selectedSignalId === item.id;
                const isCritical = item.status === 'Critical' || item.severity === 'CRITICAL';
                const isNewest = index === 0;
                const isSpeaking = speakingSignalId === item.id;
                const signalText = item.rawText || item.details;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedSignalId(item.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-all border ${
                      isSelected
                        ? 'bg-surface-container-lowest border-primary shadow-md ring-1 ring-primary/40'
                        : 'bg-surface-container-lowest/50 border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low'
                    }`}
                  >
                    {/* Header: Citizen Name, Pulsing Live Badge, Priority Score */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span className="relative flex h-2.5 w-2.5 mt-1 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-error"></span>
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-on-surface truncate">
                              {item.userName || `Distress Beacon`}
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-error/15 text-error border border-error/30 uppercase tracking-wider">
                              {item.timestamp === 'Just now' || isNewest ? 'LIVE SOS' : item.status}
                            </span>
                          </div>
                          {item.userPhone && (
                            <span className="text-xs text-primary font-mono font-medium block mt-0.5">
                              📞 {item.userPhone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-xs font-bold tabular-nums block ${isCritical ? 'text-error' : 'text-tertiary'}`}>
                          Score {item.score}
                        </span>
                        <span className="text-[10px] text-on-surface-variant font-medium">
                          {item.timestamp}
                        </span>
                      </div>
                    </div>

                    {/* Metadata: Channel, Pax, Medical Indicator */}
                    <div className="flex justify-between items-center mt-2.5 pt-2 border-t border-outline-variant/20 text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px] text-primary">
                          {item.sourceIcon || 'smartphone'}
                        </span>
                        <span>{item.source} · {item.people}</span>
                        {item.medicalRequired && (
                          <span className="ml-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-error text-on-error uppercase">
                            MED
                          </span>
                        )}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                        {item.relay}
                      </span>
                    </div>

                    {/* Unique Tracking ID & Location */}
                    <div className="mt-1.5 pt-1 text-[10px] font-mono text-on-surface-variant/80 flex items-center justify-between">
                      <span className="truncate max-w-[190px]" title={item.id}>
                        ID: <span className="text-on-surface font-semibold">{item.id.slice(0, 18)}...</span>
                      </span>
                      <span className="text-tertiary font-sans font-medium shrink-0">
                        {item.district}
                      </span>
                    </div>

                    {signalText && (
                      <div className="mt-2 pt-2 border-t border-outline-variant/20">
                        <p className="text-[11px] leading-snug text-on-surface-variant line-clamp-2">
                          {signalText}
                        </p>
                        <button
                          type="button"
                          onClick={(event) => playSignalText(item, event)}
                          className={`mt-2 inline-flex items-center gap-1.5 rounded border px-2 py-1 text-[10px] font-semibold transition-colors ${
                            isSpeaking
                              ? 'border-error/40 bg-error/15 text-error'
                              : 'border-primary/30 bg-primary/10 text-primary hover:bg-primary/15'
                          }`}
                          aria-label={isSpeaking ? 'Stop SOS voice playback' : 'Play SOS voice text'}
                          title={isSpeaking ? 'Stop SOS voice playback' : 'Play SOS voice text'}
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {isSpeaking ? 'stop_circle' : 'play_circle'}
                          </span>
                          {isSpeaking ? 'Stop voice' : 'Play spoken SOS'}
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 4. AI Priority Engine (Bottom Left) */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant/30 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-baseline mb-5">
              <h2 className="text-base font-semibold text-on-surface">Priority triage</h2>
              <span className="text-[11px] text-on-surface-variant">
                {topCriticalSignal?.id ?? 'no active signal'}
              </span>
            </div>

            <div className="flex items-center gap-6">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
                    stroke="currentColor" className="text-outline-variant"
                  />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none" strokeWidth="3" strokeLinecap="round"
                    stroke="currentColor" className={triage.total >= 80 ? 'text-error' : 'text-tertiary'}
                    pathLength={100} strokeDasharray={`${triage.total} 100`}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold tabular-nums text-on-surface">
                  {triage.total}
                </span>
              </div>

              <dl className="flex-1 space-y-2.5 text-sm">
                {triage.factors.map((f) => (
                  <div key={f.label} className="flex justify-between items-baseline">
                    <dt className="text-on-surface-variant">{f.label}</dt>
                    <dd className="tabular-nums text-on-surface">
                      {f.points > 0 ? `+${f.points}` : '—'}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <button
            onClick={() => setDispatchIncidentId(topCriticalSignal?.id || 'INC-2026-PURI-01')}
            className="w-full mt-8 py-2.5 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-sm font-semibold transition-colors cursor-pointer shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">local_shipping</span>
            Deploy to {topCriticalSignal?.id || 'OD-7A92'}
          </button>
        </div>

        {/* 5. IVR Telemetry & SafeVerify Status */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant/30 rounded-xl p-5 flex flex-col justify-between shadow-sm">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-semibold text-on-surface">IVR check-in responses</h2>
              <span className="text-[11px] text-on-surface-variant">{activeCampaign.title}</span>
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

          <div className="grid grid-cols-4 gap-2">
            {[
              { key: '1' as const, label: 'Safe', value: activeCampaign.safeCount, tone: 'text-secondary' },
              { key: '2' as const, label: 'Supplies', value: activeCampaign.foodWaterCount, tone: 'text-tertiary' },
              { key: '3' as const, label: 'Trapped', value: activeCampaign.trappedCount, tone: 'text-error' },
              { key: '4' as const, label: 'Medical', value: activeCampaign.medicalCount, tone: 'text-error' }
            ].map((k) => (
              <button
                key={k.key}
                onClick={() => recordDTMF(k.key)}
                className="bg-surface border border-outline-variant/50 hover:bg-surface-container-low p-3 rounded-lg text-center transition-colors cursor-pointer shadow-sm"
              >
                <span className="block text-[10px] text-on-surface-variant mb-1">
                  {k.key} &middot; {k.label}
                </span>
                <span className={`text-lg font-bold tabular-nums ${k.tone}`}>{k.value.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 6. Weather & Environmental Radar */}
        <div className="col-span-12 xl:col-span-4 bg-surface border border-outline-variant/30 rounded-lg overflow-hidden flex">
          <LiveWeatherWidget className="w-full h-full" />
        </div>

        {/* 7. Real-Time Operational Event Bus Stream */}
        <div className="col-span-12 bg-surface border border-outline-variant/30 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping"></span>
              <h2 className="text-base font-semibold text-on-surface">PRANSETU Real-Time Operational Event Bus</h2>
              <span className="text-[11px] bg-surface-container-high text-on-surface-variant px-2.5 py-0.5 rounded-full border border-outline-variant/30 font-mono">
                {realtimeEvents.length} live events
              </span>
            </div>
            <span className="text-xs text-primary font-mono font-semibold flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">sensors</span>
              Supabase Realtime Stream Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 max-h-60 overflow-y-auto pr-1">
            {realtimeEvents.length > 0 ? (
              realtimeEvents.slice(0, 12).map((ev, idx) => {
                const isSos = ev.event_type.startsWith('SOS_');
                const isAck = ev.event_type === 'SOS_OPERATOR_ACKNOWLEDGED';
                const isAlert = ev.event_type.startsWith('DISASTER_');
                const timeStr = new Date(ev.occurred_at || ev.server_received_at || Date.now()).toLocaleTimeString('en-IN', { hour12: false });
                
                return (
                  <div 
                    key={ev.event_id || `ev-${idx}`}
                    className="p-3 bg-surface-container-lowest border border-outline-variant/30 rounded-lg flex flex-col justify-between text-xs hover:border-outline-variant transition-colors"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className={`px-2 py-0.5 rounded font-mono font-bold text-[10px] ${
                        isAck ? 'bg-primary-container text-on-primary-container' :
                        isSos ? 'bg-error-container text-on-error-container' :
                        isAlert ? 'bg-tertiary-container text-on-tertiary-container' :
                        'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {ev.event_type}
                      </span>
                      <span className="text-[10px] text-on-surface-variant font-mono">{timeStr}</span>
                    </div>
                    <div className="text-[11px] text-on-surface font-sans line-clamp-2">
                      {ev.sos_id ? `SOS #${ev.sos_id.slice(0, 8)}` : (ev.device_id || ev.source)}
                      {ev.payload?.user_name ? ` • ${ev.payload.user_name}` : ''}
                      {ev.payload?.message ? ` • "${ev.payload.message}"` : ''}
                      {ev.payload?.severity ? ` • Severity: ${ev.payload.severity}` : ''}
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-outline-variant/20 flex justify-between items-center text-[10px] text-on-surface-variant font-mono">
                      <span>src: {ev.source}</span>
                      {ev.sequence ? <span>seq: #{ev.sequence}</span> : null}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full py-8 text-center text-on-surface-variant text-sm font-sans">
                Listening for real-time operational events across Android mesh nodes and web command centers...
              </div>
            )}
          </div>
        </div>

        {/* 8. Registered Citizens & Emergency Broadcast */}
        <RegisteredCitizensWidget />
        
      </div>
    </div>
  );
};
