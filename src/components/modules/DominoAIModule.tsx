import { BrainCircuit, ArrowDown, AlertTriangle } from 'lucide-react';

export const DominoAIModule = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white tracking-wide">Domino-AI: Cascading Disaster Prediction</h2>
        <p className="text-gray-400 text-sm mt-1">Rule-based and ML predictive modeling for cascading disaster consequences.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-bold text-gray-300 mb-6">Current Predicted Cascade: Cyclone Path</h3>
          <div className="space-y-2 relative">
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-700 z-0"></div>
            
            <CascadeNode label="Cyclone" severity="critical" />
            <ArrowDown className="ml-4 text-gray-600 relative z-10" size={16}/>
            <CascadeNode label="Heavy rainfall (> 200mm)" severity="high" />
            <ArrowDown className="ml-4 text-gray-600 relative z-10" size={16}/>
            <CascadeNode label="River rise (Mahanadi & Bhargavi)" severity="high" />
            <ArrowDown className="ml-4 text-gray-600 relative z-10" size={16}/>
            <CascadeNode label="Flooding (Low-lying Khordha/Puri)" severity="critical" />
            <ArrowDown className="ml-4 text-gray-600 relative z-10" size={16}/>
            <CascadeNode label="Road blockage (NH-316 compromised)" severity="medium" />
            <ArrowDown className="ml-4 text-gray-600 relative z-10" size={16}/>
            <CascadeNode label="Isolation & Rescue difficulty" severity="high" />
            <ArrowDown className="ml-4 text-gray-600 relative z-10" size={16}/>
            <CascadeNode label="Shelter pressure (+45% occupancy expected)" severity="medium" />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
            <BrainCircuit size={20} className="text-blue-400" />
            AI Command Recommendations
          </h3>
          <div className="glass-panel p-6 rounded-xl border border-blue-500/30 space-y-6">
            
            <div className="bg-[#111827] border border-blue-900/50 p-4 rounded-lg">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">RECOMMENDATION A1</div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                "INC-018 has elevated rescue priority (92/100) because of medical urgency, trapped status, population density and predicted road accessibility loss in the next 4 hours."
              </p>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-blue-400">Model: Gemini-Flash-8B</span>
                <span className="text-green-400">Confidence: 94%</span>
              </div>
            </div>

            <div className="bg-[#111827] border border-blue-900/50 p-4 rounded-lg">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-mono">RECOMMENDATION A2</div>
              <p className="text-gray-300 text-sm leading-relaxed mb-3">
                "Shelter occupancy in Puri district is projected to reach 100% capacity by 18:00 HRS. Recommend redirecting newly evacuated populations to Cuttack sector shelters."
              </p>
              <div className="flex gap-4 text-xs font-mono">
                <span className="text-blue-400">Model: Logistic-Reg-V4</span>
                <span className="text-green-400">Confidence: 87%</span>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-lg">
              <div className="text-xs text-red-500 uppercase tracking-wider mb-2 font-mono font-bold flex items-center gap-1"><AlertTriangle size={12}/> AI LIMITATION ENFORCED</div>
              <p className="text-red-300 text-sm">
                Domino-AI is operating in Decision-Support Mode. Physical rescue resources (Teams, Ambulances, Boats) MUST be manually dispatched by an authorized DMO or Rescue Coordinator.
              </p>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

const CascadeNode = ({ label, severity }: { label: string, severity: 'critical'|'high'|'medium' }) => {
  const getStyle = () => {
    if (severity === 'critical') return 'bg-red-900/30 border-red-500/50 text-red-100 shadow-[0_0_10px_rgba(239,68,68,0.2)]';
    if (severity === 'high') return 'bg-orange-900/30 border-orange-500/50 text-orange-100';
    return 'bg-yellow-900/30 border-yellow-500/50 text-yellow-100';
  };
  
  return (
    <div className={`p-3 rounded-lg border relative z-10 w-full max-w-sm ${getStyle()}`}>
      <span className="font-semibold text-sm">{label}</span>
    </div>
  );
};
