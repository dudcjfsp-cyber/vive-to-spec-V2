import { toText } from './utils.js';

export const URGENCY_ORDER = ['red', 'orange', 'yellow'];

const URGENCY_UI_META = {
  red: {
    label: '빨강',
    icon: '▲',
    pattern: '!!!',
    action: '즉시 수정 필요',
  },
  orange: {
    label: '주황',
    icon: '◆',
    pattern: '!!',
    action: '우선 수정 권장',
  },
  yellow: {
    label: '노랑',
    icon: '●',
    pattern: '!',
    action: '검토 필요',
  },
};

export function getUrgencyUiMeta(urgency) {
  return URGENCY_UI_META[urgency] || URGENCY_UI_META.yellow;
}

export function buildL1FocusGuideMessage(l1FocusGuide) {
  const warningTitle = toText(l1FocusGuide?.warningTitle, 'L4 경고');
  const urgencyMeta = getUrgencyUiMeta(toText(l1FocusGuide?.urgency, 'yellow'));
  return `${warningTitle}에서 이동했습니다. 긴급도: ${urgencyMeta.label} (${urgencyMeta.icon} ${urgencyMeta.pattern}) ${urgencyMeta.action}. 강조된 필드를 먼저 수정하세요.`;
}
