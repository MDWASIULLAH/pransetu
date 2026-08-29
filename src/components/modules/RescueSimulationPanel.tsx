import React, { useEffect, useState } from 'react';
import type { ClusterInfo } from '../../services/sosProcessingService';

interface RescueSimulationPanelProps {
  highestRiskCluster: ClusterInfo | null;
}

export const RescueSimulationPanel: React.FC<RescueSimulationPanelProps> = ({ highestRiskCluster }) => {
  const [simulationState, setSimulationState] = useState<number>(0);

  // Animate the pipeline steps based on the cluster's threshold state
  useEffect(() => {
    if (!highestRiskCluster) {
      setSimulationState(0);
      return;
    }

    let targetState = 0;
    if (highestRiskCluster.uniqueCount > 0) targetState = 3;
    if (highestRiskCluster.uniqueCount >= 5) targetState = 6;
    if (highestRiskCluster.thresholdReached) targetState = 12;

    if (simulationState < targetState) {
      const timer = setTimeout(() => {
        setSimulationState(prev => prev + 1);
      }, 800);
      return () => clearTimeout(timer);
    } else if (simulationState > targetState) {
       setSimulationState(targetState);
    }
  }, [highestRiskCluster, simulationState]);

  const pipelineSteps = [
    { label: 'SOS RECEIVED', active: simulationState >= 1 },
    { label: 'CITIZEN VERIFIED', active: simulationState >= 2 },
    { label: 'LOCATION IDENTIFIED', active: simulationState >= 3 },
    { label: 'DUPLICATE ANALYSIS', active: simulationState >= 4 },
    { label: 'WEATHER CHECK', active: simulationState >= 5 },
    { label: 'DISASTER ALERT VERIFICATION', active: simulationState >= 6 },
    { label: 'AREA HOTSPOT DETECTED', active: simulationState >= 7 },
    { label: `VALIDATED SOS COUNT: ${highestRiskCluster?.uniqueCount || 0} / 50`, active: simulationState >= 8 },
    { label: 'MONITORING', active: simulationState >= 9 && !highestRiskCluster?.thresholdReached },
    { label: 'THRESHOLD REACHED', active: simulationState >= 10, isError: true },
    { label: 'RESCUE DISPATCH DECISION', active: simulationState >= 11, isError: true },
    { label: 'RESCUE TEAM RECOMMENDED', active: simulationState >= 12, isError: true },
  ];

  return (
    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-outline-variant pb-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-xl">account_tree</span>
          <h2 className="text-sm font-bold text-on-surface tracking-wide uppercase">Rescue Response Simulation</h2>
        </div>
        <span className="bg-primary/20 text-primary text-[9px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
          SIMULATION MODE — NO REAL DISPATCH
        </span>
      </div>

      <div className="flex flex-col gap-1.5 px-2 relative">
        {pipelineSteps.map((step, idx) => (
          <div key={idx} className="flex flex-col">
            <div className={`flex items-center gap-3 transition-opacity duration-300 ${step.active ? 'opacity-100' : 'opacity-30 grayscale'}`}>
              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${step.active ? (step.isError ? 'bg-error shadow-[0_0_8px_rgba(255,84,73,0.6)]' : 'bg-[#3DDC84] shadow-[0_0_8px_rgba(61,220,132,0.4)]') : 'bg-outline-variant'}`} />
              <span className={`text-[11px] font-bold tracking-wider uppercase ${step.active ? (step.isError ? 'text-error' : 'text-on-surface') : 'text-on-surface-variant'}`}>
                {step.label}
              </span>
            </div>
            {idx < pipelineSteps.length - 1 && (
              <div className="w-0.5 h-3 bg-outline-variant ml-[5px] my-0.5" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
