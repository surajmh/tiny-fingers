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

export const VIRTUAL_KEYBOARD_ROWS = [
  [
    { key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' }, { key: '4', label: '4' }, { key: '5', label: '5' },
    { key: '6', label: '6' }, { key: '7', label: '7' }, { key: '8', label: '8' }, { key: '9', label: '9' }, { key: '0', label: '0' },
  ],
  [
    { key: 'q', label: 'Q' }, { key: 'w', label: 'W' }, { key: 'e', label: 'E' }, { key: 'r', label: 'R' }, { key: 't', label: 'T' },
    { key: 'y', label: 'Y' }, { key: 'u', label: 'U' }, { key: 'i', label: 'I' }, { key: 'o', label: 'O' }, { key: 'p', label: 'P' },
  ],
  [
    { key: 'a', label: 'A' }, { key: 's', label: 'S' }, { key: 'd', label: 'D' }, { key: 'f', label: 'F' }, { key: 'g', label: 'G' },
    { key: 'h', label: 'H' }, { key: 'j', label: 'J' }, { key: 'k', label: 'K' }, { key: 'l', label: 'L' },
  ],
  [
    { key: 'z', label: 'Z' }, { key: 'x', label: 'X' }, { key: 'c', label: 'C' }, { key: 'v', label: 'V' },
    { key: 'b', label: 'B' }, { key: 'n', label: 'N' }, { key: 'm', label: 'M' },
  ],
] as const;

export const VIRTUAL_KEYBOARD_ACTIONS = [
  { key: ' ', label: 'SPACE', className: 'is-space', ariaLabel: 'Space key' },
  { key: 'Enter', label: 'GO!', className: 'is-action', ariaLabel: 'Enter key' },
] as const;
