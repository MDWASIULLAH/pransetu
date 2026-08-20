import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import type { ShelterFacility } from '../context/EOCContext';

export const Resources: React.FC = () => {
  const { shelters, fleet, dispatchFleetToShelter, exportSheltersCSV, showToast } = useEOC();

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedShelter, setSelectedShelter] = useState<ShelterFacility | null>(null);
  const [resourceType, setResourceType] = useState('Inflatable Rescue Boats (IRB)');
  const [resourceQuantity, setResourceQuantity] = useState(2);
  const [targetFacilityId, setTargetFacilityId] = useState(shelters[0]?.id || 'SH-01');

  const handleDispatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setDispatchModalOpen(false);
    dispatchFleetToShelter(targetFacilityId, resourceType, resourceQuantity);
  };

  const totalShelterCapacity = shelters.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalShelterOccupied = shelters.reduce((acc, curr) => acc + curr.occupied, 0);
  const overallOccupancyPercent =
    totalShelterCapacity > 0 ? Math.round((totalShelterOccupied / totalShelterCapacity) * 100) : 0;

  return (
    <div className="p-4 sm:p-gutter md:p-margin-desktop bg-background text-on-surface min-h-screen w-full">
      {/* Dispatch Resource Modal */}
      {dispatchModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">local_shipping</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                  Dispatch Fleet &amp; Supplies
                </h3>
              </div>
              <button 
                onClick={() => setDispatchModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleDispatchSubmit} className="mt-4 space-y-4">
              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Destination Cyclone Shelter
                </label>
                <select 
                  value={targetFacilityId}
                  onChange={(e) => setTargetFacilityId(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-xs sm:text-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  {shelters.map((s) => {
                    const occPct = Math.round((s.occupied / s.capacity) * 100);
                    return (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.zone} - {occPct}% Occupied)
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Resource Category
                </label>
                <select 
                  value={resourceType}
                  onChange={(e) => setResourceType(e.target.value)}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-body-sm text-xs sm:text-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Rescue Boats (Outboard Motor)">Rescue Boats (Outboard Motor - Available: {fleet.boats.ready})</option>
                  <option value="Advanced Life Support Ambulances">ALS Ambulances (Available: {fleet.ambulances.ready})</option>
                  <option value="Food & Ration Pallets (100 pkts)">Food &amp; Ration Pallets (Available: {fleet.foodPallets.ready})</option>
                  <option value="Emergency Water Tanker (5000L)">Emergency Water Tanker (5,000 Liters)</option>
                </select>
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Quantity / Unit Count
                </label>
                <input 
                  type="number"
                  min={1}
                  max={20}
                  value={resourceQuantity}
                  onChange={(e) => setResourceQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-surface-container-highest border border-outline-variant rounded p-2 text-on-surface font-data-value text-data-value focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button 
                  type="button"
                  onClick={() => setDispatchModalOpen(false)}
                  className="px-4 py-2 bg-surface-bright border border-outline-variant text-on-surface rounded font-data-label text-data-label hover:bg-surface-container-highest cursor-pointer text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded flex items-center gap-2 cursor-pointer shadow-md text-xs sm:text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Confirm Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shelter Inspect Modal */}
      {selectedShelter && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface text-sm sm:text-base">
                  {selectedShelter.name}
                </h3>
                <span className="text-on-surface-variant text-xs">{selectedShelter.district} • {selectedShelter.zone}</span>
              </div>
              <button 
                onClick={() => setSelectedShelter(null)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 bg-surface-container-high p-3 rounded-lg border border-outline-variant text-xs">
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">TOTAL CAPACITY</span>
                  <span className="font-data-value text-data-value text-on-surface text-base sm:text-lg">
                    {selectedShelter.capacity} Beds
                  </span>
                </div>
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">CURRENT OCCUPANCY</span>
                  <span className="font-data-value text-data-value text-on-surface text-base sm:text-lg">
                    {selectedShelter.occupied} ({Math.round((selectedShelter.occupied / selectedShelter.capacity) * 100)}%)
                  </span>
                </div>
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">MEDICAL READINESS</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold mt-1 ${selectedShelter.tierColor}`}>
                    {selectedShelter.tierText}
                  </span>
                </div>
                <div>
                  <span className="font-data-label text-data-label text-on-surface-variant block">STATUS</span>
                  <span className="font-data-value text-data-value text-status-green font-bold">
                    {selectedShelter.status}
                  </span>
                </div>
              </div>

              <div className="bg-surface-container-highest p-3 rounded border border-outline-variant text-xs">
                <span className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  On-Site Logistics &amp; Power:
                </span>
                <ul className="list-disc list-inside space-y-1 font-body-sm text-on-surface text-xs">
                  <li>Drinking Water: {selectedShelter.drinkingWaterLiters.toLocaleString()} Liters Reserved</li>
                  <li>Backup Power: {selectedShelter.generatorStatus}</li>
                  <li>Medical Personnel: {selectedShelter.medicalStaff}</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button 
                  onClick={() => setSelectedShelter(null)}
                  className="px-4 py-2 bg-surface-bright border border-outline-variant text-on-surface rounded font-data-label text-data-label hover:bg-surface-container-highest cursor-pointer text-xs"
                >
                  Close
                </button>
                <button 
                  onClick={() => {
                    const targetId = selectedShelter.id;
                    setSelectedShelter(null);
                    setTargetFacilityId(targetId);
                    setDispatchModalOpen(true);
                  }}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-on-primary font-bold rounded flex items-center gap-2 cursor-pointer text-xs"
                >
                  <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                  Send Supplies Here
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-stack-lg gap-4">
        <div>
          <h1 className="font-headline-lg text-headline-lg-mobile md:text-headline-lg font-semibold text-on-surface text-xl sm:text-2xl">
            Resource Management
          </h1>
          <p className="text-on-surface-variant font-body-sm text-body-sm mt-1 text-xs sm:text-sm">
            Live overview of shelter capacities and asset deployment across Odisha.
          </p>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button 
            onClick={exportSheltersCSV}
            className="bg-surface-container hover:bg-surface-container-highest border border-outline-variant text-on-surface px-3 sm:px-4 py-2 rounded flex items-center gap-1.5 font-body-sm text-xs sm:text-sm font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Log
          </button>
          <button 
            onClick={() => setDispatchModalOpen(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary px-3 sm:px-4 py-2 rounded flex items-center gap-1.5 font-body-sm text-xs sm:text-sm font-bold transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">local_shipping</span>
            Dispatch Resource
          </button>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter md:gap-stack-lg">
        {/* Shelter Network Module */}
        <section className="lg:col-span-7 bg-surface-container-high rounded-xl border border-outline-variant overflow-hidden flex flex-col shadow-xl">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-surface-container">
            <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 text-sm sm:text-base font-bold">
              <span className="material-symbols-outlined text-primary">shelves</span>
              Shelter Network Status ({shelters.length} Facilities)
            </h2>
            <span className="bg-surface-bright text-status-green border border-status-green/30 px-2 py-0.5 rounded text-xs font-bold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-status-green animate-pulse"></span>
              LIVE
            </span>
          </div>

          <div className="p-4 bg-surface-container-lowest grid grid-cols-3 gap-2 sm:gap-4 border-b border-outline-variant text-center sm:text-left">
            <div>
              <div className="font-data-label text-data-label text-on-surface-variant uppercase text-[10px] sm:text-xs">
                Total Shelters
              </div>
              <div className="font-display-lg text-2xl sm:text-display-lg text-on-surface mt-1 font-bold">
                {shelters.length}
              </div>
            </div>
            <div>
              <div className="font-data-label text-data-label text-on-surface-variant uppercase text-[10px] sm:text-xs">
                Capacity
              </div>
              <div className="font-display-lg text-2xl sm:text-display-lg text-on-surface mt-1 font-bold">
                {(totalShelterCapacity / 1000).toFixed(1)}k
              </div>
            </div>
            <div>
              <div className="font-data-label text-data-label text-on-surface-variant uppercase text-[10px] sm:text-xs">
                Current Occ.
              </div>
              <div className="font-display-lg text-2xl sm:text-display-lg text-on-surface mt-1 font-bold">
                {overallOccupancyPercent}%
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-surface-container sticky top-0 z-10 border-b border-outline-variant font-data-label text-data-label text-on-surface-variant uppercase text-xs">
                <tr>
                  <th className="p-3 sm:p-4 font-medium">Facility Name</th>
                  <th className="p-3 sm:p-4 font-medium">Medical Tier</th>
                  <th className="p-3 sm:p-4 font-medium">Capacity</th>
                  <th className="p-3 sm:p-4 font-medium">Occupancy</th>
                  <th className="p-3 sm:p-4 font-medium text-right">Details</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-outline-variant text-xs sm:text-sm">
                {shelters.map((shelter) => {
                  const occPct = Math.round((shelter.occupied / shelter.capacity) * 100);
                  return (
                    <tr 
                      key={shelter.id}
                      onClick={() => setSelectedShelter(shelter)}
                      className="hover:bg-surface-container-highest transition-colors relative cursor-pointer group"
                    >
                      <td className="p-3 sm:p-4 relative">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${shelter.borderColor}`}></div>
                        <div className="font-medium">{shelter.name}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5">{shelter.zone} • {shelter.district}</div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={`${shelter.tierColor} px-2 py-0.5 rounded text-[10px] sm:text-xs font-bold`}>
                          {shelter.tierText}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4 font-data-value text-data-value">{shelter.capacity.toLocaleString()}</td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-data-value text-data-value">{occPct}%</span>
                          <div className="w-12 sm:w-16 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${shelter.occupancyColor} transition-all duration-500`} 
                              style={{ width: `${occPct}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 text-right">
                        <button className="text-primary hover:text-white transition-colors cursor-pointer">
                          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 border-t border-outline-variant bg-surface-container text-center">
            <button 
              onClick={() => showToast('All 42 regional shelters online & telemetry verified.')}
              className="text-primary font-body-sm font-medium hover:underline text-xs cursor-pointer"
            >
              Sync &amp; Verify All Shelters (42)
            </button>
          </div>
        </section>

        {/* Asset Fleet Module */}
        <section className="lg:col-span-5 flex flex-col gap-gutter md:gap-stack-lg">
          {/* Quick KPI Row */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex items-center justify-between shadow-md">
              <div>
                <div className="font-data-label text-data-label text-on-surface-variant uppercase text-xs">Assets Deployed</div>
                <div className="font-headline-lg text-xl sm:text-headline-lg text-on-surface mt-1 font-bold">
                  {fleet.boats.deployed + fleet.ambulances.deployed + fleet.teams.deployed}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary-container flex items-center justify-center text-primary shrink-0">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">local_shipping</span>
              </div>
            </div>

            <div className="bg-surface-container-high border border-outline-variant rounded-xl p-4 flex items-center justify-between shadow-md">
              <div>
                <div className="font-data-label text-data-label text-on-surface-variant uppercase text-xs">Units Ready</div>
                <div className="font-headline-lg text-xl sm:text-headline-lg text-status-green mt-1 font-bold">
                  {fleet.boats.ready + fleet.ambulances.ready + fleet.teams.ready}
                </div>
              </div>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-surface-container-highest border border-outline-variant flex items-center justify-center text-status-green shrink-0">
                <span className="material-symbols-outlined text-[20px] sm:text-[24px]">check_circle</span>
              </div>
            </div>
          </div>

          {/* Asset Breakdown */}
          <div className="bg-surface-container-high border border-outline-variant rounded-xl flex-1 flex flex-col shadow-xl">
            <div className="p-4 border-b border-outline-variant bg-surface-container">
              <h2 className="font-headline-sm text-headline-sm text-on-surface flex items-center gap-2 text-sm sm:text-base font-bold">
                <span className="material-symbols-outlined text-secondary">category</span>
                Fleet Readiness Overview
              </h2>
            </div>

            <div className="p-4 flex-1 space-y-6">
              {/* Boats */}
              <div>
                <div className="flex justify-between items-end mb-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-base">sailing</span>
                    <span className="font-body-lg font-semibold text-on-surface">Rescue Boats</span>
                  </div>
                  <span className="font-data-value text-data-value text-on-surface">{fleet.boats.total} Total</span>
                </div>
                <div className="flex h-3 sm:h-4 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-primary transition-all duration-500" 
                    style={{ width: `${(fleet.boats.deployed / fleet.boats.total) * 100}%` }}
                    title={`Deployed: ${fleet.boats.deployed}`}
                  ></div>
                  <div 
                    className="bg-status-green transition-all duration-500" 
                    style={{ width: `${(fleet.boats.ready / fleet.boats.total) * 100}%` }}
                    title={`Ready: ${fleet.boats.ready}`}
                  ></div>
                  <div 
                    className="bg-error transition-all duration-500" 
                    style={{ width: `${(fleet.boats.maintenance / fleet.boats.total) * 100}%` }}
                    title={`Maintenance: ${fleet.boats.maintenance}`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs font-data-label text-on-surface-variant">
                  <span>Deployed: {fleet.boats.deployed}</span>
                  <span>Ready: {fleet.boats.ready}</span>
                </div>
              </div>

              {/* Ambulances */}
              <div>
                <div className="flex justify-between items-end mb-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-base">ambulance</span>
                    <span className="font-body-lg font-semibold text-on-surface">Ambulances</span>
                  </div>
                  <span className="font-data-value text-data-value text-on-surface">{fleet.ambulances.total} Total</span>
                </div>
                <div className="flex h-3 sm:h-4 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-primary transition-all duration-500" 
                    style={{ width: `${(fleet.ambulances.deployed / fleet.ambulances.total) * 100}%` }}
                    title={`Deployed: ${fleet.ambulances.deployed}`}
                  ></div>
                  <div 
                    className="bg-status-green transition-all duration-500" 
                    style={{ width: `${(fleet.ambulances.ready / fleet.ambulances.total) * 100}%` }}
                    title={`Ready: ${fleet.ambulances.ready}`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs font-data-label text-on-surface-variant">
                  <span>Deployed: {fleet.ambulances.deployed}</span>
                  <span>Ready: {fleet.ambulances.ready}</span>
                </div>
              </div>

              {/* Food Kits */}
              <div>
                <div className="flex justify-between items-end mb-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-on-surface-variant text-base">restaurant</span>
                    <span className="font-body-lg font-semibold text-on-surface">Food Kits (Pallets)</span>
                  </div>
                  <span className="font-data-value text-data-value text-on-surface">{fleet.foodPallets.total.toLocaleString()} Total</span>
                </div>
                <div className="flex h-3 sm:h-4 rounded-full overflow-hidden mb-1">
                  <div 
                    className="bg-primary transition-all duration-500" 
                    style={{ width: `${(fleet.foodPallets.deployed / fleet.foodPallets.total) * 100}%` }}
                    title={`Dispatched: ${fleet.foodPallets.deployed}`}
                  ></div>
                  <div 
                    className="bg-status-green transition-all duration-500" 
                    style={{ width: `${(fleet.foodPallets.ready / fleet.foodPallets.total) * 100}%` }}
                    title={`Warehouse: ${fleet.foodPallets.ready}`}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] sm:text-xs font-data-label text-on-surface-variant">
                  <span>Dispatched: {fleet.foodPallets.deployed.toLocaleString()}</span>
                  <span>Warehouse: {fleet.foodPallets.ready.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
