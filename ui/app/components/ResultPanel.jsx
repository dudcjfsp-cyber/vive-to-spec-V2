import React, { useEffect, useMemo, useRef, useState } from 'react';

// -------------------------------------------------------
// AX Layer UI/Validation constants
// -------------------------------------------------------
const AX_LAYER_TABS = [
  { id: 'L1', label: 'L1 Intent Extractor' },
  { id: 'L2', label: 'L2 Logic Mapper' },
  { id: 'L3', label: 'L3 Context Optimizer' },
  { id: 'L4', label: 'L4 Integrity Simulator' },
  { id: 'L5', label: 'L5 Action Binder' },
];

const WARNING_SEVERITY_SCORE = {
  critical: 95,
  high: 78,
  medium: 58,
  low: 35,
};
const WARNING_DOMAIN_WEIGHT = {
  permission: 20,
  data_flow: 14,
  coherence: 10,
  completeness: 6,
};
const WARNING_DOMAIN_LABEL = {
  permission: '권한/보안',
  data_flow: '데이터 흐름',
  coherence: '의도 정합',
  completeness: '완성도',
};
const GATE_SCORE_THRESHOLD = 70;
const GATE_STATUS_META = {
  blocked: {
    label: 'blocked',
    message: '고위험 경고가 남아 실행이 차단됩니다.',
  },
  review: {
    label: 'review',
    message: '차단은 아니지만 실행 전 검토가 필요한 경고가 있습니다.',
  },
  pass: {
    label: 'pass',
    message: '현재 고위험 경고가 없어 실행 가능합니다.',
  },
};
const CTA_HISTORY_MAX_LENGTH = 80;
const INTENT_FIELD_ORDER = ['who', 'when', 'what', 'why', 'success'];
const INTENT_FIELD_LABELS = {
  who: '누가',
  when: '언제',
  what: '무엇을',
  why: '왜',
  success: '성공기준',
};
const FILLER_PATTERN = /(미정|아직|tbd|todo|unknown|없음|미입력|추후|불명)/i;
const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'will', 'have', 'has',
  '있는', '에서', '으로', '에게', '하기', '위해', '대한', '그리고', '또한', '기능', '화면',
  '사용자', '데이터', '정보', '처리', '단계', '기준', '가설', '정의', '요청', '변경',
]);

// -------------------------------------------------------
// Shared utility helpers
// -------------------------------------------------------
function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

function toObjectArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isObject(item) ? item : null))
    .filter(Boolean);
}

