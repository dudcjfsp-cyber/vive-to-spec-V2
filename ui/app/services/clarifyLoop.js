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

