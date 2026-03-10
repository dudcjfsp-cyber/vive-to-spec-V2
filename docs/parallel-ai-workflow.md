# Parallel AI Workflow

This document describes a low-conflict way to run multiple AI coding tasks in parallel in this repository.

## Goal
Reduce merge conflicts and hidden logic collisions by splitting work around repository boundaries instead of broad feature themes.

## Core Rule
Use one `integrator` AI for hub files and multiple `leaf workers` for isolated modules.

Why this works in this repo:
- `ui/app/App.jsx` is the main UI assembly point.
- `ui/app/hooks/useAppController.js` is the app orchestration hub.
- `adapters/LLMAdapter.js` is the runtime boundary between UI and engine/server.
- `server/managedApiServer.js` is the managed API entrypoint.
- `engine/graph/transmuteEngine.js` is the core generation engine.

If multiple AIs edit those files at the same time, conflicts are likely even when Git merges cleanly.

## Ownership Model
### Integrator AI
The integrator owns these files:
- `ui/app/App.jsx`
- `ui/app/hooks/useAppController.js`
- `adapters/LLMAdapter.js`
- `server/managedApiServer.js`
- `engine/graph/transmuteEngine.js`

The integrator is the only worker that should:
- change cross-layer contracts
- wire new UI state into app flow
- add new API routes
- connect engine output to UI
- resolve final merge decisions

### Leaf Workers
Leaf workers should stay inside one narrow area each.

Safe lanes in this repo:
- `ui/app/components/*`
- `ui/app/services/*`
- `ui/app/persona/*`
- `engine/validation/*`
- `engine/graph/promptPolicy.js`
- `packs/*`
- `shared/*`
- `docs/*`
- test files next to those modules

## Best Split Strategy
Prefer boundary-based splits like these:

1. UI presentation lane
- Scope: `ui/app/components/*`
- Good for: layout changes, copy updates, result panels, persona-specific presentation tweaks
- Avoid: controller state changes

2. UI service lane
- Scope: `ui/app/services/*`
- Good for: session storage, clarify flow, shadow state helpers
- Avoid: modifying `useAppController.js` directly

3. Engine validation lane
- Scope: `engine/validation/*`, `engine/graph/promptPolicy.js`
- Good for: schema hardening, validation warnings, prompt policy rules
- Avoid: large changes inside `transmuteEngine.js`

4. Data and content lane
- Scope: `packs/*`, `shared/*`, `docs/*`
- Good for: question packs, prompt checklist content, rollout docs
- Avoid: runtime wiring

5. Managed API lane
- Scope: route-specific work around `server`
- Good for: request validation, response shaping, error handling
- Avoid: editing both server route flow and engine core in the same worker

## Splits To Avoid
These look reasonable but usually create collisions:

- "Beginner UX"
Because it often touches components, persona config, and `useAppController.js`.

- "LLM improvements"
Because it tends to span `adapters`, `server`, and `engine`.

- "Persona improvements"
Because persona changes often ripple into UI assembly and controller logic.

- "Add feature X end-to-end" in one broad worker prompt
Because the AI will grab any file it needs, including hub files.

## Required Handoff Format
Each leaf worker should return:
- changed files
- what contract it assumed
- what it intentionally did not edit
- integration notes for the integrator

Recommended handoff block:

```md
Summary:
- Updated ...

Changed files:
- path/a
- path/b

Contract assumed:
- `derived.validationReport` remains shape-compatible
- no new controller actions required

Not edited:
- `ui/app/hooks/useAppController.js`
- `ui/app/App.jsx`

Integrator notes:
- If you want this surfaced in UI, add prop `...` to ...
```

## Commanding Pattern
When you ask an AI worker to do parallel work, always specify:
- exact scope
- forbidden files
- expected output
- whether it may change tests
- whether it should stop and hand off if hub-file changes are needed

Good command template:

```text
Work only in these paths:
- <allowed path 1>
- <allowed path 2>

Do not edit:
- <hub file 1>
- <hub file 2>

Task:
- <concrete task>

Expected output:
- implement the change
- update or add nearby tests if needed
- if integration is required outside the allowed paths, do not edit those files
- instead, leave a short integrator note describing the required follow-up
```

## Copy-Paste Prompts
### 1. Leaf worker prompt

```text
이 레포에서 병렬 작업 중입니다.

작업 범위:
- ui/app/components/result-panel

수정 금지:
- ui/app/App.jsx
- ui/app/hooks/useAppController.js
- adapters/LLMAdapter.js
- server/managedApiServer.js
- engine/graph/transmuteEngine.js

작업:
- result panel UI 카피와 경고 표시를 개선해줘
- 현재 props 계약 안에서만 해결해줘
- 필요한 테스트가 있으면 가까운 테스트 파일만 수정해줘

출력 규칙:
- 허용된 경로 밖 수정이 필요하면 직접 건드리지 말고 integrator note만 남겨줘
- 변경 파일, 가정한 계약, 후속 통합 포인트를 마지막에 짧게 정리해줘
```

### 2. Integrator prompt

```text
다른 워커들의 변경을 통합하는 역할만 해줘.

수정 가능:
- ui/app/App.jsx
- ui/app/hooks/useAppController.js
- adapters/LLMAdapter.js
- server/managedApiServer.js
- engine/graph/transmuteEngine.js

작업:
- leaf worker handoff를 읽고 필요한 연결만 최소 수정으로 반영해줘
- 계약 충돌이 있으면 가장 작은 변경으로 정리해줘
- 이미 leaf worker가 수정한 리프 모듈은 가능하면 다시 건드리지 말아줘

출력:
- 어떤 handoff를 반영했는지
- 남은 충돌 위험이 있는지
- 추가로 필요한 테스트가 있는지
```

### 3. Test-only worker prompt

```text
이 작업은 테스트 전용입니다.

허용 경로:
- ui/app/**/*.test.js
- engine/**/*.test.js

수정 금지:
- production code

작업:
- 최근 변경된 모듈을 기준으로 회귀 테스트만 보강해줘
- 구현 수정이 필요하면 코드를 직접 바꾸지 말고 failing point와 수정 제안을 남겨줘
```

## Recommended Workflow
1. First, define the contract.
- Example: new derived field, new action name, or new API response shape

2. Run leaf workers in parallel.
- Keep each worker inside one lane

3. Collect handoff notes.
- Especially any requested hub-file integration

4. Run the integrator.
- One AI only

5. Run test and verification pass.
- Prefer a separate testing worker or one final review pass

## Practical Rules For You
When you give commands, use these habits:
- say "work only in these paths"
- say "do not edit these hub files"
- say "if scope expands, stop and leave an integrator note"
- ask for "changed files + assumptions + handoff"

Avoid commands like:
- "전체적으로 정리해줘"
- "입문자 UX 전반을 개선해줘"
- "필요한 데 다 고쳐줘"

Those prompts invite broad edits and defeat safe parallelism.

## Recommended Team Setup
If you are running multiple Codex threads or branches:
- 1 integrator thread
- 2 to 4 leaf worker threads
- optionally 1 test-only thread

A good starting split for this repo:
- Worker A: `ui/app/components/*`
- Worker B: `ui/app/services/*`
- Worker C: `engine/validation/*` and `engine/graph/promptPolicy.js`
- Worker D: `packs/*`, `shared/*`, `docs/*`
- Integrator: hub files only

## Short Version
In this repository, parallel AI work is safest when:
- one AI owns orchestration
- other AIs stay inside leaf modules
- commands explicitly define allowed paths and forbidden hub files
- integration happens only after leaf work is done
