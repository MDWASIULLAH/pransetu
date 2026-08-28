import React, { useState, useEffect } from 'react';
import { useEOC } from '../context/EOCContext';
import { RescueDispatchModal } from './dispatch/RescueDispatchModal';
import { API_BASE } from '../services/api';

interface Resource {
    id: string;
    name: string;
    type: string;
    status: string;
    verification_status: string;
    agency_type: string;
    registration_number?: string;
    organization: string;
    district: string;
    contact_person?: string;
    contact_phone?: string;
    contact_email?: string;
    attributes: any;
    is_multi_capacity: boolean;
    created_at?: string;
    rejection_reason?: string;
    /** Set on entries the operator created while the register API was unreachable. */
    pending_sync?: boolean;
}

interface Shelter {
    id: string;
    name: string;
    organization: string;
    district: string;
    capacity: number;
    current_occupancy: number;
    available_capacity?: number;
    occupancy_percentage?: number;
    pressure_indicator?: string;
    status: string;
    medical_capability: boolean;
    food_available: boolean;
    water_available: boolean;
    toilets: number;
    power: string;
    accessibility: string;
    contact_reference?: string;
    last_updated?: string;
}

interface ResourceMetrics {
    available_ambulances: number;
    dispatched_ambulances: number;
    available_rescue_teams: number;
    active_rescue_teams: number;
    available_boats: number;
    available_medical_teams: number;
}

