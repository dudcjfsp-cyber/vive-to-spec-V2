# Session Handoff (Latest)

- Updated: 2026-03-01
- Repo: `C:\Users\dudcj\OneDrive\바탕 화면\바이브투스펙V2`
- Branch: `main`
- HEAD: `9d302e9` (`feat: add persona onboarding and beginner prompt enrichment`)
- Git status: dirty (modified + untracked files, no commit in this run)

## Completed In This Run

1. Prompt baseline 보호 테스트 추가
- `engine/graph/transmuteEngine.test.js`에서 legacy baseline prompt 문자열을 snapshot 수준으로 고정
- retry JSON 복구 프롬프트도 기존 문자열 유지 검증 추가

2. Prompt policy 모듈 1차 이식
- `engine/graph/promptPolicy.js` 신설
- persona/mode 기반 `baseline`, `beginner_zero_shot`, `strict_format` 해석 추가
- positive-first rewrite 유틸과 prompt section/meta 생성 로직 추가
- `engine/graph/promptPolicy.test.js`로 순수 함수 테스트 추가

3. Transmute 엔진 policy-aware 전환(기준선 fallback 유지)
- `buildPrompt()`를 object 옵션 기반으로 확장
- `beginner` 경로는 정책 섹션형 프롬프트 사용
- `baseline` 경로는 기존 prompt string 완전 유지
- retry 경로는 정책 우회 후 기존 복구 프롬프트 그대로 유지
- 응답에 backward-compatible `meta` 필드 추가:
  - `prompt_policy_mode`
  - `prompt_experiment_id`
  - `example_mode`
  - `positive_rewrite_count`
  - `prompt_sections`

4. Persona -> 엔진 옵션 연결
- `ui/app/hooks/useAppController.js`에서 persona 기반 정책 기본값 연결
- 1차 매핑:
  - `beginner` -> `beginner_zero_shot`
  - `experienced`, `major`, 미선택 -> `baseline`
- `promptExperimentId` 기본값도 함께 생성해 shadow state payload에 기록
- `ui/app/App.jsx`에서 active persona를 controller에 전달

5. Beginner UI 메타 표시 연결
- `ui/app/components/BeginnerWorkspace.jsx`에서 엔진 정책 뱃지 표시
- 노출 항목:
  - 엔진 정책 모드
  - 긍정형 정리 횟수
  - 예시 사용 모드
  - prompt section 순서
- 기존 `beginner-prompt.js` 후처리 보강은 표시용 보조 역할 유지

## Added / Updated Key Files

- `engine/graph/promptPolicy.js`
- `engine/graph/promptPolicy.test.js`
- `engine/graph/transmuteEngine.js`
- `engine/graph/transmuteEngine.test.js`
- `ui/app/hooks/useAppController.js`
- `ui/app/App.jsx`
- `ui/app/components/BeginnerWorkspace.jsx`
- `docs/handoff/latest.md`

## Validation

- `cmd /c npm test` 성공 (29 passed)
- `cmd /c npm run build` 성공

## Git

- Commit: none
- HEAD unchanged: `9d302e9`
- Working tree contains local changes for prompt policy migration

## Session End State

- 개발 서버는 실행하지 않음
- 워킹트리 dirty 유지(사용자 요청대로 미커밋)
- 참고: `docs/prompt-policy-plan.md`는 현재도 추적 전(untracked) 계획 문서 상태

## Suggested Next Session Focus

1. `promptPolicy` 메타를 `ResultPanel`/L4 integrity 경고까지 확장
2. `strict_format` escape hatch를 실제 opt-in 경로로 연결
3. baseline vs beginner prompt diff를 더 명시적으로 검증하는 통합 테스트 추가
