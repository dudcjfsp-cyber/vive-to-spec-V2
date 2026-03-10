# Next Thread Instructions

## Thread Goal
Continue the product-validation lane with only the smallest useful cleanup that improves clarity.

This next thread is still not an engine-refactor thread.
The default assumption should remain:
- keep the current engine structure unless a concrete product blocker appears

## Read First
- `docs/long-term-context.md`
- `docs/engine-refactor-plan.md`
- `docs/intent-ir.md`
- `docs/handoff/latest.md`
- `docs/handoff/next-engine-thread.md`
- `docs/mode-comparison-scenarios.md`

## Why This Thread Exists
The current product surface is now at a safer checkpoint:
- beginner is stable as the fast-success plus structure-learning path
- advanced modes are framed by work style
- global API/provider/model settings remain accessible from the header and settings modal
- shared advanced diagnostics no longer blank the whole screen when they fail
- tests and build are passing

That means the next useful question is not structural refactoring.
It is whether the advanced surface can become a little clearer without redesigning it.

## Current State Summary
- `Vibe-to-Spec V2` is an education-first product for non-developers, vibe coders, and AI beginners.
- Beginner should preserve fast success while teaching structure.
- Advanced modes are work-style based:
  - `빠른 실행형`: execute quickly, inspect only top warnings first, clarify once only if needed
  - `검토 통제형`: review blocking issues, contract, and impact before finalizing output
- API/provider/model settings are globally accessible from the header and settings modal.
- Model handling currently supports live model fetch, provider fallback defaults, and preference-based selection fallback.
- Automatic model switching after runtime failure remains out of scope unless a strong product reason appears.

## Natural Continuation Candidates
These are good next-thread options, not must-do requirements.

1. Improve the comparison-scenario doc intro and usage notes a little so future validation runs faster.
2. Compress the default exposure order inside `빠른 실행형` detailed diagnostics if it still feels too dense.
3. Trim one more sentence from each `검토 통제형` dashboard card if real use still feels heavy.

## Preferred Direction
- validate before redesigning
- prefer removing or simplifying product surface over adding new features
- prefer copy, exposure-order, and density improvements over new controls
- keep engine changes out of scope unless they directly unblock a validated product problem

## Scope
Allowed:
- `ui/*`
- light-touch engine reads for validation reasoning
- tests or focused fixes directly tied to validated findings
- handoff/doc updates when conclusions become clear

Avoid by default:
- deeper engine refactor
- public result envelope changes
- UI/server/adapter contract changes
- provider transport redesign
- automatic model failover work

## Important Constraints
- Do not change UI/server/adapter contracts.
- Do not change the public result envelope.
- Do not reopen engine refactoring unless a concrete blocker is found.
- Prefer simplification, validation, and selective cleanup over feature growth.
- Keep the thread focused on product judgment and the smallest justified fixes.

## Suggested Work Order
1. Re-read the latest handoff and mode-comparison scenario doc.
2. Re-check the real user surface for `입문자`, `빠른 실행형`, and `검토 통제형`.
3. Pick only one or two small improvements that are clearly justified by what you see.
4. Validate with focused tests and, if needed, a build.
5. End with a short product judgment, not a redesign plan.

## End-Of-Thread Summary
At the end, summarize:
- what is now clearly working
- what is still confusing or duplicated
- what the next smallest high-value improvement is
- whether a separate engine thread is actually needed

## English Input Prompt
```text
Before making changes, read these files first:
- docs/long-term-context.md
- docs/engine-refactor-plan.md
- docs/intent-ir.md
- docs/handoff/latest.md
- docs/handoff/next-engine-thread.md
- docs/mode-comparison-scenarios.md

Current project direction:
- This is an education-first product for non-developers, vibe coders, and AI beginners.
- Beginner should preserve fast success while teaching structure.
- Advanced modes are work-style based:
  - 빠른 실행형 = execute quickly, inspect only top warnings first, clarify once only if needed
  - 검토 통제형 = review blocking issues, contract, and impact before finalizing
- API/provider/model settings are globally accessible from the header and settings modal.
- Model handling currently supports live model fetch, provider fallback defaults, and preference-based selection fallback.
- Do not add automatic model-switch-on-failure logic unless there is a very strong product reason.
- Shared advanced diagnostics now fail safe instead of blanking the whole screen.

For this thread, continue the product-validation lane with only very small cleanup:
1. Re-check whether the advanced surface still feels denser than it needs to.
2. If useful, make one or two tiny improvements such as:
   - clarifying the comparison-scenario doc intro
   - compressing the default exposure order inside 빠른 실행형 detailed diagnostics
   - trimming one more sentence from each 검토 통제형 dashboard card
3. Keep the work additive-light and avoid redesigning the UI.

Important constraints:
- Do not reopen engine refactoring by default.
- Do not change the public result envelope.
- Do not change UI/server/adapter contracts.
- Prefer simplification, validation, and selective cleanup over adding features.

At the end, summarize:
- what is now clearly working
- what is still confusing or duplicated
- what the next smallest high-value improvement is
- whether a separate engine thread is actually needed
```

## Korean Review Version
```text
다음 스레드는 엔진 리팩터링이 아니라, 지금 정리된 제품 표면을 조금 더 가볍게 다듬는 용도입니다.

먼저 다음 문서를 읽습니다:
- docs/long-term-context.md
- docs/engine-refactor-plan.md
- docs/intent-ir.md
- docs/handoff/latest.md
- docs/handoff/next-engine-thread.md
- docs/mode-comparison-scenarios.md

현재 기준으로 이미 맞춰진 방향은 이렇습니다:
- 이 제품은 비개발자, 바이브 코더, AI 초보자를 위한 교육형 제품이다.
- 입문자는 빠른 성공을 유지하면서 구조를 배워야 한다.
- 빠른 실행형은 상위 경고만 먼저 보고 빨리 실행하는 작업 방식이다.
- 검토 통제형은 차단 이슈, 계약, 영향 범위를 먼저 보고 결정하는 작업 방식이다.
- API/provider/model 설정은 전역 경로가 기본이다.
- 공유 고급 진단 패널은 이제 빈 화면이 아니라 안전하게 실패한다.

이번 스레드에서는 큰 개편 없이, 아주 작은 정리만 자연스럽게 이어간다:
- 고급 화면이 아직 조금 빽빽한지 다시 확인한다.
- 필요하면 아래 중 1~2개 정도만 고른다:
  - 비교 시나리오 문서의 도입/사용 설명을 조금 더 다듬기
  - 빠른 실행형 세부 진단의 기본 노출 우선순위를 조금 더 압축하기
  - 검토 통제형 카드 설명을 한 문장씩 더 짧게 다듬기
- 새 기능 추가나 구조 재설계는 피한다.

제약:
- 엔진 리팩터링을 기본으로 다시 열지 않는다.
- public result envelope를 바꾸지 않는다.
- UI/server/adapter contract를 바꾸지 않는다.
- 기능 추가보다 단순화와 검증을 우선한다.

마지막에는 다음만 짧게 정리한다:
- 지금 명확히 잘 되는 것
- 아직 헷갈리거나 중복되는 것
- 다음 최소 고가치 개선
- 별도 엔진 스레드가 필요한지 여부
```
