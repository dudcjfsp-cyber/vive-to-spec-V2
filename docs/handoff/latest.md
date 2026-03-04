# Session Handoff (Latest)

- Updated: 2026-03-04
- Repo: `C:\Users\dudcj\OneDrive\바탕 화면\바이브투스펙V2`
- Branch: `main`
- Scope: closed-loop UX stabilization + beginner prompt UX alignment

## Current Status

- Week 1: done
- Week 2: done
- Week 3: done
- Week 4: in progress
- Week 5: in progress

현재 기준으로 다음 상태가 코드에 반영되어 있다.

1. 경험자 guided loop v1 연결 완료
2. 전공자 manual loop console 연결 완료
3. `useAppController`의 1차 transmute/regenerate flow 분리 완료
4. 경험자/전공자 엔진 경로에 `strict_format` -> `semantic_repair` 폴백 체인 연결 완료
5. L4/L5 경고 액션과 전공자 수동 루프 질문 세트 동기화 연결 완료

## What Changed Recently

### 1. Closed-loop bridge deepened

- `ResultPanel`의 L4 경고 카드에서 `수동 루프로 보내기`가 전공자 manual loop 질문 세트와 직접 연결된다.
- L5 실행 바인더에서 현재 staging된 수동 루프 질문을 확인하고 추천 질문을 동기화할 수 있다.
- 수동 루프 관련 버튼/안내/질문 문구는 한국어로 정리됐다.

핵심 파일:

- `ui/app/components/ResultPanel.jsx`
- `ui/app/components/result-panel/Sections.jsx`
- `ui/app/components/MajorWorkspace.jsx`
- `ui/app/hooks/useAppController.js`
- `ui/app/services/clarifyLoop.js`

### 2. Engine fallback quality stabilized

- `engine/graph/promptPolicy.js`에 `semantic_repair` 정책이 추가됐다.
- `engine/graph/transmuteEngine.js`에서 `experienced` / `major` 생성 결과가 의미적으로 빈약할 때:
  1. `strict_format`
  2. 필요 시 `semantic_repair`
  순서로 재시도한다.
- 결과 meta에 아래 값이 남는다.
  - `repair_mode`
  - `fallback_applied`
  - `validation_retry_count`
  - `semantic_issue_count`

핵심 파일:

- `engine/graph/promptPolicy.js`
- `engine/graph/transmuteEngine.js`

### 3. L1 suggested hypothesis UX stabilized

- `추천 가설 보기`는 실제로 바뀔 값만 미리보기로 보여준다.
- 자동 추천 diff가 없으면:
  - 안내 문구는 `자동으로 덮어쓸 추천값은 없지만, 강조된 필드는 직접 보완이 필요합니다.`
  - 버튼은 `직접 수정 필요`로 바뀌고 비활성화된다.
- 즉, L4에서 L1로 내려온 경우 no-op처럼 보이던 상태를 명시적인 수동 보완 상태로 드러낸다.

핵심 파일:

- `ui/app/components/ResultPanel.jsx`
- `ui/app/components/result-panel/Sections.jsx`
- `ui/app/components/result-panel/intelligence.js`

### 4. Beginner prompt view now mirrors L3 intent

- 입문자 `바로 실행 프롬프트`는 더 이상 `표준 요청문` 우선값을 보여주지 않는다.
- 이제 L3와 같은 계산 경로(`buildProblemFrame` -> `buildLogicMap` -> `buildContextOutputs().aiCoding`)를 사용한다.
- 프롬프트 본문을 자동으로 덧붙여 수정하지 않고, 부족한 항목은 경고 박스로 분리한다.
- `먼저 확인할 점` 카드는 프롬프트 카드보다 위로 이동했다.
- 복사 성공 시 버튼 라벨이 `복사 완료`로 바뀌며, 실패 시에만 별도 오류 문구를 표시한다.

핵심 파일:

- `ui/app/components/BeginnerWorkspace.jsx`
- `ui/app/components/beginner-prompt.js`
- `ui/app/components/result-panel/builders.js`

## Validation

- `cmd /c npm test` 성공 (53 passed)
- `cmd /c npm run build` 성공

## Known Boundaries

- 브라우저 수동 검증은 사용자가 직접 진행 중이며, 자동화된 UI E2E 테스트는 아직 없다.
- `transmuteEngine.js`와 `useAppController.js`는 여전히 크기가 커서, 다음 구조 정리 대상이다.

## Recommended Next Session

다음 세션의 첫 작업은 아래 주제로 시작하는 것이 맞다.

1. 코드 작성 시 반드시 고려할 항목(입력 조건, 예외 처리, 권한, 완료 기준, 테스트 등)의 공통 코어 체크리스트를 정의
2. 이를 아래 세 계층에 어떻게 나눠 반영할지 결정
   - `engine/graph/promptPolicy.js`
   - `engine/graph/transmuteEngine.js`의 `buildMasterPrompt`
   - `ui/app/components/beginner-prompt.js`
3. “강제 주입”과 “경고만 노출”의 경계를 정한 뒤 적용

요약하면, 다음 세션은 UI 미세조정보다 `prompt hardening policy` 설계/적용 세션으로 잡는 편이 안전하다.
