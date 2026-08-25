import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, LayerGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEOC } from '../../context/EOCContext';
import { useAuth } from '../../context/AuthContext';
import { DeliveryPill, SeverityBadge } from '../common/Badges';

// Custom icons
const createIcon = (color: string) => L.divIcon({
  className: 'custom-div-icon bg-transparent',
  html: `<div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: translateY(-50%);">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32px" height="32px" style="filter: drop-shadow(0px 3px 4px rgba(0,0,0,0.5)); stroke: white; stroke-width: 1.5px; overflow: visible;">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

const icons = {
  CRITICAL: createIcon('#ef4444'),
  HIGH: createIcon('#f97316'),
  MEDIUM: createIcon('#eab308'),
  LOW: createIcon('#3b82f6'),
  SHELTER: L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #3b82f6; width: 18px; height: 18px; border-radius: 4px; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px;">H</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  }),
  TEAM: L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: #22c55e; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 10px;">T</div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9]
  })
};

export const EOCMap = () => {
  const { sosList, incidents, shelters, resources } = useEOC();
  const { hasPermission } = useAuth();
  
  const canSeeExact = hasPermission('sos.exact_location');
  const canSeeTeams = hasPermission('rescue.view');

  // Fix leaflet default icon issue
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  return (
    <MapContainer 
      center={[19.82, 85.83]} 
      zoom={11} 
      style={{ height: '100%', width: '100%', background: '#0a0e17' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      
      {/* Incidents Clusters */}
      <LayerGroup>
        {incidents.map(inc => (
          <Circle
            key={inc.id}
            center={[inc.lat, inc.lng]}
            radius={inc.radiusKm * 1000}
            pathOptions={{ 
              color: '#f97316', 
              fillColor: '#f97316', 
              fillOpacity: 0.1,
              weight: 1,
              dashArray: '5, 5'
            }}
          >
            <Popup>
              <div className="p-1 min-w-[200px]">
                <h4 className="font-bold text-white mb-2">{inc.id}</h4>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div className="text-on-surface-variant">District</div><div className="text-right text-gray-200">{inc.district}</div>
                  <div className="text-on-surface-variant">Affected</div><div className="text-right text-orange-400 font-bold">{inc.affectedPeople}</div>
                  <div className="text-on-surface-variant">SOS Count</div><div className="text-right text-gray-200">{inc.sosCount}</div>
                  <div className="text-on-surface-variant">Critical</div><div className="text-right text-red-400 font-bold">{inc.criticalCount}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                  <div className="text-[10px] text-on-surface-variant uppercase mb-1">Rescue Priority</div>
                  <div className="text-2xl font-sans text-orange-400">{inc.priorityScore}/100</div>
                </div>
              </div>
            </Popup>
          </Circle>
        ))}
      </LayerGroup>

      {/* SOS Markers */}
      <LayerGroup>
        {sosList.map(sos => {
          // If no permission, obfuscate coordinates slightly (add noise)
          const lat = canSeeExact ? sos.lat : sos.lat + (Math.random() - 0.5) * 0.01;
          const lng = canSeeExact ? sos.lng : sos.lng + (Math.random() - 0.5) * 0.01;
          
          const ageMin = Math.round((Date.now() - new Date(sos.locationTimestamp).getTime()) / 60000);
          const isStale = ageMin > 5;
          
          return (
            <Marker
              key={sos.id}
              position={[lat, lng]}
              icon={(icons as any)[sos.severity] || icons.MEDIUM}
            >
              <Popup>
                <div className="p-1 min-w-[220px]">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-white">{sos.id}</h4>
                    <SeverityBadge severity={sos.severity} />
                  </div>
                  
                  {isStale && (
                    <div className="bg-yellow-900/30 border border-yellow-500/30 text-yellow-400 text-[10px] px-2 py-1 rounded mb-3 flex flex-col">
                      <span className="font-bold">LAST KNOWN LOCATION</span>
                      <span>Age: {ageMin} minutes</span>
                    </div>
                  )}
                  
                  <div className="space-y-1.5 text-xs mb-3">
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">People:</span>
                      <span className="text-gray-200 font-bold">{sos.peopleCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Medical:</span>
                      <span className={sos.medicalRequired ? "text-red-400 font-bold" : "text-on-surface-variant"}>
                        {sos.medicalRequired ? 'URGENT' : 'NO'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-on-surface-variant">Relay Hops:</span>
                      <span className="text-gray-200 font-sans">{sos.hopCount}</span>
                    </div>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-2 pb-1">
                    <DeliveryPill state={sos.deliveryState} />
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </LayerGroup>

      {/* Shelters */}
      <LayerGroup>
        {shelters.map(sh => (
          <Marker key={sh.id} position={[sh.lat, sh.lng]} icon={icons.SHELTER}>
            <Popup>
              <div className="p-1">
                <h4 className="font-bold text-white mb-1">{sh.name}</h4>
                <div className="text-xs text-on-surface-variant mb-2">Capacity: {sh.occupied}/{sh.capacity} ({(sh.occupied/sh.capacity*100).toFixed(0)}%)</div>
                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full" style={{ width: `${(sh.occupied/sh.capacity)*100}%` }}></div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </LayerGroup>
      
      {/* Rescue Teams */}
      {canSeeTeams && (
        <LayerGroup>
          {resources.filter(r => r.type === 'RESCUE_TEAM' && (r.status === 'AVAILABLE' || r.status === 'EN_ROUTE')).map(team => (
            <Marker key={team.id} position={[team.lat, team.lng]} icon={icons.TEAM}>
              <Popup>
                <div className="p-1">
                  <h4 className="font-bold text-white">{team.name}</h4>
                  <div className="text-xs text-on-surface-variant">{team.status.replace('_', ' ')}</div>
                </div>
              </Popup>
            </Marker>
          ))}
        </LayerGroup>
      )}
    </MapContainer>
  );
};
