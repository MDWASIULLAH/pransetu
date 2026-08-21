import { clsx } from 'clsx';
import type { SOSSeverity, DeliveryState } from '../../types/sos';

export const SeverityBadge = ({ severity }: { severity: SOSSeverity }) => {
  switch (severity) {
    case 'CRITICAL':
      return <span className="px-2 py-0.5 rounded-sm bg-red-900/50 text-red-400 border border-red-500/50 text-[10px] font-bold tracking-wider uppercase ">Critical</span>;
    case 'HIGH':
      return <span className="px-2 py-0.5 rounded-sm bg-orange-900/50 text-orange-400 border border-orange-500/50 text-[10px] font-bold tracking-wider uppercase">High</span>;
    case 'MEDIUM':
      return <span className="px-2 py-0.5 rounded-sm bg-yellow-900/50 text-yellow-400 border border-yellow-500/50 text-[10px] font-bold tracking-wider uppercase">Medium</span>;
    case 'LOW':
      return <span className="px-2 py-0.5 rounded-sm bg-surface-container-low text-on-surface border border-blue-500/50 text-[10px] font-bold tracking-wider uppercase">Low</span>;
  }
};

export const DeliveryPill = ({ state }: { state: DeliveryState }) => {
  const getStyle = () => {
    switch (state) {
      case 'SERVER_DELIVERED': return 'bg-green-900/40 text-green-400 border-green-500/30';
      case 'GATEWAY_RECEIVED': return 'bg-teal-900/40 text-teal-400 border-teal-500/30';
      case 'RELAYED': return 'bg-blue-900/40 text-on-surface border-outline-variant/30';
      case 'RELAYING': return 'bg-yellow-900/40 text-yellow-400 border-yellow-500/30';
      case 'STORED': return 'bg-purple-900/40 text-on-surface-variant border-purple-500/30';
      case 'CREATED': return 'bg-gray-800 text-on-surface-variant border-gray-600';
      case 'CLOSED': return 'bg-gray-900 text-gray-500 border-gray-800 line-through';
    }
  };

  return (
    <span className={clsx("px-2 py-0.5 rounded-full border text-[9px] font-sans uppercase tracking-wide", getStyle())}>
      {state.replace('_', ' ')}
    </span>
  );
};
