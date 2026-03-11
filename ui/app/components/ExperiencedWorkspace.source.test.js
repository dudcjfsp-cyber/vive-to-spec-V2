import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./ExperiencedWorkspace.jsx', import.meta.url), 'utf8');

test('ExperiencedWorkspace uses plain-language summary labels in quick mode', () => {
  assert.match(source, /현재 모델: \{state\.activeModel\}/);
  assert.match(source, /구현 가이드: \{guideStatusLabel\}/);
  assert.match(source, /완성도: \{completionScore\}/);
  assert.match(source, /검토 상태: \{getValidationSeverityLabel\(validationSeverity\)\}/);
  assert.doesNotMatch(source, /model: \{state\.activeModel\}/);
  assert.doesNotMatch(source, /hybrid: \{state\.hybridStackGuideStatus\}/);
  assert.doesNotMatch(source, /validation: \{validationSeverity\}/);
});

test('ExperiencedWorkspace frames quick mode as a work style instead of a progression step', () => {
  assert.match(source, /이 모드는 입문자와 다르게, 구조 설명보다 실행 순서와 핵심 경고를 먼저 확인하는 작업 방식입니다\./);
  assert.doesNotMatch(source, /구조가 잡혔다면/);
});

test('ExperiencedWorkspace delegates advanced result input shaping to the shared view-model builder', () => {
  assert.match(source, /<AdvancedResultPane/);
  assert.match(source, /세부 진단은 결과 생성 후 열립니다/);
  assert.match(source, /resultViewModel=\{buildAdvancedResultViewModel\(/);
  assert.match(source, /personaCapabilities: diagnosticsCapabilities/);
});

test('ExperiencedWorkspace builds a quick-mode summary model before entering the hook', () => {
  assert.match(source, /const summaryModel = useMemo\(/);
  assert.match(source, /buildExperiencedSummaryModel\(\{ state, derived \}\)/);
  assert.match(source, /summaryModel,/);
  assert.doesNotMatch(source, /derived\.validationReport\?\./);
  assert.doesNotMatch(source, /derived\.clarifyLoop\?\./);
});