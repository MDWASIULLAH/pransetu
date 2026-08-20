import { useState } from 'react';
import { X, CheckCircle, Crosshair } from 'lucide-react';
import { useEOC } from '../../context/EOCContext';

export const DispatchModal = ({ onClose, initialIncident }: { onClose: () => void, initialIncident: string | null }) => {
  const { incidents, resources, updateResourceState } = useEOC();
  const [incidentId, setIncidentId] = useState(initialIncident || (incidents[0]?.id || ''));
  const [selectedTeam, setSelectedTeam] = useState('');
  const [selectedAmbulance, setSelectedAmbulance] = useState('');
  const [success, setSuccess] = useState(false);

  const availableTeams = resources.filter(r => r.type === 'RESCUE_TEAM' && r.status === 'AVAILABLE');
  const availableAmbulances = resources.filter(r => r.type === 'AMBULANCE' && r.status === 'AVAILABLE');

  const handleDispatch = () => {
    if (selectedTeam) {
      updateResourceState(selectedTeam, { status: 'EN_ROUTE', assignedIncidentId: incidentId, etaMinutes: Math.floor(Math.random() * 20) + 5 });
    }
    if (selectedAmbulance) {
      updateResourceState(selectedAmbulance, { status: 'EN_ROUTE', assignedIncidentId: incidentId, etaMinutes: Math.floor(Math.random() * 15) + 5 });
    }
    
    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0a0e17] border border-[#1f2937] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-[#1f2937] flex justify-between items-center bg-[#111827]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Crosshair size={20} className="text-blue-400" /> Dispatch Workflow
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-[#1f2937] rounded-md text-gray-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <CheckCircle size={48} className="text-green-500 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Assets Dispatched!</h3>
            <p className="text-gray-400 text-sm">Status updated to EN ROUTE and tracking initiated.</p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Target Incident Cluster</label>
              <select 
                value={incidentId}
                onChange={(e) => setIncidentId(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] text-white p-3 rounded-lg focus:border-blue-500 outline-none"
              >
                {incidents.filter(i => i.status === 'ACTIVE').map(inc => (
                  <option key={inc.id} value={inc.id}>{inc.id} - Priority {inc.priorityScore}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Assign Rescue Team</label>
              <select 
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] text-white p-3 rounded-lg focus:border-blue-500 outline-none"
              >
                <option value="">-- Do not assign team --</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.id}>{team.name} ({team.members} members)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Assign Medical Resource</label>
              <select 
                value={selectedAmbulance}
                onChange={(e) => setSelectedAmbulance(e.target.value)}
                className="w-full bg-[#111827] border border-[#374151] text-white p-3 rounded-lg focus:border-blue-500 outline-none"
              >
                <option value="">-- Do not assign ambulance --</option>
                {availableAmbulances.map(amb => (
                  <option key={amb.id} value={amb.id}>{amb.name} ({amb.medicalCapability})</option>
                ))}
              </select>
            </div>

            <button 
              onClick={handleDispatch}
              disabled={!selectedTeam && !selectedAmbulance}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold py-3 rounded-lg transition-colors mt-4"
            >
              DISPATCH SELECTED RESOURCES
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
