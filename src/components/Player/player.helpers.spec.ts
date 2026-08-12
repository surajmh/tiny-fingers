import assert from 'node:assert/strict';
import test from 'node:test';
import { NUMBER_EMOJIS, getChaosLabel, getGlyph } from './player.helpers.ts';

test('normalizes printable and special keys', () => {
  assert.equal(getGlyph('a'), 'A');
  assert.equal(getGlyph(' '), '★');
  assert.equal(getGlyph('Enter'), '↵');
  assert.equal(getGlyph('Shift'), '●');
  assert.ok(NUMBER_EMOJIS.includes(getGlyph('7') as any));
});

test('labels each score band', () => {
  assert.equal(getChaosLabel(0), 'Tiny chaos');
  assert.equal(getChaosLabel(25), 'Getting wild');
  assert.equal(getChaosLabel(75), 'Maximum smash');
  assert.equal(getChaosLabel(150), 'Legendary chaos');
});
