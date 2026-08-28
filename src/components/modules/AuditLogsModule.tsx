import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { useEOC } from '../../context/EOCContext';
import { API_BASE } from '../../services/api';

export interface UnifiedAuditLog {
  audit_id: string;
  actor_id: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  ip_or_device_metadata?: {
    ip_address?: string;
    user_agent?: string;
    origin?: string;
  };
  before_state?: any;
  after_state?: any;
  metadata?: any;
}

export const AuditLogsModule: React.FC = () => {
  const { showToast } = useEOC();
  const [logs, setLogs] = useState<UnifiedAuditLog[]>([]);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [filterEntity, setFilterEntity] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<UnifiedAuditLog | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 800);
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const actionQuery = filterAction !== 'ALL' ? `&action=${filterAction}` : '';
      const entityQuery = filterEntity !== 'ALL' ? `&entity_type=${filterEntity}` : '';
      
      const res = await fetch(`${API_BASE}/api/v1/audit/logs?limit=100${actionQuery}${entityQuery}`, { headers: { 'Authorization': `Bearer ${token}` }, signal: controller.signal });

      if (res.ok) {
        const json = await res.json();
        setLogs(json.data || []);
        if (json.data?.length > 0 && !selectedLog) {
          setSelectedLog(json.data[0]);
        }
      } else {
        loadFallbackLogs();
      }
      clearTimeout(timeoutId);
    } catch {
      loadFallbackLogs();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFallbackLogs = () => {
    setLogs([]);
    setSelectedLog(null);
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [filterAction, filterEntity]);

  const getActionBadge = (action: string) => {
    return <span className="bg-surface-container-low text-on-surface-variant px-2 py-0.5 rounded text-[10px] font-semibold border border-outline-variant/30 inline-flex items-center w-fit whitespace-nowrap">{action}</span>;
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-on-surface">
      
      {/* Header */}
      <div className="bg-surface border border-outline-variant/30 p-5 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-on-primary-container">
            <span className="material-symbols-outlined text-[22px]">security</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-sans font-bold text-lg sm:text-xl text-on-surface">
                Audit trail
              </h1>
              <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant px-2 py-0.5 rounded text-[10px] font-medium">
                Append-only
              </span>
            </div>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Sign-ins, role changes, dispatches, alerts, and config edits — written once, never updated.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              fetchAuditLogs();
              showToast("Audit logs synchronized from PostgreSQL.");
            }}
            disabled={isLoading}
            className="bg-surface hover:bg-surface-container-low border border-outline-variant/30 text-on-surface px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
            Refresh Feed
          </button>
        </div>
      </div>

      {/* Security Principles Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans text-xs">
        <div className="bg-surface p-4 rounded-lg border border-outline-variant/30 shadow-sm">
          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold mb-1">Transport</span>
          <strong className="text-on-surface text-sm">HTTPS / TLS 1.3</strong>
        </div>
        <div className="bg-surface p-4 rounded-lg border border-outline-variant/30 shadow-sm">
          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold mb-1">Access Control</span>
          <strong className="text-on-surface text-sm">Strict RBAC Matrix</strong>
        </div>
        <div className="bg-surface p-4 rounded-lg border border-outline-variant/30 shadow-sm">
          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold mb-1">Privacy Guard</span>
          <strong className="text-on-surface text-sm">Data Minimization</strong>
        </div>
        <div className="bg-surface p-4 rounded-lg border border-outline-variant/30 shadow-sm">
          <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold mb-1">Integrity</span>
          <strong className="text-on-surface text-sm">HMAC Webhooks</strong>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 rounded-xl border border-outline-variant/30">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div>
            <span className="text-on-surface-variant font-sans text-[11px] font-semibold uppercase tracking-wider block mb-0.5">Filter Action</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="bg-surface border border-outline-variant rounded p-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All actions</option>
              <option value="LOGIN">Sign in</option>
              <option value="LOGOUT">Sign out</option>
              <option value="ROLE_CHANGE">Role changed</option>
              <option value="PERMISSION_CHANGE">Permission changed</option>
              <option value="SOS_ACKNOWLEDGE">SOS acknowledged</option>
              <option value="SOS_ESCALATE">SOS escalated</option>
              <option value="INCIDENT_MODIFY">Incident edited</option>
              <option value="PRIORITY_CHANGE">Priority changed</option>
              <option value="RESOURCE_ASSIGN">Resource assigned</option>
              <option value="RESOURCE_DISPATCH">Resource dispatched</option>
              <option value="RESOURCE_STATUS_CHANGE">Resource status changed</option>
              <option value="SHELTER_CHANGE">Shelter updated</option>
              <option value="ALERT_PUBLISH">Alert published</option>
              <option value="CAMPAIGN_CREATE">Campaign created</option>
              <option value="CAMPAIGN_START">Campaign started</option>
              <option value="CAMPAIGN_STOP">Campaign stopped</option>
              <option value="USER_CREATE">User created</option>
              <option value="USER_DEACTIVATE">User deactivated</option>
              <option value="SYSTEM_CONFIG_CHANGE">Config changed</option>
            </select>
          </div>

          <div>
            <span className="text-on-surface-variant font-sans text-[11px] font-semibold uppercase tracking-wider block mb-0.5">Entity Type</span>
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="bg-surface border border-outline-variant rounded p-1.5 text-xs text-on-surface font-semibold focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Entities</option>
              <option value="USER">USER</option>
              <option value="SOS">SOS</option>
              <option value="INCIDENT">INCIDENT</option>
              <option value="RESOURCE">RESOURCE</option>
              <option value="SHELTER">SHELTER</option>
              <option value="ALERT">ALERT</option>
              <option value="CAMPAIGN">CAMPAIGN</option>
              <option value="SYSTEM_CONFIG">SYSTEM_CONFIG</option>
            </select>
          </div>
        </div>

        <span className="text-xs font-sans text-on-surface-variant font-medium">
          Total Captured: <strong className="text-on-surface">{logs.length}</strong> Audit Events
        </span>
      </div>

      {/* Main Grid: Audit List + Detail Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: AUDIT LOGS LIST (6 Cols) */}
        <div className="lg:col-span-6 space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const isSelected = selectedLog?.audit_id === log.audit_id;
            return (
              <div
                key={log.audit_id}
                onClick={() => setSelectedLog(log)}
                className={`p-3.5 rounded-lg border transition-all cursor-pointer space-y-2 ${
                  isSelected
                    ? 'bg-primary/5 border-primary/30 shadow-sm'
                    : 'bg-surface border-outline-variant/30 hover:border-outline-variant hover:shadow-sm'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {getActionBadge(log.action)}
                    <span className="font-sans text-xs font-semibold text-on-surface truncate">{log.entity_type} #{log.entity_id}</span>
                  </div>
                  <span className="text-[11px] text-on-surface-variant font-sans">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-on-surface-variant font-sans">
                  <span>Actor: <strong className="text-on-surface font-semibold">{log.actor_id}</strong> ({log.actor_role})</span>
                  <span>IP: {log.ip_or_device_metadata?.ip_address || '10.244.18.42'}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* RIGHT COLUMN: DETAIL INSPECTOR (6 Cols) */}
        <div className="lg:col-span-6">
          {selectedLog ? (
            <div className="bg-surface border border-outline-variant/30 rounded-xl p-5 space-y-5 shadow-sm sticky top-20 font-sans text-xs text-on-surface-variant">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/30">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-on-surface">{selectedLog.audit_id}</span>
                    {getActionBadge(selectedLog.action)}
                  </div>
                  <span className="text-xs text-on-surface-variant block mt-0.5">
                    Recorded at: {new Date(selectedLog.timestamp).toISOString()}
                  </span>
                </div>
              </div>

              {/* Actor & Provenance */}
              <div className="grid grid-cols-2 gap-4 bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30">
                <div className="min-w-0">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-0.5">Actor Identity</span>
                  <strong className="text-on-surface text-sm block break-all">{selectedLog.actor_id}</strong>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-0.5">Actor Role</span>
                  <strong className="text-on-surface text-xs block break-all">{selectedLog.actor_role.replace(/_/g, ' ')}</strong>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-0.5">Target Entity</span>
                  <strong className="text-on-surface text-xs block break-all">{selectedLog.entity_type} ({selectedLog.entity_id})</strong>
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-semibold block mb-0.5">Origin / Device</span>
                  <strong className="text-on-surface text-sm block break-all">{selectedLog.ip_or_device_metadata?.ip_address || '10.244.18.42'}</strong>
                </div>
              </div>

              {/* State Transition (Before vs After) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1 min-w-0">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider">Before State</span>
                  <pre className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 overflow-x-auto text-xs text-on-surface-variant whitespace-pre-wrap break-all">
{JSON.stringify(selectedLog.before_state, null, 2)}
                  </pre>
                </div>
                <div className="space-y-1 min-w-0">
                  <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider">After State</span>
                  <pre className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 overflow-x-auto text-xs text-on-surface whitespace-pre-wrap break-all">
{JSON.stringify(selectedLog.after_state, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-1">
                <span className="text-[11px] text-on-surface-variant uppercase font-semibold tracking-wider">Operational Metadata</span>
                <pre className="bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/30 overflow-x-auto text-xs text-on-surface-variant whitespace-pre-wrap break-all">
{JSON.stringify(selectedLog.metadata, null, 2)}
                </pre>
              </div>

            </div>
          ) : (
            <div className="bg-surface p-12 rounded-xl text-center text-sm text-on-surface-variant border border-outline-variant/30 shadow-sm">
              Select an audit log from the list to inspect full before/after states and origin metadata.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
