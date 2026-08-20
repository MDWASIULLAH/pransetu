import { useState } from 'react';
import { useEOC } from '../../context/EOCContext';
import { useAuth } from '../../context/AuthContext';
import { Users, Truck, Ship, Crosshair } from 'lucide-react';
import { clsx } from 'clsx';
import { DispatchModal } from '../drawers/DispatchModal';

export const RescueTeamsModule = () => {
  const { resources } = useEOC();
  const { hasPermission } = useAuth();
  
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null);

  const canAssign = hasPermission('rescue.assign');

  const teams = resources.filter(r => r.type === 'RESCUE_TEAM');
  const ambulances = resources.filter(r => r.type === 'AMBULANCE');
  const boats = resources.filter(r => r.type === 'BOAT');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'text-green-400 bg-green-400/10 border-green-500/30';
      case 'EN_ROUTE': return 'text-blue-400 bg-blue-400/10 border-blue-500/30 animate-pulse';
      case 'ON_SITE': return 'text-yellow-400 bg-yellow-400/10 border-yellow-500/30';
      case 'COMPLETED': return 'text-gray-400 bg-gray-400/10 border-gray-500/30';
      default: return 'text-gray-400 bg-gray-800 border-gray-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Rescue Resource Board</h2>
          <p className="text-gray-400 text-sm mt-1">Field operations, resource assignment and live tracking.</p>
        </div>
        {canAssign && (
          <button 
            onClick={() => { setSelectedIncident(null); setDispatchModalOpen(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)]"
          >
            <Crosshair size={18} /> New Dispatch Assignment
          </button>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        
        {/* Teams Column */}
        <div className="glass-panel border border-[#1f2937] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 bg-[#111827] border-b border-[#1f2937] flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><Users size={18} className="text-blue-400"/> Rescue Teams</h3>
            <span className="text-xs font-mono bg-blue-900/50 text-blue-400 px-2 py-0.5 rounded">{teams.filter(t=>t.status==='AVAILABLE').length}/{teams.length} Available</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {teams.map(team => (
              <ResourceCard key={team.id} resource={team} getStatusColor={getStatusColor} />
            ))}
          </div>
        </div>

        {/* Ambulances Column */}
        <div className="glass-panel border border-[#1f2937] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 bg-[#111827] border-b border-[#1f2937] flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><Truck size={18} className="text-red-400"/> Ambulances</h3>
            <span className="text-xs font-mono bg-red-900/50 text-red-400 px-2 py-0.5 rounded">{ambulances.filter(t=>t.status==='AVAILABLE').length}/{ambulances.length} Available</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {ambulances.map(amb => (
              <ResourceCard key={amb.id} resource={amb} getStatusColor={getStatusColor} />
            ))}
          </div>
        </div>

        {/* Boats Column */}
        <div className="glass-panel border border-[#1f2937] rounded-xl flex flex-col overflow-hidden">
          <div className="p-4 bg-[#111827] border-b border-[#1f2937] flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2"><Ship size={18} className="text-teal-400"/> Rescue Boats</h3>
            <span className="text-xs font-mono bg-teal-900/50 text-teal-400 px-2 py-0.5 rounded">{boats.filter(t=>t.status==='AVAILABLE').length}/{boats.length} Available</span>
          </div>
          <div className="p-4 flex-1 overflow-y-auto space-y-3 scrollbar-thin">
            {boats.map(boat => (
              <ResourceCard key={boat.id} resource={boat} getStatusColor={getStatusColor} />
            ))}
          </div>
        </div>

      </div>

      {dispatchModalOpen && (
        <DispatchModal onClose={() => setDispatchModalOpen(false)} initialIncident={selectedIncident} />
      )}
    </div>
  );
};

const ResourceCard = ({ resource, getStatusColor }: any) => (
  <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-lg hover:border-gray-600 transition-colors">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-bold text-white">{resource.name}</h4>
      <span className={clsx("text-[10px] px-2 py-0.5 rounded border font-bold tracking-wider", getStatusColor(resource.status))}>
        {resource.status.replace('_', ' ')}
      </span>
    </div>
    <div className="text-xs text-gray-400 space-y-1">
      {resource.members && <div>Members: {resource.members}</div>}
      {resource.capacity && <div>Capacity: {resource.capacity}</div>}
      {resource.medicalCapability && <div>Medical: {resource.medicalCapability}</div>}
      
      {resource.assignedIncidentId && (
        <div className="mt-2 pt-2 border-t border-gray-800 text-blue-300">
          Assigned to: <span className="font-bold">{resource.assignedIncidentId}</span>
          {resource.etaMinutes && <div>ETA: {resource.etaMinutes} min</div>}
        </div>
      )}
    </div>
  </div>
);
