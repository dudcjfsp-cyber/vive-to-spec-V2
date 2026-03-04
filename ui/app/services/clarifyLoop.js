function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function mergeClarificationQuestions(existingQuestions = [], nextQuestions = [], maxQuestions = 3) {
  const limit = Math.max(0, Number(maxQuestions) || 0);
  const merged = [];

  [...toStringArray(existingQuestions), ...toStringArray(nextQuestions)].forEach((question) => {
    if (!question || merged.includes(question)) return;
    if (merged.length >= limit) return;
    merged.push(question);
  });

  return merged;
}

export function buildWarningDrivenQuestions({
  warningId = '',
  warningDetail = '',
  validationReport = null,
  maxQuestions = 3,
} = {}) {
  const normalizedWarningId = toText(warningId);
  const normalizedWarningDetail = toText(warningDetail);
  const suggestedQuestions = toStringArray(validationReport?.suggested_questions);
  const nextQuestions = [];

  const directQuestion = WARNING_QUESTION_BY_ID[normalizedWarningId];
  if (directQuestion) {
    nextQuestions.push(directQuestion);
  }

  if (normalizedWarningId.startsWith('schema-')) {
    const schemaIndex = Number(normalizedWarningId.split('-')[1]);
    if (Number.isInteger(schemaIndex) && suggestedQuestions[schemaIndex]) {
      nextQuestions.push(suggestedQuestions[schemaIndex]);
    } else {
      const schemaQuestion = buildSchemaWarningQuestion(normalizedWarningDetail);
      if (schemaQuestion) {
        nextQuestions.push(schemaQuestion);
      }
    }

    return mergeClarificationQuestions([], nextQuestions, maxQuestions);
  }

  if (/question|warning|clarif|missing|spec/i.test(normalizedWarningDetail)) {
    nextQuestions.push(...suggestedQuestions);
  } else if (nextQuestions.length === 0) {
    nextQuestions.push(...suggestedQuestions.slice(0, 2));
  }

  return mergeClarificationQuestions([], nextQuestions, maxQuestions);
}

function buildSchemaWarningQuestion(warningDetail = '') {
  const detail = toText(warningDetail);
  if (!detail) {
    return '이 스키마 경고를 해소하려면 부족한 명세를 구체적으로 보완해 주세요.';
  }

  return `이 경고를 해소하려면 다음 부족한 부분을 구체적으로 보완해 주세요: ${detail}`;
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

const WARNING_QUESTION_BY_ID = Object.freeze({
  'intent-unconfirmed': '핵심 사용자, 사용 시점, 해결할 작업을 한 문장으로 다시 정리해 주세요.',
  'intent-low-confidence': '지금 결과에서 가장 먼저 확정해야 할 핵심 제약조건은 무엇인가요?',
  'data-flow-alignment': 'UI, API, DB 사이에서 반드시 일치해야 하는 필드는 무엇인가요?',
  'permission-delete': '삭제 가능한 역할은 누구이고, 삭제 전에 필요한 승인 단계는 무엇인가요?',
  'intent-mismatch': '현재 스펙이 정확히 맞춰야 하는 사용자 작업은 무엇인가요?',
});

export function shouldOfferClarificationLoop({
  loopMode = 'off',
  maxClarifyTurns = 0,
  loopTurn = 0,
  validationReport = null,
} = {}) {
  if (toText(loopMode, 'off') === 'off') return false;
  if (!isPlainObject(validationReport)) return false;
  if (Number(loopTurn) >= Number(maxClarifyTurns || 0)) return false;

  const suggestedQuestions = toStringArray(validationReport.suggested_questions);
  if (suggestedQuestions.length === 0) return false;

  return Boolean(validationReport.needs_clarification);
}

export function buildClarifiedVibe(vibe, questions = [], answers = {}) {
  const baseVibe = toText(vibe);
  const safeAnswers = isPlainObject(answers) ? answers : {};
  const answerLines = toStringArray(questions)
    .map((question) => {
      const answer = toText(safeAnswers[question]);
      if (!answer) return '';
      return `- ${question}: ${answer}`;
    })
    .filter(Boolean);

  if (answerLines.length === 0) return baseVibe;

  return [
    baseVibe,
    '',
    '[추가 확정 정보]',
    ...answerLines,
  ].join('\n').trim();
}
