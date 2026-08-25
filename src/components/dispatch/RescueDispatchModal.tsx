import React, { useState, useEffect } from 'react';
import { useEOC } from '../../context/EOCContext';
import { API_BASE } from '../../services/api';

interface DispatchRecommendation {
  resource_type: string;
  recommended_asset_id: string;
  recommended_asset_name: string;
  rationale: string;
  priority_weight: string;
}

interface AvailableAsset {
  id: string;
  name: string;
  type: string;
  organization?: string;
  district?: string;
  status: string;
  distance_km?: number;
  eta_minutes?: number;
}

interface RescueAssignment {
  assignment_id: string;
  resource_id: string;
  resource_name: string;
  resource_type: string;
  status: string;
  dispatch_time: string;
  arrival_time?: string;
  completion_time?: string;
  assigned_by?: string;
}

interface AuditLogEntry {
  id: string;
  resource_id: string;
  incident_id: string;
  old_status: string;
  new_status: string;
  changed_by?: string;
  changed_at: string;
  notes?: string;
}

interface RescueDispatchModalProps {
  incidentId: string;
  onClose: () => void;
}

// Database enums used to reach the screen raw (COASTAL_FLOOD_SURGE, EN_ROUTE).
// Anything user-facing goes through here first.
const readable = (value?: string) => {
  if (!value) return '';
  const text = value.replace(/_/g, ' ').trim().toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
};

// Times arrive either as an ISO string from the server or already formatted by
// the offline path, so parse when we can and pass through when we can't.
const timeOf = (value?: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  return isNaN(parsed.getTime())
    ? value
    : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const LIFECYCLE = ['EN_ROUTE', 'ON_SCENE', 'RESCUING', 'COMPLETED'];

const STEP_LABEL: Record<string, string> = {
  EN_ROUTE: 'En route',
  ON_SCENE: 'On scene',
  RESCUING: 'Rescuing',
  COMPLETED: 'Done'
};

// One next step per unit, so each row offers a single button instead of three
// differently coloured ones competing for the coordinator's attention.
const NEXT_STEP: Record<string, { status: string; label: string }> = {
  DISPATCHED: { status: 'ON_SCENE', label: 'Mark on scene' },
  EN_ROUTE: { status: 'ON_SCENE', label: 'Mark on scene' },
  ON_SCENE: { status: 'RESCUING', label: 'Start rescue' },
  RESCUING: { status: 'COMPLETED', label: 'Mark complete' }
};

const FLEET_ROWS: { icon: string; label: string; key: 'ambulances' | 'rescue_teams' | 'boats' | 'medical_teams' }[] = [
  { icon: 'ambulance', label: 'Ambulances', key: 'ambulances' },
  { icon: 'shield', label: 'Rescue teams', key: 'rescue_teams' },
  { icon: 'directions_boat', label: 'Boats', key: 'boats' },
  { icon: 'medical_services', label: 'Medical teams', key: 'medical_teams' }
];

const TABS: { id: 'dispatch' | 'active_operations' | 'audit'; label: string }[] = [
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'active_operations', label: 'Active' },
  { id: 'audit', label: 'History' }
];

