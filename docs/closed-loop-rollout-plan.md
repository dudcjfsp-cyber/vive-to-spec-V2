# Persona-Based Closed Loop Rollout Plan

- Updated: 2026-03-03
- Repo: `C:\Users\dudcj\OneDrive\바탕 화면\바이브투스펙V2`
- Status: In progress
- Goal: 입문자 one-shot 완성 경험은 유지하고, 경험자/전공자부터 폐루프(검증 -> 보완 질문 -> 재생성)를 단계적으로 도입한다.

## 0. Implementation Status

- Week 1: done
- Week 2: done
- Week 3: done (experience mode guided loop v1 connected)
- Week 4: in progress (major mode manual loop console now syncs with ResultPanel L4/L5 actions)
- Controller refactor: done (generation/regeneration flow helpers extracted)
- Week 5: in progress (strict_format + semantic_repair fallback chain landed in engine)
- Week 6+: pending

### 0.1 Latest Progress Snapshot

이번 진행에서 반영된 항목:

1. `engine/validation/standardOutputValidation.js`
- 표준 출력 검증을 전용 모듈로 분리
- `validation_report` 생성 시작

2. `ui/app/services/clarifyLoop.js`
- 보완 질문 진입 판단과 보강 입력 병합 로직 분리

3. `ui/app/services/transmuteFlow.js`
- 생성/재생성 흐름의 shadow payload 조립과 loop 계획 계산을 순수 함수로 분리

4. 경험자/전공자 UI 연결
- 경험자: 가이드형 1회 재생성
- 전공자: 수동 질문 제외 / 스킵 / 재생성 콘솔

### 0.2 2026-03-03 Addendum

- `ResultPanel` L4 warning actions can now push targeted questions into the major manual loop set.
- `ResultPanel` L5 now shows the staged manual-loop questions and can sync suggested questions before regenerate.
- `engine/graph/transmuteEngine.js` now retries `experienced` and `major` outputs through `strict_format`, then `semantic_repair`, and records repair metadata.
- Tests were expanded for the new clarify-merge helpers and prompt fallback chain.

## 1. Why This Document Exists

이 문서는 장기 작업에서 세션이 끊겨도 방향이 흔들리지 않도록, 아래 두 가지를 한 문서에 고정하기 위해 만든다.

1. 장기 컨텍스트 운영 방식
2. 주차별 구현 순서

현재 V2는 이미 `docs/handoff/latest.md`로 최근 세션 요약을 남기고 있다. 다만 장기 프로젝트에서는 "최근 변경" 문서만으로는 설계 의도, 구현 순서, 결정 근거가 쉽게 흩어진다. 따라서 이 문서는 `폐루프 확장` 기능군의 기준선 문서로 유지한다.

## 2. Recommended Context Structure

장기적으로는 "기능별 대화 세션"보다 "기능별 기준 문서 + 세션별 handoff" 조합이 더 안정적이다.

권장 구조는 아래와 같다.

1. 기준 문서
- 역할: 기능의 목표, 범위, 단계, 완료 조건을 고정
- 예시: 이 문서(`docs/closed-loop-rollout-plan.md`)
- 원칙: 자주 바꾸지 않는다. 단계가 끝날 때만 갱신한다.

2. 세션 handoff 문서
- 역할: 이번 세션에서 무엇을 했는지, 어디까지 끝났는지, 다음 세션 시작점을 남긴다
- 현재 파일: `docs/handoff/latest.md`
- 권장 운영: 세션 종료 시 `latest.md` 갱신, 필요하면 별도 아카이브로 복사

3. 의사결정 문서(ADR)
- 역할: 되돌리기 어려운 구조 결정 기록
- 권장 예시:
  - 경험자 폐루프 최대 1회 자동 질문
  - 전공자만 수동 루프 제어 허용
  - `strict_format` 자동 폴백 조건
- 권장 위치: `docs/decisions/ADR-xxxx-*.md`

