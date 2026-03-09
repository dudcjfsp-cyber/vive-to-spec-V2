# Refactor Stop Checklist

## Why This Document Exists
This document exists to prevent the project from getting stuck in endless internal refactoring.

There is no perfect codebase.
The goal is not to keep splitting modules forever.
The goal is to separate the engine enough that future renderers can be added safely, then move forward into validation through real product or renderer work.

## Core Rule
Keep refactoring while it removes a real future-engine constraint.
Stop refactoring when it mostly improves local neatness without improving renderer reuse, validation quality, or engine extensibility.

## Good Reasons To Continue Refactoring
Continue if the next extraction clearly improves one or more of these:
- future renderer reuse
- generation/execution reuse
- analysis boundary clarity
- validation boundary clarity
- testability of a real engine handoff
- reduction of spec-only assumptions inside shared engine paths

## Warning Signs Of Refactor Looping
The thread may be looping if:
- files are getting smaller, but module boundaries are not becoming more meaningful
- new helpers are created but still only mirror the old facade shape without reducing coupling
- the next step is explained as "cleaner" rather than "more reusable"
- future renderer onboarding would still require touching the same number of engine areas
- tests only duplicate behavior checks without proving a clearer stage boundary
- the team cannot explain why the current extraction matters for `Vibe-to-Prompt` or `Vibe-to-Architecture`

## Stop Conditions
Lower refactor priority and move to renderer or product validation work when at least 3 of these are true:
- a future renderer would mainly need to change `prompt builder`, `draft normalizer`, and `renderer`
- structured generation, retry, and semantic issue detection are reusable without spec-only normalization code
- `engine/graph/transmuteEngine.js` is mostly a public facade and thin wiring layer
- the next refactor candidate improves aesthetics more than engine extensibility
- the current boundaries are already covered by focused tests
- real product work is no longer blocked by the current engine structure

## Per-Thread Entry Checklist
Before starting a refactor thread, confirm:
1. Does this step remove a real blocker for future renderers?
2. Can this thread stay focused on one boundary only?
3. Can the boundary be described as a stage handoff, not just a helper extraction?
4. Can the current public result shape stay unchanged?
5. Can we prove the boundary with focused tests?

## Per-Thread Exit Checklist
At the end of a refactor thread, confirm:
1. Can the extracted responsibility be described in one sentence?
2. Is the data handoff clearer than before?
3. Would a future renderer reuse this boundary?
4. Is less responsibility left inside `transmuteEngine.js`?
5. Did behavior stay stable?
6. Is the next step still structural, or are we now entering diminishing returns?

## Recommended Pace From The Current State
From the current engine state, the remaining refactor work should probably be limited to:
1. extracting `collectSemanticRepairIssues`
2. possibly extracting a clearer structured-generation / repair-chain boundary

After that, pause and re-evaluate before continuing deeper engine cleanup.

The preferred next validation step should be one of:
- a small second-renderer experiment
- a real product-facing feature
- intent-aware validation improvements

## Practical Decision Rule
If the next refactor does not make a future renderer easier to add, safer to test, or less coupled to spec-only logic, it is probably not the best next investment.
