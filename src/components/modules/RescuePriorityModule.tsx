import { useEOC } from '../../context/EOCContext';
import { useAuth } from '../../context/AuthContext';
import { Crosshair, AlertTriangle, Users, HeartPulse, Clock, Route } from 'lucide-react';
import { clsx } from 'clsx';

export const RescuePriorityModule = () => {
  const { incidents } = useEOC();
  const { hasPermission } = useAuth();
  
  const canChangePriority = hasPermission('incident.priority.change');

  // Sort by priority descending
  const sortedIncidents = [...incidents].sort((a, b) => b.priorityScore - a.priorityScore);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-wide">Rescue Priority Engine</h2>
        <p className="text-gray-400 text-sm mt-1">Transparent 0-100 scoring based on explainable hazard factors.</p>
      </div>

      <div className="space-y-6">
        {sortedIncidents.map((incident, idx) => (
          <div key={incident.id} className="glass-panel p-6 rounded-xl border border-[#1f2937] flex flex-col lg:flex-row gap-6 relative overflow-hidden">
            
            {/* Rank badge */}
            <div className="absolute top-0 left-0 bg-blue-600 text-white font-bold px-3 py-1 rounded-br-lg text-sm">
              #{idx + 1}
            </div>

            <div className="lg:w-1/3 mt-4 lg:mt-0 flex flex-col justify-between border-r border-[#1f2937] pr-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-2xl font-bold text-white">{incident.id}</h3>
                  <span className={clsx(
                    "px-2 py-0.5 rounded text-xs font-bold uppercase",
                    incident.priorityScore > 85 ? "bg-red-900/50 text-red-400 border border-red-500/50" :
                    incident.priorityScore > 70 ? "bg-orange-900/50 text-orange-400 border border-orange-500/50" :
                    "bg-yellow-900/50 text-yellow-400 border border-yellow-500/50"
                  )}>
                    {incident.priorityScore > 85 ? "CRITICAL" : incident.priorityScore > 70 ? "HIGH" : "MEDIUM"}
                  </span>
                </div>
                <div className="text-gray-400 mb-4">{incident.district} District Cluster</div>
                
                <div className="flex items-center gap-4 mb-2">
                  <div className="text-sm">
                    <span className="text-gray-500">SOS:</span> <span className="text-white font-bold">{incident.sosCount}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-gray-500">Affected:</span> <span className="text-orange-400 font-bold">{incident.affectedPeople}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Composite Priority Score</div>
                <div className="text-5xl font-mono font-bold text-blue-400">{incident.priorityScore}<span className="text-xl text-gray-600">/100</span></div>
              </div>
            </div>

            <div className="lg:w-2/3">
              <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2 flex items-center gap-2">
                <Crosshair size={16} /> Explainable Factor Breakdown
              </h4>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <FactorCard icon={HeartPulse} label="Medical Urgency" value={incident.priorityFactors.medicalUrgency} color="text-red-400" />
                <FactorCard icon={Users} label="People Affected" value={incident.priorityFactors.peopleAffected} color="text-orange-400" />
                <FactorCard icon={AlertTriangle} label="Trapped Status" value={incident.priorityFactors.trapped} color="text-red-400" />
                <FactorCard icon={AlertTriangle} label="Hazard Severity" value={incident.priorityFactors.hazardSeverity} color="text-yellow-400" />
                <FactorCard icon={Clock} label="SOS Age" value={incident.priorityFactors.sosAge} color="text-blue-400" />
                <FactorCard icon={Route} label="Accessibility" value={incident.priorityFactors.accessibility} color="text-gray-400" />
              </div>
              
              <div className="mt-6 flex justify-end gap-3">
                <button className="px-4 py-2 bg-[#1f2937] hover:bg-[#374151] text-white rounded-lg text-sm font-semibold transition-colors">
                  View Map Cluster
                </button>
                {canChangePriority && (
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-[0_0_10px_rgba(37,99,235,0.3)]">
                    Override Priority
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FactorCard = ({ icon: Icon, label, value, color }: { icon: any, label: string, value: number, color: string }) => (
  <div className="bg-[#111827] border border-[#1f2937] p-3 rounded-lg flex items-center gap-3">
    <div className={clsx("p-2 rounded bg-black/50", color)}>
      <Icon size={16} />
    </div>
    <div>
      <div className="text-xl font-bold text-white">+{value}</div>
      <div className="text-[10px] text-gray-400 uppercase leading-tight">{label}</div>
    </div>
  </div>
);