4. 작업 단위 문서
- 역할: 한 주차 또는 한 기능 묶음의 상세 작업 체크리스트
- 권장 예시:
  - `docs/tasks/closed-loop-week-1.md`
  - `docs/tasks/closed-loop-week-2.md`
- 원칙: 구현 중 적극적으로 갱신해도 된다

5. 파일 단위 세션 메모
- 역할: 특정 파일 묶음을 건드릴 때 즉시 참고할 작업 범위 축소
- 권장 예시:
  - `engine/graph` 세션
  - `engine/state` 세션
  - `ui/app/hooks` 세션
- 원칙: 대화 세션 제목도 파일군 기준으로 잡는다

### 2.1 Recommended Working Contract Per Session

매 세션은 아래 순서로 진행한다.

1. 이 문서에서 이번 주차/단계를 확인한다.
2. `docs/handoff/latest.md`에서 직전 변경 상태를 읽는다.
3. 이번 세션의 대상 파일군을 1개 또는 1개 묶음으로 제한한다.
4. 구현한다.
5. 테스트한다.
6. `docs/handoff/latest.md`를 갱신한다.
7. 작은 단위로 커밋한다.

### 2.2 Recommended Commit Granularity

폐루프처럼 영향 범위가 넓은 기능은 "한 번에 큰 커밋"보다 아래 단위가 낫다.

1. 상태 스키마 변경
2. 검증 모듈 분리
3. controller 오케스트레이션 추가
4. 경험자 UI 추가
5. 전공자 UI 제어 추가
6. 테스트/문서 보강

한 커밋이 여러 계층을 동시에 건드리더라도, 목적은 하나여야 한다.

### 2.3 Recommended First Structural Improvement

새 기능을 바로 구현하기 전에, 문서 기준선부터 고정하는 것이 좋다.

권장 순서:

1. 이 문서를 폐루프 기능군의 단일 기준 문서로 유지
2. 이후 주차별 상세 문서를 별도로 분리
3. 중요한 구조 결정은 ADR로 분리

즉, 장기 컨텍스트의 기준은 다음처럼 나눈다.

- "무엇을 왜 하는가": 이 문서
- "방금 무엇을 했는가": `docs/handoff/latest.md`
- "왜 그렇게 결정했는가": ADR
- "이번 주에 무엇을 바꿀 것인가": task 문서

## 3. Persona Rollout Principle

폐루프는 전 사용자 공통 기능이 아니라, 숙련도별로 다르게 동작해야 한다.

1. 입문자
- 원칙: 완성 경험 우선
- 정책: 재질문 없음
- UX: one-shot 생성 유지
- 허용 범위: 경고 표시, 보조 프롬프트 복사, 읽기 전용 안내

2. 경험자
- 원칙: 품질 향상 우선
- 정책: 조건부 1회 보완 질문
- UX: 1차 결과를 먼저 보여준 뒤, 필요할 때만 보완 질문 제안
- 허용 범위: 자동 진입형 폐루프 v1

3. 전공자
- 원칙: 제어 가능성 우선
- 정책: 수동 반복 가능한 폐루프
- UX: 검증 결과, 질문 후보, 재생성 조건을 직접 조정
- 허용 범위: 수동 제어형 폐루프 v2

## 4. Current Code Anchors

이번 기능군의 핵심 접점은 아래 파일들이다.

1. 상태
- `engine/state/specState.js`
- `ui/app/services/specStateShadow.js`

2. 엔진
- `engine/graph/transmuteEngine.js`
- `engine/graph/promptPolicy.js`

3. 앱 오케스트레이션
- `ui/app/hooks/useAppController.js`

4. 페르소나 정책
- `ui/app/persona/presets.js`

5. UI
- `ui/app/components/BeginnerWorkspace.jsx`
- `ui/app/components/ExperiencedWorkspace.jsx`
- `ui/app/components/MajorWorkspace.jsx`
- `ui/app/components/ResultPanel.jsx`

## 5. Weekly Rollout Plan

