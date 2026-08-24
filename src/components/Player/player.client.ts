import { COLORS, MAX_GLYPHS, MAX_PARTICLES } from './player.constants';
import { getChaosLabel, getGlyph, getInputVisual, getLetterColor, getPhonicsSound, getPlayAreaHeight, isMilestone, shouldShowVirtualKeyboard, type InputVisual } from './player.helpers';

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

interface ExpandingCircle {
  x: number;
  y: number;
  color: string;
  age: number;
  life: number;
  size: number;
}

interface Shape {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  age: number;
  life: number;
  kind: 'square' | 'triangle' | 'circle';
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`Missing player element: ${selector}`);
  return element;
}

const player = requireElement<HTMLElement>('.player');
const canvas = requireElement<HTMLCanvasElement>('#stage');
const virtualKeyboard = requireElement<HTMLElement>('.virtual-keyboard');
const context = canvas.getContext('2d', { alpha: true });
if (!context) throw new Error('Canvas 2D is unavailable');

const welcome = requireElement<HTMLElement>('#welcome');
const startButton = requireElement<HTMLButtonElement>('#start-button');
const parentSetupButton = requireElement<HTMLButtonElement>('#parent-setup-button');
const scoreCount = requireElement<HTMLElement>('#score-count');
const chaosLabel = requireElement<HTMLElement>('#chaos-label');
const settings = requireElement<HTMLDialogElement>('#settings');
const bgAnimationToggle = requireElement<HTMLInputElement>('#bg-animation-toggle');
const soundToggle = requireElement<HTMLInputElement>('#sound-toggle');
const letterSpeechModes = document.querySelectorAll<HTMLInputElement>('input[name="letter-speech-mode"]');
const effectsToggle = requireElement<HTMLInputElement>('#effects-toggle');
const tabletTouchDevice = matchMedia('(min-width: 600px) and (hover: none) and (pointer: coarse)');

let width = 0;
let height = 0;
let score = 0;
let started = false;
let reducedEffects = matchMedia('(prefers-reduced-motion: reduce)').matches;
let frame = 0;
let lastTime = 0;
let resizeFrame = 0;
let audioContext: AudioContext | null = null;
let fullscreenRequested = false;
let keyboardLocked = false;
let lastSmashAt = performance.now();
const IDLE_AFTER_MS = 5_000;
const ESCAPE_HOLD_MS = 3_000;
let escapeHoldTimer = 0;
let scoreFadeTimer = 0;
const SCORE_FADE_MS = 3_000;
const LETTER_SPEECH_COOLDOWN_MS = 1_300;
let lastSpokenLetter = '';
let lastLetterSpeechAt = 0;
let speechVoices: SpeechSynthesisVoice[] = [];

type KeyboardController = {
  lock?: () => Promise<void>;
  unlock?: () => void;
};

function getKeyboardController(): KeyboardController | undefined {
  return (navigator as Navigator & { keyboard?: KeyboardController }).keyboard;
}

function lockKeyboard(): void {
  const keyboard = getKeyboardController();
  if (!keyboard?.lock) return;

  keyboard.lock().then(() => {
    keyboardLocked = true;
  }).catch(() => undefined);
}

function unlockKeyboard(): void {
  if (keyboardLocked) getKeyboardController()?.unlock?.();
  keyboardLocked = false;
}

function requestLockdown(): void {
  if (fullscreenRequested || document.fullscreenElement || !document.documentElement.requestFullscreen) return;

  fullscreenRequested = true;
  document.documentElement.requestFullscreen().then(lockKeyboard).catch(() => {
    fullscreenRequested = false;
  });
}
const particles: Particle[] = [];
const glyphs: Glyph[] = [];
const circles: ExpandingCircle[] = [];
const shapes: Shape[] = [];
const MAX_SHAPES = 220;

effectsToggle.checked = reducedEffects;
bgAnimationToggle.checked = !reducedEffects;
refreshSpeechVoices();
if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', refreshSpeechVoices);
if (reducedEffects) player.classList.add('no-bg-animation');

function initVirtualKeyboard(): void {
  const template = document.getElementById('virtual-keyboard-template') as HTMLTemplateElement;
  if (!template) return;
  
  const clone = template.content.cloneNode(true) as DocumentFragment;
  virtualKeyboard.appendChild(clone);
  
  for (const button of virtualKeyboard.querySelectorAll<HTMLButtonElement>('[data-play-key]')) {
    button.addEventListener('pointerdown', () => playVirtualKey(button));
    button.addEventListener('click', (event) => {
      if (event.detail === 0) playVirtualKey(button);
    });
  }
}

