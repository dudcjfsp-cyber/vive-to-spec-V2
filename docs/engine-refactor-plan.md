# Engine Refactor Plan

## Goal
Refactor the engine without changing current product behavior.

The immediate purpose is to prepare `Vibe-to-Spec V2` to become the first product on top of a reusable core engine.

## Refactor Policy
During this phase:
- preserve current external behavior
- preserve current public result shape for the spec app
- prefer extraction and delegation over rewrites
- avoid UI-driven engine changes unless required

## Phase 1: Lock The Contract
Status: foundational contract in place

Deliverables:
- `docs/intent-ir.md`
- `engine/contracts/intentIr.js`
- `engine/contracts/specIntentFieldMap.js`
- `engine/intent/deriveIntentIr.js`

Purpose:
- define the engine-centered intermediate representation
- make spec-specific field aliases explicit in one place
- stop treating spec output as the only meaningful engine result
- create a stable place for future prompt and architecture work to connect

Progress snapshot:
- intent IR contract exists
- spec field alias mapping exists
- intent IR derivation exists
- intent IR is still derived from normalized spec output, so this is not yet an independent analysis stage

## Phase 2: Thin Pipeline Extraction
Status: completed enough for the current transition stage

Deliverables:
- `engine/pipeline/buildSpecTransmuteResult.js`
- `engine/pipeline/runSpecTransmutePipeline.js`
- smaller orchestration role for `engine/graph/transmuteEngine.js`

Purpose:
- separate orchestration from normalization and rendering details
- prepare the existing transmute flow to evolve into explicit stages
- reduce monolith pressure without changing the current app contract

Progress snapshot:
- `runSpecTransmutePipeline.js` exists and keeps the public result envelope stable
- `buildSpecTransmuteResult.js` exists and accepts a renderer object instead of scattered spec-specific callbacks
- `engine/renderers/spec/specRenderer.js` exists and owns spec-specific result section generation
- `transmuteEngine.js` still owns prompt construction, prompt-attempt execution, provider execution, and public facade wiring

## Phase 3: Normalization / Analysis Boundary Extraction
Status: stabilized for the current transition stage

Deliverables:
- `engine/intent/prepareSpecAnalysis.js`
- `engine/intent/normalizeSpecDraft.js`
- focused tests in:
  - `engine/intent/prepareSpecAnalysis.test.js`
  - `engine/intent/normalizeSpecDraft.test.js`
- thinner composition inside `normalizeStandardOutput`

Purpose:
- define where spec-shaped normalization ends
- define where analysis-preparation derivation begins
- reduce pressure inside `normalizeStandardOutput` without changing returned app behavior

Progress snapshot:
- `normalizeSpecDraft.js` owns raw provider JSON -> spec draft normalization
- `prepareSpecAnalysis.js` owns normalized-spec-afterward derivation for:
  - interview question fallback/derivation
  - request converter fallback/derivation
  - impact preview fallback/derivation
  - completeness input passed to validation
- `normalizeStandardOutput` mainly composes draft normalization, analysis preparation, and validation
- the public app contract remains stable because `transmuteEngine.js` still delegates the final result envelope to `buildSpecTransmuteResult`

## Phase 4: Generation / Execution Boundary Extraction
Status: completed enough to pause by default

Delivered:
- `engine/validation/semanticRepairIssues.js`
- `engine/execution/executeStructuredGeneration.js`
- thinner `executePromptRepairChain` wrapper inside `engine/graph/transmuteEngine.js`

Purpose:
- make semantic issue collection renderer-neutral and validation-adjacent
- make structured generation retry orchestration reusable across future renderers
- reduce the amount of retry/repair policy embedded directly in the facade

Progress snapshot:
- semantic repair issue collection now lives outside the facade
- structured generation retry orchestration now lives in a reusable execution-stage helper
- the handoff between semantic issue detection and repair orchestration is clearer
- public result behavior remains unchanged

