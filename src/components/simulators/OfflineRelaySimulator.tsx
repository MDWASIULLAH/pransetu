import { useState } from 'react';
import { useEOC } from '../../context/EOCContext';
import { WifiOff, Smartphone, Server, CheckCircle, Zap } from 'lucide-react';
import { clsx } from 'clsx';
import { useSound } from '../../context/SoundContext';
import type { SOSRecord } from '../../types/sos';

export const OfflineRelaySimulator = () => {
  const { injectSOS } = useEOC();
  const { playAlert } = useSound();
  
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const runSimulation = () => {
    setLogs([]);
    setStep(1);
    addLog('Phone A: Creates SOS. Internet is OFFLINE.');
    addLog('Phone A: Stores SOS in local Room DB. State: STORED');
    
    setTimeout(() => {
      setStep(2);
      addLog('Phone A: Discovers Phone B via BLE / Nearby Connections.');
      addLog('Phone A -> Phone B: Packet transferred. Hop Count: 1');
      
      setTimeout(() => {
        setStep(3);
        addLog('Phone B -> Phone C: Packet transferred. Hop Count: 2');
        
        setTimeout(() => {
          setStep(4);
          addLog('Phone C: Reaches Gateway Device (Internet Available).');
          addLog('Gateway: Uploading queued packets to FastAPI...');
          
          setTimeout(() => {
            setStep(5);
            addLog('FastAPI: Packet received, validated, inserted to Supabase.');
            
            const newSOS: SOSRecord = {
              sos_id: `OD-${Math.random().toString(36).substr(2, 7)}`.toUpperCase(),
              protocol_version: '1.0',
              device_id: 'phone-a-hashed',
              source: 'ANDROID',
              latitude: 19.85,
              longitude: 85.80,
              accuracy_m: 12,
              location_timestamp: new Date(Date.now() - 600000).toISOString(),
              created_at: new Date(Date.now() - 600000).toISOString(), // 10 mins ago
              people_count: 3,
              medical_required: true,
              severity: 'CRITICAL',
              hop_count: 3,
              ttl: 86400,
              delivery_state: 'SERVER_DELIVERED',
              relay_trail: ['Phone A', 'Phone B', 'Phone C', 'Gateway']
            };
            
            injectSOS(newSOS);
            playAlert();
            addLog('Realtime EOC: New offline-relayed SOS injected into Dashboard!');
          }, 1500);
        }, 1500);
      }, 1500);
    }, 1500);
  };

  const getStepClass = (target: number) => {
    if (step === target) return "border-blue-500 bg-blue-900/30 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]";
    if (step > target) return "border-green-500 bg-green-900/20 text-green-400";
    return "border-gray-700 bg-gray-800/50 text-gray-500 opacity-50";
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-orange-500/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-900/50 text-orange-400 rounded-lg">
          <WifiOff size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Offline Store-Carry-Forward Mesh</h3>
          <p className="text-sm text-on-surface-variant">Proves Phone A (No Net) → Phone B → Gateway → Live EOC delivery chain.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div>
          {step === 0 && (
            <button 
              onClick={runSimulation}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-lg font-bold transition-all mb-6"
            >
              <Zap size={18} /> Start Mesh Relay Simulation
            </button>
          )}

          <div className="flex flex-col space-y-3 relative">
            {/* Connecting lines */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-700 z-0"></div>
            
            <div className={clsx("flex items-center gap-4 p-3 rounded-lg border z-10 transition-all duration-500", getStepClass(1))}>
              <div className="bg-black/50 p-2 rounded-full"><Smartphone size={16} /></div>
              <div>
                <div className="font-bold">Phone A (No Internet)</div>
                <div className="text-xs opacity-80">SOS Created & Stored Locally</div>
              </div>
            </div>
            
            <div className={clsx("flex items-center gap-4 p-3 rounded-lg border z-10 transition-all duration-500", getStepClass(2))}>
              <div className="bg-black/50 p-2 rounded-full"><Smartphone size={16} /></div>
              <div>
                <div className="font-bold">Phone B (BLE Transfer)</div>
                <div className="text-xs opacity-80">Hop Count: 1</div>
              </div>
            </div>
            
            <div className={clsx("flex items-center gap-4 p-3 rounded-lg border z-10 transition-all duration-500", getStepClass(3))}>
              <div className="bg-black/50 p-2 rounded-full"><Smartphone size={16} /></div>
              <div>
                <div className="font-bold">Phone C (BLE Transfer)</div>
                <div className="text-xs opacity-80">Hop Count: 2</div>
              </div>
            </div>
            
            <div className={clsx("flex items-center gap-4 p-3 rounded-lg border z-10 transition-all duration-500", getStepClass(4))}>
              <div className="bg-black/50 p-2 rounded-full"><span>🌐</span></div>
              <div>
                <div className="font-bold">Gateway (Internet Available)</div>
                <div className="text-xs opacity-80">Uploading packet to backend...</div>
              </div>
            </div>
            
            <div className={clsx("flex items-center gap-4 p-3 rounded-lg border z-10 transition-all duration-500", getStepClass(5))}>
              <div className="bg-black/50 p-2 rounded-full"><Server size={16} /></div>
              <div>
                <div className="font-bold">PRANSETU S Live EOC</div>
                <div className="text-xs opacity-80">Incident injected with stale location warning</div>
              </div>
            </div>
          </div>
          
          {step === 5 && (
            <div className="mt-6 p-4 bg-green-900/30 border border-green-500/30 rounded-lg flex items-center gap-3 text-green-400 animate-in fade-in">
              <CheckCircle size={24} />
              <div>
                <div className="font-bold">Relay Complete!</div>
                <div className="text-sm">Check Live Map and Overview. A new Critical SOS with 3 hops has appeared.</div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-black/50 p-4 rounded-lg border border-gray-800 font-mono text-xs overflow-y-auto h-80 scrollbar-thin">
          <div className="text-gray-500 mb-2">MESH RELAY LOGS</div>
          {logs.map((log, i) => (
            <div key={i} className={clsx(
              "mb-1",
              log.includes('Phone') ? 'text-on-surface-variant' :
              log.includes('Gateway') ? 'text-teal-400' :
              log.includes('FastAPI') ? 'text-purple-400' :
              log.includes('EOC') ? 'text-green-400' : 'text-gray-500'
            )}>
              {log}
            </div>
          ))}
          {step > 0 && step < 5 && (
            <div className="text-gray-500 animate-pulse mt-2">Relaying packet...</div>
          )}
        </div>
      </div>
    </div>
  );
};
