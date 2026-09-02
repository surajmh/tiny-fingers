const SPECIAL_KEYS: Record<string, string> = {
  ' ': '★',
  Spacebar: '★',
  Enter: '↵',
  Backspace: '←',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Tab: '✦',
};

export const NUMBER_EMOJIS = [
  // Animals & Creatures
  '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷',
  '🐸', '🐵', '🐔', '🐧', '🦆', '🦅', '🦉', '🦄', '🐝', '🐛', '🦋', '🐞', '🐢',
  '🐙', '🦑', '🐬', '🐳', '🦈', '🐊', '🦖', '🦕', '🦔', '🦥', '🦦', '🦩', '🦚',
  // Joyful Faces & Expressions
  '😀', '😃', '😄', '😁', '😆', '🥹', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉',
  '😍', '🥰', '😘', '😋', '😛', '😜', '🤪', '🤩', '🥳', '😎', '🤠', '🤖', '👾',
  '👻', '💖', '✨', '🔥', '💥', '💯',
  // Food & Sweet Treats
  '🍎', '🍏', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🍍',
  '🥥', '🥝', '🥑', '🌽', '🥕', '🍕', '🍔', '🍟', '🌭', '🍿', '🥞', '🧇', '🧀',
  '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭',
  // Toys, Vehicles & Magic
  '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🚚', '🚜', '🛵',
  '🚲', '🛴', '🚂', '🚆', '🚀', '🛸', '🚁', '⛵', '🚤', '🛳️', '✈️', '🎈', '🎉',
  '🎊', '🎁', '🪄', '🎨', '🧸', '🪁', '🎮', '👑', '💎', '🔔', '🎺', '🎸', '🥁',
  // Nature & Space
  '⭐', '🌟', '💫', '✨', '🪐', '🌙', '☀️', '🌈', '⚡', '❄️', '🌸', '🌺', '🌻',
  '🌹', '🌷', '🌼', '🍀', '🌴', '🍄',
] as const;

export function getGlyph(key: string): string {
  if (SPECIAL_KEYS[key]) return SPECIAL_KEYS[key];
  if (/^[0-9]$/.test(key)) {
    return NUMBER_EMOJIS[Math.floor(Math.random() * NUMBER_EMOJIS.length)];
  }
  if (key.length === 1) return key.toUpperCase();
  return '●';
}

const PHONIC_SOUNDS: Record<string, string> = {
  a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fuh', g: 'guh', h: 'huh',
  i: 'ih', j: 'juh', k: 'kuh', l: 'luh', m: 'muh', n: 'nuh', o: 'oh', p: 'puh',
  q: 'kwuh', r: 'ruh', s: 'suh', t: 'tuh', u: 'uh', v: 'vuh', w: 'wuh', x: 'k-s',
  y: 'yuh', z: 'zuh',
};

export function getPhonicsSound(key: string): string | null {
  return PHONIC_SOUNDS[key.toLowerCase()] ?? null;
}

export const VOWEL_COLOR = '#ff6f91';
export const CONSONANT_COLOR = '#65d8ff';

export function getLetterColor(key: string): string | null {
  if (!/^[a-z]$/i.test(key)) return null;
  return /^[aeiou]$/i.test(key) ? VOWEL_COLOR : CONSONANT_COLOR;
}

export type InputVisual = 'space' | 'letter' | 'number' | 'default';

export function getInputVisual(key: string): InputVisual {
  if (key === ' ' || key === 'Spacebar') return 'space';
  if (/^[a-z]$/i.test(key)) return 'letter';
  if (/^[0-9]$/.test(key)) return 'number';
  return 'default';
}

export function isMilestone(count: number): boolean {
  return count > 0 && count % 50 === 0;
}

export function getChaosLabel(count: number): string {
  if (count < 25) return 'Tiny chaos';
  if (count < 75) return 'Getting wild';
  if (count < 150) return 'Maximum smash';
  return 'Legendary chaos';
}

export type LetterSpeechMode = 'off' | 'names' | 'phonics';

export interface PlayerSettings {
  theme?: string;
  bgMotion?: string;
  sound?: string;
  bgAnimation?: boolean;
  soundOn?: boolean;
  speech?: LetterSpeechMode;
  reducedEffects?: boolean;
}

const SPEECH_MODES: readonly string[] = ['off', 'names', 'phonics'];

/** Stored settings are user-writable, so keep only fields of the shape we expect. */
export function parseSettings(raw: string | null): PlayerSettings {
  let saved: unknown;
  try {
    saved = JSON.parse(raw ?? '');
  } catch {
    return {};
  }
  if (typeof saved !== 'object' || saved === null) return {};

  const record = saved as Record<string, unknown>;
  const settings: PlayerSettings = {};

  for (const key of ['theme', 'bgMotion', 'sound'] as const) {
    if (typeof record[key] === 'string') settings[key] = record[key] as string;
  }
  for (const key of ['bgAnimation', 'soundOn', 'reducedEffects'] as const) {
    if (typeof record[key] === 'boolean') settings[key] = record[key] as boolean;
  }
  if (typeof record.speech === 'string' && SPEECH_MODES.includes(record.speech)) {
    settings.speech = record.speech as LetterSpeechMode;
  }

  return settings;
}

export function getPlayAreaHeight(viewportHeight: number, keyboardTop: number): number {
  return Math.max(0, Math.min(viewportHeight, keyboardTop));
}

export function shouldShowVirtualKeyboard(isPlaying: boolean, isTabletTouchDevice: boolean): boolean {
  return isPlaying && isTabletTouchDevice;
}
