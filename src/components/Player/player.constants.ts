export const COLORS = [
  '#ffd84d',
  '#65d8ff',
  '#ff6f91',
  '#9f7aea',
  '#62e6a7',
  '#ff9f43',
] as const;

export const THEMES = [
  { id: 'space', label: 'Space' },
  { id: 'candy', label: 'Candy' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'jungle', label: 'Jungle' },
  { id: 'sunset', label: 'Sunset' },
] as const;

export const SOUNDS = [
  { id: 'piano', label: '🎹 Piano' },
  { id: 'bell', label: '🔔 Bell' },
  { id: 'marimba', label: '🪵 Marimba' },
  { id: 'arcade', label: '👾 Arcade' },
  { id: 'pop', label: '🫧 Pop' },
  { id: 'mix', label: '🎲 Surprise Mix' },
] as const;

export const BG_ANIMATIONS = [
  { id: 'galaxy', label: '🌌 Galaxy' },
  { id: 'bubbles', label: '🫧 Bubbles' },
  { id: 'aurora', label: '🌊 Aurora' },
  { id: 'stars', label: '✨ Starfield' },
  { id: 'embers', label: '🔥 Embers' },
] as const;

export const MAX_PARTICLES = 160;
export const MAX_GLYPHS = 10;
