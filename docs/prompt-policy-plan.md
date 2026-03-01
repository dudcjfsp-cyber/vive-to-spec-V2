# Prompt Policy Engine Migration Plan

- Updated: 2026-03-01
- Repo: `C:\Users\dudcj\OneDrive\바탕 화면\바이브투스펙V2`
- Status: Planning only (no implementation in this session)
- Goal: 현재 V2의 프롬프트 엔진을 `정책 기반(prompt policy)`으로 재구성해, 입문자에게는 재진술이 아닌 구현 가능 프롬프트를 안정적으로 제공하고 이후 경험자/전공자 모드로 확장 가능한 구조를 만든다.

## 1. Background

현재 구조는 다음 두 층으로 나뉜다.

1. 엔진층
- `engine/graph/transmuteEngine.js`
- `BASE_SYSTEM_PROMPT`, `buildPrompt()`, `transmuteVibeToSpec()`가 실제 모델 호출 전 프롬프트를 만든다.

2. UI 후처리층
- `ui/app/components/beginner-prompt.js`
- 입문자 화면에서 생성된 `master_prompt` 또는 `표준_요청`을 유사도 기준으로 후처리/보강한다.

문제는, 입문자 가치의 핵심인 "프롬프트 품질 향상"이 아직 엔진 바깥(UI 후처리)에 치우쳐 있다는 점이다. 이 구조에서는:

- 실제 모델이 받는 입력은 여전히 단일 `BASE_SYSTEM_PROMPT + vibe` 중심이다.
- 입문자와 경험자의 차이가 "보여주는 방식"에 머물 수 있다.
- L4 품질 검증과 프롬프트 정책이 분리되어 있어 일관성이 약하다.

따라서 다음 구현은 "UI 보강 유지"가 아니라 "엔진에 정책 레이어를 삽입"하는 방향으로 진행한다.

## 2. Policy Source Interpretation

이식 대상으로 본 외부 주장(제로샷 우선, 퓨샷 제한, 긍정형 지시, 핵심 지시 상단 배치)은 다음처럼 해석한다.

1. 유지할 원칙
- 기본 생성은 `zero-shot`
- `few-shot`은 형식 강제가 필요한 경우에만 제한적 허용
- 부정형 금지문보다 긍정형 행동 지시 우선
- 핵심 제약/목표/출력 형식은 프롬프트 상단 배치

2. 완화할 원칙
- "강한 모델이면 few-shot이 항상 불리하다" 같은 단정은 금지
- 모델/과업별로 다를 수 있으므로 정책과 실험 대상으로 분리

3. V2에 맞게 추가할 원칙
- zero-shot 기본 전략이더라도 L4에서 누락/정합 경고를 잡아야 한다
- 정책 효과는 체감이 아니라 지표(`재진술률`, `L4 경고`, `보강 항목 수`)로 평가한다

## 3. Migration Target

이번 이식의 목표는 아래 4가지다.

1. 엔진에서 `prompt policy`를 조립한다
2. 입문자 모드는 이 정책을 실제 모델 호출 전에 적용한다
3. UI는 정책 결과를 "표시"만 하고, 정책 자체는 엔진이 소유한다
4. 정책 실패 시 기존 프롬프트 경로로 즉시 fallback 가능해야 한다

## 4. Non-Goals

이번 작업에서 하지 않을 것:

1. 경험자/전공자 UX 세분화 완성
2. 하이브리드 스택 추천 프롬프트 재설계
3. 대규모 프롬프트 템플릿 라이브러리 구축
4. 백엔드 분리 또는 서버사이드 프롬프트 저장

## 5. Current Code Baseline

핵심 접점은 아래 파일들이다.

1. 엔진/어댑터
- `engine/graph/transmuteEngine.js`
- `adapters/LLMAdapter.js`

2. 앱 오케스트레이션
- `ui/app/hooks/useAppController.js`
- `ui/app/App.jsx`

