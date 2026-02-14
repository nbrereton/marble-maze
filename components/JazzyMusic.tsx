
import React, { useEffect, useRef } from 'react';

export const JazzyMusic: React.FC<{ isPlaying: boolean }> = ({ isPlaying }) => {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isStarted = useRef(false);

  useEffect(() => {
    if (isPlaying && !isStarted.current) {
      startMusic();
      isStarted.current = true;
    } else if (!isPlaying && audioCtxRef.current) {
      audioCtxRef.current.suspend();
    } else if (isPlaying && audioCtxRef.current) {
      audioCtxRef.current.resume();
    }
  }, [isPlaying]);

  const startMusic = () => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContextClass();
    audioCtxRef.current = ctx;

    const playNote = (freq: number, startTime: number, duration: number, volume: number = 0.1) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      gain.gain.setValueAtTime(volume, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const jazzChords = [
      [261.63, 329.63, 392.00, 493.88], // Cmaj7
      [293.66, 349.23, 440.00, 523.25], // Dm7
      [392.00, 493.88, 587.33, 698.46], // G7
    ];

    let beat = 0;
    const loop = () => {
      const now = ctx.currentTime;
      const stepTime = 0.5;

      // Chord stab
      if (beat % 4 === 0) {
        const chord = jazzChords[Math.floor(beat / 4) % jazzChords.length];
        chord.forEach(f => playNote(f, now, 1.5, 0.05));
      }

      // Bass note
      const bassFreqs = [65.41, 73.42, 98.00, 87.31];
      playNote(bassFreqs[Math.floor(beat / 2) % bassFreqs.length], now, 0.4, 0.1);

      // Hi-hat
      const noiseOsc = ctx.createOscillator();
      const noiseGain = ctx.createGain();
      noiseOsc.type = 'square';
      noiseOsc.frequency.setValueAtTime(1000 + Math.random() * 5000, now);
      noiseGain.gain.setValueAtTime(0.02, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noiseOsc.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noiseOsc.start(now);
      noiseOsc.stop(now + 0.05);

      beat++;
      setTimeout(loop, stepTime * 1000);
    };

    loop();
  };

  return null;
};
