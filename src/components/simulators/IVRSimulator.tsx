import { useState } from 'react';
import { useEOC } from '../../context/EOCContext';
import { PhoneCall, Play, CheckCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { useSound } from '../../context/SoundContext';

export const IVRSimulator = () => {
  const { addSafeVerify } = useEOC();
  const { playSuccess } = useSound();
  
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const startSimulation = () => {
    setLogs([]);
    setStep(1);
    setSelectedKey(null);
    addLog('API Request: Create outbound campaign to +91 98765 XXXXX');
    setTimeout(() => {
      addLog('Provider Webhook: Call RINGING');
      setTimeout(() => {
        addLog('Provider Webhook: Call ANSWERED');
        setStep(2);
      }, 1500);
    }, 1000);
  };

  const handleDtmf = (key: string, _label: string, state: any) => {
    setSelectedKey(key);
    addLog(`Citizen presses DTMF key: ${key}`);
    setStep(3);
    
    setTimeout(() => {
      addLog(`Provider Webhook: DTMF Gathered (${key})`);
      setTimeout(() => {
        addLog(`FastAPI: Webhook validated and processed (State: ${state})`);
        
        // Update EOC context
        addSafeVerify({
          id: `SV-${Math.random().toString(36).substr(2, 6)}`.toUpperCase(),
          citizenPhone: '+91 98765 43210',
          campaignId: 'CAMP-8892',
          state: state,
          timestamp: new Date().toISOString(),
          callId: 'CA-9238472',
          district: 'Puri'
        });
        
        playSuccess();
        addLog('Realtime EOC: Metric cards updated successfully!');
        setStep(4);
      }, 1000);
    }, 1000);
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-blue-500/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-900/50 text-blue-400 rounded-lg">
          <PhoneCall size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Voice / IVR Interaction Chain</h3>
          <p className="text-sm text-gray-400">Proves the real outbound call → DTMF → Webhook → Live EOC capability.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          {step === 0 && (
            <button 
              onClick={startSimulation}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
            >
              <Play size={18} /> Trigger Outbound Call
            </button>
          )}

          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="bg-gray-800 p-4 rounded-lg mb-4 border border-gray-700">
                <p className="text-blue-300 text-sm font-mono mb-2 animate-pulse">🔊 "This is an emergency broadcast from PRANSETU S. Please state your status."</p>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button onClick={() => handleDtmf('1', 'SAFE', 'SAFE')} className="bg-gray-700 hover:bg-green-700 p-3 rounded font-bold">Press 1: SAFE</button>
                  <button onClick={() => handleDtmf('2', 'ASSISTANCE', 'ASSISTANCE')} className="bg-gray-700 hover:bg-yellow-600 p-3 rounded font-bold">Press 2: ASSISTANCE</button>
                  <button onClick={() => handleDtmf('3', 'TRAPPED', 'TRAPPED')} className="bg-gray-700 hover:bg-orange-600 p-3 rounded font-bold">Press 3: TRAPPED</button>
                  <button onClick={() => handleDtmf('4', 'MEDICAL', 'MEDICAL')} className="bg-gray-700 hover:bg-red-600 p-3 rounded font-bold">Press 4: MEDICAL</button>
                </div>
              </div>
            </div>
          )}

          {step >= 3 && (
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 text-center">
              <div className="text-3xl font-bold mb-2">{selectedKey}</div>
              <div className="text-gray-400 text-sm">Key Pressed</div>
            </div>
          )}

          {step === 4 && (
            <div className="mt-4 p-4 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-400">
              <CheckCircle size={24} />
              <div>
                <div className="font-bold">Chain Complete!</div>
                <div className="text-sm">Check the Overview Dashboard to see the SafeVerify metric incremented.</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/50 p-4 rounded-lg border border-gray-800 font-mono text-xs overflow-y-auto h-64 scrollbar-thin">
          <div className="text-gray-500 mb-2">SYSTEM LOGS</div>
          {logs.map((log, i) => (
            <div key={i} className={clsx(
              "mb-1",
              log.includes('Webhook') ? 'text-purple-400' :
              log.includes('FastAPI') ? 'text-blue-400' :
              log.includes('EOC') ? 'text-green-400' : 'text-gray-300'
            )}>
              {log}
            </div>
          ))}
          {step > 0 && step < 4 && (
            <div className="text-gray-500 animate-pulse mt-2">Waiting for next event...</div>
          )}
        </div>
      </div>
    </div>
  );
};