3. 입문자 UI/후처리
- `ui/app/components/BeginnerWorkspace.jsx`
- `ui/app/components/beginner-prompt.js`

4. L4 검증
- `ui/app/components/result-panel/integrity.js`

## 6. Proposed Architecture

새 구조는 아래와 같이 분리한다.

1. Prompt Policy Layer
- 위치: `engine/graph/promptPolicy.js`
- 역할:
  - persona별 정책 선택
  - zero-shot / few-shot 분기
  - 긍정형 지시 정규화
  - 지시 우선순위 재배치
  - 프롬프트 메타 생성

2. Prompt Builder Layer
- 위치: `engine/graph/transmuteEngine.js`
- 역할:
  - 정책에서 반환한 system/user/runtime envelope 조립
  - 모델 제공자별 공통 전달 포맷 유지

3. UI Display Layer
- 위치: `ui/app/components/BeginnerWorkspace.jsx`
- 역할:
  - 정책 메타를 읽어 뱃지/설명 표시
  - 입문자 전용 후처리(`beginner-prompt.js`)는 표시용 보조로 유지

4. Validation Layer
- 위치: `ui/app/components/result-panel/integrity.js` 또는 별도 `prompt-integrity.js`
- 역할:
  - 프롬프트 품질 리스크를 경고로 환원

## 7. Planned Modules

### 7.1 `engine/graph/promptPolicy.js`

신규 파일. 최소 API는 아래 형태로 설계한다.

```js
export function resolvePromptPolicy({ persona, mode, taskType })
export function buildPromptPolicyMeta({ vibe, persona, mode })
export function rewriteInstructionsPositiveFirst(text)
export function buildPromptSections({ vibe, schemaHint, baseSystemPrompt, policy })
```

포함할 정책 규칙:

1. `policyMode = baseline`
- 현재 동작과 동일

2. `policyMode = beginner_zero_shot`
- 예시 없음
- 제약/목표/출력형식 상단 고정
- 긍정형 지시 우선
- 입문자 친화적 구체화 가이드 추가

3. `policyMode = strict_format`
- JSON 형식 강제가 매우 중요할 때만 최소 예시 허용
- 향후 opt-in 전용

### 7.2 `engine/graph/promptPolicy.test.js`

필수 테스트 범위:

1. 입문자 정책은 기본적으로 예시를 추가하지 않는다
2. strict_format 정책만 예시 허용 플래그를 가진다
3. 부정형 지시가 긍정형 우선 문장으로 치환된다
4. 섹션 순서가 `constraints -> goal -> output -> runtime -> user_input` 순으로 유지된다

### 7.3 `docs/prompt-policy-plan.md`

현재 문서. 구현 후 결과와 다른 점을 기록하는 기준 문서로 유지한다.

## 8. File-by-File Implementation Plan

### Step 1. Baseline Preservation

대상 파일:
- `engine/graph/transmuteEngine.js`

작업:
- 현재 `BASE_SYSTEM_PROMPT`, `JSON_SCHEMA_HINT`, `buildPrompt()`를 분리 전에 snapshot 기준으로 유지
- 동작 동등성 기준을 테스트로 확보

완료 기준:
- `baseline` 모드에서는 현재와 동일한 prompt string을 생성

### Step 2. Policy Module Introduction

대상 파일:
- `engine/graph/promptPolicy.js`
- `engine/graph/promptPolicy.test.js`

작업:
- 정책 타입 정의
- persona -> policyMode 매핑 정의
- positive-first rewrite 유틸 구현

완료 기준:
- 순수 함수 단위 테스트 통과

### Step 3. Prompt Builder Refactor

대상 파일:
- `engine/graph/transmuteEngine.js`

작업:
- `buildPrompt(vibe, showThinking, retryPayload)`를 아래 형태로 전환

```js
buildPrompt({
  vibe,
  showThinking,
  retryPayload,
  persona,
  policyMode,
})
```

