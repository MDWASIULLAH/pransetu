import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

export const VoiceLiveDashboard: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [activeCalls, setActiveCalls] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch initial calls
    const fetchCalls = async () => {
      const { data } = await supabase
        .from('voice_calls')
        .select('*, recipient:voice_campaign_recipients(*)')
        .eq('recipient.campaign_id', campaignId);

      if (data && data.length > 0) {
        setActiveCalls(data);
      } else {
        setActiveCalls([]);
      }
    };

    fetchCalls();

    // 2. Subscribe to Realtime updates for live call state
    const channel = supabase
      .channel(`campaign-${campaignId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'voice_calls' },
        (payload) => {
          setActiveCalls((prev) =>
            prev.map((call) => (call.id === payload.new.id ? { ...call, ...payload.new } : call))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  return (
    <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 sm:p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm sm:text-base font-semibold text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-[20px]">phone_in_talk</span>
          Live Telephony &amp; AI Ingestion Stream
        </h3>
        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
          Campaign: {campaignId}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
          <div className="text-on-surface-variant text-xs">Ringing</div>
          <div className="text-xl text-tertiary font-semibold font-mono">
            {activeCalls.filter((c) => c.current_state === 'RINGING').length}
          </div>
        </div>
        <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
          <div className="text-on-surface-variant text-xs">AI Transcribing</div>
          <div className="text-xl text-primary font-semibold font-mono">
            {activeCalls.filter((c) => c.current_state === 'IN_PROGRESS').length}
          </div>
        </div>
        <div className="bg-surface p-3 rounded-lg border border-outline-variant/30">
          <div className="text-on-surface-variant text-xs">Triaged Complete</div>
          <div className="text-xl text-secondary font-semibold font-mono">
            {activeCalls.filter((c) => c.current_state === 'COMPLETED').length}
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {activeCalls.map((call) => (
          <div
            key={call.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-surface border border-outline-variant/40 rounded-lg gap-2 text-xs"
          >
            <div className="flex items-center gap-3">
              {call.current_state === 'RINGING' && (
                <span className="material-symbols-outlined text-tertiary animate-pulse text-[18px]">
                  ring_volume
                </span>
              )}
              {call.current_state === 'IN_PROGRESS' && (
                <span className="material-symbols-outlined text-primary animate-pulse text-[18px]">
                  graphic_eq
                </span>
              )}
              {call.current_state === 'COMPLETED' && (
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  check_circle
                </span>
              )}
              <div>
                <div className="text-on-surface font-semibold flex items-center gap-2">
                  <span>{call.id}</span>
                  <span className="text-on-surface-variant font-normal">({call.recipient_id})</span>
                </div>
                <div className="text-[11px] text-on-surface-variant mt-0.5">
                  Dialect: <span className="font-medium text-primary">{call.language_used}</span> &middot; Mode:{' '}
                  <span className="font-medium text-on-surface">{call.fallback_used || 'Whisper Voice AI'}</span>
                </div>
                {call.transcript_snippet && (
                  <p className="text-[11px] text-on-surface italic mt-0.5 truncate max-w-xs sm:max-w-md">
                    "{call.transcript_snippet}"
                  </p>
                )}
              </div>
            </div>
            <div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border ${
                  call.current_state === 'IN_PROGRESS'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : call.current_state === 'COMPLETED'
                    ? 'bg-secondary/10 text-secondary border-secondary/20'
                    : 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
                }`}
              >
                {call.current_state === 'IN_PROGRESS' ? 'AI ANALYZING' : call.current_state}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