function appendLine(base, line) {
  const safeBase = toText(base);
  const safeLine = toText(line);
  if (!safeLine) return safeBase;
  if (!safeBase) return safeLine;
  return safeBase.includes(safeLine) ? safeBase : `${safeBase}\n${safeLine}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// -------------------------------------------------------
// L1 Intent intelligence helpers
// -------------------------------------------------------
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

function buildL1Intelligence({ vibeText, hypothesis }) {
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

// -------------------------------------------------------
// L2 Logic-map intelligence helpers
// -------------------------------------------------------
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

function buildL2Intelligence({ logicMap, changedAxis }) {
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

// -------------------------------------------------------
// Runtime safety + CTA history helpers
// -------------------------------------------------------
function deepClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function formatLocalTime(ts) {
  const parsed = Number(ts);
  if (!Number.isFinite(parsed)) return '-';
  return new Date(parsed).toLocaleTimeString('ko-KR', { hour12: false });
}

function formatHistoryMeta(meta) {
  if (!isObject(meta)) return '';
  const parts = Object.entries(meta)
    .map(([key, value]) => `${key}=${toText(value) || String(value)}`)
    .filter((item) => item && !item.endsWith('='));
  return parts.join(' | ');
}

function toErrorMessage(error) {
  if (error instanceof Error) return toText(error.message, 'Unknown error');
  return toText(String(error), 'Unknown error');
}

function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}

// -------------------------------------------------------
// L4 Integrity scoring helpers
// -------------------------------------------------------
function inferRiskProfile(detail) {
  const text = toText(detail).toLowerCase();
  if (/(권한|삭제|보안|permission|security)/.test(text)) {
    return { domain: 'permission', severity: 'critical', gateImpact: 'hard' };
  }
  if (/(데이터|흐름|sync|동기화|db|api|data-flow|flow)/.test(text)) {
    return { domain: 'data_flow', severity: 'high', gateImpact: 'hard' };
  }
  if (/(의도|정합|coherence|intent)/.test(text)) {
    return { domain: 'coherence', severity: 'high', gateImpact: 'hard' };
  }
  if (/(테스트|누락|모호|질문|score|진단|warning)/.test(text)) {
    return { domain: 'completeness', severity: 'medium', gateImpact: 'soft' };
  }
  return { domain: 'completeness', severity: 'medium', gateImpact: 'soft' };
}

function computeWarningScore({
  severity = 'medium',
  domain = 'completeness',
  gateImpact = 'soft',
  actionsCount = 0,
  hasAutoAction = false,
}) {
  const base = WARNING_SEVERITY_SCORE[severity] || WARNING_SEVERITY_SCORE.medium;
  const domainWeight = WARNING_DOMAIN_WEIGHT[domain] || WARNING_DOMAIN_WEIGHT.completeness;
  const gateWeight = gateImpact === 'hard' ? 8 : 0;
  const actionWeight = actionsCount > 0 ? -2 : 0;
  const autoActionWeight = hasAutoAction ? 4 : 0;
  return clamp(base + domainWeight + gateWeight + actionWeight + autoActionWeight, 0, 100);
}

function createScoredWarning({
  id,
  title,
  detail,
  actions = [],
  autoAction = '',
  severity = 'medium',
  domain = 'completeness',
  gateImpact = 'soft',
}) {
  const score = computeWarningScore({
    severity,
    domain,
    gateImpact,
    actionsCount: actions.length,
    hasAutoAction: Boolean(autoAction),
  });
  return {
    id,
    title,
    detail,
    actions,
    autoAction,
    severity,
    domain,
    gateImpact,
    score,
  };
}

function sortWarningsByPriority(warnings) {
  return [...warnings].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });
}

function getGateStatusFromWarnings(unresolvedWarnings) {
  const hasBlockingWarning = unresolvedWarnings.some(
    (warning) => warning.gateImpact === 'hard' && warning.score >= GATE_SCORE_THRESHOLD,
  );
  if (hasBlockingWarning) return 'blocked';
  if (unresolvedWarnings.length > 0) return 'review';
  return 'pass';
}

// -------------------------------------------------------
// Layer payload builders
// -------------------------------------------------------
function buildProblemFrame(spec) {
  const frame = isObject(spec?.문제정의_5칸) ? spec.문제정의_5칸 : {};
  return {
    who: toText(frame.누가),
    when: toText(frame.언제),
    what: toText(frame.무엇을),
    why: toText(frame.왜),
    success: toText(frame.성공기준),
  };
}

function buildLogicMap(spec, hypothesis) {
  const features = isObject(spec?.핵심_기능) ? spec.핵심_기능 : {};
  const mustFeatures = toStringArray(features.필수);
  const fields = toObjectArray(spec?.입력_데이터_필드);
  const flow = toStringArray(spec?.화면_흐름_5단계);

  const dbMap = fields.length
    ? fields
      .map((field) => `- ${toText(field.이름, '필드')}: ${toText(field.타입, 'string')} (예시: ${toText(field.예시, '-')})`)
      .join('\n')
    : '- 입력 필드 정의를 먼저 채워주세요.';
  const apiMap = mustFeatures.length
    ? mustFeatures.map((feature, idx) => `- POST /api/task-${idx + 1}: ${feature}`).join('\n')
    : '- 기능 명세가 비어 있어 API 매핑을 생성하지 못했습니다.';
  const uiMap = flow.length
    ? flow.map((step, idx) => `${idx + 1}. ${step}`).join('\n')
    : '- 화면 흐름이 비어 있습니다.';

  return {
    text: [
      hypothesis.what ? `- 핵심 문제: ${hypothesis.what}` : '',
      hypothesis.success ? `- 성공 기준: ${hypothesis.success}` : '',
      ...mustFeatures.map((feature) => `- 필수 기능: ${feature}`),
    ].filter(Boolean).join('\n'),
    db: dbMap,
    api: apiMap,
    ui: uiMap,
  };
}

function buildContextOutputs({ devSpec, nondevSpec, masterPrompt, hypothesis, logicMap }) {
  const fallbackDev = [
    '# Developer Context',
    `- intent: ${hypothesis.what || '-'}`,
    `- success_criteria: ${hypothesis.success || '-'}`,
    '',
    '## Logic Map',
    '[TEXT]',
    logicMap.text || '-',
    '',
    '[DB]',
    logicMap.db || '-',
    '',
    '[API]',
    logicMap.api || '-',
    '',
    '[UI]',
    logicMap.ui || '-',
  ].join('\n');

  const fallbackNondev = [
    '무엇을 만들지 한 문장으로 말하면:',
    `- ${hypothesis.what || '아직 정의되지 않음'}`,
    '',
    '왜 이걸 하는지:',
    `- ${hypothesis.why || '아직 정의되지 않음'}`,
    '',
    '성공하면 무엇이 달라지는지:',
    `- ${hypothesis.success || '아직 정의되지 않음'}`,
  ].join('\n');

  const fallbackAiCoding = [
    'You are an implementation assistant.',
    `Goal: ${hypothesis.what || '-'}`,
    `Success Criteria: ${hypothesis.success || '-'}`,
    '',
    'Use this synced logic map:',
    '[TEXT]',
    logicMap.text || '-',
    '[DB]',
    logicMap.db || '-',
    '[API]',
    logicMap.api || '-',
    '[UI]',
    logicMap.ui || '-',
  ].join('\n');

  return {
    dev: toText(devSpec) || fallbackDev,
    nondev: toText(nondevSpec) || fallbackNondev,
    aiCoding: toText(masterPrompt) || fallbackAiCoding,
  };
}

function buildActionPack({ contextOutputs, todayActions, activeModel, gateStatus }) {
  return [
    '# Execution Pack',
    `- model: ${activeModel}`,
    `- gate: ${toText(gateStatus, 'review')}`,
    '',
    '## 오늘 실행 3단계',
    ...(todayActions.length ? todayActions.map((item, idx) => `${idx + 1}. ${item}`) : ['1. 액션 항목이 없어 우선순위를 다시 확정하세요.']),
    '',
    '## AI Coding Prompt',
    contextOutputs.aiCoding || '-',
  ].join('\n');
}

// -------------------------------------------------------
// Presentational components
// -------------------------------------------------------
function TextBlock({ title, value }) {
  return (
    <section>
      <h3>{title}</h3>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{value || '-'}</pre>
    </section>
  );
}

function LayerTabButton({ tab, activeLayer, onSelect }) {
  const isActive = activeLayer === tab.id;
  return (
    <button
      type="button"
      onClick={() => onSelect(tab.id)}
      style={{
        border: isActive ? '2px solid #0b57d0' : '1px solid #bbb',
        background: isActive ? '#e9f1ff' : '#fff',
        borderRadius: 8,
        padding: '8px 12px',
        cursor: 'pointer',
      }}
    >
      {tab.label}
    </button>
  );
}

function L1HypothesisEditor({
  hypothesis,
  onChangeHypothesis,
  l1Intelligence,
  hypothesisConfirmed,
  hypothesisConfirmedStamp,
  onConfirmHypothesis,
  onApplySuggestedHypothesis,
}) {
  const fields = [
    { id: 'who', label: '누가' },
    { id: 'when', label: '언제' },
    { id: 'what', label: '무엇을' },
    { id: 'why', label: '왜' },
    { id: 'success', label: '성공기준' },
  ];

  return (
    <section>
      <h3>L1 Intent Extractor</h3>
      <p>AI 가설을 수정/확정 중심으로 다듬고, 신뢰도 낮은 항목부터 질문으로 보완합니다.</p>
      <p style={{ fontSize: 12, marginTop: 0 }}>
        추론 신뢰도: <strong>{l1Intelligence.overallConfidence}</strong>/100 ({l1Intelligence.confidenceBand})
      </p>
      {fields.map((field) => (
        <div key={field.id} style={{ marginBottom: 8 }}>
          <label htmlFor={`l1-${field.id}`} style={{ display: 'block', fontWeight: 600 }}>
            {field.label} ({l1Intelligence.fieldConfidence[field.id] || 0})
          </label>
          <input
            id={`l1-${field.id}`}
            type="text"
            value={hypothesis[field.id]}
            onChange={(event) => onChangeHypothesis(field.id, event.target.value)}
            style={{ width: '100%' }}
          />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type="button" onClick={onApplySuggestedHypothesis}>추천 가설 적용</button>
        <button type="button" onClick={onConfirmHypothesis}>가설 확정</button>
      </div>
      {l1Intelligence.questions.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <strong>우선 확인 질문</strong>
          <ol style={{ marginTop: 6 }}>
            {l1Intelligence.questions.map((question, idx) => (
              <li key={`${question}-${idx}`}>{question}</li>
            ))}
          </ol>
        </div>
      )}
      <p style={{ fontSize: 12, marginTop: 8 }}>
        상태: {hypothesisConfirmed ? `확정됨 (${hypothesisConfirmedStamp})` : '미확정'}
      </p>
    </section>
  );
}

function L2LogicMapper({
  logicMap,
  changedAxis,
  syncHint,
  l2Intelligence,
  onChangeLogicAxis,
  onApplySync,
}) {
  const axes = [
    { id: 'text', label: 'Text' },
    { id: 'db', label: 'DB' },
    { id: 'api', label: 'API' },
    { id: 'ui', label: 'UI' },
  ];

  return (
    <section>
      <h3>L2 Logic Mapper</h3>
      <p>한 축을 수정하면 다른 축 영향도를 함께 안내하고, 연동 반영으로 동기화합니다.</p>
      <p style={{ fontSize: 12, marginTop: 0 }}>
        합성 점수: <strong>{l2Intelligence.overallScore}</strong>/100
        {' | '}
        정합성: {l2Intelligence.alignmentScore}
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
        {axes.map((axis) => (
          <div key={axis.id}>
            <label htmlFor={`l2-${axis.id}`} style={{ display: 'block', fontWeight: 600 }}>
              {axis.label} ({l2Intelligence.coverageByAxis[axis.id] || 0})
            </label>
            <textarea
              id={`l2-${axis.id}`}
              rows={8}
              value={logicMap[axis.id]}
              onChange={(event) => onChangeLogicAxis(axis.id, event.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12 }}>
        {changedAxis
          ? `변경 감지 축: ${changedAxis.toUpperCase()} | 연동 제안: ${syncHint}`
          : '축 변경을 감지하면 연동 제안을 표시합니다.'}
      </p>
      {l2Intelligence.syncSuggestions.length > 0 && (
        <ul style={{ marginTop: 6 }}>
          {l2Intelligence.syncSuggestions.map((item, idx) => (
            <li key={`${item}-${idx}`}>{item}</li>
          ))}
        </ul>
      )}
      <button type="button" onClick={onApplySync}>연동 반영</button>
    </section>
  );
}

function L3ContextOptimizer({
  contextOutputs,
  exportStatus,
  onExportContext,
}) {
  const targets = [
    { id: 'dev', title: '개발자용 (엄격 타입)' },
    { id: 'nondev', title: '비전공자용 (행동/비유)' },
    { id: 'aiCoding', title: 'AI 코딩용 (실행 프롬프트)' },
  ];

  return (
    <section>
      <h3>L3 Context Optimizer</h3>
      <p>동일 의미를 수신자별 포맷으로 인코딩해 내보냅니다.</p>
      {targets.map((target) => (
        <div key={target.id} style={{ marginBottom: 12 }}>
          <strong>{target.title}</strong>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, border: '1px solid #e5e5e5' }}>
            {contextOutputs[target.id] || '-'}
          </pre>
        </div>
      ))}
      <button type="button" onClick={onExportContext}>대상별 내보내기</button>
      <p style={{ fontSize: 12, marginTop: 8 }}>{exportStatus || '아직 내보내기 전'}</p>
    </section>
  );
}

function L4IntegritySimulator({
  gateStatus,
  integritySignals,
  topWarnings,
  remainingWarnings,
  onWarningAction,
  onApplyAutoFixes,
}) {
  const gateMeta = GATE_STATUS_META[gateStatus] || GATE_STATUS_META.pass;

  return (
    <section>
      <h3>L4 Integrity Simulator</h3>
      <p>
        상태: <strong>{gateMeta.label}</strong> | 우선 경고 {topWarnings.length}개 노출 (점수 상위)
      </p>
      <p style={{ fontSize: 12 }}>{gateMeta.message}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
        <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>
          Data-Flow: {integritySignals.dataFlow}
        </span>
        <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>
          Permission: {integritySignals.permission}
        </span>
        <span style={{ border: '1px solid #ddd', borderRadius: 999, padding: '4px 8px', fontSize: 12 }}>
          Coherence: {integritySignals.coherence}
        </span>
      </div>
      {topWarnings.length === 0 && <p>충돌 없음. L5로 진행 가능합니다.</p>}
      {topWarnings.map((warning) => (
        <article key={warning.id} style={{ border: '1px solid #ddd', borderRadius: 8, padding: 10, marginBottom: 10 }}>
          <strong>{warning.title}</strong>
          <p style={{ fontSize: 12, margin: '6px 0' }}>
            {warning.severity.toUpperCase()} | {WARNING_DOMAIN_LABEL[warning.domain] || warning.domain} | score {warning.score}
          </p>
          <p style={{ margin: '6px 0' }}>{warning.detail}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {warning.actions.map((action) => (
              <button
                key={`${warning.id}-${action.id}`}
                type="button"
                onClick={() => onWarningAction(warning.id, action.id)}
              >
                {action.label}
              </button>
            ))}
          </div>
        </article>
      ))}
      {remainingWarnings.length > 0 && (
        <details>
          <summary>자세히 보기 ({remainingWarnings.length})</summary>
          <ul>
            {remainingWarnings.map((warning) => (
              <li key={warning.id}>
                {warning.title} (score {warning.score})
              </li>
            ))}
          </ul>
        </details>
      )}
      <button type="button" onClick={onApplyAutoFixes} disabled={topWarnings.length === 0}>
        자동 보정 제안 적용
      </button>
    </section>
  );
}

function L5ActionBinder({
  todayActions,
  gateStatus,
  actionPack,
  onCreateActionPack,
}) {
  return (
    <section>
      <h3>L5 Action Binder</h3>
      <p>L4 게이트 상태를 통과해야 실행 팩을 생성할 수 있습니다.</p>
      <ul>
        {todayActions.length
          ? todayActions.map((item, idx) => <li key={`${item}-${idx}`}>{item}</li>)
          : <li>오늘 할 일이 아직 생성되지 않았습니다.</li>}
      </ul>
      <button type="button" onClick={onCreateActionPack} disabled={gateStatus === 'blocked'}>
        실행 팩 생성
      </button>
      {gateStatus === 'blocked' && <p style={{ fontSize: 12 }}>L4 상태가 blocked라서 실행 CTA가 비활성화되었습니다.</p>}
      {gateStatus === 'review' && <p style={{ fontSize: 12 }}>경고가 남아 있어 review 상태입니다. 실행 전 상위 경고를 먼저 처리하는 것을 권장합니다.</p>}
      {actionPack && (
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 8, border: '1px solid #e5e5e5', marginTop: 10 }}>
          {actionPack}
        </pre>
      )}
    </section>
  );
}

function CtaHistoryPanel({
  entries,
  onRollback,
}) {
  const visibleEntries = entries.slice(0, 12);

  return (
    <section style={{ marginTop: 12, border: '1px solid #ddd', borderRadius: 10, padding: 12 }}>
      <h3>CTA 실행 이력</h3>
      <p style={{ fontSize: 12, marginTop: 0 }}>
        최신 {visibleEntries.length}건 표시. 버튼 한 번으로 해당 액션 이전 상태로 되돌립니다.
      </p>
      {visibleEntries.length === 0 && <p style={{ marginBottom: 0 }}>기록된 CTA 이력이 없습니다.</p>}
      {visibleEntries.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
          {visibleEntries.map((entry) => (
            <li key={entry.id} style={{ border: '1px solid #e6e6e6', borderRadius: 8, padding: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                <div>
                  <strong>{entry.label}</strong>
                  <div style={{ fontSize: 12 }}>
                    {entry.layerId} | {entry.actionId} | {formatLocalTime(entry.ts)}
                  </div>
                  <div style={{ fontSize: 12, color: entry.status === 'failed' ? '#b00020' : '#444' }}>
                    상태: {toText(entry.status, 'done')}
                    {entry.error ? ` | 오류: ${entry.error}` : ''}
                  </div>
                  {formatHistoryMeta(entry.meta) && (
                    <div style={{ fontSize: 12, color: '#444' }}>{formatHistoryMeta(entry.meta)}</div>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => onRollback(entry.id)}
                    disabled={!isObject(entry.snapshotBefore)}
                  >
                    이 시점으로 되돌리기
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function ResultPanel({
  status,
  errorMessage,
  activeModel,
  hybridStackGuideStatus,
  vibe,
  standardOutput,
  nondevSpec,
  devSpec,
  masterPrompt,
  onRefreshHybrid,
}) {
  // 1) Core panel state (L1~L5 interaction state + derived artifacts)
  const [activeLayer, setActiveLayer] = useState('L1');
  const [hypothesis, setHypothesis] = useState(buildProblemFrame({}));
  const [hypothesisConfirmed, setHypothesisConfirmed] = useState(false);
  const [hypothesisConfirmedStamp, setHypothesisConfirmedStamp] = useState('');
  const [logicMap, setLogicMap] = useState(buildLogicMap({}, buildProblemFrame({})));
  const [changedAxis, setChangedAxis] = useState('');
  const [syncHint, setSyncHint] = useState('');
  const [permissionGuardEnabled, setPermissionGuardEnabled] = useState(false);
  const [contextOutputs, setContextOutputs] = useState(
    buildContextOutputs({
      devSpec: '',
      nondevSpec: '',
      masterPrompt: '',
      hypothesis: buildProblemFrame({}),
      logicMap: buildLogicMap({}, buildProblemFrame({})),
    }),
  );
  const [exportStatus, setExportStatus] = useState('');
  const [resolvedWarningIds, setResolvedWarningIds] = useState([]);
  const [actionPack, setActionPack] = useState('');
  const [ctaHistory, setCtaHistory] = useState([]);
  const historySequenceRef = useRef(0);

  // 2) Snapshot/rollback primitives for CTA reliability
  const buildPanelSnapshot = () => ({
    activeLayer,
    hypothesis: deepClone(hypothesis),
    hypothesisConfirmed,
    hypothesisConfirmedStamp,
    logicMap: deepClone(logicMap),
    changedAxis,
    syncHint,
    permissionGuardEnabled,
    contextOutputs: deepClone(contextOutputs),
    exportStatus,
    resolvedWarningIds: deepClone(resolvedWarningIds),
    actionPack,
  });

  const restorePanelSnapshot = (snapshot) => {
    const safe = isObject(snapshot) ? snapshot : {};
    setActiveLayer(toText(safe.activeLayer, 'L1'));
    setHypothesis(isObject(safe.hypothesis) ? deepClone(safe.hypothesis) : buildProblemFrame({}));
    setHypothesisConfirmed(Boolean(safe.hypothesisConfirmed));
    setHypothesisConfirmedStamp(toText(safe.hypothesisConfirmedStamp));
    setLogicMap(isObject(safe.logicMap) ? deepClone(safe.logicMap) : buildLogicMap({}, buildProblemFrame({})));
    setChangedAxis(toText(safe.changedAxis));
    setSyncHint(toText(safe.syncHint));
    setPermissionGuardEnabled(Boolean(safe.permissionGuardEnabled));
    setContextOutputs(isObject(safe.contextOutputs)
      ? deepClone(safe.contextOutputs)
      : buildContextOutputs({
        devSpec,
        nondevSpec,
        masterPrompt,
        hypothesis: buildProblemFrame({}),
        logicMap: buildLogicMap({}, buildProblemFrame({})),
      }));
    setExportStatus(toText(safe.exportStatus));
    setResolvedWarningIds(Array.isArray(safe.resolvedWarningIds) ? deepClone(safe.resolvedWarningIds) : []);
    setActionPack(toText(safe.actionPack));
  };

  const appendHistoryEntry = ({ layerId, actionId, label, meta = {}, snapshotBefore }) => {
    historySequenceRef.current += 1;
    const entry = {
      id: `cta-${Date.now()}-${historySequenceRef.current}`,
      ts: Date.now(),
      layerId: toText(layerId, 'SYSTEM'),
      actionId: toText(actionId, 'action'),
      label: toText(label, '액션 실행'),
      status: 'running',
      error: '',
      meta: isObject(meta) ? deepClone(meta) : {},
      snapshotBefore: isObject(snapshotBefore) ? deepClone(snapshotBefore) : null,
    };
    setCtaHistory((prev) => [entry, ...prev].slice(0, CTA_HISTORY_MAX_LENGTH));
    return entry.id;
  };

  const patchHistoryEntry = (entryId, patch = {}) => {
    if (!toText(entryId)) return;
    setCtaHistory((prev) => prev.map((entry) => (
      entry.id === entryId ? { ...entry, ...patch } : entry
    )));
  };

  const runCtaAction = ({ layerId, actionId, label, meta = {}, mutate }) => {
    const snapshotBefore = deepClone(buildPanelSnapshot());
    const entryId = appendHistoryEntry({ layerId, actionId, label, meta, snapshotBefore });

    if (typeof mutate !== 'function') {
      patchHistoryEntry(entryId, { status: 'done' });
      return undefined;
    }

    const failAndRestore = (error) => {
      restorePanelSnapshot(snapshotBefore);
      const message = toErrorMessage(error);
      patchHistoryEntry(entryId, { status: 'failed', error: message });
      setExportStatus(`CTA 실행 실패: ${message}`);
      return undefined;
    };

    try {
      const result = mutate();
      if (isPromiseLike(result)) {
        return result
          .then((resolved) => {
            patchHistoryEntry(entryId, { status: 'done', error: '' });
            return resolved;
          })
          .catch((error) => failAndRestore(error));
      }

      patchHistoryEntry(entryId, { status: 'done', error: '' });
      return result;
    } catch (error) {
      return failAndRestore(error);
    }
  };

  // 3) Source payload hydration
  useEffect(() => {
    const safeSpec = isObject(standardOutput) ? standardOutput : {};
    const nextHypothesis = buildProblemFrame(safeSpec);
    const nextLogicMap = buildLogicMap(safeSpec, nextHypothesis);

    setHypothesis(nextHypothesis);
    setHypothesisConfirmed(false);
    setHypothesisConfirmedStamp('');
    setLogicMap(nextLogicMap);
    setChangedAxis('');
    setSyncHint('');
    setPermissionGuardEnabled(false);
    setContextOutputs(buildContextOutputs({
      devSpec,
      nondevSpec,
      masterPrompt,
      hypothesis: nextHypothesis,
      logicMap: nextLogicMap,
    }));
    setExportStatus('');
    setResolvedWarningIds([]);
    setActionPack('');
    setCtaHistory([]);
    historySequenceRef.current = 0;
    setActiveLayer('L1');
  }, [standardOutput, devSpec, nondevSpec, masterPrompt]);

  const todayActions = useMemo(
    () => toStringArray(standardOutput?.오늘_할_일_3개),
    [standardOutput],
  );

  // 4) L1/L2 intelligence signals
  const l1Intelligence = useMemo(
    () => buildL1Intelligence({ vibeText: vibe, hypothesis }),
    [vibe, hypothesis],
  );
  const l2Intelligence = useMemo(
    () => buildL2Intelligence({ logicMap, changedAxis }),
    [logicMap, changedAxis],
  );

  const integritySignals = useMemo(() => {
    const safeSpec = isObject(standardOutput) ? standardOutput : {};
    const permissionRules = toObjectArray(safeSpec.권한_규칙);
    const deleteRoles = permissionRules
      .filter((rule) => Boolean(rule.삭제))
      .map((rule) => toText(rule.역할, '역할 미정'));
    const hasPermissionConflict = deleteRoles.length > 0 && !permissionGuardEnabled;
    const hasIntentMismatch = Boolean(hypothesis.what && !logicMap.text.includes(hypothesis.what));
    const lowIntentConfidence = l1Intelligence.overallConfidence < 65;

    const dataFlow = (changedAxis || l2Intelligence.alignmentScore < 45 || l2Intelligence.overallScore < 60)
      ? 'fail'
      : ((l2Intelligence.alignmentScore < 70 || l2Intelligence.syncSuggestions.length > 0) ? 'review' : 'pass');
    const permission = hasPermissionConflict ? 'fail' : 'pass';
    const coherence = hasIntentMismatch
      ? 'fail'
      : (lowIntentConfidence ? 'review' : 'pass');

    return {
      dataFlow,
      permission,
      coherence,
      deleteRoles,
      hasPermissionConflict,
      hasIntentMismatch,
      lowIntentConfidence,
    };
  }, [
    standardOutput,
    permissionGuardEnabled,
    hypothesis.what,
    logicMap.text,
    changedAxis,
    l1Intelligence.overallConfidence,
    l2Intelligence.alignmentScore,
    l2Intelligence.overallScore,
    l2Intelligence.syncSuggestions.length,
  ]);

  // 5) L4 warning graph and gate derivation
  const warnings = useMemo(() => {
    const safeSpec = isObject(standardOutput) ? standardOutput : {};
    const completeness = isObject(safeSpec.완성도_진단) ? safeSpec.완성도_진단 : {};
    const schemaWarnings = toStringArray(completeness.누락_경고);

    const items = schemaWarnings.map((text, idx) => {
      const riskProfile = inferRiskProfile(text);
      return createScoredWarning({
        id: `schema-${idx}`,
        title: `스키마 경고 ${idx + 1}`,
        detail: text,
        actions: [
          { id: 'go-l1', label: 'L1에서 확인' },
          { id: 'mark-resolved', label: '확인 완료' },
        ],
        autoAction: 'mark-resolved',
        severity: riskProfile.severity,
        domain: riskProfile.domain,
        gateImpact: riskProfile.gateImpact,
      });
    });

    if (!hypothesisConfirmed) {
      items.push(createScoredWarning({
        id: 'intent-unconfirmed',
        title: 'L1 가설 미확정',
        detail: '사용자 확정 전 단계입니다. 가설 확정을 먼저 수행하세요.',
        actions: [
          { id: 'confirm-intent', label: '가설 확정' },
          { id: 'go-l1', label: 'L1 열기' },
        ],
        autoAction: 'confirm-intent',
        severity: 'medium',
        domain: 'completeness',
        gateImpact: 'soft',
      }));
    }

    if (integritySignals.lowIntentConfidence) {
      const lowFields = l1Intelligence.lowConfidenceFields
        .map((fieldId) => INTENT_FIELD_LABELS[fieldId] || fieldId)
        .join(', ');
      items.push(createScoredWarning({
        id: 'intent-low-confidence',
        title: 'Intent Extractor Confidence',
        detail: `의도 추론 신뢰도(${l1Intelligence.overallConfidence})가 낮습니다. 우선 보강 필드: ${lowFields || '-'}`,
        actions: [
          { id: 'apply-suggested-hypothesis', label: '추천 가설 적용' },
          { id: 'go-l1', label: 'L1 열기' },
        ],
        autoAction: 'apply-suggested-hypothesis',
        severity: l1Intelligence.overallConfidence < 50 ? 'high' : 'medium',
        domain: 'coherence',
        gateImpact: l1Intelligence.overallConfidence < 50 ? 'hard' : 'soft',
      }));
    }

    if (integritySignals.dataFlow !== 'pass') {
      const gateImpact = changedAxis || l2Intelligence.alignmentScore < 45 ? 'hard' : 'soft';
      const severity = l2Intelligence.overallScore < 55 ? 'high' : 'medium';
      items.push(createScoredWarning({
        id: 'data-flow-alignment',
        title: 'Data-Flow Alignment',
        detail: `L2 합성 ${l2Intelligence.overallScore}, 정합성 ${l2Intelligence.alignmentScore}. 축 간 동기화 점검이 필요합니다.`,
        actions: [
          { id: 'sync-apply', label: '연동 반영' },
          { id: 'go-l2', label: 'L2 열기' },
        ],
        autoAction: changedAxis ? 'sync-apply' : '',
        severity,
        domain: 'data_flow',
        gateImpact,
      }));
    }

    if (integritySignals.hasPermissionConflict) {
      items.push(createScoredWarning({
        id: 'permission-delete',
        title: 'Permission-Action Conflict',
        detail: `삭제 권한이 켜진 역할이 있습니다: ${integritySignals.deleteRoles.join(', ')}`,
        actions: [
          { id: 'apply-permission-guard', label: '삭제 보호 적용' },
          { id: 'go-l2', label: 'L2 열기' },
        ],
        autoAction: 'apply-permission-guard',
        severity: 'critical',
        domain: 'permission',
        gateImpact: 'hard',
      }));
    }

    if (integritySignals.hasIntentMismatch) {
      items.push(createScoredWarning({
        id: 'intent-mismatch',
        title: 'Intent-Spec Coherence',
        detail: 'L1 핵심 문제 문장이 L2 Text 축에 반영되지 않았습니다.',
        actions: [
          { id: 'align-intent', label: '의도 반영' },
          { id: 'go-l1', label: 'L1 열기' },
        ],
        autoAction: 'align-intent',
        severity: 'high',
        domain: 'coherence',
        gateImpact: 'hard',
      }));
    }

    return sortWarningsByPriority(items);
  }, [
    standardOutput,
    hypothesisConfirmed,
    changedAxis,
    l1Intelligence.overallConfidence,
    l1Intelligence.lowConfidenceFields,
    l2Intelligence.overallScore,
    l2Intelligence.alignmentScore,
    integritySignals,
  ]);

  const unresolvedWarnings = useMemo(
    () => sortWarningsByPriority(warnings.filter((warning) => !resolvedWarningIds.includes(warning.id))),
    [warnings, resolvedWarningIds],
  );
  const topWarnings = unresolvedWarnings.slice(0, 3);
  const remainingWarnings = unresolvedWarnings.slice(3);
  const gateStatus = useMemo(
    () => getGateStatusFromWarnings(unresolvedWarnings),
    [unresolvedWarnings],
  );

  // 6) Action handlers (CTA + warning operations)
  const markWarningResolved = (warningId) => {
    setResolvedWarningIds((prev) => (prev.includes(warningId) ? prev : [...prev, warningId]));
  };

  const confirmHypothesis = () => {
    runCtaAction({
      layerId: 'L1',
      actionId: 'confirm-hypothesis',
      label: '가설 확정',
      mutate: () => {
        setHypothesisConfirmed(true);
        setHypothesisConfirmedStamp(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
        markWarningResolved('intent-unconfirmed');
      },
    });
  };

  const getSyncHintByAxis = (axis) => {
    if (axis === 'text') return 'Text 변경을 DB/API/UI에 전파하세요.';
    if (axis === 'db') return 'DB 변경을 API 계약과 UI 입력 흐름에 반영하세요.';
    if (axis === 'api') return 'API 변경을 UI 호출과 Text 설명에 동기화하세요.';
    if (axis === 'ui') return 'UI 변경을 API 동작 및 Text 목표와 정합성 검토하세요.';
    return '';
  };

  const handleChangeHypothesis = (field, value) => {
    setHypothesis((prev) => ({ ...prev, [field]: value }));
    setHypothesisConfirmed(false);
    setHypothesisConfirmedStamp('');
    setResolvedWarningIds((prev) => prev.filter((id) => id !== 'intent-unconfirmed' && id !== 'intent-low-confidence'));
  };

  const applySuggestedHypothesis = () => {
    runCtaAction({
      layerId: 'L1',
      actionId: 'apply-suggested-hypothesis',
      label: '추천 가설 적용',
      mutate: () => {
        setHypothesis((prev) => ({
          ...prev,
          ...l1Intelligence.suggestedHypothesis,
        }));
        setHypothesisConfirmed(false);
        setHypothesisConfirmedStamp('');
        setResolvedWarningIds((prev) => prev.filter((id) => id !== 'intent-unconfirmed' && id !== 'intent-low-confidence'));
      },
    });
  };

  const handleChangeLogicAxis = (axis, value) => {
    setLogicMap((prev) => ({ ...prev, [axis]: value }));
    setChangedAxis(axis);
    setSyncHint(getSyncHintByAxis(axis));
    setResolvedWarningIds((prev) => prev.filter((id) => id !== 'data-flow-alignment'));
  };

  const applySync = () => {
    runCtaAction({
      layerId: 'L2',
      actionId: 'apply-sync',
      label: '연동 반영',
      meta: { axis: changedAxis || 'auto' },
      mutate: () => {
        setLogicMap((prev) => {
          if (!changedAxis) {
            return {
              text: appendLine(prev.text, '- [sync] 축 정합성 재평가 완료'),
              db: appendLine(prev.db, '- [sync] 데이터 필드 누락 점검 완료'),
              api: appendLine(prev.api, '- [sync] API 계약/권한 정합성 점검 완료'),
              ui: appendLine(prev.ui, '- [sync] UI 입력/출력 흐름 점검 완료'),
            };
          }

          if (changedAxis === 'text') {
            return {
              ...prev,
              db: appendLine(prev.db, '- [sync] 텍스트 변경 기반 필드 검토 필요'),
              api: appendLine(prev.api, '- [sync] 텍스트 변경 기반 API 계약 점검'),
              ui: appendLine(prev.ui, '- [sync] 텍스트 변경 기반 화면 문구 점검'),
            };
          }
          if (changedAxis === 'db') {
            return {
              ...prev,
              text: appendLine(prev.text, '- [sync] DB 축 변경이 반영되었습니다.'),
              api: appendLine(prev.api, '- [sync] DB 변경 기반 API 입력/응답 스키마 갱신'),
              ui: appendLine(prev.ui, '- [sync] DB 변경 기반 폼 필드 점검'),
            };
          }
          if (changedAxis === 'api') {
            return {
              ...prev,
              text: appendLine(prev.text, '- [sync] API 축 변경이 반영되었습니다.'),
              db: appendLine(prev.db, '- [sync] API 변경 기반 저장 필드 점검'),
              ui: appendLine(prev.ui, '- [sync] API 변경 기반 버튼/오류 처리 점검'),
            };
          }
          return {
            ...prev,
            text: appendLine(prev.text, '- [sync] UI 축 변경이 반영되었습니다.'),
            db: appendLine(prev.db, '- [sync] UI 변경 기반 데이터 수집 항목 점검'),
            api: appendLine(prev.api, '- [sync] UI 변경 기반 API 호출 흐름 점검'),
          };
        });

        setChangedAxis('');
        setSyncHint('');
        markWarningResolved('data-flow-alignment');
      },
    });
  };

  const handleExportContext = async () => runCtaAction({
    layerId: 'L3',
    actionId: 'export-context',
    label: '대상별 내보내기',
    mutate: async () => {
      const nextOutputs = buildContextOutputs({
        devSpec,
        nondevSpec,
        masterPrompt,
        hypothesis,
        logicMap,
      });
      setContextOutputs(nextOutputs);

      const exportBody = [
        '[개발자용]',
        nextOutputs.dev,
        '',
        '[비전공자용]',
        nextOutputs.nondev,
        '',
        '[AI 코딩용]',
        nextOutputs.aiCoding,
      ].join('\n');

      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        setExportStatus('클립보드 미지원 환경입니다. 화면 출력본을 그대로 사용하세요.');
        return;
      }

      try {
        await navigator.clipboard.writeText(exportBody);
        setExportStatus('3개 대상 출력이 클립보드로 내보내졌습니다.');
      } catch {
        setExportStatus('클립보드 내보내기에 실패했습니다. 화면 출력본을 그대로 사용하세요.');
      }
    },
  });

  const applyPermissionGuard = () => {
    runCtaAction({
      layerId: 'L4',
      actionId: 'apply-permission-guard',
      label: '삭제 보호 적용',
      mutate: () => {
        setPermissionGuardEnabled(true);
        markWarningResolved('permission-delete');
        setLogicMap((prev) => ({
          ...prev,
          api: appendLine(prev.api, '- [guard] 삭제 동작은 사용자 승인 단계 이후로 제한'),
        }));
      },
    });
  };

  const alignIntentToSpec = () => {
    runCtaAction({
      layerId: 'L4',
      actionId: 'align-intent',
      label: '의도 반영',
      mutate: () => {
        setLogicMap((prev) => ({
          ...prev,
          text: appendLine(prev.text, `- 핵심 문제 정렬: ${hypothesis.what}`),
        }));
        markWarningResolved('intent-mismatch');
      },
    });
  };

  const handleWarningAction = (warningId, actionId) => {
    if (actionId === 'go-l1') {
      runCtaAction({
        layerId: 'L4',
        actionId: 'go-l1',
        label: 'L1 열기',
        meta: { warningId },
        mutate: () => setActiveLayer('L1'),
      });
      return;
    }
    if (actionId === 'go-l2') {
      runCtaAction({
        layerId: 'L4',
        actionId: 'go-l2',
        label: 'L2 열기',
        meta: { warningId },
        mutate: () => setActiveLayer('L2'),
      });
      return;
    }
    if (actionId === 'mark-resolved') {
      runCtaAction({
        layerId: 'L4',
        actionId: 'mark-resolved',
        label: '경고 확인 완료',
        meta: { warningId },
        mutate: () => markWarningResolved(warningId),
      });
      return;
    }
    if (actionId === 'confirm-intent') {
      confirmHypothesis();
      return;
    }
    if (actionId === 'apply-suggested-hypothesis') {
      applySuggestedHypothesis();
      return;
    }
    if (actionId === 'sync-apply') {
      applySync();
      return;
    }
    if (actionId === 'apply-permission-guard') {
      applyPermissionGuard();
      return;
    }
    if (actionId === 'align-intent') {
      alignIntentToSpec();
    }
  };

  const applyAutoFixes = () => {
    runCtaAction({
      layerId: 'L4',
      actionId: 'apply-auto-fixes',
      label: '자동 보정 제안 적용',
      meta: { topWarningCount: topWarnings.length },
      mutate: () => {
        topWarnings.forEach((warning) => {
          if (warning.autoAction) {
            handleWarningAction(warning.id, warning.autoAction);
          }
        });
      },
    });
  };

  const createActionPack = () => {
    if (gateStatus === 'blocked') return;
    runCtaAction({
      layerId: 'L5',
      actionId: 'create-action-pack',
      label: '실행 팩 생성',
      meta: { gateStatus },
      mutate: () => {
        const pack = buildActionPack({
          contextOutputs,
          todayActions,
          activeModel,
          gateStatus,
        });
        setActionPack(pack);
      },
    });
  };

  const rollbackToHistory = (entryId) => {
    const target = ctaHistory.find((entry) => entry.id === entryId);
    if (!target || !isObject(target.snapshotBefore)) return;
    const targetSnapshot = deepClone(target.snapshotBefore);

    if (typeof window !== 'undefined') {
      const message = `[${target.layerId}] ${target.label} 이전 상태로 되돌릴까요?`;
      if (!window.confirm(message)) return;
    }

    runCtaAction({
      layerId: 'SYSTEM',
      actionId: 'rollback',
      label: '이력 롤백 적용',
      meta: {
        targetId: target.id,
        targetLayer: target.layerId,
        targetAction: target.actionId,
      },
      mutate: () => {
        restorePanelSnapshot(targetSnapshot);
        setExportStatus(`롤백 적용: ${target.label} 이전 상태로 되돌렸습니다.`);
      },
    });
  };

  // 7) Status gating + render
  if (status === 'idle') {
    return <p>Submit a requirement to generate specs.</p>;
  }

  if (status === 'processing') {
    return <p>Generating spec...</p>;
  }

  if (status === 'error') {
    return <p>Error: {errorMessage || 'Unknown error'}</p>;
  }

  return (
    <section style={{ marginTop: 16 }}>
      <div style={{ marginBottom: 10 }}>
        <strong>Model:</strong> {activeModel}
        {' | '}
        <strong>Hybrid stack:</strong> {hybridStackGuideStatus}
        <button type="button" onClick={onRefreshHybrid} style={{ marginLeft: 8 }}>
          Refresh Hybrid Guide
        </button>
      </div>

      <section style={{ border: '1px solid #ddd', borderRadius: 10, padding: 12 }}>
        <h2>Layer Tab (AX)</h2>
        <p>탭에서 읽고 복사하는 흐름이 아니라, 확인/수정/적용 중심으로 동작합니다.</p>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {AX_LAYER_TABS.map((tab) => (
            <LayerTabButton key={tab.id} tab={tab} activeLayer={activeLayer} onSelect={setActiveLayer} />
          ))}
        </div>

        {activeLayer === 'L1' && (
          <L1HypothesisEditor
            hypothesis={hypothesis}
            onChangeHypothesis={handleChangeHypothesis}
            l1Intelligence={l1Intelligence}
            hypothesisConfirmed={hypothesisConfirmed}
            hypothesisConfirmedStamp={hypothesisConfirmedStamp}
            onConfirmHypothesis={confirmHypothesis}
            onApplySuggestedHypothesis={applySuggestedHypothesis}
          />
        )}
        {activeLayer === 'L2' && (
          <L2LogicMapper
            logicMap={logicMap}
            changedAxis={changedAxis}
            syncHint={syncHint}
            l2Intelligence={l2Intelligence}
            onChangeLogicAxis={handleChangeLogicAxis}
            onApplySync={applySync}
          />
        )}
        {activeLayer === 'L3' && (
          <L3ContextOptimizer
            contextOutputs={contextOutputs}
            exportStatus={exportStatus}
            onExportContext={handleExportContext}
          />
        )}
        {activeLayer === 'L4' && (
          <L4IntegritySimulator
            gateStatus={gateStatus}
            integritySignals={integritySignals}
            topWarnings={topWarnings}
            remainingWarnings={remainingWarnings}
            onWarningAction={handleWarningAction}
            onApplyAutoFixes={applyAutoFixes}
          />
        )}
        {activeLayer === 'L5' && (
          <L5ActionBinder
            todayActions={todayActions}
            gateStatus={gateStatus}
            actionPack={actionPack}
            onCreateActionPack={createActionPack}
          />
        )}
      </section>

      <CtaHistoryPanel
        entries={ctaHistory}
        onRollback={rollbackToHistory}
      />

      <details style={{ marginTop: 12 }}>
        <summary>기존 산출물 보기</summary>
        <TextBlock title="Non-dev Spec" value={nondevSpec} />
        <TextBlock title="Dev Spec" value={devSpec} />
        <TextBlock title="Master Prompt" value={masterPrompt} />
      </details>
    </section>
  );
}
