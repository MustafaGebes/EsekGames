/**
 * Minecraft Web - Procedural Web Audio Sound Engine
 */

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let currentVolume = 0.7;

export function initAudio() {
  if (audioCtx) return;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioContextClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = currentVolume;
    masterGain.connect(audioCtx.destination);
  } catch {
    // Audio context unavailable or blocked
  }
}

export function setMasterVolume(vol: number) {
  currentVolume = Math.max(0, Math.min(1, vol));
  if (masterGain && audioCtx) {
    masterGain.gain.setValueAtTime(currentVolume, audioCtx.currentTime);
  }
}

function noiseBurst(dur: number, vol: number, freq: number, type: BiquadFilterType = 'lowpass') {
  if (!audioCtx || !masterGain) return;
  const sampleRate = audioCtx.sampleRate;
  const bufferSize = Math.floor(sampleRate * dur);
  const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  }

  const src = audioCtx.createBufferSource();
  src.buffer = buffer;

  const filter = audioCtx.createBiquadFilter();
  filter.type = type;
  filter.frequency.value = freq;

  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(vol * 0.4, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  src.start();
}

function playTone(f0: number, f1: number, dur: number, type: OscillatorType = 'sine', vol = 0.15) {
  if (!audioCtx || !masterGain) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(f0, audioCtx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), audioCtx.currentTime + dur);

  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);

  osc.connect(gain);
  gain.connect(masterGain);

  osc.start();
  osc.stop(audioCtx.currentTime + dur + 0.05);
}

export type SoundMaterial = 'grass' | 'stone' | 'wood' | 'sand' | 'glass';

export const Sound = {
  step(mat: SoundMaterial = 'grass') {
    initAudio();
    if (mat === 'grass') {
      noiseBurst(0.06, 0.25, 1100, 'bandpass');
    } else if (mat === 'stone') {
      noiseBurst(0.04, 0.2, 550, 'lowpass');
      playTone(180, 80, 0.03, 'triangle', 0.08);
    } else if (mat === 'wood') {
      noiseBurst(0.05, 0.22, 600, 'lowpass');
      playTone(220, 110, 0.04, 'sine', 0.1);
    } else if (mat === 'sand') {
      noiseBurst(0.07, 0.18, 1400, 'bandpass');
    }
  },

  breakBlock(mat: SoundMaterial = 'stone') {
    initAudio();
    if (mat === 'stone') {
      noiseBurst(0.12, 0.45, 600);
      playTone(160, 60, 0.08, 'sawtooth', 0.12);
    } else if (mat === 'wood') {
      noiseBurst(0.14, 0.4, 750);
      playTone(240, 90, 0.09, 'triangle', 0.15);
    } else if (mat === 'grass') {
      noiseBurst(0.1, 0.35, 1400);
    } else if (mat === 'sand') {
      noiseBurst(0.12, 0.3, 900);
    } else if (mat === 'glass') {
      noiseBurst(0.15, 0.5, 3000, 'highpass');
      playTone(1200, 400, 0.12, 'square', 0.1);
    }
  },

  placeBlock(mat: SoundMaterial = 'stone') {
    initAudio();
    if (mat === 'stone') {
      noiseBurst(0.08, 0.35, 800);
      playTone(220, 120, 0.05, 'triangle', 0.1);
    } else if (mat === 'wood') {
      noiseBurst(0.09, 0.35, 650);
      playTone(260, 140, 0.06, 'triangle', 0.12);
    } else {
      noiseBurst(0.07, 0.3, 1000);
    }
  },

  crumble() {
    initAudio();
    noiseBurst(0.04, 0.15, 750);
  },

  swing() {
    initAudio();
    noiseBurst(0.05, 0.12, 1600, 'highpass');
  },

  hit() {
    initAudio();
    // Authentic Minecraft "Oof" hurt sound
    playTone(190, 65, 0.25, 'sawtooth', 0.35);
    noiseBurst(0.1, 0.2, 400);
  },

  pickup() {
    initAudio();
    // High-pitched "pop"
    const base = 850 + Math.random() * 200;
    playTone(base, base * 1.5, 0.08, 'sine', 0.25);
  },

  craft() {
    initAudio();
    playTone(600, 950, 0.1, 'triangle', 0.2);
    noiseBurst(0.04, 0.15, 1200);
  },

  click() {
    initAudio();
    playTone(700, 700, 0.03, 'square', 0.08);
  },

  eat() {
    initAudio();
    // Crunch crunch
    noiseBurst(0.06, 0.25, 900);
    setTimeout(() => {
      noiseBurst(0.06, 0.28, 850);
    }, 120);
    setTimeout(() => {
      noiseBurst(0.08, 0.3, 750);
      playTone(320, 480, 0.1, 'sine', 0.15); // swallow burp
    }, 260);
  },

  levelUp() {
    initAudio();
    // Ascending arpeggio
    const notes = [523, 659, 784, 1046]; // C E G C
    notes.forEach((freq, i) => {
      setTimeout(() => {
        playTone(freq, freq * 1.02, 0.15, 'sine', 0.18);
      }, i * 90);
    });
  },

  chest() {
    initAudio();
    playTone(320, 480, 0.15, 'triangle', 0.15);
  },

  cowMoo() {
    initAudio();
    // Low pitched resonance
    playTone(135, 110, 0.45, 'sawtooth', 0.18);
    playTone(130, 95, 0.5, 'triangle', 0.22);
  },

  sheepBaa() {
    initAudio();
    // Vibrato baaa
    playTone(240, 210, 0.35, 'sawtooth', 0.15);
    playTone(360, 310, 0.35, 'triangle', 0.15);
  },

  pigOink() {
    initAudio();
    // Grunt
    playTone(160, 110, 0.12, 'square', 0.16);
    noiseBurst(0.08, 0.15, 450);
  },

  chickenCluck() {
    initAudio();
    // Short cluck double burst
    playTone(420, 380, 0.06, 'triangle', 0.18);
    setTimeout(() => {
      playTone(480, 410, 0.08, 'triangle', 0.16);
    }, 70);
  },

  mobHurt() {
    initAudio();
    playTone(280, 120, 0.15, 'sawtooth', 0.25);
    noiseBurst(0.06, 0.2, 500);
  },
};
