import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./buildAdvancedResultViewModel.js', import.meta.url), 'utf8');

test('buildAdvancedResultViewModel defines a stable UI-facing contract for advanced results', () => {
  assert.match(source, /session:/);
  assert.match(source, /guide:/);
  assert.match(source, /artifacts:/);
  assert.match(source, /workspaceSeed:/);
  assert.match(source, /delivery:/);
  assert.match(source, /integritySource:/);
  assert.match(source, /diagnostics:/);
  assert.match(source, /promptPolicy:/);
  assert.match(source, /validation:/);
  assert.match(source, /manualLoop:/);
  assert.match(source, /display:/);
  assert.match(source, /actions:/);
  assert.match(source, /const problemFrame = buildProblemFrame\(safeStandardOutput\);/);
  assert.match(source, /const logicMap = buildLogicMap\(safeStandardOutput, problemFrame\);/);
  assert.match(source, /hypothesis: problemFrame,/);
  assert.match(source, /logicMap,/);
  assert.match(source, /onRefreshHybrid: toAction\(safeActions\.handleRefreshHybrid\)/);
  assert.match(source, /todayActions: toStringArray\(safeStandardOutput\.오늘_할_일_3개\)/);
  assert.match(source, /permissionRules: toObjectArray\(safeStandardOutput\.권한_규칙\)/);
  assert.match(source, /schemaWarnings: toStringArray\(safeCompleteness\.누락_경고\)/);
  assert.match(source, /blockingIssueCount: toPositiveNumber\(safeValidationReport\.blocking_issue_count, blockingIssues\.length\)/);
});
