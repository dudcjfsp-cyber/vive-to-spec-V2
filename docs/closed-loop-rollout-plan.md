# Persona-Based Closed Loop Rollout Plan

- Updated: 2026-03-05
- Repo: `C:\Users\dudcj\OneDrive\바탕 화면\바이브투스펙V2`
- Status: In progress
- Goal: keep beginner mode one-shot and fast, while experienced and major modes use controlled validation, clarification, and repair loops.

## 0. Implementation Status

- Week 1: done
- Week 2: done
- Week 3: done
- Week 4: in progress
- Controller refactor: done
- Week 5: in progress
- Week 6+: pending

## 0.1 Latest Progress Snapshot

1. Week 1 to Week 3 are complete.
   - state model was extended
   - validation was extracted
   - experienced guided loop v1 is connected

2. Week 4 is in progress.
   - major manual loop is connected
   - L4 warning cards can hand off into manual loop actions
   - L5 staging questions can be reviewed and adopted
   - L4 to L1 focus handoff is connected
   - manual loop editing now happens directly inside L5 instead of a separate top panel
   - warning handoff now prioritizes the clicked warning and avoids unrelated schema fallbacks
   - manual-loop textarea spacing input is stable while typing

3. Week 5 is in progress.
   - `experienced` and `major` now use `strict_format -> semantic_repair` repair escalation
   - repair metadata is returned (`repair_mode`, `fallback_applied`, `validation_retry_count`, `semantic_issue_count`)
   - copy-ready AI coding prompt now keeps only core sections
   - final checklist block is localized as `[핵심 구현 체크리스트]`

4. Beginner prompt UX is aligned.
   - beginner quick-run prompt now uses the L3 `aiCoding` source path
   - missing items are shown as warnings instead of being silently appended into the prompt body

## 0.2 2026-03-04 Addendum

This session completed the prompt-hardening checklist pass that had been queued as the next major step.

1. Added a shared prompt checklist module: `shared/corePromptChecklist.js`
2. Defined one common code-writing checklist:
   - input contract
   - role and permission boundaries
   - failure handling and fallback
   - output contract
   - acceptance criteria and verification
3. Applied the checklist across three layers:
   - `engine/graph/promptPolicy.js`
   - `engine/graph/transmuteEngine.js` (`buildMasterPrompt`)
   - `ui/app/components/beginner-prompt.js`
4. Clarified the delivery boundary:
   - force-inject into engine prompt policy for non-baseline policies
   - force-inject into `buildMasterPrompt`
   - warning-only in beginner quick prompt analysis, with no prompt mutation
5. Validation passed:
   - `cmd /c npm test`
   - `cmd /c npm run build`

## 1. Rollout Principle

1. Beginner
   - keep one-shot generation as the default
   - avoid extra loop controls
   - show warnings and ready-to-run prompts, not hidden mutations

2. Experienced
   - allow one guided clarification turn when validation requires it
   - keep the first result visible before asking for more input

3. Major
   - allow manual loop control
   - keep validation output, suggested questions, and replay control visible

## 2. Current Code Anchors

### State

- `engine/state/specState.js`
- `ui/app/services/specStateShadow.js`

### Engine

- `engine/graph/transmuteEngine.js`
- `engine/graph/promptPolicy.js`
- `engine/validation/standardOutputValidation.js`
- `shared/corePromptChecklist.js`

### Controller

- `ui/app/hooks/useAppController.js`

### UI

- `ui/app/components/BeginnerWorkspace.jsx`
- `ui/app/components/beginner-prompt.js`
- `ui/app/components/ExperiencedWorkspace.jsx`
- `ui/app/components/MajorWorkspace.jsx`
- `ui/app/components/ResultPanel.jsx`

## 3. Delivery Boundary For The Core Checklist

This is the active contract after the current session.

1. Force-injected into engine prompts
   - layer: `engine/graph/promptPolicy.js`
   - applies to: `beginner_zero_shot`, `strict_format`, `semantic_repair`
   - behavior: adds a dedicated `core_checklist` prompt section

2. Force-injected into AI coding handoff prompt
   - layer: `engine/graph/transmuteEngine.js`
   - applies to: `buildMasterPrompt`
   - behavior: adds `[핵심 구현 체크리스트]` to the prompt used by downstream coding tools

3. Warning-only in beginner quick prompt
   - layer: `ui/app/components/beginner-prompt.js`
   - applies to: beginner quick prompt risk analysis
   - behavior: never mutates the prompt body; only returns warning metadata

## 4. Week-by-Week Plan

### Week 1. State Model and Persona Capabilities

- Status: done
- Outcome: persona loop state and tracking fields are in place

