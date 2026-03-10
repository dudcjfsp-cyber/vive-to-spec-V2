import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./ResultPanel.jsx', import.meta.url), 'utf8');

test('ResultPanel reads from a shared view-model instead of raw workspace props', () => {
  assert.match(source, /export default function ResultPanel\(\{ viewModel \}\)/);
  assert.match(source, /const session = isObject\(viewModel\?\.session\) \? viewModel\.session : \{\};/);
  assert.match(source, /const artifacts = isObject\(viewModel\?\.artifacts\) \? viewModel\.artifacts : \{\};/);
  assert.match(source, /const diagnostics = isObject\(viewModel\?\.diagnostics\) \? viewModel\.diagnostics : \{\};/);
  assert.match(source, /const actionHandlers = isObject\(viewModel\?\.actions\) \? viewModel\.actions : \{\};/);
  assert.doesNotMatch(source, /export default function ResultPanel\(\{\s*activeModel,/);
});

test('ResultPanel keeps advanced review metadata in Korean-first labels', () => {
  assert.match(source, /현재 모델:/);
  assert.match(source, /구현 가이드 다시 보기/);
  assert.match(source, /추천 구현 방식/);
  assert.match(source, /검토 요약/);
  assert.match(source, /작업 정리판/);
  assert.match(source, /const gateStatusLabel = GATE_STATUS_META\[gateStatus\]\?\.label \|\| gateStatus;/);
  assert.doesNotMatch(source, /panel status-only/);
  assert.doesNotMatch(source, /요구사항을 입력하면 스펙 생성을 시작합니다\./);
  assert.doesNotMatch(source, /스펙 생성 중\.\.\./);
  assert.doesNotMatch(source, /Validation Report/);
  assert.doesNotMatch(source, /하이브리드 스택 가이드 보기/);
});
