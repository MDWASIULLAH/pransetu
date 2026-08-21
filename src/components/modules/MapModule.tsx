import { EOCMap } from '../map/EOCMap';

export const MapModule = () => {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 bg-surface-container border-b border-outline-variant/30 flex justify-between items-center z-10 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">Live Tactical Map</h2>
          <p className="text-on-surface-variant text-xs mt-1">Geospatial tracking of SOS, shelters, and rescue resources</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            
            <span className="text-xs text-red-400 font-sans">CRITICAL SOS</span>
          </div>
          <div className="flex items-center gap-2">
            
            <span className="text-xs text-orange-400 font-sans">INCIDENT CLUSTER</span>
          </div>
        </div>
      </div>
      <div className="flex-1 relative z-0">
        <EOCMap />
      </div>
    </div>
  );
};
