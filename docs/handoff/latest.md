# Session Handoff (Latest)

- Updated: 2026-03-09
- Repo: `C:\Users\dudcj\OneDrive\바탕 화면\바이브투스펙V2`
- Branch: `main`
- Scope: product/persona audit, dead-surface cleanup, next-thread handoff

## Current Status

- Phase 1: contract/IR foundation in place
- Phase 2: thin pipeline extraction is complete enough for the current transition stage
- Phase 3: normalization / analysis boundary is stabilized
- Phase 4: generation / execution boundary extraction is complete enough to pause by default
- Recommended next lane: product validation, persona-fit validation, and selective UX cleanup

## What Changed Most Recently

### 1. Persona/runtime wiring was audited from preset to engine prompt path

Verified path:
- `ui/app/persona/presets.js`
- `ui/app/hooks/useAppController.js`
- `engine/graph/promptPolicy.js`
- `engine/graph/transmuteEngine.js`
- persona-specific workspace components under `ui/app/components/*`

Confirmed behavior:
- `beginner` is genuinely different at generation time because it uses `beginner_zero_shot`
- `experienced` and `major` still share the same `baseline` prompt policy
- `experienced` and `major` differ mainly in UI density, visible summaries, and clarification workflow shape

### 2. Dead product surface was removed, but the cleanup is still only partial

Removed:
- dead persona runtime flags:
  - `supportsStrictFormat`
  - `showPromptPolicyMeta`
  - `allowBeginnerAdvancedToggle`
  - `defaultBeginnerAdvancedOpen`
- leftover result-panel artifact:
  - `AX_LAYER_TABS` in `ui/app/components/result-panel/constants.js`

Conclusion:
- the cleanup was useful, but it did not finish the broader persona/product-fit lane
- the remaining problems are now mostly misleading controls and persona-output mismatch, not dead flags

## Product Audit Summary From This Thread

1. `experienced` and `major` personas are still too similar in the actual generation path.
- both still use `baseline` prompt policy in `ui/app/persona/presets.js`
- both still enter the same baseline prompt envelope in `engine/graph/transmuteEngine.js`
- output differences are still more presentational than engine-level

2. Beginner quick-prompt delivery is not yet truly beginner-native.
- the beginner workspace still centers a warning-wrapped AI coding prompt derived from the shared master-prompt/context-output path
- current warning logic detects the mismatch, but does not actually simplify the artifact

3. Some surfaced controls still over-promise relative to visible UX.
- `showThinking` / `추론 레이어 포함` is still sent through the request path
- the product surface does not yet explain a clear user-facing reasoning view that matches the wording

4. One direct Node-loading hygiene issue still remains outside the cleanup done here.
- `ui/app/components/hooks/useExperiencedSummary.js` still imports `../result-panel/builders` without an ESM file extension

5. Dead config cleanup is now only partially remaining.
- the obvious dead persona flags and `AX_LAYER_TABS` were removed in this thread
- remaining cleanup should focus on misleading or low-value surfaced controls, not the already-removed dead flags

## Validation

Passing focused engine tests from the previous engine thread:

```text
node --test --test-isolation=none engine/execution/executeStructuredGeneration.test.js engine/graph/transmuteEngine.test.js engine/validation/semanticRepairIssues.test.js engine/validation/standardOutputValidation.test.js engine/pipeline/buildSpecTransmuteResult.test.js engine/pipeline/runSpecTransmutePipeline.test.js engine/intent/normalizeSpecDraft.test.js engine/intent/prepareSpecAnalysis.test.js
```

Current-thread verification:

```text
node --input-type=module -e "..."
```

Additional audit notes:
- direct module verification succeeded for the cleaned persona/runtime files
- `node --test` could not be fully validated in this environment because it failed with `spawn EPERM`
- `npm run build` was not re-run in this thread

## What Still Remains Inside `transmuteEngine.js`

- prompt construction and prompt-policy wiring
- single prompt-attempt JSON parse + one-retry repair
- provider/model selection
- provider transport and remote execution
- public facade wiring into the spec pipeline

## Thread Boundary Recommendation

Use a fresh next thread.

Reason:
- the engine refactor lane is still paused for good reasons
- the current remaining work is product/persona fit, not structural engine extraction
- the next thread should be judged by user-visible product clarity, not refactor neatness

## Recommended Next Thread

The next thread should stay in product validation and selective cleanup, not deeper engine refactoring.

Suggested objectives:
1. decide whether `experienced` and `major` should diverge at prompt-policy level or collapse toward one advanced lane
2. make beginner quick output genuinely beginner-native instead of warning-only around the shared AI-coding prompt
3. align `showThinking` wording with actual visible UX, or hide/de-scope it
4. clean up remaining low-value runtime/UI leftovers such as the ESM import-path hygiene issue
5. only reopen engine refactoring if a concrete blocker emerges from that work
