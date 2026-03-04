# Session Handoff (Latest)

- Updated: 2026-03-04
- Repo: `C:\Users\dudcj\OneDrive\바탕 화면\바이브투스펙V2`
- Branch: `main`
- Scope: prompt hardening policy + manual loop UX stabilization

## Current Status

- Week 1: done
- Week 2: done
- Week 3: done
- Week 4: in progress
- Week 5: in progress

## Confirmed Baseline

1. Experienced guided loop v1 is connected.
2. Major manual loop console is connected.
3. `strict_format -> semantic_repair` fallback chain is connected.
4. Beginner quick-run prompt now uses the L3 `aiCoding` source path.

## What Changed In This Session

### 1. Shared core checklist introduced

- Added `shared/corePromptChecklist.js`.
- Defined one shared checklist for code-writing prompts:
  - input contract
  - role and permission boundaries
  - failure handling and fallback
  - output contract
  - acceptance criteria and verification

### 2. Prompt policy now force-injects the checklist

- `engine/graph/promptPolicy.js` now injects a dedicated `core_checklist` section for non-baseline policies.
- Prompt metadata now records:
  - `core_checklist_delivery`
  - `core_checklist_ids`
- Boundary is explicit:
  - `baseline`: no extra force-injected checklist section
  - non-baseline (`beginner_zero_shot`, `strict_format`, `semantic_repair`): checklist is force-injected

### 3. `buildMasterPrompt` now carries the same checklist

- `engine/graph/transmuteEngine.js` now adds a `[Core implementation checklist]` block to the AI coding prompt.
- The block reuses the shared checklist and appends:
  - must-feature coverage count
  - listed test-scenario verification count

### 4. Beginner prompt is warning-only, never auto-mutated

- `ui/app/components/beginner-prompt.js` no longer appends hidden requirements into the prompt text.
- It now returns the original prompt as-is and exposes missing checklist items as warning-only metadata.
- Added explicit meta:
  - `promptMutated: false`
- `deliveryMode: warning_only | none`
- MSDS-specific supplemental warning remains as a warning-only hint.

### 5. Copy-ready prompt was slimmed and localized

- The copy-ready AI coding prompt now keeps only core implementation sections.
- Duplicate sections such as standard request, impact summary, today-actions, and repeated trailing requirements are excluded from the copied prompt.
- The final checklist block is now shown in Korean as `[핵심 구현 체크리스트]`.

### 6. Major manual loop editing moved into L5

- The separate top-level `Manual Loop Console` panel was removed from major mode.
- Manual-loop question editing now happens directly inside the L5 action area.
- Users can review blocking issues, edit clarification answers, remove questions, clear the batch, and regenerate without moving between two panels.

### 7. Warning-to-manual-loop routing is now anchored to the clicked warning

- Sending a warning into manual loop now prioritizes the incoming warning-derived question ahead of older queued questions.
- `schema-*` warnings no longer fall back to unrelated generic questions when a direct schema question is missing.
- Schema warnings now generate a warning-specific clarification prompt using the clicked warning detail.

### 8. Manual-loop textarea spacing bug was fixed

- Clarification textareas no longer trim values on every render.
- Spacebar input now preserves normal word spacing while typing.

## Validation

- `cmd /c npm test` passed (`56` tests)
- `cmd /c npm run build` passed

## Remaining Boundaries

- Week 4 remains open because the manual loop is now structurally cleaner, but still needs real browser QA and UX polish.
- Week 5 remains open because fallback telemetry is landed, but broader prompt-policy rollout and tuning are still incomplete.
- The beginner UI still uses the returned warning metadata indirectly; if we want stronger visibility, the next pass can surface checklist delivery labels directly in the rendered UI.

## Recommended Next Session

1. Add visual emphasis for newly inserted manual-loop questions so users can immediately see what changed after clicking `수동 루프로 보내기`.
2. Decide whether `experienced` should keep `baseline` by default or move to a stricter policy mode behind a flag.
3. Continue Week 4 and Week 5 stabilization with real browser QA around manual loop flows.
