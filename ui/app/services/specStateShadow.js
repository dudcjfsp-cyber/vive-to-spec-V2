import {
  appendSpecStateHistory,
  createEmptySpecState,
  loadSpecStateFromSession,
  updateSpecStateInSession,
} from '../../../engine/state/specState.js';

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function initializeSpecState() {
  const restored = loadSpecStateFromSession();
  const seed = restored?.version ? restored : createEmptySpecState();
  updateSpecStateInSession(() => seed);
}

function normalizeQuestionList(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

export function shadowWriteSpecState(options = {}) {
  const safeOptions = isPlainObject(options) ? options : {};
  const hasAnswersPatch = isPlainObject(safeOptions.answersPatch);
  const hasClarificationAnswersPatch = isPlainObject(safeOptions.clarificationAnswersPatch);
  const hasPendingQuestions = Array.isArray(safeOptions.pendingQuestions);
  const hasLastValidation = Object.prototype.hasOwnProperty.call(safeOptions, 'lastValidation');
  const hasLoopTurn = Object.prototype.hasOwnProperty.call(safeOptions, 'loopTurn');
  const hasLastGenerationId = Object.prototype.hasOwnProperty.call(safeOptions, 'lastGenerationId');

  updateSpecStateInSession((previous) => {
    const next = {
      ...previous,
      answers: hasAnswersPatch ? { ...previous.answers, ...safeOptions.answersPatch } : previous.answers,
      clarification_answers: hasClarificationAnswersPatch
        ? { ...previous.clarification_answers, ...safeOptions.clarificationAnswersPatch }
        : previous.clarification_answers,
      current_node_id: String(safeOptions.currentNodeId || '').trim() || previous.current_node_id,
      pending_questions: hasPendingQuestions
        ? normalizeQuestionList(safeOptions.pendingQuestions)
        : previous.pending_questions,
      last_validation: hasLastValidation
        ? (isPlainObject(safeOptions.lastValidation) ? safeOptions.lastValidation : null)
        : previous.last_validation,
      loop_turn: hasLoopTurn
        ? Math.max(0, Math.floor(Number(safeOptions.loopTurn) || 0))
        : previous.loop_turn,
      last_generation_id: hasLastGenerationId
        ? String(safeOptions.lastGenerationId || '').trim()
        : previous.last_generation_id,
    };

    return appendSpecStateHistory(next, {
      type: String(safeOptions.type || '').trim() || 'event',
      ts: Date.now(),
      payload: isPlainObject(safeOptions.payload) ? safeOptions.payload : {},
    });
  });
}
