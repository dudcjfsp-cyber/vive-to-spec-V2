import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWarningSummary,
  buildIntegritySignals,
  buildWarnings,
  createScoredWarning,
  getGateStatusFromWarnings,
  inferRiskProfile,
  sortWarningsByPriority,
} from './integrity.js';

test('inferRiskProfile classifies warning text by domain and severity', () => {
  assert.deepEqual(inferRiskProfile('권한 검토가 필요합니다.'), {
    domain: 'permission',
    severity: 'critical',
    gateImpact: 'hard',
  });
  assert.deepEqual(inferRiskProfile('데이터 흐름 동기화가 누락되었습니다.'), {
    domain: 'data_flow',
    severity: 'high',
    gateImpact: 'hard',
  });
  assert.deepEqual(inferRiskProfile('의도 정합 확인이 필요합니다.'), {
    domain: 'coherence',
    severity: 'high',
    gateImpact: 'hard',
  });
  assert.deepEqual(inferRiskProfile('기타 점검 필요'), {
    domain: 'completeness',
    severity: 'medium',
    gateImpact: 'soft',
  });
});

test('createScoredWarning clamps score and sorting uses score then id', () => {
  const highRisk = createScoredWarning({
    id: 'b-warning',
    title: 'high',
    detail: 'high risk',
    actions: [{ id: 'fix', label: 'Fix' }],
    autoAction: 'fix',
    severity: 'critical',
    domain: 'permission',
    gateImpact: 'hard',
  });
  const mediumRisk = createScoredWarning({
    id: 'a-warning',
    title: 'medium',
    detail: 'medium risk',
    actions: [],
    autoAction: '',
    severity: 'medium',
    domain: 'completeness',
    gateImpact: 'soft',
  });
  const highRiskSameScore = createScoredWarning({
    id: 'a-high',
    title: 'high2',
    detail: 'high risk 2',
    actions: [{ id: 'fix', label: 'Fix' }],
    autoAction: 'fix',
    severity: 'critical',
    domain: 'permission',
    gateImpact: 'hard',
  });

  assert.equal(highRisk.score, 100);
  assert.equal(mediumRisk.score, 64);

  const sorted = sortWarningsByPriority([highRisk, mediumRisk, highRiskSameScore]);
  assert.deepEqual(sorted.map((warning) => warning.id), ['a-high', 'b-warning', 'a-warning']);
});

test('getGateStatusFromWarnings returns blocked, review, or pass', () => {
  assert.equal(getGateStatusFromWarnings([
    { id: 'hard', gateImpact: 'hard', score: 80 },
  ]), 'blocked');
  assert.equal(getGateStatusFromWarnings([
    { id: 'soft', gateImpact: 'soft', score: 68 },
  ]), 'review');
  assert.equal(getGateStatusFromWarnings([]), 'pass');
});

test('buildWarningSummary returns aggregate counts for compact integrity views', () => {
  const summary = buildWarningSummary([
    { id: 'a', gateImpact: 'hard', score: 90, severity: 'critical', domain: 'permission' },
    { id: 'b', gateImpact: 'soft', score: 64, severity: 'medium', domain: 'completeness' },
    { id: 'c', gateImpact: 'hard', score: 70, severity: 'high', domain: 'coherence' },
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.hardBlockCount, 2);
  assert.deepEqual(summary.bySeverity, {
    critical: 1,
    medium: 1,
    high: 1,
  });
  assert.deepEqual(summary.byDomain, {
    permission: 1,
    completeness: 1,
    coherence: 1,
  });
});

test('buildIntegritySignals detects data, permission, and coherence failures', () => {
  const result = buildIntegritySignals({
    integritySource: {
      permissionRules: [
        { 역할: '상담원', 삭제: true },
      ],
    },
    permissionGuardEnabled: false,
    hypothesisWhat: '결제 오류 자동 알림',
    logicText: '사용자 인증 흐름 정리',
    changedAxis: 'db',
    l1Intelligence: { overallConfidence: 40 },
    l2Intelligence: { alignmentScore: 80, overallScore: 80, syncSuggestions: [] },
  });

  assert.equal(result.dataFlow, 'fail');
  assert.equal(result.permission, 'fail');
  assert.equal(result.coherence, 'fail');
  assert.deepEqual(result.deleteRoles, ['상담원']);
  assert.deepEqual(result.riskyDeleteRoles, ['상담원']);
  assert.equal(result.hasPermissionConflict, true);
  assert.equal(result.hasIntentMismatch, true);
  assert.equal(result.lowIntentConfidence, true);
});

test('buildIntegritySignals does not flag privileged manager delete roles', () => {
  const result = buildIntegritySignals({
    integritySource: {
      permissionRules: [
        { 역할: '관리자', 삭제: true },
        { 역할: '매니저', 삭제: true },
      ],
    },
    permissionGuardEnabled: false,
    hypothesisWhat: '문의 상태 관리',
    logicText: '문의 상태 관리',
    changedAxis: '',
    l1Intelligence: { overallConfidence: 80 },
    l2Intelligence: { alignmentScore: 82, overallScore: 79, syncSuggestions: [] },
  });

  assert.deepEqual(result.deleteRoles, ['관리자', '매니저']);
  assert.deepEqual(result.riskyDeleteRoles, []);
  assert.equal(result.hasPermissionConflict, false);
  assert.equal(result.permission, 'pass');
});

test('buildWarnings creates prioritized warning graph from integrity signals', () => {
  const warnings = buildWarnings({
    integritySource: {
      schemaWarnings: ['권한 검토 누락', '데이터 흐름 점검 필요'],
    },
    hypothesisConfirmed: false,
    changedAxis: 'db',
    l1Intelligence: {
      overallConfidence: 45,
      lowConfidenceFields: ['who', 'what'],
    },
    l2Intelligence: {
      overallScore: 50,
      alignmentScore: 40,
      syncSuggestions: ['sync'],
    },
    integritySignals: {
      lowIntentConfidence: true,
      dataFlow: 'fail',
      hasPermissionConflict: true,
      deleteRoles: ['상담원'],
      riskyDeleteRoles: ['상담원'],
      hasIntentMismatch: true,
    },
  });

  const ids = warnings.map((warning) => warning.id);
  assert.deepEqual(new Set(ids), new Set([
    'schema-0',
    'schema-1',
    'intent-unconfirmed',
    'intent-low-confidence',
    'data-flow-alignment',
    'permission-delete',
    'intent-mismatch',
  ]));

  for (let index = 1; index < warnings.length; index += 1) {
    assert.ok(warnings[index - 1].score >= warnings[index].score);
  }

  const permissionWarning = warnings.find((warning) => warning.id === 'permission-delete');
  assert.equal(permissionWarning?.severity, 'critical');
  assert.equal(permissionWarning?.gateImpact, 'hard');
  assert.equal(permissionWarning?.title, '권한 범위 재확인');

  const flowWarning = warnings.find((warning) => warning.id === 'data-flow-alignment');
  assert.equal(flowWarning?.title, '기능 흐름 점검 필요');
  assert.match(flowWarning?.detail || '', /흐름 점수 50/);
});
