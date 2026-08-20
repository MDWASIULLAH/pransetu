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

  // Interactive Ticket State
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
      altPhone: '0674-2534177',
      location: 'Rajiv Bhawan, Bhubaneswar',
      icon: 'shield',
      status: '24x7 Active',
      statusColor: 'text-status-green'
    },
    {
      agency: 'National Disaster Response Force (NDRF)',
      role: '03rd Battalion Maritime Rescue Command',
      phone: '0671-2879711',
      altPhone: '9437965412',
      location: 'Mundali, Cuttack',
      icon: 'military_tech',
      status: 'Ready / Standby',
      statusColor: 'text-primary'
    },
    {
      agency: 'Odisha Disaster Rapid Action Force (ODRAF)',
      role: 'Coastal Quick Reaction Force',
      phone: '112',
      altPhone: '0674-2536703',
      location: 'State Reserve Police HQs',
      icon: 'local_fire_department',
      status: 'Deploying',
      statusColor: 'text-secondary'
    },
    {
      agency: 'Indian Coast Guard (ICG) District HQ 7',
      role: 'Maritime Search & Rescue Coordination',
      phone: '1554',
      altPhone: '06722-220050',
      location: 'Paradip Port Base',
      icon: 'sailing',
      status: 'Patrol Active',
      statusColor: 'text-primary'
    },
    {
      agency: 'India Meteorological Department (IMD)',
      role: 'Cyclone Warning Centre Bhubaneswar',
      phone: '0674-2596116',
      altPhone: '0674-2596010',
      location: 'Airport Road, Bhubaneswar',
      icon: 'cyclone',
      status: 'Monitoring 24x7',
      statusColor: 'text-status-green'
    },
    {
      agency: 'Directorate of Public Health & EMS',
      role: 'Emergency Medical Logistics & Blood Banks',
      phone: '108',
      altPhone: '104',
      location: 'Heads of Department Building',
      icon: 'medical_services',
      status: 'ALS Units Active',
      statusColor: 'text-status-green'
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
    },
    {
      band: 'ISRO GSAT-7 Satellite Disaster Channel',
      freq: 'C-Band / S-Band MSS',
      modulation: 'Digital DVB-S2 QPSK',
      purpose: 'Direct EOC-to-Satellite Emergency Telephony & Imagery',
      coverage: 'Pan-India Footprint'
    }
  ];

  const sops = [
    {
      title: 'SOP-01: Critical Life-Threat Triage & Automated Dispatch',
      badge: 'URGENT',
      content:
        'When an inbound packet scores >= 85 (or flags trapped victims with medical distress), operator must immediately verify coordinates on the Live GIS Map and click "Auto-Dispatch Closest Unit". ETA, Battalion assigned, and route corridors are logged automatically.'
    },
    {
      title: 'SOP-02: Rapid LoRa Repeater Node Deployment in Flooded Sectors',
      badge: 'FIELD OPS',
      content:
        'In areas where cellular towers are non-operational, deploy amphibious vehicle carrying the LoRa Tactical Mesh Repeater Node. Elevate antenna to >= 12 meters on cyclone shelter roofs to establish immediate 15km LoRa coverage radius.'
    },
    {
      title: 'SOP-03: Mass Voice IVR Check-in & Citizen Tally Protocol',
      badge: 'TELEPHONY',
      content:
        'Launch targeted voice broadcast to registered coastal phone numbers. System will dial citizens automatically and capture DTMF keypad responses: 1=Safe, 2=Needs Aid, 3=Medical Distress. Pressing 3 immediately injects a Red Alert SOS beacon into EOC.'
    },
    {
      title: 'SOP-04: Shelter Capacity Balancing & Fleet Redistribution',
      badge: 'LOGISTICS',
      content:
        'When any cyclone shelter exceeds 85% capacity threshold, initiate resource transfer protocol. Allocate water tankers (5000L) and emergency food pallets from regional warehouse stocks via the Resources module.'
    }
  ];

  const nodeDiagnostics = [
    { name: 'Puri Beach LoRa Gateway #01', ip: '10.14.8.101', status: 'Online', latency: '18ms', battery: '94%', snr: '+9.2 dB', packets: '4,812 relayed' },
    { name: 'Konark Sun Temple Repeater #02', ip: '10.14.8.102', status: 'Online', latency: '24ms', battery: '88%', snr: '+7.8 dB', packets: '2,940 relayed' },
    { name: 'Chilika Lake Maritime Gateway #03', ip: '10.14.8.103', status: 'Online', latency: '31ms', battery: '76%', snr: '+6.1 dB', packets: '1,720 relayed' },
    { name: 'Gopalpur Port Base Node #04', ip: '10.14.8.104', status: 'Warning', latency: '82ms', battery: '22%', snr: '+2.4 dB', packets: '890 relayed' },
    { name: 'Paradeep Maritime Repeater #05', ip: '10.14.8.105', status: 'Online', latency: '19ms', battery: '99%', snr: '+11.0 dB', packets: '6,104 relayed' }
  ];

  return (
    <div className="p-4 md:p-stack-lg max-w-[1600px] mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-surface-container border border-outline-variant p-4 sm:p-6 rounded-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[28px]">contact_support</span>
          </div>
          <div>
            <h1 className="font-headline-sm sm:font-headline-lg text-headline-sm sm:text-headline-lg font-bold text-on-surface">
              EOC Operations Support &amp; Technical Helpdesk
            </h1>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 text-xs sm:text-sm">
              24x7 Inter-Agency Directory, Field Mesh Network Diagnostics, Tactical Radio Frequencies &amp; Incident Ticketing
            </p>
          </div>
        </div>

        <button
          onClick={() => setNewTicketModal(true)}
          className="bg-primary text-on-primary font-bold px-4 py-2.5 rounded-lg hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shrink-0 text-xs sm:text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add_task</span>
          Create Support Ticket
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-outline-variant pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('hotlines')}
          className={`px-3 py-1.5 rounded-lg font-data-label text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'hotlines'
              ? 'bg-primary-container text-primary font-bold border border-primary/30'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">emergency</span>
          Emergency Hotlines
        </button>

        <button
          onClick={() => setActiveTab('tickets')}
          className={`px-3 py-1.5 rounded-lg font-data-label text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'tickets'
              ? 'bg-primary-container text-primary font-bold border border-primary/30'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">confirmation_number</span>
          Field Tickets ({tickets.filter((t) => t.status !== 'RESOLVED').length} Open)
        </button>

        <button
          onClick={() => setActiveTab('frequencies')}
          className={`px-3 py-1.5 rounded-lg font-data-label text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'frequencies'
              ? 'bg-primary-container text-primary font-bold border border-primary/30'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">cell_tower</span>
          RF &amp; Mesh Frequencies
        </button>

        <button
          onClick={() => setActiveTab('diagnostics')}
          className={`px-3 py-1.5 rounded-lg font-data-label text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'diagnostics'
              ? 'bg-primary-container text-primary font-bold border border-primary/30'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">network_check</span>
          Gateway Diagnostics
        </button>

        <button
          onClick={() => setActiveTab('sop')}
          className={`px-3 py-1.5 rounded-lg font-data-label text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'sop'
              ? 'bg-primary-container text-primary font-bold border border-primary/30'
              : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">menu_book</span>
          Operational SOPs
        </button>
      </div>

      {/* TAB 1: Emergency Hotlines */}
      {activeTab === 'hotlines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-gutter">
          {emergencyContacts.map((contact, idx) => (
            <div
              key={idx}
              className="bg-surface-container border border-outline-variant rounded-xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-container-highest border border-outline-variant flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-[22px]">{contact.icon}</span>
                  </div>
                  <div>
                    <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface text-sm sm:text-base">
                      {contact.agency}
                    </h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">{contact.role}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold uppercase font-data-label px-2 py-0.5 rounded bg-surface-container-highest border border-outline-variant ${contact.statusColor}`}>
                  {contact.status}
                </span>
              </div>

              <div className="space-y-2 my-3 text-xs bg-surface-container-lowest p-3 rounded-lg border border-outline-variant/40">
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-data-label">PRIMARY HOTLINE:</span>
                  <button
                    onClick={() => handleCopy(contact.phone, `${contact.agency} Phone`)}
                    className="font-mono font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">call</span>
                    {contact.phone}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-data-label">ALT DIRECT LINE:</span>
                  <button
                    onClick={() => handleCopy(contact.altPhone, `${contact.agency} Alt Phone`)}
                    className="font-mono font-bold text-on-surface hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[14px]">phone_enabled</span>
                    {contact.altPhone}
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-on-surface-variant font-data-label">BASE LOCATION:</span>
                  <span className="text-on-surface font-medium truncate max-w-[160px]">{contact.location}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <a
                  href={`tel:${contact.phone}`}
                  className="flex-1 bg-primary text-on-primary py-1.5 px-3 rounded-lg font-data-label text-xs font-bold text-center flex items-center justify-center gap-1 hover:bg-primary-fixed"
                >
                  <span className="material-symbols-outlined text-[14px]">call</span>
                  Direct Call
                </a>
                <button
                  onClick={() => handleCopy(`${contact.agency} Hotline: ${contact.phone} | Alt: ${contact.altPhone}`, contact.agency)}
                  className="bg-surface-bright hover:bg-surface-container-highest text-on-surface border border-outline-variant px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer"
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
          <div className="flex items-center justify-between">
            <span className="font-headline-sm text-sm font-bold text-on-surface">
              Active Field Support &amp; Technical Tickets ({tickets.length})
            </span>
            <button
              onClick={() => setNewTicketModal(true)}
              className="bg-primary-container text-primary font-bold px-3 py-1.5 rounded text-xs flex items-center gap-1.5 hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add</span>
              New Incident Ticket
            </button>
          </div>

          <div className="space-y-3">
            {tickets.map((tck) => (
              <div
                key={tck.id}
                className="bg-surface-container border border-outline-variant rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden"
              >
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1 ${
                    tck.priority === 'CRITICAL'
                      ? 'bg-error'
                      : tck.priority === 'HIGH'
                      ? 'bg-secondary'
                      : 'bg-primary'
                  }`}
                ></div>

                <div className="space-y-1 pl-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                      {tck.id}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase font-data-label ${
                        tck.priority === 'CRITICAL'
                          ? 'bg-error-container text-on-error-container'
                          : tck.priority === 'HIGH'
                          ? 'bg-secondary-container text-on-secondary-container'
                          : 'bg-surface-bright text-on-surface'
                      }`}
                    >
                      {tck.priority}
                    </span>
                    <span className="text-[11px] font-bold text-on-surface-variant">
                      Category: {tck.category} • Reported by {tck.reporter} ({tck.timestamp})
                    </span>
                  </div>

                  <h4 className="font-headline-sm text-headline-sm font-bold text-on-surface text-sm sm:text-base pt-1">
                    {tck.subject}
                  </h4>
                  <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed max-w-3xl">
                    {tck.details}
                  </p>
                </div>

                <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-outline-variant">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold font-data-label ${
                      tck.status === 'RESOLVED'
                        ? 'bg-status-green/20 text-status-green border border-status-green/40'
                        : tck.status === 'IN_PROGRESS'
                        ? 'bg-primary-container text-primary border border-primary/40'
                        : 'bg-surface-bright text-on-surface-variant border border-outline-variant'
                    }`}
                  >
                    {tck.status.replace('_', ' ')}
                  </span>

                  {tck.status !== 'RESOLVED' && (
                    <button
                      onClick={() => {
                        setTickets(
                          tickets.map((t) =>
                            t.id === tck.id ? { ...t, status: 'RESOLVED' } : t
                          )
                        );
                        showToast(`Ticket ${tck.id} marked as RESOLVED.`);
                      }}
                      className="text-xs bg-surface-bright hover:bg-surface-container-highest border border-outline-variant px-2.5 py-1 rounded text-on-surface font-bold cursor-pointer transition-colors"
                    >
                      Mark Resolved
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Radio & RF Mesh Frequencies */}
      {activeTab === 'frequencies' && (
        <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
          <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface text-base">
                Tactical Wireless Grid &amp; RF Frequency Allocation
              </h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs">
                Authorized Emergency Frequencies (WPC / DoT Certified Bandwidth for Disaster Relief)
              </p>
            </div>
            <button
              onClick={() => handleCopy(frequencies.map((f) => `${f.band}: ${f.freq}`).join('\n'), 'All Frequencies')}
              className="bg-surface-bright border border-outline-variant hover:bg-surface-container-highest text-on-surface px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">content_copy</span>
              Copy Frequency Table
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-surface-container-highest text-on-surface-variant font-data-label uppercase border-b border-outline-variant">
                <tr>
                  <th className="p-3">Protocol / Channel</th>
                  <th className="p-3">Carrier Frequency</th>
                  <th className="p-3">Modulation Standard</th>
                  <th className="p-3">Designated Purpose</th>
                  <th className="p-3">Coverage Radius</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant font-data-value">
                {frequencies.map((f, idx) => (
                  <tr key={idx} className="hover:bg-surface-bright/50 transition-colors">
                    <td className="p-3 font-bold text-primary">{f.band}</td>
                    <td className="p-3 font-mono text-status-green font-bold">{f.freq}</td>
                    <td className="p-3 text-on-surface">{f.modulation}</td>
                    <td className="p-3 text-on-surface-variant">{f.purpose}</td>
                    <td className="p-3 text-on-surface font-semibold">{f.coverage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Gateway Diagnostics */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter">
            <div className="bg-surface-container border border-outline-variant p-4 rounded-xl">
              <span className="font-data-label text-on-surface-variant uppercase text-[11px] block mb-1">
                Mesh Nodes Online
              </span>
              <span className="font-display-lg text-display-lg text-status-green font-bold">5 / 5</span>
              <p className="text-xs text-on-surface-variant mt-1">100% Coastal Grid Coverage</p>
            </div>
            <div className="bg-surface-container border border-outline-variant p-4 rounded-xl">
              <span className="font-data-label text-on-surface-variant uppercase text-[11px] block mb-1">
                Average Gateway Ping
              </span>
              <span className="font-display-lg text-display-lg text-primary font-bold">28.4 ms</span>
              <p className="text-xs text-on-surface-variant mt-1">Low Latency Mesh Relay</p>
            </div>
            <div className="bg-surface-container border border-outline-variant p-4 rounded-xl">
              <span className="font-data-label text-on-surface-variant uppercase text-[11px] block mb-1">
                Packet Loss Rate
              </span>
              <span className="font-display-lg text-display-lg text-on-surface font-bold">0.08%</span>
              <p className="text-xs text-on-surface-variant mt-1">Error-corrected Forwarding</p>
            </div>
            <div className="bg-surface-container border border-outline-variant p-4 rounded-xl">
              <span className="font-data-label text-on-surface-variant uppercase text-[11px] block mb-1">
                Total Relayed Packets
              </span>
              <span className="font-display-lg text-display-lg text-secondary font-bold">16,466</span>
              <p className="text-xs text-on-surface-variant mt-1">During Current Operation</p>
            </div>
          </div>

          <div className="bg-surface-container border border-outline-variant rounded-xl overflow-hidden">
            <div className="p-4 border-b border-outline-variant bg-surface-container-low flex justify-between items-center">
              <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface text-base">
                Physical Mesh Node Telemetry &amp; Battery Reserves
              </h3>
              <span className="flex items-center gap-1 text-xs text-status-green font-mono">
                <span className="w-2 h-2 rounded-full bg-status-green animate-ping"></span>
                POLLING LIVE
              </span>
            </div>

            <div className="divide-y divide-outline-variant">
              {nodeDiagnostics.map((node, idx) => (
                <div key={idx} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-surface-bright/50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-green"></span>
                      <strong className="text-on-surface text-sm">{node.name}</strong>
                      <span className="font-mono text-[11px] text-on-surface-variant bg-surface-container-highest px-1.5 py-0.5 rounded">
                        {node.ip}
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant pl-4.5">
                      Throughput: {node.packets} • Signal-to-Noise Ratio (SNR): {node.snr}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">PING</span>
                      <span className="text-primary font-bold">{node.latency}</span>
                    </div>
                    <div>
                      <span className="text-on-surface-variant block text-[10px]">BATTERY</span>
                      <span className={parseInt(node.battery) < 30 ? 'text-error font-bold' : 'text-status-green font-bold'}>
                        {node.battery}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-status-green/20 text-status-green border border-status-green/40">
                      {node.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Operational SOPs */}
      {activeTab === 'sop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
          {sops.map((sop, idx) => (
            <div key={idx} className="bg-surface-container border border-outline-variant rounded-xl p-5 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-outline-variant">
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface text-sm">
                  {sop.title}
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-primary-container text-primary border border-primary/30">
                  {sop.badge}
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant text-xs leading-relaxed">
                {sop.content}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal: New Support Ticket */}
      {newTicketModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-[24px]">confirmation_number</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  CREATE FIELD INCIDENT TICKET
                </h3>
              </div>
              <button onClick={() => setNewTicketModal(false)} className="text-on-surface-variant hover:text-on-surface cursor-pointer">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="mt-4 space-y-4">
              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Incident Category
                </label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Mesh Gateway">LoRa Mesh Gateway / Repeater Hardware</option>
                  <option value="IVR Telephony">Automated IVR Telephony / SIP Trunks</option>
                  <option value="Logistics">Shelter Logistics / Generator Diesel Supply</option>
                  <option value="Medical Fleet">ALS Ambulance Fleet / Medical Consumables</option>
                  <option value="Radio Frequency">VHF/UHF Radio Grid Interference</option>
                </select>
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Priority Level
                </label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value as any)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="CRITICAL">CRITICAL - System Outage / Imminent Failure</option>
                  <option value="HIGH">HIGH - Degraded Redundancy / Power Warning</option>
                  <option value="MEDIUM">MEDIUM - Routine Support / Supply Transfer</option>
                </select>
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Subject / Summary
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Solar charger failure at Balasore Coastal Node #018"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Technical Details / Symptoms
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide node coordinates, error codes, and field inspection observations..."
                  value={ticketDetails}
                  onChange={(e) => setTicketDetails(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewTicketModal(false)}
                  className="px-4 py-2 bg-surface-bright border border-outline-variant text-on-surface rounded font-data-label text-data-label hover:bg-surface-container-highest cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-on-primary font-bold rounded-lg hover:bg-primary-fixed hover:text-on-primary-fixed transition-colors flex items-center gap-2 cursor-pointer shadow-md"
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
