import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import type { SOSSignal } from '../context/EOCContext';

export const SOSLogs: React.FC = () => {
  const { signals, dispatchTeamToSignal, resolveSignal, showToast } = useEOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<SOSSignal | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    const headers = 'SOS ID,Timestamp,District,Location,Source,Status,Priority Score,People Affected,Hops,Relay Path\n';
    const rows = filteredLogs
      .map(
        (l) =>
          `"${l.id}","${l.timestamp}","${l.district}","${l.loc}","${l.source}","${l.status}",${l.score},"${l.people}",${l.hop},"${l.relayPath.join(' -> ')}"`
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

  return (
    <div className="p-4 sm:p-margin-mobile md:p-margin-desktop min-h-screen bg-background text-on-background w-full">
      {/* Signal Audit Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">route</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Signal Relay Audit: {selectedLog.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 bg-surface-container-high p-3 rounded-lg border border-outline-variant text-xs">
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">TIMESTAMP</span>
                  <span className="font-data-value text-data-value text-on-surface">{selectedLog.timestamp}</span>
                </div>
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">SEVERITY / STATUS</span>
                  <span className={`font-data-value text-data-value font-bold ${selectedLog.scoreColor}`}>
                    {selectedLog.status.toUpperCase()} ({selectedLog.score} pts)
                  </span>
                </div>
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">INGESTION CHANNEL</span>
                  <span className="font-data-value text-data-value text-on-surface flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">{selectedLog.sourceIcon}</span> {selectedLog.source}
                  </span>
                </div>
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">EST. AFFECTED</span>
                  <span className="font-data-value text-data-value text-on-surface">{selectedLog.people}</span>
                </div>
              </div>

              <div>
                <span className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1 text-xs">
                  Situation Assessment &amp; Keywords
                </span>
                <p className="font-body-sm text-body-sm text-on-surface bg-surface-container-highest p-3 rounded border border-outline-variant text-xs sm:text-sm">
                  {selectedLog.details}
                </p>
              </div>

              <div>
                <span className="font-data-label text-data-label text-on-surface-variant uppercase block mb-2 text-xs">
                  Multi-Hop Packet Path ({selectedLog.hop} Hops)
                </span>
                <div className="space-y-1.5 font-data-value text-data-value text-xs bg-surface-container-lowest p-3 rounded border border-outline-variant">
                  {selectedLog.relayPath.map((node, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-on-surface-variant">
                      <span className="w-5 h-5 rounded-full bg-primary-container text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className={idx === selectedLog.relayPath.length - 1 ? 'text-primary font-bold truncate' : 'text-on-surface truncate'}>
                        {node}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap justify-between items-center gap-2 pt-3 border-t border-outline-variant">
                <button
                  onClick={() => {
                    resolveSignal(selectedLog.id);
                    setSelectedLog(null);
                  }}
                  className="px-3 py-1.5 bg-surface-bright border border-status-green text-status-green rounded font-data-label text-xs hover:bg-status-green/10 cursor-pointer"
                >
                  Mark Rescued
                </button>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setSelectedLog(null)}
                    className="px-3 py-1.5 bg-surface-bright border border-outline-variant text-on-surface rounded font-data-label text-xs hover:bg-surface-container-highest cursor-pointer"
                  >
                    Close
                  </button>
                  <button 
                    onClick={() => {
                      dispatchTeamToSignal(selectedLog.id);
                      setSelectedLog(null);
                    }}
                    className="px-4 py-1.5 bg-secondary text-on-secondary font-bold rounded hover:bg-secondary-fixed cursor-pointer flex items-center gap-1 text-xs"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Dispatch Team
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header & Filters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-stack-md mb-stack-lg">
        <div>
          <h2 className="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined text-secondary icon-fill text-3xl">list_alt</span>
            SOS Event Logs
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs sm:text-sm">
            Real-time audit of all inbound distress signals and offline relay chains.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto bg-surface-container p-2 rounded-xl border border-outline-variant">
          <div className="relative flex-1 sm:flex-none sm:w-48">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-on-surface-variant text-sm">search</span>
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-lowest border border-outline-variant text-on-surface rounded focus:ring-brand-blue focus:border-brand-blue pl-8 py-1.5 font-body-sm text-xs sm:text-sm placeholder:text-on-surface-variant/50 focus:outline-none" 
              placeholder="Search SOS ID, district..." 
              type="text"
            />
          </div>

          <select 
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface rounded focus:ring-brand-blue focus:border-brand-blue py-1.5 px-2 font-body-sm text-xs sm:text-sm focus:outline-none"
          >
            <option value="">All Districts</option>
            <option value="khordha">Khordha</option>
            <option value="cuttack">Cuttack</option>
            <option value="ganjam">Ganjam</option>
            <option value="puri">Puri</option>
            <option value="balasore">Balasore</option>
          </select>

          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-surface-container-lowest border border-outline-variant text-on-surface rounded focus:ring-brand-blue focus:border-brand-blue py-1.5 px-2 font-body-sm text-xs sm:text-sm focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="critical">Critical</option>
            <option value="urgent">Urgent</option>
            <option value="pending">Pending</option>
            <option value="dispatched">Dispatched</option>
            <option value="resolved">Resolved</option>
          </select>

          <button
            onClick={handleExportCSV}
            className="bg-surface-bright hover:bg-surface-container-highest border border-outline-variant px-3 py-1.5 rounded text-xs font-bold text-on-surface flex items-center gap-1 cursor-pointer transition-colors"
            title="Download CSV report of logs"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Data Table Container */}
      <div className="bg-surface-container rounded-xl border border-outline-variant overflow-hidden flex flex-col min-h-[400px]">
        {/* Table Header (Desktop Only) */}
        <div className="hidden md:grid bg-surface-container-high border-b border-outline-variant px-4 py-3 grid-cols-12 gap-4 items-center font-data-label text-data-label text-on-surface-variant uppercase text-xs">
          <div className="col-span-2">SOS ID</div>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-1">Source</div>
          <div className="col-span-2">Severity</div>
          <div className="col-span-2">Location</div>
          <div className="col-span-1 text-center">Hops</div>
          <div className="col-span-2 text-right">Action</div>
        </div>

        {/* Table Body (Responsive Cards on Mobile / Rows on Desktop) */}
        <div className="overflow-y-auto table-container flex-1 divide-y divide-outline-variant/30">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant font-data-label text-sm">
              No SOS logs match the specified search or filter criteria.
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isCritical = log.status === 'Critical';
              const isUrgent = log.status === 'Urgent';
              const isMesh = log.source === 'Mesh Relay';

              const borderLeftColor = isCritical 
                ? 'bg-brand-red' 
                : isUrgent 
                ? 'bg-brand-orange' 
                : 'bg-surface-variant';

              const badgeClass = isCritical
                ? 'bg-brand-red text-white'
                : isUrgent
                ? 'bg-brand-orange text-[#1A1A1A]'
                : 'bg-surface-variant text-white';

              return (
                <div 
                  key={log.id}
                  className="px-4 py-3 md:grid md:grid-cols-12 md:gap-4 md:items-center hover:bg-surface-container-highest transition-colors relative group"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${borderLeftColor}`}></div>
                  
                  {/* Mobile Row Layout */}
                  <div className="md:hidden flex justify-between items-start mb-2">
                    <div>
                      <span className="font-data-value text-data-value text-on-surface font-bold text-sm mr-2">{log.id}</span>
                      <span className="font-data-value text-data-value text-on-surface-variant text-xs">{log.timestamp}</span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${badgeClass}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Desktop Columns */}
                  <div className="hidden md:block col-span-2 font-data-value text-data-value text-on-surface font-semibold text-sm">
                    {log.id}
                  </div>
                  <div className="hidden md:block col-span-2 font-data-value text-data-value text-on-surface-variant text-xs">
                    {log.timestamp}
                  </div>
                  <div className="col-span-1 flex items-center gap-1 text-on-surface text-xs my-1 md:my-0">
                    <span className="material-symbols-outlined text-sm">{log.sourceIcon}</span>
                    <span className="font-body-sm text-body-sm">{log.source.split(' ')[0]}</span>
                  </div>
                  <div className="hidden md:block col-span-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${badgeClass}`}>
                      {log.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="col-span-2 font-data-value text-data-value text-on-surface text-xs truncate my-1 md:my-0">
                    {log.loc}
                  </div>
                  <div className={`col-span-1 font-data-value text-data-value text-xs md:text-center ${
                    isMesh && log.hop > 3 ? 'text-secondary font-bold' : 'text-on-surface'
                  }`}>
                    <span className="md:hidden text-on-surface-variant mr-1">Hops:</span>
                    {log.hop}
                  </div>
                  <div className="col-span-2 flex justify-end mt-2 md:mt-0">
                    <button 
                      onClick={() => setSelectedLog(log)}
                      className="font-body-sm text-body-sm text-primary hover:text-white border border-outline-variant hover:border-primary px-3 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer text-xs"
                    >
                      <span className="material-symbols-outlined text-sm">route</span>
                      Audit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer / Pagination */}
        <div className="bg-surface-container-high border-t border-outline-variant px-4 py-2.5 flex justify-between items-center text-xs text-on-surface-variant font-body-sm">
          <span>Showing 1-{filteredLogs.length} of {signals.length} alerts</span>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              className="p-1 rounded hover:bg-surface-variant disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <span className="px-2">Page {currentPage} of 1</span>
            <button 
              onClick={() => setCurrentPage((p) => p + 1)}
              className="p-1 rounded hover:bg-surface-variant cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
