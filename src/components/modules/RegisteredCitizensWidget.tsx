import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';
import { Phone, Users, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface Citizen {
  id: string;
  phone_number: string;
  full_name: string;
  registered_at: string;
}

export const RegisteredCitizensWidget: React.FC = () => {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{success: boolean; count: number} | null>(null);

  const fetchCitizens = async () => {
    try {
      const res = await apiFetch('/api/v1/citizens');
      if (res.ok) {
        const json = await res.json();
        setCitizens(json.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch registered citizens', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
    // Poll every 10 seconds for new registrations
    const interval = setInterval(fetchCitizens, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleBroadcast = async () => {
    if (!window.confirm(`Initiate IVR Broadcast to all ${citizens.length} registered citizens?`)) return;
    
    setBroadcasting(true);
    setBroadcastResult(null);
    try {
      const res = await apiFetch('/api/v1/voice-campaigns/broadcast-call', {
        method: 'POST',
      });
      if (res.ok) {
        const json = await res.json();
        setBroadcastResult({ success: true, count: json.dispatched_count });
      } else {
        setBroadcastResult({ success: false, count: 0 });
      }
    } catch (err) {
      console.error('Broadcast failed', err);
      setBroadcastResult({ success: false, count: 0 });
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="col-span-12 xl:col-span-12 bg-surface border border-outline-variant/30 rounded-xl p-5 shadow-sm mt-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-lg font-bold text-on-surface flex items-center gap-2">
            <Users size={20} className="text-primary" />
            Registered Citizens / Onboarded Users
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time directory of verified people who have completed mobile app onboarding.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-right mr-2">
            <span className="block text-2xl font-bold text-on-surface leading-none">
              {loading ? '...' : citizens.length}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-on-surface-variant font-bold">Total Verified</span>
          </div>
          
          <button
            onClick={handleBroadcast}
            disabled={broadcasting || citizens.length === 0}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm shadow-sm transition-all ${
              broadcasting 
                ? 'bg-outline-variant text-on-surface-variant cursor-wait'
                : 'bg-error hover:bg-error/90 text-on-error cursor-pointer hover:shadow-md'
            }`}
          >
            {broadcasting ? (
              <span className="animate-pulse">Dispatching...</span>
            ) : (
              <>
                <ShieldAlert size={18} />
                Initiate Emergency IVR Broadcast
              </>
            )}
          </button>
        </div>
      </div>

      {broadcastResult && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-semibold border ${
          broadcastResult.success 
            ? 'bg-primary-container/30 border-primary-container text-on-primary-container' 
            : 'bg-error-container/30 border-error-container text-on-error-container'
        }`}>
          {broadcastResult.success ? (
            <><CheckCircle2 size={18} className="text-primary" /> Successfully dispatched IVR automated calls to {broadcastResult.count} citizens.</>
          ) : (
            <>Failed to dispatch broadcast. Please check backend logs.</>
          )}
        </div>
      )}

      <div className="overflow-hidden border border-outline-variant/30 rounded-lg bg-surface-container-lowest">
        <div className="max-h-80 overflow-y-auto scrollbar-thin">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-container-low sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Citizen Name</th>
                <th className="px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Phone Number</th>
                <th className="px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider">Registration Time</th>
                <th className="px-4 py-3 font-semibold text-on-surface-variant text-xs uppercase tracking-wider text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/30">
              {loading && citizens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">Loading citizens...</td>
                </tr>
              ) : citizens.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-on-surface-variant">No citizens have onboarded yet.</td>
                </tr>
              ) : (
                citizens.map((citizen) => (
                  <tr key={citizen.id} className="hover:bg-surface-container-low/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-on-surface flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                        {citizen.full_name.charAt(0).toUpperCase()}
                      </div>
                      {citizen.full_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-on-surface-variant flex items-center gap-1.5">
                      <Phone size={14} className="text-outline-variant" />
                      {citizen.phone_number}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-xs">
                      {new Date(citizen.registered_at).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-secondary/10 text-secondary text-[10px] font-bold uppercase tracking-wider border border-secondary/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span> Verified
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
