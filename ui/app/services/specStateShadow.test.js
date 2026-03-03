import test from 'node:test';
import assert from 'node:assert/strict';
import { initializeSpecState, shadowWriteSpecState } from './specStateShadow.js';
import { loadSpecStateFromSession } from '../../../engine/state/specState.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

test('initializeSpecState seeds the upgraded state schema', () => {
  const originalSessionStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = createMemoryStorage();

  try {
    initializeSpecState();
    const state = loadSpecStateFromSession();

    assert.equal(state.version, 2);
    assert.deepEqual(state.pending_questions, []);
    assert.equal(state.loop_turn, 0);
    assert.deepEqual(state.clarification_answers, {});
  } finally {
    globalThis.sessionStorage = originalSessionStorage;
  }
});

test('shadowWriteSpecState stores loop tracking fields without breaking history logging', () => {
  const originalSessionStorage = globalThis.sessionStorage;
  globalThis.sessionStorage = createMemoryStorage();

  try {
    initializeSpecState();
    shadowWriteSpecState({
      type: 'clarify_started',
      currentNodeId: 'clarify_budget',
      answersPatch: { source_vibe: '예약 관리 앱' },
      clarificationAnswersPatch: { budget: '월 10만원' },
      pendingQuestions: ['관리자 권한이 필요한가요?', '알림 방식은 무엇인가요?'],
      lastValidation: { canAutoProceed: false, severity: 'medium' },
      loopTurn: 1,
      lastGenerationId: 'gen_1',
      payload: { reason: 'missing_permissions' },
    });

    const state = loadSpecStateFromSession();

    assert.equal(state.current_node_id, 'clarify_budget');
    assert.deepEqual(state.answers, { source_vibe: '예약 관리 앱' });
    assert.deepEqual(state.clarification_answers, { budget: '월 10만원' });
    assert.deepEqual(state.pending_questions, ['관리자 권한이 필요한가요?', '알림 방식은 무엇인가요?']);
    assert.deepEqual(state.last_validation, { canAutoProceed: false, severity: 'medium' });
    assert.equal(state.loop_turn, 1);
    assert.equal(state.last_generation_id, 'gen_1');
    assert.equal(state.history.length, 1);
    assert.equal(state.history[0].type, 'clarify_started');
    assert.deepEqual(state.history[0].payload, { reason: 'missing_permissions' });
  } finally {
    globalThis.sessionStorage = originalSessionStorage;
  }
});
