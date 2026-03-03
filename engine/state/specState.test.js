import test from 'node:test';
import assert from 'node:assert/strict';
import {
  appendSpecStateHistory,
  createEmptySpecState,
} from './specState.js';

test('createEmptySpecState includes closed-loop defaults', () => {
  const state = createEmptySpecState();

  assert.deepEqual(state.answers, {});
  assert.deepEqual(state.clarification_answers, {});
  assert.equal(state.current_node_id, 'root');
  assert.deepEqual(state.history, []);
  assert.equal(state.last_generation_id, '');
  assert.equal(state.last_validation, null);
  assert.equal(state.loop_turn, 0);
  assert.deepEqual(state.pending_questions, []);
  assert.equal(state.version, 2);
});

test('appendSpecStateHistory preserves closed-loop fields while trimming history', () => {
  const seeded = {
    ...createEmptySpecState(),
    clarification_answers: { budget: '월 10만원' },
    last_generation_id: 'gen_1',
    last_validation: { canAutoProceed: false },
    loop_turn: 1,
    pending_questions: ['관리자 권한이 필요한가요?'],
  };
  const next = appendSpecStateHistory(seeded, {
    type: 'clarify_started',
    ts: 123,
    payload: { question_count: 1 },
  });

  assert.deepEqual(next.clarification_answers, { budget: '월 10만원' });
  assert.equal(next.last_generation_id, 'gen_1');
  assert.deepEqual(next.last_validation, { canAutoProceed: false });
  assert.equal(next.loop_turn, 1);
  assert.deepEqual(next.pending_questions, ['관리자 권한이 필요한가요?']);
  assert.equal(next.history.length, 1);
  assert.deepEqual(next.history[0], {
    type: 'clarify_started',
    ts: 123,
    payload: { question_count: 1 },
  });
});

