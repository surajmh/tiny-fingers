import { COLORS, MAX_GLYPHS, MAX_PARTICLES } from './player.constants';
import { getChaosLabel, getGlyph } from './player.helpers';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  age: number;
  life: number;
}

interface Glyph {
  x: number;
  y: number;
  value: string;
  color: string;
  age: number;
  life: number;
  size: number;
  rotation: number;
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing player element: ${selector}`);
  return element;
}

const player = requireElement<HTMLElement>('.player');
const canvas = requireElement<HTMLCanvasElement>('#stage');
const context = canvas.getContext('2d', { alpha: true });
if (!context) throw new Error('Canvas 2D is unavailable');

const welcome = requireElement<HTMLElement>('#welcome');
const startButton = requireElement<HTMLButtonElement>('#start-button');
const scoreCount = requireElement<HTMLElement>('#score-count');
const chaosLabel = requireElement<HTMLElement>('#chaos-label');
const settings = requireElement<HTMLDialogElement>('#settings');
const settingsButton = requireElement<HTMLButtonElement>('#settings-button');
const bgAnimationToggle = requireElement<HTMLInputElement>('#bg-animation-toggle');
const soundToggle = requireElement<HTMLInputElement>('#sound-toggle');
const effectsToggle = requireElement<HTMLInputElement>('#effects-toggle');

let width = 0;
let height = 0;
let score = 0;
let started = false;
let reducedEffects = matchMedia('(prefers-reduced-motion: reduce)').matches;
let frame = 0;
let lastTime = 0;
let resizeFrame = 0;
let parentSequence = '';
let audioContext: AudioContext | null = null;
const particles: Particle[] = [];
const glyphs: Glyph[] = [];

effectsToggle.checked = reducedEffects;
bgAnimationToggle.checked = !reducedEffects;
if (reducedEffects) player.classList.add('no-bg-animation');

function resizeCanvas(): void {
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  width = innerWidth;
  height = innerHeight;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
}

function scheduleResize(): void {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => {
    resizeFrame = 0;
    resizeCanvas();
    if (particles.length || glyphs.length) startRendering();
  });
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function spawnEffect(x: number, y: number, value: string): void {
  const color = randomColor();
  const particleCount = reducedEffects ? 5 : 12;

  if (particles.length + particleCount > MAX_PARTICLES) {
    particles.splice(0, particles.length + particleCount - MAX_PARTICLES);
  }
  if (glyphs.length >= MAX_GLYPHS) glyphs.shift();

  for (let index = 0; index < particleCount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 6;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 9,
      color: index % 3 === 0 ? '#ffffff' : color,
      age: 0,
      life: 480 + Math.random() * 420,
    });
  }

  glyphs.push({
    x,
    y,
    value,
    color,
    age: 0,
    life: reducedEffects ? 520 : 900,
    size: Math.min(width, height) * (0.14 + Math.random() * 0.06),
    rotation: (Math.random() - 0.5) * 0.16,
  });
  startRendering();
}

function render(time: number): void {
  const delta = Math.min(time - lastTime || 16.7, 34);
  lastTime = time;
  context.clearRect(0, 0, width, height);

  for (let index = particles.length - 1; index >= 0; index -= 1) {
    const particle = particles[index];
    particle.age += delta;
    if (particle.age >= particle.life) {
      particles.splice(index, 1);
      continue;
    }
    const progress = particle.age / particle.life;
    particle.x += particle.vx * (delta / 16.7);
    particle.y += particle.vy * (delta / 16.7);
    particle.vy += 0.12 * (delta / 16.7);
    context.globalAlpha = 1 - progress;
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size * (1 - progress * 0.45), 0, Math.PI * 2);
    context.fill();
  }

  context.textAlign = 'center';
  context.textBaseline = 'middle';
  for (let index = glyphs.length - 1; index >= 0; index -= 1) {
    const glyph = glyphs[index];
    glyph.age += delta;
    if (glyph.age >= glyph.life) {
      glyphs.splice(index, 1);
      continue;
    }
    const progress = glyph.age / glyph.life;
    const scale = Math.min(1, progress * 7) * (1 - progress * 0.12);
    context.save();
    context.translate(glyph.x, glyph.y - progress * 36);
    context.rotate(glyph.rotation);
    context.scale(scale, scale);
    context.globalAlpha = Math.min(1, (1 - progress) * 2.5);
    context.fillStyle = glyph.color;
    context.shadowColor = glyph.color;
    context.shadowBlur = reducedEffects ? 0 : 18;
    context.font = `900 ${glyph.size}px ui-rounded, system-ui, sans-serif`;
    context.fillText(glyph.value, 0, 0);
    context.restore();
  }
  context.globalAlpha = 1;

  if (particles.length || glyphs.length) {
    frame = requestAnimationFrame(render);
  } else {
    frame = 0;
    lastTime = 0;
    context.clearRect(0, 0, width, height);
  }
}

function startRendering(): void {
  if (!frame && !document.hidden) frame = requestAnimationFrame(render);
}

type SoundType = 'piano' | 'bell' | 'marimba' | 'arcade' | 'pop';
const INSTRUMENTS: SoundType[] = ['piano', 'bell', 'marimba', 'arcade', 'pop'];
let currentSoundChoice = 'piano';

function playTone(seed: number): void {
  if (!soundToggle.checked) return;
  audioContext ??= new AudioContext();
  const now = audioContext.currentTime;

  const type: SoundType =
    currentSoundChoice === 'mix'
      ? INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)]
      : ((currentSoundChoice as SoundType) || 'piano');

  const freq = 180 * 2 ** ((seed % 24) / 12);

  if (type === 'bell') {
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc1.type = 'sine';
    osc1.frequency.value = freq * 1.5;
    osc2.type = 'sine';
    osc2.frequency.value = freq * 3.75;

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(audioContext.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.7);
    osc2.stop(now + 0.7);
  } else if (type === 'marimba') {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.2, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.8, now + 0.12);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

    osc.connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  } else if (type === 'arcade') {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq * 0.8, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.6, now + 0.08);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } else if (type === 'pop') {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq * 0.6, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 2.2, now + 0.07);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } else {
    // Piano
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.value = freq * 1.1;

    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain).connect(audioContext.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }
}

function updateScore(): void {
  scoreCount.textContent = String(score);
  chaosLabel.textContent = getChaosLabel(score);
}

function smash(value: string, x = width * (0.18 + Math.random() * 0.64), y = height * (0.22 + Math.random() * 0.58)): void {
  if (!started || settings.open) return;
  score += 1;
  updateScore();
  spawnEffect(x, y, value);
  playTone(value.codePointAt(0) ?? 65);
}

function begin(): void {
  started = true;
  welcome.hidden = true;
  player.classList.add('started');
  audioContext ??= soundToggle.checked ? new AudioContext() : null;
  document.documentElement.requestFullscreen?.().catch(() => undefined);
}

function stopPlay(): void {
  if (!started) return;
  started = false;
  welcome.hidden = false;
  player.classList.remove('started');
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => undefined);
  }
}

function openSettings(): void {
  if (!settings.open) settings.showModal();
}

startButton.addEventListener('click', begin);
window.addEventListener('resize', scheduleResize, { passive: true });
window.addEventListener('pointerdown', (event) => {
  if ((event.target as Element).closest('button, a, dialog, .welcome')) return;
  smash('●', event.clientX, event.clientY);
}, { passive: true });
window.addEventListener('keydown', (event) => {
  if (settings.open) return;

  if (event.key === 'Escape' || event.key === 'Enter') {
    if (started) {
      event.preventDefault();
      stopPlay();
    }
    return;
  }

  parentSequence = (parentSequence + event.key.toLowerCase()).slice(-6);
  if (parentSequence === 'parent') {
    openSettings();
    parentSequence = '';
    return;
  }
  if (!started) return;
  event.preventDefault();
  smash(getGlyph(event.key));
}, { capture: true });

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && started) {
    stopPlay();
  }
});

settingsButton.addEventListener('click', openSettings);

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')) {
  button.addEventListener('click', () => {
    player.dataset.theme = button.dataset.themeChoice;
    for (const option of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')) {
      option.setAttribute('aria-pressed', String(option === button));
    }
  });
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-sound-choice]')) {
  button.addEventListener('click', () => {
    currentSoundChoice = button.dataset.soundChoice ?? 'piano';
    for (const option of document.querySelectorAll<HTMLButtonElement>('[data-sound-choice]')) {
      option.setAttribute('aria-pressed', String(option === button));
    }
    playTone(65);
  });
}

for (const button of document.querySelectorAll<HTMLButtonElement>('[data-bg-choice]')) {
  button.addEventListener('click', () => {
    player.dataset.bgMotion = button.dataset.bgChoice;
    for (const option of document.querySelectorAll<HTMLButtonElement>('[data-bg-choice]')) {
      option.setAttribute('aria-pressed', String(option === button));
    }
  });
}

bgAnimationToggle.addEventListener('change', () => {
  player.classList.toggle('no-bg-animation', !bgAnimationToggle.checked);
});

effectsToggle.addEventListener('change', () => {
  reducedEffects = effectsToggle.checked;
});
requireElement<HTMLButtonElement>('#reset-score').addEventListener('click', () => {
  score = 0;
  updateScore();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
    particles.length = 0;
    glyphs.length = 0;
  }
});

resizeCanvas();
