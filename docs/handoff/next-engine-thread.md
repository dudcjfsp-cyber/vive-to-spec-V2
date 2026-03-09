# Next Thread Instructions

## Thread Goal
Validate the current product surface now that the engine refactor lane has reached a natural pause point.

This next thread is not a default engine-refactor thread.
The default assumption should be:
- keep the current engine structure unless product validation reveals a concrete blocker

## Read First
- `docs/long-term-context.md`
- `docs/engine-refactor-plan.md`
- `docs/intent-ir.md`
- `docs/handoff/latest.md`
- `docs/handoff/next-engine-thread.md`

## Why This Thread Exists
The engine has already reached the smallest safe reusable boundary for this refactor lane.

What is now true:
- `engine/validation/semanticRepairIssues.js` owns semantic repair issue collection
- `engine/execution/executeStructuredGeneration.js` owns structured-generation retry orchestration
- `executePromptRepairChain` is now a thin facade wrapper
- public result shape and UI/server/adapter contracts remain unchanged

That means the main unanswered questions are now product questions:
- did the recent UI/UX cleanup actually remove unnecessary complexity?
- do beginner / experienced / major personas receive appropriately different outputs and guidance?
- are there misleading controls or leftover stage artifacts still in the product?

## Current State Summary
- `Vibe-to-Spec V2` is the first renderer/product on top of a reusable intent engine
- the long-term asset is still the engine, but the current next risk is product fit rather than engine structure
- the current engine should stay stable unless product validation exposes a specific reuse or coupling problem

Known product audit signals to verify:
- `experienced` and `major` still appear too similar at the prompt-policy level
- beginner quick-prompt delivery is still too close to the shared AI-coding/master-prompt path
- the obvious dead persona/runtime flags and `AX_LAYER_TABS` cleanup are already done
- some visible controls, especially around reasoning/thinking, still promise more than the UI actually teaches
- `ui/app/components/hooks/useExperiencedSummary.js` still has a direct Node-loading hygiene issue from a missing ESM extension

## Main Objective For This Thread
Produce a product-validation report first, then make only the safest fixes if they are clearly justified.

The report should answer:
1. Did the recent UI cleanup really remove unnecessary surface area?
2. Is each persona's output and guidance appropriate for its intended user?
3. Which remaining controls/configuration are misleading, redundant, or still low-value after the dead-config cleanup?
4. Is there any concrete engine blocker that prevents the next product improvements?

## Preferred Direction
- validate before redesigning
- prefer removing misleading or dead product surface over adding new complexity
- prefer persona-fit improvements that are visible to users
- keep engine changes out of scope unless they directly unblock a validated product problem

## Scope
Allowed:
- `ui/*`
- light-touch engine reads for validation reasoning
- tests or focused fixes directly tied to the report

Avoid by default:
- deeper engine refactor
- renderer redesign
- provider transport redesign
- changing UI/server/adapter contracts
- changing the public result envelope

## Important Constraints
- Do not change UI/server/adapter contracts.
- Do not change the public result envelope.
- Do not restart engine refactoring unless there is a concrete blocker.
- Prefer validation, simplification, and product-fit cleanup over structural rewrites.
- Keep the thread scoped to one product-validation responsibility at a time.

## Suggested Work Order
1. Re-read the latest handoff and verify the current persona/runtime wiring in code.
2. Audit whether recent cleanup removed or merely hid old product surface.
3. Compare beginner / experienced / major outputs and controls against intended user needs.
4. Identify what is still misleading or leftover after the dead-config cleanup that already landed.
5. If making fixes, keep them small and directly tied to validated findings.
6. End by judging whether any engine blocker was actually discovered.

## Validation
- Prefer focused tests or direct code-path verification over broad rewrites.
- If build validation is attempted, record any environment limits separately from product findings.

## End-Of-Thread Summary
At the end, summarize:
- whether the current UI/product surface is actually simpler
- whether persona outputs are appropriately different at both UI and prompt-policy level
- which cleanup items are safe next moves
- whether any engine change is truly needed next

## Suggested Prompt For The Next Thread
```text
Before making changes, read these files first:
- docs/long-term-context.md
- docs/engine-refactor-plan.md
- docs/intent-ir.md
- docs/handoff/latest.md
- docs/handoff/next-engine-thread.md

Project intent:
- The real long-term asset is a reusable intent engine for future products like Vibe-to-Prompt, Vibe-to-Architecture, and Vibe Studio.
- `Vibe-to-Spec V2` is the first product/renderer on top of that engine.
- Keep the current UI/server/adapter contract and public result envelope unchanged.

Current state:
- `engine/renderers/spec/specRenderer.js` is the spec renderer.
- `engine/pipeline/buildSpecTransmuteResult.js` and `engine/pipeline/runSpecTransmutePipeline.js` preserve the public result envelope.
- `engine/graph/transmuteEngine.js` is still the public facade.
- `engine/intent/normalizeSpecDraft.js` owns raw provider JSON -> spec draft normalization.
- `engine/intent/prepareSpecAnalysis.js` owns normalized-spec-afterward analysis preparation.
- `engine/validation/semanticRepairIssues.js` owns semantic repair issue collection.
- `engine/execution/executeStructuredGeneration.js` owns structured-generation retry orchestration.
- Engine structural refactoring is paused by default.

Known current findings:
- `experienced` and `major` are still too similar at prompt-policy level.
- beginner quick delivery is still too close to the shared AI-coding/master-prompt path.
- the obvious dead persona/runtime flags and `AX_LAYER_TABS` cleanup are already done.
- `showThinking` may still over-promise relative to visible UX.

Your task for this thread:
- audit whether the recent UI/UX cleanup actually removed unnecessary surface area
- verify whether beginner / experienced / major personas receive appropriately different outputs and guidance
- identify remaining misleading controls and leftover stage artifacts
- only make focused fixes if they directly match validated findings

Important constraints:
- Do not change UI/server/adapter contracts.
- Do not change the public result envelope.
- Do not reopen engine refactoring unless you find a concrete blocker.
- Prefer simplification and product validation over redesign.

At the end, summarize:
- whether the cleanup is complete enough or still partial
- where persona output is still mismatched
- what the safest next fixes are
- whether a new engine thread is actually needed
```