아래 순서는 그대로 구현 순서로 사용한다. 각 주차는 "그 주에 끝나야 하는 범위"를 의미하고, 실제 대화 세션은 파일군 단위로 더 잘게 쪼개 진행한다.

### Week 1. State Model and Persona Capabilities

목표:
- 폐루프를 넣어도 입문자 경로를 깨지 않는 공통 상태 기반을 만든다.

작업:

1. `ui/app/persona/presets.js`
- `loopMode`, `maxClarifyTurns`, `showLoopControls`, `showValidationMeta` capability 추가
- 권장 기본값:
  - beginner: `off`
  - experienced: `guided_once`
  - major: `manual`

2. `engine/state/specState.js`
- 아래 상태 필드 확장
  - `loop_turn`
  - `pending_questions`
  - `clarification_answers`
  - `last_validation`
  - `last_generation_id`

3. `ui/app/services/specStateShadow.js`
- 아래 이벤트 타입 추가
  - `clarify_started`
  - `clarify_answered`
  - `clarify_skipped`
  - `regenerate_started`
  - `regenerate_success`

완료 기준:

1. 기존 입문자 동작 변화 없음
2. 경험자/전공자용 루프 상태를 저장할 필드가 준비됨
3. 이벤트 로그만으로 루프 진행 상태를 복원할 수 있음

권장 커밋:
- `feat: extend spec state for persona loop tracking`

### Week 2. Validation Layer Extraction

목표:
- 폐루프 진입 조건을 프롬프트가 아니라 코드에서 결정할 수 있게 만든다.

작업:

1. `engine/validation` 실체화
- 현재 `transmuteEngine.js`에 섞인 검증 성격 로직을 별도 모듈로 분리
- 최소 API 예시:
  - `validateStandardOutput(spec)`
  - `buildClarificationCandidates(report)`

2. 검증 리포트 포맷 정의
- 아래 정보를 구조화
  - `warnings`
  - `blockingIssues`
  - `severity`
  - `suggestedQuestions`
  - `canAutoProceed`

3. `engine/graph/transmuteEngine.js`
- 결과 정규화 직후 validation report를 함께 반환

완료 기준:

1. 결과마다 동일 형식의 validation report가 붙음
2. controller가 "보완 질문을 띄울지"를 report만 보고 판단 가능
3. 검증 로직이 엔진 본문에서 분리되기 시작함

권장 커밋:
- `refactor: extract standard output validation layer`

### Week 3. Experienced Closed Loop v1

목표:
- 경험자에게만 1회 자동 보완 질문 루프를 붙인다.

작업:

1. `ui/app/hooks/useAppController.js`
- 경험자 persona에서만 아래 흐름 추가
  - 1차 생성
  - validation report 확인
  - 필요 시 보완 질문 1~3개 생성
  - 사용자 답변 수집
  - 답변을 반영해 1회 재생성

2. 재생성 입력 규칙 정의
- 원문 vibe를 덮어쓰지 않는다
- `clarification_answers`를 별도 보강 블록으로 prompt에 합친다

3. `ui/app/components/ExperiencedWorkspace.jsx`
- 보완 질문 입력 UI 추가
- 재생성 전 "왜 이 질문을 묻는지" 짧은 안내 추가

완료 기준:

1. 경험자에서만 보완 질문 UI가 나타남
2. 최대 1회만 자동 루프 수행
3. 입문자와 전공자 기존 경로는 유지

권장 커밋:
- `feat: add guided one-turn closed loop for experienced persona`

### Week 4. Major Closed Loop v2

목표:
- 전공자에게는 수동 제어 가능한 폐루프를 연다.

작업:

1. `ui/app/components/ResultPanel.jsx`
- validation report 상세 노출
- 질문 후보 목록 표시
- 질문 선택/제외/수정 UI 추가

2. `ui/app/components/MajorWorkspace.jsx`
- "재생성", "이번 답변 무시", "가정 고정", "롤백" 같은 제어 UI 연결

