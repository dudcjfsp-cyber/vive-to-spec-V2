import { getCoreChecklistMasterPromptLines } from '../../../shared/corePromptChecklist.js';

function isPlainObject(value) {
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

function boolToMark(flag) {
  return flag ? 'O' : 'X';
}

function markdownList(items, fallback = '- 없음') {
  if (!items?.length) return fallback;
  return items.map((item) => `- ${item}`).join('\n');
}

function markdownOrderedList(items, fallback = '1. 없음') {
  if (!items?.length) return fallback;
  return items.map((item, idx) => `${idx + 1}. ${item}`).join('\n');
}

function toMarkdownTableCell(value, fallback = '-') {
  const safe = toText(value, fallback) || fallback;
  return safe.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function createSpecRenderer({ schemaKeys } = {}) {
  if (!isPlainObject(schemaKeys)) {
    throw new Error('schemaKeys is required.');
  }

  const K = schemaKeys;

  function buildUsersSectionMarkdown(usersAndRoles) {
    if (!usersAndRoles.length) return '- 역할 정보가 아직 정의되지 않았습니다.';
    return usersAndRoles
      .map((item) => `- **${item[K.ROLE] || '역할 미정'}**: ${item[K.DESCRIPTION] || '-'}`)
      .join('\n');
  }

  function buildInputFieldCardMarkdown(field, idx) {
    const title = field[K.NAME] || `필드 ${idx + 1}`;
    return [
      `### 입력 필드: ${title}`,
      '```text',
      `타입: ${field[K.TYPE] || '-'}`,
      `예시: ${field[K.EXAMPLE] || '-'}`,
      '```',
    ].join('\n');
  }

  function buildInputFieldCardsMarkdown(fields) {
    if (!fields.length) {
      return [
        '### 입력 필드: 미정',
        '```text',
        '타입: -',
        '예시: 입력 데이터 필드가 아직 정의되지 않았습니다.',
        '```',
      ].join('\n');
    }
    return fields.map((field, idx) => buildInputFieldCardMarkdown(field, idx)).join('\n\n');
  }

  function buildPermissionCardMarkdown(rule, idx) {
    const title = rule[K.ROLE] || `역할 ${idx + 1}`;
    return [
      `### 권한 카드: ${title}`,
      '```text',
      `조회: ${boolToMark(rule[K.READ])}`,
      `생성: ${boolToMark(rule[K.CREATE])}`,
      `수정: ${boolToMark(rule[K.UPDATE])}`,
      `삭제: ${boolToMark(rule[K.DELETE])}`,
      `비고: ${rule[K.NOTES] || '-'}`,
      '```',
    ].join('\n');
  }

  function buildPermissionCardsMarkdown(permissionMatrix) {
    if (!permissionMatrix.length) {
      return [
        '### 권한 카드: 미정',
        '```text',
        '조회: -',
        '생성: -',
        '수정: -',
        '삭제: -',
        '비고: 권한 규칙이 아직 정의되지 않았습니다.',
        '```',
      ].join('\n');
    }

    return permissionMatrix.map((rule, idx) => buildPermissionCardMarkdown(rule, idx)).join('\n\n');
  }

  function buildProblemFrameCardMarkdown(label, value) {
    return [`### ${label}`, '```text', value || '-', '```'].join('\n');
  }

  function buildProblemFrameCardsMarkdown(problemFrame) {
    return [
      buildProblemFrameCardMarkdown('누가', problemFrame[K.WHO]),
      buildProblemFrameCardMarkdown('언제', problemFrame[K.WHEN]),
      buildProblemFrameCardMarkdown('무엇을', problemFrame[K.WHAT]),
      buildProblemFrameCardMarkdown('왜', problemFrame[K.WHY]),
      buildProblemFrameCardMarkdown('성공기준', problemFrame[K.SUCCESS]),
    ].join('\n\n');
  }

  function buildProblemFramePromptMarkdown(problemFrame) {
    return [
      `- 누가: ${problemFrame[K.WHO] || '-'}`,
      `- 언제: ${problemFrame[K.WHEN] || '-'}`,
      `- 무엇을: ${problemFrame[K.WHAT] || '-'}`,
      `- 왜: ${problemFrame[K.WHY] || '-'}`,
      `- 성공기준: ${problemFrame[K.SUCCESS] || '-'}`,
    ].join('\n');
  }

  function buildImpactMarkdown(impact) {
    return [
      '### 화면',
      markdownList(impact[K.IMPACT_SCREENS]),
      '',
      '### 권한',
      markdownList(impact[K.IMPACT_PERMISSIONS]),
      '',
      '### 테스트',
      markdownList(impact[K.IMPACT_TESTS]),
    ].join('\n');
  }

  function buildInputFieldChecklistMarkdown(fields) {
    if (!fields.length) return '- 준비할 입력 정보가 아직 정의되지 않았습니다.';
    return fields
      .map((field) => {
        const name = field[K.NAME] || '이름 미정';
        const type = field[K.TYPE] || '-';
        const example = field[K.EXAMPLE] || '-';
        return `- ${name}: ${example} (타입: ${type})`;
      })
      .join('\n');
  }

  function buildPermissionSummaryMarkdown(permissionMatrix) {
    if (!permissionMatrix.length) return '- 역할별 권한이 아직 정의되지 않았습니다.';
    return permissionMatrix
      .map((rule) => {
        const role = rule[K.ROLE] || '역할 미정';
        return `- ${role}: 조회 ${boolToMark(rule[K.READ])} / 생성 ${boolToMark(rule[K.CREATE])} / 수정 ${boolToMark(rule[K.UPDATE])} / 삭제 ${boolToMark(rule[K.DELETE])}`;
      })
      .join('\n');
  }

  function buildInputFieldTableMarkdown(fields) {
    const header = [
      '| Field | Type | Example |',
      '| --- | --- | --- |',
    ];
    if (!fields.length) return [...header, '| (미정) | - | - |'].join('\n');

    return [
      ...header,
      ...fields.map((field) => [
        `| ${toMarkdownTableCell(field[K.NAME], '(미정)')}`,
        `${toMarkdownTableCell(field[K.TYPE])}`,
        `${toMarkdownTableCell(field[K.EXAMPLE])} |`,
      ].join(' | ')),
    ].join('\n');
  }

  function buildPermissionMatrixTableMarkdown(permissionMatrix) {
    const header = [
      '| Role | Read | Create | Update | Delete | Notes |',
      '| --- | --- | --- | --- | --- | --- |',
    ];
    if (!permissionMatrix.length) return [...header, '| (미정) | - | - | - | - | 권한 정책 정의 필요 |'].join('\n');

    return [
      ...header,
      ...permissionMatrix.map((rule) => [
        `| ${toMarkdownTableCell(rule[K.ROLE], '(미정)')}`,
        `${boolToMark(rule[K.READ])}`,
        `${boolToMark(rule[K.CREATE])}`,
        `${boolToMark(rule[K.UPDATE])}`,
        `${boolToMark(rule[K.DELETE])}`,
        `${toMarkdownTableCell(rule[K.NOTES])} |`,
      ].join(' | ')),
    ].join('\n');
  }

  function buildDeveloperAcceptanceCriteriaMarkdown(spec) {
    const criteria = [];
    const problemFrame = spec[K.PROBLEM_FRAME] || {};
    const mustFeatures = spec[K.FEATURES]?.[K.MUST] || [];
    const flow = spec[K.FLOW] || [];
    const fields = spec[K.INPUT_FIELDS] || [];
    const permissionMatrix = spec[K.PERMISSIONS] || [];

    criteria.push(`핵심 사용자("${problemFrame[K.WHO] || '-'}")가 핵심 작업("${problemFrame[K.WHAT] || '-'}")을 완료할 수 있어야 합니다.`);
    criteria.push(`완료 판정은 성공기준("${problemFrame[K.SUCCESS] || '-'}")을 충족해야 합니다.`);

    if (mustFeatures.length) {
      mustFeatures.forEach((feature, idx) => {
        criteria.push(`Must ${idx + 1}: ${feature}`);
      });
    } else {
      criteria.push('Must 기능이 비어 있습니다. 최소 1개 이상의 필수 기능을 확정해야 합니다.');
    }

    criteria.push(`사용자 흐름 5단계를 순서대로 수행할 수 있어야 합니다. (현재 정의: ${flow.length}단계)`);

    if (fields.length) {
      fields.forEach((field) => {
        criteria.push(`입력 필드 "${field[K.NAME] || '미정'}"는 타입 "${field[K.TYPE] || '-'}" 검증을 통과해야 합니다.`);
      });
    } else {
      criteria.push('입력 데이터 필드 정의가 없어 유효성 검증을 완료할 수 없습니다.');
    }

    if (permissionMatrix.length) {
      permissionMatrix.forEach((rule) => {
        criteria.push(`역할 "${rule[K.ROLE] || '미정'}" 권한은 조회 ${boolToMark(rule[K.READ])}/생성 ${boolToMark(rule[K.CREATE])}/수정 ${boolToMark(rule[K.UPDATE])}/삭제 ${boolToMark(rule[K.DELETE])} 정책을 만족해야 합니다.`);
      });
    } else {
      criteria.push('역할별 CRUD 권한 정책 정의가 필요합니다.');
    }

    criteria.push('오류 처리에서 누락 입력/권한 없음/유효성 실패 케이스를 사용자 메시지와 함께 처리해야 합니다.');
    criteria.push(`테스트 시나리오 ${spec[K.TESTS]?.length || 0}개를 모두 통과해야 합니다.`);
    return markdownOrderedList(criteria, '1. 수용 기준 정의 필요');
  }

  function buildDeveloperImplementationChecklistMarkdown(spec) {
    const checklist = [
      `필수 기능 ${spec[K.FEATURES]?.[K.MUST]?.length || 0}개 구현`,
      '입력 데이터 계약 기준으로 validation 규칙 분리',
      '권한 규칙 기준으로 authorization 분기 분리',
      '누락 입력/권한 오류/유효성 실패 공통 에러 처리 구현',
      '테스트 시나리오 기반 검증 완료',
    ];

    const warnings = spec[K.COMPLETENESS]?.[K.WARNINGS] || [];
    warnings.forEach((warning, idx) => {
      checklist.push(`누락 경고 조치 ${idx + 1}: ${warning}`);
    });

    const todayTasks = spec[K.NEXT] || [];
    todayTasks.forEach((item, idx) => {
      checklist.push(`오늘 우선 작업 ${idx + 1}: ${item}`);
    });

    return markdownOrderedList(checklist, '1. 구현 체크리스트 정의 필요');
  }

  function buildMasterPromptCoreChecklist(spec) {
    const checklist = [
      ...getCoreChecklistMasterPromptLines(),
      `필수 기능 ${spec[K.FEATURES]?.[K.MUST]?.length || 0}개를 코드로 반영하세요.`,
      `인계 전에 테스트 시나리오 ${spec[K.TESTS]?.length || 0}개를 확인하세요.`,
    ];

    return markdownOrderedList(checklist, '1. 코드를 쓰기 전에 입력 계약을 먼저 정리하세요.');
  }

  function buildRequestHandoffMarkdown(requests) {
    return [
      '### 표준 요청문',
      '```text',
      requests[K.STANDARD_REQUEST] || '-',
      '```',
      '',
      '### 상세 요청문',
      '```text',
      requests[K.DETAILED_REQUEST] || '-',
      '```',
    ].join('\n');
  }

  function buildNonDevSpecMarkdown(spec) {
    return [
      '# 비전공자 설명서 (결정/실행 중심)',
      '',
      '## 이 프로젝트가 하는 일',
      `- ${spec[K.SUMMARY]}`,
      '',
      '## 누구의 어떤 문제를 푸는지',
      buildProblemFrameCardsMarkdown(spec[K.PROBLEM_FRAME]),
      '',
      '## 대상 사용자/역할',
      buildUsersSectionMarkdown(spec[K.ROLES]),
      '',
      '## 이번 버전 핵심 기능 (Must)',
      markdownOrderedList(spec[K.FEATURES][K.MUST], '1. 필수 기능 정의 필요'),
      '',
      '## 사용자 흐름 (5단계)',
      markdownOrderedList(spec[K.FLOW]),
      '',
      '## 준비해야 할 입력 정보',
      buildInputFieldChecklistMarkdown(spec[K.INPUT_FIELDS]),
      '',
      '## 역할별 권한 요약',
      buildPermissionSummaryMarkdown(spec[K.PERMISSIONS]),
      '',
      '## 지금 결정이 필요한 항목',
      '### 부족한 정보',
      markdownList(spec[K.AMBIGUITIES][K.MISSING]),
      '',
      '### 확인 질문 3개',
      markdownOrderedList(spec[K.AMBIGUITIES][K.QUESTIONS]),
      '',
      '## 리스크/함정',
      markdownOrderedList(spec[K.RISKS]),
      '',
      '## 오늘 바로 할 일 3개',
      markdownOrderedList(spec[K.NEXT]),
      '',
      '## 진행 상태',
      `- 완성도 점수: ${spec[K.COMPLETENESS][K.SCORE]} / 100`,
      '- 누락 경고',
      markdownList(spec[K.COMPLETENESS][K.WARNINGS]),
    ].join('\n');
  }

  function buildDevSpecMarkdown(spec) {
    return [
      '# 개발자 전달용 구현 스펙 (Execution Ready)',
      '',
      '## 1) Product Intent',
      `- Summary: ${spec[K.SUMMARY]}`,
      '',
      '## 2) Problem Frame',
      buildProblemFrameCardsMarkdown(spec[K.PROBLEM_FRAME]),
      '',
      '## 3) Roles',
      buildUsersSectionMarkdown(spec[K.ROLES]),
      '',
      '## 4) Scope',
      '### Must',
      markdownList(spec[K.FEATURES][K.MUST]),
      '',
      '### Nice-to-have',
      markdownList(spec[K.FEATURES][K.NICE]),
      '',
      '## 5) UX Flow (5 steps)',
      markdownOrderedList(spec[K.FLOW]),
      '',
      '## 6) Data Contract',
      buildInputFieldTableMarkdown(spec[K.INPUT_FIELDS]),
      '',
      '## 7) Authorization Matrix',
      buildPermissionMatrixTableMarkdown(spec[K.PERMISSIONS]),
      '',
      '## 8) Acceptance Criteria',
      buildDeveloperAcceptanceCriteriaMarkdown(spec),
      '',
      '## 9) Open Questions',
      '### Missing Information',
      markdownList(spec[K.AMBIGUITIES][K.MISSING]),
      '',
      '### Clarification Questions',
      markdownOrderedList(spec[K.AMBIGUITIES][K.QUESTIONS]),
      '',
      '## 10) Risks & Impact',
      '### Risks',
      markdownOrderedList(spec[K.RISKS]),
      '',
      '### Impact Preview',
      buildImpactMarkdown(spec[K.IMPACT]),
      '',
      '## 11) Test Plan',
      markdownOrderedList(spec[K.TESTS]),
      '',
      '## 12) Implementation Checklist',
      buildDeveloperImplementationChecklistMarkdown(spec),
      '',
      '## 13) Copy-ready Request Blocks',
      buildRequestHandoffMarkdown(spec[K.REQUEST_CONVERTER]),
      '',
      '## 14) Definition of Done Snapshot',
      `- Score: ${spec[K.COMPLETENESS][K.SCORE]}/100`,
      '- Remaining Warnings',
      markdownList(spec[K.COMPLETENESS][K.WARNINGS]),
    ].join('\n');
  }

  function buildMasterPrompt(spec) {
    const coreChecklist = buildMasterPromptCoreChecklist(spec);
    const mustList = markdownOrderedList(spec[K.FEATURES][K.MUST], '1. Must 기능 없음');
    const flowList = markdownOrderedList(spec[K.FLOW], '1. 사용자 흐름 단계 없음');
    const testList = markdownOrderedList(spec[K.TESTS], '1. 테스트 시나리오 없음');
    const nextList = markdownOrderedList(spec[K.NEXT], '1. 오늘 할 일 없음');

    return [
      '당신은 구현 담당 시니어 개발자다. 아래 표준 스키마를 기준으로 기능을 구현하라.',
      '',
      `[한 줄 요약] ${spec[K.SUMMARY]}`,
      '',
      '[문제정의 5칸]',
      buildProblemFramePromptMarkdown(spec[K.PROBLEM_FRAME]),
      '',
      '[핵심 Must 기능]',
      mustList,
      '',
      '[화면 흐름 5단계]',
      flowList,
      '',
      '[입력 필드]',
      buildInputFieldCardsMarkdown(spec[K.INPUT_FIELDS]),
      '',
      '[권한 규칙]',
      buildPermissionCardsMarkdown(spec[K.PERMISSIONS]),
      '',
      '[표준 요청문]',
      spec[K.REQUEST_CONVERTER][K.STANDARD_REQUEST],
      '',
      '[변경 영향도]',
      buildImpactMarkdown(spec[K.IMPACT]),
      '',
      '[테스트 시나리오 3개]',
      testList,
      '',
      '[핵심 구현 체크리스트]',
      coreChecklist,
      '',
      '[오늘 할 일 3개]',
      nextList,
      '',
      '요구사항:',
      '1) 데이터 검증 규칙과 권한 체크를 코드로 분리할 것.',
      '2) 에러 케이스(누락 입력/권한 없음/유효성 실패)를 명시적으로 처리할 것.',
      '3) 구현 후 테스트 시나리오 3개를 체크리스트로 검증할 것.',
    ].join('\n');
  }

  function normalizeThinkingAlternatives(value) {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) => {
        const safe = isPlainObject(item) ? item : {};
        return {
          name: toText(safe.name, '대안'),
          pros: toStringArray(safe.pros),
          cons: toStringArray(safe.cons),
          decision: toText(safe.decision, '보류'),
          reason: toText(safe.reason),
        };
      })
      .filter((item) => item.name || item.pros.length || item.cons.length || item.reason);
  }

  function buildCompatibilityThinking(spec, rawThinking = null) {
    const defaultAlternatives = [
      {
        name: 'A. 템플릿 기반 빠른 시작',
        pros: [
          '초보자가 바로 실행 가능한 구조를 빠르게 만들 수 있음',
          '요청문/테스트/권한 누락을 초기에 줄일 수 있음',
        ],
        cons: [
          '자유도가 낮아 복잡한 케이스 확장에 한계가 있음',
        ],
        decision: 'adopt',
        reason: '초보자 MVP 단계에서는 구조화와 실행 속도가 우선이므로 기본 경로로 채택합니다.',
      },
      {
        name: 'B. 자유 입력 중심 고유연성',
        pros: [
          '도메인 특수 요구를 자유롭게 표현할 수 있음',
        ],
        cons: [
          '초보자에게는 요구사항 누락/모호성이 증가하기 쉬움',
          '검증/테스트 항목이 비어 배포 전 리스크가 커질 수 있음',
        ],
        decision: 'reject',
        reason: '초보자 온보딩 단계에서는 품질 편차가 커서 기본 경로로는 배제하고, 고급 모드에서만 허용합니다.',
      },
    ];

    const raw = isPlainObject(rawThinking) ? rawThinking : {};
    const normalizedAlternatives = normalizeThinkingAlternatives(raw.alternatives);
    const assumptions = toStringArray(raw.assumptions);
    const uncertainties = toStringArray(raw.uncertainties);

    return {
      interpretation: toText(raw.interpretation, spec[K.SUMMARY]),
      assumptions: assumptions.length ? assumptions : spec[K.FEATURES][K.MUST],
      uncertainties: [
        ...uncertainties,
        ...spec[K.AMBIGUITIES][K.MISSING],
        ...spec[K.AMBIGUITIES][K.QUESTIONS],
        ...spec[K.COMPLETENESS][K.WARNINGS],
      ],
      alternatives: normalizedAlternatives.length ? normalizedAlternatives : defaultAlternatives,
    };
  }

  function buildCompatibilityGlossary(spec) {
    const coreTerms = [
      {
        term: 'Parsing',
        simple: 'Parsing은 문장에서 필요한 값을 규칙대로 뽑아 구조화하는 과정입니다.',
        analogy: '자유롭게 쓴 메모에서 주문서 칸만 정확히 추출해 옮기는 작업과 같습니다.',
        why: '파싱 규칙이 불명확하면 입력 오류와 누락이 급격히 늘어납니다.',
        decision_point: '입력 문장 포맷을 고정할지, 자연어에서 유연 추출할지 결정하세요.',
        beginner_note: '처음에는 포맷을 고정하는 방식이 안정적입니다.',
        practical_note: '정규식/파서 규칙 실패 시 에러 메시지를 명확히 반환하세요.',
        common_mistakes: [
          '구분자 규칙을 문서화하지 않아 사용자 입력이 제각각이 됨',
          '파싱 실패 케이스를 무시하고 빈 값으로 저장함',
        ],
        request_template: 'Parsing 규칙(입력 포맷, 실패 처리, 에러 메시지)을 명시하고 테스트 케이스를 추가해주세요.',
        aliases: ['파싱', 'parsing'],
        flow_stage: 'Parsing',
      },
      {
        term: 'Schema',
        simple: 'Schema는 데이터 필드의 이름, 타입, 필수 여부를 정의한 약속입니다.',
        analogy: '엑셀 양식의 열 이름과 입력 규칙을 미리 정해두는 설계도입니다.',
        why: 'Schema가 없으면 팀마다 다른 해석으로 저장되어 데이터가 깨집니다.',
        decision_point: '필수 필드와 선택 필드를 어디까지 구분할지 결정하세요.',
        beginner_note: '핵심 필드 3~5개부터 시작해 단계적으로 확장하세요.',
        practical_note: '클라이언트/서버 Schema를 동일하게 유지해야 검증 불일치를 줄일 수 있습니다.',
        common_mistakes: [
          '타입 정의 없이 문자열로만 저장함',
          '필수 필드 누락을 허용해 후속 로직이 실패함',
        ],
        request_template: 'Schema(필드명/타입/필수 여부)를 확정하고 Validation 규칙을 함께 정의해주세요.',
        aliases: ['스키마', 'schema'],
        flow_stage: 'Source of Truth',
      },
      {
        term: 'JSON',
        simple: 'JSON은 시스템끼리 데이터를 교환할 때 쓰는 구조화된 텍스트 형식입니다.',
        analogy: '사람이 읽을 수 있는 형태의 표준 전달 문서라고 보면 됩니다.',
        why: 'JSON 구조가 고정되면 자동화/검증/테스트가 쉬워집니다.',
        decision_point: '응답에서 필수 키를 무엇으로 고정할지 결정하세요.',
        beginner_note: '키 이름은 짧고 의미가 분명해야 유지보수가 쉽습니다.',
        practical_note: 'JSON 파싱 실패에 대비한 재시도/복구 로직이 필요합니다.',
        common_mistakes: [
          '필드 타입이 호출마다 바뀜',
          '필수 키가 누락되어 UI 렌더링이 깨짐',
        ],
        request_template: 'JSON 응답 스키마의 필수 키와 타입을 고정하고 누락 시 fallback을 추가해주세요.',
        aliases: ['제이슨', 'json'],
        flow_stage: 'Data Sync',
      },
      {
        term: 'Validation',
        simple: 'Validation은 입력값이 규칙을 지키는지 확인하는 단계입니다.',
        analogy: '문서 제출 전에 필수 항목과 형식을 점검하는 체크리스트와 같습니다.',
        why: 'Validation이 없으면 잘못된 데이터가 저장되어 오류가 연쇄적으로 발생합니다.',
        decision_point: '어떤 입력을 즉시 차단하고 어떤 입력은 경고로 처리할지 결정하세요.',
        beginner_note: '필수값 누락과 타입 오류부터 먼저 막으세요.',
        practical_note: '클라이언트/서버 양쪽 Validation을 분리해 구현하세요.',
        common_mistakes: [
          '클라이언트에서만 검사하고 서버 검사를 생략함',
          '에러 원인을 사용자에게 설명하지 않음',
        ],
        request_template: 'Validation 규칙(필수값/타입/범위)과 실패 메시지를 정의해주세요.',
        aliases: ['검증', 'validation'],
        flow_stage: 'Source of Truth',
      },
    ];

    const fields = spec[K.INPUT_FIELDS] || [];
    const fieldTerms = fields.slice(0, 8).map((field, idx) => {
      const name = field[K.NAME] || `필드${idx + 1}`;
      const type = field[K.TYPE] || 'string';
      return {
        term: name,
        simple: `${name}은(는) ${type} 타입 입력값입니다.`,
        analogy: '입력 폼의 칸 하나를 정확히 정의하는 규칙입니다.',
        why: '타입과 예시를 먼저 고정하면 개발/테스트 오류를 줄일 수 있습니다.',
        decision_point: `${name} 필드의 필수 여부와 유효성 규칙을 결정하세요.`,
        beginner_note: '필드마다 반드시 예시값을 먼저 정하세요.',
        practical_note: '클라이언트/서버에서 동일한 검증 규칙을 사용하세요.',
        common_mistakes: [
          '화면 입력 검증만 하고 서버 검증을 누락함',
          '필드 타입 정의 없이 문자열로만 처리함',
        ],
        request_template: `${name} 필드를 ${type} 타입으로 고정하고 유효성 검증 규칙을 추가해주세요.`,
        aliases: [name],
        flow_stage: 'Parsing',
      };
    });

    return [...coreTerms, ...fieldTerms];
  }

  function buildResultSections(spec, rawThinking = null) {
    return {
      artifacts: {
        dev_spec_md: buildDevSpecMarkdown(spec),
        nondev_spec_md: buildNonDevSpecMarkdown(spec),
        master_prompt: buildMasterPrompt(spec),
      },
      layers: {
        L1_thinking: buildCompatibilityThinking(spec, rawThinking),
      },
      glossary: buildCompatibilityGlossary(spec),
    };
  }

  return {
    buildMasterPrompt,
    buildResultSections,
    buildCompatibilityThinking,
    buildCompatibilityGlossary,
    renderArtifacts(spec) {
      return buildResultSections(spec).artifacts;
    },
  };
}
