import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPrompt } from './transmuteEngine.js';

const EXPECTED_BASELINE_PROMPT = `SYSTEM:

You are the "Vibe-to-Spec Transmuter" for an educational MVP focused on beginner-friendly software specs.
Goal: Convert an abstract vibe into a practical, implementation-ready standard output schema.

OUTPUT RULES (MUST FOLLOW):
1) Return JSON ONLY. No markdown wrapper. No prose outside JSON.
2) Follow the exact schema shape provided.
3) Use Korean language by default, but keep technical terms/identifiers in English when helpful.
4) The schema keys are fixed and fully Korean. Do not add extra top-level keys.
5) Keep output beginner-friendly and concrete.
6) "문제정의_5칸" must fill all fields with concrete text.
7) "인터뷰_모드.추가_질문_3개" must always contain exactly 3 required-information questions.
8) "화면_흐름_5단계" must have exactly 5 concise steps.
9) "예외_모호한_점.확인_질문_3개", "리스크_함정_3개", "테스트_시나리오_3개", "오늘_할_일_3개" must each have exactly 3 items.
10) "권한_규칙" should be realistic by role and include clear CRUD booleans.
11) "완성도_진단.점수_0_100" must be an integer 0~100, and "누락_경고" must be actionable.
12) "수정요청_변환" must include short/standard/detailed request variants that can be copied to developers.
13) "변경_영향도" must mention at least one screen impact, one permission impact, and one test impact.
14) "레이어_가이드" must describe L1-L5 progression for beginners.


JSON Schema Shape:
{
  "한_줄_요약": "string",
  "문제정의_5칸": {
    "누가": "string",
    "언제": "string",
    "무엇을": "string",
    "왜": "string",
    "성공기준": "string"
  },
  "인터뷰_모드": {
    "추가_질문_3개": ["string", "string", "string"]
  },
  "사용자_역할": [
    {
      "역할": "string",
      "설명": "string"
    }
  ],
  "핵심_기능": {
    "필수": ["string"],
    "있으면_좋음": ["string"]
  },
  "화면_흐름_5단계": ["string", "string", "string", "string", "string"],
  "입력_데이터_필드": [
    {
      "이름": "string",
      "타입": "string",
      "예시": "string"
    }
  ],
  "권한_규칙": [
    {
      "역할": "string",
      "조회": true,
      "생성": true,
      "수정": true,
      "삭제": true,
      "비고": "string"
    }
  ],
  "예외_모호한_점": {
    "부족한_정보": ["string"],
    "확인_질문_3개": ["string", "string", "string"]
  },
  "리스크_함정_3개": ["string", "string", "string"],
  "테스트_시나리오_3개": ["string", "string", "string"],
  "오늘_할_일_3개": ["string", "string", "string"],
  "완성도_진단": {
    "점수_0_100": 88,
    "누락_경고": ["string"]
  },
  "수정요청_변환": {
    "원문": "string",
    "짧은_요청": "string",
    "표준_요청": "string",
    "상세_요청": "string"
  },
  "변경_영향도": {
    "화면": ["string"],
    "권한": ["string"],
    "테스트": ["string"]
  },
  "레이어_가이드": [
    {
      "레이어": "L1|L2|L3|L4|L5",
      "목표": "string",
      "출력": "string"
    }
  ]
}

User vibe:
MSDS PDF 추출 서비스

Runtime option: showThinking=ON.
Return only the fixed schema above.`;

test('buildPrompt preserves the legacy baseline prompt string', () => {
  const prompt = buildPrompt({
    vibe: 'MSDS PDF 추출 서비스',
    showThinking: true,
    persona: 'experienced',
    policyMode: 'baseline',
    promptExperimentId: 'baseline_control_v1',
  });

  assert.equal(prompt, EXPECTED_BASELINE_PROMPT);
});

test('buildPrompt uses policy sections for beginner persona while leaving retry prompts unchanged', () => {
  const policyPrompt = buildPrompt({
    vibe: '회의록 요약 앱',
    showThinking: false,
    persona: 'beginner',
    promptExperimentId: 'beginner_zero_shot_v1',
  });
  const retryPrompt = buildPrompt({
    vibe: '회의록 요약 앱',
    showThinking: false,
    persona: 'beginner',
    retryPayload: '{"broken":',
  });

  assert.match(policyPrompt, /^SYSTEM:\nYou are the "Vibe-to-Spec Transmuter"/);
  assert.match(policyPrompt, /\n\nHard constraints:\n- /);
  assert.match(policyPrompt, /\n\nOutput schema shape:\n\{/);
  assert.match(policyPrompt, /\n\nGoal and success conditions:\n- /);
  assert.match(policyPrompt, /\n\nRuntime option:\n- showThinking=OFF\./);
  assert.match(policyPrompt, /\n\nUser vibe:\n회의록 요약 앱\n\nReturn only the fixed schema above\.$/);
  assert.equal(
    retryPrompt,
    'Your previous response was invalid JSON. Fix it now. Return JSON only and strictly follow schema.\nSchema:\n{\n  "한_줄_요약": "string",\n  "문제정의_5칸": {\n    "누가": "string",\n    "언제": "string",\n    "무엇을": "string",\n    "왜": "string",\n    "성공기준": "string"\n  },\n  "인터뷰_모드": {\n    "추가_질문_3개": ["string", "string", "string"]\n  },\n  "사용자_역할": [\n    {\n      "역할": "string",\n      "설명": "string"\n    }\n  ],\n  "핵심_기능": {\n    "필수": ["string"],\n    "있으면_좋음": ["string"]\n  },\n  "화면_흐름_5단계": ["string", "string", "string", "string", "string"],\n  "입력_데이터_필드": [\n    {\n      "이름": "string",\n      "타입": "string",\n      "예시": "string"\n    }\n  ],\n  "권한_규칙": [\n    {\n      "역할": "string",\n      "조회": true,\n      "생성": true,\n      "수정": true,\n      "삭제": true,\n      "비고": "string"\n    }\n  ],\n  "예외_모호한_점": {\n    "부족한_정보": ["string"],\n    "확인_질문_3개": ["string", "string", "string"]\n  },\n  "리스크_함정_3개": ["string", "string", "string"],\n  "테스트_시나리오_3개": ["string", "string", "string"],\n  "오늘_할_일_3개": ["string", "string", "string"],\n  "완성도_진단": {\n    "점수_0_100": 88,\n    "누락_경고": ["string"]\n  },\n  "수정요청_변환": {\n    "원문": "string",\n    "짧은_요청": "string",\n    "표준_요청": "string",\n    "상세_요청": "string"\n  },\n  "변경_영향도": {\n    "화면": ["string"],\n    "권한": ["string"],\n    "테스트": ["string"]\n  },\n  "레이어_가이드": [\n    {\n      "레이어": "L1|L2|L3|L4|L5",\n      "목표": "string",\n      "출력": "string"\n    }\n  ]\n}\nPrevious output:\n{"broken":',
  );
});
