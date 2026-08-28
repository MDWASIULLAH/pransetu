import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../services/api';

interface SafeVerifyStats {
  total_contacted: number;
  answered: number;
  no_answer: number;
  safe_count: number;
  assistance_count: number;
  trapped_count: number;
  medical_count: number;
  unaccounted_count: number;
}

interface VerificationRecord {
  id: string;
  citizen_phone: string;
  campaign_id: string;
  state: string;
  timestamp: string;
  call_status: string;
  retry_count: number;
  source: string;
  district?: string;
  block?: string;
  village?: string;
}

export const SafeVerifyDashboard: React.FC = () => {
  const [stats, setStats] = useState<SafeVerifyStats | null>(null);
  const [records, setRecords] = useState<VerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [campaignFilter, setCampaignFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');

  // Clear figures when backend is unreachable or empty
  const loadFallbackData = () => {
    setStats({
      total_contacted: 0, answered: 0, no_answer: 0,
      safe_count: 0, assistance_count: 0, trapped_count: 0,
      medical_count: 0, unaccounted_count: 0
    });
    setRecords([]);
  };

  // Fetch logic
  useEffect(() => {
    const controller = new AbortController();
    let timeoutId: number | undefined;

    const fetchData = async () => {
      setLoading(true);
      timeoutId = window.setTimeout(() => controller.abort(), 800);
      try {
        let urlParams = '';
        if (campaignFilter) urlParams += `campaign_id=${campaignFilter}&`;
        if (districtFilter) urlParams += `district=${districtFilter}&`;

        const statsRes = await apiFetch(`/api/v1/safeverify/stats?${urlParams}`, { signal: controller.signal });
        if (statsRes.ok) {
            setStats(await statsRes.json());
        }

        const recordsRes = await apiFetch(`/api/v1/safeverify/records?${urlParams}`, { signal: controller.signal });
        if (recordsRes.ok) {
            const data = await recordsRes.json();
            setRecords(data.data || []);
        } else {
            loadFallbackData();
        }
      } catch {
        loadFallbackData();
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchData();
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [campaignFilter, districtFilter]);


  const statCard = (title: string, value: number, colorClass: string) => (
    <div className="bg-surface border border-outline-variant/30 rounded-lg p-4 shadow-sm flex flex-col justify-between">
      <span className="text-on-surface-variant text-[10px] font-semibold uppercase tracking-wider">{title}</span>
      <span className={`text-2xl font-bold mt-2 ${colorClass}`}>{value.toLocaleString()}</span>
    </div>
  );

  return (
    <div className="p-6 h-full flex flex-col animate-in fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-3xl">fact_check</span>
            SafeVerify Audit Dashboard
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">Aggregated population safety metrics from automated IVR campaigns.</p>
        </div>
        
        <div className="flex gap-3">
          <select 
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-surface border border-outline-variant/30 text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none shadow-sm"
          >
            <option value="">All Districts</option>
            <option value="Puri">Puri</option>
            <option value="Cuttack">Cuttack</option>
            <option value="Balasore">Balasore</option>
          </select>
          <select 
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="bg-surface border border-outline-variant/30 text-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none shadow-sm"
          >
            <option value="">All Campaigns</option>
            <option value="CMP-001">Cyclone Dana Evac</option>
            <option value="CMP-002">Flood Warning Zone A</option>
          </select>
        </div>
      </div>

      {loading && !stats ? (
        <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4 mb-8">
            {statCard("Contacted", stats?.total_contacted || 0, "text-on-surface")}
            {statCard("Answered", stats?.answered || 0, "text-secondary")}
            {statCard("No Answer", stats?.no_answer || 0, "text-error")}
            {statCard("Safe", stats?.safe_count || 0, "text-secondary")}
            {statCard("Assistance", stats?.assistance_count || 0, "text-tertiary")}
            {statCard("Trapped", stats?.trapped_count || 0, "text-error")}
            {statCard("Medical", stats?.medical_count || 0, "text-error")}
            {statCard("Unaccounted", stats?.unaccounted_count || 0, "text-on-surface-variant")}
          </div>

          {/* Records Table */}
          <div className="flex-1 bg-surface border border-outline-variant/30 rounded-lg flex flex-col overflow-hidden shadow-sm">
            <div className="px-4 py-3 border-b border-outline-variant/30">
              <h2 className="font-semibold text-on-surface">Verification History</h2>
            </div>
            
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-surface-container-lowest z-10 text-on-surface-variant text-xs uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Citizen Phone</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">Call Status</th>
                    <th className="px-4 py-3 font-medium">District</th>
                    <th className="px-4 py-3 font-medium">Campaign / Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {records.map(record => (
                    <tr key={record.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3 text-on-surface whitespace-nowrap">
                        {new Date(record.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-on-surface font-sans">{record.citizen_phone}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                          ${record.state === 'SAFE' ? 'bg-secondary/10 text-on-secondary-container' : ''}
                          ${record.state === 'ASSISTANCE' ? 'bg-tertiary/10 text-on-tertiary-container' : ''}
                          ${record.state === 'MEDICAL' || record.state === 'TRAPPED' ? 'bg-error/10 text-on-error-container' : ''}
                          ${record.state === 'UNACCOUNTED' ? 'bg-on-surface-variant/10 text-on-surface-variant' : ''}
                        `}>
                          {record.state}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                         <span className="text-on-surface-variant flex items-center gap-1">
                             <span className="material-symbols-outlined text-[14px]">
                                 {record.call_status === 'ANSWERED' ? 'call' : 'phone_missed'}
                             </span>
                             {record.call_status}
                         </span>
                         {record.retry_count > 0 && <span className="text-[10px] ml-1 text-error">(Retry {record.retry_count})</span>}
                      </td>
                      <td className="px-4 py-3 text-on-surface">{record.district || 'Unknown'}</td>
                      <td className="px-4 py-3 text-on-surface-variant text-xs">
                          {record.campaign_id} <br/> ({record.source})
                      </td>
                    </tr>
                  ))}
                  {records.length === 0 && (
                      <tr>
                          <td colSpan={6} className="px-4 py-8 text-center text-on-surface-variant">No verification records found.</td>
                      </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