What intentionally remains:
- prompt construction
- prompt-policy wiring
- single-attempt parse/repair logic
- provider/model selection
- provider transport and remote execution
- public facade wiring

## Current Target Shape
Short-term target:
- `transmuteEngine.js` remains the public facade
- extracted modules carry reusable logic
- spec app behavior stays stable

Mid-term target:
- `input -> structured generation -> draft normalization -> analysis prep -> validate -> renderSpec`

Long-term target:
- `input -> intent IR -> plan -> renderers(spec/prompt/architecture) -> validation`

## What This Phase Should Not Do
Do not do these next by default:
- break the current UI result shape
- introduce multiple new output products in this repo
- rewrite the full engine in one pass
- entangle persona/UI concerns deeper into engine core
- mix product-surface cleanup with another engine refactor lane unless the product work reveals a concrete engine blocker

## Success Criteria
This refactor lane is successful if:
- the current app still behaves the same
- the engine has an explicit intent contract
- orchestration code became easier to split into real stages
- future work can add renderers without starting from a spec-only design
- future work can reuse generation/retry infrastructure without inheriting spec-only normalization code

Those criteria are now met well enough that validation work should lead.

## Refactor Pause Decision
Default recommendation: pause engine refactoring here.

Reason:
- the next likely extractions improve aesthetics more than engine extensibility
- the remaining facade responsibilities are now concentrated in provider-facing and prompt-building concerns that have wider blast radius
- product validation can now test whether the current engine boundaries are sufficient for persona fit and future renderer experiments

Reopen this lane only if validation reveals a specific blocker such as:
- a second renderer cannot reuse the structured-generation path cleanly
- persona/product improvements require provider/runtime boundaries that are still too coupled
- output validation cannot be improved without another explicit engine handoff

## Recommended Next Work
The preferred next thread should move to product validation rather than deeper engine cleanup.

Priorities:
1. validate persona-specific output fit
2. tighten beginner educational delivery
3. remove dead UI/runtime configuration that survived recent cleanup
4. verify that reasoning/clarification controls match what the UI actually explains
5. create a small evaluation set for real user scenarios

## Suggested Thread Boundary
Start a fresh thread for the next work.

Reason:
- the engine-refactor lane has reached a natural stop point
- the next work should be judged by product usefulness, not structural purity
- mixing persona/UI validation into the same thread would blur the success criteria and context

## Suggested Start Prompt For The Next Thread
```text
Before making changes, read these files first:
- docs/long-term-context.md
- docs/engine-refactor-plan.md
- docs/intent-ir.md
- docs/handoff/latest.md
- docs/handoff/next-engine-thread.md

Current product/engine reality:
- The reusable engine refactor lane is paused by default.
- `engine/renderers/spec/specRenderer.js` remains the spec renderer.
- `engine/pipeline/buildSpecTransmuteResult.js` and `engine/pipeline/runSpecTransmutePipeline.js` keep the public result envelope stable.
- `engine/graph/transmuteEngine.js` is still the public facade.
- `engine/intent/normalizeSpecDraft.js` owns raw provider JSON -> spec draft normalization.
- `engine/intent/prepareSpecAnalysis.js` owns normalized-spec-afterward analysis preparation.
- `engine/validation/semanticRepairIssues.js` owns semantic repair issue collection.
- `engine/execution/executeStructuredGeneration.js` owns structured-generation retry orchestration.
- UI/server/adapter contracts and the public result shape must stay unchanged.

For this thread, do product-validation work rather than engine refactoring:
- check whether recent UI/UX cleanup actually removed unnecessary surface area
- verify whether each persona gets appropriately different output and guidance
- identify dead config, misleading controls, and overly advanced beginner delivery
- prefer focused cleanup and validation over structural redesign

At the end, summarize:
- whether the current product surface is actually simpler
- where persona output is still too similar or mismatched
- which cleanup items are safe next moves
- whether any concrete engine blocker was found
```