function updateVirtualKeyboardVisibility(): void {
  const visible = shouldShowVirtualKeyboard(started, tabletTouchDevice.matches);
  
  if (visible && !virtualKeyboard.querySelector('.virtual-keyboard-rows')) {
    initVirtualKeyboard();
    // Force reflow so the transition happens from the initial state
    virtualKeyboard.getBoundingClientRect();
  }
  
  player.classList.toggle('show-virtual-keyboard', visible);
  virtualKeyboard.setAttribute('aria-hidden', String(!visible));
}

let resizeTimer = 0;

function resizeCanvas(): void {
  const ratio = Math.min(devicePixelRatio || 1, 1.5);
  const newWidth = innerWidth;
  const newHeight = player.classList.contains('show-virtual-keyboard')
    ? getPlayAreaHeight(innerHeight, virtualKeyboard.getBoundingClientRect().top)
    : innerHeight;

  if (width === newWidth && height === newHeight) return;

  width = newWidth;
  height = newHeight;
  player.style.setProperty('--play-area-height', `${height}px`);
  
  const targetCanvasWidth = Math.round(width * ratio);
  const targetCanvasHeight = Math.round(height * ratio);
  
  if (canvas.width !== targetCanvasWidth || canvas.height !== targetCanvasHeight) {
    canvas.width = targetCanvasWidth;
    canvas.height = targetCanvasHeight;
    context?.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
}

function scheduleResize(): void {
  if (resizeTimer) window.clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    resizeTimer = 0;
    resizeFrame = requestAnimationFrame(() => {
      resizeFrame = 0;
      resizeCanvas();
      if (particles.length || glyphs.length || circles.length || shapes.length) startRendering();
    });
  }, 150);
}

function randomColor(): string {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

function addDots(x: number, y: number, color: string, count: number): void {
  if (particles.length + count > MAX_PARTICLES) {
    particles.splice(0, particles.length + count - MAX_PARTICLES);
  }

  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 7,
      color: index % 3 === 0 ? '#ffffff' : color,
      age: 0,
      life: reducedEffects ? 3_400 + Math.random() * 900 : 6_200 + Math.random() * 1_200,
    });
  }
}

function addShape(shape: Shape): void {
  if (shapes.length >= MAX_SHAPES) shapes.shift();
  shapes.push(shape);
}

function addGlyph(x: number, y: number, value: string, color: string, visual: InputVisual): void {
  if (glyphs.length >= MAX_GLYPHS) glyphs.shift();
  const learningGlyph = visual === 'letter' || visual === 'number';
  glyphs.push({
    x,
    y,
    value,
    color,
    age: 0,
    life: reducedEffects ? 760 : 1_250,
    size: Math.min(width, height) * (learningGlyph ? 0.2 + Math.random() * 0.05 : 0.14 + Math.random() * 0.06),
    rotation: (Math.random() - 0.5) * 0.16,
  });
}

function spawnMilestoneConfetti(): void {
  const count = reducedEffects ? 40 : 100;
  for (let index = 0; index < count; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 10;
    addShape({
      x: width * (0.2 + Math.random() * 0.6),
      y: height * (0.18 + Math.random() * 0.36),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 5,
      size: 6 + Math.random() * 13,
      color: randomColor(),
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.35,
      age: 0,
      life: reducedEffects ? 3_500 + Math.random() * 700 : 5_700 + Math.random() * 1_100,
      kind: ['square', 'triangle', 'circle'][Math.floor(Math.random() * 3)] as Shape['kind'],
    });
  }
}

function spawnEffect(x: number, y: number, value: string, visual: InputVisual, color = randomColor()): void {

  if (visual === 'space') {
    circles.push({
      x,
      y,
      color,
      age: 0,
      life: reducedEffects ? 620 : 950,
      size: Math.max(width, height) * (reducedEffects ? 0.52 : 0.78),
    });
  } else if (visual === 'letter') {
    addDots(x, y, color, reducedEffects ? 8 : 18);
  } else if (visual === 'number') {
    addShape({
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -2 - Math.random() * 3,
      size: Math.min(width, height) * (0.08 + Math.random() * 0.05),
      color,
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.18,
      age: 0,
      life: reducedEffects ? 3_800 : 6_500,
      kind: 'square',
    });
  } else {
    addDots(x, y, color, reducedEffects ? 5 : 12);
  }

  addGlyph(x, y, value, color, visual);
  startRendering();
}

