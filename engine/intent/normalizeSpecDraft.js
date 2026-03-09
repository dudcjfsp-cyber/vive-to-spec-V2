function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => toText(item)).filter(Boolean);
}

function toFixedLengthStringArray(value, length, fallbackPrefix) {
  const list = toStringArray(value).slice(0, length);
  while (list.length < length) {
    list.push(`${fallbackPrefix} ${list.length + 1}`);
  }
  return list;
}

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1', 'o', '허용', '가능'].includes(normalized)) return true;
    if (['false', 'no', 'n', '0', 'x', '불가', '금지'].includes(normalized)) return false;
  }
  if (typeof value === 'number') return value !== 0;
  return fallback;
}

function getObjectSource(raw, schemaKey, legacyKey) {
  if (isPlainObject(raw[schemaKey])) return raw[schemaKey];
  if (isPlainObject(raw[legacyKey])) return raw[legacyKey];
  return {};
}

function getArraySource(raw, schemaKey, legacyKey) {
  if (Array.isArray(raw[schemaKey])) return raw[schemaKey];
  if (Array.isArray(raw[legacyKey])) return raw[legacyKey];
  return [];
}

/**
 * Normalizes raw provider JSON into the current spec-shaped draft.
 * It also returns the raw sources that the post-normalization analysis stage
 * still consumes so the handoff boundary stays explicit in code.
 */
