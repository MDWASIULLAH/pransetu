import React, { useState } from 'react';
import { useEOC } from '../context/EOCContext';
import { VoiceTriageTranscriptFeed } from './voice/VoiceTriageTranscriptFeed';
import { VoiceLiveDashboard } from './voice/VoiceLiveDashboard';

export const VoiceCampaigns: React.FC = () => {
  const {
    activeCampaign,
    pastCampaigns,
    toggleCampaignPause,
    abortCampaign,
    createCampaign,
    showToast
  } = useEOC();

  const [newCampaignModal, setNewCampaignModal] = useState(false);
  const [customCampaignName, setCustomCampaignName] = useState('AI-TRIAGE-202608-ODISHA-SECTOR-4');
  const [targetAudience, setTargetAudience] = useState('Coastal Districts (Puri, Ganjam, Balasore, Bhadrak)');
  const [voiceModel, setVoiceModel] = useState('Whisper-Large-v3 + Indian Dialects NER');
  const [aiGreetingPrompt, setAiGreetingPrompt] = useState(
    'ଜୟ ଜଗନ୍ନାଥ / नमस्कार। PRANSETU Emergency Response Centre से बोल रहे हैं। क्या आप और आपका परिवार सुरक्षित हैं? कृपया अपनी स्थिति बताएं।'
  );
  const [scheduleTime, setScheduleTime] = useState(new Date().toISOString().slice(0, 16));

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setNewCampaignModal(false);
    createCampaign({
      title: customCampaignName,
      audience: targetAudience,
      script: `AI Conversational Voice Triage (${voiceModel})`,
      scheduledTime: scheduleTime,
      mode: 'AI_TRIAGE'
    });
  };

  const answerPercent =
    activeCampaign.totalReach > 0
      ? Math.round((activeCampaign.answeredCount / activeCampaign.totalReach) * 100)
      : 0;

  const safePercent =
    activeCampaign.answeredCount > 0
      ? Math.round(((activeCampaign.p4SafeCount || activeCampaign.safeCount) / activeCampaign.answeredCount) * 100)
      : 0;

  const p1Percent =
    activeCampaign.answeredCount > 0
      ? Math.round(((activeCampaign.p1CriticalCount || activeCampaign.trappedCount) / activeCampaign.answeredCount) * 100)
      : 0;

  const p2Percent =
    activeCampaign.answeredCount > 0
      ? Math.round(((activeCampaign.p2UrgentCount || activeCampaign.foodWaterCount) / activeCampaign.answeredCount) * 100)
      : 0;

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-background text-on-background w-full space-y-6">
      {/* New AI Campaign Modal */}
      {newCampaignModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">smart_toy</span>
                <h3 className="font-sans text-headline-sm font-bold text-on-surface">
                  Launch AI Conversational Voice Triage
                </h3>
              </div>
              <button
                onClick={() => setNewCampaignModal(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mt-2 mb-4">
              Launches an autonomous AI voice outbound dialer that converses with citizens in local regional dialects, extracts headcount &amp; landmarks via Whisper + NER, and calculates triage priority without requiring keypad inputs.
            </p>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  Campaign Title / Code
                </label>
                <input
                  type="text"
                  value={customCampaignName}
                  onChange={(e) => setCustomCampaignName(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface tabular-nums text-sm focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  Target Geographic Perimeter
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Coastal Districts (Puri, Ganjam, Balasore, Bhadrak)">Coastal Districts (Puri, Ganjam, Balasore, Bhadrak)</option>
                  <option value="Mahanadi Basin Inundation Zone (Cuttack, Kendrapara)">Mahanadi Basin Inundation Zone (Cuttack, Kendrapara)</option>
                  <option value="All Registered EWS Users (120k+ Subscribers)">All Registered EWS Users (120k+ Subscribers)</option>
                  <option value="Custom GIS Polygon (Map Selection)">Custom GIS Polygon (Map Selection)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  AI Speech Engine &amp; Dialect Support
                </label>
                <select
                  value={voiceModel}
                  onChange={(e) => setVoiceModel(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-sm focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Whisper-Large-v3 + Indian Dialects NER">Whisper-Large-v3 + Indian Dialects NER (Sambalpuri, Odia, Bhojpuri, Bengali, Hindi)</option>
                  <option value="Bhashini Multilingual ASR (Govt of India)">Bhashini Multilingual ASR (Govt of India)</option>
                  <option value="Fast Conformer Realtime ASR v2">Fast Conformer Realtime ASR v2</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  AI Conversational Opening Prompt (Spoken by Agent)
                </label>
                <textarea
                  rows={3}
                  value={aiGreetingPrompt}
                  onChange={(e) => setAiGreetingPrompt(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  Scheduled Launch Time
                </label>
                <input
                  type="datetime-local"
                  value={scheduleTime}
                  onChange={(e) => setScheduleTime(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-xs focus:outline-none focus:border-primary"
                />
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
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[18px]">smart_toy</span>
                  Launch AI Voice Triage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header Section */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-2xl">record_voice_over</span>
            </span>
            <div>
              <h2 className="font-sans font-semibold text-on-surface tracking-tight text-xl sm:text-2xl flex items-center gap-2">
                AI Conversational Voice Triage
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
                  Beyond Static IVR
                </span>
              </h2>
              <p className="font-sans text-on-surface-variant text-xs sm:text-sm">
                Natural speech AI agent conversing in Sambalpuri Odia, Bhojpuri &amp; regional dialects &mdash; Whisper AI + NER entity extraction
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setNewCampaignModal(true)}
            className="bg-primary hover:bg-primary/90 text-on-primary px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-colors cursor-pointer text-sm shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New AI Voice Campaign
          </button>
        </div>
      </header>

      {/* Key AI Triage Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Reach */}
        <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-on-surface-variant">Total Campaign Reach</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-on-surface">{(activeCampaign.totalReach / 1000).toFixed(1)}k</span>
            <span className="text-xs text-on-surface-variant font-mono">Subscribers</span>
          </div>
        </div>

        {/* AI Answer & Transcribe Rate */}
        <div className="p-4 rounded-xl bg-surface border border-outline-variant/30 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-medium text-primary flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">psychology</span>
            AI Transcribe Rate
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-primary">{answerPercent}%</span>
            <span className="text-xs text-secondary flex items-center font-medium">
              <span className="material-symbols-outlined text-[14px]">trending_up</span> 98.4% ASR
            </span>
          </div>
        </div>

        {/* P1 Critical Trapped */}
        <div className="p-4 rounded-xl bg-error/5 border border-error/20 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-error flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">emergency</span>
            P1 Critical (Immediate Rescue)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-error">
              {(activeCampaign.p1CriticalCount || activeCampaign.trappedCount).toLocaleString()}
            </span>
            <span className="text-xs text-error font-medium">{p1Percent}% of calls</span>
          </div>
        </div>

        {/* P2 Urgent Supplies */}
        <div className="p-4 rounded-xl bg-tertiary/5 border border-tertiary/20 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-tertiary flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            P2 Urgent (Supplies/Water)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-tertiary">
              {(activeCampaign.p2UrgentCount || activeCampaign.foodWaterCount).toLocaleString()}
            </span>
            <span className="text-xs text-tertiary font-medium">{p2Percent}% of calls</span>
          </div>
        </div>

        {/* P4 Confirmed Safe */}
        <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-secondary flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">check_circle</span>
            P4 Confirmed Safe
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-secondary">
              {(activeCampaign.p4SafeCount || activeCampaign.safeCount).toLocaleString()}
            </span>
            <span className="text-xs text-secondary font-medium">{safePercent}% of calls</span>
          </div>
        </div>
      </div>

      {/* Main Content Grid: Live Triage Feed (Priority) + Live Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live AI Voice Triage Transcript & NER Extraction Feed */}
        <div className="lg:col-span-2 space-y-6">
          <VoiceTriageTranscriptFeed />

          {/* Running Campaign Live Telemetry */}
          {activeCampaign.status === 'Running' && (
            <VoiceLiveDashboard campaignId={activeCampaign.id} />
          )}
        </div>

        {/* Right 1 Col: Campaign Controls & Linguistic Engine */}
        <div className="space-y-6">
          {/* Active Campaign Status Card */}
          <section className="bg-surface border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-outline-variant/30 pb-3">
              <h3 className="font-semibold text-on-surface text-base flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[20px]">campaign</span>
                Active Campaign
              </h3>
              <span
                className={`px-2.5 py-1 text-xs font-semibold rounded-md border ${
                  activeCampaign.status === 'Running'
                    ? 'bg-primary/10 text-primary border-primary/20'
                    : 'bg-tertiary/10 text-tertiary border-tertiary/20'
                }`}
              >
                {activeCampaign.status}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-on-surface-variant block">Campaign Name:</span>
                <span className="font-semibold text-on-surface text-sm">{activeCampaign.title}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">Target Area:</span>
                <span className="text-on-surface font-medium">{activeCampaign.audience}</span>
              </div>
              <div>
                <span className="text-on-surface-variant block">AI Model:</span>
                <span className="text-primary font-mono font-medium">{activeCampaign.script}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-outline-variant/30 flex gap-2">
              <button
                onClick={toggleCampaignPause}
                className="flex-1 py-2 px-3 border border-outline-variant/50 text-on-surface text-xs font-medium rounded-lg hover:bg-surface-container-high transition-colors cursor-pointer"
              >
                {activeCampaign.status === 'Running' ? 'Pause Campaign' : 'Resume Campaign'}
              </button>
              <button
                onClick={abortCampaign}
                className="py-2 px-3 bg-error/10 text-error border border-error/20 text-xs font-semibold rounded-lg hover:bg-error/20 transition-colors cursor-pointer"
              >
                Abort
              </button>
            </div>
          </section>

          {/* Dialect Recognition & NER Intelligence Card */}
          <section className="bg-surface border border-outline-variant/30 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-semibold text-on-surface text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">translate</span>
              Supported Dialects &amp; NER
            </h3>

            <div className="space-y-2.5 text-xs">
              {[
                { dialect: 'Sambalpuri Odia', share: '38%', accuracy: '97.2%' },
                { dialect: 'Standard Coastal Odia', share: '32%', accuracy: '99.1%' },
                { dialect: 'Bhojpuri / Hindi', share: '18%', accuracy: '98.5%' },
                { dialect: 'Bengali (Coastal Ganjam)', share: '12%', accuracy: '96.8%' }
              ].map((d, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-surface-container-low border border-outline-variant/30 flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-on-surface block">{d.dialect}</span>
                    <span className="text-[11px] text-on-surface-variant">NER Accuracy: {d.accuracy}</span>
                  </div>
                  <span className="font-mono font-semibold text-primary">{d.share}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-primary/5 border border-primary/15 rounded-lg text-xs text-on-surface-variant">
              <span className="font-semibold text-primary block mb-1">💡 Zero Illiteracy Barrier</span>
              Citizens simply speak naturally. Whisper AI transcribes dialect phonetics while NER parses landmarks and headcounts automatically.
            </div>
          </section>
        </div>
      </div>

      {/* Recent Campaigns History Table */}
      <section className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-outline-variant/30 bg-surface-container-low flex justify-between items-center">
          <h3 className="font-semibold text-base text-on-surface">
            Campaign Audit History <span className="text-on-surface-variant font-normal text-sm ml-1">({pastCampaigns.length + 1})</span>
          </h3>
          <button
            onClick={() => showToast('Displaying all historical AI Voice Triage logs.')}
            className="text-primary hover:text-primary/80 font-medium text-xs flex items-center gap-1 transition-colors cursor-pointer"
          >
            View All Logs <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant/30 bg-surface text-[11px]">
                <th className="p-3.5 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Campaign ID</th>
                <th className="p-3.5 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Mode</th>
                <th className="p-3.5 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Status</th>
                <th className="p-3.5 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">Reach</th>
                <th className="p-3.5 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">AI Transcribed</th>
                <th className="p-3.5 font-sans text-on-surface-variant font-semibold uppercase tracking-wider">P1 Critical / P2 Urgent / P4 Safe</th>
              </tr>
            </thead>
            <tbody className="font-sans text-xs divide-y divide-outline-variant/20">
              {/* Active Campaign */}
              <tr className="hover:bg-surface-container-low transition-colors bg-primary/5 font-medium">
                <td className="p-3.5 font-semibold text-primary">
                  {activeCampaign.id} <span className="text-[10px] font-bold bg-primary/20 px-1.5 py-0.5 rounded ml-1.5">ACTIVE</span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono text-[10px]">
                    AI_CONVERSATIONAL
                  </span>
                </td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
                    {activeCampaign.status}
                  </span>
                </td>
                <td className="p-3.5 text-on-surface">{(activeCampaign.totalReach / 1000).toFixed(1)}k</td>
                <td className="p-3.5 text-primary font-semibold">{answerPercent}% (ASR 98.4%)</td>
                <td className="p-3.5">
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="text-error font-semibold">{activeCampaign.p1CriticalCount || activeCampaign.trappedCount} P1</span>
                    <span className="text-on-surface-variant">/</span>
                    <span className="text-tertiary font-semibold">{activeCampaign.p2UrgentCount || activeCampaign.foodWaterCount} P2</span>
                    <span className="text-on-surface-variant">/</span>
                    <span className="text-secondary font-semibold">{activeCampaign.p4SafeCount || activeCampaign.safeCount} P4</span>
                  </div>
                </td>
              </tr>

              {/* Past Campaigns */}
              {pastCampaigns.map((cmp) => {
                const cmpAnswerPct = cmp.totalReach > 0 ? Math.round((cmp.answeredCount / cmp.totalReach) * 100) : 0;
                return (
                  <tr key={cmp.id} className="hover:bg-surface-container-low transition-colors bg-surface">
                    <td className="p-3.5 font-medium text-on-surface">{cmp.id}</td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono ${
                        cmp.mode === 'AI_TRIAGE' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-surface-container-high text-on-surface-variant border-outline-variant/40'
                      }`}>
                        {cmp.mode || 'AI_TRIAGE'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[11px] bg-surface-container-high text-on-surface-variant border border-outline-variant/50">
                        {cmp.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-on-surface">{(cmp.totalReach / 1000).toFixed(1)}k</td>
                    <td className="p-3.5 text-on-surface">{cmpAnswerPct}%</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="text-error">{cmp.p1CriticalCount ?? cmp.trappedCount} P1</span>
                        <span className="text-on-surface-variant">/</span>
                        <span className="text-tertiary">{cmp.p2UrgentCount ?? cmp.foodWaterCount} P2</span>
                        <span className="text-on-surface-variant">/</span>
                        <span className="text-secondary">{cmp.p4SafeCount ?? cmp.safeCount} P4</span>
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
  );
};
