// Zero-dependency sound synthesizer using HTML5 Web Audio API

export function playNotificationSound(type: string = 'bell', volume: number = 0.5) {
  if (typeof window === 'undefined') return;

  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;

    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    // Smooth fade-in to prevent audio pops
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + 0.02);

    if (type === 'bell') {
      // High-pitched bright decaying bell sound (~0.6s)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5 note
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.6); // Decays to E4
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'chime') {
      // Gentle double-tone chime (~0.45s)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5 note
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5 note
      gain.gain.setValueAtTime(volume, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'beep') {
      // Polite double digital beep (~0.22s)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.setValueAtTime(0, now + 0.08);
      
      gain.gain.setValueAtTime(volume, now + 0.13);
      gain.gain.setValueAtTime(0, now + 0.21);
      
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'siren') {
      // Sweeping frequency alert sound (~0.6s)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(350, now);
      osc.frequency.linearRampToValueAtTime(650, now + 0.15);
      osc.frequency.linearRampToValueAtTime(350, now + 0.3);
      osc.frequency.linearRampToValueAtTime(650, now + 0.45);
      osc.frequency.linearRampToValueAtTime(350, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } 
    // --- NEW LONG DURATION TONES (2 - 3 SECONDS) ---
    else if (type === 'melody') {
      // Melodic arpeggio chime (C5 - E5 - G5 - C6) over 2.2 seconds (gorgeous announcement style)
      const playTone = (freq: number, startOffset: number, toneDuration: number) => {
        const oNode = ctx.createOscillator();
        const gNode = ctx.createGain();
        oNode.connect(gNode);
        gNode.connect(ctx.destination);
        
        oNode.type = 'triangle';
        oNode.frequency.setValueAtTime(freq, now + startOffset);
        
        gNode.gain.setValueAtTime(0, now + startOffset);
        gNode.gain.linearRampToValueAtTime(volume, now + startOffset + 0.02);
        gNode.gain.exponentialRampToValueAtTime(0.001, now + startOffset + toneDuration);
        
        oNode.start(now + startOffset);
        oNode.stop(now + startOffset + toneDuration);
      };
      playTone(523.25, 0, 0.7);     // C5
      playTone(659.25, 0.25, 0.7);  // E5
      playTone(783.99, 0.5, 0.7);   // G5
      playTone(1046.50, 0.75, 1.45); // C6 (glorious long decay ring)
      
      // Stop base oscillator immediately since helper nodes do the work
      osc.start(now);
      osc.stop(now);
    } else if (type === 'long-bell') {
      // Rich metallic school bell dong gong sound, vibrating slow tremolo over 2.5 seconds
      osc.type = 'sine';
      osc.frequency.setValueAtTime(392.00, now); // G4 primary tone
      
      // Overtones for realistic metal chime resonance
      const o2 = ctx.createOscillator();
      const g2 = ctx.createGain();
      o2.connect(g2);
      g2.connect(ctx.destination);
      o2.type = 'sine';
      o2.frequency.setValueAtTime(784.00, now); // G5 harmonic
      g2.gain.setValueAtTime(0, now);
      g2.gain.linearRampToValueAtTime(volume * 0.4, now + 0.02);
      g2.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      o2.start(now);
      o2.stop(now + 2.5);

      const o3 = ctx.createOscillator();
      const g3 = ctx.createGain();
      o3.connect(g3);
      g3.connect(ctx.destination);
      o3.type = 'sine';
      o3.frequency.setValueAtTime(1176.00, now); // D6 harmonic
      g3.gain.setValueAtTime(0, now);
      g3.gain.linearRampToValueAtTime(volume * 0.2, now + 0.02);
      g3.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      o3.start(now);
      o3.stop(now + 2.5);

      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      osc.start(now);
      osc.stop(now + 2.5);
    } else if (type === 'alarm-long') {
      // Pulsed sweeping warning siren alarm chimes over 2.6 seconds
      osc.type = 'sawtooth';
      for (let i = 0; i < 4; i++) {
        osc.frequency.setValueAtTime(440, now + i * 0.65);
        osc.frequency.linearRampToValueAtTime(750, now + i * 0.65 + 0.3);
        osc.frequency.linearRampToValueAtTime(440, now + i * 0.65 + 0.6);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.6);
      osc.start(now);
      osc.stop(now + 2.65);
    } else if (type === 'sparkle') {
      // Retro arpeggiated sparkle rise synthesizer wave over 2.0 seconds
      osc.type = 'sine';
      for (let i = 0; i < 8; i++) {
        const freq = 350 + i * 130;
        osc.frequency.setValueAtTime(freq, now + i * 0.2);
      }
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.0);
      osc.start(now);
      osc.stop(now + 2.0);
    }
  } catch (error) {
    console.error('Audio synthesizer error:', error);
  }
}
