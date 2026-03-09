# Long-Term Context

## Why This Document Exists
This document captures the long-term intent behind the project so new AI threads do not need the same background explanation every time.

Use this as the stable product context for planning, implementation, review, and refactoring decisions.

## Project Identity
`Vibe-to-Spec V2` is an education-first product for non-developers, non-CS learners, and AI beginners.

The project helps users move from:
- natural language input
- to intent understanding
- to structured, implementation-ready output

The creator is also part of the target audience:
- non-CS background
- non-developer background
- practical vibe-coding experience

That means the product should not assume expert mental models by default. It should teach, guide, and reveal structure without overwhelming the user.

## Long-Term Product Roadmap
This repository is one step in a larger product family.

Planned sequence:
1. `Vibe-to-Spec`
- Convert vague natural language into structured specs.
- Focus on spec-quality output.

2. `Vibe-to-Prompt`
- Reuse the same core engine.
- Apply prompt engineering and context engineering techniques.
- Output prompt-ready artifacts tuned to user intent.

3. `Vibe-to-Architecture`
- Reuse the same core engine.
- Output architecture-oriented artifacts such as system boundaries, components, and technical structure.

4. `Vibe Studio`
- A unified platform built on one core engine.
- One input, multiple output modes.
- Spec, prompt, architecture, and other renderers should all be generated from the same underlying understanding of user intent.

## Strategic Principle
`Vibe-to-Spec` is a product.
The real long-term asset is the engine.

So the current project should not become a one-off spec generator with tightly coupled UI and output logic.
It should become the first production-grade app built on top of a reusable intent engine.

## What The Engine Must Eventually Become
The engine should grow into a reusable pipeline that can support multiple output products.

Target shape:
1. Input normalization
- user vibe
- persona or learning mode
- project profile
- clarification answers
- session context

2. Structured generation
- renderer-appropriate prompt construction
- provider execution
- schema-safe JSON generation
- repair/retry handling
- execution metadata capture

3. Intent analysis
- identify who the user is building for
- identify what job needs to be done
- identify constraints, risks, assumptions, and ambiguities
- estimate confidence
- decide whether clarification is required

4. Planning layer
- translate analyzed intent into a structured plan for output generation
- keep this layer renderer-neutral when possible

5. Renderer layer
- spec renderer
- prompt renderer
- architecture renderer
- future education or lesson renderer

6. Validation and feedback
- schema safety
- intent alignment
- completeness
- confidence and ambiguity reporting
- educational feedback for beginners

## Important Architectural Rule
Do not treat `standard_output` as the true core of the engine.

`standard_output` is the output of the spec renderer.
The true reusable core should be an intent-centered intermediate representation.

In other words:
- bad long-term shape: `natural language -> final spec`
- better long-term shape: `natural language -> intent IR -> renderer output`

## Current Mission Of Vibe-to-Spec V2
At this stage, `Vibe-to-Spec V2` should focus on one thing:
- being the best spec-oriented renderer built on top of the evolving engine

That means the current project should optimize for:
- clearer intent capture
- better ambiguity detection
- stronger clarification flow
- more reliable spec normalization
- better validation of missing or weak fields
- more educational feedback for non-technical users

It should not over-expand into too many output modes yet.

## What To Prioritize Right Now
### 1. Make intent analysis more explicit
Intent logic should become a first-class engine concern, not just a side effect of prompt generation or UI warnings.

Prioritize:
- intent-related fields
- confidence signals
- ambiguity markers
- missing-information reasons
- structured clarification triggers

### 2. Separate engine logic from renderer logic
Anything that is specific to spec output should be easy to move into a renderer later.

Prioritize:
- separating analysis from final markdown or spec artifacts
- keeping normalization and planning distinct from presentation
- reducing giant all-in-one engine flows

### 3. Separate generation/execution from interpretation
Provider calls, JSON repair, retry strategy, and semantic issue detection should not stay entangled with one renderer's normalization path.

Prioritize:
- reusable structured-generation stages
- provider-neutral retry orchestration
- validation-oriented semantic issue detection
- execution metadata that future renderers can share

### 4. Strengthen validation beyond field presence
Validation should not only ask "is a field missing?"
It should also ask:
- does the output match the original intent?
- what was inferred vs explicitly stated?
- what must be clarified before safe execution?
- what should a beginner learn from this result?

