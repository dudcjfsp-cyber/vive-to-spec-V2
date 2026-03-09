export const INTENT_IR_VERSION = 1;

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeConfidence(value) {
  const normalized = toText(value, 'low').toLowerCase();
  if (normalized === 'high' || normalized === 'medium') return normalized;
  return 'low';
}

function normalizeNamedEntries(value, keyField, descriptionField = '') {
  if (!Array.isArray(value)) return [];

  return value.reduce((acc, item) => {
    if (!isPlainObject(item)) return acc;

    const name = toText(item[keyField]);
    const description = descriptionField ? toText(item[descriptionField]) : '';
    if (!name && !description) return acc;

    acc.push(description ? { name, description } : { name });
    return acc;
  }, []);
}

export function createEmptyIntentIr() {
  return {
    version: INTENT_IR_VERSION,
    source_vibe: '',
    summary: '',
    intent: {
      target_user: '',
      usage_moment: '',
      user_job: '',
      problem_context: '',
      success_signal: '',
    },
    delivery: {
      roles: [],
      must_haves: [],
      nice_to_haves: [],
      input_fields: [],
      permissions: [],
    },
    analysis: {
      risks: [],
      assumptions: [],
      missing_information: [],
      clarification_questions: [],
    },
    signals: {
      confidence: 'low',
      needs_clarification: false,
      severity: 'low',
      warning_count: 0,
      blocking_issue_count: 0,
    },
  };
}

export function normalizeIntentIr(value) {
  const safeValue = isPlainObject(value) ? value : {};
  const base = createEmptyIntentIr();

  const intent = isPlainObject(safeValue.intent) ? safeValue.intent : {};
  const delivery = isPlainObject(safeValue.delivery) ? safeValue.delivery : {};
  const analysis = isPlainObject(safeValue.analysis) ? safeValue.analysis : {};
  const signals = isPlainObject(safeValue.signals) ? safeValue.signals : {};

  return {
    version: INTENT_IR_VERSION,
    source_vibe: toText(safeValue.source_vibe),
    summary: toText(safeValue.summary),
    intent: {
      target_user: toText(intent.target_user),
      usage_moment: toText(intent.usage_moment),
      user_job: toText(intent.user_job),
      problem_context: toText(intent.problem_context),
      success_signal: toText(intent.success_signal),
    },
    delivery: {
      roles: normalizeNamedEntries(delivery.roles, 'name', 'description'),
      must_haves: toStringArray(delivery.must_haves),
      nice_to_haves: toStringArray(delivery.nice_to_haves),
      input_fields: normalizeNamedEntries(delivery.input_fields, 'name', 'description'),
      permissions: normalizeNamedEntries(delivery.permissions, 'name', 'description'),
    },
    analysis: {
      risks: toStringArray(analysis.risks),
      assumptions: toStringArray(analysis.assumptions),
      missing_information: toStringArray(analysis.missing_information),
      clarification_questions: toStringArray(analysis.clarification_questions),
    },
    signals: {
      confidence: normalizeConfidence(signals.confidence),
      needs_clarification: Boolean(signals.needs_clarification),
      severity: toText(signals.severity, base.signals.severity),
      warning_count: Number.isFinite(Number(signals.warning_count)) ? Number(signals.warning_count) : 0,
      blocking_issue_count: Number.isFinite(Number(signals.blocking_issue_count)) ? Number(signals.blocking_issue_count) : 0,
    },
  };
}
