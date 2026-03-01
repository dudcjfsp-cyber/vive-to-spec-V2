import {
  GATE_SCORE_THRESHOLD,
  INTENT_FIELD_LABELS,
  WARNING_DOMAIN_WEIGHT,
  WARNING_SEVERITY_SCORE,
} from './constants.js';
import {
  clamp,
  isObject,
  toObjectArray,
  toStringArray,
  toText,
} from './utils.js';

export function inferRiskProfile(detail) {
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

export function createScoredWarning({
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

export function sortWarningsByPriority(warnings) {
  return [...warnings].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.id.localeCompare(b.id);
  });
}

export function buildWarningSummary(unresolvedWarnings) {
  const safeWarnings = Array.isArray(unresolvedWarnings) ? unresolvedWarnings : [];
  return safeWarnings.reduce((summary, warning) => {
    const severity = toText(warning?.severity, 'medium');
    const domain = toText(warning?.domain, 'completeness');
    const isHardBlock = warning?.gateImpact === 'hard' && Number(warning?.score) >= GATE_SCORE_THRESHOLD;

    return {
      total: summary.total + 1,
      hardBlockCount: summary.hardBlockCount + (isHardBlock ? 1 : 0),
      bySeverity: {
        ...summary.bySeverity,
        [severity]: (summary.bySeverity[severity] || 0) + 1,
      },
      byDomain: {
        ...summary.byDomain,
        [domain]: (summary.byDomain[domain] || 0) + 1,
      },
    };
  }, {
    total: 0,
    hardBlockCount: 0,
    bySeverity: {},
    byDomain: {},
  });
}

export function getGateStatusFromWarnings(unresolvedWarnings) {
  const hasBlockingWarning = unresolvedWarnings.some(
    (warning) => warning.gateImpact === 'hard' && warning.score >= GATE_SCORE_THRESHOLD,
  );
  if (hasBlockingWarning) return 'blocked';
  if (unresolvedWarnings.length > 0) return 'review';
  return 'pass';
}

export function buildIntegritySignals({
  standardOutput,
  permissionGuardEnabled,
  hypothesisWhat,
  logicText,
  changedAxis,
  l1Intelligence,
  l2Intelligence,
}) {
  const safeSpec = isObject(standardOutput) ? standardOutput : {};
  const permissionRules = toObjectArray(safeSpec.권한_규칙);
  const deleteRoles = permissionRules
    .filter((rule) => Boolean(rule.삭제))
    .map((rule) => toText(rule.역할, '역할 미정'));
  const hasPermissionConflict = deleteRoles.length > 0 && !permissionGuardEnabled;
  const hasIntentMismatch = Boolean(hypothesisWhat && !logicText.includes(hypothesisWhat));
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
}

export function buildWarnings({
  standardOutput,
  hypothesisConfirmed,
  changedAxis,
  l1Intelligence,
  l2Intelligence,
  integritySignals,
}) {
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
      title: '의도 추출 신뢰도 경고',
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
}
