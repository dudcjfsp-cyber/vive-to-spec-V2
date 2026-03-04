function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export const CORE_PROMPT_CHECKLIST = Object.freeze([
  {
    id: 'input_contract',
    promptLine: 'Define the input contract up front: required fields, supported inputs, limits, and validation rules.',
    masterPromptLine: '코드를 쓰기 전에 입력 계약을 먼저 정리하세요: 필수 입력값, 지원 입력 형식, 제한 조건, 검증 규칙을 명시하세요.',
    warningLine: '입력 계약을 보완해 주세요: 필수 입력값, 지원 파일/입력 형식, 제한 조건, 검증 규칙을 명시하세요.',
    checks: [
      /input contract/i,
      /required fields?/i,
      /supported inputs?/i,
      /validation rules?/i,
      /file types?/i,
      /size limits?/i,
      /page limits?/i,
    ],
  },
  {
    id: 'role_permissions',
    promptLine: 'Separate role and permission boundaries so access control and CRUD scope stay explicit.',
    masterPromptLine: '역할과 권한 경계를 분리하세요: 접근 제어와 CRUD 범위가 명확하게 보이도록 작성하세요.',
    warningLine: '역할/권한 경계를 보완해 주세요: 각 역할의 접근 제어와 CRUD 범위를 분명히 적어주세요.',
    checks: [
      /role and permission/i,
      /access control/i,
      /authorization/i,
      /crud/i,
      /permission matrix/i,
    ],
  },
  {
    id: 'failure_handling',
    promptLine: 'Describe failure handling, fallback paths, and user-visible recovery steps.',
    masterPromptLine: '실패 처리와 폴백 경로를 적으세요: 사용자에게 보이는 복구 절차까지 포함하세요.',
    warningLine: '실패 처리 기준을 보완해 주세요: 잘못된 입력, 권한 거부, 재시도/폴백, 사용자 복구 안내를 포함하세요.',
    checks: [
      /failure handling/i,
      /error handling/i,
      /fallback/i,
      /retry/i,
      /recovery/i,
      /invalid input/i,
      /timeout/i,
    ],
  },
  {
    id: 'output_contract',
    promptLine: 'Lock the output contract with concrete fields, formatting rules, and traceable source references when relevant.',
    masterPromptLine: '출력 계약을 고정하세요: 구체적인 필드, 형식 규칙, 필요 시 추적 가능한 출처 정보를 포함하세요.',
    warningLine: '출력 계약을 보완해 주세요: 구체적인 필드, 응답 형태, 형식 규칙, 필요 시 출처/페이지 추적 기준을 적어주세요.',
    checks: [
      /output contract/i,
      /output schema/i,
      /response shape/i,
      /json/i,
      /field order/i,
      /source references?/i,
      /page numbers?/i,
    ],
  },
  {
    id: 'acceptance_checks',
    promptLine: 'State acceptance criteria and verification checks so completion is testable.',
    masterPromptLine: '완료 기준과 검증 항목을 적으세요: 결과를 테스트 가능하게 만드세요.',
    warningLine: '완료 기준을 보완해 주세요: 수용 기준과 검증 항목이 측정 가능하도록 적어주세요.',
    checks: [
      /acceptance criteria/i,
      /verification checks?/i,
      /definition of done/i,
      /done criteria/i,
      /test scenarios?/i,
      /success criteria/i,
    ],
  },
]);

export function getCoreChecklistIds() {
  return CORE_PROMPT_CHECKLIST.map((item) => item.id);
}

export function getCoreChecklistPromptLines() {
  return CORE_PROMPT_CHECKLIST.map((item) => item.promptLine);
}

export function getCoreChecklistMasterPromptLines() {
  return CORE_PROMPT_CHECKLIST.map((item) => item.masterPromptLine);
}

export function findMissingCoreChecklistItems(text) {
  const source = toText(text);
  if (!source) {
    return CORE_PROMPT_CHECKLIST.map((item) => item.warningLine);
  }

  return CORE_PROMPT_CHECKLIST
    .filter((item) => !item.checks.some((pattern) => pattern.test(source)))
    .map((item) => item.warningLine);
}
