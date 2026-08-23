import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';

export const VoiceCampaigns: React.FC = () => {
  const {
    activeCampaign,
    pastCampaigns,
    toggleCampaignPause,
    abortCampaign,
    createCampaign,
    recordDTMF,
    showToast
  } = useEOC();

  const [newCampaignModal, setNewCampaignModal] = useState(false);
  const [customCampaignName, setCustomCampaignName] = useState('CAMPAIGN-202608-B (ODISHA SECTOR 4)');
  const [targetAudience, setTargetAudience] = useState('Coastal Districts (Balasore, Bhadrak)');
  const [ivrScript, setIvrScript] = useState('Cyclone Evacuation Notice v2');
  const [scheduleTime, setScheduleTime] = useState('2026-08-20T14:30');

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setNewCampaignModal(false);
    createCampaign({
      title: customCampaignName,
      audience: targetAudience,
      script: ivrScript,
      scheduledTime: scheduleTime
    });
  };

  const handleQuickDraftSave = () => {
    createCampaign({
      title: `DRAFT - ${ivrScript}`,
      audience: targetAudience,
      script: ivrScript,
      scheduledTime: scheduleTime
    });
  };

  const answerPercent =
    activeCampaign.totalReach > 0
      ? Math.round((activeCampaign.answeredCount / activeCampaign.totalReach) * 100)
      : 0;

  const safePercent =
    activeCampaign.answeredCount > 0
      ? Math.round((activeCampaign.safeCount / activeCampaign.answeredCount) * 100)
      : 0;

  const trappedPercent =
    activeCampaign.answeredCount > 0
      ? Math.round((activeCampaign.trappedCount / activeCampaign.answeredCount) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-background text-on-background w-full">
      {/* New Campaign Modal */}
      {newCampaignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-xl w-full max-w-lg shadow-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rescue-blue text-[24px]">campaign</span>
                <h3 className="font-sans text-headline-sm font-bold text-on-surface">
                  Launch Automated Voice Campaign
                </h3>
              </div>
              <button 
                onClick={() => setNewCampaignModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateCampaign} className="mt-4 space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  Campaign Title / Code
                </label>
                <input 
                  type="text" 
                  value={customCampaignName}
                  onChange={(e) => setCustomCampaignName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface tabular-nums text-sm focus:outline-none focus:border-rescue-blue"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  Target Geographic Polygon
                </label>
                <select 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-sm focus:outline-none focus:border-rescue-blue cursor-pointer"
                >
                  <option value="Coastal Districts (Balasore, Bhadrak)">Coastal Districts (Balasore, Bhadrak)</option>
                  <option value="Puri & Ganjam Coastal Belt">Puri &amp; Ganjam Coastal Belt (High Inundation)</option>
                  <option value="All Registered EWS Users">All Registered EWS Users (120k+ Subscribers)</option>
                  <option value="Custom Polygon (Map Selection)">Custom Polygon (Map GIS Selection)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  Pre-Recorded Audio / Script
                </label>
                <select 
                  value={ivrScript}
                  onChange={(e) => setIvrScript(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-sm focus:outline-none focus:border-rescue-blue cursor-pointer"
                >
                  <option value="Cyclone Evacuation Notice v2">Cyclone Evacuation Notice v2 (Odia / Hindi / English)</option>
                  <option value="Post-Disaster Check-in">Post-disaster check-in (press 1 safe, 2 supplies, 3 trapped, 4 medical)</option>
                  <option value="Medical Triage Audio Survey">Medical Triage Audio Survey</option>
                  <option value="Upload Custom Audio...">Upload Custom Audio (.WAV 16kHz)...</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button 
                  type="button"
                  onClick={() => setNewCampaignModal(false)}
                  className="px-4 py-2 bg-surface border border-outline-variant/30 text-on-surface rounded text-xs hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-medium rounded flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">record_voice_over</span>
                  Start Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="font-sans font-semibold text-on-surface tracking-tight text-xl sm:text-2xl">
            Voice Campaigns
          </h2>
          <p className="font-sans text-on-surface-variant mt-1 text-sm">
            Manage and monitor automated IVR broadcasts for early warning and citizen check-ins.
          </p>
        </div>
        <button 
          onClick={() => setNewCampaignModal(true)}
          className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors cursor-pointer text-sm shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Campaign
        </button>
      </header>

      {/* Campaign detail takes two thirds, draft panel one, table spans the row.
          These used to be bento-item-* classes that were never written, so the
          whole thing rendered as one stacked column. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Running Campaign Detail (Priority Module) */}
        <section className="lg:col-span-2 bg-surface border border-outline-variant/30 rounded-xl relative overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 sm:p-5 border-b border-outline-variant/30 flex flex-wrap justify-between items-center bg-surface-container-low gap-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                {activeCampaign.status === 'Running' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                  activeCampaign.status === 'Running' ? 'bg-primary' : 'bg-tertiary'
                }`}></span>
              </span>
              <h3 className="font-sans font-semibold text-primary text-sm sm:text-base truncate">
                {activeCampaign.id} <span className="text-on-surface-variant font-normal">({activeCampaign.title})</span>
              </h3>
            </div>
            <span className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
              activeCampaign.status === 'Running'
                ? 'bg-primary/10 text-on-primary-container border-primary/20'
                : 'bg-tertiary/10 text-on-tertiary-container border-tertiary/20'
            }`}>
              {activeCampaign.status}
            </span>
          </div>

          <div className="p-4 sm:p-5 flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* KPI Cluster */}
            <div className="col-span-1 border-b md:border-b-0 md:border-r border-outline-variant/30 pb-4 md:pb-0 md:pr-4 flex flex-row md:flex-col justify-around md:justify-center gap-6">
              <div>
                <p className="font-sans text-on-surface-variant font-medium mb-1 text-xs">Total Reach</p>
                <p className="font-sans text-2xl text-on-surface leading-none font-semibold">
                  {(activeCampaign.totalReach / 1000).toFixed(1)}k
                </p>
              </div>
              <div>
                <p className="font-sans text-on-surface-variant font-medium mb-1 text-xs">Answer Rate</p>
                <div className="flex items-end gap-1.5">
                  <p className="font-sans text-2xl text-primary leading-none font-semibold">
                    {answerPercent}%
                  </p>
                  <span className="material-symbols-outlined text-secondary text-sm mb-0.5">trending_up</span>
                </div>
              </div>
            </div>

            {/* Real-time DTMF Tallies */}
            <div className="col-span-3 pl-0 md:pl-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h4 className="font-sans text-on-surface-variant font-medium text-xs">
                    Real-Time Responses
                  </h4>
                  <span className="text-[10px] bg-surface-container-low border border-outline-variant/30 text-on-surface-variant px-2 py-0.5 rounded-md font-semibold">Live Ingest</span>
                </div>

                <div className="space-y-4">
                  {/* SAFE */}
                  <div>
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                      <span className="font-sans font-medium flex items-center gap-1.5 text-on-surface">
                        <span className="material-symbols-outlined text-on-surface text-[14px]">check_circle</span>
                        Reported safe (press 1)
                      </span>
                      <span className="font-sans text-on-surface font-semibold">
                        {activeCampaign.safeCount.toLocaleString()} <span className="text-on-surface-variant">({safePercent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary/80 h-full transition-all duration-500" style={{ width: `${safePercent}%` }}></div>
                    </div>
                  </div>

                  {/* TRAPPED / NEED HELP */}
                  <div>
                    <div className="flex justify-between items-end mb-1.5 text-xs">
                      <span className="font-sans font-medium flex items-center gap-1.5 text-on-surface">
                        <span className="material-symbols-outlined text-on-surface-variant text-[14px]">emergency</span>
                        Trapped (press 3)
                      </span>
                      <span className="font-sans text-on-surface font-semibold">
                        {activeCampaign.trappedCount.toLocaleString()} <span className="text-on-surface-variant">({trappedPercent}%)</span>
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-lowest h-2 rounded-full overflow-hidden">
                      <div className="bg-primary/40 h-full transition-all duration-500" style={{ width: `${trappedPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Citizen Test Buttons right on the card */}
              <div className="mt-5 pt-3 flex flex-wrap items-center gap-3">
                <span className="text-[11px] text-on-surface-variant font-medium">Simulate a keypress:</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: '1' as const, label: 'Safe' },
                    { key: '2' as const, label: 'Supplies' },
                    { key: '3' as const, label: 'Trapped' },
                    { key: '4' as const, label: 'Medical' }
                  ].map((k) => (
                    <button
                      key={k.key}
                      onClick={() => recordDTMF(k.key)}
                      className="px-3 py-1.5 bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/50 text-on-surface rounded-lg text-xs transition-colors cursor-pointer"
                    >
                      {k.key} &middot; {k.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-3 border-t border-outline-variant/30 flex justify-end gap-3">
            <button 
              onClick={toggleCampaignPause}
              className="px-4 py-2 border border-outline-variant/50 text-on-surface text-sm rounded-lg hover:bg-surface-container-lowest transition-colors cursor-pointer font-medium"
            >
              {activeCampaign.status === 'Running' ? 'Pause Campaign' : 'Resume Campaign'}
            </button>
            <button 
              onClick={abortCampaign}
              className="px-4 py-2 bg-error/10 text-on-error-container border border-error/20 text-sm font-semibold rounded-lg hover:bg-error/20 transition-colors cursor-pointer"
            >
              Abort Campaign
            </button>
          </div>
        </section>

        {/* Quick Actions / Campaign Setup */}
        <section className="bg-surface border border-outline-variant/30 rounded-xl relative p-5 flex flex-col shadow-sm">
          <h3 className="font-sans font-semibold mb-4 flex items-center gap-2 text-base text-on-surface">
            <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
            Quick Draft
          </h3>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block font-sans text-on-surface-variant font-medium mb-1.5 text-xs">
                Target Audience
              </label>
              <select 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-surface border border-outline-variant/50 text-on-surface text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 cursor-pointer"
              >
                <option value="Coastal Districts (Balasore, Bhadrak)">Coastal Districts (Balasore, Bhadrak)</option>
                <option value="Puri & Ganjam Coastal Belt">Puri &amp; Ganjam Coastal Belt</option>
                <option value="All Registered EWS Users">All Registered EWS Users</option>
                <option value="Custom Polygon (Map Selection)">Custom Polygon (Map Selection)</option>
              </select>
            </div>

            <div>
              <label className="block font-sans text-on-surface-variant font-medium mb-1.5 text-xs">
                IVR Script
              </label>
              <select 
                value={ivrScript}
                onChange={(e) => setIvrScript(e.target.value)}
                className="w-full bg-surface border border-outline-variant/50 text-on-surface text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 cursor-pointer"
              >
                <option value="Cyclone Evacuation Notice v2">Cyclone Evacuation Notice v2</option>
                <option value="Post-Disaster Check-in">Post-Disaster Check-in</option>
                <option value="Medical Triage Audio Survey">Medical Triage Audio Survey</option>
                <option value="Upload Custom Audio...">Upload Custom Audio...</option>
              </select>
            </div>

            <div>
              <label className="block font-sans text-on-surface-variant font-medium mb-1.5 text-xs">
                Schedule
              </label>
              <input 
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-surface border border-outline-variant/50 text-on-surface text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50" 
                type="datetime-local"
              />
            </div>
          </div>

          <button 
            onClick={handleQuickDraftSave}
            className="w-full mt-6 px-4 py-2.5 border border-outline-variant/50 text-on-surface text-sm font-semibold rounded-lg hover:bg-surface-container-lowest transition-colors flex justify-center items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">edit_document</span>
            Save &amp; Deploy Draft
          </button>
        </section>

        {/* Recent Campaigns Table */}
        <section className="lg:col-span-3 bg-surface border border-outline-variant/30 rounded-xl relative overflow-hidden flex flex-col shadow-sm">
          <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center">
            <h3 className="font-sans font-semibold text-base text-on-surface">
              Recent Campaigns <span className="text-on-surface-variant font-normal text-sm ml-1">({pastCampaigns.length + 1})</span>
            </h3>
            <button 
              onClick={() => showToast('Displaying all past automated voice campaign batches.')}
              className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-1 transition-colors cursor-pointer"
            >
              View All <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant/30 bg-surface text-[11px]">
                  <th className="p-4 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Campaign ID</th>
                  <th className="p-4 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Status</th>
                  <th className="p-4 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Date/Time</th>
                  <th className="p-4 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Reach</th>
                  <th className="p-4 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Answer Rate</th>
                  <th className="p-4 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Safe / Trapped</th>
                </tr>
              </thead>
              <tbody className="font-sans text-sm divide-y divide-outline-variant/20">
                {/* Active Campaign */}
                <tr className="hover:bg-surface-container-low transition-colors bg-primary/5">
                  <td className="p-4 font-semibold text-on-primary-container">
                    {activeCampaign.id} <span className="text-[10px] font-bold bg-primary/20 px-1.5 py-0.5 rounded ml-2">CURRENT</span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                      activeCampaign.status === 'Running' 
                        ? 'bg-primary/10 text-on-primary-container border-primary/20' 
                        : 'bg-tertiary/10 text-on-tertiary-container border-tertiary/20'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeCampaign.status === 'Running' ? 'bg-primary' : 'bg-tertiary'}`}></span> 
                      {activeCampaign.status}
                    </span>
                  </td>
                  <td className="p-4 text-on-surface-variant">
                    {new Date(activeCampaign.scheduledTime).toLocaleDateString()}
                  </td>
                  <td className="p-4 font-medium text-on-surface">
                    {(activeCampaign.totalReach / 1000).toFixed(1)}k
                  </td>
                  <td className="p-4 font-medium text-on-surface">{answerPercent}%</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 font-medium tabular-nums">
                      {/* The current-campaign row carries a bg-primary/5 wash, which pushes
                          plain text-error to 4.44:1 in dark. Both halves move to their
                          on-container inks so the pair stays a matched set either way. */}
                      <span className="text-on-secondary-container">{safePercent}%</span>
                      <span className="text-on-surface-variant">/</span>
                      <span className="text-on-error-container">{trappedPercent}%</span>
                    </div>
                  </td>
                </tr>

                {/* Past Campaigns */}
                {pastCampaigns.map((cmp) => {
                  const cmpAnswerPct = cmp.totalReach > 0 ? Math.round((cmp.answeredCount / cmp.totalReach) * 100) : 0;
                  const cmpSafePct = cmp.answeredCount > 0 ? Math.round((cmp.safeCount / cmp.answeredCount) * 100) : 0;
                  const cmpTrappedPct = cmp.answeredCount > 0 ? Math.round((cmp.trappedCount / cmp.answeredCount) * 100) : 0;

                  return (
                    <tr key={cmp.id} className="hover:bg-surface-container-low transition-colors bg-surface">
                      <td className="p-4 font-medium text-on-surface">{cmp.id}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-surface-container-lowest text-on-surface-variant border border-outline-variant/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-outline"></span> {cmp.status}
                        </span>
                      </td>
                      <td className="p-4 text-on-surface-variant text-[13px]">{cmp.scheduledTime}</td>
                      <td className="p-4 text-on-surface">{(cmp.totalReach / 1000).toFixed(1)}k</td>
                      <td className="p-4 text-on-surface">{cmpAnswerPct}%</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-on-secondary-container">{cmpSafePct}%</span>
                          <span className="text-on-surface-variant">/</span>
                          <span className="text-on-error-container">{cmpTrappedPct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};