### 5. Preserve educational usability
This product is not only a converter. It is also a learning aid.

Prioritize:
- beginner-safe wording
- step visibility
- explanation of uncertainty
- visible reasons for clarification
- outputs that teach users how structured thinking works

### 6. Keep the engine reusable
When making design decisions, prefer structures that can later power:
- spec output
- prompt output
- architecture output
without rewriting the analysis core.

## What Not To Over-Optimize Yet
These are useful, but should not outrank engine separation.

Do not over-focus on:
- polishing too many output formats inside this repo right now
- product-specific UI complexity that deepens coupling
- renderer-specific hacks inside the engine core
- persona logic that becomes inseparable from core analysis

## Quality Bar For Engine Work
A change is good if it improves at least one of these without harming reusability:
- intent understanding
- ambiguity handling
- clarification quality
- validation quality
- renderer separation
- generation/execution separation
- beginner-friendly educational value

A change is risky if it:
- hardcodes spec-only assumptions into the core
- mixes UI concerns into engine logic
- mixes renderer formatting into analysis logic
- makes future prompt or architecture outputs harder to add

## Decision Filter For Future Work
When evaluating any feature, refactor, or experiment, ask:
1. Does this improve the reusable engine, or only the current spec app?
2. If this logic were needed by `Vibe-to-Prompt`, could it be reused cleanly?
3. If this logic were needed by `Vibe-to-Architecture`, would the current design block that?
4. Is this generation logic, analysis logic, planning logic, validation logic, or renderer logic?
5. Are we making the product more educational for beginners, or only more complex?

## Suggested Mental Model For This Repo
Think of the repository like this:
- current visible product: `Vibe-to-Spec`
- hidden long-term platform seed: reusable intent engine

So short-term product work is valid, but should leave the engine cleaner than before.

## Guidance For Future AI Threads
When working in this repository, assume the following:
- the project is education-first
- the target user is non-technical or early-stage AI learner
- `Vibe-to-Spec` is only the first renderer/product
- engine quality matters more than short-term hacks
- maintainability and future renderer reuse are core requirements

If a proposed change solves a local problem but makes reuse harder for `Vibe-to-Prompt`, `Vibe-to-Architecture`, or `Vibe Studio`, prefer a more modular design.

## Current Refactor Snapshot
As of the latest refactor thread, the smallest safe generation/execution extraction for the current lane is complete, and the default recommendation is to pause structural refactoring and validate the product.

What is already true:
- `engine/pipeline/buildSpecTransmuteResult.js` exists as a reusable result-building step.
- `engine/pipeline/runSpecTransmutePipeline.js` exists as a reusable orchestration step.
- `engine/renderers/spec/specRenderer.js` owns spec-specific result section generation.
- the spec renderer currently owns:
  - `artifacts.dev_spec_md`
  - `artifacts.nondev_spec_md`
  - `artifacts.master_prompt`
  - `layers.L1_thinking`
  - `glossary`
- `engine/graph/transmuteEngine.js` remains the public facade and keeps the current app contract stable.
- `engine/intent/normalizeSpecDraft.js` owns raw provider JSON -> spec draft normalization.
- `engine/intent/prepareSpecAnalysis.js` owns normalized-spec-afterward analysis preparation.
- `normalizeStandardOutput` is a thin composition boundary for:
  - `normalizeSpecDraft`
  - `prepareSpecAnalysis`
  - validation
- `engine/validation/semanticRepairIssues.js` owns semantic repair issue collection.
- `engine/execution/executeStructuredGeneration.js` owns reusable structured-generation retry orchestration around:
  - prompt attempt execution
  - semantic handoff consumption
  - `strict_format` retry
  - `semantic_repair` retry
- `executePromptRepairChain` in `engine/graph/transmuteEngine.js` is now a thin wrapper around that execution-stage helper.

What still remains inside the facade:
- prompt construction and prompt-policy wiring
- JSON parse + one-retry repair for a single prompt attempt
- provider/model selection
- provider transport and remote execution
- public facade wiring into `runSpecTransmutePipeline`

What should not be forced next by default:
- another structural engine extraction just for neatness
- provider transport redesign without a product-facing reason
- moving intent IR earlier before product validation shows that it is necessary
- mixing renderer redesign with engine execution cleanup

## Product Validation Pressure Points
The next meaningful risk is no longer "can the engine be split one more time?"
It is "does the current product actually deliver the right learning experience and persona fit?"

