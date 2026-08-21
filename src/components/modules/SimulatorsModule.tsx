import { useState } from 'react';
import { Phone, WifiOff, Zap } from 'lucide-react';
import { IVRSimulator } from '../simulators/IVRSimulator';
import { OfflineRelaySimulator } from '../simulators/OfflineRelaySimulator';
import { SOSInjector } from '../simulators/SOSInjector';

export const SimulatorsModule = () => {
  const [activeSim, setActiveSim] = useState<'IVR' | 'OFFLINE' | 'SOS' | null>(null);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-wide">SIH Demonstration Simulators</h2>
        <p className="text-on-surface-variant mt-2">
          These tools simulate real-world hardware and network interactions required by the PRANSETU S specification. 
          Use these to prove the end-to-end data pipelines for the hackathon judges.
        </p>
      </div>

      {!activeSim ? (
        <div className="grid md:grid-cols-3 gap-6">
          <div 
            onClick={() => setActiveSim('IVR')}
            className="glass-panel p-6 rounded-xl cursor-pointer hover:border-blue-500/50 hover:bg-[#1f2937] transition-all group"
          >
            <div className="w-12 h-12 bg-surface-container-low rounded-lg flex items-center justify-center text-on-surface mb-4 group-hover:scale-105 transition-transform">
              <Phone size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Voice / IVR Chain</h3>
            <p className="text-sm text-on-surface-variant">
              Simulate outbound call, interactive DTMF keypress (1=Safe, 2=Assist, etc.), webhook delivery, and live SafeVerify EOC update.
            </p>
          </div>

          <div 
            onClick={() => setActiveSim('OFFLINE')}
            className="glass-panel p-6 rounded-xl cursor-pointer hover:border-orange-500/50 hover:bg-[#1f2937] transition-all group"
          >
            <div className="w-12 h-12 bg-orange-900/50 rounded-lg flex items-center justify-center text-orange-400 mb-4 group-hover:scale-105 transition-transform">
              <WifiOff size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Offline Relay Chain</h3>
            <p className="text-sm text-on-surface-variant">
              Simulate store-carry-forward. Phone A (No Net) → Phone B → Phone C → Gateway (Net Restored) → FastAPI → Live EOC.
            </p>
          </div>

          <div 
            onClick={() => setActiveSim('SOS')}
            className="glass-panel p-6 rounded-xl cursor-pointer hover:border-red-500/50 hover:bg-[#1f2937] transition-all group"
          >
            <div className="w-12 h-12 bg-red-900/50 rounded-lg flex items-center justify-center text-red-400 mb-4 group-hover:scale-105 transition-transform">
              <Zap size={24} />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Live SOS Injector</h3>
            <p className="text-sm text-on-surface-variant">
              Inject new critical SOS events directly into the map and watch DBSCAN clustering and Domino-AI priorities react in real-time.
            </p>
          </div>
        </div>
      ) : (
        <div>
          <button 
            onClick={() => setActiveSim(null)}
            className="mb-4 text-on-surface hover:text-blue-300 text-sm font-medium"
          >
            &larr; Back to Simulators
          </button>
          
          {activeSim === 'IVR' && <IVRSimulator />}
          {activeSim === 'OFFLINE' && <OfflineRelaySimulator />}
          {activeSim === 'SOS' && <SOSInjector />}
        </div>
      )}
    </div>
  );
};
