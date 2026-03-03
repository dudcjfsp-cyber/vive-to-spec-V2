const F = {
  SUMMARY: '한_줄_요약',
  PROBLEM_FRAME: '문제정의_5칸',
  WHO: '누가',
  WHAT: '무엇을',
  SUCCESS: '성공기준',
  ROLES: '사용자_역할',
  FEATURES: '핵심_기능',
  MUST: '필수',
  FLOW: '화면_흐름_5단계',
  INPUT_FIELDS: '입력_데이터_필드',
  PERMISSIONS: '권한_규칙',
  TESTS: '테스트_시나리오_3개',
  REQUEST_CONVERTER: '수정요청_변환',
  STANDARD_REQUEST: '표준_요청',
};

const BLOCKING_WARNING_IDS = new Set([
  'missing_problem_who',
  'missing_problem_what',
  'missing_problem_success',
  'missing_must_features',
  'missing_permissions',
]);

const QUESTION_BY_WARNING_ID = Object.freeze({
  missing_problem_who: '누가 이 기능을 가장 자주 사용하는지 알려주세요.',
  missing_problem_what: '사용자가 이 기능으로 정확히 무엇을 해야 하는지 알려주세요.',
  missing_problem_success: '완료를 어떻게 판단할지 성공 기준을 알려주세요.',
  missing_must_features: '이번에 반드시 들어가야 하는 핵심 기능 1~3개를 알려주세요.',
  missing_roles: '운영자, 관리자, 일반 사용자처럼 구분할 역할이 있는지 알려주세요.',
  missing_input_fields: '사용자가 입력하거나 저장해야 하는 핵심 데이터가 무엇인지 알려주세요.',
  missing_permissions: '역할별로 조회, 생성, 수정, 삭제 권한 차이가 필요한지 알려주세요.',
  missing_tests: '완료로 볼 테스트 조건이나 검증 시나리오를 알려주세요.',
  missing_standard_request: '개발자에게 넘길 구현 요청문에서 특히 강조할 기준이 무엇인지 알려주세요.',
});

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || '').trim())
    .filter(Boolean);
}

function buildMissingWarnings(spec) {
  const safeSpec = isObject(spec) ? spec : {};
  const warnings = [];

  if (!String(safeSpec[F.SUMMARY] || '').trim()) {
    warnings.push({ id: 'missing_summary', message: '한 줄 요약이 비어 있습니다.' });
  }
  if (!String(safeSpec[F.PROBLEM_FRAME]?.[F.WHO] || '').trim()) {
    warnings.push({ id: 'missing_problem_who', message: '문제정의 5칸: 누가가 비어 있습니다.' });
  }
  if (!String(safeSpec[F.PROBLEM_FRAME]?.[F.WHAT] || '').trim()) {
    warnings.push({ id: 'missing_problem_what', message: '문제정의 5칸: 무엇을이 비어 있습니다.' });
  }
  if (!String(safeSpec[F.PROBLEM_FRAME]?.[F.SUCCESS] || '').trim()) {
    warnings.push({ id: 'missing_problem_success', message: '문제정의 5칸: 성공기준이 비어 있습니다.' });
  }
  if ((safeSpec[F.ROLES] || []).length === 0) {
    warnings.push({ id: 'missing_roles', message: '사용자 역할이 비어 있습니다.' });
  }
  if ((safeSpec[F.FEATURES]?.[F.MUST] || []).length === 0) {
    warnings.push({ id: 'missing_must_features', message: '필수 기능이 비어 있습니다.' });
  }
  if ((safeSpec[F.INPUT_FIELDS] || []).length === 0) {
    warnings.push({ id: 'missing_input_fields', message: '입력 데이터 필드가 비어 있습니다.' });
  }
  if ((safeSpec[F.PERMISSIONS] || []).length === 0) {
    warnings.push({ id: 'missing_permissions', message: '권한 규칙이 비어 있습니다.' });
  }
  if ((safeSpec[F.TESTS] || []).length === 0) {
    warnings.push({ id: 'missing_tests', message: '테스트 시나리오가 비어 있습니다.' });
  }
  if (!String(safeSpec[F.REQUEST_CONVERTER]?.[F.STANDARD_REQUEST] || '').trim()) {
    warnings.push({ id: 'missing_standard_request', message: '표준 요청문이 비어 있습니다.' });
  }

  return warnings;
}

