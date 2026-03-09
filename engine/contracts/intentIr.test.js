import test from 'node:test';
import assert from 'node:assert/strict';
import { createEmptyIntentIr, normalizeIntentIr } from './intentIr.js';

test('createEmptyIntentIr returns the reusable engine contract shell', () => {
  const intentIr = createEmptyIntentIr();

  assert.equal(intentIr.version, 1);
  assert.equal(intentIr.intent.target_user, '');
  assert.deepEqual(intentIr.delivery.must_haves, []);
  assert.equal(intentIr.signals.confidence, 'low');
});

test('normalizeIntentIr sanitizes nested arrays and signal values', () => {
  const intentIr = normalizeIntentIr({
    source_vibe: ' daily report ',
    summary: ' manager summary ',
    intent: {
      target_user: ' manager ',
    },
    delivery: {
      must_haves: [' export csv ', '', null],
      roles: [{ name: ' manager ', description: ' reviews output ' }],
    },
    analysis: {
      clarification_questions: [' Which date range? ', ''],
    },
    signals: {
      confidence: 'HIGH',
      needs_clarification: 1,
      warning_count: '2',
    },
  });

  assert.equal(intentIr.source_vibe, 'daily report');
  assert.equal(intentIr.summary, 'manager summary');
  assert.equal(intentIr.intent.target_user, 'manager');
  assert.deepEqual(intentIr.delivery.must_haves, ['export csv']);
  assert.deepEqual(intentIr.delivery.roles, [{ name: 'manager', description: 'reviews output' }]);
  assert.deepEqual(intentIr.analysis.clarification_questions, ['Which date range?']);
  assert.equal(intentIr.signals.confidence, 'high');
  assert.equal(intentIr.signals.needs_clarification, true);
  assert.equal(intentIr.signals.warning_count, 2);
});
