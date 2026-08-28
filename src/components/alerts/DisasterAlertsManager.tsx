import React, { useState, useEffect } from 'react';
import { useEOC } from '../../context/EOCContext';
import { API_BASE } from '../../services/api';

export interface DisasterAlert {
  alert_id: string;
  alert_type: 'WEATHER' | 'FLOOD' | 'CYCLONE' | 'EVACUATION' | 'ROAD_BLOCKAGE' | 'SHELTER' | 'MEDICAL' | 'OTHER_AUTHORIZED_ALERT';
  severity: 'RED_CRITICAL' | 'ORANGE_WARNING' | 'YELLOW_WATCH';
  title: string;
  message: string;
  affected_area: string;
  created_by?: string;
  created_at: string;
  expires_at: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  source: string;
  is_official_govt_source: boolean;
  source_verification_ref?: string;
  audit_metadata?: any;
}

export interface AlertAuditLog {
  id: string;
  alert_id: string;
  action: string;
  old_status?: string;
  new_status?: string;
  changed_by?: string;
  timestamp: string;
  notes?: string;
}

export const DisasterAlertsManager: React.FC = () => {
  const { showToast } = useEOC();

  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [auditLogs, setAuditLogs] = useState<AlertAuditLog[]>([]);
  const [activeTab, setActiveTab] = useState<'live_alerts' | 'audit_trail'>('live_alerts');
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [cancelModalAlert, setCancelModalAlert] = useState<DisasterAlert | null>(null);
  const [cancelReason, setCancelReason] = useState('Threat subsided / evacuated to safety');
  
  // Filter States
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [officialOnly, setOfficialOnly] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // New Alert Form State
  const [newAlert, setNewAlert] = useState({
    alert_type: 'CYCLONE' as DisasterAlert['alert_type'],
    severity: 'RED_CRITICAL' as DisasterAlert['severity'],
    title: '',
    message: '',
    affected_area: 'Puri District Coastal Belt (Sectors 1 to 4)',
    expires_in_hours: 24,
    source: 'IMD_OSDMA_OFFICIAL',
    is_official_govt_source: true,
    source_verification_ref: 'OSDMA-DISASTER-BULLETIN-2026-08'
  });

  const fetchAlertsAndAudit = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const headers = { 'Authorization': `Bearer ${token}` };
      const [alertsRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/alerts/?status=ALL`, { headers, signal: controller.signal }),
        fetch(`${API_BASE}/api/v1/alerts/audit-trail`, { headers, signal: controller.signal })
      ]);

      if (alertsRes.ok) {
        const aData = await alertsRes.json();
        setAlerts(aData.data || []);
      } else {
        loadFallbackAlerts();
      }

      if (auditRes.ok) {
        const auData = await auditRes.json();
        setAuditLogs(auData.data || []);
      }
      clearTimeout(timeoutId);
    } catch {
      loadFallbackAlerts();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackAlerts = () => {
    setAlerts([]);
  };

  useEffect(() => {
    fetchAlertsAndAudit();
  }, []);

  // Publish Alert Submission
  const handlePublishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAlert.title || !newAlert.message || !newAlert.affected_area) {
      showToast("Please complete all required alert fields.");
      return;
    }

    // Publishes into the local list when the broadcast API can't confirm. Reached
    // from catch too: offline the old catch said "broadcast submitted" and closed
    // the modal without ever adding the alert, so nothing was broadcast anywhere.
    const publishLocally = () => {
      setAlerts(prev => [{
        // Suffixed with the queue position so two local drafts can't collide on key.
        alert_id: `ALT-${newAlert.alert_type.slice(0, 3)}-LOCAL${prev.length + 1}`,
        alert_type: newAlert.alert_type,
        severity: newAlert.severity,
        title: newAlert.title,
        message: newAlert.message,
        affected_area: newAlert.affected_area,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + newAlert.expires_in_hours * 3600000).toISOString(),
        status: 'ACTIVE',
        source: newAlert.source,
        is_official_govt_source: newAlert.is_official_govt_source,
        source_verification_ref: newAlert.source_verification_ref
      } as DisasterAlert, ...prev]);
      showToast(`${newAlert.title} held locally — not yet broadcast.`);
      setPublishModalOpen(false);
    };

    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const res = await fetch(`${API_BASE}/api/v1/alerts/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newAlert)
      });

      if (res.ok) {
        showToast(`${newAlert.title} published to ${newAlert.affected_area}.`);
        setPublishModalOpen(false);
        fetchAlertsAndAudit();
      } else {
        publishLocally();
      }
    } catch {
      publishLocally();
    }
  };

  // Cancel Alert Submission
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalAlert) return;

    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const res = await fetch(`${API_BASE}/api/v1/alerts/${cancelModalAlert.alert_id}/cancel`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: cancelReason })
      });

      if (res.ok) {
        showToast(`Alert ${cancelModalAlert.alert_id} cancelled.`);
        setCancelModalAlert(null);
        fetchAlertsAndAudit();
      } else {
        setAlerts(prev => prev.map(a => a.alert_id === cancelModalAlert.alert_id ? { ...a, status: 'CANCELLED' } : a));
        showToast(`Alert ${cancelModalAlert.alert_id} cancelled.`);
        setCancelModalAlert(null);
      }
    } catch {
      setAlerts(prev => prev.map(a => a.alert_id === cancelModalAlert.alert_id ? { ...a, status: 'CANCELLED' } : a));
      showToast(`Alert ${cancelModalAlert.alert_id} cancelled.`);
      setCancelModalAlert(null);
    }
  };

  const filteredAlerts = alerts.filter(a => {
    if (filterType !== 'ALL' && a.alert_type !== filterType) return false;
    if (filterSeverity !== 'ALL' && a.severity !== filterSeverity) return false;
    if (officialOnly && !a.is_official_govt_source) return false;
    return true;
  });

  const getSeverityBadge = (sev: DisasterAlert['severity']) => {
    switch (sev) {
      case 'RED_CRITICAL':
        return <span className="bg-error/10 text-on-error-container border border-error/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-error "></span>Critical</span>;
      case 'ORANGE_WARNING':
        return <span className="bg-tertiary/10 text-on-tertiary-container border border-tertiary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>Warning</span>;
      case 'YELLOW_WATCH':
        return <span className="bg-tertiary/10 text-on-tertiary-container border border-tertiary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>Watch</span>;
    }
  };

  const getSourceBadge = (isGovt: boolean, source: string, ref?: string) => {
    if (isGovt) {
      return (
        <span className="bg-primary/10 text-on-primary-container border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
          <span className="material-symbols-outlined text-[13px]">account_balance</span>
          <span>Official — {source}</span>
          {ref && <span className="text-[9px] text-on-primary-container/80 font-normal ml-1">Ref: {ref}</span>}
        </span>
      );
    }
    return (
      <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1">
        <span className="material-symbols-outlined text-[13px]">verified_user</span>
        <span>PRANSETU authorised — {source}</span>
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-on-surface text-sm">
      
      {/* Header */}
      <div className="bg-surface border border-outline-variant/30 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-error/15 border border-error/30 flex items-center justify-center text-on-error-container">
            <span className="material-symbols-outlined text-[24px]">campaign</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-lg sm:text-xl text-on-surface">
                Authorized Disaster Alert Management
              </h1>
              <span className="bg-error/10 text-on-error-container border border-error/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">
                EOC Emergency Broadcast
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Verified multi-channel emergency broadcast alerts with strict government source transparency and audit logging.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-surface-container-lowest p-1 rounded-lg border border-outline-variant/30">
            <button
              onClick={() => setActiveTab('live_alerts')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                activeTab === 'live_alerts' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Active Alerts ({alerts.filter(a => a.status === 'ACTIVE').length})
            </button>
            <button
              onClick={() => setActiveTab('audit_trail')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition-colors ${
                activeTab === 'audit_trail' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              Audit Trail
            </button>
          </div>

          <button
            onClick={() => setPublishModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 text-xs shadow-lg transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">add_alert</span>
            Publish Disaster Alert
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {activeTab === 'live_alerts' && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-outline-variant/30">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div>
              <span className="text-on-surface-variant font-sans text-xs font-semibold tracking-wider uppercase block mb-0.5">Alert Type</span>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="bg-surface border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
              >
                <option value="ALL">All alert types</option>
                <option value="WEATHER">Weather</option>
                <option value="FLOOD">Flood</option>
                <option value="CYCLONE">Cyclone</option>
                <option value="EVACUATION">Evacuation</option>
                <option value="ROAD_BLOCKAGE">Road blockage</option>
                <option value="SHELTER">Shelter</option>
                <option value="MEDICAL">Medical</option>
                <option value="OTHER_AUTHORIZED_ALERT">Other</option>
              </select>
            </div>

            <div>
              <span className="text-on-surface-variant font-sans text-xs font-semibold tracking-wider uppercase block mb-0.5">Severity</span>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="bg-surface border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
              >
                <option value="ALL">All Severities</option>
                <option value="RED_CRITICAL">Red — critical</option>
                <option value="ORANGE_WARNING">Orange — warning</option>
                <option value="YELLOW_WATCH">Yellow — watch</option>
              </select>
            </div>

            <label className="flex items-center gap-2 pt-3 cursor-pointer text-xs font-semibold">
              <input
                type="checkbox"
                checked={officialOnly}
                onChange={(e) => setOfficialOnly(e.target.checked)}
                className="rounded text-primary focus:ring-0"
              />
              <span>Official government sources only</span>
            </label>
          </div>

          <div className="flex items-center gap-3 font-sans text-xs text-on-surface-variant">
            {isLoading && (
              <span className="text-primary font-medium">Syncing alerts…</span>
            )}
            <span>Showing {filteredAlerts.length} Disaster Alerts</span>
          </div>
        </div>
      )}

      {/* TAB 1: LIVE ALERTS LIST */}
      {activeTab === 'live_alerts' && (
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="bg-surface-container p-12 rounded-xl text-center text-on-surface-variant space-y-2 border border-outline-variant/30">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">check_circle</span>
              <h3 className="font-bold text-on-surface text-base">No Active Alerts In Filter</h3>
              <p className="text-xs">No alerts currently match the selected type and severity filters.</p>
            </div>
          ) : (
            filteredAlerts.map((alert) => (
              <div
                key={alert.alert_id}
                className={`bg-surface-container border rounded-xl p-5 space-y-3 shadow-lg transition-all ${
                  alert.status === 'CANCELLED'
                    ? 'border-outline-variant opacity-60'
                    : alert.severity === 'RED_CRITICAL'
                    ? 'border-error/60 bg-red-950/10'
                    : alert.severity === 'ORANGE_WARNING'
                    ? 'border-tertiary/50 bg-amber-950/10'
                    : 'border-tertiary/40 bg-yellow-950/10'
                }`}
              >
                {/* Alert Top Info */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {getSeverityBadge(alert.severity)}
                      <span className="bg-surface-container-lowest text-on-surface-variant px-2 py-0.5 rounded text-[11px] font-sans font-semibold border border-outline-variant/30">
                        {alert.alert_type}
                      </span>
                      {getSourceBadge(alert.is_official_govt_source, alert.source, alert.source_verification_ref)}
                      {alert.status === 'CANCELLED' && (
                        <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-sans font-semibold">
                          CANCELLED / DE-ESCALATED
                        </span>
                      )}
                    </div>
                    <h2 className="text-base sm:text-lg font-bold text-on-surface mt-1">{alert.title}</h2>
                  </div>

                  <div className="text-right font-sans text-xs">
                    {/* Reference code, not a link — blue reads as clickable here and
                        it never was. Neutral + tabular keeps the IDs aligned down the list. */}
                    <span className="font-semibold text-on-surface tabular-nums">{alert.alert_id}</span>
                    <span className="text-[10px] text-on-surface-variant block">
                      Expires: {new Date(alert.expires_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Alert Message */}
                <p className="text-xs sm:text-sm text-on-surface leading-relaxed bg-surface-container-lowest/70 p-3.5 rounded-xl border border-outline-variant/60">
                  {alert.message}
                </p>

                {/* Affected Area & Directives */}
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1 border-t border-outline-variant/60 font-sans">
                  <div className="flex items-center gap-2">
                    <span className="text-on-surface-variant uppercase text-[10px]">Impact Zone:</span>
                    <span className="flex items-center gap-1 text-on-surface font-semibold">
                      <span className="material-symbols-outlined text-[14px] text-on-surface-variant">location_on</span>
                      {alert.affected_area}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-on-surface-variant">
                      Published: {new Date(alert.created_at).toLocaleTimeString()}
                    </span>

                    {alert.status === 'ACTIVE' && (
                      <button
                        onClick={() => setCancelModalAlert(alert)}
                        className="px-3 py-1 bg-surface hover:bg-surface-container-high text-error border border-error/40 rounded text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">close</span>
                        Cancel alert
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: AUDIT TRAIL */}
      {activeTab === 'audit_trail' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
            <h3 className="font-bold text-xs uppercase text-on-surface-variant font-sans">
              Broadcast history
            </h3>
            <span className="text-[10px] text-on-surface-variant font-sans">From database triggers</span>
          </div>

          {auditLogs.length === 0 ? (
            <div className="bg-surface-container p-8 rounded-xl text-center text-xs text-on-surface-variant">
              No audit logs captured yet.
            </div>
          ) : (
            auditLogs.map((log) => (
              <div key={log.id} className="bg-surface-container p-3.5 rounded-xl border border-outline-variant/30 text-xs font-sans flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-primary">{log.alert_id}</strong>
                    <span className="bg-surface-container-lowest px-1.5 py-0.2 rounded border border-outline-variant/30 text-on-surface-variant text-[10px]">
                      {log.action}
                    </span>
                    {log.old_status && <span className="text-on-surface-variant text-[10px]">{log.old_status} → {log.new_status}</span>}
                  </div>
                  <p className="text-[11px] text-on-surface-variant">{log.notes}</p>
                  <span className="text-[10px] text-on-surface-variant">Officer Sub: {log.changed_by || 'DMO_AUTHORIZED_SESSION'}</span>
                </div>
                <span className="text-[10px] text-primary">{new Date(log.timestamp).toLocaleTimeString()}</span>
              </div>
            ))
          )}
        </div>
      )}

      {/* PUBLISH ALERT MODAL */}
      {publishModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-xl w-full max-w-2xl shadow-lg max-h-[92vh] overflow-y-auto p-6 space-y-5 text-on-surface">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2.5 text-error">
                <span className="material-symbols-outlined text-[24px]">add_alert</span>
                <div>
                  <h3 className="font-sans font-bold text-on-surface text-base sm:text-lg">Publish Authorized Disaster Alert</h3>
                  <p className="text-xs text-on-surface-variant">EOC Multi-Channel Siren &amp; Broadcast Dispatch</p>
                </div>
              </div>
              <button onClick={() => setPublishModalOpen(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handlePublishSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-on-surface-variant uppercase block mb-1 font-sans font-medium">Alert Type</label>
                  <select
                    value={newAlert.alert_type}
                    onChange={(e) => setNewAlert({ ...newAlert, alert_type: e.target.value as any })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    required
                  >
                    <option value="WEATHER">Weather — extreme storm or rain</option>
                    <option value="FLOOD">Flood — riverine or backwater</option>
                    <option value="CYCLONE">Cyclone — landfall or tidal surge</option>
                    <option value="EVACUATION">Evacuation — mandatory relocation</option>
                    <option value="ROAD_BLOCKAGE">Road blockage — highway cutoff</option>
                    <option value="SHELTER">Shelter — occupancy or relief hub</option>
                    <option value="MEDICAL">Medical — triage or epidemic</option>
                    <option value="OTHER_AUTHORIZED_ALERT">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-on-surface-variant uppercase block mb-1 font-sans font-medium">Severity Level</label>
                  <select
                    value={newAlert.severity}
                    onChange={(e) => setNewAlert({ ...newAlert, severity: e.target.value as any })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
                    required
                  >
                    <option value="RED_CRITICAL">Red — critical (immediate life hazard)</option>
                    <option value="ORANGE_WARNING">Orange — warning (severe threat)</option>
                    <option value="YELLOW_WATCH">Yellow — watch (be prepared)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1 font-sans font-medium">Alert Headline / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. IMD Super Cyclone Landfall Warning - Mandatory Evacuation"
                  value={newAlert.title}
                  onChange={(e) => setNewAlert({ ...newAlert, title: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-semibold"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1 font-sans font-medium">Alert Broadcast Message &amp; Directives</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Detailed instructions for citizens and rescue coordinators..."
                  value={newAlert.message}
                  onChange={(e) => setNewAlert({ ...newAlert, message: e.target.value })}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-on-surface-variant uppercase block mb-1 font-sans font-medium">Affected Geographic Sector / Area</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Puri Coastal Belt, Astaranga, Paradeep"
                    value={newAlert.affected_area}
                    onChange={(e) => setNewAlert({ ...newAlert, affected_area: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface"
                  />
                </div>

                <div>
                  <label className="text-xs text-on-surface-variant uppercase block mb-1 font-sans font-medium">Active Duration (Hours)</label>
                  <input
                    type="number"
                    min={1}
                    max={72}
                    value={newAlert.expires_in_hours}
                    onChange={(e) => setNewAlert({ ...newAlert, expires_in_hours: Number(e.target.value) })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface font-sans"
                  />
                </div>
              </div>

              {/* Official Source Identification Toggle */}
              <div className="bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newAlert.is_official_govt_source}
                    onChange={(e) => setNewAlert({ ...newAlert, is_official_govt_source: e.target.checked })}
                    className="rounded text-primary focus:ring-0"
                  />
                  <div>
                    <strong className="text-xs text-on-surface">Official Government-Originated Warning</strong>
                    <span className="text-[11px] text-on-surface-variant block">
                      IMD / OSDMA / NDMA / Special Relief Commissioner Verified Bulletin
                    </span>
                  </div>
                </label>

                {newAlert.is_official_govt_source && (
                  <div className="pt-2">
                    <label className="text-xs text-on-surface-variant uppercase block mb-1 text-[10px] font-sans">
                      Government Bulletin / Reference Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SRC-ODISHA-DISASTER-BULLETIN-89"
                      value={newAlert.source_verification_ref}
                      onChange={(e) => setNewAlert({ ...newAlert, source_verification_ref: e.target.value })}
                      className="w-full bg-surface border border-outline-variant/30 rounded p-1.5 text-xs text-on-surface font-sans"
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setPublishModalOpen(false)}
                  className="px-4 py-2 bg-surface border border-outline-variant/30 rounded text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded-lg flex items-center gap-2 text-xs shadow-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">campaign</span>
                  Publish &amp; Broadcast Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL ALERT MODAL */}
      {cancelModalAlert && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 rounded-xl w-full max-w-md shadow-lg p-5 space-y-4 text-on-surface">
            <div className="flex items-center justify-between pb-2 border-b border-outline-variant text-error">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">cancel</span>
                <h3 className="font-bold text-on-surface">Cancel &amp; De-escalate Alert</h3>
              </div>
              <button onClick={() => setCancelModalAlert(null)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant">
              Are you sure you want to cancel alert <strong>{cancelModalAlert.alert_id}</strong> ({cancelModalAlert.title})?
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-on-surface-variant block mb-1 font-sans uppercase">
                  De-escalation Reason (Audited)
                </label>
                <textarea
                  rows={2}
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setCancelModalAlert(null)} className="px-3 py-1.5 bg-surface border border-outline-variant/30 rounded text-xs">
                  Back
                </button>
                <button type="submit" className="px-4 py-1.5 bg-error text-on-error font-bold rounded text-xs">
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
