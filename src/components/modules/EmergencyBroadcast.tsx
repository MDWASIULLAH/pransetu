import React, { useState } from 'react';
import { AlertOctagon, Radio, PhoneCall, ShieldAlert, Loader2 } from 'lucide-react';
import { API_BASE, authHeaders } from '../../services/api';
import { useEOC } from '../../context/EOCContext';

export const EmergencyBroadcast: React.FC = () => {
  const { showToast } = useEOC();
  const [disasterText, setDisasterText] = useState('');
  const [severity, setSeverity] = useState('RED_CRITICAL');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any>(null);

  const handleBroadcast = async () => {
    if (!disasterText || disasterText.length < 10) {
      showToast('Error: Please enter a detailed disaster description.');
      return;
    }

    // Confirm dialog to prevent accidental triggers
    if (!window.confirm('CRITICAL ACTION: Are you absolutely sure you want to trigger an Emergency Disaster Broadcast? This will sound sirens and call all registered citizens.')) {
      return;
    }

    setIsDispatching(true);
    setDispatchResult(null);

    try {
      const response = await fetch(`${API_BASE}/api/v1/voice-campaigns/broadcast-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders()
        },
        body: JSON.stringify({
          disaster_text: disasterText,
          severity: severity,
          trigger_siren: true,
          language: 'en'
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        showToast('Emergency Broadcast Dispatched Successfully!');
        setDispatchResult(data);
        setDisasterText('');
      } else {
        showToast(`Failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      showToast('Network error while dispatching broadcast.');
    } finally {
      setIsDispatching(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-red-600 flex items-center gap-3">
          <AlertOctagon className="w-10 h-10" />
          Emergency Disaster Broadcast
        </h1>
        <p className="text-gray-400 mt-2 text-lg">
          Trigger immediate, life-saving sirens and automated IVR phone calls to all registered citizens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1C2128] border-2 border-red-900 rounded-xl p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 to-orange-500"></div>
            
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <Radio className="w-6 h-6 text-red-500" />
              Configure Broadcast Message
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Severity Level</label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#22272E] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 font-bold"
                >
                  <option value="RED_CRITICAL">RED CRITICAL - Immediate Evacuation</option>
                  <option value="ORANGE_WARNING">ORANGE WARNING - Prepare to Act</option>
                  <option value="YELLOW_WATCH">YELLOW WATCH - Be Aware</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Disaster Description / Instructions</label>
                <textarea
                  value={disasterText}
                  onChange={(e) => setDisasterText(e.target.value)}
                  placeholder="E.g., A Category 5 Cyclone is making landfall in 2 hours. Seek higher ground immediately. Do not stay near the coast."
                  className="w-full h-40 bg-[#22272E] border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 placeholder-gray-500 resize-none font-mono text-lg"
                />
              </div>

              <div className="pt-4">
                <button
                  onClick={handleBroadcast}
                  disabled={isDispatching || disasterText.length < 10}
                  className={`w-full py-5 rounded-xl font-black text-2xl uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                    isDispatching || disasterText.length < 10
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.6)] animate-pulse'
                  }`}
                >
                  {isDispatching ? (
                    <>
                      <Loader2 className="w-8 h-8 animate-spin" />
                      Dispatching...
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-8 h-8" />
                      Activate Emergency Broadcast
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-[#1C2128] border border-gray-700 rounded-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <PhoneCall className="w-5 h-5 text-blue-400" />
              Dispatch Status
            </h3>
            
            {!dispatchResult ? (
              <div className="text-gray-400 text-center py-8">
                Ready to broadcast. Waiting for activation.
              </div>
            ) : (
              <div className="space-y-4 animate-fade-in">
                <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4 text-green-400 font-medium">
                  Broadcast successfully initiated across all channels.
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#22272E] p-4 rounded-lg text-center">
                    <div className="text-3xl font-black text-white">{dispatchResult.dispatched_count}</div>
                    <div className="text-xs text-gray-400 uppercase mt-1">Calls Dispatched</div>
                  </div>
                  <div className="bg-[#22272E] p-4 rounded-lg text-center">
                    <div className="text-3xl font-black text-red-500">LIVE</div>
                    <div className="text-xs text-gray-400 uppercase mt-1">Siren Status</div>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mt-4 break-all">
                  Campaign ID: {dispatchResult.campaign_id}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
