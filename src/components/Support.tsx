import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';

interface SupportTicket {
  id: string;
  category: string;
  subject: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  timestamp: string;
  reporter: string;
  details: string;
}

export const Support: React.FC = () => {
  const { showToast } = useEOC();

  const [activeTab, setActiveTab] = useState<'hotlines' | 'tickets' | 'frequencies' | 'sop' | 'diagnostics'>('hotlines');

  const [tickets, setTickets] = useState<SupportTicket[]>([
    {
      id: 'TCK-8812',
      category: 'Mesh Gateway',
      subject: 'Puri Beach Repeater Node #042 battery reporting 18% charge',
      priority: 'CRITICAL',
      status: 'IN_PROGRESS',
      timestamp: '10 mins ago',
      reporter: 'Insp. R. Nayak (NDRF Alpha)',
      details: 'Solar panel clouded by dense cyclone overcast. Requesting backup lithium power pack deployment.'
    },
    {
      id: 'TCK-8790',
      category: 'IVR Telephony',
      subject: 'PSTN PRI Trunk 04 packet jitter observed during bulk broadcast',
      priority: 'HIGH',
      status: 'RESOLVED',
      timestamp: '1 hour ago',
      reporter: 'System Watchdog',
      details: 'Automatic failover to secondary BSNL SIP gateway completed successfully. Latency normalized to 28ms.'
    },
    {
      id: 'TCK-8744',
      category: 'Logistics',
      subject: 'Gopalpur Shelter #04 diesel generator replenishment request',
      priority: 'MEDIUM',
      status: 'OPEN',
      timestamp: '2 hours ago',
      reporter: 'Shelter Officer K. Behera',
      details: 'Current reserve at 140 Liters (approx 16 hours operational runtime remaining).'
    }
  ]);

  const [ticketCategory, setTicketCategory] = useState('Mesh Gateway');
  const [ticketPriority, setTicketPriority] = useState<'CRITICAL' | 'HIGH' | 'MEDIUM'>('HIGH');
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDetails, setTicketDetails] = useState('');
  const [newTicketModal, setNewTicketModal] = useState(false);

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim()) return;

    const newTck: SupportTicket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      category: ticketCategory,
      subject: ticketSubject,
      priority: ticketPriority,
      status: 'OPEN',
      timestamp: 'Just now',
      reporter: 'Current EOC Operator',
      details: ticketDetails || 'No additional technical notes provided.'
    };

    setTickets([newTck, ...tickets]);
    setNewTicketModal(false);
    setTicketSubject('');
    setTicketDetails('');
    showToast(`Support Ticket ${newTck.id} registered and queued for Technical Response Team!`);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`Copied ${label}: ${text}`);
  };

  const emergencyContacts = [
    {
      agency: 'Odisha State Disaster Management Authority (OSDMA)',
      role: 'State Emergency Operations Center (SEOC)',
      phone: '1070',
      altPhone: '+91 94371 42567',
      location: 'Rajiv Bhawan, Bhubaneswar',
      icon: 'shield',
      status: '24x7 Active',
      statusColor: 'text-emerald-600'
    },
    {
      agency: 'National Disaster Response Force (NDRF)',
      role: '03rd Battalion Maritime Rescue Command',
      phone: '0671-2879711',
      altPhone: '+91 94379 65412',
      location: 'Mundali, Cuttack',
      icon: 'military_tech',
      status: 'Ready / Standby',
      statusColor: 'text-primary'
    },
    {
      agency: 'Odisha Disaster Rapid Action Force (ODRAF)',
      role: 'Coastal Quick Reaction Force',
      phone: '112',
      altPhone: '+91 94380 23114',
      location: 'State Reserve Police HQs',
      icon: 'local_fire_department',
      status: 'Deploying',
      statusColor: 'text-secondary'
    },
    {
      agency: 'Indian Coast Guard (ICG) District HQ 7',
      role: 'Maritime Search & Rescue Coordination',
      phone: '1554',
      altPhone: '+91 94372 88050',
      location: 'Paradip Port Base',
      icon: 'sailing',
      status: 'Patrol Active',
      statusColor: 'text-primary'
    },
    {
      agency: 'India Meteorological Department (IMD)',
      role: 'Cyclone Warning Centre Bhubaneswar',
      phone: '0674-2596116',
      altPhone: '+91 94373 59610',
      location: 'Airport Road, Bhubaneswar',
      icon: 'cyclone',
      status: 'Monitoring 24x7',
      statusColor: 'text-emerald-600'
    },
    {
      agency: 'Directorate of Public Health & EMS',
      role: 'Emergency Medical Logistics & Blood Banks',
      phone: '108',
      altPhone: '+91 94374 88104',
      location: 'Heads of Department Building',
      icon: 'medical_services',
      status: 'ALS Units Active',
      statusColor: 'text-emerald-600'
    }
  ];

  const frequencies = [
    {
      band: 'PRANSETU S LoRa Mesh Protocol',
      freq: '865.200 - 867.000 MHz',
      modulation: 'LoRa CSS (SF9, BW 125kHz, CR 4/5)',
      purpose: 'Citizen Offline Distress Relays & Multi-Hop Sensor Packets',
      coverage: 'Odisha Coastal Sector A & B'
    },
    {
      band: 'VHF Maritime Distress (Channel 16)',
      freq: '156.800 MHz (FM)',
      modulation: 'Analog FM Voice',
      purpose: 'International Maritime Search & Rescue Distress Channel',
      coverage: 'Bay of Bengal Coastal Waters (50km offshore)'
    },
    {
      band: 'State Police Tactical Wireless Grid',
      freq: '141.250 MHz (Repeater Duplex +600)',
      modulation: 'DMR Digital Tier II / Encrypted',
      purpose: 'Police Inter-District Coordination & Highway Convoys',
      coverage: 'NH-316 & Marine Drive Arteries'
    },
    {
      band: 'Disaster HAM Radio Auxiliary Link',
      freq: '145.500 MHz / 434.200 MHz',
      modulation: 'Amateur FM Packet / APRS',
      purpose: 'Civil Defense Auxiliary Volunteer Relays during Grid Blackout',
      coverage: 'Statewide Amateur Network'
    }
  ];

  const sops = [
    {
      title: 'SOP-01: Critical Life-Threat Triage & Automated Dispatch',
      badge: 'URGENT',
      content: 'When an inbound packet scores >= 85 (or flags trapped victims with medical distress), operator must immediately verify coordinates on the Live GIS Map and click "Auto-Dispatch Closest Unit". ETA, Battalion assigned, and route corridors are logged automatically.'
    },
    {
      title: 'SOP-02: Rapid LoRa Repeater Node Deployment in Flooded Sectors',
      badge: 'FIELD OPS',
      content: 'In areas where cellular towers are non-operational, deploy amphibious vehicle carrying the LoRa Tactical Mesh Repeater Node. Elevate antenna to >= 12 meters on cyclone shelter roofs to establish immediate 15km LoRa coverage radius.'
    },
    {
      title: 'SOP-03: Mass Voice IVR Check-in & Citizen Tally Protocol',
      badge: 'TELEPHONY',
      content: 'Launch targeted voice broadcast to registered coastal phone numbers. System will dial citizens automatically and capture DTMF keypad responses: 1=Safe, 2=Needs Aid, 3=Medical Distress. Pressing 3 immediately injects a Red Alert SOS beacon into EOC.'
    }
  ];

  const nodeDiagnostics = [
    { name: 'Puri Beach Gateway #01', ip: '10.14.8.101', status: 'Online', latency: '18ms', battery: '94%', snr: '+9.2 dB', packets: '4,812' },
    { name: 'Konark Temple Repeater #02', ip: '10.14.8.102', status: 'Online', latency: '24ms', battery: '88%', snr: '+7.8 dB', packets: '2,940' },
    { name: 'Chilika Maritime Gateway #03', ip: '10.14.8.103', status: 'Online', latency: '31ms', battery: '76%', snr: '+6.1 dB', packets: '1,720' },
    { name: 'Gopalpur Port Base Node #04', ip: '10.14.8.104', status: 'Warning', latency: '82ms', battery: '22%', snr: '+2.4 dB', packets: '890' }
  ];

  return (
    <div className="p-6 max-w-[1600px] mx-auto w-full space-y-6">
      
      {/* Header Banner - Enterprise Minimalist */}
      <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded border border-outline-variant/30 bg-surface-container-lowest flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-on-surface text-[22px]">support_agent</span>
          </div>
          <div>
            <h1 className="font-sans text-xl font-semibold text-on-surface">
              EOC Operations Support &amp; Technical Helpdesk
            </h1>
            <p className="font-sans text-sm text-on-surface-variant mt-1">
              Inter-Agency Directory, Field Mesh Network Diagnostics, &amp; Incident Ticketing
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewTicketModal(true)}
          className="bg-primary hover:bg-primary/90 text-on-primary font-semibold text-sm px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Create Ticket
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'hotlines', label: 'Emergency Hotlines', icon: 'emergency' },
          { id: 'tickets', label: `Field Tickets (${tickets.filter(t => t.status !== 'RESOLVED').length})`, icon: 'confirmation_number' },
          { id: 'frequencies', label: 'RF & Mesh Frequencies', icon: 'cell_tower' },
          { id: 'diagnostics', label: 'Gateway Diagnostics', icon: 'network_check' },
          { id: 'sop', label: 'Operational SOPs', icon: 'menu_book' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm rounded-lg'
                : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low border border-transparent rounded-lg'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Emergency Hotlines */}
      {activeTab === 'hotlines' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              className="bg-surface border border-outline-variant/30 rounded-lg p-5 flex flex-col justify-between hover:bg-surface-container-low transition-colors group"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-sans font-semibold text-on-surface mb-1 pr-2">
                    {contact.agency}
                  </h3>
                  <p className="text-xs text-on-surface-variant">{contact.role}</p>
                </div>
                <div className="w-8 h-8 rounded bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{contact.icon}</span>
                </div>
              </div>

              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/50">
                  <span className="text-xs text-on-surface-variant">Primary Hotline</span>
                  <button onClick={() => handleCopy(contact.phone, 'Primary Phone')} className="font-data-value text-on-surface hover:text-primary transition-colors flex items-center gap-1">
                    {contact.phone}
                  </button>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-outline-variant/50">
                  <span className="text-xs text-on-surface-variant">Mobile / Direct</span>
                  <button onClick={() => handleCopy(contact.altPhone, 'Alt Phone')} className="font-data-value text-on-surface hover:text-primary transition-colors flex items-center gap-1">
                    {contact.altPhone}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-on-surface-variant">Base Location</span>
                  <span className="text-on-surface truncate max-w-[150px]">{contact.location}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-1 bg-surface-container-lowest hover:bg-surface-container-lowestest border border-outline-variant/30 text-on-surface py-2 rounded text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">call</span>
                  Direct Call
                </a>
                <button
                  onClick={() => handleCopy(`${contact.agency}\nHotline: ${contact.phone}\nMobile: ${contact.altPhone}`, contact.agency)}
                  className="bg-surface-container-lowest hover:bg-surface-container-lowestest border border-outline-variant/30 text-on-surface px-3 py-2 rounded transition-colors"
                  title="Copy Details"
                >
                  <span className="material-symbols-outlined text-[16px]">content_copy</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: Field Support Tickets */}
      {activeTab === 'tickets' && (
        <div className="space-y-4">
          {tickets.map((tck) => (
            <div
              key={tck.id}
              className="bg-surface border border-outline-variant/30 rounded-lg p-5 flex flex-col md:flex-row md:items-start justify-between gap-6 hover:bg-surface-container-low transition-colors"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <span className="font-data-value text-on-surface font-semibold">{tck.id}</span>
                  <span className={`text-[10px] uppercase text-xs px-2 py-0.5 rounded border ${
                    tck.priority === 'CRITICAL' ? 'bg-error/10 text-error border-error/20' : 
                    tck.priority === 'HIGH' ? 'bg-secondary/10 text-secondary border-secondary/20' : 
                    'bg-surface-container-lowest text-on-surface-variant border-outline-variant'
                  }`}>
                    {tck.priority}
                  </span>
                  <span className="text-xs text-on-surface-variant">{tck.category}</span>
                </div>
                
                <h4 className="font-sans font-medium text-on-surface">{tck.subject}</h4>
                <p className="font-sans text-sm text-on-surface-variant leading-relaxed max-w-4xl">{tck.details}</p>
                
                <div className="text-xs text-on-surface-variant pt-2 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[14px]">person</span>
                  Reported by {tck.reporter} • {tck.timestamp}
                </div>
              </div>

              <div className="flex md:flex-col items-center md:items-end justify-between gap-3 shrink-0">
                <span className={`text-xs px-3 py-1 rounded ${
                  tck.status === 'RESOLVED' ? 'text-emerald-600' : 
                  tck.status === 'IN_PROGRESS' ? 'text-primary' : 'text-on-surface-variant'
                }`}>
                  {tck.status.replace('_', ' ')}
                </span>

                {tck.status !== 'RESOLVED' && (
                  <button
                    onClick={() => {
                      setTickets(tickets.map((t) => t.id === tck.id ? { ...t, status: 'RESOLVED' } : t));
                      showToast(`Ticket ${tck.id} marked as RESOLVED.`);
                    }}
                    className="text-sm bg-surface-container-lowest hover:bg-surface-container-lowestest border border-outline-variant/30 px-3 py-1.5 rounded text-on-surface transition-colors"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Radio & RF Mesh Frequencies */}
      {activeTab === 'frequencies' && (
        <div className="bg-surface border border-outline-variant/30 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant text-xs uppercase">
                <tr>
                  <th className="p-4 font-medium">Protocol / Channel</th>
                  <th className="p-4 font-medium">Carrier Frequency</th>
                  <th className="p-4 font-medium">Modulation Standard</th>
                  <th className="p-4 font-medium">Designated Purpose</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {frequencies.map((f, idx) => (
                  <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                    <td className="p-4 text-on-surface font-medium">{f.band}</td>
                    <td className="p-4 font-data-value text-on-surface-variant">{f.freq}</td>
                    <td className="p-4 text-on-surface-variant">{f.modulation}</td>
                    <td className="p-4 text-on-surface-variant">{f.purpose}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Gateway Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-surface border border-outline-variant/30 p-5 rounded-lg">
              <span className="text-xs text-on-surface-variant block mb-2">Mesh Nodes Online</span>
              <span className="text-display-lg text-on-surface">5 <span className="font-sans text-sm text-on-surface-variant">/ 5</span></span>
            </div>
            <div className="bg-surface border border-outline-variant/30 p-5 rounded-lg">
              <span className="text-xs text-on-surface-variant block mb-2">Average Ping</span>
              <span className="text-display-lg text-on-surface">28.4 <span className="font-sans text-sm text-on-surface-variant">ms</span></span>
            </div>
            <div className="bg-surface border border-outline-variant/30 p-5 rounded-lg">
              <span className="text-xs text-on-surface-variant block mb-2">Packet Loss Rate</span>
              <span className="text-display-lg text-on-surface">0.08<span className="font-sans text-sm text-on-surface-variant">%</span></span>
            </div>
            <div className="bg-surface border border-outline-variant/30 p-5 rounded-lg">
              <span className="text-xs text-on-surface-variant block mb-2">Relayed Packets</span>
              <span className="text-display-lg text-on-surface">16.4<span className="font-sans text-sm text-on-surface-variant">k</span></span>
            </div>
          </div>

          <div className="bg-surface border border-outline-variant/30 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant text-xs uppercase">
                  <tr>
                    <th className="p-4 font-medium">Node Name</th>
                    <th className="p-4 font-medium">IP Address</th>
                    <th className="p-4 font-medium">Latency</th>
                    <th className="p-4 font-medium">Battery</th>
                    <th className="p-4 font-medium">Packets Relayed</th>
                    <th className="p-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {nodeDiagnostics.map((node, idx) => (
                    <tr key={idx} className="hover:bg-surface-container-low transition-colors">
                      <td className="p-4 text-on-surface font-medium flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'Online' ? 'bg-status-green' : 'bg-error'}`}></span>
                        {node.name}
                      </td>
                      <td className="p-4 font-data-value text-on-surface-variant">{node.ip}</td>
                      <td className="p-4 font-data-value text-on-surface-variant">{node.latency}</td>
                      <td className="p-4 font-data-value text-on-surface-variant">{node.battery}</td>
                      <td className="p-4 font-data-value text-on-surface-variant">{node.packets}</td>
                      <td className="p-4 text-xs">
                        <span className={node.status === 'Online' ? 'text-emerald-600' : 'text-error'}>{node.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Operational SOPs */}
      {activeTab === 'sop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sops.map((sop, idx) => (
            <div key={idx} className="bg-surface border border-outline-variant/30 rounded-lg p-5 hover:bg-surface-container-low transition-colors">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-sans font-medium text-on-surface">{sop.title}</h3>
                <span className="text-xs bg-surface-container-lowest border border-outline-variant/30 px-2 py-0.5 rounded text-on-surface-variant">{sop.badge}</span>
              </div>
              <p className="font-sans text-sm text-on-surface-variant leading-relaxed">
                {sop.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Ticket */}
      {newTicketModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-outline-variant/30 p-6 rounded-xl shadow-sm w-full max-w-lg shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-outline-variant">
              <h3 className="font-sans font-semibold text-on-surface">Create Incident Ticket</h3>
              <button onClick={() => setNewTicketModal(false)} className="text-on-surface-variant hover:text-on-surface transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-5 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-on-surface-variant block mb-1.5">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-sm text-on-surface focus:outline-none focus:border-outline"
                  >
                    <option value="Mesh Gateway">Mesh Gateway</option>
                    <option value="IVR Telephony">IVR Telephony</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Medical Fleet">Medical Fleet</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant block mb-1.5">Priority</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-sm text-on-surface focus:outline-none focus:border-outline"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Subject</label>
                <input
                  type="text"
                  required
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-sm text-on-surface focus:outline-none focus:border-outline"
                  placeholder="Brief description of the issue"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant block mb-1.5">Technical Details</label>
                <textarea
                  rows={4}
                  value={ticketDetails}
                  onChange={(e) => setTicketDetails(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded p-2.5 text-sm text-on-surface focus:outline-none focus:border-outline resize-none"
                  placeholder="Provide logs, coordinates, or symptom details..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
                  className="px-4 py-2 bg-surface-container-lowest border border-outline-variant/30 text-on-surface rounded text-sm transition-colors hover:bg-surface-container-lowestest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary/20 border border-primary/40 text-primary font-medium rounded text-sm transition-colors hover:bg-primary/30 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
