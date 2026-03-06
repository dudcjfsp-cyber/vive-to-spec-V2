import test from 'node:test';
import assert from 'node:assert/strict';
import { buildContextOutputs } from './builders.js';

test('buildContextOutputs keeps only the core copy-ready sections in the aiCoding prompt', () => {
  const masterPrompt = [
    'You are an implementation assistant.',
    '',
    '[Summary]',
    'Implementation prompt body',
    '',
    '[Problem Frame]',
    'Problem frame body',
    '',
    '[Must Features]',
    '1. Must feature',
    '',
    '[Flow]',
    '1. First step',
    '',
    '[Input Fields]',
    '- field_a: string',
    '',
    '[Permissions]',
    '- admin: read/write',
    '',
    '[Standard Request]',
    'Natural-language request that should be removed.',
    '',
    '[Impact]',
    'Impact summary that should be removed.',
    '',
    '[Tests]',
    '1. Test case',
    '',
    '[핵심 구현 체크리스트]',
    '1. Keep the spec concrete.',
    '',
    '[Today Actions]',
    '1. First task',
    '',
    'Requirements:',
    '1) Extra repeated instruction.',
  ].join('\n');

  const outputs = buildContextOutputs({
    devSpec: '',
    nondevSpec: '',
    masterPrompt,
    hypothesis: {},
    logicMap: {},
  });

  assert.match(outputs.aiCoding, /^You are an implementation assistant\./);
  assert.match(outputs.aiCoding, /\[Summary\]/);
  assert.match(outputs.aiCoding, /\[Tests\]/);
  assert.match(outputs.aiCoding, /\[핵심 구현 체크리스트\]/);
  assert.doesNotMatch(outputs.aiCoding, /\[Standard Request\]/);
  assert.doesNotMatch(outputs.aiCoding, /\[Impact\]/);
  assert.doesNotMatch(outputs.aiCoding, /\[Today Actions\]/);
  assert.doesNotMatch(outputs.aiCoding, /Requirements:/);
});

test('buildContextOutputs prepends the selected implementation stack preference to the aiCoding prompt', () => {
  const outputs = buildContextOutputs({
    devSpec: '',
    nondevSpec: '',
    masterPrompt: 'You are an implementation assistant.\n\n[Summary]\nBuild it.',
    hypothesis: {},
    logicMap: {},
    preferredStack: {
      id: 'option_a::django',
      name: 'Django/Flask (Python) + PostgreSQL + React/Vue.js',
    },
  });

  assert.match(outputs.aiCoding, /^\[Implementation Stack Preference\]/);
  assert.match(outputs.aiCoding, /Preferred stack: Django\/Flask \(Python\) \+ PostgreSQL \+ React\/Vue\.js/);
  assert.match(outputs.aiCoding, /Preferred language: Python/);
  assert.match(outputs.aiCoding, /Preferred technologies: Django\/Flask, PostgreSQL, React\/Vue\.js/);
  assert.match(outputs.aiCoding, /You are an implementation assistant\./);
});
