import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Phone, PhoneCall, PhoneForwarded, CheckCircle2 } from 'lucide-react';

export const VoiceLiveDashboard: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [activeCalls, setActiveCalls] = useState<any[]>([]);

  useEffect(() => {
    // 1. Fetch initial calls
    const fetchCalls = async () => {
      const { data } = await supabase
        .from('voice_calls')
        .select('*, recipient:voice_campaign_recipients(*)')
        .eq('recipient.campaign_id', campaignId);
        
      if (data) {
        setActiveCalls(data);
      }
    };
    
    fetchCalls();

    // 2. Subscribe to Realtime updates for live call state
    const channel = supabase.channel(`campaign-${campaignId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'voice_calls' },
        (payload) => {
          setActiveCalls(prev => prev.map(call => 
            call.id === payload.new.id ? { ...call, ...payload.new } : call
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [campaignId]);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
      <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
        <Phone className="text-emerald-500" /> Live Voice Campaign Stream
      </h2>
      
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Ringing</div>
          <div className="text-2xl text-yellow-500 font-mono">
            {activeCalls.filter(c => c.current_state === 'RINGING').length}
          </div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">In Progress</div>
          <div className="text-2xl text-blue-500 font-mono">
            {activeCalls.filter(c => c.current_state === 'IN_PROGRESS').length}
          </div>
        </div>
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <div className="text-gray-400 text-sm">Completed</div>
          <div className="text-2xl text-emerald-500 font-mono">
            {activeCalls.filter(c => c.current_state === 'COMPLETED').length}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {activeCalls.map(call => (
          <div key={call.id} className="flex items-center justify-between p-3 bg-gray-800/30 border border-gray-700/50 rounded-lg">
            <div className="flex items-center gap-3">
              {call.current_state === 'RINGING' && <PhoneForwarded className="text-yellow-500 animate-pulse" size={20} />}
              {call.current_state === 'IN_PROGRESS' && <PhoneCall className="text-blue-500 animate-pulse" size={20} />}
              {call.current_state === 'COMPLETED' && <CheckCircle2 className="text-emerald-500" size={20} />}
              <div>
                <div className="text-gray-200 font-medium">Recipient #{call.recipient_id.substring(0,8)}</div>
                <div className="text-sm text-gray-500">Language: {call.language_used} | Mode: {call.fallback_used || 'Voice AI'}</div>
              </div>
            </div>
            <div>
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-gray-700 text-gray-300">
                {call.current_state}
              </span>
            </div>
          </div>
        ))}
        {activeCalls.length === 0 && (
          <div className="text-center py-8 text-gray-500 border border-dashed border-gray-700 rounded-lg">
            No active calls in this campaign yet.
          </div>
        )}
      </div>
    </div>
  );
};
