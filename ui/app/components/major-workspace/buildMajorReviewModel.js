import {
  toObjectArray,
  toStringArray,
  toText,
} from '../result-panel/utils.js';

function formatBlockingIssue(issue, index) {
  if (!issue || typeof issue !== 'object') return `차단 이슈 ${index + 1}`;
  return toText(issue.message, toText(issue.id, `차단 이슈 ${index + 1}`));
}

function isRequiredField(value) {
  if (value === true) return true;
  const text = toText(value).toLowerCase();
  if (!text) return false;
  return ['required', 'yes', 'true', 'y', '필수'].some((token) => text.includes(token));
}

function summarizeContractField(field) {
  const name = toText(field?.이름, '필드');
  const type = toText(field?.타입, 'string');
  const requiredLabel = isRequiredField(field?.필수) ? '필수' : '선택';
  return `${name} (${type}, ${requiredLabel})`;
}

export function buildMajorReviewModel({ state, derived }) {
  const safeState = state && typeof state === 'object' ? state : {};
  const safeDerived = derived && typeof derived === 'object' ? derived : {};
  const safeStandardOutput = safeDerived.standardOutput && typeof safeDerived.standardOutput === 'object'
    ? safeDerived.standardOutput
    : {};
  const safeValidationReport = safeDerived.validationReport && typeof safeDerived.validationReport === 'object'
    ? safeDerived.validationReport
    : {};

  const schemaWarnings = toStringArray(safeStandardOutput?.완성도_진단?.누락_경고).slice(0, 3);
  const inputFields = toObjectArray(safeStandardOutput?.입력_데이터_필드).slice(0, 5);
  const requiredFieldCount = inputFields.filter((field) => isRequiredField(field?.필수)).length;
  const validationSeverity = toText(safeValidationReport?.severity, 'low');
  const blockingIssues = Array.isArray(safeValidationReport?.blocking_issues)
    ? safeValidationReport.blocking_issues
      .map((issue, index) => formatBlockingIssue(issue, index))
      .filter(Boolean)
      .slice(0, 3)
    : [];
  const impactPreview = {
    screens: toStringArray(safeStandardOutput?.변경_영향도?.화면).slice(0, 3),
    permissions: toStringArray(safeStandardOutput?.변경_영향도?.권한).slice(0, 3),
    tests: toStringArray(safeStandardOutput?.변경_영향도?.테스트).slice(0, 3),
  };
  const exceptionPolicies = [
    '검증 실패: 입력 필드 단위로 즉시 오류를 반환하고 재시도는 수행하지 않습니다.',
    '외부 API 실패/타임아웃: 1회 재시도 후 실패 원인을 로그와 사용자 메시지로 분리합니다.',
    '권한 충돌: 삭제 작업은 승인 단계 이후에만 실행하도록 보호 규칙을 강제합니다.',
  ];

  const reliabilityItems = [
    ...blockingIssues.map((item) => `차단: ${item}`),
    ...schemaWarnings.map((item) => `경고: ${item}`),
  ];
  const safeReliabilityItems = reliabilityItems.length > 0
    ? reliabilityItems
    : ['현재 즉시 차단 이슈는 없습니다.', '지금 보이는 스키마 경고도 낮은 수준입니다.'];

  const contractFieldItems = inputFields.length > 0
    ? inputFields.map((field) => summarizeContractField(field))
    : ['입력 데이터 필드가 아직 정의되지 않았습니다.'];

  const impactItems = [
    ...impactPreview.screens.map((item) => `화면: ${item}`),
    ...impactPreview.permissions.map((item) => `권한: ${item}`),
    ...impactPreview.tests.map((item) => `테스트: ${item}`),
  ];
  const safeImpactItems = impactItems.length > 0
    ? impactItems
    : ['아직 화면 영향 정보가 없습니다.', '권한과 테스트 영향도 아직 정리되지 않았습니다.'];

  return {
    validationSeverity,
    reliability: {
      warningCount: schemaWarnings.length,
      blockingCount: blockingIssues.length,
      summaryItems: safeReliabilityItems.slice(0, 2),
      extraItems: [...safeReliabilityItems.slice(2), ...exceptionPolicies],
    },
    contract: {
      fieldCount: inputFields.length,
      requiredFieldCount,
      modelLabel: toText(safeState.activeModel, '확인 중'),
      summaryItems: contractFieldItems.slice(0, 3),
      extraItems: contractFieldItems.slice(3),
    },
    impact: {
      screenCount: impactPreview.screens.length,
      permissionCount: impactPreview.permissions.length,
      testCount: impactPreview.tests.length,
      summaryItems: safeImpactItems.slice(0, 3),
      extraItems: safeImpactItems.slice(3),
    },
  };
}
