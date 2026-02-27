import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildBeginnerQuickPrompt,
  computePromptSimilarity,
  isNearParaphrase,
} from './beginner-prompt.js';

test('computePromptSimilarity returns high score for near paraphrase', () => {
  const source = 'MSDS PDF 파일을 넣으면 AI가 pdf를 읽어서 필요한 내용을 추출하는 웹서비스';
  const candidate = 'MSDS PDF 파일을 업로드하면 AI가 핵심 정보를 추출하여 보여주는 웹 서비스 개발을 요청합니다.';
  const score = computePromptSimilarity(source, candidate);
  assert.ok(score >= 0.42);
  assert.equal(isNearParaphrase(source, candidate), true);
});

test('buildBeginnerQuickPrompt auto-enhances near paraphrase with requirements', () => {
  const result = buildBeginnerQuickPrompt({
    vibe: 'MSDS PDF 파일을 넣으면 AI가 pdf를 읽어서 필요한 내용을 추출하는 웹서비스',
    candidatePrompt: 'MSDS PDF 파일을 업로드하면 AI가 핵심 정보를 추출하여 보여주는 웹 서비스 개발을 요청합니다.',
  });

  assert.equal(result.meta.isEnhanced, true);
  assert.ok(result.meta.addedItemCount >= 3);
  assert.ok(result.prompt.includes('[필수 구현 요구사항]'));
  assert.ok(result.prompt.includes('MSDS 필수 필드'));
});

test('buildBeginnerQuickPrompt keeps detailed prompt as-is', () => {
  const detailed = [
    '사용자가 PDF를 업로드하면 AI가 제품명/CAS/GHS를 추출하고 JSON으로 반환하는 웹서비스를 개발해 주세요.',
    '입력 제한은 PDF 20MB, 50페이지이고 OCR 실패 시 오류 사유를 표시합니다.',
    '완료 기준은 샘플 3건에서 필수 필드 누락 없이 추출되는 것입니다.',
  ].join(' ');

  const result = buildBeginnerQuickPrompt({
    vibe: 'MSDS PDF 분석 서비스',
    candidatePrompt: detailed,
  });

  assert.equal(result.meta.isEnhanced, false);
  assert.equal(result.prompt, detailed);
});
