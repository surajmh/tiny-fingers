import assert from 'node:assert/strict';
import test from 'node:test';
import { CONSONANT_COLOR, NUMBER_EMOJIS, VOWEL_COLOR, getChaosLabel, getGlyph, getInputVisual, getLetterColor, getPhonicsSound, getPlayAreaHeight, isMilestone, parseSettings, shouldShowVirtualKeyboard } from './player.helpers.ts';

test('normalizes printable and special keys', () => {
  assert.equal(getGlyph('a'), 'A');
  assert.equal(getGlyph(' '), '★');
  assert.equal(getGlyph('Enter'), '↵');
  assert.equal(getGlyph('Shift'), '●');
  assert.ok(NUMBER_EMOJIS.includes(getGlyph('7') as any));
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
