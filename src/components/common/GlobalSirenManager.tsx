import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, VolumeX } from 'lucide-react';
import { useEOC } from '../../context/EOCContext';

export const GlobalSirenManager: React.FC = () => {
  const { activeDisasterAlert, clearDisasterAlert } = useEOC();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const modulationIntervalRef = useRef<number | null>(null);

  // Initialize and play siren
  useEffect(() => {
    if (activeDisasterAlert && !isPlaying) {
      playSiren();
    }
  }, [activeDisasterAlert]);

  // Cleanup on unmount or when cleared
  useEffect(() => {
    if (!activeDisasterAlert && isPlaying) {
      stopSiren();
    }
    return () => {
      stopSiren();
    };
  }, [activeDisasterAlert]);

  const playSiren = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Sweeping piercing siren: alternating between 800Hz and 1200Hz
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      // Fade in quickly
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.1); 

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      // Modulate frequency to create the wailing effect
      let isHigh = false;
      modulationIntervalRef.current = window.setInterval(() => {
        if (oscillatorRef.current && audioContextRef.current) {
          const t = audioContextRef.current.currentTime;
          oscillatorRef.current.frequency.setValueAtTime(isHigh ? 800 : 1200, t);
          isHigh = !isHigh;
        }
      }, 400);

      setIsPlaying(true);
    } catch (err) {
      console.error("Failed to play Web Audio siren. User might need to interact with the document first.", err);
    }
  };

  const stopSiren = () => {
    if (modulationIntervalRef.current) {
      clearInterval(modulationIntervalRef.current);
      modulationIntervalRef.current = null;
    }
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {}
      oscillatorRef.current = null;
    }
    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleAcknowledge = () => {
    stopSiren();
    clearDisasterAlert();
  };

  if (!activeDisasterAlert) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-red-950/80 backdrop-blur-sm p-4 animate-pulse-fast">
      <div className="bg-red-600 text-white rounded-xl shadow-2xl p-8 max-w-2xl w-full border-4 border-red-400 flex flex-col items-center text-center">
        <AlertTriangle className="w-24 h-24 text-white mb-6 animate-bounce" />
        
        <h1 className="text-4xl font-black uppercase tracking-wider mb-2">
          Critical Emergency Broadcast
        </h1>
        
        <div className="bg-white/10 p-6 rounded-lg my-6 w-full shadow-inner border border-red-500">
          <p className="text-2xl font-bold leading-relaxed whitespace-pre-wrap">
            {activeDisasterAlert.text}
          </p>
        </div>

        <div className="flex gap-4 mt-4 w-full">
          <button 
            onClick={handleAcknowledge}
            className="flex-1 bg-white text-red-700 hover:bg-gray-100 font-bold text-xl py-4 px-8 rounded-lg shadow-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
          >
            <VolumeX className="w-6 h-6" />
            Acknowledge & Mute Siren
          </button>
        </div>
        
        <p className="text-red-200 mt-6 text-sm font-medium">
          Automated IVR phone calls have been dispatched to all registered citizens.
        </p>
      </div>
    </div>
  );
};
