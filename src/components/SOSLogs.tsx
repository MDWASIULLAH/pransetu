import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import type { SOSSignal } from '../context/EOCContext';

export const SOSLogs: React.FC = () => {
  const { signals, dispatchTeamToSignal, resolveSignal, showToast } = useEOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<SOSSignal | null>(null);
  const [activeTab, setActiveTab] = useState<'canonical' | 'hops' | 'raw_json'>('canonical');

  const filteredLogs = signals.filter((log) => {
    const matchesSearch =
      log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDistrict = districtFilter ? log.district.toLowerCase() === districtFilter.toLowerCase() : true;
    const matchesSeverity = severityFilter ? log.status.toLowerCase() === severityFilter.toLowerCase() : true;
    return matchesSearch && matchesDistrict && matchesSeverity;
  });

  const handleExportCSV = () => {
    const headers = 'SOS ID,Protocol Version,Timestamp,District,Location,GPS Coordinates,Accuracy,Source,Status,Priority Score,People Affected,Hops,TTL,Relay Path\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","v2.4-mesh","${l.timestamp}","${l.district}","${l.loc}","${l.lat.toFixed(4)}, ${l.lng.toFixed(4)}","±4.2m","${l.source}","${l.status}",${l.score},"${l.people}",${l.hop},${8 - l.hop},"${l.relayPath.join(' -> ')}"`
      )
      .join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `PRANSETU_S_SOS_Audit_Logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Downloaded complete SOS Audit Event Log CSV.');
  };

  // 8-step lifecycle progression defined in PRANSETU SOS Protocol
  const LIFECYCLE_STEPS = [
    { key: 'CREATED', label: 'Created' },
    { key: 'STORED', label: 'Stored (Room DB)' },
    { key: 'QUEUED', label: 'Queued' },
    { key: 'RELAYING', label: 'Relaying (Mesh)' },
    { key: 'GATEWAY_RECEIVED', label: 'Gateway Locked' },
    { key: 'SERVER_RECEIVED', label: 'Server Ingested' },
    { key: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { key: 'CLOSED', label: 'Resolved' }
  ];

  const getStepIndex = (status: string) => {
    if (status === 'Resolved') return 7;
    if (status === 'Dispatched') return 6;
    if (status === 'Critical') return 5;
    return 4;
  };

  return (
    <div className="p-4 sm:p-margin-mobile md:p-margin-desktop min-h-screen bg-background text-on-background w-full max-w-[1600px] mx-auto">
      {/* Signal Audit Modal: Canonical Packet & Multi-Hop Relay Inspector */}
      {selectedLog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
          <div className="bg-surface-container border border-outline-variant/30 rounded-xl w-full max-w-2xl shadow-lg max-h-[92vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-surface-container-lowest border-b border-outline-variant flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded bg-surface border border-outline-variant/30 flex items-center justify-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[20px]">route</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-sans text-sm sm:text-base font-semibold text-on-surface">
                      Canonical SOS Packet Inspector
                    </h3>
                    <span className="font-sans text-[10px] bg-surface-container-lowestest text-on-surface-variant px-2 py-0.5 rounded border border-outline-variant/30 font-medium">
                      {selectedLog.id}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant font-sans mt-0.5">
                    Protocol: PRANSETU-MESH-CANONICAL v2.4 • Ingest: {selectedLog.source}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-lg hover:bg-surface cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Lifecycle Progression Timeline */}
            <div className="px-4 sm:px-6 py-4 bg-surface-container-lowestest/30 border-b border-outline-variant">
              <span className="text-[10px] font-sans font-medium text-on-surface-variant uppercase tracking-wider block mb-3">
                Canonical Protocol Lifecycle Progression
              </span>
              <div className="flex items-center justify-between overflow-x-auto pb-1 gap-1">
                {LIFECYCLE_STEPS.map((step, idx) => {
                  const currentIdx = getStepIndex(selectedLog.status);
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;

                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center min-w-[55px] text-center group">
                      <div className="flex items-center w-full">
                        {idx > 0 && (
                          <div className={`flex-1 h-[1px] ${idx <= currentIdx ? 'bg-on-surface-variant' : 'bg-outline-variant'}`} />
                        )}
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-sans font-medium shrink-0 transition-all ${
                            isCurrent
                              ? 'bg-on-surface text-surface'
                              : isDone
                              ? 'bg-surface-container-lowestest text-on-surface-variant border border-outline-variant'
                              : 'bg-surface text-outline-variant border border-outline-variant/50'
                          }`}
                        >
                          {isDone && !isCurrent ? '✓' : idx + 1}
                        </div>
                        {idx < LIFECYCLE_STEPS.length - 1 && (
                          <div className={`flex-1 h-[1px] ${idx < currentIdx ? 'bg-on-surface-variant' : 'bg-outline-variant'}`} />
                        )}
                      </div>
                      <span className={`text-[9px] font-sans mt-1.5 leading-tight ${isCurrent ? 'text-on-surface font-medium' : isDone ? 'text-on-surface-variant' : 'text-outline-variant'}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tabs Header */}
            <div className="flex border-b border-outline-variant bg-surface-container-lowest/40 px-4 sm:px-6">
              <button
                onClick={() => setActiveTab('canonical')}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'canonical' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">description</span>
                Canonical Fields
              </button>
              <button
                onClick={() => setActiveTab('hops')}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'hops' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">hub</span>
                Multi-Hop Mesh Path ({selectedLog.hop} Hops)
              </button>
              <button
                onClick={() => setActiveTab('raw_json')}
                className={`py-2 px-3 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'raw_json' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">data_object</span>
                Raw Protocol JSON
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {activeTab === 'canonical' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">SOS_ID</span>
                      <span className="text-xs font-sans font-bold text-primary">{selectedLog.id}</span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">PROTOCOL_VERSION</span>
                      <span className="text-xs font-sans font-bold text-on-surface">v2.4-canonical-mesh</span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">SOURCE_TYPE</span>
                      <span className="text-xs font-sans font-medium text-on-surface flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">{selectedLog.sourceIcon}</span>
                        {selectedLog.source}
                      </span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">GPS FIX (WGS84)</span>
                      <span className="text-xs font-sans font-medium text-on-surface">
                        {selectedLog.lat.toFixed(4)}° N, {selectedLog.lng.toFixed(4)}° E
                      </span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">LOCATION_ACCURACY</span>
                      <span className="text-xs font-sans font-bold text-on-surface">±4.2 meters (GNSS)</span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">SEVERITY / SCORE</span>
                      <span className={`text-xs font-sans font-medium text-on-surface`}>
                        {selectedLog.status.toUpperCase()} ({selectedLog.score} pts)
                      </span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">PEOPLE_COUNT</span>
                      <span className="text-xs font-sans font-bold text-on-surface">{selectedLog.people} Affected</span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">MEDICAL_REQUIRED</span>
                      <span className="text-xs font-sans font-bold text-error">YES (Emergency Priority)</span>
                    </div>

                    <div className="p-2.5 bg-surface-container rounded-lg border border-outline-variant/60">
                      <span className="text-[10px] font-sans text-on-surface-variant block">HOP_COUNT / TTL</span>
                      <span className="text-xs font-sans font-bold text-primary">Hop: {selectedLog.hop} / TTL: {8 - selectedLog.hop}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-surface-container rounded-xl border border-outline-variant/60">
                    <span className="text-[10px] font-sans text-on-surface-variant uppercase block mb-1">
                      CITIZEN SITUATION DESCRIPTOR &amp; RELAY PAYLOAD
                    </span>
                    <p className="text-xs text-on-surface text-sm leading-relaxed">
                      "{selectedLog.details}"
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'hops' && (
                <div className="space-y-3">
                  <p className="text-xs text-on-surface-variant">
                    Store-and-forward peer mesh route traversed by this packet before gateway ingestion:
                  </p>
                  <div className="space-y-2">
                    {selectedLog.relayPath.map((node, idx) => (
                      <div key={idx} className="p-3 bg-surface-container rounded-xl border border-outline-variant/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-lg bg-surface-container-lowestest flex items-center justify-center font-sans text-xs font-bold text-primary">
                            0{idx + 1}
                          </div>
                          <div>
                            <span className="font-bold text-xs text-on-surface block font-sans">{node}</span>
                            <span className="text-[11px] text-on-surface-variant font-sans">
                              {idx === 0 ? 'Originating Citizen Node (Offline BLE/WiFi-D)' : idx === selectedLog.relayPath.length - 1 ? 'EOC Ingestion Gateway' : 'Store-and-Forward Relay Peer'}
                            </span>
                          </div>
                        </div>
                        <div className="text-right font-sans text-[11px]">
                          <span className="text-on-surface font-medium block">RSSI: -{64 + idx * 8} dBm</span>
                          <span className="text-on-surface-variant">Latency: {14 + idx * 12}ms</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'raw_json' && (
                <pre className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 text-[11px] font-sans text-on-surface-variant overflow-x-auto">
{JSON.stringify({
  sos_id: selectedLog.id,
  protocol_version: "2.4-canonical-mesh",
  created_at: new Date().toISOString(),
  source_type: selectedLog.source.toUpperCase().replace(/\s+/g, '_'),
  device_reference: `anon-hw-${selectedLog.id.toLowerCase()}`,
  latitude: selectedLog.lat,
  longitude: selectedLog.lng,
  location_timestamp: new Date(Date.now() - 120000).toISOString(),
  location_accuracy_meters: 4.2,
  severity_code: selectedLog.status.toUpperCase(),
  priority_score: selectedLog.score,
  people_count: selectedLog.people,
  medical_required: true,
  hop_count: selectedLog.hop,
  ttl: 8 - selectedLog.hop,
  relay_path: selectedLog.relayPath,
  delivery_state: "SERVER_RECEIVED",
  acknowledgement_state: "CRYPTOGRAPHIC_CONFIRMED"
}, null, 2)}
                </pre>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-surface-container-lowest border-t border-outline-variant flex flex-wrap justify-between items-center gap-2">
              <button
                onClick={() => {
                  resolveSignal(selectedLog.id);
                  setSelectedLog(null);
                }}
                className="px-3 py-1.5 bg-surface border border-outline-variant/30 text-on-surface rounded-lg text-xs text-xs hover:bg-surface-container-lowestest cursor-pointer font-medium transition-colors"
              >
                Mark Rescued / Closed
              </button>

              <div className="flex gap-2">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-3 py-1.5 bg-surface border border-outline-variant/30 text-on-surface rounded-lg text-xs text-xs hover:bg-surface-container-lowestest cursor-pointer font-bold"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    dispatchTeamToSignal(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="px-4 py-1.5 bg-secondary text-on-secondary font-bold rounded-lg hover:bg-secondary-fixed cursor-pointer flex items-center gap-1.5 text-xs shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Dispatch Rescue Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h2 className="font-sans text-2xl text-on-surface flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-primary text-2xl">assignment</span>
            SOS Canonical Protocol & Event Logs
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time multi-hop store-and-forward mesh audit and canonical packet verification.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto bg-surface p-2.5 rounded-xl border border-outline-variant/30 shadow-sm">
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-sm">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface border border-outline-variant/30 text-on-surface rounded-lg focus:border-primary/50 pl-8 py-1.5 text-sm placeholder:text-on-surface-variant/50 focus:outline-none" 
              placeholder="Search SOS ID, district..." 
              type="text"
            />
          </div>

          <select 
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-surface border border-outline-variant/30 text-on-surface rounded-lg py-1.5 px-2.5 text-sm focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="">All Districts</option>
            <option value="khordha">Khordha</option>
            <option value="puri">Puri</option>
            <option value="cuttack">Cuttack</option>
            <option value="ganjam">Ganjam</option>
          </select>

          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface border border-outline-variant/30 text-on-surface rounded-lg py-1.5 px-2.5 text-sm focus:outline-none cursor-pointer shadow-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="resolved">Resolved</option>
          </select>

          <button 
            onClick={handleExportCSV}
            className="bg-surface hover:bg-surface-container-low border border-outline-variant/30 text-on-surface px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 cursor-pointer font-semibold shadow-sm transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download</span> Export CSV
          </button>
        </div>
      </div>

      {/* SOS Events Table */}
      <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface-container-lowest text-[11px] text-on-surface-variant uppercase tracking-wider font-sans">
                <th className="p-3.5 font-medium">SOS ID</th>
                <th className="p-3.5 font-medium">Timestamp</th>
                <th className="p-3.5 font-medium">Location &amp; GPS</th>
                <th className="p-3.5 font-medium">Ingest Medium</th>
                <th className="p-3.5 font-medium">Triage Severity</th>
                <th className="p-3.5 font-medium">Mesh Hops</th>
                <th className="p-3.5 text-right font-medium">Audit Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/60 text-sm">
              {filteredLogs.map((log) => {
                let badgeClass = "bg-surface-container text-on-surface border border-outline-variant/30";
                if (log.status.toLowerCase() === 'critical') badgeClass = "bg-error/10 text-error border border-error/20";
                if (log.status.toLowerCase() === 'urgent') badgeClass = "bg-primary/10 text-primary border border-primary/20";
                if (log.status.toLowerCase() === 'pending') badgeClass = "bg-surface-container-lowestest text-on-surface-variant border border-outline-variant/30";

                return (
                <tr key={log.id} className="hover:bg-surface transition-colors group cursor-default">
                  <td className="p-3.5 font-sans font-medium text-on-surface">
                    {log.id}
                  </td>
                  <td className="p-3.5 text-on-surface-variant font-sans text-[11px]">
                    {log.timestamp}
                  </td>
                  <td className="p-3.5">
                    <span className="font-medium text-on-surface block text-[13px]">{log.loc}</span>
                    <span className="text-[10px] text-on-surface-variant font-sans">
                      GPS: {log.lat.toFixed(4)}° N, {log.lng.toFixed(4)}° E
                    </span>
                  </td>
                  <td className="p-3.5 font-sans text-[11px] text-on-surface-variant flex items-center gap-1.5 pt-4">
                    <span className="material-symbols-outlined text-[14px]">{log.sourceIcon}</span>
                    {log.source}
                  </td>
                  <td className="p-3.5">
                    <span className={`px-2 py-0.5 rounded font-sans font-medium text-[10px] uppercase ${badgeClass}`}>
                      {log.status} ({log.score} pts)
                    </span>
                  </td>
                  <td className="p-3.5 font-sans text-[11px] text-on-surface-variant">
                    <span className="font-medium text-on-surface">{log.hop} Hops</span> (TTL: {8 - log.hop})
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => setSelectedLog(log)}
                      className="px-3 py-1 bg-surface border border-outline-variant/30 text-on-surface hover:bg-surface-container-lowestest rounded text-[11px] font-medium transition-colors cursor-pointer inline-flex items-center gap-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <span className="material-symbols-outlined text-[14px]">visibility</span>
                      Inspect
                    </button>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
