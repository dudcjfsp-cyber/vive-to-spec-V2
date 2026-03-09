function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toText(item)).filter(Boolean);
}

function toFixedLengthStringArray(value, length, fallbackPrefix) {
  const list = toStringArray(value).slice(0, length);
  while (list.length < length) {
    list.push(`${fallbackPrefix} ${list.length + 1}`);
  }
  return list;
}

function toIntegerInRange(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  const rounded = Math.round(numeric);
  return Math.min(max, Math.max(min, rounded));
}

function buildFallbackRequests(summary, mustItems, tests, schemaKeys) {
  const headline = summary || '기능 개선 요청';
  const must = mustItems[0] || '핵심 기능';
  const test = tests[0] || '정상 시나리오 테스트';

  return {
    [schemaKeys.SHORT_REQUEST]: `${must} 기능을 오늘 구현해주세요.`,
    [schemaKeys.STANDARD_REQUEST]: `${headline}. 우선순위는 ${must}이며, 완료 기준은 ${test} 통과입니다.`,
    [schemaKeys.DETAILED_REQUEST]: `${headline}\n- 우선 구현: ${must}\n- 확인 기준: ${test}\n- 실패 시 처리: 입력 누락/권한 없음/유효성 실패 케이스를 분리해 오류 메시지를 제공해주세요.`,
  };
}

function buildRequiredInterviewQuestions(problemFrame, interviewSource, ambiguitiesSource, schemaKeys) {
  const sourceQuestions = [
    ...toStringArray(
      interviewSource[schemaKeys.FOLLOW_UP]
      ?? interviewSource.follow_up_questions
      ?? interviewSource.questions,
    ),
    ...toStringArray(ambiguitiesSource[schemaKeys.QUESTIONS] ?? ambiguitiesSource.questions),
    ...toStringArray(
      ambiguitiesSource[schemaKeys.MISSING] ?? ambiguitiesSource.missing_information,
    ).map((item) => `${item} 항목을 어떻게 확정할까요?`),
  ];

  const fallbackQuestions = [
    !problemFrame[schemaKeys.WHO] || problemFrame[schemaKeys.WHO] === '주요 사용자 정의 필요'
      ? '이 기능을 실제로 사용하는 핵심 사용자(역할)는 누구인가요?'
      : '',
    !problemFrame[schemaKeys.WHAT] || problemFrame[schemaKeys.WHAT] === '해결할 작업 정의 필요'
      ? '사용자가 가장 먼저 처리해야 하는 핵심 작업은 무엇인가요?'
      : '',
    !problemFrame[schemaKeys.SUCCESS] || problemFrame[schemaKeys.SUCCESS] === '성공 기준 정의 필요'
      ? '완료를 판단하는 성공 기준을 숫자나 조건으로 어떻게 정의할까요?'
      : '',
    '필수 입력 데이터(예: 업체명, 제품명, 수량) 중 절대 누락되면 안 되는 항목은 무엇인가요?',
    '권한 규칙에서 일반 사용자와 관리자의 조회/수정 범위를 어떻게 나눌까요?',
  ];

  const deduped = Array.from(
    new Set([...sourceQuestions, ...fallbackQuestions].map((item) => toText(item)).filter(Boolean)),
  );

  return toFixedLengthStringArray(deduped, 3, '필요 정보 질문');
}

/**
 * Prepares analysis-facing derived values from an already normalized spec draft.
 * This helper does not redefine the spec contract itself.
 * It only fills analysis-preparation concerns that still happen after spec normalization:
 * - clarification/interview questions
 * - request converter fallbacks
 * - impact preview fallbacks
 * - completeness input passed to validation
 */
export function prepareSpecAnalysis({
  schemaKeys,
  spec = null,
  interviewSource = null,
  ambiguitiesSource = null,
  completenessSource = null,
} = {}) {
  if (!isPlainObject(schemaKeys)) {
    throw new Error('schemaKeys is required.');
  }

  const K = schemaKeys;
  const safeSpec = isPlainObject(spec) ? spec : {};
  const safeInterviewSource = isPlainObject(interviewSource) ? interviewSource : {};
  const safeAmbiguitiesSource = isPlainObject(ambiguitiesSource) ? ambiguitiesSource : {};
  const safeCompletenessSource = isPlainObject(completenessSource) ? completenessSource : {};

  const problemFrame = isPlainObject(safeSpec[K.PROBLEM_FRAME]) ? safeSpec[K.PROBLEM_FRAME] : {};
  const features = isPlainObject(safeSpec[K.FEATURES]) ? safeSpec[K.FEATURES] : {};
  const requestConverter = isPlainObject(safeSpec[K.REQUEST_CONVERTER]) ? safeSpec[K.REQUEST_CONVERTER] : {};
  const impact = isPlainObject(safeSpec[K.IMPACT]) ? safeSpec[K.IMPACT] : {};
  const permissions = Array.isArray(safeSpec[K.PERMISSIONS]) ? safeSpec[K.PERMISSIONS] : [];
  const flow = Array.isArray(safeSpec[K.FLOW]) ? safeSpec[K.FLOW] : [];
  const tests = Array.isArray(safeSpec[K.TESTS]) ? safeSpec[K.TESTS] : [];

  const requestFallback = buildFallbackRequests(
    toText(safeSpec[K.SUMMARY]),
    toStringArray(features[K.MUST]),
    tests,
    K,
  );

  const existingImpactScreens = toStringArray(impact[K.IMPACT_SCREENS]);
  const existingImpactPermissions = toStringArray(impact[K.IMPACT_PERMISSIONS]);
  const existingImpactTests = toStringArray(impact[K.IMPACT_TESTS]);

  return {
    interviewMode: {
      [K.FOLLOW_UP]: buildRequiredInterviewQuestions(
        problemFrame,
        safeInterviewSource,
        safeAmbiguitiesSource,
        K,
      ),
    },
    requestConverter: {
      [K.RAW_REQUEST]: toText(requestConverter[K.RAW_REQUEST], toText(safeSpec[K.SUMMARY])),
      [K.SHORT_REQUEST]: toText(requestConverter[K.SHORT_REQUEST]) || requestFallback[K.SHORT_REQUEST],
      [K.STANDARD_REQUEST]: toText(requestConverter[K.STANDARD_REQUEST]) || requestFallback[K.STANDARD_REQUEST],
      [K.DETAILED_REQUEST]: toText(requestConverter[K.DETAILED_REQUEST]) || requestFallback[K.DETAILED_REQUEST],
    },
    impact: {
      [K.IMPACT_SCREENS]: existingImpactScreens.length > 0
        ? existingImpactScreens
        : flow.map((step) => `${step} 화면 영향 가능`),
      [K.IMPACT_PERMISSIONS]: existingImpactPermissions.length > 0
        ? existingImpactPermissions
        : (permissions.length > 0
          ? permissions.map((rule) => `${toText(rule[K.ROLE])} 권한 검토 필요`)
          : ['역할별 CRUD 권한 매트릭스 재검토 필요']),
      [K.IMPACT_TESTS]: existingImpactTests.length > 0
        ? existingImpactTests
        : tests.map((item) => `${item} 검증 케이스 영향`),
    },
    completenessInput: {
      warnings: toStringArray(safeCompletenessSource[K.WARNINGS] ?? safeCompletenessSource.warnings),
      score: toIntegerInRange(safeCompletenessSource[K.SCORE] ?? safeCompletenessSource.score, 0, 100),
    },
  };
}