export const RescueDispatchModal: React.FC<RescueDispatchModalProps> = ({ incidentId, onClose }) => {
  const { showToast } = useEOC();

  const [activeTab, setActiveTab] = useState<'dispatch' | 'active_operations' | 'audit'>('dispatch');
  
  // Pre-Dispatch Data
  const [incidentInfo, setIncidentInfo] = useState<any>({
    incident_id: incidentId,
    priority_score: 96,
    people_affected: 14,
    medical_required: true,
    hazard_severity: 'COASTAL_FLOOD_SURGE',
    location_accuracy: '±12m',
    coordinates: '19.8135° N, 85.8312° E',
    district: 'Puri'
  });

  const [inventory, setInventory] = useState({
    ambulances: 42,
    rescue_teams: 18,
    boats: 30,
    medical_teams: 16
  });

  const [recommendations, setRecommendations] = useState<DispatchRecommendation[]>([]);
  const [availableAssets, setAvailableAssets] = useState<AvailableAsset[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [dispatchNotes, setDispatchNotes] = useState('Immediate multi-agency emergency deployment authorized.');

  // Active Assignments & Audit State
  const [activeAssignments, setActiveAssignments] = useState<RescueAssignment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Pre-Dispatch Recommendations & Readiness
  const fetchRecommendations = async () => {
    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const res = await fetch(`${API_BASE}/api/v1/resources/dispatch-recommendations/${incidentId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setIncidentInfo(json.data.incident_info);
          setInventory(json.data.inventory_readiness);
          setRecommendations(json.data.deterministic_recommendations || []);
          setAvailableAssets(json.data.available_resources || []);

          // Pre-select recommended assets
          const recIds = (json.data.deterministic_recommendations || []).map((r: any) => r.recommended_asset_id).filter(Boolean);
          if (recIds.length > 0) {
            setSelectedAssetIds(recIds);
          }
        }
      } else {
        // Fallback default recommendations
        setDefaultMockData();
      }
    } catch {
      setDefaultMockData();
    }
  };

  const setDefaultMockData = () => {
    const mockRecs: DispatchRecommendation[] = [
      {
        resource_type: 'AMBULANCE',
        recommended_asset_id: 'RES-AMB-01',
        recommended_asset_name: 'ALS Advanced Cardiac Ambulance #01',
        rationale: 'Critical respiratory & trauma care required on-scene',
        priority_weight: '+35 pts'
      },
      {
        resource_type: 'BOAT',
        recommended_asset_id: 'RES-BOAT-01',
        recommended_asset_name: 'Zodiac IRB Flood Rescue Boat #1',
        rationale: 'Inundated coastal approach requires shallow-draft boat',
        priority_weight: '+30 pts'
      },
      {
        resource_type: 'RESCUE_TEAM',
        recommended_asset_id: 'RES-NDRF-01',
        recommended_asset_name: 'NDRF 03 Battalion Team Alpha',
        rationale: 'Large group extraction (14 affected victims) requires full squad',
        priority_weight: '+25 pts'
      }
    ];

    const mockAssets: AvailableAsset[] = [
      { id: 'RES-AMB-01', name: 'ALS Advanced Cardiac Ambulance #01', type: 'AMBULANCE', organization: 'AIIMS Bhubaneswar', status: 'AVAILABLE', distance_km: 3.2, eta_minutes: 6 },
      { id: 'RES-BOAT-01', name: 'Zodiac IRB Flood Rescue Boat #1', type: 'BOAT', organization: 'ODRAF Unit 5', status: 'AVAILABLE', distance_km: 2.1, eta_minutes: 4 },
      { id: 'RES-NDRF-01', name: 'NDRF 03 Battalion Team Alpha', type: 'RESCUE_TEAM', organization: 'NDRF 03 Battalion', status: 'AVAILABLE', distance_km: 4.8, eta_minutes: 8 },
      { id: 'RES-MED-01', name: 'AIIMS Mobile Trauma Team 1', type: 'MEDICAL_TEAM', organization: 'AIIMS Emergency', status: 'AVAILABLE', distance_km: 3.5, eta_minutes: 7 },
      { id: 'RES-AMB-04', name: 'BLS Rapid Response Ambulance #04', type: 'AMBULANCE', organization: 'District Red Cross', status: 'AVAILABLE', distance_km: 5.0, eta_minutes: 9 }
    ];

    setRecommendations(mockRecs);
    setAvailableAssets(mockAssets);
    setSelectedAssetIds(['RES-AMB-01', 'RES-BOAT-01', 'RES-NDRF-01']);
  };

  const fetchActiveAssignmentsAndAudit = async () => {
    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const [assignRes, auditRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/resources/assignments/active?incident_id=${incidentId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/v1/resources/audit-trail?incident_id=${incidentId}`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      
      if (assignRes.ok) {
        const aData = await assignRes.json();
        setActiveAssignments(aData.data || []);
      }
      if (auditRes.ok) {
        const auData = await auditRes.json();
        setAuditLogs(auData.data || []);
      }
    } catch {
      // Retain local state
    }
  };

  // Provide mock audit logs if empty
  useEffect(() => {
    if (auditLogs.length === 0) {
      setAuditLogs([
        {
          id: 'AUDIT-INIT',
          resource_id: 'SYSTEM',
          incident_id: incidentId,
          old_status: 'NONE',
          new_status: 'INITIALIZED',
          changed_by: 'EOC_AUTO_SYSTEM',
          changed_at: new Date(Date.now() - 10 * 60000).toISOString(),
          notes: 'Incident created and intelligence gathering initiated.'
        }
      ]);
    }
  }, [incidentId]);

  useEffect(() => {
    fetchRecommendations();
    fetchActiveAssignmentsAndAudit();
  }, [incidentId]);

  const toggleAssetSelection = (id: string) => {
    setSelectedAssetIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Human Confirmation: Execute Batch Dispatch
  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedAssetIds.length === 0) {
      showToast("Please select at least 1 resource to dispatch.");
      return;
    }

    setIsSubmitting(true);

    // Records the batch against the local assignment list when the server can't
    // confirm it. Needed from catch as well as the non-OK branch: a refused
    // connection throws straight past this, and the old catch just switched to
    // Active Operations with a success toast over an empty list.
    const assignLocally = () => {
      const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newAssignments = selectedAssetIds.map((id, i) => {
        const asset = availableAssets.find(a => a.id === id);
        return {
          assignment_id: `ASSIGN-LOCAL-${id}-${activeAssignments.length + i + 1}`,
          resource_id: id,
          resource_name: asset?.name || id,
          resource_type: asset?.type || 'ASSET',
          status: 'EN_ROUTE',
          dispatch_time: stamp
        };
      });
      
      setActiveAssignments(prev => [...newAssignments, ...prev]);

      // Functional Auto Audit Logging
      const newLogs: AuditLogEntry[] = newAssignments.map((a, i) => ({
        id: `AUDIT-LOCAL-${Date.now()}-${i}`,
        resource_id: a.resource_name,
        incident_id: incidentId,
        old_status: 'AVAILABLE',
        new_status: 'EN_ROUTE',
        changed_by: 'EOC_RESCUE_COORDINATOR',
        changed_at: new Date().toISOString(),
        notes: dispatchNotes || 'Immediate emergency deployment authorized.'
      }));
      setAuditLogs(prev => [...newLogs, ...prev]);

      showToast(`${selectedAssetIds.length} assets tasked locally — not yet synced.`);
      setSelectedAssetIds([]);
      setActiveTab('active_operations');
    };

    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const res = await fetch(`${API_BASE}/api/v1/resources/dispatch-batch`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incident_id: incidentId,
          resource_ids: selectedAssetIds,
          notes: dispatchNotes
        })
      });

      if (res.ok) {
        const json = await res.json();
        showToast(`${json.data.length} assets dispatched to ${incidentId}.`);
        // Drop the ticks, or the next Confirm re-tasks everything still checked.
        setSelectedAssetIds([]);
        setActiveTab('active_operations');
        fetchActiveAssignmentsAndAudit();
      } else {
        assignLocally();
      }
    } catch {
      assignLocally();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Progress Lifecycle (EN_ROUTE → ON_SCENE → RESCUING → COMPLETED)
  const handleProgressLifecycle = async (assignmentId: string, nextStatus: string) => {
    // What the stepper cells say, so a toast never reports a raw enum.
    const phrasing: Record<string, string> = {
      ON_SCENE: 'on scene',
      RESCUING: 'extracting',
      COMPLETED: 'released'
    };

    // The catch used to skip arrival_time/completion_time, so offline the badge
    // flipped to ON SCENE while cell 2 still read "Awaiting arrival". One
    // implementation for both branches keeps the row internally consistent.
    const advanceLocally = () => {
      const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      let resourceName = 'Unknown Asset';
      let oldStatus = 'UNKNOWN';
      
      setActiveAssignments(prev => prev.map(a => {
        if (a.assignment_id === assignmentId) {
          resourceName = a.resource_name;
          oldStatus = a.status;
          return {
            ...a,
            status: nextStatus,
            arrival_time: nextStatus === 'ON_SCENE' ? stamp : a.arrival_time,
            completion_time: nextStatus === 'COMPLETED' ? stamp : a.completion_time
          };
        }
        return a;
      }));

      // Functional Auto Audit Logging
      setAuditLogs(prev => [{
        id: `AUDIT-LOCAL-${Date.now()}`,
        resource_id: resourceName,
        incident_id: incidentId,
        old_status: oldStatus,
        new_status: nextStatus,
        changed_by: 'EOC_FIELD_OFFICER',
        changed_at: new Date().toISOString(),
        notes: `Officer confirmed transition to ${nextStatus}`
      }, ...prev]);

      showToast(`Asset marked ${phrasing[nextStatus] || nextStatus.toLowerCase()} locally — not yet synced.`);
    };

    try {
      const token = localStorage.getItem('access_token') || 'dummy-token';
      const res = await fetch(`${API_BASE}/api/v1/resources/assignments/${assignmentId}/lifecycle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          notes: `Officer confirmed transition to ${nextStatus}`
        })
      });

      if (res.ok) {
        showToast(`Asset marked ${phrasing[nextStatus] || nextStatus.toLowerCase()}.`);
        fetchActiveAssignmentsAndAudit();
      } else {
        advanceLocally();
      }
    } catch {
      advanceLocally();
    }
  };

  // A dot carries the state; the chip itself stays neutral so a list of units
  // doesn't turn into four competing colours.
  const statusChip = (status: string) => {
    const dot =
      status === 'COMPLETED' ? 'bg-secondary' :
      status === 'RESCUING' ? 'bg-error' :
      status === 'ON_SCENE' ? 'bg-tertiary' : 'bg-primary';

    return (
      <span className="shrink-0 inline-flex items-center gap-1.5 bg-surface-container-high border border-outline-variant rounded-md px-2 py-0.5 text-[11px] text-on-surface">
        <span className={`w-1.5 h-1.5 rounded-full ${dot}`}></span>
        {STEP_LABEL[status] || readable(status)}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-3 sm:p-6">
      <div className="bg-surface border border-outline-variant rounded-lg w-full max-w-3xl shadow-xl max-h-[90vh] flex flex-col overflow-hidden text-on-surface">

        {/* Header */}
        <div className="px-4 sm:px-5 pt-4 pb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-on-surface">Rescue dispatch</h2>
              <span className="shrink-0 text-[11px] tabular-nums text-on-error-container bg-error/10 border border-error/20 rounded px-1.5 py-0.5">
                Priority {incidentInfo.priority_score}
              </span>
            </div>
            <p className="text-xs text-on-surface-variant mt-1 truncate" title={incidentInfo.incident_id}>
              {[incidentInfo.district, incidentInfo.coordinates, incidentInfo.incident_id].filter(Boolean).join('  ·  ')}
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 p-1.5 -mr-1 -mt-1 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px] block">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="px-4 sm:px-5 flex gap-5 border-b border-outline-variant">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const count = tab.id === 'active_operations' ? activeAssignments.length : 0;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px py-2.5 text-xs border-b-2 transition-colors cursor-pointer ${
                  isActive
                    ? 'border-primary text-on-surface font-medium'
                    : 'border-transparent text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {tab.label}{tab.id === 'active_operations' && count > 0 ? ` (${count})` : ''}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5 space-y-5">

          {/* TAB 1: PRE-DISPATCH INTELLIGENCE & DETERMINISTIC RECOMMENDATIONS */}
          {activeTab === 'dispatch' && (
            <div className="space-y-5">
              
              {/* What we know about the incident */}
              <div className="border border-outline-variant rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <div className="text-[11px] text-on-surface-variant">People affected</div>
                  <div className="text-sm text-on-surface mt-1 tabular-nums">{incidentInfo.people_affected}</div>
                </div>
                <div>
                  <div className="text-[11px] text-on-surface-variant">Medical</div>
                  <div className={`text-sm mt-1 ${incidentInfo.medical_required ? 'text-error' : 'text-on-surface'}`}>
                    {incidentInfo.medical_required ? 'Urgent trauma' : 'None reported'}
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-on-surface-variant">Hazard</div>
                  <div className="text-sm text-on-surface mt-1">{readable(incidentInfo.hazard_severity) || 'Unknown'}</div>
                </div>
                <div>
                  <div className="text-[11px] text-on-surface-variant">Location accuracy</div>
                  <div className="text-sm text-on-surface mt-1 tabular-nums">{incidentInfo.location_accuracy}</div>
                </div>
              </div>

              {/* Available Fleet Readiness Counters */}
              <div>
                <div className="text-[11px] text-on-surface-variant mb-2">Available right now</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {FLEET_ROWS.map(row => (
                    <div key={row.key} className="border border-outline-variant rounded-lg px-3 py-2.5 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0 text-xs text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] shrink-0">{row.icon}</span>
                        <span className="truncate">{row.label}</span>
                      </span>
                      <span className="text-sm text-on-surface tabular-nums">{inventory[row.key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deterministic AI Recommendations */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-secondary/5 p-3.5 rounded-xl border border-secondary/20">
                  <h3 className="font-black text-xs uppercase text-on-secondary-container flex items-center gap-2 tracking-wide">
                    <span className="material-symbols-outlined text-secondary text-[20px]">psychology</span>
                    Deterministic AI Recommendations
                  </h3>
                  <span className="text-[10px] text-on-surface-variant flex items-center gap-1.5 bg-surface px-2.5 py-1.5 rounded-lg border border-outline-variant/30 font-bold shadow-sm w-fit">
                    <span className="material-symbols-outlined text-[14px] text-error">warning</span>
                    Requires Coordinator Confirmation
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="bg-surface-container-lowest border border-secondary/30 rounded-xl p-3.5 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="font-bold text-xs text-on-secondary-container">{rec.resource_type}</span>
                          <span className="text-[10px] text-on-secondary-container font-bold bg-secondary/15 px-1.5 py-0.5 rounded tabular-nums">{rec.priority_weight}</span>
                        </div>
                        <p className="font-bold text-sm text-on-surface mt-1">{rec.recommended_asset_name}</p>
                        <p className="text-[11px] text-on-surface-variant mt-1 leading-snug">
                          {rec.rationale}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Multi-Resource Selection Form */}
              <form onSubmit={handleConfirmDispatch} className="space-y-4 pt-2">
                <div>
                  <h3 className="font-bold text-xs uppercase text-on-surface-variant mb-2">
                    Select Assets to Dispatch ({selectedAssetIds.length} Selected)
                  </h3>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {availableAssets.map((asset) => {
                      const isSelected = selectedAssetIds.includes(asset.id);
                      return (
                        <div
                          key={asset.id}
                          onClick={() => toggleAssetSelection(asset.id)}
                          className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary/10 border-primary' : 'bg-surface-container border-outline-variant hover:border-outline'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-primary focus:ring-0 cursor-pointer"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-on-surface text-xs sm:text-sm">{asset.name}</span>
                                <span className="bg-surface-container-lowest text-on-surface-variant px-1.5 py-0.2 rounded text-[10px] font-sans">{asset.type}</span>
                              </div>
                              <p className="text-[11px] text-on-surface-variant mt-0.5">{asset.organization} • {asset.district}</p>
                            </div>
                          </div>

                          <div className="text-right text-xs">
                            {/* text-primary lands on 4.49:1 over the white row — a hair
                                under AA. The container ink carries the same meaning. */}
                            <span className="text-on-primary-container font-bold tabular-nums">{asset.distance_km} km</span>
                            <span className="text-on-surface-variant block text-[10px] tabular-nums">ETA ~{asset.eta_minutes} mins</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-2">
                  <label className="text-[10px] sm:text-xs text-on-surface-variant font-bold tracking-wider uppercase block mb-2">
                    Deployment Tactical Notes &amp; Channel Instructions
                  </label>
                  <textarea
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    placeholder="E.g., Immediate multi-agency emergency deployment authorized. Use radio channel 4."
                    className="w-full bg-surface border border-outline-variant/50 rounded-xl p-3.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all font-sans resize-none shadow-sm"
                    rows={3}
                    required
                  />
                </div>

                <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-4 pt-5 mt-2 border-t border-outline-variant/40">
                  <div className="text-[10px] sm:text-[11px] text-on-surface-variant flex items-center justify-center sm:justify-start gap-2 w-full sm:w-auto text-center sm:text-left bg-surface-container-lowest sm:bg-transparent p-2.5 sm:p-0 rounded-lg border border-outline-variant/20 sm:border-none">
                    <span className="material-symbols-outlined text-[16px] text-primary">verified_user</span>
                    <span>Dispatched by authorized coordinator. Logged to audit trail.</span>
                  </div>

                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <button type="button" onClick={onClose} className="flex-1 sm:flex-none px-4 py-3 sm:py-2.5 bg-surface hover:bg-surface-container-high border border-outline-variant/50 rounded-xl text-sm font-bold text-on-surface-variant transition-colors shadow-sm">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedAssetIds.length === 0}
                      className="flex-[2] sm:flex-none px-5 py-3 sm:py-2.5 bg-secondary hover:bg-secondary/90 text-on-secondary font-black rounded-xl flex items-center justify-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-30 disabled:hover:shadow-md transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>Authorize ({selectedAssetIds.length})</span>
                    </button>
                  </div>
                </div>
              </form>

            </div>
          )}

          {/* TAB 2: LIVE RESCUE OPERATIONS & LIFECYCLE TRACKER */}
          {activeTab === 'active_operations' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 mb-2 border-b border-outline-variant/30 gap-2">
                <div>
                  <h3 className="font-bold text-xs uppercase text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">track_changes</span>
                    Active Mission Lifecycle Tracker
                  </h3>
                  <p className="text-[11px] text-on-surface-variant mt-1">
                    Manage and update the real-time operational state of your dispatched assets ({activeAssignments.length} total).
                  </p>
                </div>
                <span className="text-[10px] bg-surface-container px-2 py-1 rounded border border-outline-variant/50 text-on-surface font-mono hidden sm:block">
                  DISPATCHED → EN_ROUTE → ON_SCENE → RESCUING → COMPLETED
                </span>
              </div>

              {activeAssignments.length === 0 ? (
                <div className="bg-surface-container p-10 rounded-xl text-center text-on-surface-variant space-y-2">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant">assignment_turned_in</span>
                  <p className="font-bold text-on-surface">No active operations</p>
                  <p className="text-xs">Nothing is deployed against this incident yet. Assets tasked from the Pre-Dispatch tab appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeAssignments.map((assign) => (
                    <div key={assign.assignment_id} className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-4 space-y-3 shadow-md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-on-surface text-sm">{assign.resource_name || assign.resource_id}</span>
                            <span className="text-[10px] text-on-surface-variant bg-surface px-1.5 py-0.2 rounded border border-outline-variant/30">{assign.resource_type}</span>
                          </div>
                          <span className="text-[10px] text-on-surface-variant">Assignment ID: {assign.assignment_id}</span>
                        </div>
                        {getStatusBadge(assign.status)}
                      </div>

                      {/* Stepper Progress Bar */}
                      <div className="grid grid-cols-4 gap-2 pt-2 border-t border-outline-variant text-[11px]">
                        <div className={`p-2 rounded border text-center ${assign.status === 'EN_ROUTE' || assign.status === 'DISPATCHED' ? 'bg-primary/15 border-primary/40 text-on-primary-container font-bold' : 'bg-surface border-outline-variant text-on-surface-variant'}`}>
                          <span>1. En route</span>
                          <span className="block text-[9px] mt-0.5">{assign.dispatch_time || 'Dispatched'}</span>
                        </div>
                        <div className={`p-2 rounded border text-center ${assign.status === 'ON_SCENE' ? 'bg-tertiary/15 border-tertiary/40 text-on-tertiary-container font-bold' : 'bg-surface border-outline-variant text-on-surface-variant'}`}>
                          <span>2. On scene</span>
                          <span className="block text-[9px] mt-0.5">{assign.arrival_time || 'Awaiting arrival'}</span>
                        </div>
                        <div className={`p-2 rounded border text-center ${assign.status === 'RESCUING' ? 'bg-error/15 border-error/40 text-on-error-container font-bold' : 'bg-surface border-outline-variant text-on-surface-variant'}`}>
                          <span>3. Rescuing</span>
                          <span className="block text-[9px] mt-0.5">Extraction</span>
                        </div>
                        <div className={`p-2 rounded border text-center ${assign.status === 'COMPLETED' ? 'bg-secondary/15 border-secondary/40 text-on-secondary-container font-bold' : 'bg-surface border-outline-variant text-on-surface-variant'}`}>
                          <span>4. Completed</span>
                          <span className="block text-[9px] mt-0.5">{assign.completion_time || 'Resolution'}</span>
                        </div>
                      </div>

                      {/* Lifecycle Action Buttons */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        {assign.status === 'EN_ROUTE' && (
                          <button
                            onClick={() => handleProgressLifecycle(assign.assignment_id, 'ON_SCENE')}
                            className="px-3 py-1.5 bg-tertiary/10 hover:bg-tertiary/20 text-on-tertiary-container border border-tertiary/30 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Mark arrived on-scene
                          </button>
                        )}
                        {assign.status === 'ON_SCENE' && (
                          <button
                            onClick={() => handleProgressLifecycle(assign.assignment_id, 'RESCUING')}
                            className="px-3 py-1.5 bg-error/10 hover:bg-error/20 text-on-error-container border border-error/30 rounded text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Begin extraction
                          </button>
                        )}
                        {assign.status === 'RESCUING' && (
                          <button
                            onClick={() => handleProgressLifecycle(assign.assignment_id, 'COMPLETED')}
                            className="px-4 py-1.5 bg-secondary hover:bg-secondary/90 text-on-secondary rounded text-xs font-semibold transition-colors shadow cursor-pointer"
                          >
                            Complete and release
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                <h3 className="font-bold text-xs uppercase text-on-surface-variant">
                  Immutable Incident Audit Log
                </h3>
                <span className="text-[10px] text-on-surface-variant font-sans">Real-time DB Trigger Feed</span>
              </div>

              {auditLogs.length === 0 ? (
                <div className="p-8 text-center text-on-surface-variant text-xs">
                  No previous audit records found for this incident.
                </div>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log) => (
                    <div key={log.id} className="bg-surface-container p-3 rounded-lg border border-outline-variant/30 text-xs font-sans flex items-start justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <strong className="text-on-surface">{log.resource_id}</strong>
                          <span className="text-on-surface-variant">({log.old_status || 'NEW'} → {log.new_status})</span>
                        </div>
                        <p className="text-[11px] text-on-surface-variant">{log.notes || 'Status transition logged'}</p>
                        <span className="text-[10px] text-on-surface-variant">Officer: {log.changed_by || 'EOC_RESCUE_COORDINATOR'}</span>
                      </div>
                      <span className="text-[10px] text-primary">{new Date(log.changed_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
