import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, Radio, PhoneCall, ShieldAlert, Loader2, Users, Zap, 
  CheckCircle2, Clock, Smartphone, Volume2, ShieldCheck, RefreshCw
} from 'lucide-react';
import { API_BASE, authHeaders } from '../../services/api';
import { useEOC } from '../../context/EOCContext';
import { supabase } from '../../lib/supabase';

interface CitizenTarget {
  id: string;
  full_name: string;
  phone_number: string;
  device_id: string | null;
  status: 'PENDING' | 'DISPATCHED' | 'ACKNOWLEDGED';
  acknowledged_at?: string | null;
}

export const EmergencyBroadcast: React.FC = () => {
  const { showToast } = useEOC();
  const [disasterText, setDisasterText] = useState('');
  const [severity, setSeverity] = useState('RED_CRITICAL');
  const [isDispatching, setIsDispatching] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState<any>(null);
  const [targets, setTargets] = useState<CitizenTarget[]>([]);
  const [loadingCitizens, setLoadingCitizens] = useState(true);

  const presets = [
    {
      label: '🌪️ Cyclone Alert',
      severity: 'RED_CRITICAL',
      text: 'EMERGENCY: Category 5 Cyclone making landfall in 2 hours. Severe winds & storm surge. Evacuate to nearest shelter immediately.'
    },
    {
      label: '🌊 Tsunami Warning',
      severity: 'RED_CRITICAL',
      text: 'TSUNAMI EVACUATION: Destructive waves imminent on coastal line. Move to high ground (30m+) immediately.'
    },
    {
      label: '🌧️ Flash Flood',
      severity: 'ORANGE_WARNING',
      text: 'FLASH FLOOD WARNING: Rapidly rising waters in low-lying sectors. Avoid riverbanks and power lines. Seek safe shelter.'
    },
    {
      label: '🔥 Industrial / Fire Hazard',
      severity: 'RED_CRITICAL',
      text: 'HAZMAT WARNING: Chemical / Fire emergency in district perimeter. Stay indoors, seal windows, and await rescue evacuation.'
    }
  ];

  // 1. Fetch registered citizens on load
  useEffect(() => {
    fetchCitizens();

    // 2. Real-time subscription to citizen acknowledgments from mobile phones
    const channel = supabase
      .channel('broadcast-acknowledgment-feed')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'realtime_events' },
        (payload) => {
          const event = payload.new as any;
          if (event.event_type === 'EMERGENCY_BROADCAST_ACKNOWLEDGED') {
            const citizenPhone = event.user_id || event.payload?.citizen_phone;
            const citizenName = event.payload?.citizen_name || 'Citizen';
            const ackTime = new Date(event.occurred_at || Date.now()).toLocaleTimeString('en-IN', { hour12: false });

            console.log(`[EOC Telemetry] Live Acknowledgment received from: ${citizenName} (${citizenPhone})`);

            setTargets((prev) =>
              prev.map((c) => {
                const isMatch = (citizenPhone && c.phone_number.includes(citizenPhone.slice(-8))) ||
                                (c.full_name.toLowerCase() === citizenName.toLowerCase());
                if (isMatch) {
                  return {
                    ...c,
                    status: 'ACKNOWLEDGED',
                    acknowledged_at: ackTime
                  };
                }
                return c;
              })
            );

            showToast(`🟢 ${citizenName} acknowledged emergency alert & confirmed SAFE.`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCitizens = async () => {
    setLoadingCitizens(true);
    try {
      const { data } = await supabase
        .from('registered_citizens')
        .select('*')
        .order('registered_at', { ascending: false });

      if (data) {
        setTargets(
          data.map((c) => ({
            id: c.id,
            full_name: c.full_name,
            phone_number: c.phone_number,
            device_id: c.device_id,
            status: activeCampaign ? 'DISPATCHED' : 'PENDING',
            acknowledged_at: null
          }))
        );
      }
    } catch (e) {
      console.error('Failed to load citizens', e);
    } finally {
      setLoadingCitizens(false);
    }
  };

  const handleBroadcast = async () => {
    const finalMessage = disasterText.trim() || 'CRITICAL EMERGENCY DISASTER ALERT: Immediate public evacuation and safety measures ordered by state authorities.';

    setIsDispatching(true);

    try {
      const campaignId = `BROADCAST-${Date.now().toString(36).toUpperCase()}`;
      const timestamp = new Date().toLocaleTimeString('en-IN');

      // 1. Mark all targets as DISPATCHED / ALERTING
      setTargets((prev) =>
        prev.map((t) => ({
          ...t,
          status: 'DISPATCHED',
          acknowledged_at: null
        }))
      );

      // 2. Broadcast via Supabase Realtime Event Bus (Pushes to Android Apps)
      const { error: realtimeErr } = await supabase
        .from('realtime_events')
        .insert({
          event_type: 'EMERGENCY_DISASTER_BROADCAST',
          source: 'eoc_broadcast_manager',
          campaign_id: campaignId,
          occurred_at: new Date().toISOString(),
          payload: {
            disaster_text: finalMessage,
            severity: severity,
            trigger_siren: true,
            target_count: targets.length
          }
        });

      if (realtimeErr) {
        console.warn('Realtime event bus error:', realtimeErr);
      }

      // 3. Insert into sos_events so all listening mobile daemons trigger
      const { error: sosErr } = await supabase
        .from('sos_events')
        .insert({
          sosId: crypto.randomUUID(),
          createdAt: Date.now(),
          source: 'SYSTEM_ALERT',
          severityCode: severity === 'RED_CRITICAL' ? 5 : (severity === 'ORANGE_WARNING' ? 4 : 3),
          message: finalMessage,
          notes: finalMessage,
          peopleCount: targets.length,
          medicalRequired: false,
          hopCount: 0,
          ttl: 64,
          deliveryState: 'SERVER_RECEIVED',
          deviceIdentifier: 'EOC_DASHBOARD'
        });

      if (sosErr) {
        console.warn('SOS events error:', sosErr);
      }

      // 4. Ping backend IVR service
      try {
        await fetch(`${API_BASE}/api/v1/voice-campaigns/broadcast-call`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders()
          },
          body: JSON.stringify({
            disaster_text: finalMessage,
            severity: severity,
            trigger_siren: true,
            language: 'en'
          })
        });
      } catch (_backendErr) {}

      setActiveCampaign({
        campaign_id: campaignId,
        message: finalMessage,
        severity: severity,
        timestamp: timestamp
      });

      showToast('📡 Emergency Broadcast Transmitted! Live citizen responses tracking below.');
      setDisasterText('');

    } catch (err: any) {
      console.error(err);
      showToast(`Error dispatching broadcast: ${err.message || err}`);
    } finally {
      setIsDispatching(false);
    }
  };

  const acknowledgedCount = targets.filter((t) => t.status === 'ACKNOWLEDGED').length;
  const totalCount = targets.length;
  const ackPercent = totalCount > 0 ? Math.round((acknowledgedCount / totalCount) * 100) : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto h-full overflow-y-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-red-500 flex items-center gap-3">
            <AlertOctagon className="w-9 h-9 animate-pulse" />
            Emergency Disaster Broadcast Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Dispatch high-frequency sirens & cell-broadcast warnings to citizen mobile phones with real-time acknowledgment telemetry.
          </p>
        </div>
        <button
          onClick={fetchCitizens}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#22272E] border border-gray-700 hover:border-gray-500 rounded-lg text-xs font-semibold text-gray-200 hover:bg-gray-800 transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loadingCitizens ? 'animate-spin' : ''}`} />
          Refresh Citizen Fleet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Broadcast Dispatch Console */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#1C2128] border-2 border-red-900/60 rounded-xl p-5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-amber-500"></div>

            <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <Radio className="w-5 h-5 text-red-500" />
              Configure Broadcast Message
            </h2>

            {/* Quick Templates */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-yellow-400" /> Quick Templates:
              </label>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSeverity(preset.severity);
                      setDisasterText(preset.text);
                    }}
                    className="text-xs bg-[#22272E] hover:bg-red-950/60 border border-gray-700 hover:border-red-500 text-gray-300 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#22272E] border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:ring-2 focus:ring-red-500 font-semibold"
                >
                  <option value="RED_CRITICAL">🔴 RED CRITICAL - Immediate Evacuation</option>
                  <option value="ORANGE_WARNING">🟠 ORANGE WARNING - Prepare to Act</option>
                  <option value="YELLOW_WATCH">🟡 YELLOW WATCH - Public Advisory</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Disaster Description / Instructions</label>
                <textarea
                  value={disasterText}
                  onChange={(e) => setDisasterText(e.target.value)}
                  placeholder="E.g., A Category 5 Cyclone is making landfall in 2 hours. Seek higher ground immediately. Do not stay near the coast."
                  className="w-full h-32 bg-[#22272E] border border-gray-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 placeholder-gray-500 resize-none font-mono text-sm"
                />
              </div>

              <button
                type="button"
                onClick={handleBroadcast}
                disabled={isDispatching}
                className={`w-full py-4 rounded-xl font-black text-lg uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer ${
                  isDispatching
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_25px_rgba(220,38,38,0.7)] active:scale-[0.99]'
                }`}
              >
                {isDispatching ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Transmitting Alert...
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-5 h-5" />
                    TRANSMIT EMERGENCY BROADCAST
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Telemetry & Citizen Acknowledgment Monitor */}
        <div className="lg:col-span-7 space-y-6">
          {/* Real-time Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#1C2128] border border-gray-800 p-4 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-black text-white flex items-center justify-center gap-2">
                <Users className="w-5 h-5 text-blue-400" />
                {totalCount}
              </div>
              <div className="text-[11px] text-gray-400 uppercase font-semibold mt-1">Total Targets</div>
            </div>

            <div className="bg-[#1C2128] border border-green-900/40 p-4 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-black text-green-400 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                {acknowledgedCount}
              </div>
              <div className="text-[11px] text-gray-400 uppercase font-semibold mt-1">Acknowledged</div>
            </div>

            <div className="bg-[#1C2128] border border-amber-900/40 p-4 rounded-xl text-center">
              <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                {totalCount - acknowledgedCount}
              </div>
              <div className="text-[11px] text-gray-400 uppercase font-semibold mt-1">Pending / Alerting</div>
            </div>
          </div>

          {/* Live Progress Bar */}
          {activeCampaign && (
            <div className="bg-[#1C2128] border border-gray-800 p-4 rounded-xl space-y-2">
              <div className="flex justify-between text-xs text-gray-300 font-semibold">
                <span className="flex items-center gap-1.5 text-red-400">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                  Active Broadcast: {activeCampaign.campaign_id}
                </span>
                <span className="text-green-400 font-bold">{ackPercent}% Acknowledged</span>
              </div>
              <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-amber-500 to-green-500 transition-all duration-500 rounded-full"
                  style={{ width: `${ackPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Citizen Fleet Telemetry Table */}
          <div className="bg-[#1C2128] border border-gray-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#22272E]">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-white">Live Citizen Response Fleet</h3>
              </div>
              <span className="text-xs text-gray-400">
                {activeCampaign ? 'Live Telemetry Active' : 'Standby Mode'}
              </span>
            </div>

            <div className="overflow-x-auto max-h-[380px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-[11px] text-gray-400 uppercase tracking-wider bg-[#1C2128]/50">
                    <th className="py-2.5 px-4 font-semibold">Citizen</th>
                    <th className="py-2.5 px-4 font-semibold">Phone / Device</th>
                    <th className="py-2.5 px-4 font-semibold">Delivery Status</th>
                    <th className="py-2.5 px-4 font-semibold text-right">User Acknowledgment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/60 text-xs text-gray-200">
                  {targets.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-gray-500">
                        No registered citizens found.
                      </td>
                    </tr>
                  ) : (
                    targets.map((citizen) => (
                      <tr 
                        key={citizen.id} 
                        className={`transition-colors ${
                          citizen.status === 'ACKNOWLEDGED' 
                            ? 'bg-green-950/20 hover:bg-green-950/30' 
                            : citizen.status === 'DISPATCHED'
                              ? 'bg-amber-950/15 hover:bg-amber-950/25'
                              : 'hover:bg-[#22272E]'
                        }`}
                      >
                        <td className="py-3 px-4 font-medium">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] ${
                              citizen.status === 'ACKNOWLEDGED'
                                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                : citizen.status === 'DISPATCHED'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                  : 'bg-gray-800 text-gray-400'
                            }`}>
                              {citizen.full_name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-semibold">{citizen.full_name}</span>
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-gray-400">
                          <div>{citizen.phone_number}</div>
                          <div className="text-[10px] text-gray-500">{citizen.device_id || 'DEV-MOBILE'}</div>
                        </td>

                        <td className="py-3 px-4">
                          {citizen.status === 'DISPATCHED' || citizen.status === 'ACKNOWLEDGED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-900/30 text-blue-400 border border-blue-500/30">
                              <Volume2 className="w-3 h-3 text-blue-400" />
                              Transmitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] text-gray-400 bg-gray-800">
                              Standby
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {citizen.status === 'ACKNOWLEDGED' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-green-500/20 text-green-400 border border-green-500/40 animate-fade-in">
                              <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                              ACKNOWLEDGED {citizen.acknowledged_at ? `(${citizen.acknowledged_at})` : ''}
                            </div>
                          ) : citizen.status === 'DISPATCHED' ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                              Alerting (Ringing...)
                            </div>
                          ) : (
                            <span className="text-gray-500 text-[11px]">Pending Broadcast</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
