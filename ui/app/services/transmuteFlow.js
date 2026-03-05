import { shouldOfferClarificationLoop } from './clarifyLoop.js';

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function buildPromptExperimentId(personaConfig = {}) {
  const scope = toText(personaConfig.promptExperimentScope, toText(personaConfig.id, 'default')) || 'default';
  const mode = toText(personaConfig.promptPolicyMode, 'baseline') || 'baseline';
  return `${scope}_${mode}_v1`;
}

export function buildGeneratedResultPlan({
  generated,
  loopMode = 'off',
  maxClarifyTurns = 0,
  nextLoopTurn = 0,
  promptExperimentId = '',
} = {}) {
  const validationReport = isPlainObject(generated?.validation_report) ? generated.validation_report : null;
  const suggestedQuestions = toStringArray(validationReport?.suggested_questions);
  const shouldOfferLoop = shouldOfferClarificationLoop({
    loopMode,
    maxClarifyTurns,
    loopTurn: nextLoopTurn,
    validationReport,
  });

  return {
    validationReport,
    nextQuestions: shouldOfferLoop ? suggestedQuestions : [],
    nextGenerationId: `${toText(promptExperimentId, 'generation')}_${Date.now()}`,
  };
}

export function buildTransmuteSuccessShadowPayload({
  generated,
  apiProvider = '',
  selectedModel = '',
  promptPolicyMode = '',
  promptExperimentId = '',
  validationReport = null,
  nextQuestions = [],
  nextLoopTurn = 0,
  nextGenerationId = '',
  clarificationAnswersPatch = null,
} = {}) {
  const isRegenerate = isPlainObject(clarificationAnswersPatch);

  return {
    type: isRegenerate ? 'regenerate_success' : 'transmute_success',
    currentNodeId: isRegenerate ? 'regenerate_success' : 'transmute_success',
    answersPatch: {
      api_provider: apiProvider,
      last_model: String(generated?.model || selectedModel || ''),
      last_prompt_policy_mode: String(generated?.meta?.prompt_policy_mode || promptPolicyMode),
    },
    clarificationAnswersPatch,
    pendingQuestions: nextQuestions,
    lastValidation: validationReport,
    loopTurn: nextLoopTurn,
    lastGenerationId: nextGenerationId,
    payload: {
      provider: apiProvider,
      model: String(generated?.model || selectedModel || ''),
      prompt_policy_mode: String(generated?.meta?.prompt_policy_mode || promptPolicyMode),
      prompt_experiment_id: String(generated?.meta?.prompt_experiment_id || promptExperimentId),
      example_mode: String(generated?.meta?.example_mode || 'none'),
      validation_severity: String(validationReport?.severity || 'low'),
      can_auto_proceed: Boolean(validationReport?.can_auto_proceed),
      question_count: nextQuestions.length,
    },
  };
}

export function buildClarifyStartedShadowPayload({
  nextQuestions = [],
  validationReport = null,
  nextLoopTurn = 0,
  nextGenerationId = '',
} = {}) {
  if (!Array.isArray(nextQuestions) || nextQuestions.length === 0) return null;

  return {
    type: 'clarify_started',
    currentNodeId: 'clarify_started',
    pendingQuestions: nextQuestions,
    lastValidation: validationReport,
    loopTurn: nextLoopTurn,
    lastGenerationId: nextGenerationId,
    payload: {
      question_count: nextQuestions.length,
      severity: String(validationReport?.severity || 'low'),
    },
  };
}

export function buildClarifyAnsweredShadowPayload({
  clarificationAnswersPatch = null,
  clarifyQuestions = [],
  nextLoopTurn = 0,
  answeredCount = 0,
} = {}) {
  return {
    type: 'clarify_answered',
    currentNodeId: 'clarify_answered',
    clarificationAnswersPatch,
    pendingQuestions: clarifyQuestions,
    loopTurn: nextLoopTurn,
    payload: {
      question_count: answeredCount,
    },
  };
}


