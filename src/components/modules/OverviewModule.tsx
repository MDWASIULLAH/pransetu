import { useEOC } from '../../context/EOCContext';
import { MetricCard } from '../common/MetricCard';
import { 
  AlertTriangle, Users, HeartPulse, 
  CheckCircle, HelpCircle, ShieldAlert, Home,
  Truck, Ship, RadioReceiver, Clock
} from 'lucide-react';

export const OverviewModule = () => {
  const { stats } = useEOC();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Command Dashboard</h2>
          <p className="text-gray-400 text-sm mt-1">Real-time situational awareness & asset tracking</p>
        </div>
        <div className="text-right">
          <div className="text-sm font-mono text-gray-400">SYNC INTERVAL</div>
          <div className="text-green-400 font-bold font-mono animate-pulse">LIVE</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <MetricCard 
          title="Active SOS" 
          value={stats.activeSOS} 
          icon={RadioReceiver} 
          color="blue" 
          trend={{ value: '+3', positive: false }}
        />
        <MetricCard 
          title="Critical Emergencies" 
          value={stats.criticalSOS} 
          icon={AlertTriangle} 
          color="red"
          pulse={stats.criticalSOS > 0}
        />
        <MetricCard 
          title="Affected Population" 
          value={stats.totalAffected.toLocaleString()} 
          icon={Users} 
          color="orange" 
        />
        <MetricCard 
          title="Active Incidents" 
          value={stats.activeIncidents} 
          icon={ShieldAlert} 
          color="yellow" 
        />
      </div>

      <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-800 pb-2">Emergency Classifications</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        <MetricCard title="Assistance" value={stats.assistanceSOS} color="yellow" />
        <MetricCard title="Trapped" value={stats.trapped} color="orange" pulse={stats.trapped > 0} />
        <MetricCard title="Medical" value={stats.medical} icon={HeartPulse} color="red" />
        <MetricCard title="Safe Confirmed" value={stats.safe} icon={CheckCircle} color="green" />
        <MetricCard title="Unaccounted" value={stats.unaccounted} icon={HelpCircle} color="gray" />
        <MetricCard title="Pending Sync" value={stats.pendingSync} color="blue" />
      </div>

      <h3 className="text-lg font-semibold text-gray-300 mb-4 border-b border-gray-800 pb-2">Resource Status</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard 
          title="Shelters Active" 
          value={stats.sheltersCount} 
          icon={Home} 
          color="blue" 
          trend={{ value: `${stats.shelterOccupancy}% Full`, positive: stats.shelterOccupancy < 80 }}
        />
        <MetricCard title="Rescue Teams" value={`${stats.availableTeams}/${stats.rescueTeams}`} icon={Users} color="green" />
        <MetricCard title="Ambulances" value={stats.ambulances} icon={Truck} color="blue" />
        <MetricCard title="Rescue Boats" value={stats.availableBoats} icon={Ship} color="blue" />
        <MetricCard title="Avg SOS Delivery" value={stats.avgDeliveryTime} icon={Clock} color="gray" />
      </div>
    </div>
  );
};