export function normalizeSpecDraft({
  schemaKeys,
  raw = null,
  normalizeLayerGuide,
} = {}) {
  if (!isPlainObject(schemaKeys)) {
    throw new Error('schemaKeys is required.');
  }
  if (typeof normalizeLayerGuide !== 'function') {
    throw new Error('normalizeLayerGuide is required.');
  }

  const K = schemaKeys;
  const safeRaw = isPlainObject(raw) ? raw : {};

  const problemFrameSource = getObjectSource(safeRaw, K.PROBLEM_FRAME, 'problem_frame');
  const interviewSource = getObjectSource(safeRaw, K.INTERVIEW, 'interview_mode');
  const featuresSource = getObjectSource(safeRaw, K.FEATURES, 'core_features');
  const ambiguitiesSource = getObjectSource(safeRaw, K.AMBIGUITIES, 'ambiguities');
  const requestSource = getObjectSource(safeRaw, K.REQUEST_CONVERTER, 'request_converter');
  const impactSource = getObjectSource(safeRaw, K.IMPACT, 'impact_preview');
  const completenessSource = getObjectSource(safeRaw, K.COMPLETENESS, 'completeness');

  const roles = getArraySource(safeRaw, K.ROLES, 'users_and_roles')
    .map((item) => {
      const safeItem = isPlainObject(item) ? item : {};
      return {
        [K.ROLE]: toText(safeItem[K.ROLE] ?? safeItem.role),
        [K.DESCRIPTION]: toText(safeItem[K.DESCRIPTION] ?? safeItem.description),
      };
    })
    .filter((item) => item[K.ROLE] || item[K.DESCRIPTION]);

  const inputFields = getArraySource(safeRaw, K.INPUT_FIELDS, 'input_fields')
    .map((item) => {
      const safeItem = isPlainObject(item) ? item : {};
      return {
        [K.NAME]: toText(safeItem[K.NAME] ?? safeItem.name),
        [K.TYPE]: toText(safeItem[K.TYPE] ?? safeItem.type),
        [K.EXAMPLE]: toText(safeItem[K.EXAMPLE] ?? safeItem.example),
      };
    })
    .filter((item) => item[K.NAME] || item[K.TYPE] || item[K.EXAMPLE]);

  const permissions = getArraySource(safeRaw, K.PERMISSIONS, 'permission_matrix')
    .map((item) => {
      const safeItem = isPlainObject(item) ? item : {};
      return {
        [K.ROLE]: toText(safeItem[K.ROLE] ?? safeItem.role),
        [K.READ]: toBoolean(safeItem[K.READ] ?? safeItem.read),
        [K.CREATE]: toBoolean(safeItem[K.CREATE] ?? safeItem.create),
        [K.UPDATE]: toBoolean(safeItem[K.UPDATE] ?? safeItem.update),
        [K.DELETE]: toBoolean(safeItem[K.DELETE] ?? safeItem.delete),
        [K.NOTES]: toText(safeItem[K.NOTES] ?? safeItem.notes),
      };
    })
    .filter((item) => item[K.ROLE] || item[K.NOTES]);

  const summary = toText(safeRaw[K.SUMMARY] ?? safeRaw.one_line_summary, '요약 정보가 필요합니다.');

  const specDraft = {
    [K.SUMMARY]: summary,
    [K.PROBLEM_FRAME]: {
      [K.WHO]: toText(problemFrameSource[K.WHO] ?? problemFrameSource.who, '주요 사용자 정의 필요'),
      [K.WHEN]: toText(problemFrameSource[K.WHEN] ?? problemFrameSource.when, '사용 시점 정의 필요'),
      [K.WHAT]: toText(problemFrameSource[K.WHAT] ?? problemFrameSource.what, '해결할 작업 정의 필요'),
      [K.WHY]: toText(problemFrameSource[K.WHY] ?? problemFrameSource.why, '문제 배경 정의 필요'),
      [K.SUCCESS]: toText(problemFrameSource[K.SUCCESS] ?? problemFrameSource.success_criteria, '성공 기준 정의 필요'),
    },
    [K.ROLES]: roles,
    [K.FEATURES]: {
      [K.MUST]: toStringArray(featuresSource[K.MUST] ?? featuresSource.must),
      [K.NICE]: toStringArray(featuresSource[K.NICE] ?? featuresSource.nice_to_have),
    },
    [K.FLOW]: toFixedLengthStringArray(safeRaw[K.FLOW] ?? safeRaw.user_flow_steps, 5, '사용자 흐름 단계'),
    [K.INPUT_FIELDS]: inputFields,
    [K.PERMISSIONS]: permissions,
    [K.AMBIGUITIES]: {
      [K.MISSING]: toStringArray(ambiguitiesSource[K.MISSING] ?? ambiguitiesSource.missing_information),
      [K.QUESTIONS]: toFixedLengthStringArray(
        ambiguitiesSource[K.QUESTIONS] ?? ambiguitiesSource.questions,
        3,
        '확인 질문',
      ),
    },
    [K.RISKS]: toFixedLengthStringArray(safeRaw[K.RISKS] ?? safeRaw.risks, 3, '리스크'),
    [K.TESTS]: toFixedLengthStringArray(safeRaw[K.TESTS] ?? safeRaw.test_scenarios, 3, '테스트 시나리오'),
    [K.NEXT]: toFixedLengthStringArray(safeRaw[K.NEXT] ?? safeRaw.next_steps_today, 3, '오늘 할 일'),
    [K.REQUEST_CONVERTER]: {
      [K.RAW_REQUEST]: toText(requestSource[K.RAW_REQUEST] ?? requestSource.original, summary),
      [K.SHORT_REQUEST]: toText(requestSource[K.SHORT_REQUEST] ?? requestSource.short),
      [K.STANDARD_REQUEST]: toText(requestSource[K.STANDARD_REQUEST] ?? requestSource.standard),
      [K.DETAILED_REQUEST]: toText(requestSource[K.DETAILED_REQUEST] ?? requestSource.detailed),
    },
    [K.IMPACT]: {
      [K.IMPACT_SCREENS]: toStringArray(impactSource[K.IMPACT_SCREENS] ?? impactSource.screens),
      [K.IMPACT_PERMISSIONS]: toStringArray(impactSource[K.IMPACT_PERMISSIONS] ?? impactSource.permissions),
      [K.IMPACT_TESTS]: toStringArray(impactSource[K.IMPACT_TESTS] ?? impactSource.tests),
    },
    [K.LAYER_GUIDE]: normalizeLayerGuide(safeRaw[K.LAYER_GUIDE] ?? safeRaw.layer_guide),
  };

  return {
    specDraft,
    analysisHandoff: {
      interviewSource,
      ambiguitiesSource,
      completenessSource,
    },
  };
}
