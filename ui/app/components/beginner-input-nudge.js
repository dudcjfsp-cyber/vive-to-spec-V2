import { toText } from './result-panel/utils.js';

function normalizeText(value) {
  return toText(value).toLowerCase();
}

function hasAudienceSignal(text) {
  return /(사용자|운영자|관리자|고객|학생|팀|직원|판매자|창업자|담당자|개발자|누가)/.test(text);
}

function hasTimingSignal(text) {
  return /(언제|상황|때|직후|도중|중에|이후|전에|하면|할 때)/.test(text);
}

function hasSuccessSignal(text) {
  return /(성공|목표|줄어|늘어|개선|완료율|응답시간|정확도|전환율|달라|효율)/.test(text);
}

export function buildBeginnerInputNudge(vibe) {
  const text = normalizeText(vibe);
  if (!text) return null;

  if (!hasAudienceSignal(text) || !hasTimingSignal(text)) {
    return {
      label: '누가/언제 쓰는지 한 줄 추가',
      helper: '입문자에게 가장 먼저 필요한 건 사용자와 사용 상황입니다.',
      suggestedLine: '누가/언제: [누가]가 [어떤 상황]에서 이 기능을 사용함',
    };
  }

  if (!hasSuccessSignal(text)) {
    return {
      label: '성공 기준 한 줄 추가',
      helper: '성공 기준이 있으면 AI 출력이 훨씬 덜 흔들립니다.',
      suggestedLine: '성공 기준: [무엇이 얼마나 좋아지면 성공인지 한 문장으로 적기]',
    };
  }

  return {
    label: '핵심 조건 한 줄 추가',
    helper: '권한, 예외, 검토 조건 중 하나만 적어도 결과가 더 안정됩니다.',
    suggestedLine: '핵심 조건: [권한/예외/주의점 중 하나를 한 문장으로 적기]',
  };
}