3. `ui/app/hooks/useAppController.js`
- 전공자 경로에서 수동 반복 실행 허용
- 루프 횟수, 마지막 질문 세트, 마지막 적용 답변 추적

완료 기준:

1. 전공자가 자동 질문을 그대로 따르지 않고 수정 가능
2. 전공자가 재생성 트리거를 직접 제어 가능
3. 동일 세션 내에서 이전 상태로 롤백 가능

권장 커밋:
- `feat: add manual closed loop controls for major persona`

### Week 5. Prompt Fallback and Semantic Repair

목표:
- 경험자/전공자 경로에서 실패 시 더 엄격한 정책으로 자동 보정한다.

작업:

1. `engine/graph/promptPolicy.js`
- `strict_format` 승격 조건 정의

2. `engine/graph/transmuteEngine.js`
- 아래 순서의 폴백 체인 도입
  - 기본 정책 실행
  - JSON 실패 시 기존 repair
  - validation 실패 시 semantic repair 또는 `strict_format` 재시도

3. 결과 메타 확장
- 아래 필드 추가
  - `repair_mode`
  - `fallback_applied`
  - `validation_retry_count`

완료 기준:

1. 단순 JSON 복구를 넘어 의미 수준의 재보정 가능
2. 경험자/전공자에서 형식/정합 실패 시 자동 폴백 적용
3. 입문자 경로는 여전히 빠른 one-shot 우선

권장 커밋:
- `feat: add strict-format fallback and semantic repair path`

### Week 6. Metrics, Tests, and Stabilization

목표:
- 폐루프가 실제로 도움이 되는지 persona별로 판단 가능한 상태를 만든다.

작업:

1. 이벤트/지표 정의
- `specState` history 또는 별도 meta에 아래 지표 기록
  - `first_pass_success`
  - `clarify_prompt_shown`
  - `clarify_answered`
  - `clarify_skipped`
  - `second_pass_improved`

2. 테스트 보강
- 입문자: 보완 질문이 절대 강제되지 않음
- 경험자: 최대 1회 자동 루프
- 전공자: 수동 루프 반복 가능
- fallback: validation 실패 시 승격 경로 동작

3. 문서 갱신
- 이 문서의 각 주차 상태 반영
- `docs/handoff/latest.md`에 실제 구현 상태 반영

완료 기준:

1. persona별 루프 효과를 비교할 수 있음
2. 회귀 테스트로 UX 원칙이 고정됨
3. 다음 단계(질문팩/코칭팩 고도화)로 넘어갈 기반이 생김

권장 커밋:
- `test: lock persona-specific closed-loop behavior`
- `docs: update closed-loop rollout status`

## 6. Recommended Session Slicing

실제 대화 세션은 주차 단위보다 더 작게 쪼개는 편이 좋다. 권장 단위는 아래와 같다.

1. 상태 세션
- 대상: `engine/state`, `ui/app/services/specStateShadow.js`

2. 검증 세션
- 대상: `engine/validation`, `engine/graph/transmuteEngine.js`

3. controller 세션
- 대상: `ui/app/hooks/useAppController.js`

4. 경험자 UI 세션
- 대상: `ui/app/components/ExperiencedWorkspace.jsx`

5. 전공자 UI 세션
- 대상: `ui/app/components/ResultPanel.jsx`, `ui/app/components/MajorWorkspace.jsx`

6. 테스트 세션
- 대상: 관련 `*.test.js`

이렇게 나누면 한 세션의 컨텍스트가 과도하게 커지지 않고, 커밋 경계도 명확해진다.

## 7. Practical Next Step

이 문서를 기준으로 바로 시작할 첫 구현은 `Week 1`이다.

첫 세션 권장 범위:

1. `ui/app/persona/presets.js`
2. `engine/state/specState.js`
3. `ui/app/services/specStateShadow.js`

이 세션에서는 UI를 바꾸지 말고, 상태와 capability만 먼저 확장한다.
