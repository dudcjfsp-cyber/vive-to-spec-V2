import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./buildAdvancedResultViewModel.js', import.meta.url), 'utf8');

test('buildAdvancedResultViewModel defines a stable UI-facing contract for advanced results', () => {
  assert.match(source, /session:/);
  assert.match(source, /guide:/);
  assert.match(source, /artifacts:/);
  assert.match(source, /diagnostics:/);
  assert.match(source, /display:/);
  assert.match(source, /actions:/);
  assert.match(source, /onRefreshHybrid: toAction\(safeActions\.handleRefreshHybrid\)/);
  assert.match(source, /onSelectImplementationStack: toAction\(onSelectImplementationStack\)/);
});
