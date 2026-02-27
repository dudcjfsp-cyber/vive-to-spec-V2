export const PRIORITY_LEVELS = [
  {
    id: 'high',
    label: '최우선',
    colorLabel: '빨강',
    meaning: '지금 바로 시작해야 하는 핵심 작업',
  },
  {
    id: 'medium',
    label: '우선',
    colorLabel: '주황',
    meaning: '핵심 완료 직후 이어서 처리할 작업',
  },
  {
    id: 'low',
    label: '검토',
    colorLabel: '노랑',
    meaning: '마무리 단계에서 점검/개선할 작업',
  },
];

export function normalizeActionText(value) {
  const safe = typeof value === 'string' ? value.trim() : '';
  if (!safe) return '';
  return safe.replace(/^\d+\.\s*/, '').trim();
}

export function parseBoldSegments(value) {
  const text = normalizeActionText(value);
  if (!text) return [];

  const pattern = /\*\*(.+?)\*\*/g;
  const segments = [];
  let cursor = 0;
  let match = pattern.exec(text);
  while (match) {
    if (match.index > cursor) {
      segments.push({ text: text.slice(cursor, match.index), bold: false });
    }
    segments.push({ text: match[1], bold: true });
    cursor = match.index + match[0].length;
    match = pattern.exec(text);
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), bold: false });
  }

  if (segments.length === 0) {
    return [{ text, bold: false }];
  }
  return segments;
}

export function getPriorityByIndex(index) {
  const safeIndex = Number(index);
  if (!Number.isFinite(safeIndex) || safeIndex <= 0) return PRIORITY_LEVELS[0];
  if (safeIndex === 1) return PRIORITY_LEVELS[0];
  if (safeIndex === 2) return PRIORITY_LEVELS[1];
  return PRIORITY_LEVELS[2];
}