Current product-validation concerns already observed in the repo:
- beginner, experienced, and major personas do not yet differ enough at the actual generation-policy level
- beginner quick-prompt delivery is still too close to advanced AI-coding output
- some UI/runtime flags and result-panel leftovers still look like dead configuration rather than intentional product surface
- some controls promise more than the visible UI actually explains, especially around reasoning/thinking exposure

These are now better next investments than deeper engine cleanup.

## Safe Handoff Guidance
Keep renderer separation, analysis separation, generation/execution separation, and product-validation work as distinct tracks unless the change is extremely small and mechanical.

Recommended rule:
- if the thread is about renderer separation, stay inside `engine/renderers/spec/*`, `engine/pipeline/*`, and minimal facade wiring in `engine/graph/transmuteEngine.js`
- if the thread is about analysis separation, focus on `engine/intent/*`, `engine/contracts/*`, `engine/pipeline/*`, and the normalization / interpretation boundary
- if the thread is about generation/execution separation, focus on `engine/graph/transmuteEngine.js`, `engine/pipeline/*`, `engine/validation/*`, and `engine/execution/*`
- if the thread is about product validation, allow `ui/*` plus minimal engine touch only when a concrete persona/output problem requires it
- avoid mixing a large renderer refactor, a large analysis refactor, and a large product-surface cleanup in one thread

At the current point, starting a fresh thread is the safer default before product/persona validation work, because the engine-refactor lane and the next product-validation lane have different goals and success criteria.

## Short Context Prompt For New Threads
Use this when starting a new AI thread:

```text
Before making changes, use this project context:
- This repository is Vibe-to-Spec V2, an education-first tool for non-developers, non-CS learners, and AI beginners.
- The long-term goal is not only a spec generator, but a reusable intent engine that will later power Vibe-to-Prompt, Vibe-to-Architecture, and finally Vibe Studio.
- So please prefer engine-first, reusable, modular designs.
- Treat spec output as one renderer/product, not as the permanent shape of the core engine.
- Favor changes that improve intent analysis, ambiguity detection, clarification flow, validation quality, generation/execution separation, renderer separation, and beginner-friendly learning value.
- Avoid designs that hardcode spec-only assumptions deep into the engine.
- Current status: `engine/renderers/spec/specRenderer.js` owns spec artifact/compatibility generation, `engine/pipeline/buildSpecTransmuteResult.js` and `engine/pipeline/runSpecTransmutePipeline.js` keep the result envelope stable, `engine/intent/normalizeSpecDraft.js` owns raw provider JSON -> spec draft normalization, `engine/intent/prepareSpecAnalysis.js` owns normalized-spec-afterward analysis preparation, `engine/validation/semanticRepairIssues.js` owns semantic issue collection, and `engine/execution/executeStructuredGeneration.js` owns reusable structured-generation retry orchestration.
- Current caution: do not break the existing UI/server/adapter contract or the current result shape.
- Current recommendation: pause structural engine refactoring unless a product-validation thread finds a concrete blocker.

For this task, focus on the current repo stage while preserving future reuse.
```

## Expanded Context Prompt For Planning Threads
Use this when asking for architecture advice or refactoring strategy:

```text
Use this long-term context for your reasoning:
- Vibe-to-Spec V2 is the first product in a larger family.
- The future family includes Vibe-to-Prompt, Vibe-to-Architecture, and a unified Vibe Studio.
- The real long-term asset is a reusable intent analysis engine, not only the current spec output.
- Therefore, generation, analysis, planning, validation, and rendering should become more separable over time.
- The target audience is educational: non-developers, non-CS learners, and AI beginners, including the creator.
- Recommendations should optimize for modularity, explainability, educational clarity, and long-term extensibility.
- Current status: pipeline extraction exists, spec renderer extraction exists, raw-to-spec draft normalization now lives in `engine/intent/normalizeSpecDraft.js`, post-normalization analysis preparation now lives in `engine/intent/prepareSpecAnalysis.js`, semantic repair issue collection lives in `engine/validation/semanticRepairIssues.js`, and structured-generation retry orchestration lives in `engine/execution/executeStructuredGeneration.js`.
- The current default is to validate persona fit, educational UX, and product output quality before attempting deeper engine cleanup again.

Please evaluate the current change or architecture with that lens.
```
