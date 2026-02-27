import { INTENT_FIELD_ORDER } from './constants.js';
import { isObject, toText } from './utils.js';

const WARNING_ID_TARGETS = {
  'intent-unconfirmed': [...INTENT_FIELD_ORDER],
  'intent-mismatch': ['what', 'why'],
  'data-flow-alignment': ['what', 'when', 'success'],
  'permission-delete': ['who', 'what'],
};

const DOMAIN_DEFAULT_TARGETS = {
  permission: ['who', 'what'],
  data_flow: ['what', 'when', 'success'],
  coherence: ['what', 'why'],
  completeness: ['what', 'success'],
};

const FIELD_MATCHERS = {
  who: [
    /(누가|대상|사용자|역할|고객|관리자|운영자|담당|주체|권한|role|permission)/i,
  ],
  when: [
    /(언제|시점|주기|빈도|실시간|매일|주간|월간|타이밍|직후|직전|발생\s*시|시간대|schedule|deadline)/i,
  ],
  what: [
    /(무엇|기능|동작|요구|입력|출력|필드|스키마|규칙|유효성|검사|연동|동기화|데이터|흐름|api|db|ui|flow|sync)/i,
  ],
  why: [
    /(왜|이유|목적|문제|가치|개선|의도|정합|coherence|intent)/i,
  ],
  success: [
    /(성공|기준|지표|kpi|완료율|오류율|정확도|측정|품질|만족|sla|latency|성능|처리\s*시간|응답\s*시간|시간\s*단축|시간\s*절감)/i,
  ],
};

function normalizeFieldIds(fieldIds) {
  if (!Array.isArray(fieldIds)) return [];
  const unique = new Set();
  fieldIds.forEach((fieldId) => {
    const normalized = toText(fieldId);
    if (INTENT_FIELD_ORDER.includes(normalized)) {
      unique.add(normalized);
    }
  });
  return [...unique];
}

function orderFieldIds(fieldIds) {
  const normalized = new Set(normalizeFieldIds(fieldIds));
  return INTENT_FIELD_ORDER.filter((fieldId) => normalized.has(fieldId));
}

function buildSourceText(warning) {
  const safeWarning = isObject(warning) ? warning : {};
  const actionText = Array.isArray(safeWarning.actions)
    ? safeWarning.actions.map((action) => toText(action?.label)).filter(Boolean).join(' ')
    : '';
  return [
    toText(safeWarning.title),
    toText(safeWarning.detail),
    actionText,
  ]
    .join(' ')
    .toLowerCase();
}

function createScoreMap() {
  return INTENT_FIELD_ORDER.reduce((acc, fieldId) => {
    acc[fieldId] = 0;
    return acc;
  }, {});
}

function applyFieldMatchers(sourceText, scores) {
  INTENT_FIELD_ORDER.forEach((fieldId) => {
    const matchers = FIELD_MATCHERS[fieldId] || [];
    matchers.forEach((matcher) => {
      if (matcher.test(sourceText)) {
        scores[fieldId] += 2;
      }
    });
  });
}

function getDomainFallbackTargets(domain) {
  const key = toText(domain, 'completeness');
  return DOMAIN_DEFAULT_TARGETS[key] || DOMAIN_DEFAULT_TARGETS.completeness;
}

function pickFieldsFromScores(scores, fallbackTargets) {
  const ranked = INTENT_FIELD_ORDER
    .map((fieldId) => ({ fieldId, score: scores[fieldId] || 0 }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return INTENT_FIELD_ORDER.indexOf(a.fieldId) - INTENT_FIELD_ORDER.indexOf(b.fieldId);
    });

  if (ranked.length === 0) return [...fallbackTargets];

  const maxScore = ranked[0].score;
  let selected = ranked
    .filter((entry) => entry.score >= Math.max(2, maxScore - 1))
    .map((entry) => entry.fieldId)
    .slice(0, 3);

  if (selected.length === 0) {
    selected = ranked.slice(0, 2).map((entry) => entry.fieldId);
  }

  if (
    selected.length === 1
    && fallbackTargets.length >= 2
    && selected[0] === fallbackTargets[0]
  ) {
    selected.push(fallbackTargets[1]);
  }

  return orderFieldIds(selected);
}

export function getUrgencyFromWarning(warning) {
  const safeWarning = isObject(warning) ? warning : {};
  const score = Number(safeWarning.score);
  const severity = toText(safeWarning.severity).toLowerCase();
  if (severity === 'critical' || score >= 90) return 'red';
  if (severity === 'high' || score >= 75) return 'orange';
  return 'yellow';
}

export function inferL1TargetFields({
  warning,
  l1LowConfidenceFields = [],
}) {
  const safeWarning = isObject(warning) ? warning : {};
  const warningId = toText(safeWarning.id);

  if (warningId === 'intent-low-confidence') {
    const lowFields = orderFieldIds(l1LowConfidenceFields);
    return lowFields.length ? lowFields : ['who', 'what', 'success'];
  }

  if (WARNING_ID_TARGETS[warningId]) {
    return [...WARNING_ID_TARGETS[warningId]];
  }

  const fallbackTargets = getDomainFallbackTargets(safeWarning.domain);
  const scores = createScoreMap();
  fallbackTargets.forEach((fieldId) => {
    scores[fieldId] += 1;
  });
  applyFieldMatchers(buildSourceText(safeWarning), scores);
  return pickFieldsFromScores(scores, fallbackTargets);
}

export function buildL1FocusGuideFromWarning({
  warning,
  l1LowConfidenceFields = [],
}) {
  const safeWarning = isObject(warning) ? warning : {};
  const urgency = getUrgencyFromWarning(safeWarning);
  const warningTitle = toText(safeWarning.title, 'L4 경고');
  return {
    active: true,
    warningId: toText(safeWarning.id),
    warningTitle,
    urgency,
    targetFields: inferL1TargetFields({
      warning: safeWarning,
      l1LowConfidenceFields,
    }),
  };
}
