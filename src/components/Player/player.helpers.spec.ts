import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSONANT_COLOR, VOWEL_COLOR, getChaosLabel, getGlyph, getLetterEmoji, getInputVisual, getLetterColor, getNumberName, getPhonicsSound, getSpokenText, getPlayAreaHeight, isMilestone, parseSettings, shouldShowVirtualKeyboard } from './player.helpers.ts';

test('normalizes printable and special keys', () => {
  assert.equal(getGlyph('a'), 'A');
  assert.equal(getGlyph(' '), '★');
  assert.equal(getGlyph('Enter'), '↵');
  assert.equal(getGlyph('Shift'), '●');
  assert.equal(getGlyph('7'), '7');
  assert.equal(getGlyph('0'), '0');
});

test('maps letters to simple phonics sounds', () => {
  assert.equal(getPhonicsSound('a'), 'ah');
  assert.equal(getPhonicsSound('K'), 'kuh');
  assert.equal(getPhonicsSound('f'), 'fuh');
  assert.equal(getPhonicsSound('x'), 'k-s');
  assert.equal(getPhonicsSound('7'), null);
});

test('uses a distinct colour family for vowels and consonants', () => {
  assert.equal(getLetterColor('a'), VOWEL_COLOR);
  assert.equal(getLetterColor('E'), VOWEL_COLOR);
  assert.equal(getLetterColor('b'), CONSONANT_COLOR);
  assert.equal(getLetterColor('Z'), CONSONANT_COLOR);
  assert.equal(getLetterColor('7'), null);
});

test('maps space, letters, and numbers to distinct canvas visuals', () => {
  assert.equal(getInputVisual(' '), 'space');
  assert.equal(getInputVisual('Spacebar'), 'space');
  assert.equal(getInputVisual('a'), 'letter');
  assert.equal(getInputVisual('Z'), 'letter');
  assert.equal(getInputVisual('7'), 'number');
  assert.equal(getInputVisual('ArrowUp'), 'default');
});

test('reserves the keyboard area from the rendering canvas', () => {
  assert.equal(getPlayAreaHeight(1200, 800), 800);
  assert.equal(getPlayAreaHeight(1200, -20), 0);
  assert.equal(getPlayAreaHeight(1200, 1600), 1200);
});

test('shows the virtual keyboard only in active tablet touch play', () => {
  assert.equal(shouldShowVirtualKeyboard(false, true), false);
  assert.equal(shouldShowVirtualKeyboard(true, false), false);
  assert.equal(shouldShowVirtualKeyboard(true, true), true);
});

test('recognizes each 50-smash milestone', () => {
  assert.equal(isMilestone(0), false);
  assert.equal(isMilestone(49), false);
  assert.equal(isMilestone(50), true);
  assert.equal(isMilestone(100), true);
  assert.equal(isMilestone(101), false);
});

test('labels each score band', () => {
  assert.equal(getChaosLabel(0), 'Tiny chaos');
  assert.equal(getChaosLabel(25), 'Getting wild');
  assert.equal(getChaosLabel(75), 'Maximum smash');
  assert.equal(getChaosLabel(150), 'Legendary chaos');
});

test('ignores stored settings that are missing or unreadable', () => {
  assert.deepEqual(parseSettings(null), {});
  assert.deepEqual(parseSettings(''), {});
  assert.deepEqual(parseSettings('not json'), {});
  assert.deepEqual(parseSettings('"a string"'), {});
  assert.deepEqual(parseSettings('null'), {});
});

test('keeps only stored settings of the expected shape', () => {
  assert.deepEqual(parseSettings(JSON.stringify({
    theme: 'ocean',
    bgMotion: 'embers',
    sound: 'bell',
    bgAnimation: false,
    soundOn: true,
    speech: 'phonics',
    reducedEffects: true,
  })), {
    theme: 'ocean',
    bgMotion: 'embers',
    sound: 'bell',
    bgAnimation: false,
    soundOn: true,
    speech: 'phonics',
    reducedEffects: true,
  });

  assert.deepEqual(parseSettings(JSON.stringify({
    theme: 42,
    soundOn: 'yes',
    speech: 'shouting',
    reducedEffects: null,
    somethingElse: 'ignored',
    bgMotion: 'aurora',
  })), { bgMotion: 'aurora' });
});

test('cycles a letter through its own pictures on repeat presses', () => {
  const a = [getLetterEmoji('a', 0), getLetterEmoji('a', 1), getLetterEmoji('a', 2)];
  assert.equal(new Set(a).size, 3, 'consecutive repeats should not show the same picture');
  assert.equal(getLetterEmoji('a', 3), getLetterEmoji('a', 0), 'wraps around');
  assert.equal(getLetterEmoji('A', 1), getLetterEmoji('a', 1), 'case-insensitive');
});

test('only letters have pictures', () => {
  for (const letter of 'abcdefghijklmnopqrstuvwxyz') {
    assert.ok(getLetterEmoji(letter, 0), `missing pictures for ${letter}`);
  }
  assert.equal(getLetterEmoji('7', 0), null);
  assert.equal(getLetterEmoji(' ', 0), null);
  assert.equal(getLetterEmoji('Enter', 0), null);
});

test('names each digit', () => {
  assert.equal(getNumberName('0'), 'zero');
  assert.equal(getNumberName('7'), 'seven');
  assert.equal(getNumberName('9'), 'nine');
  assert.equal(getNumberName('a'), null);
  assert.equal(getNumberName('Enter'), null);
});

test('resolves what the voice says for letters and numbers', () => {
  assert.equal(getSpokenText('a', 'names'), 'a');
  assert.equal(getSpokenText('A', 'names'), 'a');
  assert.equal(getSpokenText('a', 'phonics'), 'ah');
  // digits have no phonic sound, so they are named in either voice mode
  assert.equal(getSpokenText('3', 'names'), 'three');
  assert.equal(getSpokenText('3', 'phonics'), 'three');
  // nothing else speaks, and Off silences everything
  assert.equal(getSpokenText(' ', 'names'), null);
  assert.equal(getSpokenText('Enter', 'names'), null);
  assert.equal(getSpokenText('a', 'off'), null);
  assert.equal(getSpokenText('3', 'off'), null);
});