function computeScoreFromSpec(spec) {
  const safeSpec = isObject(spec) ? spec : {};
  const checks = [
    Boolean(String(safeSpec[F.SUMMARY] || '').trim()),
    Boolean(String(safeSpec[F.PROBLEM_FRAME]?.[F.WHO] || '').trim()),
    Boolean(String(safeSpec[F.PROBLEM_FRAME]?.[F.WHAT] || '').trim()),
    Boolean(String(safeSpec[F.PROBLEM_FRAME]?.[F.SUCCESS] || '').trim()),
    (safeSpec[F.ROLES] || []).length > 0,
    (safeSpec[F.FEATURES]?.[F.MUST] || []).length > 0,
    (safeSpec[F.FLOW] || []).length === 5,
    (safeSpec[F.INPUT_FIELDS] || []).length > 0,
    (safeSpec[F.PERMISSIONS] || []).length > 0,
    (safeSpec[F.TESTS] || []).length === 3,
  ];
  const passed = checks.filter(Boolean).length;
  return Math.round((passed / checks.length) * 100);
}

function normalizeScore(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric < 0) return 0;
  if (numeric > 100) return 100;
  return Math.round(numeric);
}

function normalizeWarnings(computedWarnings, overrideWarnings) {
  const overrideList = toStringArray(overrideWarnings);
  if (overrideList.length > 0) return overrideList;
  return computedWarnings.map((item) => item.message);
}

function buildBlockingIssues(computedWarnings) {
  return computedWarnings
    .filter((item) => BLOCKING_WARNING_IDS.has(item.id))
    .map((item) => ({
      id: item.id,
      message: item.message,
    }));
}

function computeSeverity(blockingIssues, warningCount) {
  if (blockingIssues.length > 0) return 'high';
  if (warningCount >= 3) return 'medium';
  return 'low';
}

export function buildClarificationCandidates(report = {}) {
  const warningIds = Array.isArray(report.blocking_issues)
    ? report.blocking_issues.map((item) => String(item?.id || '').trim()).filter(Boolean)
    : [];
  const warningTexts = toStringArray(report.warnings);
  const candidates = [];

  warningIds.forEach((warningId) => {
    const question = QUESTION_BY_WARNING_ID[warningId];
    if (question && !candidates.includes(question)) {
      candidates.push(question);
    }
  });

  if (candidates.length < 3) {
    const textMatchers = [
      ['문제정의 5칸: 누가가 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_problem_who],
      ['문제정의 5칸: 무엇을이 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_problem_what],
      ['문제정의 5칸: 성공기준이 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_problem_success],
      ['사용자 역할이 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_roles],
      ['필수 기능이 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_must_features],
      ['입력 데이터 필드가 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_input_fields],
      ['권한 규칙이 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_permissions],
      ['테스트 시나리오가 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_tests],
      ['표준 요청문이 비어 있습니다.', QUESTION_BY_WARNING_ID.missing_standard_request],
    ];

    textMatchers.forEach(([warningText, question]) => {
      if (candidates.length >= 3) return;
      if (!warningTexts.includes(warningText)) return;
      if (question && !candidates.includes(question)) {
        candidates.push(question);
      }
    });
  }

  return candidates.slice(0, 3);
}

export function validateStandardOutput(spec, { warnings = null, score = null } = {}) {
  const computedWarnings = buildMissingWarnings(spec);
  const blockingIssues = buildBlockingIssues(computedWarnings);
  const normalizedWarnings = normalizeWarnings(computedWarnings, warnings);
  const normalizedScore = normalizeScore(score, computeScoreFromSpec(spec));
  const severity = computeSeverity(blockingIssues, normalizedWarnings.length);
  const report = {
    score: normalizedScore,
    warnings: normalizedWarnings,
    warning_count: normalizedWarnings.length,
    blocking_issues: blockingIssues,
    blocking_issue_count: blockingIssues.length,
    severity,
    can_auto_proceed: blockingIssues.length === 0,
  };
  const suggestedQuestions = buildClarificationCandidates(report);

  return {
    ...report,
    suggested_questions: suggestedQuestions,
    needs_clarification: blockingIssues.length > 0 || suggestedQuestions.length > 0,
  };
}
