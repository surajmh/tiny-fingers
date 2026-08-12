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

export function getChaosLabel(count: number): string {
  if (count < 25) return 'Tiny chaos';
  if (count < 75) return 'Getting wild';
  if (count < 150) return 'Maximum smash';
  return 'Legendary chaos';
}
