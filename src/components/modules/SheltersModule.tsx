import { useEOC } from '../../context/EOCContext';
import { Home, HeartPulse, Box } from 'lucide-react';
import { clsx } from 'clsx';

export const SheltersModule = () => {
  const { shelters, stats } = useEOC();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-wide">Shelter Operations</h2>
          <p className="text-on-surface-variant text-sm mt-1">Real-time capacity and resource monitoring for safe zones.</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-sans text-white font-bold">{stats.shelterOccupancy}%</div>
          <div className="text-xs text-gray-500 uppercase tracking-wider">Global Occupancy</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {shelters.map(shelter => {
          const occPercent = (shelter.occupied / shelter.capacity) * 100;
          const isFull = occPercent >= 100;
          const isWarning = occPercent > 80 && !isFull;
          
          return (
            <div key={shelter.id} className="glass-panel p-6 rounded-xl border border-outline-variant/30 hover:border-gray-600 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Home size={20} className={isFull ? 'text-red-500' : 'text-on-surface'} /> 
                    {shelter.name}
                  </h3>
                  <div className="text-sm text-on-surface-variant mt-1">{shelter.district} District</div>
                </div>
                <div className={clsx(
                  "px-3 py-1 rounded border text-xs font-bold uppercase tracking-wider",
                  isFull ? "bg-red-900/50 text-red-400 border-red-500/50" : 
                  isWarning ? "bg-yellow-900/50 text-yellow-400 border-yellow-500/50" : 
                  "bg-green-900/50 text-green-400 border-green-500/50"
                )}>
                  {shelter.status}
                </div>
              </div>

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-on-surface-variant">Occupancy</span>
                  <span className="text-white font-bold">{shelter.occupied} / {shelter.capacity} ({occPercent.toFixed(0)}%)</span>
                </div>
                <div className="w-full bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div className={clsx(
                    "h-full rounded-full",
                    isFull ? "bg-red-500" : isWarning ? "bg-yellow-500" : "bg-blue-500"
                  )} style={{ width: `${Math.min(occPercent, 100)}%` }}></div>
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">{shelter.capacity - shelter.occupied} slots available</div>
              </div>

              <div className="flex flex-wrap gap-2">
                {shelter.medicalCapability && (
                  <span className="bg-red-900/20 text-red-400 border border-red-500/30 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <HeartPulse size={12} /> Medical Capable
                  </span>
                )}
                {shelter.facilities?.map(fac => (
                  <span key={fac} className="bg-gray-800 text-on-surface-variant border border-gray-700 px-2 py-1 rounded text-xs flex items-center gap-1">
                    <Box size={12} /> {fac}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
