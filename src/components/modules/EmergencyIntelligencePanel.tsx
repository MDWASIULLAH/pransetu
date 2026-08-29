import React from 'react';
import type { ClusterInfo } from '../../services/sosProcessingService';

interface EmergencyIntelligencePanelProps {
  clusters: ClusterInfo[];
}

export const EmergencyIntelligencePanel: React.FC<EmergencyIntelligencePanelProps> = ({ clusters }) => {
  const highestRiskCluster = clusters.length > 0 ? clusters[0] : null;

  return (
    <div className="bg-surface-container rounded-xl p-4 border border-outline-variant flex flex-col gap-4">
      <div className="flex items-center gap-2 border-b border-outline-variant pb-2">
        <span className="material-symbols-outlined text-primary text-xl">psychology</span>
        <h2 className="text-sm font-bold text-on-surface tracking-wide uppercase">AI Emergency Intelligence</h2>
      </div>

      {!highestRiskCluster ? (
        <div className="text-center py-6 text-on-surface-variant text-xs">
          No active SOS clusters detected.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Highest Risk Area */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-on-surface-variant uppercase font-medium">Highest Risk Area</span>
            <span className="text-sm font-bold text-error">
              {highestRiskCluster.clusterId.replace('CLUSTER-', 'Area ')}
            </span>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-surface-container-high rounded-lg p-2.5 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Validated SOS</span>
              <span className="text-xl font-black text-on-surface">
                {highestRiskCluster.uniqueCount} <span className="text-xs text-tertiary font-normal">/ 50</span>
              </span>
            </div>
            <div className="bg-surface-container-high rounded-lg p-2.5 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Duplicate SOS</span>
              <span className="text-xl font-bold text-on-surface-variant">
                {highestRiskCluster.duplicateCount}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
             <div className="bg-surface-container-high rounded-lg p-2.5 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">SOS Velocity</span>
              <span className="text-sm font-bold text-primary">
                +{highestRiskCluster.velocityLast15Min} <span className="text-[10px] text-on-surface-variant font-normal">/ 15m</span>
              </span>
            </div>
             <div className="bg-surface-container-high rounded-lg p-2.5 flex flex-col items-center justify-center">
              <span className="text-[10px] text-on-surface-variant uppercase tracking-wider mb-1">Priority</span>
              <span className={`text-sm font-bold ${highestRiskCluster.priority === 'CRITICAL' ? 'text-error' : highestRiskCluster.priority === 'HIGH' ? 'text-orange-400' : 'text-primary'}`}>
                {highestRiskCluster.priority}
              </span>
            </div>
          </div>

          {/* Threshold Status */}
          <div className={`mt-2 p-3 rounded-lg border flex items-center justify-between ${highestRiskCluster.thresholdReached ? 'bg-error/10 border-error/30' : 'bg-surface-container-high border-outline-variant'}`}>
            <div className="flex flex-col">
              <span className="text-[10px] text-on-surface-variant uppercase font-medium">Rescue Threshold</span>
              <span className={`text-xs font-bold ${highestRiskCluster.thresholdReached ? 'text-error' : 'text-on-surface'}`}>
                {highestRiskCluster.thresholdReached ? 'THRESHOLD REACHED' : `${50 - highestRiskCluster.uniqueCount} SOS REQUIRED`}
              </span>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded font-bold ${highestRiskCluster.thresholdReached ? 'bg-error text-on-error' : 'bg-surface-variant text-on-surface-variant'}`}>
              {highestRiskCluster.thresholdReached ? 'DISPATCH RECOMMENDED' : 'MONITORING'}
            </span>
          </div>

        </div>
      )}
    </div>
  );
};
