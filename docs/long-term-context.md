# Long-Term Context

## Why This Document Exists
This document captures the stable long-term intent behind the project so new AI threads do not need the same background explanation every time.

Use this as the default product context for planning, implementation, review, and refactoring decisions.

## Project Identity
`Vibe-to-Spec V2` is an education-first product for:
- non-developers
- non-CS learners
- vibe coders
- AI beginners

The product is not meant to reward "just type anything and let the model do everything" habits.
It should still provide fast success, but it should also teach users how structured requests are formed and why they work.

The creator is also part of the target audience:
- non-CS background
- non-developer background
- practical vibe-coding experience

That means the product should not assume expert mental models by default.
It should teach, guide, and reveal structure without overwhelming the user.

## Product Philosophy
The educational goal is not to block convenience.
It is to prevent black-box dependence.

So the product should aim for this balance:
- let beginners get a working result quickly
- show the structure behind that result
- help the user improve one thinking slot at a time
- avoid teaching that vague prompting is always enough

A good outcome is:
- fast first success
- visible structure
- small guided improvement
- repeated learning through use

A good advanced-mode outcome is also:
- shared diagnostics can be reused across modes when the framing stays work-style-specific
- high-density panels should appear only when the result is actually ready
- when a shared panel fails, the UI should degrade to a safe status card rather than a blank screen

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
- being the best education-first spec-oriented renderer built on top of the evolving engine

That means the current project should optimize for:
- clearer intent capture
- better ambiguity detection
- stronger clarification flow
- more reliable spec normalization
- better validation of missing or weak fields
- better educational feedback for non-technical users
- UI that teaches structure while preserving fast early momentum

It should not over-expand into too many output modes yet.

## What To Prioritize Right Now
### 1. Preserve the education-first beginner path
Beginner should keep fast success, but avoid becoming a black-box prompt vending flow.

Prioritize:
- one-sentence start
- visible prompt structure
- one-line guided improvement
- positive reinforcement for what the user already did well
- soft learning hints instead of intimidating diagnostics

### 2. Make persona differences reflect working style
Persona separation should not depend on prestige labels or assumed academic identity.

Prefer:
- beginner = fast success plus structure learning
- quick execution mode = get to action quickly, inspect only top warnings first
- review control mode = inspect blocking issues, contract, and impact before finalizing

### 3. Make intent analysis more explicit
Intent logic should become a first-class engine concern, not just a side effect of prompt generation or UI warnings.

Prioritize:
- intent-related fields
- confidence signals
- ambiguity markers
- missing-information reasons
- structured clarification triggers

### 4. Separate engine logic from renderer logic
Anything specific to spec output should be easy to move into a renderer later.

Prioritize:
- separating analysis from final markdown or spec artifacts
- keeping normalization and planning distinct from presentation
- reducing giant all-in-one engine flows

### 5. Separate generation/execution from interpretation
Provider calls, JSON repair, retry strategy, and semantic issue detection should not stay entangled with one renderer's normalization path.

Prioritize:
- reusable structured-generation stages
- provider-neutral retry orchestration
- validation-oriented semantic issue detection
- execution metadata that future renderers can share

### 6. Strengthen validation beyond field presence
Validation should not only ask "is a field missing?"
It should also ask:
- does the output match the original intent?
- what was inferred vs explicitly stated?
- what must be clarified before safe execution?
- what should a beginner learn from this result?

### 7. Keep the engine reusable
When making design decisions, prefer structures that can later power:
- spec output
- prompt output
- architecture output
without rewriting the analysis core.

## What Not To Over-Optimize Yet
These are useful, but should not outrank engine separation and product clarity.

Do not over-focus on:
- polishing too many output formats inside this repo right now
- product-specific UI complexity that deepens coupling
- renderer-specific hacks inside the engine core
- persona logic that becomes inseparable from core analysis
- automatic model failover behavior that hides provider/account constraints from the user

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
6. Does this help users understand structure, or does it hide the real constraint behind more automation?

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
- the UI should teach structure, not just produce outputs that happen to run
- shared advanced panels are acceptable, but they should fail safe and never disappear into a blank screen

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
  - spec-oriented result sections for the app
- `engine/graph/transmuteEngine.js` is still the product-facing facade.
- further engine work should be reopened only if product validation reveals a concrete blocker.
