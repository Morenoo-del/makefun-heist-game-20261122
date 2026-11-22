// audio.js — every sound is synthesized with WebAudio, no audio files.
// One job: make the heist audible — footsteps, pickups, alarms, the getaway.
// The audio context is created on the first user gesture, as browsers require.

let ctx = null;
let master = null;
let heartbeatTimer = null;

export function ensureAudio(muted) {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.35;
  master.connect(ctx.destination);
}

export function setMuted(muted) {
  if (master) master.gain.value = muted ? 0 : 0.35;
}

function tone(freq, duration, type = 'sine', volume = 0.5, slideTo = null) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

function noiseBurst(duration, volume = 0.4, lowpass = 1200) {
  if (!ctx || !master) return;
  const len = Math.floor(ctx.sampleRate * duration);
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = lowpass;
  const gain = ctx.createGain();
  gain.gain.value = volume;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  src.start();
}

export const sfx = {
  step() { tone(140, 0.06, 'triangle', 0.12, 90); },
  pickup() { tone(660, 0.12, 'sine', 0.4, 990); setTimeout(() => tone(1320, 0.14, 'sine', 0.3), 70); },
  gem() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.35), i * 80)); },
  spotted() { tone(880, 0.16, 'square', 0.22, 440); },
  alarm() { tone(520, 0.3, 'sawtooth', 0.25, 780); },
  emp() { noiseBurst(0.35, 0.35, 3000); tone(1200, 0.3, 'sine', 0.2, 200); },
  noiseMaker() { tone(300, 0.1, 'square', 0.25, 600); setTimeout(() => tone(300, 0.1, 'square', 0.25, 600), 140); },
  caught() { tone(220, 0.7, 'sawtooth', 0.4, 55); noiseBurst(0.5, 0.4, 800); },
  win() { [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => tone(f, 0.25, 'triangle', 0.35), i * 110)); },
  click() { tone(440, 0.05, 'sine', 0.25); },
  locked() { tone(180, 0.12, 'square', 0.25, 120); },
};

// The heartbeat is the tension: it starts when the alarm climbs past half and
// quickens as the meter fills, so the player hears the danger before they see
// the lockdown. Call it once a frame with the current alarm level.
export function updateHeartbeat(alarm, muted) {
  if (!ctx || muted) {
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
    return;
  }
  const active = alarm > 45;
  if (active && !heartbeatTimer) {
    heartbeatTimer = setInterval(() => {
      tone(70, 0.12, 'sine', 0.5, 45);
      setTimeout(() => tone(70, 0.1, 'sine', 0.4, 45), 180);
    }, 650);
  } else if (!active && heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}
