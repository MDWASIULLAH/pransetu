import { useState } from 'react';
import { useEOC } from '../../context/EOCContext';
import { useAuth } from '../../context/AuthContext';
import { SOSDetailDrawer } from '../drawers/SOSDetailDrawer';
import { Search, Filter } from 'lucide-react';
import { SeverityBadge, DeliveryPill } from '../common/Badges';

export const SOSManagementModule = () => {
  const { sosList } = useEOC();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSOS, setSelectedSOS] = useState<string | null>(null);

  const canAcknowledge = hasPermission('sos.acknowledge');
  const canMask = hasPermission('sos.mask_phone');

  const filteredList = sosList.filter(sos => 
    sos.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
    sos.incidentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 h-full flex flex-col max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">SOS Intake & Triage Queue</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time incoming emergency signals from all channels.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search SOS ID or Incident..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#111827] border border-[#374151] rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 w-64"
            />
          </div>
          <button className="flex items-center gap-2 bg-[#1f2937] hover:bg-[#374151] border border-[#374151] text-gray-300 px-4 py-2 rounded-lg text-sm transition-colors">
            <Filter size={16} /> Filter
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden bg-[#111827] border border-[#1f2937] rounded-xl flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-400">
            <thead className="bg-[#1f2937]/50 text-xs uppercase font-semibold text-gray-300 sticky top-0">
              <tr>
                <th className="px-6 py-4 rounded-tl-xl">SOS ID</th>
                <th className="px-6 py-4">Severity</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Location Age</th>
                <th className="px-6 py-4">People</th>
                <th className="px-6 py-4">Delivery State</th>
                <th className="px-6 py-4">Hops</th>
                <th className="px-6 py-4 rounded-tr-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2937] overflow-y-auto">
              {filteredList.map((sos) => {
                const ageMin = Math.round((Date.now() - new Date(sos.locationTimestamp).getTime()) / 60000);
                
                return (
                  <tr key={sos.id} className="hover:bg-[#1f2937]/30 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-white">
                      {sos.id}
                      {sos.incidentId && <div className="text-[10px] text-gray-500 mt-1">{sos.incidentId}</div>}
                    </td>
                    <td className="px-6 py-4"><SeverityBadge severity={sos.severity} /></td>
                    <td className="px-6 py-4 text-xs font-mono">{sos.source}</td>
                    <td className="px-6 py-4">
                      {ageMin > 5 ? (
                        <span className="text-yellow-400 font-bold bg-yellow-400/10 px-2 py-1 rounded">Stale ({ageMin}m)</span>
                      ) : (
                        <span className="text-green-400 font-bold bg-green-400/10 px-2 py-1 rounded">Live ({ageMin}m)</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">
                      {sos.peopleCount}
                      {sos.medicalRequired && <span className="ml-2 text-red-400 text-xs">MED</span>}
                    </td>
                    <td className="px-6 py-4"><DeliveryPill state={sos.deliveryState} /></td>
                    <td className="px-6 py-4 font-mono">{sos.hopCount}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => setSelectedSOS(sos.id)}
                          className="px-3 py-1 bg-blue-900/30 hover:bg-blue-900/60 border border-blue-500/30 text-blue-400 rounded text-xs transition-colors"
                        >
                          INSPECT
                        </button>
                        {canAcknowledge && (
                          <button className="px-3 py-1 bg-green-900/30 hover:bg-green-900/60 border border-green-500/30 text-green-400 rounded text-xs transition-colors">
                            ACK
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedSOS && (
        <SOSDetailDrawer 
          sos={sosList.find(s => s.id === selectedSOS)!} 
          onClose={() => setSelectedSOS(null)} 
          canMask={canMask}
        />
      )}
    </div>
  );
};
