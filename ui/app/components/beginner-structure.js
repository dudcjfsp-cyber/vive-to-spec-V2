import { buildProblemFrame } from './result-panel/builders.js';
import { toStringArray, toText } from './result-panel/utils.js';

function withFallback(value, fallback) {
  const text = toText(value);
  return text || fallback;
}

function buildAudienceLine(problemFrame) {
  const who = toText(problemFrame?.who);
  const when = toText(problemFrame?.when);

  if (who && when) return `${who} / ${when}`;
  if (who) return who;
  if (when) return when;
  return '누가 쓰는지와 언제 쓰는지 한 줄씩 보태면 더 정확해집니다.';
}

function buildConstraintLine(standardOutput) {
  const missingInfo = toStringArray(standardOutput?.예외_모호한_점?.부족한_정보);
  const warnings = toStringArray(standardOutput?.완성도_진단?.누락_경고);
  return withFallback(
    missingInfo[0] || warnings[0],
    '현재 큰 제약은 감지되지 않았습니다. 이제 성공 기준만 확인하면 됩니다.',
  );
}

function buildSlotCoachingHints(slots) {
  return slots
    .filter((slot) => slot.isMissing)
    .map((slot) => {
      switch (slot.id) {
        case 'goal':
          return '무엇을 만들지 한 문장으로 다시 적어 보세요.';
        case 'audience':
          return '누가 언제 쓰는지까지 적으면 AI가 흐름을 덜 엇나갑니다.';
        case 'success':
          return '성공 기준을 한 줄 넣으면 결과 품질이 훨씬 안정됩니다.';
        default:
          return '';
      }
    })
    .filter(Boolean);
}

function buildConstraintCoachingHint(standardOutput) {
  const missingInfo = toStringArray(standardOutput?.예외_모호한_점?.부족한_정보);
  const warnings = toStringArray(standardOutput?.완성도_진단?.누락_경고);
  const source = toText(missingInfo[0] || warnings[0]);
  if (!source) return '';
  return `이번 초안에서 특히 먼저 챙길 조건: ${source}`;
}

function buildCoachingHints(slots, standardOutput) {
  const slotHints = buildSlotCoachingHints(slots);
  const constraintHint = buildConstraintCoachingHint(standardOutput);
  const combined = constraintHint ? [...slotHints, constraintHint] : slotHints;

  if (combined.length > 0) return combined.slice(0, 3);

  return [
    '다음 실행에서는 성공 기준을 숫자나 상태 변화로 더 또렷하게 적어 보세요.',
    '누가 쓰는지와 어떤 상황에서 쓰는지까지 같이 적으면 결과가 더 일관됩니다.',
  ];
}

function buildPrimaryNudge(slots) {
  const firstMissing = slots.find((slot) => slot.isMissing);
  if (!firstMissing) return null;

  switch (firstMissing.id) {
    case 'goal':
      return {
        label: '무엇을 만들지 한 줄 추가',
        suggestedLine: '무엇을 만들지: [사용자가 하려는 핵심 작업을 한 문장으로 적기]',
      };
    case 'audience':
      return {
        label: '누가/언제 쓰는지 한 줄 추가',
        suggestedLine: '누가/언제: [누가]가 [어떤 상황]에서 이 기능을 사용함',
      };
    case 'success':
      return {
        label: '성공 기준 한 줄 추가',
        suggestedLine: '성공 기준: [무엇이 얼마나 좋아지면 성공인지 한 문장으로 적기]',
      };
    default:
      return null;
  }
}

function buildStrengthHighlight(slots) {
  const goalSlot = slots.find((slot) => slot.id === 'goal');
  const audienceSlot = slots.find((slot) => slot.id === 'audience');
  const successSlot = slots.find((slot) => slot.id === 'success');

  if (goalSlot && audienceSlot && !goalSlot.isMissing && !audienceSlot.isMissing) {
    return '좋아요: 무엇을 만들지와 누가 언제 쓰는지가 이미 들어 있어요.';
  }
  if (goalSlot && !goalSlot.isMissing) {
    return '좋아요: 무엇을 만들지 한 문장이 이미 잡혀 있어요.';
  }
  if (audienceSlot && !audienceSlot.isMissing) {
    return '좋아요: 누가 언제 쓰는지가 이미 들어 있어요.';
  }
  if (successSlot && !successSlot.isMissing) {
    return '좋아요: 성공 기준이 들어 있어 결과를 맞추기 쉬워집니다.';
  }
  return '좋아요: 첫 문장만으로도 초안을 만들 준비는 됐어요.';
}

function buildOneStepGuide(missingCount) {
  if (missingCount > 0) {
    return '다음 실행에서는 비어 있는 칸 하나만 채워도 충분합니다.';
  }
  return '다음 실행에서는 한 칸만 더 선명하게 다듬어도 결과가 더 안정됩니다.';
}

export function buildBeginnerStructureSummary(standardOutput) {
  const safeOutput = standardOutput && typeof standardOutput === 'object' ? standardOutput : {};
  const problemFrame = buildProblemFrame(safeOutput);
  const slots = [
    {
      id: 'goal',
      label: '무엇을 만들지',
      value: withFallback(problemFrame.what, '무엇을 만들지 한 문장으로 더 적어 주세요.'),
      isMissing: !toText(problemFrame.what),
    },
    {
      id: 'audience',
      label: '누가/언제 쓰는지',
      value: buildAudienceLine(problemFrame),
      isMissing: !toText(problemFrame.who) || !toText(problemFrame.when),
    },
    {
      id: 'constraint',
      label: '핵심 조건 또는 주의점',
      value: buildConstraintLine(safeOutput),
      isMissing: false,
    },
    {
      id: 'success',
      label: '성공 기준',
      value: withFallback(problemFrame.success, '성공하면 무엇이 달라지는지 한 줄 더 적어 주세요.'),
      isMissing: !toText(problemFrame.success),
    },
  ];

  const missingCount = slots.filter((slot) => slot.isMissing).length;
  const note = missingCount > 0
    ? `이 프롬프트는 위 ${slots.length}칸을 바탕으로 만들어집니다. 아직 비어 있는 칸 ${missingCount}개를 다음 실행에서 채우면 결과가 더 또렷해집니다.`
    : '이 프롬프트는 위 4칸을 바탕으로 만들어집니다. 입문자에게는 이 4칸을 먼저 보는 습관이 가장 중요합니다.';

  return {
    slots,
    missingCount,
    note,
    strengthHighlight: buildStrengthHighlight(slots),
    oneStepGuide: buildOneStepGuide(missingCount),
    coachingHints: buildCoachingHints(slots, safeOutput),
    primaryNudge: buildPrimaryNudge(slots),
  };
}