- 내부에서 `promptPolicy` 모듈 호출
- retry 경로는 policy 적용 없이 현재 복구 전략 유지

완료 기준:
- retry 경로 기존 동작 유지
- baseline에서 기존 결과 동일

### Step 4. Adapter/Controller Option Plumbing

대상 파일:
- `adapters/LLMAdapter.js`
- `ui/app/hooks/useAppController.js`
- `ui/app/App.jsx`

작업:
- `transmuteVibeToSpec` 호출 옵션에 아래 값 추가
  - `persona`
  - `promptPolicyMode`
  - `promptExperimentId`

- 1차 기본값:
  - `beginner` -> `beginner_zero_shot`
  - `experienced`, `major` -> `baseline`

완료 기준:
- persona 선택이 실제 엔진 옵션으로 전달된다

### Step 5. Beginner UI Meta Integration

대상 파일:
- `ui/app/components/BeginnerWorkspace.jsx`
- `ui/app/components/beginner-prompt.js`

작업:
- 엔진 응답 메타(예: `policy_applied`, `example_mode`, `positive_rewrite_count`)를 읽어 배지 표시
- `beginner-prompt.js`는 "후처리 보강"에서 "표시용 추가 보강"으로 책임 축소

완료 기준:
- UI는 정책을 설명하지만 정책을 직접 소유하지 않는다

### Step 6. L4 Prompt Integrity Warnings

대상 파일:
- `ui/app/components/result-panel/integrity.js`
- 필요 시 `ui/app/components/result-panel/prompt-integrity.js`

추가할 경고 후보:

1. `prompt-near-paraphrase`
- 실행 프롬프트가 원문 재진술에 가까움

2. `prompt-missing-acceptance`
- 완료 기준/검증 기준 누락

3. `prompt-missing-output-shape`
- 출력 형식 제약(JSON/페이지 번호/필드 구조) 누락

4. `prompt-negative-instruction-heavy`
- 부정형 지시 비율 과다

완료 기준:
- 입문자 모드에서 프롬프트 품질 이슈가 L4에 드러난다

### Step 7. Experiment Metadata

대상 파일:
- `engine/graph/transmuteEngine.js`
- `ui/app/hooks/useAppController.js`

작업:
- 응답 메타에 아래 필드 포함
  - `prompt_policy_mode`
  - `prompt_experiment_id`
  - `example_mode`
  - `prompt_sections`

목적:
- 내부 A/B 비교 및 후속 튜닝 근거 확보

완료 기준:
- UI에 노출하지 않더라도 state/로그에서 추적 가능

## 9. Prompt Policy Rules (Detailed)

### 9.1 Zero-Shot Default

1. 기본 생성에는 예시를 붙이지 않는다
2. 스키마 힌트와 제약만으로 출력 형식을 고정한다
3. 누락은 후속 L4 검증으로 보완한다

### 9.2 Few-Shot Restriction

few-shot 허용 조건:

1. JSON key ordering이 심하게 흔들릴 때
2. 표/리스트 레이아웃이 자주 무너질 때
3. provider/model 조합에서 baseline failure가 반복될 때

few-shot 금지 조건:

1. 입문자 기본 프롬프트
2. 과업 정의가 짧고 추상적일 때
3. 출력 다양성이 필요한 초기 확장 단계

### 9.3 Positive-First Rewriting

변환 원칙:

1. "`하지 마라`"만 있는 문장은 "`~만 수행하라`" 또는 "`~를 포함하라`" 형태로 치환
2. 금지 규칙은 필요 시 보조 문장으로 유지
3. 핵심 지시는 가능한 동사 기반 행동 지시로 표현

예시:

- Before: `설명문을 길게 쓰지 마라`
- After: `설명문은 핵심만 1~2문장으로 간결하게 작성하라`

### 9.4 Instruction Priority Order

최종 프롬프트 섹션 순서:

