import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./AdvancedResultPane.jsx', import.meta.url), 'utf8');

test('AdvancedResultPane owns success gating and the shared ResultPanel fail-safe wrapper', () => {
  assert.match(source, /const status = resultViewModel\?\.session\?\.status;/);
  assert.match(source, /if \(status !== 'success'\)/);
  assert.match(source, /<WorkspaceStatusCard \{\.\.\.statusCard\} \/>/);
  assert.match(source, /<ResultPanelBoundary resetKey=\{buildResultPanelResetKey\(resultViewModel\)\}>/);
  assert.match(source, /<ResultPanel viewModel=\{resultViewModel\} \/>/);
});
