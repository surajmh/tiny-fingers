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

/* Each letter's own pictures, shown when a child keeps pressing the same key.
   Three apiece so a held key cycles rather than repeating one image. */
const LETTER_EMOJIS: Record<string, readonly string[]> = {
  a: ['\u{1F34E}', '\u2708\uFE0F', '\u{1F41C}'],
  b: ['\u{1F41D}', '\u{1F388}', '\u{1F34C}'],
  c: ['\u{1F431}', '\u{1F697}', '\u{1F370}'],
  d: ['\u{1F436}', '\u{1F986}', '\u{1F941}'],
  e: ['\u{1F418}', '\u{1F95A}', '\u{1F441}\uFE0F'],
  f: ['\u{1F438}', '\u{1F41F}', '\u{1F338}'],
  g: ['\u{1F347}', '\u{1F992}', '\u{1F381}'],
  h: ['\u{1F3E0}', '\u{1F434}', '\u{1F3A9}'],
  i: ['\u{1F366}', '\u{1F9CA}', '\u{1F3DD}\uFE0F'],
  j: ['\u{1F9C3}', '\u{1FAD9}', '\u{1F939}'],
  k: ['\u{1FA81}', '\u{1F511}', '\u{1F998}'],
  l: ['\u{1F981}', '\u{1F34B}', '\u{1F343}'],
  m: ['\u{1F319}', '\u{1F435}', '\u{1F344}'],
  n: ['\u{1FAB9}', '\u{1F443}', '\u{1F303}'],
  o: ['\u{1F419}', '\u{1F34A}', '\u{1F989}'],
  p: ['\u{1F427}', '\u{1F355}', '\u{1F437}'],
  q: ['\u{1F451}', '\u{1FAB6}', '\u2753'],
  r: ['\u{1F308}', '\u{1F430}', '\u{1F680}'],
  s: ['\u2600\uFE0F', '\u{1F40D}', '\u2B50'],
  t: ['\u{1F333}', '\u{1F42F}', '\u{1F682}'],
  u: ['\u2602\uFE0F', '\u{1F984}', '\u{1F199}'],
  v: ['\u{1F3BB}', '\u{1F30B}', '\u{1F690}'],
  w: ['\u{1F40B}', '\u{1F349}', '\u231A'],
  x: ['\u274C', '\u{1FA7B}', '\u{1F3B9}'],
  y: ['\u{1FA80}', '\u{1F49B}', '\u{1F9F6}'],
  z: ['\u{1F993}', '\u{1F910}', '\u{1F4A4}'],
};

/** Cycles through a letter's pictures by press index; null for anything not a letter. */
export function getLetterEmoji(key: string, index: number): string | null {
  const options = LETTER_EMOJIS[key.toLowerCase()];
  if (!options) return null;
  return options[index % options.length];
}

export function getGlyph(key: string): string {
  if (SPECIAL_KEYS[key]) return SPECIAL_KEYS[key];
  if (key.length === 1) return key.toUpperCase();
  return '\u25CF';
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

const NUMBER_NAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];

export function getNumberName(key: string): string | null {
  return /^[0-9]$/.test(key) ? NUMBER_NAMES[Number(key)] : null;
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

/**
 * What the voice should say for a key, or null for silence. Phonics applies to letters
 * only: a digit is always spoken as its name, since there is no phonic sound for one.
 */
export function getSpokenText(key: string, mode: LetterSpeechMode): string | null {
  if (mode === 'off') return null;

  const visual = getInputVisual(key);
  if (visual === 'number') return getNumberName(key);
  if (visual !== 'letter') return null;

  const letter = key.toLowerCase();
  return mode === 'phonics' ? getPhonicsSound(letter) ?? letter : letter;
}

export function getPlayAreaHeight(viewportHeight: number, keyboardTop: number): number {
  return Math.max(0, Math.min(viewportHeight, keyboardTop));
}

export function shouldShowVirtualKeyboard(isPlaying: boolean, isTouchDevice: boolean): boolean {
  return isPlaying && isTouchDevice;
}
