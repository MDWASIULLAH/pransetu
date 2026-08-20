import { X, MapPin, Clock, Users, HeartPulse, ShieldAlert, Radio, Share2 } from 'lucide-react';
import type { SOSRecord } from '../../types/sos';
import { SeverityBadge, DeliveryPill } from '../common/Badges';

interface SOSDetailDrawerProps {
  sos: SOSRecord;
  onClose: () => void;
  canMask?: boolean;
}

export const SOSDetailDrawer = ({ sos, onClose }: SOSDetailDrawerProps) => {
  const ageMin = Math.round((Date.now() - new Date(sos.locationTimestamp).getTime()) / 60000);

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-[#0a0e17] border-l border-[#1f2937] shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col">
      <div className="p-4 border-b border-[#1f2937] flex justify-between items-center bg-[#111827]">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Radio size={20} className="text-blue-400" />
            SOS Inspector: {sos.id}
          </h2>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-[#1f2937] rounded-md text-gray-400 transition-colors">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="mb-6 flex justify-between items-start">
          <SeverityBadge severity={sos.severity} />
          <DeliveryPill state={sos.deliveryState} />
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="glass-panel p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1"><Users size={14}/> Affected</div>
            <div className="text-2xl font-bold text-white">{sos.peopleCount}</div>
          </div>
          <div className="glass-panel p-4 rounded-lg">
            <div className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-1"><HeartPulse size={14}/> Medical</div>
            <div className="text-2xl font-bold text-white">
              {sos.medicalRequired ? <span className="text-red-400">URGENT</span> : <span className="text-green-400">NONE</span>}
            </div>
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Location Data</h3>
        <div className="space-y-4 mb-8">
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm flex items-center gap-2"><MapPin size={16}/> Coordinates</div>
            <div className="text-white font-mono text-sm">{sos.lat.toFixed(6)}, {sos.lng.toFixed(6)}</div>
          </div>
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm flex items-center gap-2"><ShieldAlert size={16}/> Accuracy</div>
            <div className="text-white font-mono text-sm">±{sos.accuracyM}m</div>
          </div>
          <div className="flex justify-between items-center bg-[#111827] p-3 rounded-lg border border-[#1f2937]">
            <div className="text-gray-400 text-sm flex items-center gap-2"><Clock size={16}/> Location Age</div>
            {ageMin > 5 ? (
              <div className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded">LAST KNOWN ({ageMin}m ago)</div>
            ) : (
              <div className="text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded">LIVE ({ageMin}m ago)</div>
            )}
          </div>
        </div>

        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Network Protocol (Canonical Schema)</h3>
        <div className="bg-black/50 p-4 rounded-lg border border-gray-800 font-mono text-xs text-blue-300 mb-8 overflow-x-auto">
          <pre>
{JSON.stringify({
  sos_id: sos.id,
  device_id: sos.deviceId,
  created_at: sos.createdAt,
  latitude: sos.lat,
  longitude: sos.lng,
  accuracy_m: sos.accuracyM,
  people_count: sos.peopleCount,
  medical_required: sos.medicalRequired,
  severity: sos.severity,
  hop_count: sos.hopCount,
  ttl: sos.ttl
}, null, 2)}
          </pre>
        </div>

        <h3 className="text-sm font-bold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">Offline Relay Trail</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-gray-400 text-sm flex items-center gap-2"><Share2 size={16}/> Total Hops</div>
            <div className="text-white font-mono font-bold text-lg">{sos.hopCount}</div>
          </div>
          {sos.relayTrail ? (
            <div className="mt-4 border-l-2 border-gray-700 pl-4 space-y-4">
              {sos.relayTrail.map((node, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-6 top-1 w-4 h-4 rounded-full bg-blue-500 border-4 border-[#0a0e17]"></div>
                  <div className="text-white font-bold">{node}</div>
                  <div className="text-xs text-gray-500">Relay Node {i+1}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 text-sm mt-2 italic">Direct Server Upload (No relay)</div>
          )}
        </div>
      </div>
      
      <div className="p-4 border-t border-[#1f2937] bg-[#111827] flex gap-3">
        <button className="flex-1 bg-[#1f2937] hover:bg-[#374151] text-white py-2 rounded-lg font-bold transition-colors">
          Update Status
        </button>
        <button className="flex-1 bg-red-600 hover:bg-red-500 text-white py-2 rounded-lg font-bold transition-colors shadow-[0_0_10px_rgba(220,38,38,0.3)]">
          ESCALATE
        </button>
      </div>
    </div>
  );
};
