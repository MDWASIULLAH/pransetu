import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import { InteractiveEOCMap } from './map/InteractiveEOCMap';

export const CommandCenter: React.FC = () => {
  const {
    signals,
    selectedSignalId,
    setSelectedSignalId,
    dispatchTeamToSignal,
    activeCampaign,
    recordDTMF,
    metrics
  } = useEOC();

  const [searchQuery, setSearchQuery] = useState('');
  const [floodZonesActive, setFloodZonesActive] = useState(true);
  const [evacRoutesActive, setEvacRoutesActive] = useState(true);
  const [activeMapType, setActiveMapType] = useState<'dark' | 'satellite'>('dark');

  // Top critical signal recommendation for AI Priority Engine
  const topCriticalSignal = signals.find((s) => s.status === 'Critical') || signals[0];

  const filteredSignals = signals.filter(
    (s) =>
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.loc.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.details.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 md:p-stack-lg max-w-[1600px] mx-auto w-full">
      {/* 1. Metric Ticker (Top) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-gutter mb-stack-sm">
        {/* Metric 1: Active SOS */}
        <div className="bg-surface-container border border-outline-variant p-stack-md flex flex-col relative overflow-hidden group rounded-lg sm:rounded-none">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-error-container"></div>
          <span className="font-data-label text-data-label text-on-surface-variant uppercase tracking-wider mb-2">
            Active SOS
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">{metrics.activeSOSCount}</span>
            <span className="font-data-value text-data-value text-error">
              (Critical: {metrics.criticalCount})
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-error">trending_up</span>
            <span className="font-data-label text-data-label">+4 in last hour</span>
          </div>
        </div>

        {/* Metric 2: Total Affected */}
        <div className="bg-surface-container border border-outline-variant p-stack-md flex flex-col relative rounded-lg sm:rounded-none">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
          <span className="font-data-label text-data-label text-on-surface-variant uppercase tracking-wider mb-2">
            Total Affected (Est)
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">
              {metrics.totalAffectedCount.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px] text-primary">groups</span>
            <span className="font-data-label text-data-label">Across 3 coastal districts</span>
          </div>
        </div>

        {/* Metric 3: Shelters Occupied */}
        <div className="bg-surface-container border border-outline-variant p-stack-md flex flex-col relative rounded-lg sm:rounded-none">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-tertiary"></div>
          <span className="font-data-label text-data-label text-on-surface-variant uppercase tracking-wider mb-2">
            Shelters Occupied
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">
              {metrics.sheltersOccupancyPercent}%
            </span>
          </div>
          <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                metrics.sheltersOccupancyPercent > 85 ? 'bg-error' : 'bg-tertiary'
              }`}
              style={{ width: `${metrics.sheltersOccupancyPercent}%` }}
            ></div>
          </div>
        </div>

        {/* Metric 4: Rescue Teams */}
        <div className="bg-surface-container border border-outline-variant p-stack-md flex flex-col relative rounded-lg sm:rounded-none">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-outline"></div>
          <span className="font-data-label text-data-label text-on-surface-variant uppercase tracking-wider mb-2">
            Rescue Teams
          </span>
          <div className="flex items-baseline gap-2">
            <span className="font-display-lg text-display-lg text-on-surface">
              {metrics.teamsDeployedCount}
              <span className="text-headline-lg text-on-surface-variant">/{metrics.teamsTotalCount}</span>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">local_shipping</span>
            <span className="font-data-label text-data-label">
              {metrics.teamsTotalCount - metrics.teamsDeployedCount} teams on standby
            </span>
          </div>
        </div>
      </div>

      {/* 12-Column Main Canvas Grid */}
      <div className="grid grid-cols-12 gap-gutter">
        {/* 2. Real Interactive Mission Map (Center Left, Large) */}
        <div className="col-span-12 xl:col-span-8 bg-surface-container border border-outline-variant flex flex-col min-h-[480px] lg:min-h-[520px] rounded-lg sm:rounded-none overflow-hidden">
          <div className="border-b border-outline-variant p-3 flex flex-wrap justify-between items-center bg-surface-container-low gap-2 z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">map</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface text-base sm:text-lg font-bold">
                Live Topography &amp; Deployments
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Basemap Switcher */}
              <div className="flex items-center bg-surface-container-highest border border-outline-variant rounded p-0.5">
                <button
                  onClick={() => setActiveMapType('dark')}
                  className={`px-2 py-0.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                    activeMapType === 'dark' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setActiveMapType('satellite')}
                  className={`px-2 py-0.5 text-xs font-bold rounded transition-colors cursor-pointer ${
                    activeMapType === 'satellite' ? 'bg-primary text-on-primary shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  Satellite
                </button>
              </div>

              {/* Vector Layer Toggles */}
              <button
                onClick={() => setFloodZonesActive(!floodZonesActive)}
                className={`px-2.5 sm:px-3 py-1 rounded font-data-label text-data-label flex items-center gap-1 border transition-colors cursor-pointer text-xs ${
                  floodZonesActive
                    ? 'bg-surface-bright border-outline-variant text-on-surface hover:bg-surface-container-highest'
                    : 'bg-surface-container border-outline-variant/40 text-on-surface-variant opacity-60'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">layers</span> Flood Zones
              </button>
              <button
                onClick={() => setEvacRoutesActive(!evacRoutesActive)}
                className={`px-2.5 sm:px-3 py-1 rounded font-data-label text-data-label flex items-center gap-1 transition-colors cursor-pointer text-xs ${
                  evacRoutesActive
                    ? 'bg-primary-container text-primary border border-primary/30'
                    : 'bg-surface-container text-on-surface-variant opacity-60 border border-outline-variant/40'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">ev_station</span> Evac Routes
              </button>
            </div>
          </div>

          {/* Real Interactive Leaflet Map Component */}
          <div className="flex-1 relative bg-surface-dim overflow-hidden min-h-[420px] w-full h-full">
            <InteractiveEOCMap
              mapType={activeMapType}
              showFloodZones={floodZonesActive}
              showRoutes={evacRoutesActive}
              showShelters={true}
              showRescueUnits={true}
              height="100%"
            />
          </div>
        </div>

        {/* 3. SOS Live Stream (Center Right) */}
        <div className="col-span-12 xl:col-span-4 bg-surface-container border border-outline-variant flex flex-col h-[450px] lg:h-[500px] rounded-lg sm:rounded-none overflow-hidden">
          <div className="border-b border-outline-variant p-3 flex justify-between items-center bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">rss_feed</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface text-base font-bold">
                Incoming Signals ({signals.length})
              </h2>
            </div>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
            </span>
          </div>

          {/* Quick Search */}
          <div className="p-2 border-b border-outline-variant/40 bg-surface-container-lowest">
            <div className="flex items-center bg-surface-container px-2 py-1 rounded border border-outline-variant">
              <span className="material-symbols-outlined text-on-surface-variant text-sm mr-1">search</span>
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by ID, district, source..."
                className="bg-transparent text-on-surface text-xs w-full focus:outline-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>

          {/* Signals List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-2">
            {filteredSignals.map((item) => {
              const isSelected = selectedSignalId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedSignalId(item.id)}
                  className={`bg-surface-container-highest border-l-2 ${item.color} p-3 rounded-r cursor-pointer hover:bg-surface-bright transition-colors ${
                    isSelected ? 'ring-1 ring-primary/40 bg-surface-bright shadow-lg' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-data-value text-data-value text-on-surface font-bold">{item.id}</span>
                      <span
                        className={`${item.badgeBg} ${item.badgeText} text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <span className={`font-data-value text-data-value ${item.scoreColor} font-bold`}>
                      Score: {item.score}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="flex flex-col">
                      <span className="font-data-label text-data-label text-on-surface-variant text-[10px]">SOURCE</span>
                      <span className="font-data-value text-data-value text-on-surface text-[12px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">{item.sourceIcon}</span> {item.source}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-data-label text-data-label text-on-surface-variant text-[10px]">EST PEOPLE</span>
                      <span className="font-data-value text-data-value text-on-surface text-[12px]">{item.people}</span>
                    </div>
                  </div>

                  <div className="mt-2 pt-2 border-t border-outline-variant/50 flex justify-between items-center">
                    <div className="font-data-label text-data-label text-on-surface-variant text-[10px] flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">router</span> {item.relay}
                    </div>
                    <div className="font-data-label text-data-label text-primary text-[10px]">
                      Hop Count: {item.hop}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Rescue Priority Engine (Bottom Left) */}
        <div className="col-span-12 xl:col-span-6 bg-surface-container border border-outline-variant p-4 sm:p-stack-md flex flex-col rounded-lg sm:rounded-none">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface text-base font-bold">
                AI Priority Engine
              </h2>
            </div>
            <span className="font-data-label text-data-label text-on-surface-variant border border-outline-variant px-2 py-1 rounded text-xs">
              Top Recommendation
            </span>
          </div>

          <div className="bg-surface-container-highest p-4 rounded border border-outline-variant flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            {/* Score Circle */}
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center rounded-full border-4 border-error-container bg-surface-container shadow-xl">
              <span className="font-display-lg text-3xl sm:text-display-lg text-error font-bold">
                {topCriticalSignal?.score || 94}
              </span>
            </div>

            {/* Factors */}
            <div className="flex-1 flex flex-col gap-2 w-full">
              <div className="flex justify-between items-center border-b border-outline-variant/50 pb-1">
                <span className="font-body-sm text-body-sm text-on-surface text-xs sm:text-sm">
                  Medical Urgency Detected ({topCriticalSignal?.loc})
                </span>
                <span className="font-data-value text-data-value text-error">+40 pts</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/50 pb-1">
                <span className="font-body-sm text-body-sm text-on-surface text-xs sm:text-sm">
                  High Density Cluster ({topCriticalSignal?.people})
                </span>
                <span className="font-data-value text-data-value text-tertiary">+30 pts</span>
              </div>
              <div className="flex justify-between items-center border-b border-outline-variant/50 pb-1">
                <span className="font-body-sm text-body-sm text-on-surface text-xs sm:text-sm">
                  Signal Relay Aging (Unresolved)
                </span>
                <span className="font-data-value text-data-value text-primary">+24 pts</span>
              </div>
              <div className="mt-2">
                <button
                  onClick={() => dispatchTeamToSignal(topCriticalSignal?.id || 'OD-7A92')}
                  className="bg-error-container text-on-error-container font-headline-sm text-xs sm:text-[14px] px-4 py-2 rounded hover:bg-secondary-container transition-colors w-full flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <span className="material-symbols-outlined text-[16px]">send</span>
                  Deploy Team to {topCriticalSignal?.id || 'OD-7A92'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 5. Voice Campaign Status (Bottom Right) */}
        <div className="col-span-12 xl:col-span-6 bg-surface-container border border-outline-variant p-4 sm:p-stack-md flex flex-col rounded-lg sm:rounded-none">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">record_voice_over</span>
              <h2 className="font-headline-sm text-headline-sm text-on-surface text-base font-bold">
                IVR Broadcast Status
              </h2>
            </div>
            <span className="flex items-center gap-1 font-data-label text-data-label text-primary text-xs">
              <span className="material-symbols-outlined text-[16px] animate-spin" style={{ animationDuration: '3s' }}>
                sync
              </span>
              {activeCampaign.status.toUpperCase()}
            </span>
          </div>

          <div className="mb-4">
            <h3 className="font-headline-sm text-body-lg text-on-surface font-bold truncate">
              "{activeCampaign.title}"
            </h3>
            <div className="w-full bg-surface-container-highest h-2.5 rounded-full mt-2 overflow-hidden flex">
              <div
                className="bg-primary h-full transition-all duration-500"
                style={{ width: `${Math.round((activeCampaign.answeredCount / activeCampaign.totalReach) * 100)}%` }}
                title="Answered"
              ></div>
              <div className="bg-outline h-full flex-1" title="Pending"></div>
            </div>
            <div className="flex justify-between mt-1 font-data-label text-data-label text-on-surface-variant text-xs">
              <span>{activeCampaign.totalReach.toLocaleString()} Calls Initiated</span>
              <span>
                {Math.round((activeCampaign.answeredCount / activeCampaign.totalReach) * 100)}% Connection Rate
              </span>
            </div>
          </div>

          {/* DTMF Responses with Click-to-Test */}
          <div className="grid grid-cols-3 gap-2 mt-auto">
            <div
              onClick={() => recordDTMF('1')}
              className="bg-surface-container-highest p-2 rounded text-center border-t-2 border-tertiary cursor-pointer hover:bg-surface-bright transition-colors group"
              title="Click to simulate citizen pressing 1"
            >
              <div className="font-display-lg text-[20px] sm:text-[24px] leading-tight text-on-surface">
                {activeCampaign.safeCount.toLocaleString()}
              </div>
              <div className="font-data-label text-data-label text-on-surface-variant uppercase text-[9px] sm:text-[10px] group-hover:text-tertiary">
                Press 1: Safe
              </div>
            </div>

            <div
              onClick={() => recordDTMF('2')}
              className="bg-surface-container-highest p-2 rounded text-center border-t-2 border-primary cursor-pointer hover:bg-surface-bright transition-colors group"
              title="Click to simulate citizen pressing 2"
            >
              <div className="font-display-lg text-[20px] sm:text-[24px] leading-tight text-on-surface">
                {activeCampaign.foodWaterCount.toLocaleString()}
              </div>
              <div className="font-data-label text-data-label text-on-surface-variant uppercase text-[9px] sm:text-[10px] group-hover:text-primary">
                Press 2: Need Food
              </div>
            </div>

            <div
              onClick={() => recordDTMF('3')}
              className="bg-surface-container-highest p-2 rounded text-center border-t-2 border-error-container cursor-pointer hover:bg-surface-bright transition-colors group"
              title="Click to simulate citizen pressing 3"
            >
              <div className="font-display-lg text-[20px] sm:text-[24px] leading-tight text-error">
                {activeCampaign.medicalCount.toLocaleString()}
              </div>
              <div className="font-data-label text-data-label text-error uppercase text-[9px] sm:text-[10px] font-bold">
                Press 3: Medical
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
