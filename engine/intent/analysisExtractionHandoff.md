# Analysis Extraction Handoff

## What This Thread Stabilized
- `engine/intent/normalizeSpecDraft.js` owns raw provider JSON -> spec draft normalization.
- `engine/intent/prepareSpecAnalysis.js` owns post-normalization analysis-facing derivation.
- `normalizeStandardOutput` is a thin composition stage that wires:
  - `normalizeSpecDraft`
  - `prepareSpecAnalysis`
  - `validateStandardOutput`
- focused tests cover the raw-to-draft handoff boundary in `engine/intent/normalizeSpecDraft.test.js`.
- public app result shape stays unchanged because `transmuteEngine.js` still delegates final envelope building to `buildSpecTransmuteResult`.

## What Changed After This Handoff
Subsequent engine work extracted the smallest remaining reusable generation/execution boundary that was still justified:
- `engine/validation/semanticRepairIssues.js` now owns semantic repair issue collection.
- `engine/execution/executeStructuredGeneration.js` now owns structured-generation retry orchestration.
- `executePromptRepairChain` inside `engine/graph/transmuteEngine.js` is now a thin wrapper that delegates to that execution-stage helper.

This means the analysis boundary described here is still valid, but it is no longer the next pressure point by default.

## Boundary To Preserve
- `normalizeSpecDraft` should keep owning raw alias/source extraction and spec draft assembly.
- `prepareSpecAnalysis` should keep owning derived analysis-friendly signals that are still computed after spec normalization.
- `normalizeStandardOutput` should remain a composition boundary, not a place where raw parsing logic grows back.
- do not move renderer-specific markdown or UI compatibility logic back into these helpers.

## What Still Has Not Changed
- intent IR is still derived after normalized spec, not from an earlier explicit analysis stage
- prompt construction still lives in `engine/graph/transmuteEngine.js`
- provider/model selection and provider execution still live in `engine/graph/transmuteEngine.js`
- single prompt-attempt parse/repair logic still lives in `engine/graph/transmuteEngine.js`

## Recommended Next Direction
Default next direction is no longer another engine extraction.

Prefer:
1. persona/output validation
2. beginner educational UX validation
3. cleanup of dead config and misleading product controls
4. only then, reopen engine refactoring if product validation exposes a concrete blocker

## Not Recommended In The Same Step
- moving intent IR earlier while also reshaping the renderer boundary
- mixing provider execution extraction with a large analysis-stage redesign
- reopening renderer refactor work in the same thread
- changing the public result envelope
- continuing engine cleanup only because the files could become smaller
