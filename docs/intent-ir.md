# Intent IR Draft

## Purpose
This document defines the first draft of the engine-level intermediate representation for intent analysis.

The goal is to make the engine reusable across:
- `Vibe-to-Spec`
- `Vibe-to-Prompt`
- `Vibe-to-Architecture`
- future `Vibe Studio` renderers

This is not the final public API yet.
It is the internal contract that should sit between:
- user input understanding
- output-specific rendering

## Core Rule
The engine should move toward this shape:
- `natural language -> intent IR -> renderer output`

Not this shape:
- `natural language -> final spec only`

## Draft Shape
```js
{
  version: 1,
  source_vibe: string,
  summary: string,
  intent: {
    target_user: string,
    usage_moment: string,
    user_job: string,
    problem_context: string,
    success_signal: string,
  },
  delivery: {
    roles: [{ name: string, description: string }],
    must_haves: string[],
    nice_to_haves: string[],
    input_fields: [{ name: string, description: string }],
    permissions: [{ name: string, description: string }],
  },
  analysis: {
    risks: string[],
    assumptions: string[],
    missing_information: string[],
    clarification_questions: string[],
  },
  signals: {
    confidence: 'low' | 'medium' | 'high',
    needs_clarification: boolean,
    severity: string,
    warning_count: number,
    blocking_issue_count: number,
  }
}
```

## Design Notes
### Why this shape
This structure keeps the engine focused on reusable understanding instead of output formatting.

It is intentionally:
- more abstract than `standard_output`
- more structured than raw natural language
- easier to reuse than a renderer-specific markdown artifact

### What belongs here
Put only information that other renderers may need.

Good candidates:
- user goal
- target user
- core job to be done
- constraints and risks
- missing information
- clarification signals
- confidence and validation signals

### What does not belong here
Do not place renderer-specific formatting or product-specific UI state here.

Avoid putting in:
- markdown presentation decisions
- panel open/close state
- persona-specific display text
- renderer-only naming hacks

## Current Mapping In Vibe-to-Spec
For now, this IR is derived from normalized spec data and validation output.
That means it is not yet a fully independent analysis stage.

Current transition stage:
- `natural language -> model JSON -> structured generation -> spec draft normalization -> analysis preparation -> derived intent IR -> spec renderer sections`

Current code-level status:
- `engine/intent/normalizeSpecDraft.js` now performs raw provider JSON -> spec draft normalization
- `engine/graph/transmuteEngine.js` still composes that draft normalization inside `normalizeStandardOutput`
- `engine/intent/prepareSpecAnalysis.js` performs post-normalization analysis-preparation derivation before validation is finalized
- `engine/pipeline/buildSpecTransmuteResult.js` still derives intent IR after spec normalization
- `engine/renderers/spec/specRenderer.js` still builds spec-only result sections after that point
- prompt construction, repair-chain execution, semantic issue detection, and provider transport are still upstream concerns inside `engine/graph/transmuteEngine.js`
- this is a better boundary than before, but intent IR is still downstream of spec normalization and not yet an earlier explicit analysis artifact

Target long-term stage:
- `natural language -> explicit intent analysis -> intent IR -> plan -> renderer sections`

## Near-Term Uses
Even before full engine separation, this contract can already help with:
- refactoring the engine safely
- defining reusable tests
- comparing prompt policy experiments
- preparing future prompt and architecture renderers
- making validation more intent-aware

## Near-Term Boundary Rule
Until analysis is split out properly:
- let renderers consume spec-shaped or intent-shaped data through explicit module boundaries
- let post-normalization helpers such as `prepareSpecAnalysis` exist as transitional stages, but do not treat them as the final analysis architecture
- let structured generation and repair stay separate from intent IR design decisions
- do not let renderer formatting requirements redefine the intent IR shape
- do not move renderer-only UI compatibility state into the intent IR

## Next Steps
1. Keep this contract stable while refactoring internals.
2. Keep `normalizeSpecDraft` and `prepareSpecAnalysis` boundaries explicit.
3. Separate generation/execution concerns from the current facade before moving intent derivation earlier.
4. Make validation operate on both intent IR and renderer output.
5. Allow future renderers to consume intent IR directly.
