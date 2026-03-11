import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./useResultPanelDerived.js', import.meta.url), 'utf8');

test('useResultPanelDerived consumes normalized prompt, validation, manual-loop, delivery, and integrity input', () => {
  assert.match(source, /promptPolicy,/);
  assert.match(source, /validation,/);
  assert.match(source, /manualLoop,/);
  assert.match(source, /delivery,/);
  assert.match(source, /integritySource,/);
  assert.match(source, /const safePromptPolicy = isObject\(promptPolicy\) \? promptPolicy : \{\};/);
  assert.match(source, /const safeValidation = isObject\(validation\) \? validation : \{\};/);
  assert.match(source, /const safeManualLoop = isObject\(manualLoop\) \? manualLoop : \{\};/);
  assert.match(source, /const safeDelivery = isObject\(delivery\) \? delivery : \{\};/);
  assert.match(source, /buildIntegritySignals\(\{\s*integritySource,/s);
  assert.match(source, /buildWarnings\(\{\s*integritySource,/s);
  assert.doesNotMatch(source, /promptPolicyMeta\?\./);
  assert.doesNotMatch(source, /validationReport\?\./);
  assert.doesNotMatch(source, /clarifyLoop\?\./);
  assert.doesNotMatch(source, /standardOutput,/);
});
