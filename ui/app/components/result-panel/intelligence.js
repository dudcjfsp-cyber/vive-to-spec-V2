import {
  FILLER_PATTERN,
  INTENT_FIELD_LABELS,
  INTENT_FIELD_ORDER,
  STOPWORDS,
} from './constants.js';
import { clamp, toText } from './utils.js';

function normalizeText(value) {
  return toText(value).replace(/\s+/g, ' ').trim();
}

function extractMeaningfulTokens(value) {
  const normalized = normalizeText(value).toLowerCase();
  if (!normalized) return [];

  const matched = normalized.match(/[a-z0-9가-힣_]{2,}/g) || [];
  return matched.filter((token) => !STOPWORDS.has(token));
}

function tokenOverlapRatio(a, b) {
  const left = new Set(extractMeaningfulTokens(a));
  const right = new Set(extractMeaningfulTokens(b));
  if (left.size === 0 || right.size === 0) return 0;

  let overlap = 0;
  left.forEach((token) => {
    if (right.has(token)) overlap += 1;
  });
  return overlap / Math.max(left.size, right.size);
}

function computeFieldConfidenceScore(fieldValue, vibeText) {
  const value = normalizeText(fieldValue);
  const vibe = normalizeText(vibeText);
  if (!value) return 0;

  let score = 40;
  if (value.length >= 6) score += 18;
  if (!FILLER_PATTERN.test(value)) score += 12;
  if (vibe && vibe.includes(value)) score += 18;
  score += Math.round(tokenOverlapRatio(value, vibe) * 24);
  return clamp(score, 0, 100);
}

function suggestFieldFromVibe(fieldId, vibeText, fallback = '') {
  const vibe = normalizeText(vibeText);
  if (!vibe) return toText(fallback);

  if (fieldId === 'who') {
    const whoMatch = vibe.match(/(초보자|비전공자|개발자|운영자|관리자|고객|사용자|팀|학생|창업자)[^,.!?]*/);
    return toText(whoMatch?.[0], fallback);
  }
  if (fieldId === 'when') {
    const whenMatch = vibe.match(/(실시간|매일|주간|월간|로그인[^\s]* 후|결제[^\s]* 시|주문[^\s]* 시|배포[^\s]* 전|오류 발생 시)/);
    return toText(whenMatch?.[0], fallback);
  }
  if (fieldId === 'what') {
    const firstSentence = vibe.split(/[.!?]/).map((item) => item.trim()).find(Boolean) || '';
    return toText(firstSentence, fallback);
  }
  if (fieldId === 'why') {
    const whyMatch = vibe.match(/([^.!?]*(문제|불편|개선|목표|위해|줄이기|높이기)[^.!?]*)/);
    return toText(whyMatch?.[0], fallback);
  }
  if (fieldId === 'success') {
    const successMatch = vibe.match(/([^.!?]*(성공|완료|전환|오류|시간|만족|지표|KPI|측정)[^.!?]*)/i);
    return toText(successMatch?.[0], fallback);
  }
  return toText(fallback);
}

