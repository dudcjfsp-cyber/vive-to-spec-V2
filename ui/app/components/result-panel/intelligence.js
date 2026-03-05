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

function refineGoalSentence(rawText) {
  const source = normalizeText(rawText);
  if (!source) return '';

  let next = source
    .replace(/^(나|저|우리)\s*(혼자)?\s*(사용할|쓰는)?\s*/u, '')
    .replace(/\s*(웹앱|웹 앱|앱|서비스|프로그램)\s*(을|를)?\s*(만들고 싶어|만들고싶어|개발하고 싶어|개발하고싶어|구축하고 싶어|구축하고싶어|원해|원합니다)$/u, '')
    .replace(/\s*(을|를)?\s*(만들고 싶어|만들고싶어|개발하고 싶어|개발하고싶어|구축하고 싶어|구축하고싶어|원해|원합니다)$/u, '')
    .trim();

  if (!next || next.length < 5) return '';

  if (!/(기록|관리|분석|요약|자동화|추천|알림|동기화|추적|통계|검증|보고|정리|개선|제공|지원|구현|처리|분류|생성)/.test(next)) {
    next = `${next} 기능 구현`;
  }

  return next;
}

function suggestFieldFromVibe(fieldId, vibeText, fallback = '') {
  const vibe = normalizeText(vibeText);
  if (!vibe) return toText(fallback);

  let candidate = '';

  if (fieldId === 'who') {
    const whoMatch = vibe.match(/(초보자|비전공자|개발자|운영자|관리자|고객|사용자|팀|학생|창업자)[^,.!?]*/);
    candidate = toText(whoMatch?.[0], fallback);
  } else if (fieldId === 'when') {
    const whenMatch = vibe.match(/(실시간|매일|주간|월간|로그인[^\s]* 후|결제[^\s]* 시|주문[^\s]* 시|배포[^\s]* 전|오류 발생 시)/);
    candidate = toText(whenMatch?.[0], fallback);
  } else if (fieldId === 'what') {
    const firstSentence = vibe.split(/[.!?]/).map((item) => item.trim()).find(Boolean) || '';
    candidate = refineGoalSentence(firstSentence) || toText(firstSentence, fallback);
  } else if (fieldId === 'why') {
    const whyMatch = vibe.match(/([^.!?]*(문제|불편|개선|목표|위해|줄이기|높이기)[^.!?]*)/);
    candidate = toText(whyMatch?.[0], fallback);
  } else if (fieldId === 'success') {
    const successMatch = vibe.match(/([^.!?]*(성공|완료|전환|오류|시간|만족|지표|KPI|측정)[^.!?]*)/i);
    candidate = toText(successMatch?.[0], fallback);
  } else {
    candidate = toText(fallback);
  }

  const safeCandidate = toText(candidate, fallback);
  if (!safeCandidate) return toText(fallback);

  const overlap = tokenOverlapRatio(safeCandidate, vibe);
  const nearCopyThreshold = fieldId === 'what' ? 0.74 : 0.9;
  if (overlap >= nearCopyThreshold) {
    return toText(fallback);
  }

  return safeCandidate;
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

  const inferredHypothesis = INTENT_FIELD_ORDER.reduce((acc, fieldId) => {
    acc[fieldId] = suggestFieldFromVibe(fieldId, vibeText, '');
    return acc;
  }, {});

  const suggestedHypothesis = INTENT_FIELD_ORDER.reduce((acc, fieldId) => {
    const current = toText(hypothesis[fieldId]);
    const inferred = toText(inferredHypothesis[fieldId]);
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
    inferredHypothesis,
    suggestedHypothesis,
    lowConfidenceFields,
    questions,
  };
}


function extractCandidatePhrases(vibeText) {
  const source = toText(vibeText);
  if (!source) return [];

  return source
    .split(/[\r\n.!?]+/)
    .map((item) => normalizeText(item))
    .filter(Boolean);
}

function extractSuccessHint(vibeText) {
  const source = normalizeText(vibeText);
  if (!source) return '';

  const directMetricMatch = source.match(/(\d+\s*%|\d+\s*(초|분|시간|일|주|개월|건|회))/);
  if (directMetricMatch?.[0]) return directMetricMatch[0];

  const metricKeywordMatch = source.match(/([^.!?]*(오류|시간|완료율|전환율|만족도|성공률|누락률|응답 속도|처리 속도)[^.!?]*)/);
  if (metricKeywordMatch?.[0]) return normalizeText(metricKeywordMatch[0]);

  return '';
}

function compactPhrase(value, maxLength = 44) {
  const normalized = normalizeText(value);
  if (!normalized) return '';
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

export function buildSuggestionInputExamples({ vibeText, inferredHypothesis }) {
  const phrases = extractCandidatePhrases(vibeText);
  const tokens = extractMeaningfulTokens(vibeText).slice(0, 4);

  const whoBase = toText(inferredHypothesis?.who, '핵심 사용자');
  const whenBase = toText(inferredHypothesis?.when, '핵심 이벤트 직후');
  const whatBase = toText(inferredHypothesis?.what, phrases[0] || '핵심 작업 흐름');
  const whyBase = toText(inferredHypothesis?.why, '반복 불편과 오류를 줄이기 위해');
  const successHint = extractSuccessHint(vibeText);
  const successBase = toText(
    inferredHypothesis?.success,
    successHint
      ? `${compactPhrase(successHint)} 기준으로 성과 측정`
      : '처리 시간·오류율·완료율 중 1개 이상 수치화',
  );

  const keywordHint = tokens.length > 0
    ? `${tokens.join(', ')} 중심으로`
    : '핵심 업무 중심으로';
  const whatFlow = phrases[1] || `${compactPhrase(whatBase, 28)} 단계를 입력-처리-확인으로 분리`;
  const whatAutomation = phrases[2] || `${compactPhrase(whatBase, 28)} 자동화와 점검`;

  return [
    `누가: ${compactPhrase(whoBase)} | 언제: ${compactPhrase(whenBase)} | 무엇을: ${compactPhrase(whatBase, 56)} | 왜: ${compactPhrase(whyBase, 56)} | 성공기준: ${compactPhrase(successBase, 56)}`,
    `누가: ${compactPhrase(whoBase)} 담당자 | 언제: 주요 작업 시작 전/후 | 무엇을: ${compactPhrase(whatFlow, 56)} | 왜: ${keywordHint} 우선순위를 명확히 하기 위해 | 성공기준: 주간 리드타임 30% 단축`,
    `누가: ${compactPhrase(whoBase)} + 운영 담당 | 언제: 누락/오류 발생 시 즉시 | 무엇을: ${compactPhrase(whatAutomation, 56)} | 왜: 재작업과 커뮤니케이션 비용을 줄이기 위해 | 성공기준: 누락률 5% 이하, 재작업 건수 월 50% 감소`,
  ];
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
