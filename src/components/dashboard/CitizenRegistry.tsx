import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';

interface Citizen {
  id: string;
  full_name: string;
  phone_number: string;
  device_id: string | null;
  registered_at: string;
}

export const CitizenRegistry: React.FC = () => {
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('registered_citizens')
        .select('*')
        .order('registered_at', { ascending: false });

      if (error) {
        throw error;
      }
      setCitizens(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch citizen registry.');
    } finally {
      setLoading(false);
    }
  };

  // Better masking: keep the country code if it exists.
  const formatSecurePhone = (phone: string) => {
    if (!phone) return 'N/A';
    if (phone.startsWith('+')) {
      const parts = phone.split(' ');
      if (parts.length > 1) {
        const countryCode = parts[0];
        const numberPart = parts.slice(1).join('');
        return `${countryCode} ${'*'.repeat(Math.max(0, numberPart.length - 4))}${numberPart.slice(-4)}`;
      } else {
         // like +919876543210
         const countryCode = phone.substring(0, 3); // +91
         const numberPart = phone.substring(3);
         return `${countryCode} ${'*'.repeat(Math.max(0, numberPart.length - 4))}${numberPart.slice(-4)}`;
      }
    }
    return '*'.repeat(Math.max(0, phone.length - 4)) + phone.slice(-4);
  };


  return (
    <div className="flex-1 bg-background overflow-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <header className="border-b border-outline-variant pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-2xl font-bold text-on-background tracking-tight">Citizen Registry</h1>
            <p className="text-on-surface-variant text-sm mt-1">
              Secure directory of verified citizens on the PRANSETU network.
            </p>
          </div>
          <button
            onClick={fetchCitizens}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-high border border-outline-variant rounded text-on-surface hover:bg-surface-container-highest transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">{loading ? 'sync' : 'refresh'}</span>
            <span className="text-sm font-medium">Refresh</span>
          </button>
        </header>

        {error && (
          <div className="p-4 bg-error/10 border border-error/20 rounded-md flex items-start gap-3">
            <span className="material-symbols-outlined text-error">error</span>
            <div className="text-sm text-on-surface">
              <strong>Error Loading Registry:</strong> {error}
            </div>
          </div>
        )}

        <div className="bg-surface border border-outline-variant rounded-lg overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low border-b border-outline-variant text-xs text-on-surface-variant uppercase tracking-wider">
                  <th className="py-3 px-4 font-medium">Citizen Name</th>
                  <th className="py-3 px-4 font-medium">Verified Phone</th>
                  <th className="py-3 px-4 font-medium">Device ID</th>
                  <th className="py-3 px-4 font-medium text-right">Registration Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant text-sm text-on-surface">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                      <p className="mt-2 text-xs uppercase tracking-widest font-medium">Loading Citizens...</p>
                    </td>
                  </tr>
                ) : citizens.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[32px] mb-2 opacity-50">group_off</span>
                      <p>No citizens registered yet.</p>
                    </td>
                  </tr>
                ) : (
                  citizens.map((citizen) => (
                    <tr key={citizen.id} className="hover:bg-surface-container-lowest transition-colors">
                      <td className="py-3 px-4 font-medium">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {citizen.full_name.charAt(0).toUpperCase()}
                          </div>
                          {citizen.full_name}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {formatSecurePhone(citizen.phone_number)}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-on-surface-variant">
                        {citizen.device_id ? (
                          <span className="truncate max-w-[120px] inline-block" title={citizen.device_id}>
                            {citizen.device_id}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="py-3 px-4 text-right text-on-surface-variant">
                        {new Date(citizen.registered_at).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
