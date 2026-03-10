# Mode Comparison Scenarios

## Purpose
Use the same input in `입문자`, `빠른 실행형`, `검토 통제형` and verify that the difference feels like a working-style difference, not a prestige ladder.

Keep this as a product-validation set.
Do not use it to justify engine refactoring unless a concrete blocker appears.

## How To Evaluate
For each scenario, check these first:
- Can `입문자` reach a fast first success while learning one structure slot?
- Does `빠른 실행형` show only the top actions and top warnings first?
- Does `검토 통제형` surface blocking issues, contract, and impact before finalizing?
- Are any controls duplicated, misleading, or too technical for the mode?

## Scenario 1: Small Business Landing Page
### Input
```text
카페 홍보용 랜딩 페이지를 만들고 싶어. 메뉴, 위치, 영업시간, 예약 문의가 보이면 좋겠어.
```
### What To Watch
- `입문자`: goal, audience, constraints, and one-line improvement should be easy to spot.
- `빠른 실행형`: today-action list and top warnings should appear before deep diagnostics.
- `검토 통제형`: required input fields, blocking issues, and affected screens should appear before long outputs.

## Scenario 2: Admin Role Change
### Input
```text
관리자 페이지에서 매니저 권한만 주문 취소를 할 수 있게 바꾸고 싶어. 변경 기록도 남아야 해.
```
### What To Watch
- `입문자`: should learn that permission rules and audit logging are key structure slots.
- `빠른 실행형`: should focus on the main implementation steps and only the most important warning.
- `검토 통제형`: should emphasize permission conflict, contract impact, and test scope before final prompts.

## Scenario 3: Mobile Signup Improvement
### Input
```text
회원가입 화면을 더 간단하게 만들고 싶어. 휴대폰 번호 인증은 유지하고, 입력 중 이탈을 줄이고 싶어.
```
### What To Watch
- `입문자`: should explain the structure behind success criteria and user flow.
- `빠른 실행형`: should keep the summary compact and execution-first.
- `검토 통제형`: should call out changed screens, validation rules, and edge cases.

## Scenario 4: Internal Dashboard Export
### Input
```text
사내 대시보드에서 이번 달 매출 데이터를 CSV로 내보내고 싶어. 팀장만 내보낼 수 있어야 하고 실패하면 이유를 보여줘야 해.
```
### What To Watch
- `입문자`: should reveal the need for permissions, output format, and failure handling without overload.
- `빠른 실행형`: should make it obvious what to build today and what warning to inspect first.
- `검토 통제형`: should foreground contract, permission, and failure-path review.

## Pass Signal
The set is working if a real user can explain the difference in one sentence:
- `입문자` = quickly get started and learn structure
- `빠른 실행형` = execute now and inspect only the top warnings
- `검토 통제형` = review blockers, contract, and impact before finalizing
