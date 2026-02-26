import {
  appendSpecStateHistory,
  createEmptySpecState,
  loadSpecStateFromSession,
  updateSpecStateInSession,
} from '../../../engine/state/specState';

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function initializeSpecState() {
  const restored = loadSpecStateFromSession();
  const seed = restored?.version ? restored : createEmptySpecState();
  updateSpecStateInSession(() => seed);
}

export function shadowWriteSpecState({
  type,
  payload = {},
  answersPatch = null,
  currentNodeId = '',
}) {
  updateSpecStateInSession((previous) => {
    const hasAnswerPatch = isPlainObject(answersPatch);
    const next = {
      ...previous,
      answers: hasAnswerPatch ? { ...previous.answers, ...answersPatch } : previous.answers,
      current_node_id: currentNodeId || previous.current_node_id,
    };

    return appendSpecStateHistory(next, {
      type: String(type || '').trim() || 'event',
      ts: Date.now(),
      payload: isPlainObject(payload) ? payload : {},
    });
  });
}

