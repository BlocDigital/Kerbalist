// The displayed calendar is the game's: the same moment reads 50y 148d in both (see the 1.3.2 log check).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadParts } from './load-parts.mjs';

const { utToDateString } = loadParts(['313-js-03-sim-clock.js'], ['utToDateString']);

test('game universal time 453,007,754 s shows the game calendar 50y 148d 03:29:14', () => {
  assert.equal(utToDateString(453007754.30457705), 'T+50y,148d,03:29:14');
});

test('epoch 0 shows the game calendar start, 1y 1d', () => {
  assert.equal(utToDateString(0), 'T+1y,1d,00:00:00');
});

test('Epoch sets the stored time to the calendar start, which shows T+0y,0d', () => {
  const { utToDateString, CALENDAR_OFFSET_SEC } = loadParts(['313-js-03-sim-clock.js'], ['utToDateString', 'CALENDAR_OFFSET_SEC']);
  assert.equal(utToDateString(-CALENDAR_OFFSET_SEC), 'T+0y,0d,00:00:00');
});
