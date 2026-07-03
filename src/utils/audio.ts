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
      // High-pitched bright decaying bell sound
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5 note
      osc.frequency.exponentialRampToValueAtTime(329.63, now + 0.6); // Decays to E4
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'chime') {
      // Gentle double-tone chime
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5 note
      osc.frequency.setValueAtTime(659.25, now + 0.12); // E5 note
      gain.gain.setValueAtTime(volume, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc.start(now);
      osc.stop(now + 0.45);
    } else if (type === 'beep') {
      // Polite double digital beep
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.setValueAtTime(0, now + 0.08);
      
      gain.gain.setValueAtTime(volume, now + 0.13);
      gain.gain.setValueAtTime(0, now + 0.21);
      
      osc.start(now);
      osc.stop(now + 0.22);
    } else if (type === 'siren') {
      // Sweeping frequency alert sound (Siren)
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
  } catch (error) {
    console.error('Audio synthesizer error:', error);
  }
}
