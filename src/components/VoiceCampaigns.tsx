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
    <div className="p-4 sm:p-margin-mobile md:p-margin-desktop min-h-screen bg-background text-on-background w-full">
      {/* New Campaign Modal */}
      {newCampaignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-outline-variant p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-rescue-blue text-[24px]">campaign</span>
                <h3 className="font-headline-sm text-headline-sm font-bold text-on-surface">
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
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Campaign Title / Code
                </label>
                <input 
                  type="text" 
                  value={customCampaignName}
                  onChange={(e) => setCustomCampaignName(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-500 rounded p-2 text-on-surface font-data-value text-data-value focus:outline-none focus:border-rescue-blue"
                />
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Target Geographic Polygon
                </label>
                <select 
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-500 rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-rescue-blue cursor-pointer"
                >
                  <option value="Coastal Districts (Balasore, Bhadrak)">Coastal Districts (Balasore, Bhadrak)</option>
                  <option value="Puri & Ganjam Coastal Belt">Puri &amp; Ganjam Coastal Belt (High Inundation)</option>
                  <option value="All Registered EWS Users">All Registered EWS Users (120k+ Subscribers)</option>
                  <option value="Custom Polygon (Map Selection)">Custom Polygon (Map GIS Selection)</option>
                </select>
              </div>

              <div>
                <label className="font-data-label text-data-label text-on-surface-variant uppercase block mb-1">
                  Pre-Recorded Audio / Script
                </label>
                <select 
                  value={ivrScript}
                  onChange={(e) => setIvrScript(e.target.value)}
                  className="w-full bg-[#020617] border border-slate-500 rounded p-2 text-on-surface font-body-sm text-body-sm focus:outline-none focus:border-rescue-blue cursor-pointer"
                >
                  <option value="Cyclone Evacuation Notice v2">Cyclone Evacuation Notice v2 (Odia / Hindi / English)</option>
                  <option value="Post-Disaster Check-in">Post-Disaster Check-in (Press 1 for Safe / 2 for Trapped)</option>
                  <option value="Medical Triage Audio Survey">Medical Triage Audio Survey</option>
                  <option value="Upload Custom Audio...">Upload Custom Audio (.WAV 16kHz)...</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button 
                  type="button"
                  onClick={() => setNewCampaignModal(false)}
                  className="px-4 py-2 bg-surface-bright border border-outline-variant text-on-surface rounded font-data-label text-data-label hover:bg-surface-container-highest cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-rescue-blue hover:bg-blue-700 text-white font-medium rounded flex items-center gap-2 cursor-pointer shadow-md"
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
          <h2 className="font-headline-lg text-headline-lg font-semibold text-on-surface tracking-tight text-xl sm:text-2xl">
            Voice Campaigns
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1 text-xs sm:text-sm">
            Manage and monitor automated IVR broadcasts for early warning and citizen check-ins.
          </p>
        </div>
        <button 
          onClick={() => setNewCampaignModal(true)}
          className="bg-rescue-blue hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded font-medium flex items-center gap-2 transition-colors border border-blue-600 shadow-sm cursor-pointer text-xs sm:text-sm"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Campaign
        </button>
      </header>

      {/* Bento Grid Layout */}
      <div className="bento-grid">
        {/* Running Campaign Detail (Priority Module) */}
        <section className="bento-item-twothird bg-surface-container-high border border-[#334155] rounded-xl relative overflow-hidden flex flex-col shadow-xl">
          <div className={`status-indicator ${activeCampaign.status === 'Running' ? 'bg-rescue-blue' : 'bg-status-orange'}`}></div>
          <div className="p-4 sm:p-5 border-b border-outline-variant flex flex-wrap justify-between items-center bg-surface-bright/50 gap-2">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                {activeCampaign.status === 'Running' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-3 w-3 ${
                  activeCampaign.status === 'Running' ? 'bg-rescue-blue' : 'bg-status-orange'
                }`}></span>
              </span>
              <h3 className="font-headline-sm text-headline-sm font-semibold text-primary text-sm sm:text-base truncate">
                {activeCampaign.id} ({activeCampaign.title})
              </h3>
            </div>
            <span className={`px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide rounded border ${
              activeCampaign.status === 'Running'
                ? 'bg-rescue-blue/20 text-rescue-blue border-rescue-blue/30'
                : 'bg-status-orange/20 text-status-orange border-status-orange/30'
            }`}>
              {activeCampaign.status}
            </span>
          </div>

          <div className="p-4 sm:p-5 flex-1 grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* KPI Cluster */}
            <div className="col-span-1 border-b md:border-b-0 md:border-r border-outline-variant pb-4 md:pb-0 md:pr-4 flex flex-row md:flex-col justify-around md:justify-center gap-4 sm:gap-6">
              <div>
                <p className="font-data-label text-data-label text-on-surface-variant mb-1 text-xs">TOTAL REACH</p>
                <p className="font-display-lg text-2xl sm:text-display-lg text-on-surface leading-none font-bold">
                  {(activeCampaign.totalReach / 1000).toFixed(1)}k
                </p>
              </div>
              <div>
                <p className="font-data-label text-data-label text-on-surface-variant mb-1 text-xs">ANSWER RATE</p>
                <div className="flex items-end gap-2">
                  <p className="font-headline-lg text-xl sm:text-headline-lg text-primary leading-none font-bold">
                    {answerPercent}%
                  </p>
                  <span className="material-symbols-outlined text-status-green text-sm mb-1">trending_up</span>
                </div>
              </div>
            </div>

            {/* Real-time DTMF Tallies */}
            <div className="col-span-3 pl-0 md:pl-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-data-label text-data-label text-on-surface-variant uppercase text-xs">
                    Real-Time DTMF Responses (Press 1/2/3)
                  </h4>
                  <span className="text-xs text-primary font-data-label">Live Ingest</span>
                </div>

                <div className="space-y-4">
                  {/* SAFE */}
                  <div>
                    <div className="flex justify-between items-end mb-1 text-xs">
                      <span className="font-body-sm font-medium flex items-center gap-1.5 text-on-surface">
                        <span className="material-symbols-outlined text-status-green text-sm">check_circle</span>
                        Reported SAFE (Press 1)
                      </span>
                      <span className="font-data-value text-status-green font-bold">
                        {activeCampaign.safeCount.toLocaleString()} ({safePercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-lowest h-3 rounded-full overflow-hidden border border-outline-variant">
                      <div className="bg-status-green h-full transition-all duration-500" style={{ width: `${safePercent}%` }}></div>
                    </div>
                  </div>

                  {/* TRAPPED / NEED HELP */}
                  <div>
                    <div className="flex justify-between items-end mb-1 text-xs">
                      <span className="font-body-sm font-medium flex items-center gap-1.5 text-on-surface">
                        <span className="material-symbols-outlined text-emergency-red text-sm">emergency</span>
                        Reported TRAPPED / RESCUE NEEDED (Press 2)
                      </span>
                      <span className="font-data-value text-emergency-red font-bold">
                        {activeCampaign.trappedCount.toLocaleString()} ({trappedPercent}%)
                      </span>
                    </div>
                    <div className="w-full bg-surface-container-lowest h-3 rounded-full overflow-hidden border border-outline-variant">
                      <div className="bg-emergency-red h-full transition-all duration-500" style={{ width: `${trappedPercent}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Citizen Test Buttons right on the card */}
              <div className="mt-4 pt-3 border-t border-outline-variant/50 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-data-label text-on-surface-variant">Citizen Response Test:</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => recordDTMF('1')}
                    className="px-2.5 py-1 bg-status-green/20 hover:bg-status-green/30 border border-status-green text-status-green rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Press 1 (Safe)
                  </button>
                  <button
                    onClick={() => recordDTMF('2')}
                    className="px-2.5 py-1 bg-emergency-red/20 hover:bg-emergency-red/30 border border-emergency-red text-emergency-red rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Press 2 (Trapped)
                  </button>
                  <button
                    onClick={() => recordDTMF('3')}
                    className="px-2.5 py-1 bg-error-container/40 hover:bg-error-container/60 border border-error-container text-error rounded text-xs font-bold cursor-pointer transition-colors"
                  >
                    + Press 3 (Medical)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#020617] p-3 border-t border-outline-variant flex justify-end gap-3">
            <button 
              onClick={toggleCampaignPause}
              className="px-4 py-1.5 border border-slate-500 text-on-surface text-xs sm:text-sm rounded hover:bg-surface-variant transition-colors cursor-pointer"
            >
              {activeCampaign.status === 'Running' ? 'Pause Campaign' : 'Resume Campaign'}
            </button>
            <button 
              onClick={abortCampaign}
              className="px-4 py-1.5 bg-emergency-red text-white text-xs sm:text-sm font-medium rounded hover:bg-red-700 transition-colors cursor-pointer"
            >
              Abort Campaign
            </button>
          </div>
        </section>

        {/* Quick Actions / Campaign Setup */}
        <section className="bento-item-third bg-surface-container-high border border-[#334155] rounded-xl relative p-4 sm:p-5 flex flex-col shadow-xl">
          <div className="status-indicator bg-slate-600"></div>
          <h3 className="font-headline-sm text-headline-sm font-medium mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
            <span className="material-symbols-outlined text-on-surface-variant">campaign</span>
            Quick Draft
          </h3>

          <div className="space-y-3 sm:space-y-4 flex-1">
            <div>
              <label className="block font-data-label text-data-label text-on-surface-variant mb-1 text-xs">
                TARGET AUDIENCE
              </label>
              <select 
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-[#020617] border border-slate-500 text-on-surface text-xs sm:text-sm rounded py-2 px-3 focus:outline-none focus:border-rescue-blue cursor-pointer"
              >
                <option value="Coastal Districts (Balasore, Bhadrak)">Coastal Districts (Balasore, Bhadrak)</option>
                <option value="Puri & Ganjam Coastal Belt">Puri &amp; Ganjam Coastal Belt</option>
                <option value="All Registered EWS Users">All Registered EWS Users</option>
                <option value="Custom Polygon (Map Selection)">Custom Polygon (Map Selection)</option>
              </select>
            </div>

            <div>
              <label className="block font-data-label text-data-label text-on-surface-variant mb-1 text-xs">
                IVR SCRIPT
              </label>
              <select 
                value={ivrScript}
                onChange={(e) => setIvrScript(e.target.value)}
                className="w-full bg-[#020617] border border-slate-500 text-on-surface text-xs sm:text-sm rounded py-2 px-3 focus:outline-none focus:border-rescue-blue cursor-pointer"
              >
                <option value="Cyclone Evacuation Notice v2">Cyclone Evacuation Notice v2</option>
                <option value="Post-Disaster Check-in">Post-Disaster Check-in</option>
                <option value="Medical Triage Audio Survey">Medical Triage Audio Survey</option>
                <option value="Upload Custom Audio...">Upload Custom Audio...</option>
              </select>
            </div>

            <div>
              <label className="block font-data-label text-data-label text-on-surface-variant mb-1 text-xs">
                SCHEDULE
              </label>
              <input 
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full bg-[#020617] border border-slate-500 text-on-surface text-xs sm:text-sm rounded py-2 px-3 focus:outline-none focus:border-rescue-blue" 
                type="datetime-local"
              />
            </div>
          </div>

          <button 
            onClick={handleQuickDraftSave}
            className="w-full mt-4 px-4 py-2 border border-slate-400 text-on-surface text-xs sm:text-sm rounded hover:bg-surface-variant transition-colors flex justify-center items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">edit_document</span>
            Save &amp; Deploy Draft
          </button>
        </section>

        {/* Recent Campaigns Table */}
        <section className="bento-item-full bg-surface-container-high border border-[#334155] rounded-xl relative overflow-hidden flex flex-col mt-4 shadow-xl">
          <div className="p-4 border-b border-outline-variant bg-surface-bright/30 flex justify-between items-center">
            <h3 className="font-headline-sm text-headline-sm font-medium text-sm sm:text-base">
              Recent Campaigns ({pastCampaigns.length + 1})
            </h3>
            <button 
              onClick={() => showToast('Displaying all past automated voice campaign batches.')}
              className="text-primary hover:text-white text-xs sm:text-sm flex items-center gap-1 transition-colors cursor-pointer"
            >
              View All <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-outline-variant bg-[#020617]/50 text-xs">
                  <th className="p-3 font-data-label text-data-label text-on-surface-variant font-semibold">CAMPAIGN ID</th>
                  <th className="p-3 font-data-label text-data-label text-on-surface-variant font-semibold">STATUS</th>
                  <th className="p-3 font-data-label text-data-label text-on-surface-variant font-semibold">DATE/TIME</th>
                  <th className="p-3 font-data-label text-data-label text-on-surface-variant font-semibold">REACH</th>
                  <th className="p-3 font-data-label text-data-label text-on-surface-variant font-semibold">ANSWER RATE</th>
                  <th className="p-3 font-data-label text-data-label text-on-surface-variant font-semibold">SAFE / TRAPPED</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-xs divide-y divide-outline-variant/40">
                {/* Active Campaign */}
                <tr className="hover:bg-surface-variant/30 transition-colors bg-primary-container/20">
                  <td className="p-3 font-data-value text-data-value text-primary font-bold">
                    {activeCampaign.id} <span className="text-[10px] bg-primary/20 px-1 py-0.5 rounded text-primary">CURRENT</span>
                  </td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                      activeCampaign.status === 'Running' 
                        ? 'bg-rescue-blue/20 text-rescue-blue border-rescue-blue/40' 
                        : 'bg-status-orange/20 text-status-orange border-status-orange/40'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${activeCampaign.status === 'Running' ? 'bg-rescue-blue' : 'bg-status-orange'}`}></span> 
                      {activeCampaign.status}
                    </span>
                  </td>
                  <td className="p-3 text-on-surface-variant font-data-value text-xs">
                    {new Date(activeCampaign.scheduledTime).toLocaleDateString()}
                  </td>
                  <td className="p-3 font-data-value text-data-value">
                    {(activeCampaign.totalReach / 1000).toFixed(1)}k
                  </td>
                  <td className="p-3 font-data-value text-data-value">{answerPercent}%</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2 font-data-value">
                      <span className="text-status-green">{safePercent}%</span>
                      <span className="text-slate-500">/</span>
                      <span className="text-emergency-red">{trappedPercent}%</span>
                    </div>
                  </td>
                </tr>

                {/* Past Campaigns */}
                {pastCampaigns.map((cmp) => {
                  const cmpAnswerPct = cmp.totalReach > 0 ? Math.round((cmp.answeredCount / cmp.totalReach) * 100) : 0;
                  const cmpSafePct = cmp.answeredCount > 0 ? Math.round((cmp.safeCount / cmp.answeredCount) * 100) : 0;
                  const cmpTrappedPct = cmp.answeredCount > 0 ? Math.round((cmp.trappedCount / cmp.answeredCount) * 100) : 0;

                  return (
                    <tr key={cmp.id} className="hover:bg-surface-variant/30 transition-colors">
                      <td className="p-3 font-data-value text-data-value text-primary font-medium">{cmp.id}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-surface-container-highest text-on-surface-variant border border-outline-variant">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span> {cmp.status}
                        </span>
                      </td>
                      <td className="p-3 text-on-surface-variant font-data-value text-xs">{cmp.scheduledTime}</td>
                      <td className="p-3 font-data-value text-data-value">{(cmp.totalReach / 1000).toFixed(1)}k</td>
                      <td className="p-3 font-data-value text-data-value">{cmpAnswerPct}%</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2 font-data-value">
                          <span className="text-status-green">{cmpSafePct}%</span>
                          <span className="text-slate-500">/</span>
                          <span className="text-emergency-red">{cmpTrappedPct}%</span>
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
