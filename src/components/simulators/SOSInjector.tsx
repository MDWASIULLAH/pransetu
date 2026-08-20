import { useState } from 'react';
import { useEOC } from '../../context/EOCContext';
import { Zap, MapPin, Users, HeartPulse, CheckCircle } from 'lucide-react';
import { useSound } from '../../context/SoundContext';
import type { SOSRecord, SOSSeverity } from '../../types/sos';

export const SOSInjector = () => {
  const { injectSOS } = useEOC();
  const { playAlert } = useSound();
  
  const [peopleCount, setPeopleCount] = useState(1);
  const [medical, setMedical] = useState(false);
  const [severity, setSeverity] = useState<SOSSeverity>('HIGH');
  const [district, setDistrict] = useState('Puri');
  const [success, setSuccess] = useState(false);

  const handleInject = () => {
    // Generate roughly around Puri or Khordha
    const baseLat = district === 'Puri' ? 19.80 : 19.82;
    const baseLng = district === 'Puri' ? 85.82 : 85.835;
    
    const lat = baseLat + (Math.random() - 0.5) * 0.05;
    const lng = baseLng + (Math.random() - 0.5) * 0.05;

    const newSOS: SOSRecord = {
      id: `OD-${Math.random().toString(36).substr(2, 7)}`.toUpperCase(),
      deviceId: `device-${Math.random().toString(36).substr(2, 5)}`,
      source: 'ANDROID',
      lat,
      lng,
      accuracyM: Math.floor(Math.random() * 20) + 5,
      locationTimestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      peopleCount,
      medicalRequired: medical,
      severity,
      hopCount: 0,
      ttl: 86400,
      deliveryState: 'SERVER_DELIVERED',
      incidentId: district === 'Puri' ? 'INC-011' : 'INC-018'
    };

    injectSOS(newSOS);
    playAlert();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-red-500/30">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-red-900/50 text-red-400 rounded-lg">
          <Zap size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">Live SOS Event Injector</h3>
          <p className="text-sm text-gray-400">Creates a new SOS and pushes it through the Realtime channel to test UI reactivity.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 uppercase mb-1">Target District Cluster</label>
            <select 
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded"
            >
              <option value="Puri">Puri (INC-011)</option>
              <option value="Khordha">Khordha (INC-018)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 uppercase mb-1 flex items-center gap-1"><Users size={12}/> People Count</label>
              <input 
                type="number" 
                value={peopleCount}
                onChange={(e) => setPeopleCount(parseInt(e.target.value))}
                min="1" max="50"
                className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 uppercase mb-1">Severity</label>
              <select 
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SOSSeverity)}
                className="w-full bg-gray-800 border border-gray-700 text-white p-2 rounded"
              >
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
              </select>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                checked={medical} 
                onChange={(e) => setMedical(e.target.checked)}
                className="w-4 h-4 bg-gray-800 border-gray-700 rounded text-red-500 focus:ring-red-500"
              />
              <span className="text-sm text-white flex items-center gap-1"><HeartPulse size={14} className="text-red-400"/> Urgent Medical Required</span>
            </label>
          </div>

          <button 
            onClick={handleInject}
            className="w-full mt-4 flex justify-center items-center gap-2 bg-red-600 hover:bg-red-500 text-white px-6 py-3 rounded-lg font-bold transition-all"
          >
            <Zap size={18} /> Inject SOS Event
          </button>
        </div>

        <div>
          {success ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-green-500/30 bg-green-900/20 rounded-lg animate-in zoom-in duration-300">
              <CheckCircle size={48} className="text-green-400 mb-4" />
              <h4 className="text-xl font-bold text-white mb-2">SOS Successfully Injected!</h4>
              <p className="text-gray-400 text-sm">
                The event has been pushed to the real-time store. Metric counters have increased, the map has a new marker, and cluster priorities have recalculated.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-gray-800 bg-black/30 rounded-lg text-gray-500">
              <MapPin size={48} className="mb-4 opacity-30" />
              <p className="text-sm">Configure payload and inject to test UI reactivity.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