### Week 2. Validation Layer Extraction

- Status: done
- Outcome: validation report is separated from prompt generation

### Week 3. Experienced Closed Loop v1

- Status: done
- Outcome: one guided clarification turn is connected for experienced mode

### Week 4. Major Closed Loop v2

- Status: in progress
- Done:
  - manual loop console is connected
  - L4 and L5 loop handoff is connected
  - L1 focus handoff is connected
  - manual loop editing is colocated inside L5
  - clicked warnings now map to warning-priority manual-loop questions
  - manual-loop textarea input no longer trims spaces while typing
- Remaining:
  - broader manual QA across real interaction paths
  - possible UI tightening around manual-loop state visibility

### Week 5. Prompt Fallback and Semantic Repair

- Status: in progress
- Done:
  - `strict_format` fallback
  - `semantic_repair` fallback
  - repair metadata
  - shared prompt hardening checklist
  - copy-ready prompt trimmed to core implementation sections only
  - copy-ready checklist block localized in Korean
- Remaining:
  - evaluate whether experienced mode should default to a stricter policy
  - expose checklist delivery and policy state more directly in UI
  - collect more real prompts for tuning and false-positive reduction

### Week 6. Metrics, Tests, and Stabilization

- Status: pending
- Planned:
  - add stronger loop outcome metrics
  - keep persona-specific behavior locked with tests
  - expand manual QA coverage

## 5. Current Validation Baseline

- Automated tests: `56` passing
- Build: passing
- Manual browser QA: still required, not yet automated

## 6. Recommended Next Session

1. Continue Week 4 stabilization by testing real manual-loop flows end to end, especially repeated warning handoff and question replacement.
2. Continue Week 5 by deciding if stricter prompt policy should expand beyond beginner mode.
3. Add clearer visual emphasis when a new question is inserted into the manual loop after clicking `수동 루프로 보내기`.

## 7. L1~L5 UX Improvement Backlog (Draft)

This backlog focuses on reducing L4 re-check friction in `experienced` and `major` sessions.

### 7.1 Low Cost (1~2 days)

1. Add a persistent return CTA after L4 handoff
   - Scope: when L4 sends users to L1/L2/L5, keep a sticky banner with:
     - active warning id/title
     - unresolved warning count
     - one-click `L4로 돌아가 재검사`
   - Expected effect: reduce "where should I go back?" confusion
   - Done when: users can return to L4 in one click from any layer tab

2. Keep diagnostics context when panel is collapsed (experienced)
   - Scope: closing/opening diagnostics should preserve:
     - last active layer
     - selected warning context
     - current unresolved warning summary
   - Expected effect: prevent accidental context reset while doing compact-first flow
   - Done when: reopening diagnostics restores the same Lx state users left

3. Add "re-check now" shortcut in L1/L2/L5
   - Scope: show compact badge/button if the current route originated from L4 warning action
   - Expected effect: faster loop closure without manual tab search
   - Done when: L4-origin edits always expose a visible re-check action

### 7.2 Medium Cost (about 1 week)

1. Introduce warning-task tracking model
   - Scope: track warning lifecycle as `queued -> in_progress -> rechecked -> resolved`
   - UI: surface "currently fixing" warnings separately from full warning list
   - Expected effect: users focus on active issues instead of re-reading full L4 cards
   - Done when: each handoff warning keeps state across L1/L2/L5 and returns to L4

2. Conditional post-regenerate landing policy
   - Scope: if regeneration was triggered by L4/manual-loop correction, land back on L4 by default
   - Expected effect: immediate integrity verification after repair
   - Done when: default post-regenerate layer is context-aware (`L1` vs `L4`)

3. Expand L4 inline actions before cross-layer jumps
   - Scope: increase actions that can be completed in L4 directly (intent align, permission guard, sync hints)
   - Expected effect: reduce avoidable tab switches
   - Done when: top warning resolution can be completed in L4 for common cases

### 7.3 Measurement Baseline (for A/B or before-after)

- `l4_return_clicks_per_issue`: average return clicks needed per warning resolution
- `time_to_first_recheck_ms`: time from first L4 handoff to first L4 re-check
- `warnings_resolved_per_cycle`: number of warnings resolved per one correction cycle
- `diag_reopen_context_loss_rate`: percentage of reopen events that lose prior Lx context

### 7.4 Proposed Order

1. Low-cost item 1 (persistent return CTA)
2. Low-cost item 2 (diagnostics context preserve)
3. Low-cost item 3 (re-check shortcut)
4. Medium-cost item 2 (context-aware landing)
5. Medium-cost item 1 (warning-task tracking)
6. Medium-cost item 3 (L4 inline action expansion)
