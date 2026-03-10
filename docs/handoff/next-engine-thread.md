# Next Thread Instructions

## Thread Goal
Validate the current product surface after the education-first UX pass, and make only the smallest high-value cleanup that improves clarity.

This next thread is not an engine-refactor thread.
The default assumption should be:
- keep the current engine structure unless product validation reveals a concrete blocker

## Read First
- `docs/long-term-context.md`
- `docs/engine-refactor-plan.md`
- `docs/intent-ir.md`
- `docs/handoff/latest.md`
- `docs/handoff/next-engine-thread.md`

## Why This Thread Exists
The product has now reached a cleaner checkpoint:
- beginner has a fast-success plus structure-learning flow
- advanced modes are framed by work style, not status labels
- global API/provider/model access has been restored
- tests and build are passing

That means the next highest-value question is no longer structural refactoring.
It is product judgment.

What needs validation now:
- does the current UI actually feel simpler?
- do the three modes feel genuinely different in practice?
- are there still misleading, duplicated, or low-value controls left in the product surface?
- is there any concrete reason to reopen engine work, or is the next problem still mostly UX/product-fit?

## Current State Summary
- `Vibe-to-Spec V2` is an education-first product for non-developers, vibe coders, and AI beginners.
- The long-term asset is still a reusable intent engine.
- Beginner should preserve fast success while revealing structure.
- Advanced modes are now work-style based:
  - `빠른 실행형`: execute quickly, inspect only top warnings first, clarify once only if needed
  - `검토 통제형`: review blocking issues, contract, and impact before finalizing output
- API/provider/model settings are now globally accessible from the header and settings modal.
- Model handling currently supports:
  - live model fetch
  - provider fallback defaults
  - preference-based selection fallback
- Automatic model switching after runtime failure is intentionally out of scope unless a strong product reason appears.

## Main Objective For This Thread
Produce a product-validation report first, then make only small fixes that are directly justified by that report.

The report should answer:
1. Is the current UI actually simpler after the recent changes?
2. Does each mode now feel appropriate for its intended working style?
3. Which surfaces are still misleading, duplicated, noisy, or low-value?
4. Is there any concrete engine blocker preventing the next product improvement?

## Preferred Direction
- validate before redesigning
- prefer removing or simplifying product surface over adding new features
- prefer fixes that strengthen learning clarity
- keep engine changes out of scope unless they directly unblock a validated product problem

## Scope
Allowed:
- `ui/*`
- light-touch engine reads for validation reasoning
- tests or focused fixes directly tied to validated findings
- handoff/doc updates if the conclusions become clear

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
1. Re-read the latest handoff and check the current persona/runtime wiring in code.
2. Audit the real user surface for all three modes.
3. Identify remaining misleading, duplicated, or low-value controls.
4. Make only small fixes that directly improve clarity.
5. End by judging whether another product thread is enough, or whether any separate engine thread is truly needed.

## Validation
- Prefer focused tests and direct UI/code-path verification.
- If build validation is run, keep environment notes separate from product conclusions.

## End-Of-Thread Summary
At the end, summarize:
- what is now clearly working
- what is still confusing or duplicated
- what the next smallest high-value improvement is
- whether a separate engine thread is actually needed

## Suggested Prompt For The Next Thread
```text
Before making changes, read these files first:
- docs/long-term-context.md
- docs/engine-refactor-plan.md
- docs/intent-ir.md
- docs/handoff/latest.md
- docs/handoff/next-engine-thread.md

Current project direction:
- This is an education-first product for non-developers, vibe coders, and AI beginners.
- Beginner should preserve fast success while teaching structure.
- Advanced modes are work-style based:
  - 빠른 실행형 = execute quickly, check only top warnings, clarify once if needed
  - 검토 통제형 = review blocking issues, contract, and impact before finalizing
- API/provider/model settings are now globally accessible from the header and settings modal.
- Model handling currently supports live fetch + provider fallback defaults + preference-based selection.
- Do not add automatic model-switch-on-failure logic unless a very strong product reason appears.

Your task in this thread:
1. Audit whether the current UI is actually simpler and more learnable after the recent changes.
2. Identify any remaining misleading, duplicated, or low-value controls/surfaces.
3. Check whether beginner, 빠른 실행형, and 검토 통제형 now feel meaningfully different to a real user.
4. Make only small, validated fixes that improve clarity without changing the public result envelope or UI/server/adapter contracts.

Important constraints:
- Do not reopen engine refactoring by default.
- Do not change the public result envelope.
- Prefer removing or simplifying product surface over adding more features.
- Treat this as a product-validation and selective cleanup thread, not a redesign thread.

At the end, summarize:
- what is now clearly working
- what is still confusing or duplicated
- what should be the next smallest high-value improvement
- whether a separate engine thread is actually needed
```
