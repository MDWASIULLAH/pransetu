import React, { useEffect, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Circle,
  Polygon,
  Polyline,
  ZoomControl,
  useMap,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { useEOC } from '../../context/EOCContext';
import { fetchCoordinatesWeather, type DistrictWeather } from '../../services/weatherService';

// Fix Leaflet marker icon asset issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Helper for Stale GPS determination
export const getLocationAgeInfo = (timestampStr?: string, defaultAgeMin?: number) => {
  const now = Date.now();
  let ageMinutes = defaultAgeMin !== undefined ? defaultAgeMin : 0;

  if (timestampStr) {
    try {
      const parsed = new Date(timestampStr.includes('T') ? timestampStr : Date.now()).getTime();
      if (!isNaN(parsed)) {
        ageMinutes = Math.max(0, Math.round((now - parsed) / 60000));
      }
    } catch {
      // Keep default
    }
  }

  const isStale = ageMinutes >= 5;
  const ageDisplay = ageMinutes >= 60 ? `${Math.floor(ageMinutes / 60)}h ${ageMinutes % 60}m` : `${ageMinutes} minutes`;
  return { isStale, ageMinutes, ageDisplay };
};

// 1. SOS Beacon Icons (Live Pulsing vs Stale Warning)
const createSOSIcon = (isCritical: boolean, isSelected: boolean, isStale: boolean, ageDisplay: string) => {
  if (isStale) {
    // Stale GPS (NEVER display as LIVE)
    return L.divIcon({
      className: 'custom-leaflet-stale-sos',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <div style="width: 14px; height: 14px; border-radius: 50%; background-color: #d97706; border: 2px solid #ffffff; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
          <span style="font-family: system-ui, sans-serif; font-size: 9px; font-weight: 600; background: #ffffff; color: #b45309; padding: 1px 4px; border-radius: 10px; margin-top: 4px; white-space: nowrap; border: 1px solid #fde68a; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            Stale (${ageDisplay})
          </span>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });
  }

  // Live GPS (Real-Time Radar Pulse)
  const color = isCritical ? '#ef4444' : '#f97316';
  const pulseColor = isCritical ? 'rgba(239, 68, 68, 0.45)' : 'rgba(249, 115, 22, 0.45)';
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

// 2. Incident Cluster Icon (DBSCAN)
const createIncidentClusterIcon = (incidentId: string, priorityScore: number, sosCount: number) => {
  const isHigh = priorityScore >= 80;
  const bgColor = isHigh ? '#ef4444' : '#f97316';
  return L.divIcon({
    className: 'custom-leaflet-incident-cluster',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 4px 8px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 8px; height: 8px; border-radius: 50%; background-color: ${bgColor};"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 11px; font-weight: 600; color: #0f172a;">Cluster ${incidentId}</span>
        <span style="background: #f1f5f9; color: #475569; padding: 1px 5px; border-radius: 10px; font-size: 9px; font-weight: 600;">${sosCount} SOS</span>
      </div>
    `,
    iconSize: [120, 28],
    iconAnchor: [60, 14]
  });
};

// 3. Shelter Icon
const createShelterIcon = (status: string = 'OPEN', occupancyPct: number = 0) => {
  let bgColor = '#10b981'; // Green
  let label = 'Shelter';
  
  if (status === 'DAMAGED' || status === 'CLOSED') {
    bgColor = '#64748b';
    label = 'Closed';
  } else if (status === 'FULL' || occupancyPct >= 100) {
    bgColor = '#ef4444';
    label = 'Full';
  } else if (occupancyPct >= 80) {
    bgColor = '#f59e0b';
    label = `${Math.round(occupancyPct)}%`;
  }

  return L.divIcon({
    className: 'custom-leaflet-shelter-icon',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 8px; height: 8px; border-radius: 2px; background-color: ${bgColor};"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #334155;">${label}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

// 4. Polymorphic Fleet Icons (Ambulances, Rescue Teams, Boats, Medical Teams, Vehicles)
const createAmbulanceIcon = (name: string, status: string) => {
  const isAvailable = status === 'AVAILABLE';
  const color = isAvailable ? '#10b981' : '#f59e0b';
  return L.divIcon({
    className: 'custom-leaflet-amb-icon',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color};"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #334155;">${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

const createRescueTeamIcon = (name: string, status: string) => {
  const color = status === 'AVAILABLE' ? '#10b981' : '#0ea5e9';
  return L.divIcon({
    className: 'custom-leaflet-team-icon',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color};"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #334155;">${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

const createBoatIcon = (name: string, status: string) => {
  const color = status === 'AVAILABLE' ? '#06b6d4' : '#0284c7';
  return L.divIcon({
    className: 'custom-leaflet-boat-icon',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color};"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #334155;">${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

const createMedicalTeamIcon = (name: string, status: string) => {
  const color = status === 'AVAILABLE' ? '#34d399' : '#059669';
  return L.divIcon({
    className: 'custom-leaflet-med-icon',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: ${color};"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #334155;">${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

const createVehicleIcon = (name: string) => {
  return L.divIcon({
    className: 'custom-leaflet-veh-icon',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #f97316;"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #334155;">${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

const createDepotIcon = (name: string) => {
  return L.divIcon({
    className: 'custom-leaflet-depot-icon',
    html: `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; align-items: center; gap: 6px; white-space: nowrap;">
        <span style="width: 6px; height: 6px; border-radius: 50%; background-color: #8b5cf6;"></span>
        <span style="font-family: system-ui, sans-serif; font-size: 10px; font-weight: 600; color: #334155;">${name}</span>
      </div>
    `,
    iconSize: [80, 24],
    iconAnchor: [40, 12]
  });
};

// Map Auto Resizer & Controller
const MapAutoResizer: React.FC = () => {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    if (!container) return;

    map.invalidateSize();
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

  return null;
};

const MapCoordinateTracker: React.FC<{ onCoordsChange: (coords: { lat: number; lng: number }) => void }> = ({ onCoordsChange }) => {
  useMapEvents({
    mousemove: (e) => {
      onCoordsChange({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
};

// Live Weather & Full Telemetry Popup for SOS Signals
const SOSPopupContent: React.FC<{
  sig: any;
  dispatchTeamToSignal: (id: string) => void;
  isCritical: boolean;
}> = ({ sig, dispatchTeamToSignal, isCritical }) => {
  const [weather, setWeather] = useState<DistrictWeather | null>(null);
  const [displayWind, setDisplayWind] = useState<string>('--');
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const { isStale, ageDisplay } = getLocationAgeInfo(sig.locationTimestamp || sig.timestamp, sig.ageMinutes);

  // Role-based citizen privacy: mask phone number if not full super admin
  const rawPhone = sig.contactPhone || sig.phone || '+91 94370 88219';
  const maskedPhone = rawPhone.replace(/(\+\d{2}\s?\d{2})\d{4}(\d{2})/, '$1****$2');

  const scrollToTop = () => {
    scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    let mounted = true;
    fetchCoordinatesWeather(sig.lat, sig.lng, sig.district).then((data) => {
      if (mounted) {
        setWeather(data);
        setDisplayWind(data.windSpeedKmh.toFixed(1));
      }
    });
    return () => { mounted = false; };
  }, [sig.lat, sig.lng, sig.district]);

  return (
    <div className="min-w-[280px] max-w-[88vw] sm:max-w-[340px] text-xs font-sans relative flex flex-col bg-surface rounded-xl overflow-hidden shadow-lg border border-outline-variant/30">
      
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-outline-variant/30 bg-surface-container-low sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <strong className="text-on-surface font-semibold text-sm">{sig.id}</strong>
          <span className="text-[10px] text-on-surface-variant bg-surface px-1.5 py-0.5 rounded border border-outline-variant/50">{sig.source || 'Android'}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Scroll Up & Down Controls for Mobile */}
          <div className="flex items-center bg-surface border border-outline-variant/50 rounded-md p-0.5 gap-0.5 shadow-sm">
            <button
              type="button"
              onClick={scrollToTop}
              title="Scroll to Top"
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest p-1 rounded-sm text-[10px] cursor-pointer flex items-center transition-colors"
            >
              ▲
            </button>
            <button
              type="button"
              onClick={scrollToBottom}
              title="Scroll to Bottom"
              className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest p-1 rounded-sm text-[10px] cursor-pointer flex items-center transition-colors"
            >
              ▼
            </button>
          </div>

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide ${
              isCritical ? 'bg-error/10 text-error' : 'bg-amber-500/10 text-amber-600'
            }`}
          >
            {sig.severity || (isCritical ? 'Critical' : 'High')} • {sig.score || 94}
          </span>
        </div>
      </div>

      {/* Scrollable Body Container */}
      <div
        ref={scrollRef}
        className="max-h-[55vh] sm:max-h-[400px] overflow-y-auto p-3 space-y-3 scroll-smooth bg-surface"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* GPS Location & Stale Banner */}
        <div className={`p-2.5 rounded-lg flex flex-col gap-1.5 ${
          isStale ? 'bg-amber-500/10 border border-amber-500/20 text-amber-700' : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700'
        }`}>
          <div className="flex justify-between items-center text-[11px] font-semibold">
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isStale ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`}></span>
              <span>{isStale ? 'Last Known Location' : 'Live Telemetry'}</span>
            </div>
            <span>±{sig.accuracy_m || 15}m</span>
          </div>
          <div className="flex justify-between text-[10px] font-medium opacity-80">
            <span>{sig.lat.toFixed(4)}°, {sig.lng.toFixed(4)}°</span>
            <span>Age: {ageDisplay}</span>
          </div>
        </div>

        {/* Details snippet */}
        <div className="text-on-surface text-[12px] leading-relaxed p-3 bg-surface-container-low rounded-lg border border-outline-variant/30">
          "{sig.details || 'Ground floor submerged by coastal surge. Elderly residents requiring urgent medical evacuation.'}"
        </div>

        {/* Distress Parameters Grid */}
        <div className="grid grid-cols-2 gap-3 text-[11px] p-1">
          <div>
            <span className="text-on-surface-variant font-medium block text-[10px] mb-0.5">Affected People</span>
            <strong className="text-on-surface text-sm">{sig.peopleCount || sig.people || 1} Pax</strong>
          </div>
          <div>
            <span className="text-on-surface-variant font-medium block text-[10px] mb-0.5">Medical Needs</span>
            <strong className={sig.medicalRequired ? 'text-error' : 'text-on-surface'}>
              {sig.medicalRequired ? 'Urgent Trauma' : 'None Reported'}
            </strong>
          </div>
          <div>
            <span className="text-on-surface-variant font-medium block text-[10px] mb-0.5">Delivery State</span>
            <strong className="text-on-surface">{sig.deliveryState || 'Delivered'}</strong>
          </div>
          <div>
            <span className="text-on-surface-variant font-medium block text-[10px] mb-0.5">Network Hops</span>
            <strong className="text-on-surface">{sig.hopCount || sig.hop || 1} Hop(s)</strong>
          </div>
          <div className="col-span-2 pt-2 border-t border-outline-variant/30">
            <span className="text-on-surface-variant font-medium block text-[10px] mb-0.5">Relay Path</span>
            <span className="text-on-surface text-[11px]">
              {sig.relayPath?.join(' ➔ ') || sig.relay || 'Direct Cellular Gateway'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="text-on-surface-variant font-medium block text-[10px] mb-0.5">Incident Cluster</span>
            <span className="text-on-surface font-semibold">{sig.incidentId || 'INC-2026-PURI-ALPHA'}</span>
          </div>
          <div className="col-span-2">
            <span className="text-on-surface-variant font-medium block text-[10px] mb-0.5">Citizen Contact (Masked)</span>
            <span className="text-on-surface">{maskedPhone}</span>
          </div>
        </div>

        {/* Live Environmental Telemetry */}
        {weather && (
          <div className="bg-surface-container-low p-2.5 rounded-lg border border-outline-variant/30 mt-2">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-1.5 mb-2 text-[10px]">
              <span className="text-on-surface font-semibold">Radar Telemetry</span>
              <span className="text-on-surface-variant font-medium">Surge: +{weather.surgePotentialM}m</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[10px] text-on-surface">
              <div className="flex flex-col">
                <span className="text-on-surface-variant mb-0.5">Wind</span>
                <strong>{displayWind} km/h</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-on-surface-variant mb-0.5">Temp</span>
                <strong>{weather.temp}°C</strong>
              </div>
              <div className="flex flex-col">
                <span className="text-on-surface-variant mb-0.5">Pres</span>
                <strong>{weather.pressure} hPa</strong>
              </div>
            </div>
          </div>
        )}

        {/* Dispatch Button */}
        {sig.status !== 'Resolved' && sig.status !== 'Dispatched' && (
          <button
            onClick={() => dispatchTeamToSignal(sig.id)}
            className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 px-4 rounded-lg text-xs transition-colors shadow-sm mt-3 flex justify-center items-center gap-2"
          >
            Dispatch Rescue Unit
          </button>
        )}
      </div>
    </div>
  );
};

export interface InteractiveEOCMapProps {
  showSOS?: boolean;
  showIncidents?: boolean;
  showAmbulances?: boolean;
  showRescueTeams?: boolean;
  showBoats?: boolean;
  showMedicalTeams?: boolean;
  showRescueVehicles?: boolean;
  showShelters?: boolean;
  showEmergencyResources?: boolean;
  showDisasterZones?: boolean;
  showFloodZones?: boolean;
  showRoutes?: boolean;
  showRescueUnits?: boolean; // Legacy
  mapType?: 'light' | 'dark' | 'satellite';
  onMapTypeToggle?: (type: 'light' | 'dark' | 'satellite') => void;
  onInspectRoute?: (routeId: string) => void;
  height?: string;
}

export const InteractiveEOCMap: React.FC<InteractiveEOCMapProps> = ({
  showSOS = true,
  showIncidents = true,
  showAmbulances = true,
  showRescueTeams = true,
  showBoats = true,
  showMedicalTeams = true,
  showRescueVehicles = true,
  showShelters = true,
  showEmergencyResources = true,
  showDisasterZones = true,
  showFloodZones = true,
  showRoutes = true,
  showRescueUnits: _showRescueUnits = true,
  mapType = 'dark',
  onMapTypeToggle,
  onInspectRoute,
  height = '100%'
}) => {
  const { signals, selectedSignalId, setSelectedSignalId, dispatchTeamToSignal, shelters } = useEOC();

  const [activeMapType, setActiveMapType] = useState<'light' | 'dark' | 'satellite'>(mapType);
  const [liveCoords, setLiveCoords] = useState<{ lat: number; lng: number }>({ lat: 19.8135, lng: 85.8312 });

  useEffect(() => {
    setActiveMapType(mapType);
  }, [mapType]);

  const handleToggleMapType = (type: 'light' | 'dark' | 'satellite') => {
    setActiveMapType(type);
    if (onMapTypeToggle) {
      onMapTypeToggle(type);
    }
  };

  const center: [number, number] = React.useMemo(() => [19.8135, 85.8312], []);

  // Tile Providers (Fixed Satellite URL to {x})
  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  };

  // Mock PostGIS Incident Clusters
  const incidentClusters = [
    {
      id: 'INC-2026-PURI-01',
      district: 'Puri',
      lat: 19.814,
      lng: 85.832,
      radiusM: 1200,
      sosCount: 6,
      affectedPeople: 24,
      criticalCount: 3,
      priorityScore: 94,
      status: 'ACTIVE'
    },
    {
      id: 'INC-2026-BHAD-02',
      district: 'Bhadrak',
      lat: 20.902,
      lng: 86.512,
      radiusM: 1800,
      sosCount: 4,
      affectedPeople: 18,
      criticalCount: 1,
      priorityScore: 78,
      status: 'ACTIVE'
    }
  ];

  // Mock Polymorphic Fleet Units
  const fleetUnits = {
    ambulances: [
      { id: 'AMB-01', name: 'ALS Trauma Amb #01', status: 'AVAILABLE', lat: 19.825, lng: 85.845, incidentId: 'None (Standby)', district: 'Puri' },
      { id: 'AMB-02', name: 'BLS Rapid Amb #04', status: 'DISPATCHED', lat: 19.808, lng: 85.820, incidentId: 'INC-2026-PURI-01', district: 'Puri' }
    ],
    rescueTeams: [
      { id: 'NDRF-03', name: 'NDRF Battalion 03 Alpha', status: 'ON_SCENE', lat: 19.819, lng: 85.836, incidentId: 'INC-2026-PURI-01', size: 25 },
      { id: 'ODRAF-07', name: 'ODRAF Unit 07 Bravo', status: 'AVAILABLE', lat: 19.795, lng: 85.815, incidentId: 'None (Standby)', size: 18 }
    ],
    boats: [
      { id: 'BOAT-01', name: 'Zodiac IRB Flood Boat #1', status: 'ASSIGNED', lat: 19.805, lng: 85.828, incidentId: 'INC-2026-PURI-01', capacity: 12 },
      { id: 'BOAT-02', name: 'Inflatable Rescue Boat #4', status: 'AVAILABLE', lat: 19.832, lng: 85.850, incidentId: 'None', capacity: 8 }
    ],
    medicalTeams: [
      { id: 'MED-01', name: 'AIIMS Mobile Trauma Team 1', status: 'AVAILABLE', lat: 19.821, lng: 85.840, incidentId: 'None', doctors: 3 }
    ],
    vehicles: [
      { id: 'VEH-01', name: 'Amphibious All-Terrain 02', status: 'ON_SCENE', lat: 19.812, lng: 85.826, incidentId: 'INC-2026-PURI-01' }
    ],
    depots: [
      { id: 'DEPOT-01', name: 'OSDMA Central Ration Depot', lat: 19.829, lng: 85.835, stock: '8500 Packets' }
    ]
  };

  // Coastal Flood Surge & Disaster Inundation Polygons
  const puriFloodPolygon: [number, number][] = [
    [19.805, 85.820],
    [19.820, 85.845],
    [19.815, 85.860],
    [19.795, 85.835],
    [19.805, 85.820]
  ];

  const disasterZonePolygon: [number, number][] = [
    [19.780, 85.800],
    [19.840, 85.830],
    [19.830, 85.880],
    [19.770, 85.850],
    [19.780, 85.800]
  ];

  return (
    <div className="relative w-full overflow-hidden" style={{ height }}>
      <MapContainer
        center={center}
        zoom={13}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <ZoomControl position="bottomright" />
        <MapAutoResizer />
        <MapCoordinateTracker onCoordsChange={setLiveCoords} />

        <TileLayer
          url={tileUrls[activeMapType]}
          attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
          maxZoom={19}
        />

        {/* 1. Disaster High Risk Zone */}
        {showDisasterZones && (
          <Polygon
            positions={disasterZonePolygon}
            pathOptions={{
              color: '#dc2626',
              weight: 1.5,
              dashArray: '6, 6',
              fillColor: '#ef4444',
              fillOpacity: 0.08
            }}
          >
            <Popup>
              <div className="text-xs font-sans p-1">
                <strong className="text-red-400 block font-bold">⚠️ CRITICAL DISASTER ZONE (SECTOR 4-B)</strong>
                <span className="text-on-surface-variant text-[11px]">Cyclone Inundation Risk &amp; Power Grid Failure Alert</span>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* 2. Flood Inundation & Coastal Surge Polygons */}
        {showFloodZones && (
          <Polygon
            positions={puriFloodPolygon}
            pathOptions={{
              color: '#0284c7',
              weight: 2,
              fillColor: '#38bdf8',
              fillOpacity: 0.25
            }}
          >
            <Popup>
              <div className="text-xs font-sans p-1">
                <strong className="text-on-surface block font-bold">🌊 COASTAL SURGE INUNDATION (+3.2m)</strong>
                <span className="text-on-surface-variant text-[11px]">Active storm surge threat across Puri low-lying settlements</span>
              </div>
            </Popup>
          </Polygon>
        )}

        {/* 3. PostGIS Incident Clusters (Radius Circles & Center Badges) */}
        {showIncidents &&
          incidentClusters.map((inc) => (
            <React.Fragment key={inc.id}>
              <Circle
                center={[inc.lat, inc.lng]}
                radius={inc.radiusM}
                pathOptions={{
                  color: '#dc2626',
                  weight: 2,
                  fillColor: '#ef4444',
                  fillOpacity: 0.15
                }}
              />
              <Marker
                position={[inc.lat, inc.lng]}
                icon={createIncidentClusterIcon(inc.id, inc.priorityScore, inc.sosCount)}
              >
                <Popup>
                  <div className="min-w-[240px] text-xs font-sans p-1">
                    <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-1.5">
                      <strong className="text-red-400">{inc.id}</strong>
                      <span className="bg-red-950 text-red-300 px-1 rounded text-[10px]">PRIORITY {inc.priorityScore}</span>
                    </div>
                    <div className="space-y-1 text-[11px] text-gray-200">
                      <div>District: <strong className="text-white">{inc.district}</strong></div>
                      <div>Radius: <strong>{inc.radiusM}m</strong> | Clusters: <strong>{inc.sosCount} SOS</strong></div>
                      <div>Affected People: <strong className="text-amber-400">{inc.affectedPeople} Pax</strong></div>
                      <div>Critical Calls: <strong className="text-red-400">{inc.criticalCount} Immediate</strong></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}

        {/* 4. Evacuation Routes */}
        {showRoutes && (
          <Polyline
            positions={[
              [19.805, 85.815],
              [19.812, 85.830],
              [19.825, 85.845],
              [19.835, 85.865]
            ]}
            pathOptions={{
              color: '#10b981',
              weight: 4,
              dashArray: '8, 8'
            }}
          >
            <Popup>
              <div className="text-xs font-sans p-1">
                <strong className="text-emerald-400 block font-bold">EVACUATION CORRIDOR: NH-316</strong>
                <span className="text-on-surface-variant text-[11px] block mb-2">Raised Embankment (+6.2m Datum) • 98.8% Optimal</span>
                {onInspectRoute && (
                  <button
                    onClick={() => onInspectRoute('nh-316')}
                    className="w-full bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 py-1 px-2 rounded text-[11px] font-sans cursor-pointer"
                  >
                    Inspect AI Safety Corridor
                  </button>
                )}
              </div>
            </Popup>
          </Polyline>
        )}

        {/* 5. Evacuation Shelters */}
        {showShelters &&
          shelters.map((shelter) => {
            const occPct = shelter.capacity > 0 ? (shelter.occupied / shelter.capacity) * 100 : 0;
            const availableCap = Math.max(0, shelter.capacity - shelter.occupied);
            return (
              <Marker
                key={shelter.id}
                position={[shelter.lat, shelter.lng]}
                icon={createShelterIcon(shelter.status, occPct)}
              >
                <Popup>
                  <div className="min-w-[240px] text-xs font-sans">
                    <div className="flex justify-between items-center pb-1 mb-1.5 border-b border-gray-700">
                      <strong className="text-emerald-400">{shelter.name}</strong>
                      <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1 rounded">{shelter.status || 'OPEN'}</span>
                    </div>
                    <div className="space-y-1 text-gray-200 text-[11px]">
                      <div>Occupancy: <strong>{shelter.occupied} / {shelter.capacity}</strong> ({Math.round(occPct)}%)</div>
                      <div>Available Beds: <strong className="text-white">{availableCap} Free</strong></div>
                      <div>Medical Post: <span className="text-yellow-400">{shelter.tierText || 'Active'}</span></div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

        {/* 6. Polymorphic Fleet - Ambulances */}
        {showAmbulances &&
          fleetUnits.ambulances.map((amb) => (
            <Marker key={amb.id} position={[amb.lat, amb.lng]} icon={createAmbulanceIcon(amb.id, amb.status)}>
              <Popup>
                <div className="min-w-[210px] text-xs font-sans">
                  <strong className="text-green-400 block mb-1">{amb.name}</strong>
                  <div className="space-y-0.5 text-on-surface-variant text-[11px]">
                    <div>Type: <strong>AMBULANCE (ALS)</strong></div>
                    <div>Status: <span className={amb.status === 'AVAILABLE' ? 'text-green-400' : 'text-amber-400'}>{amb.status}</span></div>
                    <div>District: <strong>{amb.district}</strong></div>
                    <div>Assigned: <strong>{amb.incidentId}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 7. Polymorphic Fleet - Rescue Teams */}
        {showRescueTeams &&
          fleetUnits.rescueTeams.map((team) => (
            <Marker key={team.id} position={[team.lat, team.lng]} icon={createRescueTeamIcon(team.id, team.status)}>
              <Popup>
                <div className="min-w-[210px] text-xs font-sans">
                  <strong className="text-on-surface block mb-1">{team.name}</strong>
                  <div className="space-y-0.5 text-on-surface-variant text-[11px]">
                    <div>Type: <strong>RESCUE TEAM (NDRF)</strong></div>
                    <div>Size: <strong>{team.size} Personnel</strong></div>
                    <div>Status: <strong className="text-white">{team.status}</strong></div>
                    <div>Assigned Incident: <strong>{team.incidentId}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 8. Polymorphic Fleet - Boats */}
        {showBoats &&
          fleetUnits.boats.map((boat) => (
            <Marker key={boat.id} position={[boat.lat, boat.lng]} icon={createBoatIcon(boat.id, boat.status)}>
              <Popup>
                <div className="min-w-[200px] text-xs font-sans">
                  <strong className="text-on-surface block mb-1">{boat.name}</strong>
                  <div className="space-y-0.5 text-on-surface-variant text-[11px]">
                    <div>Type: <strong>BOAT (IRB Flood Vessel)</strong></div>
                    <div>Capacity: <strong>{boat.capacity} Evacuees</strong></div>
                    <div>Status: <strong>{boat.status}</strong></div>
                    <div>Assigned: <strong>{boat.incidentId}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 9. Polymorphic Fleet - Medical Teams */}
        {showMedicalTeams &&
          fleetUnits.medicalTeams.map((med) => (
            <Marker key={med.id} position={[med.lat, med.lng]} icon={createMedicalTeamIcon(med.id, med.status)}>
              <Popup>
                <div className="min-w-[200px] text-xs font-sans">
                  <strong className="text-emerald-400 block mb-1">{med.name}</strong>
                  <div className="space-y-0.5 text-on-surface-variant text-[11px]">
                    <div>Type: <strong>MEDICAL TEAM</strong></div>
                    <div>Doctors / EMT: <strong>{med.doctors} Trauma Specialists</strong></div>
                    <div>Status: <strong>{med.status}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 10. Polymorphic Fleet - Rescue Vehicles */}
        {showRescueVehicles &&
          fleetUnits.vehicles.map((veh) => (
            <Marker key={veh.id} position={[veh.lat, veh.lng]} icon={createVehicleIcon(veh.id)}>
              <Popup>
                <div className="min-w-[200px] text-xs font-sans">
                  <strong className="text-orange-400 block mb-1">{veh.name}</strong>
                  <div className="space-y-0.5 text-on-surface-variant text-[11px]">
                    <div>Type: <strong>RESCUE VEHICLE (Amphibious)</strong></div>
                    <div>Assigned: <strong>{veh.incidentId}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 11. Emergency Supply Depots */}
        {showEmergencyResources &&
          fleetUnits.depots.map((depot) => (
            <Marker key={depot.id} position={[depot.lat, depot.lng]} icon={createDepotIcon(depot.id)}>
              <Popup>
                <div className="min-w-[200px] text-xs font-sans">
                  <strong className="text-on-surface-variant block mb-1">{depot.name}</strong>
                  <div className="space-y-0.5 text-on-surface-variant text-[11px]">
                    <div>Stock: <strong>{depot.stock}</strong></div>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

        {/* 12. SOS Distress Signals (With Stale GPS Anti-Hallucination Guard) */}
        {showSOS &&
          signals.map((sig) => {
            const isCritical = sig.status === 'Critical' || sig.severity === 'CRITICAL';
            const isSelected = selectedSignalId === sig.id;
            const { isStale, ageDisplay } = getLocationAgeInfo(sig.locationTimestamp || sig.timestamp, (sig as any).ageMinutes);

            return (
              <Marker
                key={sig.id}
                position={[sig.lat, sig.lng]}
                icon={createSOSIcon(isCritical, isSelected, isStale, ageDisplay)}
                eventHandlers={{
                  click: () => {
                    setSelectedSignalId(sig.id);
                  }
                }}
              >
                <Popup>
                  <SOSPopupContent sig={sig} dispatchTeamToSignal={dispatchTeamToSignal} isCritical={isCritical} />
                </Popup>
              </Marker>
            );
          })}
      </MapContainer>

      {/* Basemap Switcher (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[1000] flex items-center gap-1 bg-surface-container-lowest/90 border border-outline-variant/30 p-1 rounded-lg shadow-sm backdrop-blur-md">
        <button
          onClick={() => handleToggleMapType('light')}
          className={`px-2 py-1 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
            activeMapType === 'light' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">light_mode</span>
          Day
        </button>
        <button
          onClick={() => handleToggleMapType('dark')}
          className={`px-2 py-1 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
            activeMapType === 'dark' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">dark_mode</span>
          Night
        </button>
        <button
          onClick={() => handleToggleMapType('satellite')}
          className={`px-2 py-1 text-xs font-bold rounded transition-colors cursor-pointer flex items-center gap-1 ${
            activeMapType === 'satellite' ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">satellite_alt</span>
          Satellite
        </button>
      </div>

      {/* Live Tactical GPS Location HUD Badge */}
      <div className="absolute bottom-3 right-[70px] z-[1000] bg-surface/95 border border-outline-variant/80 px-2.5 py-1.5 rounded-lg shadow-lg backdrop-blur-md flex items-center gap-2 font-sans text-[11px] sm:text-xs text-on-surface select-none">
        <span className="w-2 h-2 rounded-full bg-status-green "></span>
        <span className="text-primary font-bold">GPS:</span>
        <span className="text-emerald-600 font-bold tracking-wider">
          {liveCoords.lat.toFixed(4)}° N, {liveCoords.lng.toFixed(4)}° E
        </span>
        <span className="text-on-surface-variant text-[10px] hidden sm:inline border-l border-outline-variant pl-2">
          SECTOR 4-B
        </span>
      </div>
    </div>
  );
};
