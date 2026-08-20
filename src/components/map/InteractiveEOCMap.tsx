import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { useEOC } from '../../context/EOCContext';

// Fix Leaflet marker icon asset issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Custom Icon Generator for Pulsating SOS Beacons
const createPulsingIcon = (isCritical: boolean, isSelected: boolean) => {
  const color = isCritical ? '#ef4444' : '#f97316';
  const pulseColor = isCritical ? 'rgba(239, 68, 68, 0.4)' : 'rgba(249, 115, 22, 0.4)';
  const ring = isSelected ? 'border: 3px solid #ffffff; box-shadow: 0 0 15px #ffffff;' : 'border: 2px solid #ffffff;';

  return L.divIcon({
    className: 'custom-leaflet-sos-beacon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background-color: ${pulseColor}; animation: radar-pulse 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);"></div>
        <div style="position: relative; width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; ${ring} box-shadow: 0 0 10px ${color}; z-index: 10;"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const createShelterIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-shelter-icon',
    html: `
      <div style="background-color: #10b981; width: 22px; height: 22px; border-radius: 6px; border: 2px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px rgba(16, 185, 129, 0.8); color: #022c22; font-weight: bold; font-size: 11px;">
        H
      </div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });
};

const createTeamIcon = (label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-team-icon',
    html: `
      <div style="display: flex; align-items: center; gap: 4px; background: rgba(5, 20, 36, 0.9); border: 1px solid #22c55e; padding: 2px 6px; border-radius: 4px; box-shadow: 0 0 10px rgba(34, 197, 94, 0.5); backdrop-filter: blur(4px);">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #22c55e;"></div>
        <span style="font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: bold; color: #22c55e; white-space: nowrap;">${label}</span>
      </div>
    `,
    iconSize: [90, 24],
    iconAnchor: [45, 12]
  });
};

// Map Auto Resizer & Controller (Fixes clipped tiles / resizing issues)
const MapAutoResizer: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    map.invalidateSize();

    // Continuous ResizeObserver to catch sidebar close/open & canvas expansion
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    resizeObserver.observe(container);
    if (container.parentElement) {
      resizeObserver.observe(container.parentElement);
    }

    const t1 = setTimeout(() => map.invalidateSize(), 50);
    const t2 = setTimeout(() => map.invalidateSize(), 200);
    const t3 = setTimeout(() => map.invalidateSize(), 500);

    const handleResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      window.removeEventListener('resize', handleResize);
    };
  }, [map]);

  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);

  return null;
};

// Live GPS Coordinate Tracker (Mousemove & Pan listener)
const MapCoordinateTracker: React.FC<{ onCoordinatesChange: (coords: { lat: number; lng: number; zoom: number }) => void }> = ({ onCoordinatesChange }) => {
  useMapEvents({
    mousemove(e) {
      onCoordinatesChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        zoom: e.target.getZoom()
      });
    },
    moveend(e) {
      const center = e.target.getCenter();
      onCoordinatesChange({
        lat: center.lat,
        lng: center.lng,
        zoom: e.target.getZoom()
      });
    }
  });

  return null;
};

interface InteractiveEOCMapProps {
  showFloodZones?: boolean;
  showShelters?: boolean;
  showRoutes?: boolean;
  showRescueUnits?: boolean;
  mapType?: 'dark' | 'satellite';
  onMapTypeToggle?: (type: 'dark' | 'satellite') => void;
  height?: string;
  className?: string;
}

export const InteractiveEOCMap: React.FC<InteractiveEOCMapProps> = ({
  showFloodZones = true,
  showShelters = true,
  showRoutes = true,
  showRescueUnits = true,
  mapType: controlledMapType,
  onMapTypeToggle,
  height = '100%',
  className = ''
}) => {
  const { signals, selectedSignalId, setSelectedSignalId, shelters, dispatchTeamToSignal } = useEOC();

  const [internalMapType, setInternalMapType] = useState<'dark' | 'satellite'>('dark');
  const activeMapType = controlledMapType || internalMapType;

  const handleToggleMapType = (type: 'dark' | 'satellite') => {
    if (onMapTypeToggle) {
      onMapTypeToggle(type);
    } else {
      setInternalMapType(type);
    }
  };

  const [mapCenter, setMapCenter] = useState<[number, number]>([19.82, 85.83]);
  const [zoomLevel, setZoomLevel] = useState<number>(10);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 19.8135,
    lng: 85.8312,
    zoom: 10
  });

  // Selected signal centering
  useEffect(() => {
    if (selectedSignalId) {
      const found = signals.find((s) => s.id === selectedSignalId);
      if (found) {
        setMapCenter([found.lat, found.lng]);
        setZoomLevel(11);
        setLiveCoords({ lat: found.lat, lng: found.lng, zoom: 11 });
      }
    }
  }, [selectedSignalId, signals]);

  // Flood Inundation Polygon Data (Coastal Odisha lowlands)
  const puriFloodPolygon: [number, number][] = [
    [19.78, 85.78],
    [19.85, 85.86],
    [19.83, 85.92],
    [19.75, 85.89],
    [19.74, 85.81]
  ];

  const mahanadiDeltaPolygon: [number, number][] = [
    [20.42, 85.82],
    [20.52, 85.96],
    [20.48, 86.08],
    [20.35, 85.95]
  ];

  // Evacuation Corridors (NH-316 & Marine Drive)
  const marineDriveRoute: [number, number][] = [
    [19.80, 85.82],
    [19.82, 85.89],
    [19.88, 86.01],
    [19.90, 86.11]
  ];

  const khordhaPuriHighway: [number, number][] = [
    [19.81, 85.83],
    [19.98, 85.79],
    [20.15, 85.75],
    [20.27, 85.82]
  ];

  return (
    <div className={`relative w-full h-full min-h-[400px] overflow-hidden ${className}`} style={{ height }}>
      {/* Basemap Switcher (Positioned cleanly at bottom-left so it never overlaps top controls) */}
      {!controlledMapType && (
        <div className="absolute bottom-4 left-4 z-[400] flex items-center gap-1.5 bg-surface-container-high/90 border border-outline-variant p-1 rounded-lg shadow-xl backdrop-blur-md">
          <button
            onClick={() => handleToggleMapType('dark')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
              activeMapType === 'dark' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Tactical Dark
          </button>
          <button
            onClick={() => handleToggleMapType('satellite')}
            className={`px-2.5 py-1 text-xs font-bold rounded transition-colors cursor-pointer ${
              activeMapType === 'satellite' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Satellite GIS
          </button>
        </div>
      )}

      {/* Live Tactical GPS Location HUD Badge */}
      <div className="absolute bottom-3 right-3 z-[400] bg-surface-container-high/95 border border-outline-variant/80 px-2.5 py-1.5 rounded-lg shadow-2xl backdrop-blur-md flex items-center gap-2 font-mono text-[11px] sm:text-xs text-on-surface select-none">
        <span className="w-2 h-2 rounded-full bg-status-green animate-pulse"></span>
        <span className="text-primary font-bold">GPS:</span>
        <span className="text-status-green font-bold tracking-wider">
          {liveCoords.lat.toFixed(4)}° N, {liveCoords.lng.toFixed(4)}° E
        </span>
        <span className="text-on-surface-variant text-[10px] hidden sm:inline border-l border-outline-variant pl-2">
          SECTOR 4-B
        </span>
      </div>

      <MapContainer
        center={mapCenter}
        zoom={zoomLevel}
        zoomControl={true}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', minHeight: '400px', background: '#051424' }}
      >
        <MapAutoResizer center={mapCenter} zoom={zoomLevel} />
        <MapCoordinateTracker onCoordinatesChange={(coords) => setLiveCoords(coords)} />

        {/* Real Dynamic Tile Layers */}
        {activeMapType === 'dark' ? (
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            maxZoom={18}
          />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> World Imagery'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        )}

        {/* Flood Inundation Zones (Real Vector Overlays) */}
        {showFloodZones && (
          <>
            <Polygon
              positions={puriFloodPolygon}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#2563eb',
                fillOpacity: 0.28,
                weight: 2,
                dashArray: '6, 6'
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong className="text-blue-400 block mb-1">Puri Coastal Surge Zone</strong>
                  <p className="text-gray-300">Inundation depth: 1.8m - 2.4m above ground level.</p>
                  <p className="text-primary font-mono text-[10px] mt-1">GPS: 19.8135, 85.8312</p>
                </div>
              </Popup>
            </Polygon>

            <Polygon
              positions={mahanadiDeltaPolygon}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#2563eb',
                fillOpacity: 0.25,
                weight: 2,
                dashArray: '6, 6'
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong className="text-blue-400 block mb-1">Mahanadi Delta Inundation Sector</strong>
                  <p className="text-gray-300">High flood discharge warning active.</p>
                  <p className="text-primary font-mono text-[10px] mt-1">GPS: 20.4500, 85.9500</p>
                </div>
              </Popup>
            </Polygon>

            <Circle
              center={[19.8135, 85.8312]}
              radius={2400}
              pathOptions={{
                color: '#ef4444',
                fillColor: '#ef4444',
                fillOpacity: 0.15,
                weight: 1.5
              }}
            />
          </>
        )}

        {/* Evacuation Corridors & High-Priority Routes */}
        {showRoutes && (
          <>
            <Polyline
              positions={marineDriveRoute}
              pathOptions={{
                color: '#f97316',
                weight: 3.5,
                opacity: 0.85,
                dashArray: '8, 6'
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong className="text-orange-400 block">Marine Drive Evacuation Corridor</strong>
                  <span className="text-gray-300">Cleared for Emergency First Responder Convoys</span>
                </div>
              </Popup>
            </Polyline>

            <Polyline
              positions={khordhaPuriHighway}
              pathOptions={{
                color: '#f97316',
                weight: 3.5,
                opacity: 0.85,
                dashArray: '8, 6'
              }}
            >
              <Popup>
                <div className="text-xs">
                  <strong className="text-orange-400 block">NH-316 Coastal Arterial Route</strong>
                  <span className="text-gray-300">Active convoy transit towards Bhubaneswar</span>
                </div>
              </Popup>
            </Polyline>
          </>
        )}

        {/* Evacuation Shelters */}
        {showShelters &&
          shelters.map((shelter) => (
            <Marker
              key={shelter.id}
              position={[shelter.lat, shelter.lng]}
              icon={createShelterIcon()}
            >
              <Popup>
                <div className="min-w-[210px] text-xs">
                  <div className="flex justify-between items-center pb-1 mb-1 border-b border-gray-700">
                    <strong className="text-green-400">{shelter.name}</strong>
                    <span className="text-[10px] bg-green-950 text-green-300 px-1 rounded">{shelter.zone}</span>
                  </div>
                  <div className="space-y-1 text-gray-200">
                    <div>GPS: <span className="font-mono text-primary font-bold">{shelter.lat.toFixed(4)}, {shelter.lng.toFixed(4)}</span></div>
                    <div>Capacity: <strong>{shelter.capacity}</strong> | Occupied: <strong>{shelter.occupied}</strong> ({Math.round((shelter.occupied / shelter.capacity) * 100)}%)</div>
                    <div>Medical Tier: <span className="text-yellow-400">{shelter.tierText}</span></div>
                    <div>Water: <strong>{shelter.drinkingWaterLiters.toLocaleString()} L</strong></div>
                    <div>Power: <span className="text-gray-300">{shelter.generatorStatus}</span></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* Deployed Rescue Units */}
        {showRescueUnits && (
          <>
            <Marker position={[19.825, 85.842]} icon={createTeamIcon('NDRF-ALPHA 03')} />
            <Marker position={[19.795, 85.815]} icon={createTeamIcon('ODRAF-BRAVO 07')} />
          </>
        )}

        {/* Real Dynamic SOS Distress Signals */}
        {signals.map((sig) => {
          const isCritical = sig.status === 'Critical';
          const isSelected = selectedSignalId === sig.id;

          return (
            <Marker
              key={sig.id}
              position={[sig.lat, sig.lng]}
              icon={createPulsingIcon(isCritical, isSelected)}
              eventHandlers={{
                click: () => {
                  setSelectedSignalId(sig.id);
                }
              }}
            >
              <Popup>
                <div className="min-w-[230px] text-xs">
                  <div className="flex justify-between items-center pb-1 mb-2 border-b border-outline-variant">
                    <strong className="text-primary font-mono text-sm">{sig.id}</strong>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        isCritical ? 'bg-red-950 text-red-300' : 'bg-orange-950 text-orange-300'
                      }`}
                    >
                      {sig.status.toUpperCase()} ({sig.score} PTS)
                    </span>
                  </div>

                  <div className="space-y-1 mb-2.5 text-gray-200">
                    <div>Location: <strong>{sig.loc}</strong></div>
                    <div>GPS: <span className="font-mono text-status-green font-bold">{sig.lat.toFixed(4)}° N, {sig.lng.toFixed(4)}° E</span></div>
                    <div>People Trapped: <strong>{sig.people}</strong></div>
                    <div>Relay: <span className="text-primary">{sig.relay} (Hop {sig.hop})</span></div>
                    <div className="text-gray-400 italic text-[11px] mt-1 line-clamp-2">{sig.details}</div>
                  </div>

                  {sig.status !== 'Resolved' && sig.status !== 'Dispatched' && (
                    <button
                      onClick={() => dispatchTeamToSignal(sig.id)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[14px]">send</span>
                      Dispatch Rescue Unit
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};
