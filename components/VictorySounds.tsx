
import { useEffect } from 'react';

export const playTrumpetBlast = async () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      await ctx.resume().catch(() => {});
    }

    const playNote = (freq: number, start: number, duration: number, vol: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + 0.05);
      gain.gain.linearRampToValueAtTime(vol * 0.7, start + duration * 0.5);
      gain.gain.linearRampToValueAtTime(0, start + duration);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(freq * 2.5, start);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    const now = ctx.currentTime;
    // C4, E4, G4, C5 Triumphant Fanfare
    playNote(261.63, now, 0.2, 0.15);           // C4
    playNote(329.63, now + 0.2, 0.2, 0.15);      // E4
    playNote(392.00, now + 0.4, 0.2, 0.15);      // G4
    playNote(523.25, now + 0.6, 1.2, 0.25);      // C5 (Hold)
    
    // Harmony
    playNote(392.00, now + 0.6, 1.2, 0.1);       // G4
    playNote(659.25, now + 0.6, 1.2, 0.1);       // E5
    
  } catch (e) {
    console.warn("Trumpet blast failed:", e);
  }
};

export const VictorySounds: React.FC<{ trigger: boolean }> = ({ trigger }) => {
  useEffect(() => {
    if (trigger) {
      playTrumpetBlast();
    }
  }, [trigger]);

  return null;
};
