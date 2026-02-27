import {
  isObject,
  toObjectArray,
  toStringArray,
  toText,
} from './utils';

export function buildProblemFrame(spec) {
  const frame = isObject(spec?.문제정의_5칸) ? spec.문제정의_5칸 : {};
  return {
    who: toText(frame.누가),
    when: toText(frame.언제),
    what: toText(frame.무엇을),
    why: toText(frame.왜),
    success: toText(frame.성공기준),
  };
}

export function buildLogicMap(spec, hypothesis) {
  const features = isObject(spec?.핵심_기능) ? spec.핵심_기능 : {};
  const mustFeatures = toStringArray(features.필수);
  const fields = toObjectArray(spec?.입력_데이터_필드);
  const flow = toStringArray(spec?.화면_흐름_5단계);

  const dbMap = fields.length
    ? fields
      .map((field) => `- ${toText(field.이름, '필드')}: ${toText(field.타입, 'string')} (예시: ${toText(field.예시, '-')})`)
      .join('\n')
    : '- 입력 필드 정의를 먼저 채워주세요.';
  const apiMap = mustFeatures.length
    ? mustFeatures.map((feature, idx) => `- POST /api/task-${idx + 1}: ${feature}`).join('\n')
    : '- 기능 명세가 비어 있어 API 매핑을 생성하지 못했습니다.';
  const uiMap = flow.length
    ? flow.map((step, idx) => `${idx + 1}. ${step}`).join('\n')
    : '- 화면 흐름이 비어 있습니다.';

  return {
    text: [
      hypothesis.what ? `- 핵심 문제: ${hypothesis.what}` : '',
      hypothesis.success ? `- 성공 기준: ${hypothesis.success}` : '',
      ...mustFeatures.map((feature) => `- 필수 기능: ${feature}`),
    ].filter(Boolean).join('\n'),
    db: dbMap,
    api: apiMap,
    ui: uiMap,
  };
}

export function buildContextOutputs({
  devSpec,
  nondevSpec,
  masterPrompt,
  hypothesis,
  logicMap,
}) {
  const fallbackDev = [
    '# Developer Context',
    `- intent: ${hypothesis.what || '-'}`,
    `- success_criteria: ${hypothesis.success || '-'}`,
    '',
    '## Logic Map',
    '[TEXT]',
    logicMap.text || '-',
    '',
    '[DB]',
    logicMap.db || '-',
    '',
    '[API]',
    logicMap.api || '-',
    '',
    '[UI]',
    logicMap.ui || '-',
  ].join('\n');

  const fallbackNondev = [
    '무엇을 만들지 한 문장으로 말하면:',
    `- ${hypothesis.what || '아직 정의되지 않음'}`,
    '',
    '왜 이걸 하는지:',
    `- ${hypothesis.why || '아직 정의되지 않음'}`,
    '',
    '성공하면 무엇이 달라지는지:',
    `- ${hypothesis.success || '아직 정의되지 않음'}`,
  ].join('\n');

  const fallbackAiCoding = [
    'You are an implementation assistant.',
    `Goal: ${hypothesis.what || '-'}`,
    `Success Criteria: ${hypothesis.success || '-'}`,
    '',
    'Use this synced logic map:',
    '[TEXT]',
    logicMap.text || '-',
    '[DB]',
    logicMap.db || '-',
    '[API]',
    logicMap.api || '-',
    '[UI]',
    logicMap.ui || '-',
  ].join('\n');

  return {
    dev: toText(devSpec) || fallbackDev,
    nondev: toText(nondevSpec) || fallbackNondev,
    aiCoding: toText(masterPrompt) || fallbackAiCoding,
  };
}

export function buildActionPack({
  contextOutputs,
  todayActions,
  activeModel,
  gateStatus,
}) {
  return [
    '# Execution Pack',
    `- model: ${activeModel}`,
    `- gate: ${toText(gateStatus, 'review')}`,
    '',
    '## 오늘 실행 3단계',
    ...(todayActions.length ? todayActions.map((item, idx) => `${idx + 1}. ${item}`) : ['1. 액션 항목이 없어 우선순위를 다시 확정하세요.']),
    '',
    '## AI Coding Prompt',
    contextOutputs.aiCoding || '-',
  ].join('\n');
}
