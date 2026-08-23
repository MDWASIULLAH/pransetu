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
      setActiveAssignments(prev => {
        // Minted against the current queue depth, not the asset id alone. The same
        // asset can legitimately be tasked twice; keying on the id alone collided,
        // and since the lifecycle handler matches on assignment_id, advancing one
        // row also dragged the older — already completed — mission back to ON_SCENE.
        const newAssignments = selectedAssetIds.map((id, i) => {
          const asset = availableAssets.find(a => a.id === id);
          return {
            assignment_id: `ASSIGN-LOCAL-${id}-${prev.length + i + 1}`,
            resource_id: id,
            resource_name: asset?.name || id,
            resource_type: asset?.type || 'ASSET',
            status: 'EN_ROUTE',
            dispatch_time: new Date().toLocaleTimeString()
          };
        });
        return [...newAssignments, ...prev];
      });
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
      const stamp = new Date().toLocaleTimeString();
      setActiveAssignments(prev => prev.map(a => a.assignment_id === assignmentId ? {
        ...a,
        status: nextStatus,
        arrival_time: nextStatus === 'ON_SCENE' ? stamp : a.arrival_time,
        completion_time: nextStatus === 'COMPLETED' ? stamp : a.completion_time
      } : a));
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

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'DISPATCHED':
      case 'EN_ROUTE': return <span className="bg-primary/10 text-on-primary-container border border-primary/20 px-2 py-0.5 rounded text-[10px] font-bold">EN ROUTE</span>;
      case 'ON_SCENE': return <span className="bg-tertiary/10 text-on-tertiary-container border border-tertiary/20 px-2 py-0.5 rounded text-[10px] font-bold">ON SCENE</span>;
      case 'RESCUING': return <span className="bg-error/10 text-on-error-container border border-error/20 px-2 py-0.5 rounded text-[10px] font-bold">RESCUING</span>;
      case 'COMPLETED': return <span className="bg-secondary/10 text-on-secondary-container border border-secondary/20 px-2 py-0.5 rounded text-[10px] font-bold">COMPLETED</span>;
      default: return <span className="bg-surface-container-high text-on-surface-variant px-2 py-0.5 rounded text-[10px]">{st}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 animate-in fade-in">
      <div className="bg-surface border border-outline-variant/30 rounded-xl w-full max-w-4xl shadow-lg max-h-[92vh] flex flex-col overflow-hidden text-on-surface text-sm">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant bg-surface-container-lowest flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/15 border border-secondary/30 flex items-center justify-center text-on-secondary-container">
              <span className="material-symbols-outlined text-[24px]">rocket_launch</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-sans font-bold text-base sm:text-lg text-on-surface">Tactical Rescue Dispatch</h2>
                <span className="bg-error/15 text-on-error-container border border-error/30 px-2 py-0.5 rounded font-sans text-[10px] font-bold">
                  PRIORITY {incidentInfo.priority_score}/100
                </span>
              </div>
              <p className="text-xs text-on-surface-variant font-sans mt-0.5">
                Incident {incidentInfo.incident_id} • {incidentInfo.district} ({incidentInfo.coordinates})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Tabs */}
            <div className="flex bg-surface border border-outline-variant/30 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('dispatch')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'dispatch' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                1. Pre-Dispatch &amp; Recommendations
              </button>
              <button
                onClick={() => setActiveTab('active_operations')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'active_operations' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                2. Live Operations ({activeAssignments.length})
              </button>
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  activeTab === 'audit' ? 'bg-primary text-on-primary shadow' : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                3. Audit Trail
              </button>
            </div>

            <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">

          {/* TAB 1: PRE-DISPATCH INTELLIGENCE & DETERMINISTIC RECOMMENDATIONS */}
          {activeTab === 'dispatch' && (
            <div className="space-y-6 animate-in fade-in">
              
              {/* Pre-Dispatch Incident Intelligence Telemetry Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-surface-container-lowest p-3.5 rounded-xl border border-outline-variant/30 text-xs">
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Victims Affected</span>
                  <strong className="text-on-surface text-sm tabular-nums">{incidentInfo.people_affected} People</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Medical Requirement</span>
                  <strong className={incidentInfo.medical_required ? 'text-on-error-container text-sm' : 'text-on-surface-variant text-sm'}>
                    {incidentInfo.medical_required ? 'Urgent trauma' : 'None reported'}
                  </strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">Hazard Condition</span>
                  <strong className="text-on-tertiary-container text-sm">{incidentInfo.hazard_severity}</strong>
                </div>
                <div>
                  <span className="text-on-surface-variant block text-[10px] uppercase">GPS Confidence</span>
                  <strong className="text-on-secondary-container text-sm tabular-nums">{incidentInfo.location_accuracy}</strong>
                </div>
              </div>

              {/* Available Fleet Readiness Counters */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: 'ambulance', label: 'Ambulances', n: inventory.ambulances },
                  { icon: 'shield', label: 'NDRF Teams', n: inventory.rescue_teams },
                  { icon: 'directions_boat', label: 'Rescue Boats', n: inventory.boats },
                  { icon: 'medical_services', label: 'Medical Squads', n: inventory.medical_teams },
                ].map(c => (
                  <div key={c.label} className="bg-surface-container p-3 rounded-lg border border-outline-variant/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{c.icon}</span>
                      <span className="text-xs font-semibold">{c.label}</span>
                    </div>
                    <span className="font-semibold text-on-secondary-container tabular-nums">{c.n} Ready</span>
                  </div>
                ))}
              </div>

              {/* Deterministic AI Recommendations */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-secondary text-[16px]">psychology</span>
                    Deterministic AI Recommendations (Explainable Rules)
                  </h3>
                  <span className="text-[10px] text-on-tertiary-container flex items-center gap-1">
                    <span className="material-symbols-outlined text-[13px]">warning</span>
                    Requires coordinator confirmation
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

                <div>
                  <label className="text-xs text-on-surface-variant uppercase block mb-1 text-xs font-medium">Deployment Tactical Notes &amp; Channel Instructions</label>
                  <input
                    type="text"
                    value={dispatchNotes}
                    onChange={(e) => setDispatchNotes(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary font-sans"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                  <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-on-secondary-container">verified_user</span>
                    <span>Dispatched by an authorized rescue coordinator — logged to the audit trail.</span>
                  </span>

                  <div className="flex gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded text-xs">Cancel</button>
                    <button
                      type="submit"
                      disabled={isSubmitting || selectedAssetIds.length === 0}
                      className="px-6 py-2 bg-secondary hover:bg-secondary/90 text-on-secondary font-bold rounded-lg flex items-center gap-2 text-xs shadow-lg disabled:opacity-30 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      Confirm &amp; Authorize Dispatch ({selectedAssetIds.length})
                    </button>
                  </div>
                </div>
              </form>

            </div>
          )}

          {/* TAB 2: LIVE RESCUE OPERATIONS & LIFECYCLE TRACKER */}
          {activeTab === 'active_operations' && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                <h3 className="font-bold text-xs uppercase text-on-surface-variant">
                  Active Mission Lifecycle Tracker ({activeAssignments.length} Deployments)
                </h3>
                <span className="text-[11px] text-on-surface-variant">
                  State machine: DISPATCHED → EN_ROUTE → ON_SCENE → RESCUING → COMPLETED
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