export const Resources: React.FC = () => {
  const { showToast } = useEOC();

  // Active View Tab: 'fleet' | 'shelters' | 'verification'
  const [activeTab, setActiveTab] = useState<'fleet' | 'shelters' | 'verification'>('fleet');
  
  // Resource Modals
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  
  // Shelter Modals
  const [intakeModalOpen, setIntakeModalOpen] = useState(false);
  const [shelterStatusModalOpen, setShelterStatusModalOpen] = useState(false);
  const [createShelterModalOpen, setCreateShelterModalOpen] = useState(false);
  const [rescueDispatchModalOpen, setRescueDispatchModalOpen] = useState(false);
  
  // Selected State
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);
  const [targetIncidentId, setTargetIncidentId] = useState('INC-20260821-A3F2');
  const [rejectReason, setRejectReason] = useState('Missing official registration license or medical certification');
  
  // Intake Form
  const [displacedCount, setDisplacedCount] = useState<number>(25);
  const [intakeIncidentId, setIntakeIncidentId] = useState('INC-20260821-A3F2');
  
  // Shelter Status Update Form
  const [newShelterStatus, setNewShelterStatus] = useState<string>('OPEN');
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [agencyFilter, setAgencyFilter] = useState('ALL');
  const [shelterDistrictFilter, setShelterDistrictFilter] = useState('ALL');
  const [shelterStatusFilter, setShelterStatusFilter] = useState('ALL');

  // Resource Registration Form State
  const [regForm, setRegForm] = useState({
      name: '',
      type: 'AMBULANCE',
      agency_type: 'NGO',
      organization: '',
      registration_number: '',
      district: 'Puri',
      contact_person: '',
      contact_phone: '',
      contact_email: '',
      is_multi_capacity: false,
      oxygen_available: true,
      ventilator_available: false,
      team_size: 10,
      capacity: 2,
      quantity: 1000,
      unit: 'Pallets'
  });

  // New Shelter Form State
  const [newShelterForm, setNewShelterForm] = useState({
      name: '',
      organization: 'OSDMA',
      district: 'Puri',
      capacity: 500,
      medical_capability: true,
      food_available: true,
      water_available: true,
      toilets: 12,
      power: 'GENERATOR_SOLAR',
      accessibility: 'WHEELCHAIR_RAMP',
      contact_reference: '+91 94370 12345'
  });

  // Data State
  const [resources, setResources] = useState<Resource[]>([]);
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);
  const [shelterList, setShelterList] = useState<Shelter[]>([]);
  const [metrics, setMetrics] = useState<ResourceMetrics>({
      available_ambulances: 0, dispatched_ambulances: 0,
      available_rescue_teams: 0, active_rescue_teams: 0,
      available_boats: 0, available_medical_teams: 0
  });

  const fetchData = async () => {
      try {
          // ADDED: Fast-fail AbortController for local dev demo
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 800);
          
          const token = localStorage.getItem('access_token') || 'dummy-token';
          const headers = { 'Authorization': `Bearer ${token}` };
          const fetchOpts = { headers, signal: controller.signal };
          
          // 1. Fetch Verified Resources
          const res = await fetch(`${API_BASE}/api/v1/resources?verification_status=VERIFIED`, fetchOpts);
          if (res.ok) {
              const data = await res.json();
              setResources(data.data || []);
          }
          
          // 2. Fetch Pending Resources (Super Admin Queue)
          const pRes = await fetch(`${API_BASE}/api/v1/resources/pending`, fetchOpts);
          if (pRes.ok) {
              const pData = await pRes.json();
              setPendingResources(pData.data || []);
          }

          // 3. Fetch Real-time Shelters
          const sRes = await fetch(`${API_BASE}/api/v1/shelters/`, fetchOpts);
          if (sRes.ok) {
              const sData = await sRes.json();
              setShelterList(sData.data || []);
          }

          // 4. Fetch Metrics
          const mRes = await fetch(`${API_BASE}/api/v1/resources/metrics`, fetchOpts);
          if (mRes.ok) {
              const mData = await mRes.json();
              setMetrics(mData.data);
          }
          clearTimeout(timeoutId);
      } catch {
          setResources([]);
          setPendingResources([]);
          setShelterList([]);
          setMetrics({
              available_ambulances: 0, dispatched_ambulances: 0,
              available_rescue_teams: 0, active_rescue_teams: 0,
              available_boats: 0, available_medical_teams: 0
          });
      }
  };

  useEffect(() => {
      fetchData();
  }, []);

  // Handle Resource Registration Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      let dynamicAttributes: any = {};
      if (regForm.type === 'AMBULANCE') {
          dynamicAttributes = { oxygen_available: regForm.oxygen_available, ventilator_available: regForm.ventilator_available };
      } else if (regForm.type === 'RESCUE_TEAM') {
          dynamicAttributes = { team_size: regForm.team_size };
      } else if (regForm.type === 'FOOD_SUPPLY' || regForm.type === 'WATER_SUPPLY') {
          dynamicAttributes = { quantity: regForm.quantity, unit: regForm.unit };
      }

      const payload = {
          name: regForm.name,
          type: regForm.type,
          agency_type: regForm.agency_type,
          organization: regForm.organization,
          registration_number: regForm.registration_number,
          district: regForm.district,
          contact_person: regForm.contact_person,
          contact_phone: regForm.contact_phone,
          contact_email: regForm.contact_email,
          is_multi_capacity: regForm.is_multi_capacity,
          attributes: dynamicAttributes
      };

      // Hold the submission in the local queue when the register call can't reach
      // the server, and say so. Both failure paths need this: a refused connection
      // throws straight to catch, which used to just flash "Submitted to
      // verification queue." and bin everything the operator had typed.
      const queueLocally = () => {
          setPendingResources(prev => [{
              ...payload,
              id: `LOCAL-${prev.length + 1}`,
              status: 'UNAVAILABLE',
              verification_status: 'PENDING',
              created_at: new Date().toISOString(),
              pending_sync: true
          } as Resource, ...prev]);
          showToast(`${regForm.name} held locally — not yet synced to the register.`);
          setRegisterModalOpen(false);
      };

      try {
          const token = localStorage.getItem('access_token') || 'dummy-token';
          const res = await fetch(`${API_BASE}/api/v1/resources/register`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (res.ok) {
              showToast(`${regForm.name} registered — awaiting Super Admin verification.`);
              setRegisterModalOpen(false);
              fetchData();
          } else {
              queueLocally();
          }
      } catch {
          queueLocally();
      }
  };

  // Handle Create Shelter Submit
  const handleCreateShelterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      // Same story as the asset register: the local-mock insert used to live only
      // in the non-OK branch, which a refused connection never reaches, so an
      // offline shelter registration vanished behind a success toast.
      const addLocally = () => {
          const created: Shelter = {
              id: `SH-LOCAL-${newShelterForm.district.slice(0, 3).toUpperCase()}`,
              name: newShelterForm.name,
              organization: newShelterForm.organization,
              district: newShelterForm.district,
              capacity: Number(newShelterForm.capacity),
              current_occupancy: 0,
              available_capacity: Number(newShelterForm.capacity),
              occupancy_percentage: 0,
              status: 'OPEN',
              medical_capability: newShelterForm.medical_capability,
              food_available: newShelterForm.food_available,
              water_available: newShelterForm.water_available,
              toilets: newShelterForm.toilets,
              power: newShelterForm.power,
              accessibility: newShelterForm.accessibility,
              contact_reference: newShelterForm.contact_reference
          };
          setShelterList(prev => [created, ...prev]);
          showToast(`${created.name} added locally — not yet synced to the network.`);
          setCreateShelterModalOpen(false);
      };

      try {
          const token = localStorage.getItem('access_token') || 'dummy-token';
          const res = await fetch(`${API_BASE}/api/v1/shelters/`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify(newShelterForm)
          });
          if (res.ok) {
              showToast(`Shelter ${newShelterForm.name} registered.`);
              setCreateShelterModalOpen(false);
              fetchData();
          } else {
              addLocally();
          }
      } catch {
          addLocally();
      }
  };

  // Handle Displaced Persons Intake (Atomic capacity safety)
  const handleIntakeSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedShelter) return;
      
      const count = Number(displacedCount);
      const remaining = selectedShelter.capacity - selectedShelter.current_occupancy;
      
      // Strict UI Guard: Never allow occupancy > capacity
      if (count > remaining) {
          showToast(`Only ${remaining} beds free in ${selectedShelter.name} — can't admit ${count}.`);
          return;
      }

      // Applied whenever the server can't confirm the intake. Has to be reachable
      // from catch as well as the non-OK branch — offline, the old catch reported
      // "Evacuees successfully recorded" while the occupancy bar never moved.
      const applyLocally = () => {
          const newOcc = selectedShelter.current_occupancy + count;
          const newPct = Math.round((newOcc / selectedShelter.capacity) * 100);
          const newStatus = newOcc === selectedShelter.capacity ? 'FULL' : 'PARTIALLY_OCCUPIED';
          setShelterList(prev => prev.map(s => s.id === selectedShelter.id ? {
              ...s,
              current_occupancy: newOcc,
              available_capacity: s.capacity - newOcc,
              occupancy_percentage: newPct,
              status: newStatus
          } : s));
          // Say what the badge says. Echoing the raw PARTIALLY_OCCUPIED enum here
          // read as a contradiction next to a row badged "High Load (95%)".
          const label = newStatus === 'FULL' ? 'full' : newPct >= 80 ? `at high load (${newPct}%)` : `at partial load (${newPct}%)`;
          showToast(`${count} evacuees recorded locally — ${selectedShelter.name} is now ${label}, not yet synced.`);
          setIntakeModalOpen(false);
      };

      try {
          const token = localStorage.getItem('access_token') || 'dummy-token';
          const res = await fetch(`${API_BASE}/api/v1/shelters/${selectedShelter.id}/intake`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ displaced_count: count, incident_id: intakeIncidentId })
          });

          if (res.ok) {
              showToast(`Admitted ${count} evacuees into ${selectedShelter.name}.`);
              setIntakeModalOpen(false);
              fetchData();
          } else if (res.status === 409) {
              const err = await res.json().catch(() => ({ detail: 'shelter capacity conflict' }));
              showToast(`Intake rejected: ${err.detail}`);
          } else {
              applyLocally();
          }
      } catch {
          applyLocally();
      }
  };

  // Handle Shelter Status Update (Authorized Officer)
  const handleShelterStatusSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedShelter) return;
      try {
          const token = localStorage.getItem('access_token') || 'dummy-token';
          await fetch(`${API_BASE}/api/v1/shelters/${selectedShelter.id}/status`, {
              method: 'PATCH',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: newShelterStatus })
          });
          
          setShelterList(prev => prev.map(s => s.id === selectedShelter.id ? { ...s, status: newShelterStatus } : s));
          showToast(`Shelter ${selectedShelter.name} status updated to ${newShelterStatus}.`);
          setShelterStatusModalOpen(false);
      } catch {
          setShelterList(prev => prev.map(s => s.id === selectedShelter.id ? { ...s, status: newShelterStatus } : s));
          showToast(`Shelter status updated to ${newShelterStatus}.`);
          setShelterStatusModalOpen(false);
      }
  };

  // Handle Super Admin Verify & Activate
  const handleVerify = async (resourceId: string) => {
      const verifiedItem = pendingResources.find(p => p.id === resourceId);
      if (!verifiedItem) return;

      // Moves the asset out of the pending queue into the live pool locally.
      // Offline the old catch just said "Verification action processed." and the
      // row stayed in the queue — the operator had no idea it hadn't taken.
      const activateLocally = () => {
          setPendingResources(prev => prev.filter(p => p.id !== resourceId));
          setResources(prev => [{ ...verifiedItem, verification_status: 'VERIFIED', status: 'AVAILABLE' }, ...prev]);
          showToast(`${verifiedItem.name} activated locally — not yet synced.`);
      };

      try {
          const token = localStorage.getItem('access_token') || 'dummy-token';
          const res = await fetch(`${API_BASE}/api/v1/resources/${resourceId}/verify`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
          });

          if (res.ok) {
              showToast(`${verifiedItem.name} verified — now in the available pool.`);
              fetchData();
          } else {
              activateLocally();
          }
      } catch {
          activateLocally();
      }
  };

  // Handle Super Admin Rejection
  const handleRejectSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedResource) return;
      try {
          const token = localStorage.getItem('access_token') || 'dummy-token';
          await fetch(`${API_BASE}/api/v1/resources/${selectedResource.id}/reject`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: rejectReason })
          });
          
          setPendingResources(prev => prev.filter(p => p.id !== selectedResource.id));
          showToast(`Registration for ${selectedResource.name} rejected.`);
          setRejectModalOpen(false);
          setSelectedResource(null);
      } catch {
          setPendingResources(prev => prev.filter(p => p.id !== selectedResource.id));
          showToast(`Registration rejected.`);
          setRejectModalOpen(false);
      }
  };

  // Handle Rescue Coordinator Dispatch
  const handleDispatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResource) return;

    // Flips the unit's status locally when the dispatch call doesn't land.
    // Offline the old catch reported the unit dispatched but left it showing
    // AVAILABLE, so it could be tasked to a second incident.
    const markLocally = () => {
        setResources(prev => prev.map(r => r.id === selectedResource.id ? { ...r, status: r.type === 'AMBULANCE' ? 'DISPATCHED' : 'ASSIGNED' } : r));
        showToast(`${selectedResource.name} tasked to ${targetIncidentId} locally — not yet synced.`);
    };

    try {
        const token = localStorage.getItem('access_token') || 'dummy-token';
        const res = await fetch(`${API_BASE}/api/v1/resources/${selectedResource.id}/dispatch`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ incident_id: targetIncidentId })
        });

        if (res.ok) {
            showToast(`${selectedResource.name} dispatched to ${targetIncidentId}.`);
            fetchData();
        } else {
            markLocally();
        }
    } catch {
        markLocally();
    }
    setDispatchModalOpen(false);
    setSelectedResource(null);
  };

  // Filtered resources for active directory
  const filteredResources = resources.filter(res => {
      const matchType = typeFilter === 'ALL' || res.type === typeFilter;
      const matchAgency = agencyFilter === 'ALL' || res.agency_type === agencyFilter;
      return matchType && matchAgency;
  });

  // Filtered shelters
  const filteredShelters = shelterList.filter(s => {
      const matchDistrict = shelterDistrictFilter === 'ALL' || s.district === shelterDistrictFilter;
      const matchStatus = shelterStatusFilter === 'ALL' || s.status === shelterStatusFilter;
      return matchDistrict && matchStatus;
  });

  // Shelter Metrics
  const totalShelterCap = shelterList.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalShelterOcc = shelterList.reduce((acc, curr) => acc + curr.current_occupancy, 0);
  const overallShelterOccupancyPct = totalShelterCap > 0 ? Math.round((totalShelterOcc / totalShelterCap) * 100) : 0;
  const highPressureShelterCount = shelterList.filter(s => s.capacity > 0 && (s.current_occupancy / s.capacity) >= 0.8).length;

  const getAgencyBadge = (agency: string) => {
      switch (agency) {
          case 'GOVERNMENT': return <span className="bg-primary/10 text-on-primary-container border border-primary/20 px-2 py-0.5 rounded text-[10px] font-semibold">GOVT</span>;
          case 'NGO': return <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant px-2 py-0.5 rounded text-[10px] font-semibold">NGO</span>;
          case 'HOSPITAL': return <span className="bg-secondary/10 text-on-secondary-container border border-secondary/20 px-2 py-0.5 rounded text-[10px] font-semibold">HOSPITAL</span>;
          default: return <span className="bg-surface text-on-surface border border-outline-variant/50 px-2 py-0.5 rounded text-[10px] font-semibold">{agency}</span>;
      }
  };

  const getStatusBadge = (status: string) => {
      switch (status) {
          case 'AVAILABLE': return <span className="bg-secondary/10 text-on-secondary-container border border-secondary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>Available</span>;
          case 'DISPATCHED':
          case 'ASSIGNED': return <span className="bg-tertiary/10 text-on-tertiary-container border border-tertiary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary"></span>Dispatched</span>;
          case 'ON_SCENE':
          case 'RESCUING': return <span className="bg-error/10 text-on-error-container border border-error/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-error"></span>On Scene</span>;
          default: return <span className="bg-surface text-on-surface border border-outline-variant/50 px-2 py-0.5 rounded text-[10px] font-semibold">{status}</span>;
      }
  };

  const getShelterStatusBadge = (status: string, occPct: number) => {
      switch (status) {
          case 'OPEN':
              return <span className="bg-secondary/10 text-on-secondary-container border border-secondary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>Open</span>;
          case 'PARTIALLY_OCCUPIED':
              return occPct >= 80 ? (
                  <span className="bg-tertiary/10 text-on-tertiary-container border border-tertiary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-tertiary "></span>High Load ({Math.round(occPct)}%)</span>
              ) : (
                  <span className="bg-primary/10 text-on-primary-container border border-primary/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">Partial ({Math.round(occPct)}%)</span>
              );
          case 'FULL':
              return <span className="bg-error/10 text-on-error-container border border-error/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-error"></span>Full</span>;
          case 'DAMAGED':
              return <span className="bg-error/10 text-on-error-container border border-error/20 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">Damaged</span>;
          case 'CLOSED':
              return <span className="bg-surface text-on-surface-variant border border-outline-variant/30 px-2.5 py-0.5 rounded-full text-[10px] font-semibold">Closed</span>;
          default:
              return <span className="bg-surface text-on-surface border border-outline-variant/50 px-2 py-0.5 rounded text-[10px] font-semibold">{status}</span>;
      }
  };

  return (
    <div className="p-4 sm:p-6 bg-background text-on-surface min-h-screen w-full text-sm">
      
      {/* Rescue Dispatch Modal */}
      {rescueDispatchModalOpen && (
        <RescueDispatchModal
          incidentId={targetIncidentId || 'INC-2026-PURI-01'}
          onClose={() => setRescueDispatchModalOpen(false)}
        />
      )}

      {/* 1. Resource Registration Modal */}
      {registerModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl w-full max-w-2xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">app_registration</span>
                <div>
                    <h3 className="font-sans font-semibold font-bold text-on-surface text-base sm:text-lg">Register Emergency Asset</h3>
                    <p className="text-xs text-on-surface-variant">Government, NGO, Hospital &amp; Agency Resource Onboarding</p>
                </div>
              </div>
              <button onClick={() => setRegisterModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRegisterSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1 font-medium">Agency Category</label>
                  <select 
                    value={regForm.agency_type}
                    onChange={(e) => setRegForm({ ...regForm, agency_type: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="GOVERNMENT">Government Authority (OSDMA / NDRF / Police)</option>
                    <option value="NGO">Non-Governmental Org (Red Cross / DFY)</option>
                    <option value="HOSPITAL">Hospital / Healthcare Facility</option>
                    <option value="ARMED_FORCES">Armed Forces / Coast Guard</option>
                    <option value="PRIVATE_PROVIDER">Authorized Private Contractor</option>
                  </select>
                </div>

                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1 font-medium">Organization Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Indian Red Cross Society, Puri"
                    value={regForm.organization}
                    onChange={(e) => setRegForm({ ...regForm, organization: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1 font-medium">Resource Title / Call Sign</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. ALS Trauma Ambulance Unit 04"
                    value={regForm.name}
                    onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1 font-medium">Resource Category</label>
                  <select 
                    value={regForm.type}
                    onChange={(e) => setRegForm({ ...regForm, type: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-on-surface text-xs sm:text-sm focus:outline-none focus:border-primary"
                  >
                    <option value="AMBULANCE">Ambulance (ALS / BLS)</option>
                    <option value="RESCUE_TEAM">Rescue Team (NDRF/SDRF)</option>
                    <option value="BOAT">Rescue Boat / Inflatable</option>
                    <option value="MEDICAL_TEAM">Medical Emergency Team</option>
                    <option value="FOOD_SUPPLY">Food / Ration Supplies</option>
                    <option value="WATER_SUPPLY">Drinking Water Tanker</option>
                    <option value="RESCUE_VEHICLE">Special Terrain Vehicle</option>
                    <option value="EMERGENCY_KIT">Emergency Trauma Kits</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-outline-variant">
                <div className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px] text-tertiary">shield_lock</span>
                  <span>Requires Super Admin verification before active dispatch.</span>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setRegisterModalOpen(false)} className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded text-xs">Cancel</button>
                  <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded flex items-center gap-2 text-xs shadow-md">
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    Submit for Verification
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Displaced Persons Intake Modal (Atomic Capacity Safety) */}
      {intakeModalOpen && selectedShelter && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">person_add</span>
                <h3 className="font-sans font-semibold font-bold text-on-surface">Admit Displaced Persons</h3>
              </div>
              <button onClick={() => setIntakeModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleIntakeSubmit} className="mt-4 space-y-4">
              <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-on-surface">{selectedShelter.name}</span>
                  {getShelterStatusBadge(selectedShelter.status, (selectedShelter.current_occupancy / selectedShelter.capacity) * 100)}
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant font-sans">
                  <span>Current: <strong>{selectedShelter.current_occupancy}</strong></span>
                  <span>Capacity: <strong>{selectedShelter.capacity}</strong></span>
                  <span className="text-secondary font-bold">Free: <strong>{selectedShelter.capacity - selectedShelter.current_occupancy}</strong></span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${(selectedShelter.current_occupancy / selectedShelter.capacity) >= 0.8 ? 'bg-tertiary' : 'bg-secondary'}`} 
                    style={{ width: `${(selectedShelter.current_occupancy / selectedShelter.capacity) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1 font-medium">Displaced Persons Count to Admit</label>
                <input 
                  type="number"
                  min={1}
                  max={selectedShelter.capacity - selectedShelter.current_occupancy}
                  value={displacedCount}
                  onChange={(e) => setDisplacedCount(Number(e.target.value))}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-on-surface font-sans text-sm focus:outline-none focus:border-primary"
                  required
                />
                <span className="text-[11px] text-on-surface-variant mt-1 block">
                  Max available beds: <strong>{selectedShelter.capacity - selectedShelter.current_occupancy}</strong>
                </span>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1 font-medium">Associated Disaster / SOS Cluster ID</label>
                <input 
                  type="text"
                  value={intakeIncidentId}
                  onChange={(e) => setIntakeIncidentId(e.target.value)}
                  placeholder="INC-20260821-..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-on-surface font-sans text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 bg-primary/10 border border-primary/20 rounded text-[11px] text-on-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">verified</span>
                <span>Enforces strict database invariant (Occupancy ≤ Capacity). Overbooking is blocked.</span>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
                <button type="button" onClick={() => setIntakeModalOpen(false)} className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded flex items-center gap-2 text-xs shadow-md">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Confirm Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Update Shelter Status Modal (Authorized Officer) */}
      {shelterStatusModalOpen && selectedShelter && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined">edit_square</span>
                <h3 className="font-sans font-semibold font-bold text-on-surface">Update Shelter Status</h3>
              </div>
              <button onClick={() => setShelterStatusModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleShelterStatusSubmit} className="mt-4 space-y-4">
              <p className="text-xs text-on-surface-variant">
                Modify operational readiness for <strong className="text-on-surface">{selectedShelter.name}</strong> ({selectedShelter.district}).
              </p>
              <div>
                <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Operational Status</label>
                <select 
                  value={newShelterStatus}
                  onChange={(e) => setNewShelterStatus(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="OPEN">OPEN (Operational &amp; Accepting Evacuees)</option>
                  <option value="PARTIALLY_OCCUPIED">PARTIALLY OCCUPIED</option>
                  <option value="FULL">FULL (At Capacity Limit)</option>
                  <option value="DAMAGED">DAMAGED (Structural Failure / Inaccessible)</option>
                  <option value="CLOSED">CLOSED (Deactivated)</option>
                  <option value="UNVERIFIED">UNVERIFIED (Awaiting Structural Inspection)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShelterStatusModalOpen(false)} className="px-3 py-1.5 bg-surface-container border border-outline-variant/30 rounded text-xs">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded flex items-center gap-1.5 text-xs shadow-md">
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Register New Shelter Modal */}
      {createShelterModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl w-full max-w-xl shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">houseboat</span>
                <h3 className="font-sans font-semibold font-bold text-on-surface">Register Cyclone / Flood Shelter</h3>
              </div>
              <button onClick={() => setCreateShelterModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateShelterSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Shelter Name</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Astaranga High School Cyclone Shelter"
                    value={newShelterForm.name}
                    onChange={(e) => setNewShelterForm({ ...newShelterForm, name: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">District</label>
                  <select 
                    value={newShelterForm.district}
                    onChange={(e) => setNewShelterForm({ ...newShelterForm, district: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface"
                  >
                    <option value="Puri">Puri</option>
                    <option value="Cuttack">Cuttack</option>
                    <option value="Bhadrak">Bhadrak</option>
                    <option value="Balasore">Balasore</option>
                    <option value="Ganjam">Ganjam</option>
                    <option value="Kendrapara">Kendrapara</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Total Bed Capacity</label>
                  <input 
                    type="number"
                    min={50}
                    required
                    value={newShelterForm.capacity}
                    onChange={(e) => setNewShelterForm({ ...newShelterForm, capacity: Number(e.target.value) })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface font-sans"
                  />
                </div>
                <div>
                  <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Emergency Contact</label>
                  <input 
                    type="text"
                    required
                    placeholder="+91 94370 00000"
                    value={newShelterForm.contact_reference}
                    onChange={(e) => setNewShelterForm({ ...newShelterForm, contact_reference: e.target.value })}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface"
                  />
                </div>
              </div>

              <div className="p-3 bg-surface-container-lowest rounded-lg border border-outline-variant/30 grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newShelterForm.medical_capability}
                    onChange={(e) => setNewShelterForm({ ...newShelterForm, medical_capability: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span>Medical First Aid Post</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newShelterForm.food_available}
                    onChange={(e) => setNewShelterForm({ ...newShelterForm, food_available: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span>Dry Ration Supplies</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={newShelterForm.water_available}
                    onChange={(e) => setNewShelterForm({ ...newShelterForm, water_available: e.target.checked })}
                    className="rounded text-primary"
                  />
                  <span>Potable Water Tanker</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
                <button type="button" onClick={() => setCreateShelterModalOpen(false)} className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded text-xs shadow-md">
                  Register Shelter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Dispatch Modal */}
      {dispatchModalOpen && selectedResource && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl w-full max-w-lg shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">local_shipping</span>
                <h3 className="font-sans font-semibold font-bold text-on-surface">Authorize &amp; Dispatch Asset</h3>
              </div>
              <button onClick={() => setDispatchModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="mt-4 space-y-4">
              <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-on-surface text-base">{selectedResource.name}</p>
                    {getAgencyBadge(selectedResource.agency_type)}
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{selectedResource.organization} • {selectedResource.district}</p>
              </div>

              <div>
                <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Target Incident ID</label>
                <input 
                  type="text"
                  value={targetIncidentId}
                  onChange={(e) => setTargetIncidentId(e.target.value)}
                  placeholder="INC-20260821-..."
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-on-surface font-sans text-xs focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-outline-variant">
                <button type="button" onClick={() => setDispatchModalOpen(false)} className="px-4 py-2 bg-surface-container border border-outline-variant/30 rounded text-xs">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded flex items-center gap-2 text-xs shadow-md">
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Rejection Modal */}
      {rejectModalOpen && selectedResource && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl w-full max-w-md shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant text-error">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined">cancel</span>
                <h3 className="font-sans font-semibold font-bold text-on-surface">Reject Registration</h3>
              </div>
              <button onClick={() => setRejectModalOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleRejectSubmit} className="mt-4 space-y-4">
              <div>
                <label className="font-sans text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">Reason for Rejection</label>
                <textarea 
                  rows={3}
                  required
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2 text-xs text-on-surface focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setRejectModalOpen(false)} className="px-3 py-1.5 bg-surface-container border border-outline-variant/30 rounded text-xs">Cancel</button>
                <button type="submit" className="px-4 py-1.5 bg-error text-on-error font-bold rounded text-xs">
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header & Main Tabs */}
      <header className="flex flex-col md:flex-row md:items-start justify-between mb-6 gap-4 border-b border-outline-variant/30 pb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Shelters &amp; Resource Operations</h1>
            <span className="bg-primary/10 text-on-primary-container border border-primary/20 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shadow-sm">
              EOC Hub
            </span>
          </div>
          <p className="text-on-surface-variant text-sm font-medium mt-1 max-w-2xl leading-relaxed">
            Real-time Shelter Network Capacities, Evacuee Intake, Asset Verification, and Concurrency-Safe Dispatch.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Main Module Tabs */}
          <div className="flex bg-surface border border-outline-variant/30 p-1 rounded-xl shadow-sm">
            <button
              onClick={() => setActiveTab('fleet')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'fleet'
                  ? 'bg-primary/10 text-on-primary-container shadow-sm border border-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">local_shipping</span>
              Fleet &amp; Assets ({resources.length})
            </button>
            <button
              onClick={() => setActiveTab('shelters')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                activeTab === 'shelters'
                  ? 'bg-primary/10 text-on-primary-container shadow-sm border border-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">houseboat</span>
              Shelter Network ({shelterList.length})
            </button>
            <button
              onClick={() => setActiveTab('verification')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors relative ${
                activeTab === 'verification'
                  ? 'bg-primary/10 text-on-primary-container shadow-sm border border-primary/20'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">verified</span>
              Super Admin Queue
              {pendingResources.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-error text-on-error rounded-full text-[10px] font-bold">
                  {pendingResources.length}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'shelters' ? (
            <button 
              onClick={() => setCreateShelterModalOpen(true)}
              className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_home</span>
              Add Shelter
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setRescueDispatchModalOpen(true)}
                className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                Tactical Dispatch
              </button>
              <button 
                onClick={() => setRegisterModalOpen(true)}
                className="bg-surface hover:bg-surface-container border border-outline-variant/50 text-on-surface px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Register Asset
              </button>
            </div>
          )}
        </div>
      </header>

      {/* TAB 1: Shelters & Evacuation Facilities */}
      {activeTab === 'shelters' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Top Shelter Telemetry HUD */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface border border-outline-variant/30 p-4 rounded-xl shadow-sm">
              <span className="text-on-surface-variant text-[11px] uppercase font-medium">Total Capacity</span>
              <div className="text-xl sm:text-3xl font-bold text-on-surface mt-1 font-sans">{totalShelterCap.toLocaleString()} Beds</div>
              <span className="text-xs text-on-surface-variant font-medium">Across {shelterList.length} Facilities</span>
            </div>

            <div className="bg-surface border border-outline-variant/30 p-4 rounded-xl shadow-sm">
              <span className="text-on-surface-variant text-[11px] uppercase font-medium">Current Occupancy</span>
              <div className="text-xl sm:text-3xl font-bold text-tertiary mt-1 font-sans">{totalShelterOcc.toLocaleString()} Evacuees</div>
              <span className="text-xs text-tertiary font-medium">{overallShelterOccupancyPct}% Overall Load</span>
            </div>

            <div className="bg-surface border border-outline-variant/30 p-4 rounded-xl shadow-sm">
              <span className="text-on-surface-variant text-[11px] uppercase font-medium">Available Space</span>
              <div className="text-xl sm:text-3xl font-bold text-secondary mt-1 font-sans">{(totalShelterCap - totalShelterOcc).toLocaleString()} Free</div>
              <span className="text-xs text-secondary font-medium">Guaranteed Non-Overbooked</span>
            </div>

            <div className="bg-surface border border-outline-variant/30 p-4 rounded-xl shadow-sm">
              <span className="text-on-surface-variant text-[11px] uppercase font-medium">Pressure Warning</span>
              <div className="text-xl sm:text-3xl font-bold text-error mt-1 font-sans">{highPressureShelterCount} Facilities</div>
              <span className="text-xs text-error font-medium">≥80% Occupancy Pressure</span>
            </div>
          </div>

          {/* Shelter Directory Table */}
          <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-outline-variant/30 bg-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">holiday_village</span>
                <span className="font-bold text-on-surface text-sm">Disaster Evacuation Shelter Network</span>
              </div>

              <div className="flex items-center gap-2">
                <select 
                  value={shelterDistrictFilter}
                  onChange={(e) => setShelterDistrictFilter(e.target.value)}
                  className="bg-surface border border-outline-variant/30 text-on-surface rounded px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="ALL">All Districts</option>
                  <option value="Puri">Puri</option>
                  <option value="Bhadrak">Bhadrak</option>
                  <option value="Balasore">Balasore</option>
                  <option value="Ganjam">Ganjam</option>
                </select>

                <select 
                  value={shelterStatusFilter}
                  onChange={(e) => setShelterStatusFilter(e.target.value)}
                  className="bg-surface border border-outline-variant/30 text-on-surface rounded px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">OPEN</option>
                  <option value="PARTIALLY_OCCUPIED">PARTIALLY OCCUPIED</option>
                  <option value="FULL">FULL</option>
                  <option value="DAMAGED">DAMAGED</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-lowest sticky top-0 border-b border-outline-variant/30 text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant">
                  <tr>
                    <th className="p-3.5 font-medium">Shelter Name &amp; District</th>
                    <th className="p-3.5 font-medium">Capacity &amp; Load</th>
                    <th className="p-3.5 font-medium">Status</th>
                    <th className="p-3.5 font-medium">Logistics &amp; Power</th>
                    <th className="p-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-outline-variant">
                  {filteredShelters.map((shelter) => {
                    const occPct = shelter.capacity > 0 ? (shelter.current_occupancy / shelter.capacity) * 100 : 0;
                    const freeSpace = Math.max(0, shelter.capacity - shelter.current_occupancy);
                    return (
                      <tr key={shelter.id} className="hover:bg-surface-container transition-colors">
                        <td className="p-3.5">
                          <div className="font-semibold text-on-surface text-sm">{shelter.name}</div>
                          <div className="text-[11px] text-on-surface-variant mt-0.5">
                            {shelter.district} • {shelter.organization} • Contact: {shelter.contact_reference}
                          </div>
                        </td>
                        <td className="p-3.5 min-w-[180px]">
                          <div className="flex justify-between text-[11px] font-sans mb-1">
                            <span>{shelter.current_occupancy} / {shelter.capacity} Beds</span>
                            <span className={occPct >= 80 ? 'text-tertiary font-bold' : 'text-secondary font-bold'}>
                              {freeSpace} Free
                            </span>
                          </div>
                          <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden border border-outline-variant/60">
                            <div 
                              className={`h-full ${occPct >= 100 ? 'bg-error' : occPct >= 80 ? 'bg-tertiary' : 'bg-secondary'}`} 
                              style={{ width: `${Math.min(100, occPct)}%` }}
                            ></div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          {getShelterStatusBadge(shelter.status, occPct)}
                        </td>
                        <td className="p-3.5 text-[11px] text-on-surface-variant space-y-0.5">
                          <div>Medical: <strong className={shelter.medical_capability ? 'text-secondary' : 'text-on-surface-variant'}>{shelter.medical_capability ? 'Post Active' : 'None'}</strong></div>
                          <div>Power: <strong>{shelter.power}</strong> | Toilets: <strong>{shelter.toilets}</strong></div>
                        </td>
                        <td className="p-3.5 text-right space-x-2">
                          <button
                            disabled={shelter.status === 'CLOSED' || shelter.status === 'DAMAGED' || freeSpace === 0}
                            onClick={() => { setSelectedShelter(shelter); setIntakeModalOpen(true); }}
                            className="bg-primary hover:bg-primary/90 text-on-primary px-2.5 py-1 rounded text-xs font-bold disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                          >
                            Admit Evacuees
                          </button>
                          <button
                            onClick={() => { setSelectedShelter(shelter); setNewShelterStatus(shelter.status); setShelterStatusModalOpen(true); }}
                            className="bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 text-on-surface px-2.5 py-1 rounded text-xs font-medium transition-colors"
                          >
                            Status
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredShelters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <p className="text-sm text-on-surface">No shelters match these filters</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          {shelterList.length} in the network, none in {shelterDistrictFilter === 'ALL' ? 'any district' : shelterDistrictFilter} with status {shelterStatusFilter === 'ALL' ? 'any' : shelterStatusFilter}.
                        </p>
                        <button
                          onClick={() => { setShelterDistrictFilter('ALL'); setShelterStatusFilter('ALL'); }}
                          className="mt-3 text-xs text-on-primary-container bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1 rounded transition-colors cursor-pointer"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Super Admin Verification Queue */}
      {activeTab === 'verification' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-surface border border-outline-variant/30 p-5 rounded-xl flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-on-tertiary-container">
                <span className="material-symbols-outlined text-[26px]">gavel</span>
              </div>
              <div>
                <h2 className="font-sans text-lg font-semibold text-on-surface">Super Admin Verification Gateway</h2>
                <p className="text-sm text-on-surface-variant">Review credentialed submissions from Government authorities, NGOs, and Hospitals before releasing into live dispatch.</p>
              </div>
            </div>
            <div className="bg-surface-container-low px-4 py-2 rounded-lg border border-outline-variant/30 flex items-center gap-2 shadow-sm">
              <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Pending Audits:</span>
              <strong className="text-lg font-sans text-on-surface">{pendingResources.length}</strong>
            </div>
          </div>

          {pendingResources.length === 0 ? (
            <div className="bg-surface border border-outline-variant/30 rounded-xl p-12 text-center text-on-surface-variant space-y-2 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-secondary">check_circle</span>
              <p className="font-bold text-on-surface text-lg">All Submissions Verified</p>
              <p className="text-sm">There are currently zero pending resource registrations awaiting Super Admin review.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {pendingResources.map((item) => (
                <div key={item.id} className="bg-surface border border-outline-variant/30 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:shadow-md hover:border-outline-variant/50 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-on-surface text-base">{item.name}</h3>
                          {getAgencyBadge(item.agency_type)}
                        </div>
                        <p className="text-xs font-medium text-on-surface-variant">{item.organization} • {item.district}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="bg-tertiary/10 text-on-tertiary-container border border-tertiary/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider shadow-sm">
                          PENDING
                        </span>
                        {item.pending_sync && (
                          <span className="flex items-center gap-1 text-[10px] font-medium text-on-surface-variant">
                            <span className="material-symbols-outlined text-[12px]">cloud_off</span>
                            Local only
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="bg-surface-container-lowest p-4 rounded-lg border border-outline-variant/30 text-sm space-y-2.5">
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant font-medium">Category:</span>
                        <span className="font-sans text-on-surface font-semibold">{item.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant font-medium">License / Reg:</span>
                        <span className="font-sans text-on-surface font-semibold">{item.registration_number || 'Unspecified'}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-on-surface-variant font-medium">Contact Officer:</span>
                        <span className="font-sans text-on-surface">{item.contact_person || 'N/A'} ({item.contact_phone || 'N/A'})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t border-outline-variant/30">
                    <button 
                      onClick={() => { setSelectedResource(item); setRejectModalOpen(true); }}
                      className="px-4 py-2 bg-surface hover:bg-error/10 text-on-error-container border border-error/30 rounded-lg text-sm font-semibold transition-colors shadow-sm"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleVerify(item.id)}
                      className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">verified</span>
                      Verify &amp; Activate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Rescue Coordinator Live Fleet & Dispatch Directory */}
      {activeTab === 'fleet' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in">
          <section className="lg:col-span-8 bg-surface border border-outline-variant/30 rounded-xl overflow-hidden flex flex-col shadow-sm">
            <div className="p-5 border-b border-outline-variant/30 bg-surface flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">dataset</span>
                <span className="font-bold text-on-surface text-sm">Verified Operational Directory</span>
              </div>

              <div className="flex items-center gap-2">
                <select 
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-surface border border-outline-variant/30 text-on-surface rounded px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="ALL">All Categories</option>
                  <option value="AMBULANCE">Ambulances</option>
                  <option value="RESCUE_TEAM">Rescue Teams</option>
                  <option value="BOAT">Boats</option>
                  <option value="MEDICAL_TEAM">Medical Teams</option>
                  <option value="FOOD_SUPPLY">Food / Supplies</option>
                </select>

                <select 
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="bg-surface border border-outline-variant/30 text-on-surface rounded px-2.5 py-1 text-xs focus:outline-none"
                >
                  <option value="ALL">All Agencies</option>
                  <option value="GOVERNMENT">Government</option>
                  <option value="NGO">NGOs</option>
                  <option value="HOSPITAL">Hospitals</option>
                </select>
              </div>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-surface-container-lowest sticky top-0 border-b border-outline-variant/30 text-[11px] font-semibold tracking-wider uppercase text-on-surface-variant">
                  <tr>
                    <th className="p-3.5 font-medium">Resource &amp; Agency</th>
                    <th className="p-3.5 font-medium">Type</th>
                    <th className="p-3.5 font-medium">Status</th>
                    <th className="p-3.5 font-medium">District</th>
                    <th className="p-3.5 font-medium text-right">Dispatch</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-outline-variant">
                  {filteredResources.map((res) => (
                    <tr key={res.id} className="hover:bg-surface-container transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-on-surface text-xs sm:text-sm">{res.name}</span>
                          {getAgencyBadge(res.agency_type)}
                        </div>
                        <div className="text-[11px] text-on-surface-variant mt-0.5">{res.organization} • REG: {res.registration_number || 'N/A'}</div>
                      </td>
                      <td className="p-3.5 font-sans text-[11px] text-on-surface-variant font-medium">{res.type}</td>
                      <td className="p-3.5">{getStatusBadge(res.status)}</td>
                      <td className="p-3.5 text-on-surface">{res.district}</td>
                      <td className="p-3.5 text-right">
                        <button 
                          disabled={res.status !== 'AVAILABLE' && !res.is_multi_capacity}
                          onClick={() => { setSelectedResource(res); setDispatchModalOpen(true); }}
                          className="bg-primary/10 hover:bg-primary/20 text-on-primary-container border border-primary/20 px-3 py-1 rounded text-xs font-bold disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        >
                          Dispatch
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredResources.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-10 text-center">
                        <p className="text-sm text-on-surface">No resources match these filters</p>
                        <p className="text-[11px] text-on-surface-variant mt-1">
                          {resources.length} in the register, none of type {typeFilter === 'ALL' ? 'any' : typeFilter} from {agencyFilter === 'ALL' ? 'any agency' : agencyFilter}.
                        </p>
                        <button
                          onClick={() => { setTypeFilter('ALL'); setAgencyFilter('ALL'); }}
                          className="mt-3 text-xs text-on-primary-container bg-primary/10 hover:bg-primary/20 border border-primary/20 px-3 py-1 rounded transition-colors cursor-pointer"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Right 4 Cols: Real-Time Readiness Dashboard */}
          <section className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-surface border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
                <h2 className="font-sans font-semibold text-on-surface text-base flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary text-[22px]">network_check</span>
                  Real-Time Readiness
                </h2>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-1 bg-surface-container-low text-on-surface-variant border border-outline-variant/30 rounded-md shadow-sm">
                  LIVE TELEMETRY
                </span>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">ambulance</span>
                    ALS &amp; BLS Ambulances
                  </span>
                  <span className="font-sans text-on-surface font-bold">{metrics.available_ambulances + metrics.dispatched_ambulances} Total</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-container-low border border-outline-variant/30">
                  <div className="bg-tertiary" style={{ width: `${(metrics.dispatched_ambulances / Math.max(1, metrics.available_ambulances + metrics.dispatched_ambulances)) * 100}%` }} title="Dispatched"></div>
                  <div className="bg-secondary" style={{ width: `${(metrics.available_ambulances / Math.max(1, metrics.available_ambulances + metrics.dispatched_ambulances)) * 100}%` }} title="Available"></div>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant mt-1.5 font-medium">
                  <span>Dispatched: {metrics.dispatched_ambulances}</span>
                  <span className="text-secondary font-bold">Ready: {metrics.available_ambulances}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">groups</span>
                    NDRF / ODRAF Teams
                  </span>
                  <span className="font-sans text-on-surface font-bold">{metrics.available_rescue_teams + metrics.active_rescue_teams} Total</span>
                </div>
                <div className="flex h-2.5 rounded-full overflow-hidden bg-surface-container-low border border-outline-variant/30">
                  <div className="bg-tertiary" style={{ width: `${(metrics.active_rescue_teams / Math.max(1, metrics.available_rescue_teams + metrics.active_rescue_teams)) * 100}%` }} title="Active"></div>
                  <div className="bg-secondary" style={{ width: `${(metrics.available_rescue_teams / Math.max(1, metrics.available_rescue_teams + metrics.active_rescue_teams)) * 100}%` }} title="Available"></div>
                </div>
                <div className="flex justify-between text-xs text-on-surface-variant mt-1.5 font-medium">
                  <span>Active: {metrics.active_rescue_teams}</span>
                  <span className="text-secondary font-bold">Ready: {metrics.available_rescue_teams}</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px] text-primary">sailing</span>
                    Flood Rescue Boats
                  </span>
                  <span className="font-sans text-secondary font-bold">{metrics.available_boats} Ready</span>
                </div>
                <div className="w-full bg-surface-container-low h-2.5 rounded-full overflow-hidden border border-outline-variant/30">
                  <div className="bg-secondary h-full w-[85%]"></div>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
