export const PERSONA_PRESETS = [
  {
    id: 'beginner',
    label: '바이브코딩 입문자',
    subtitle: '최소 입력으로 결과 빨리 뽑기',
    tone: 'action-first',
  },
  {
    id: 'experienced',
    label: '바이브코딩 경험자',
    subtitle: '핵심 경고 중심으로 빠르게 정리',
    tone: 'summary-first',
  },
  {
    id: 'major',
    label: '개발관련 전공자',
    subtitle: '레이어/진단/상태를 전체 노출',
    tone: 'full-control',
  },
];

export function resolvePersonaPreset(personaId) {
  const key = String(personaId || '').trim();
  if (!key) return null;
  return PERSONA_PRESETS.find((preset) => preset.id === key) || null;
}
