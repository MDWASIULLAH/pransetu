import React, { useState } from 'react';
import { useEOC, type VoiceTriageResult } from '../../context/EOCContext';

export const VoiceTriageTranscriptFeed: React.FC = () => {
  const { voiceTriageResults, dispatchRescueFromTriage, simulateIncomingAITriageCall, addVoiceTriageResult, showToast } = useEOC();

  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'P1_CRITICAL' | 'P2_URGENT' | 'P4_SAFE'>('ALL');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('ALL');
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [micModalOpen, setMicModalOpen] = useState(false);
  const [customSpokenText, setCustomSpokenText] = useState('');
  const [customLanguage, setCustomLanguage] = useState('Standard Odia');
  const [customCitizenName, setCustomCitizenName] = useState('Ananya Mohanty');
  const [customDistrict, setCustomDistrict] = useState('Puri');

  const filteredResults = voiceTriageResults.filter((item) => {
    const matchesPriority = selectedFilter === 'ALL' || item.priority === selectedFilter;
    const matchesLang = selectedLanguage === 'ALL' || item.language.toLowerCase().includes(selectedLanguage.toLowerCase());
    return matchesPriority && matchesLang;
  });

  const toggleAudio = (id: string) => {
    if (playingAudioId === id) {
      setPlayingAudioId(null);
    } else {
      setPlayingAudioId(id);
      setTimeout(() => {
        setPlayingAudioId((curr) => (curr === id ? null : curr));
      }, 5000);
    }
  };

  const handleSimulateCustomMicTriage = () => {
    if (!customSpokenText.trim()) {
      showToast('Please enter or speak a voice statement');
      return;
    }

    const text = customSpokenText.toLowerCase();
    let priority: 'P1_CRITICAL' | 'P2_URGENT' | 'P3_MODERATE' | 'P4_SAFE' = 'P3_MODERATE';
    let threat: 'FLOOD_INUNDATION' | 'ROOF_COLLAPSE' | 'MEDICAL_EMERGENCY' | 'ISOLATED_WITHOUT_FOOD' | 'SAFE_IN_SHELTER' = 'FLOOD_INUNDATION';
    let medical = false;
    let people = 2;
    let urgency: 'IMMEDIATE' | 'HIGH' | 'ROUTINE' | 'NONE' = 'HIGH';

    if (text.includes('safe') || text.includes('ସୁରକ୍ଷିତ') || text.includes('सुरक्षित') || text.includes('shelter')) {
      priority = 'P4_SAFE';
      threat = 'SAFE_IN_SHELTER';
      urgency = 'NONE';
    } else if (text.includes('oxygen') || text.includes('heart') || text.includes('medical') || text.includes('bleeding') || text.includes('ଡାକ୍ତର') || text.includes('चोट')) {
      priority = 'P1_CRITICAL';
      threat = 'MEDICAL_EMERGENCY';
      medical = true;
      urgency = 'IMMEDIATE';
    } else if (text.includes('doob') || text.includes('drowning') || text.includes('paani') || text.includes('roof') || text.includes('ଛାତ') || text.includes('ପାଣି')) {
      priority = 'P1_CRITICAL';
      threat = 'FLOOD_INUNDATION';
      urgency = 'IMMEDIATE';
      people = 4;
    } else if (text.includes('food') || text.includes('water') || text.includes('khana') || text.includes('ଖାଦ୍ୟ') || text.includes('खाना')) {
      priority = 'P2_URGENT';
      threat = 'ISOLATED_WITHOUT_FOOD';
      urgency = 'HIGH';
      people = 3;
    }

    const newResult: VoiceTriageResult = {
      id: `VT-${Math.floor(1000 + Math.random() * 9000)}`,
      callId: `CALL-LIVE-${Math.floor(1000 + Math.random() * 9000)}`,
      citizenName: customCitizenName,
      phone: `+91 ${Math.floor(70000 + Math.random() * 29999)}-${Math.floor(10000 + Math.random() * 89999)}`,
      district: customDistrict,
      locationName: `${customDistrict} Sector 3, Near Landmark`,
      language: customLanguage,
      rawTranscript: customSpokenText,
      translatedTranscript: `[AI Translated] ${customSpokenText}`,
      priority,
      sentiment: priority === 'P1_CRITICAL' ? 'PANIC' : priority === 'P2_URGENT' ? 'DISTRESSED' : 'CALM',
      extractedEntities: {
        peopleCount: people,
        landmark: `${customDistrict} Central Area`,
        threatType: threat,
        medicalNeed: medical,
        evacuationUrgency: urgency,
        coordinates: { lat: 19.8135 + (Math.random() - 0.5) * 0.5, lng: 85.8312 + (Math.random() - 0.5) * 0.5 }
      },
      confidenceScore: 0.96,
      audioDurationSeconds: Math.floor(8 + Math.random() * 15),
      status: 'ANALYZED',
      timestamp: new Date().toISOString()
    };

    addVoiceTriageResult(newResult);
    setMicModalOpen(false);
    setCustomSpokenText('');
    showToast(`🎙️ AI Voice Triage Processed: ${newResult.citizenName} -> ${priority}`);
  };

  return (
    <div className="bg-surface border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm flex flex-col">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-outline-variant/30 bg-surface-container-low flex flex-wrap justify-between items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-error"></span>
          </div>
          <div>
            <h3 className="font-sans font-semibold text-on-surface text-base sm:text-lg flex items-center gap-2">
              AI Voice Triage &amp; Live Transcripts
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-mono">
                Whisper AI + NER v3.2
              </span>
            </h3>
            <p className="text-xs text-on-surface-variant">
              Hyperlocal multilingual voice analysis in Odia, Sambalpuri, Bhojpuri, Hindi &amp; Bengali
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Simulate Live Inbound Call Button */}
          <button
            onClick={simulateIncomingAITriageCall}
            className="px-3 py-1.5 bg-surface-container-highest hover:bg-surface-container text-on-surface border border-outline-variant text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Simulate a real-time incoming citizen distress call"
          >
            <span className="material-symbols-outlined text-[16px] text-primary">phone_in_talk</span>
            Simulate Inbound Call
          </button>

          {/* Test Microphone Live Triage */}
          <button
            onClick={() => setMicModalOpen(true)}
            className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">mic</span>
            Test Live Voice Triage
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-3 border-b border-outline-variant/30 bg-surface flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <span className="text-on-surface-variant font-medium mr-1">Triage Priority:</span>
          {(
            [
              { key: 'ALL', label: 'All Calls' },
              { key: 'P1_CRITICAL', label: '🔴 P1 Critical' },
              { key: 'P2_URGENT', label: '🟠 P2 Urgent' },
              { key: 'P4_SAFE', label: '🟢 P4 Safe' }
            ] as const
          ).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setSelectedFilter(filter.key)}
              className={`px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedFilter === filter.key
                  ? 'bg-primary text-on-primary font-semibold'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-on-surface-variant font-medium">Dialect / Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-surface-container-low border border-outline-variant/50 text-on-surface rounded-md px-2.5 py-1 text-xs focus:outline-none focus:border-primary cursor-pointer"
          >
            <option value="ALL">All Dialects</option>
            <option value="Odia">Odia (Standard &amp; Sambalpuri)</option>
            <option value="Hindi">Hindi / Bhojpuri</option>
            <option value="Bengali">Bengali</option>
            <option value="English">English</option>
          </select>
        </div>
      </div>

      {/* Transcripts List */}
      <div className="divide-y divide-outline-variant/20 max-h-[600px] overflow-y-auto">
        {filteredResults.length === 0 ? (
          <div className="p-12 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2">record_voice_over</span>
            <p className="font-medium">No voice triage logs match the selected filter.</p>
          </div>
        ) : (
          filteredResults.map((triage) => {
            const isP1 = triage.priority === 'P1_CRITICAL';
            const isP2 = triage.priority === 'P2_URGENT';
            const isSafe = triage.priority === 'P4_SAFE';
            const isPlaying = playingAudioId === triage.id;

            return (
              <div
                key={triage.id}
                className={`p-4 sm:p-5 transition-colors hover:bg-surface-container-low ${
                  isP1 ? 'bg-error/5 border-l-4 border-l-error' : isP2 ? 'bg-tertiary/5 border-l-4 border-l-tertiary' : 'border-l-4 border-l-secondary'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-3">
                    {/* Priority Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider flex items-center gap-1 shrink-0 ${
                        isP1
                          ? 'bg-error text-on-error shadow-sm'
                          : isP2
                          ? 'bg-tertiary text-on-tertiary'
                          : isSafe
                          ? 'bg-secondary text-on-secondary'
                          : 'bg-surface-container-high text-on-surface-variant'
                      }`}
                    >
                      {isP1 && <span className="material-symbols-outlined text-[14px]">emergency</span>}
                      {isP2 && <span className="material-symbols-outlined text-[14px]">warning</span>}
                      {isSafe && <span className="material-symbols-outlined text-[14px]">check_circle</span>}
                      {triage.priority.replace('_', ' ')}
                    </span>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-on-surface text-sm sm:text-base">{triage.citizenName}</span>
                        <span className="text-xs text-on-surface-variant font-mono">{triage.phone}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-surface-container-high text-on-surface-variant font-medium">
                          📍 {triage.district}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary font-medium">
                          🗣️ {triage.language}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Landmark: <span className="text-on-surface font-medium">{triage.locationName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span className="text-[11px] text-on-surface-variant font-mono">
                      {new Date(triage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                        triage.status === 'DISPATCHED'
                          ? 'bg-primary/20 text-primary border-primary/30'
                          : triage.status === 'RESOLVED'
                          ? 'bg-secondary/20 text-secondary border-secondary/30'
                          : 'bg-surface-container-high text-on-surface-variant border-outline-variant/50'
                      }`}
                    >
                      {triage.status}
                    </span>
                  </div>
                </div>

                {/* Spoken Transcript Bubble */}
                <div className="my-3 p-3 bg-surface-container-lowest border border-outline-variant/40 rounded-lg">
                  <div className="flex items-center justify-between text-[11px] text-on-surface-variant mb-1 font-medium">
                    <span className="flex items-center gap-1 text-primary">
                      <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                      Spoken Audio Transcript (Whisper AI - {(triage.confidenceScore * 100).toFixed(0)}% Confidence):
                    </span>
                    <button
                      onClick={() => toggleAudio(triage.id)}
                      className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 cursor-pointer font-medium"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {isPlaying ? 'pause_circle' : 'play_circle'}
                      </span>
                      {isPlaying ? 'Playing Audio (16kHz)...' : `Listen Audio (${triage.audioDurationSeconds}s)`}
                    </button>
                  </div>

                  {/* Audio Wave Simulation when playing */}
                  {isPlaying && (
                    <div className="flex items-center gap-1 my-2 py-1 px-2 bg-primary/10 rounded border border-primary/20">
                      {[12, 24, 16, 32, 20, 28, 14, 30, 22, 18, 26, 15, 34, 20, 28, 16, 22, 30, 14].map((h, i) => (
                        <div
                          key={i}
                          className="w-1 bg-primary rounded-full animate-pulse"
                          style={{ height: `${h}px`, animationDelay: `${i * 70}ms` }}
                        />
                      ))}
                      <span className="text-[11px] text-primary ml-2 font-mono font-medium">16kHz Audio Stream</span>
                    </div>
                  )}

                  {/* Native Dialect Transcript */}
                  <p className="text-sm font-medium text-on-surface italic">
                    "{triage.rawTranscript}"
                  </p>

                  {/* English Translation */}
                  {triage.translatedTranscript && (
                    <p className="text-xs text-on-surface-variant mt-1.5 border-t border-outline-variant/20 pt-1.5">
                      <span className="font-semibold text-primary/90">Translation:</span> "{triage.translatedTranscript}"
                    </p>
                  )}
                </div>

                {/* Extracted Named Entities (NER) & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">
                      NER Entities:
                    </span>

                    {/* Headcount */}
                    <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/50 text-on-surface font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">group</span>
                      {triage.extractedEntities.peopleCount} Headcount
                    </span>

                    {/* Threat */}
                    <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/50 text-on-surface font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-error">warning</span>
                      {triage.extractedEntities.threatType.replace(/_/g, ' ')}
                    </span>

                    {/* Medical Need */}
                    {triage.extractedEntities.medicalNeed && (
                      <span className="px-2.5 py-1 rounded bg-error/15 border border-error/30 text-error font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">local_hospital</span>
                        Medical Critical
                      </span>
                    )}

                    {/* Landmark */}
                    <span className="px-2.5 py-1 rounded bg-surface-container-high border border-outline-variant/50 text-on-surface font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px] text-primary">pin_drop</span>
                      {triage.extractedEntities.landmark}
                    </span>
                  </div>

                  {/* Dispatch Action */}
                  <div className="flex items-center gap-2">
                    {(isP1 || isP2) && triage.status !== 'DISPATCHED' && (
                      <button
                        onClick={() => dispatchRescueFromTriage(triage.id)}
                        className="px-3.5 py-1.5 bg-error hover:bg-error/90 text-on-error font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">send</span>
                        Dispatch Emergency Rescue
                      </button>
                    )}

                    {triage.status === 'DISPATCHED' && (
                      <span className="px-3 py-1 bg-primary/15 text-primary border border-primary/30 text-xs font-semibold rounded-lg flex items-center gap-1">
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        Rescue Unit En Route
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Microphone Live Triage Modal */}
      {micModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-surface-container border border-outline-variant/30 p-6 rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">mic</span>
                <h3 className="font-sans text-headline-sm font-bold text-on-surface">
                  Live AI Conversational Triage Test
                </h3>
              </div>
              <button
                onClick={() => setMicModalOpen(false)}
                className="text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <p className="text-xs text-on-surface-variant mt-2 mb-4">
              Speak naturally in any Indian dialect or select a pre-recorded emergency voice sample to test Whisper AI transcription and NER entity extraction.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-on-surface-variant uppercase block mb-1">Citizen Name</label>
                  <input
                    type="text"
                    value={customCitizenName}
                    onChange={(e) => setCustomCitizenName(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant uppercase block mb-1">District</label>
                  <select
                    value={customDistrict}
                    onChange={(e) => setCustomDistrict(e.target.value)}
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="Balasore">Balasore</option>
                    <option value="Puri">Puri</option>
                    <option value="Ganjam">Ganjam</option>
                    <option value="Bhadrak">Bhadrak</option>
                    <option value="Kendrapara">Kendrapara</option>
                    <option value="Cuttack">Cuttack</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">Dialect / Language</label>
                <select
                  value={customLanguage}
                  onChange={(e) => setCustomLanguage(e.target.value)}
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-xs focus:outline-none focus:border-primary cursor-pointer"
                >
                  <option value="Sambalpuri Odia">Sambalpuri Odia (Western Odisha)</option>
                  <option value="Standard Odia">Standard Odia (Coastal)</option>
                  <option value="Bhojpuri / Hindi">Bhojpuri / Hindi</option>
                  <option value="Bengali">Bengali</option>
                  <option value="English">English</option>
                </select>
              </div>

              {/* Quick Sample Presets */}
              <div>
                <span className="text-xs text-on-surface-variant block mb-1.5 font-medium">
                  Select Quick Voice Prompt Sample:
                </span>
                <div className="space-y-1.5">
                  {[
                    {
                      label: '🚨 Flood Roof Rescue (Odia)',
                      text: 'ଆମ ଘର ଭିତରେ ୩ ଫୁଟ ପାଣି ପଶିଗଲାଣି, ଛାତ ଉପରେ ୪ ଜଣ ଲୋକ ଅଛନ୍ତି, ବୁଢ଼ା ବାପାଙ୍କୁ ଅକ୍ସିଜେନ ଦରକାର!'
                    },
                    {
                      label: '⚠️ Broken Bridge Isolation (Bhojpuri/Hindi)',
                      text: 'भैया हमारे घर के पास पुल टूट गया है, 6 लोग फंसे हुए हैं, पीने का पानी खत्म हो गया है।'
                    },
                    {
                      label: '🌊 Sea Surge Embankment Breach (Bengali)',
                      text: 'সমুদ্রের ঢেউ বাঁধ ভেঙে ঘরে ঢুকে গেছে, চালের টিন উড়ে গেছে, ৩ জন বাচ্চা সহ সাহায্য চাই!'
                    },
                    {
                      label: '✅ Safe Shelter Confirmation (Odia)',
                      text: 'ଆମେ ସମସ୍ତେ ସାଇକ୍ଲୋନ ସେଲ୍ଟର ୪ ରେ ପହଞ୍ଚିଗଲୁ, ସମସ୍ତେ ସୁରକ୍ଷିତ ଅଛୁ।'
                    }
                  ].map((sample, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomSpokenText(sample.text)}
                      className="w-full text-left p-2 rounded bg-surface-container-lowest hover:bg-surface-container-high border border-outline-variant/40 text-xs text-on-surface transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-primary block">{sample.label}</span>
                      <span className="text-on-surface-variant text-[11px] truncate block">"{sample.text}"</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Spoken Text Input */}
              <div>
                <label className="text-xs text-on-surface-variant uppercase block mb-1">
                  Citizen Spoken Speech (or Microphone Input)
                </label>
                <textarea
                  rows={3}
                  value={customSpokenText}
                  onChange={(e) => setCustomSpokenText(e.target.value)}
                  placeholder="Speak or paste citizen voice statement here..."
                  className="w-full bg-surface-container-lowest border border-outline-variant rounded p-2 text-on-surface text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-outline-variant">
                <button
                  type="button"
                  onClick={() => setMicModalOpen(false)}
                  className="px-4 py-2 bg-surface border border-outline-variant/30 text-on-surface rounded text-xs hover:bg-surface-container-high cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSimulateCustomMicTriage}
                  className="px-5 py-2 bg-primary hover:bg-primary/90 text-on-primary font-semibold rounded text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Run Whisper + NER Triage
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