1. Role / system identity
2. Hard constraints
3. Output schema shape
4. Goal and success conditions
5. Runtime option
6. User vibe
7. Optional examples (strict_format only)

## 10. Data Contract Changes

다음 응답 메타를 추가하는 방향으로 설계한다.

```json
{
  "meta": {
    "prompt_policy_mode": "baseline|beginner_zero_shot|strict_format",
    "prompt_experiment_id": "string",
    "example_mode": "none|minimal",
    "positive_rewrite_count": 0,
    "prompt_sections": ["role", "constraints", "schema", "goal", "runtime", "user_vibe"]
  }
}
```

주의:
- 기존 UI가 의존하는 `standard_output`, `artifacts`, `layers`, `glossary`는 절대 깨지지 않아야 한다
- 메타는 backward-compatible 하게 추가만 한다

## 11. Risk Register

1. Baseline regression
- 정책 레이어 삽입 후 기존 안정 응답이 무너질 수 있음
- 대응: baseline 모드 snapshot 테스트 유지

2. Over-normalization
- 긍정형 rewrite가 의미를 왜곡할 수 있음
- 대응: rewrite는 보수적으로, 금지문 자체 삭제 금지

3. False confidence in zero-shot
- few-shot 없이 형식이 불안정할 수 있음
- 대응: strict_format escape hatch 유지

4. UI/엔진 책임 재혼합
- 입문자 UI가 다시 정책을 직접 소유할 수 있음
- 대응: 정책은 엔진, UI는 메타 표시만 담당

## 12. Validation Plan

### Unit

1. `promptPolicy` 순수 함수 테스트
2. `transmuteEngine.buildPrompt` 정책별 조립 테스트
3. `beginner-prompt.js`는 표시용 후처리 테스트만 유지

### Integration

1. `cmd /c npm test`
2. `cmd /c npm run build`
3. baseline 모드와 beginner_zero_shot 모드의 prompt diff 검증

### Manual QA

입문자 입력 샘플:

1. `MSDS PDF 파일을 넣으면 AI가 pdf를 읽어서 필요한 내용을 추출하는 웹서비스`
2. `고객 문의를 자동 분류하고 운영자가 수정할 수 있는 관리자 페이지`
3. `회의록 업로드 후 요약과 액션아이템을 추출하는 사내 웹앱`

확인 항목:

1. 재진술률 감소
2. 완료 기준 문장 포함 여부
3. 출력 형식 지시 포함 여부
4. L4 경고 노출의 타당성

## 13. Rollout Sequence

1. 1차: `beginner`만 `beginner_zero_shot`
2. 2차: `experienced`에 `baseline + optional stricter summaries`
3. 3차: `major`에 정책 선택/오버라이드 옵션 노출

현재 세션에서는 1차 구현도 하지 않는다. 이번 문서는 다음 세션 구현 준비용 기준선이다.

## 14. Done Definition For Next Session

다음 세션에서 "이번 계획 구현 완료"로 볼 수 있는 최소 기준:

1. `promptPolicy` 모듈 추가 및 테스트 통과
2. 엔진 `buildPrompt()`가 policy-aware 구조로 전환
3. `beginner` persona가 실제 엔진 정책을 전달
4. 응답 메타에 정책 적용 정보 포함
5. `npm test` / `npm run build` 통과
6. handoff 문서 갱신

## 15. Next Session Execution Order

다음 세션 시작 시 아래 순서로 진행한다.

1. `docs/prompt-policy-plan.md` 재확인
2. `engine/graph/transmuteEngine.js` prompt baseline 테스트 작성
3. `engine/graph/promptPolicy.js` 생성
4. `adapters/LLMAdapter.js` / `useAppController.js` 옵션 연결
5. `BeginnerWorkspace.jsx` 메타 표시 연결
6. `npm test`
7. `npm run build`
8. `docs/handoff/latest.md` 업데이트