function render(time: number): void {
  const delta = Math.min(time - lastTime || 16.7, 34);
  const idle = time - lastSmashAt >= IDLE_AFTER_MS;
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
    const step = delta / 16.7;
    particle.x += (particle.vx + (idle ? Math.sin(time / 500 + index) * 0.4 : 0)) * step;
    particle.y += (idle ? -0.42 : particle.vy) * step;
    particle.vy += (idle ? -0.006 : 0.12) * step;
    context.globalAlpha = 1 - progress;
    context.fillStyle = particle.color;
    context.beginPath();
    context.arc(particle.x, particle.y, particle.size * (1 - progress * 0.45), 0, Math.PI * 2);
    context.fill();
  }

  for (let index = circles.length - 1; index >= 0; index -= 1) {
    const circle = circles[index];
    circle.age += delta;
    if (circle.age >= circle.life) {
      circles.splice(index, 1);
      continue;
    }
    const progress = circle.age / circle.life;
    context.globalAlpha = (1 - progress) * 0.8;
    context.strokeStyle = circle.color;
    context.lineWidth = Math.max(3, 14 * (1 - progress));
    context.beginPath();
    context.arc(circle.x, circle.y, circle.size * progress, 0, Math.PI * 2);
    context.stroke();
  }

  for (let index = shapes.length - 1; index >= 0; index -= 1) {
    const shape = shapes[index];
    shape.age += delta;
    if (shape.age >= shape.life) {
      shapes.splice(index, 1);
      continue;
    }
    const progress = shape.age / shape.life;
    const step = delta / 16.7;
    shape.x += (shape.vx + (idle ? Math.sin(time / 650 + index) * 0.28 : 0)) * step;
    shape.y += (idle ? -0.34 : shape.vy) * step;
    shape.vy += (idle ? -0.008 : 0.08) * step;
    shape.rotation += shape.spin * (idle ? 0.45 : 1) * step;
    context.save();
    context.translate(shape.x, shape.y);
    context.rotate(shape.rotation);
    context.globalAlpha = 1 - progress;
    context.fillStyle = shape.color;
    if (shape.kind === 'circle') {
      context.beginPath();
      context.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
      context.fill();
    } else if (shape.kind === 'triangle') {
      context.beginPath();
      context.moveTo(0, -shape.size / 2);
      context.lineTo(shape.size / 2, shape.size / 2);
      context.lineTo(-shape.size / 2, shape.size / 2);
      context.closePath();
      context.fill();
    } else {
      context.fillRect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
    }
    context.restore();
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

  if (particles.length || glyphs.length || circles.length || shapes.length) {
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

const PLINK_NOTES = [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];

type SoundType = 'piano' | 'bell' | 'marimba' | 'arcade' | 'pop';
const INSTRUMENTS: SoundType[] = ['piano', 'bell', 'marimba', 'arcade', 'pop'];
let currentSoundChoice = 'mix';

function playTone(): void {
  if (!soundToggle.checked) return;

  audioContext ??= new AudioContext();
  if (audioContext.state === 'suspended') audioContext.resume().catch(() => undefined);

  const now = audioContext.currentTime;
  const type: SoundType = currentSoundChoice === 'mix'
    ? INSTRUMENTS[Math.floor(Math.random() * INSTRUMENTS.length)]
    : currentSoundChoice as SoundType;
  const frequency = PLINK_NOTES[Math.floor(Math.random() * PLINK_NOTES.length)] * (0.97 + Math.random() * 0.06);

  const strike = (
    startFrequency: number,
    endFrequency: number,
    waveform: OscillatorType,
    peak: number,
    duration: number,
  ): void => {
    const oscillator = audioContext!.createOscillator();
    const gain = audioContext!.createGain();
    oscillator.type = waveform;
    oscillator.frequency.setValueAtTime(startFrequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration * 0.35);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(peak, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(audioContext!.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  };

  if (type === 'piano') {
    strike(frequency * 1.01, frequency, 'triangle', 0.12, 0.58);
    strike(frequency * 2.03, frequency * 2, 'sine', 0.035, 0.36);
  } else if (type === 'bell') {
    strike(frequency, frequency, 'sine', 0.035, 1.15);
    strike(frequency * 2.76, frequency * 2.76, 'sine', 0.055, 0.96);
    strike(frequency * 4.07, frequency * 4.07, 'sine', 0.03, 0.72);
  } else if (type === 'marimba') {
    strike(frequency * 1.8, frequency, 'triangle', 0.16, 0.24);
    strike(frequency * 3.1, frequency * 2, 'sine', 0.04, 0.15);
  } else if (type === 'arcade') {
    strike(frequency * 0.75, frequency * 1.55, 'square', 0.08, 0.19);
  } else {
    strike(frequency * 0.65, frequency * 1.7, 'sine', 0.14, 0.15);
  }
}

function refreshSpeechVoices(): void {
  if ('speechSynthesis' in window) speechVoices = window.speechSynthesis.getVoices();
}

function getPreferredSpeechVoice(): SpeechSynthesisVoice | undefined {
  const australianVoices = speechVoices.filter((voice) => voice.lang.toLowerCase() === 'en-au');
  return australianVoices.find((voice) => /female|woman|samantha|karen|kate|tessa/i.test(voice.name))
    ?? australianVoices.find((voice) => !/male|man|daniel|lee/i.test(voice.name))
    ?? australianVoices[0]
    ?? speechVoices.find((voice) => voice.lang.toLowerCase().startsWith('en-'));
}

type LetterSpeechMode = 'off' | 'names' | 'phonics';

function getLetterSpeechMode(): LetterSpeechMode {
  const selected = document.querySelector<HTMLInputElement>('input[name="letter-speech-mode"]:checked')?.value;
  return selected === 'names' || selected === 'phonics' ? selected : 'off';
}

function pronounceLetter(key: string): void {
  const mode = getLetterSpeechMode();
  if (mode === 'off' || getInputVisual(key) !== 'letter') return;
  if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') return;

  const letter = key.toUpperCase();
  const now = performance.now();
  if (window.speechSynthesis.speaking || (letter === lastSpokenLetter && now - lastLetterSpeechAt < LETTER_SPEECH_COOLDOWN_MS)) return;

  lastSpokenLetter = letter;
  lastLetterSpeechAt = now;
  const spokenText = mode === 'phonics' ? getPhonicsSound(letter) ?? letter.toLowerCase() : letter.toLowerCase();
  const utterance = new SpeechSynthesisUtterance(spokenText);
  const preferredVoice = getPreferredSpeechVoice();
  if (preferredVoice) utterance.voice = preferredVoice;
  utterance.lang = preferredVoice?.lang ?? 'en-AU';
  utterance.rate = 0.72;
  utterance.pitch = 1.04;
  utterance.volume = 0.72;
  window.speechSynthesis.speak(utterance);
}

function resetScoreFade(): void {
  window.clearTimeout(scoreFadeTimer);
  scoreCount.closest('.score')?.classList.add('is-restoring');
  scoreCount.closest('.score')?.classList.remove('is-muted');
  requestAnimationFrame(() => scoreCount.closest('.score')?.classList.remove('is-restoring'));
  scoreFadeTimer = window.setTimeout(() => scoreCount.closest('.score')?.classList.add('is-muted'), SCORE_FADE_MS);
}

function updateScore(): void {
  scoreCount.textContent = String(score);
  chaosLabel.textContent = getChaosLabel(score);
  resetScoreFade();
}

function smash(
  value: string,
  x = width * (0.18 + Math.random() * 0.64),
  y = height * (0.22 + Math.random() * 0.58),
  visual: InputVisual = 'default',
): void {
  if (!started || settings.open) return;
  lastSmashAt = performance.now();
  score += 1;
  updateScore();
  spawnEffect(x, y, value, visual, visual === 'letter' ? getLetterColor(value) ?? randomColor() : randomColor());
  if (isMilestone(score)) spawnMilestoneConfetti();
  playTone();
}

function begin(): void {
  started = true;
  welcome.hidden = true;
  player.classList.add('started');
  updateVirtualKeyboardVisibility();
  resizeCanvas();
  audioContext ??= soundToggle.checked ? new AudioContext() : null;
  resetScoreFade();
  requestLockdown();
}

function playVirtualKey(button: HTMLButtonElement): void {
  const key = button.dataset.playKey;
  if (!key || settings.open) return;

  if (!started) begin();

  const bounds = button.getBoundingClientRect();
  const visual = getInputVisual(key);
  pronounceLetter(key);
  smash(getGlyph(key), bounds.left + bounds.width / 2, height * (0.24 + Math.random() * 0.5), visual);
}

function stopPlay(): void {
  if (!started) return;
  started = false;
  welcome.hidden = false;
  player.classList.remove('started');
  updateVirtualKeyboardVisibility();
  resizeCanvas();
  unlockKeyboard();
  if (document.fullscreenElement) {
    document.exitFullscreen?.().catch(() => undefined);
  }
}

function openSettings(): void {
  if (!settings.open) settings.showModal();
}

function cancelEscapeHold(): void {
  if (!escapeHoldTimer) return;
  window.clearTimeout(escapeHoldTimer);
  escapeHoldTimer = 0;
}

function startEscapeHold(): void {
  if (escapeHoldTimer || settings.open) return;
  escapeHoldTimer = window.setTimeout(() => {
    escapeHoldTimer = 0;
    openSettings();
  }, ESCAPE_HOLD_MS);
}

document.addEventListener('pointerdown', requestLockdown, { capture: true, once: true });
document.addEventListener('keydown', requestLockdown, { capture: true, once: true });
document.addEventListener('contextmenu', (event) => event.preventDefault());
document.addEventListener('dragstart', (event) => event.preventDefault());
document.addEventListener('drop', (event) => event.preventDefault());

startButton.addEventListener('click', begin);
parentSetupButton.addEventListener('click', openSettings);
window.addEventListener('resize', scheduleResize, { passive: true });
tabletTouchDevice.addEventListener('change', () => {
  updateVirtualKeyboardVisibility();
  scheduleResize();
});

function canSmashTarget(target: EventTarget | null): boolean {
  return !(target instanceof Element && target.closest('button, a, dialog, .welcome'));
}

function smashAt(x: number, y: number): void {
  smash('●', x, y);
}

window.addEventListener('pointerdown', (event) => {
  if (event.pointerType === 'touch' || !canSmashTarget(event.target)) return;
  smashAt(event.clientX, event.clientY);
}, { passive: true });

window.addEventListener('touchstart', (event) => {
  if (!canSmashTarget(event.target)) return;
  for (const touch of event.changedTouches) smashAt(touch.clientX, touch.clientY);
}, { passive: true });
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    startEscapeHold();
    return;
  }

  if (event.altKey || event.ctrlKey || event.metaKey) {
    event.preventDefault();
    return;
  }

  if (settings.open) return;
  if (event.target instanceof Element && event.target.closest('[data-play-key]')) return;

  if (!started) {
    if (event.key === 'Enter') {
      event.preventDefault();
      begin();
    }
    return;
  }

  event.preventDefault();
  const visual = getInputVisual(event.key);
  if (!event.repeat) pronounceLetter(event.key);
  smash(getGlyph(event.key), undefined, undefined, visual);
}, { capture: true });

window.addEventListener('keyup', (event) => {
  if (event.key === 'Escape') {
    event.preventDefault();
    cancelEscapeHold();
  }
}, { capture: true });
window.addEventListener('blur', cancelEscapeHold);

document.addEventListener('fullscreenchange', () => {
  if (document.fullscreenElement) {
    lockKeyboard();
  } else {
    fullscreenRequested = false;
    unlockKeyboard();
    if (started) stopPlay();
  }
});


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
    playTone();
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
for (const modeControl of letterSpeechModes) {
  modeControl.addEventListener('change', () => {
    if (!modeControl.checked) return;
    lastSpokenLetter = '';
    lastLetterSpeechAt = 0;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  });
}

effectsToggle.addEventListener('change', () => {
  reducedEffects = effectsToggle.checked;
});
requireElement<HTMLButtonElement>('#reset-score').addEventListener('click', () => {
  score = 0;
  updateScore();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    cancelEscapeHold();
    cancelAnimationFrame(frame);
    frame = 0;
    particles.length = 0;
    glyphs.length = 0;
    circles.length = 0;
    shapes.length = 0;
  }
});

updateVirtualKeyboardVisibility();
resizeCanvas();