function getConfidenceBand(score) {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

function buildClarifyingQuestion(fieldId, hypothesis, suggestion) {
  const fieldLabel = INTENT_FIELD_LABELS[fieldId] || fieldId;
  if (fieldId === 'who') {
    return `${fieldLabel}가 누구인지 구체화해 주세요. 예: ${suggestion || hypothesis.who || '일반 사용자 / 운영 관리자'}`;
  }
  if (fieldId === 'when') {
    return `${fieldLabel}를 언제로 볼지 정해 주세요. 예: ${suggestion || hypothesis.when || '로그인 직후 / 결제 직후'}`;
  }
  if (fieldId === 'what') {
    return `${fieldLabel}을 한 문장으로 확정해 주세요. 무엇을 자동화하거나 개선하나요?`;
  }
  if (fieldId === 'why') {
    return `${fieldLabel}가 되는 핵심 이유를 알려 주세요. 어떤 문제를 줄이거나 어떤 가치를 만드나요?`;
  }
  return `${fieldLabel}을 어떻게 측정할지 정해 주세요. 예: 처리 시간, 오류율, 완료율`;
}

export function buildL1Intelligence({ vibeText, hypothesis }) {
  const fieldConfidence = INTENT_FIELD_ORDER.reduce((acc, fieldId) => {
    acc[fieldId] = computeFieldConfidenceScore(hypothesis[fieldId], vibeText);
    return acc;
  }, {});

  const suggestedHypothesis = INTENT_FIELD_ORDER.reduce((acc, fieldId) => {
    const current = toText(hypothesis[fieldId]);
    const inferred = suggestFieldFromVibe(fieldId, vibeText, current);
    acc[fieldId] = current || inferred;
    return acc;
  }, {});

  const confidenceEntries = INTENT_FIELD_ORDER.map((fieldId) => ({
    fieldId,
    score: fieldConfidence[fieldId],
  }));
  const overallConfidence = Math.round(
    confidenceEntries.reduce((sum, entry) => sum + entry.score, 0) / Math.max(confidenceEntries.length, 1),
  );
  const lowConfidenceFields = confidenceEntries
    .filter((entry) => entry.score < 65)
    .sort((a, b) => a.score - b.score)
    .map((entry) => entry.fieldId);

  const questions = lowConfidenceFields
    .slice(0, 3)
    .map((fieldId) => buildClarifyingQuestion(fieldId, hypothesis, suggestedHypothesis[fieldId]));

  return {
    overallConfidence,
    confidenceBand: getConfidenceBand(overallConfidence),
    fieldConfidence,
    suggestedHypothesis,
    lowConfidenceFields,
    questions,
  };
}

function countMeaningfulLines(value) {
  return toText(value)
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*\d.\s]+/, '').trim())
    .filter(Boolean).length;
}

function computeAxisCoverage(axisText) {
  const lines = countMeaningfulLines(axisText);
  const tokens = extractMeaningfulTokens(axisText).length;
  return clamp((lines * 14) + (tokens * 2), 0, 100);
}

function computeAxisAlignment(logicMap) {
  const pairs = [
    ['text', 'db'],
    ['db', 'api'],
    ['api', 'ui'],
    ['text', 'ui'],
  ];
  const ratios = pairs.map(([left, right]) => tokenOverlapRatio(logicMap[left], logicMap[right]));
  return Math.round((ratios.reduce((sum, value) => sum + value, 0) / pairs.length) * 100);
}

export function buildL2Intelligence({ logicMap, changedAxis }) {
  const coverageByAxis = {
    text: computeAxisCoverage(logicMap.text),
    db: computeAxisCoverage(logicMap.db),
    api: computeAxisCoverage(logicMap.api),
    ui: computeAxisCoverage(logicMap.ui),
  };
  const coverageAvg = Math.round(
    Object.values(coverageByAxis).reduce((sum, value) => sum + value, 0) / 4,
  );
  const alignmentScore = computeAxisAlignment(logicMap);
  const overallScore = Math.round((coverageAvg * 0.55) + (alignmentScore * 0.45));

  const syncSuggestions = [];
  if (changedAxis) {
    if (changedAxis === 'text') {
      syncSuggestions.push('Text 목표 변경을 DB 필드/API 계약/UI 문구에 동시 반영하세요.');
    } else if (changedAxis === 'db') {
      syncSuggestions.push('DB 변경을 API 요청/응답 필드와 UI 입력 검증 규칙에 연동하세요.');
    } else if (changedAxis === 'api') {
      syncSuggestions.push('API 변경을 UI 호출 플로우와 에러 처리 문구에 반영하세요.');
    } else if (changedAxis === 'ui') {
      syncSuggestions.push('UI 단계 변경을 API 엔드포인트와 DB 저장 시점에 맞춰 동기화하세요.');
    }
  }

  Object.entries(coverageByAxis)
    .filter(([, score]) => score < 50)
    .forEach(([axis]) => {
      syncSuggestions.push(`${axis.toUpperCase()} 축 정보가 부족합니다. 최소 3개 항목 이상으로 보강하세요.`);
    });

  if (alignmentScore < 45) {
    syncSuggestions.push('축 간 용어가 서로 달라 정합성이 낮습니다. 동일 키워드 세트를 맞추세요.');
  }

  return {
    coverageByAxis,
    coverageAvg,
    alignmentScore,
    overallScore,
    syncSuggestions: syncSuggestions.slice(0, 3),
  };
}
