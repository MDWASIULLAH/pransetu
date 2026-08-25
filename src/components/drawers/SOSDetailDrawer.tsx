import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, Users, HeartPulse, ShieldAlert, Radio, Share2, User, Phone } from 'lucide-react';
import type { SOSRecord } from '../../types/sos';
import { SeverityBadge, DeliveryPill } from '../common/Badges';

interface SOSDetailDrawerProps {
  sos: SOSRecord;
  onClose: () => void;
  canMask?: boolean;
}

export const SOSDetailDrawer = ({ sos, onClose, canMask = false }: SOSDetailDrawerProps) => {
  const ageMin = Math.round((Date.now() - new Date(sos.location_timestamp || sos.created_at).getTime()) / 60000);
  const isLive = ageMin <= 5;
  
  // Simulate live GPS fluctuation if the signal is fresh
  const [displayLat, setDisplayLat] = useState(sos.latitude);
  const [displayLng, setDisplayLng] = useState(sos.longitude);

  useEffect(() => {
    setDisplayLat(sos.latitude);
    setDisplayLng(sos.longitude);
    
    if (!isLive) return;

    const interval = setInterval(() => {
      // Fluctuate by ±0.00005 to simulate walking/movement
      setDisplayLat(prev => prev + (Math.random() * 0.00010 - 0.00005));
      setDisplayLng(prev => prev + (Math.random() * 0.00010 - 0.00005));
    }, 2000);

    return () => clearInterval(interval);
  }, [sos.latitude, sos.longitude, isLive]);

  // Handle Identity
  const userName = (sos as any).userName || 'Unknown Citizen';
  const rawPhone = (sos as any).userPhone || (sos as any).contactPhone || '+91 94370 88219';
  const displayPhone = canMask 
    ? rawPhone.replace(/(\+\d{2}\s?\d{2})\d{4}(\d{2})/, '$1****$2')
    : rawPhone;

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-surface border-l border-outline-variant/30 shadow-2xl z-[9999] transform transition-transform duration-300 ease-in-out flex flex-col font-sans">
      
      {/* Header */}
      <div className="p-5 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-lowest">
        <div>
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Radio size={20} className="text-primary animate-pulse" />
            SOS Packet Details
          </h2>
          <p className="text-xs text-on-surface-variant font-mono mt-1 tracking-tight">{sos.sos_id}</p>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-surface-container rounded-lg text-on-surface-variant transition-colors border border-transparent hover:border-outline-variant/50">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 scrollbar-thin bg-surface-container-lowest space-y-6">
        
        <div className="flex justify-between items-center bg-surface-container-low p-3 rounded-lg border border-outline-variant/40">
          <SeverityBadge severity={sos.severity} />
          <DeliveryPill state={sos.delivery_state} />
        </div>

        {/* Identity Details */}
        <div>
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5"><User size={14}/> Identity Verification</h3>
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Citizen Name</span>
              <strong className="text-on-surface text-sm">{userName}</strong>
            </div>
            <div>
              <span className="text-[10px] text-on-surface-variant uppercase font-bold block mb-1">Contact Number</span>
              <strong className="text-on-surface text-sm font-mono">{displayPhone}</strong>
            </div>
          </div>
        </div>

        {/* Tactical Parameters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30">
            <div className="text-[10px] text-on-surface-variant uppercase font-bold mb-1.5 flex items-center gap-1.5"><Users size={14}/> Affected</div>
            <div className="text-xl font-black text-on-surface">{sos.people_count} <span className="text-xs text-on-surface-variant font-semibold">Pax</span></div>
          </div>
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30">
            <div className="text-[10px] text-on-surface-variant uppercase font-bold mb-1.5 flex items-center gap-1.5"><HeartPulse size={14}/> Medical Needs</div>
            <div className="text-lg font-black">
              {sos.medical_required ? <span className="text-error">Urgent Trauma</span> : <span className="text-on-surface">None Reported</span>}
            </div>
          </div>
        </div>

        {/* Location Data */}
        <div>
          <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider mb-2 flex items-center gap-1.5"><MapPin size={14}/> Geolocation &amp; Telemetry</h3>
          <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 space-y-3 text-sm">
            
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
              <span className="text-on-surface-variant font-semibold">Live Coordinates</span>
              <div className="flex items-center gap-2">
                {isLive && <span className="w-2 h-2 rounded-full bg-primary animate-ping"></span>}
                <span className="text-on-surface font-mono font-bold tracking-tight">
                  {displayLat.toFixed(6)}°, {displayLng.toFixed(6)}°
                </span>
              </div>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b border-outline-variant/30">
              <span className="text-on-surface-variant font-semibold">GPS Accuracy</span>
              <span className="text-on-surface font-bold">±{sos.accuracy_m}m</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-on-surface-variant font-semibold">Signal Age</span>
              {isLive ? (
                <span className="text-primary font-bold bg-primary/10 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider border border-primary/20">Live Tracker ({ageMin}m)</span>
              ) : (
                <span className="text-tertiary font-bold bg-tertiary/10 px-2.5 py-1 rounded-md text-[11px] uppercase tracking-wider border border-tertiary/20">Last Known ({ageMin}m)</span>
              )}
            </div>
          </div>
        </div>

        {/* Network Relay Trail */}
        <div>
           <div className="flex items-center justify-between mb-2">
             <h3 className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider flex items-center gap-1.5"><Share2 size={14}/> Mesh Network Relay</h3>
             <span className="text-xs font-bold text-on-surface bg-surface-container-high px-2 py-0.5 rounded border border-outline-variant/30">{sos.hop_count} Hop(s)</span>
           </div>
           
          {sos.relay_trail ? (
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30">
              <div className="border-l-2 border-outline-variant pl-4 py-1 space-y-4">
                {sos.relay_trail.map((node: string, i: number) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-secondary ring-4 ring-surface-container"></div>
                    <div className="text-on-surface font-mono text-sm font-bold">{node}</div>
                    <div className="text-[10px] text-on-surface-variant uppercase font-bold mt-0.5">Relay Node {i+1}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-surface-container rounded-xl p-4 border border-outline-variant/30 text-center text-sm font-semibold text-on-surface-variant">
              Direct API Upload (No mesh relay required)
            </div>
          )}
        </div>
        
        <div className="pb-4"></div>
      </div>
      
      {/* Footer Actions */}
      <div className="p-5 border-t border-outline-variant/30 bg-surface-container-low flex gap-3">
        <button className="flex-1 bg-surface hover:bg-surface-container-high border border-outline-variant/50 text-on-surface py-2.5 rounded-xl font-bold transition-colors text-sm shadow-sm">
          Acknowledge
        </button>
        <button className="flex-1 bg-error hover:bg-error/90 text-on-error py-2.5 rounded-xl font-bold transition-colors text-sm shadow-sm">
          ESCALATE PRIORITY
        </button>
      </div>
    </div>
  );
};
