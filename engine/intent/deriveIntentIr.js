import { normalizeIntentIr } from '../contracts/intentIr.js';

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

function getNestedObject(source, key) {
  if (!isPlainObject(source)) return {};
  const nested = source[key];
  return isPlainObject(nested) ? nested : {};
}

function normalizeConfidence(validationReport) {
  const blockingIssueCount = Number(validationReport?.blocking_issue_count || 0);
  const warningCount = Number(validationReport?.warning_count || 0);
  const needsClarification = Boolean(validationReport?.needs_clarification);
  const severity = toText(validationReport?.severity, 'low');

  if (blockingIssueCount > 0 || severity === 'high') return 'low';
  if (needsClarification || severity === 'medium' || warningCount > 0) return 'medium';
  return 'high';
}

function normalizeRoles(entries, roleKey, descriptionKey) {
  if (!Array.isArray(entries)) return [];
  return entries.reduce((acc, item) => {
    if (!isPlainObject(item)) return acc;
    const name = toText(item[roleKey]);
    const description = toText(item[descriptionKey]);
    if (!name && !description) return acc;
    acc.push({ name, description });
    return acc;
  }, []);
}

function normalizeInputFields(entries, nameKey, descriptionKeys = []) {
  if (!Array.isArray(entries)) return [];
  return entries.reduce((acc, item) => {
    if (!isPlainObject(item)) return acc;
    const name = toText(item[nameKey]);
    const description = descriptionKeys
      .map((key) => toText(item[key]))
      .filter(Boolean)
      .join(' | ');
    if (!name && !description) return acc;
    acc.push({ name, description });
    return acc;
  }, []);
}

function normalizePermissions(entries, roleKey, notesKey, crudKeys = {}) {
  if (!Array.isArray(entries)) return [];
  return entries.reduce((acc, item) => {
    if (!isPlainObject(item)) return acc;
    const role = toText(item[roleKey]);
    const crudParts = Object.entries(crudKeys)
      .filter(([, sourceKey]) => sourceKey && item[sourceKey] === true)
      .map(([label]) => label.toUpperCase());
    const notes = toText(item[notesKey]);
    const descriptionParts = [];
    if (crudParts.length > 0) descriptionParts.push(`crud=${crudParts.join('/')}`);
    if (notes) descriptionParts.push(notes);
    const description = descriptionParts.join(' | ');
    if (!role && !description) return acc;
    acc.push({ name: role, description });
    return acc;
  }, []);
}

export function buildIntentIrFromSpec({
  sourceVibe = '',
  spec = null,
  validationReport = null,
  fields = {},
} = {}) {
  const safeSpec = isPlainObject(spec) ? spec : {};
  const problemFrame = getNestedObject(safeSpec, fields.problemFrame);
  const features = getNestedObject(safeSpec, fields.features);
  const ambiguities = getNestedObject(safeSpec, fields.ambiguities);

  return normalizeIntentIr({
    source_vibe: toText(sourceVibe),
    summary: toText(safeSpec[fields.summary]),
    intent: {
      target_user: toText(problemFrame[fields.who]),
      usage_moment: toText(problemFrame[fields.when]),
      user_job: toText(problemFrame[fields.what]),
      problem_context: toText(problemFrame[fields.why]),
      success_signal: toText(problemFrame[fields.success]),
    },
    delivery: {
      roles: normalizeRoles(safeSpec[fields.roles], fields.role, fields.description),
      must_haves: toStringArray(features[fields.must]),
      nice_to_haves: toStringArray(features[fields.nice]),
      input_fields: normalizeInputFields(safeSpec[fields.inputFields], fields.name, [fields.type, fields.example]),
      permissions: normalizePermissions(safeSpec[fields.permissions], fields.role, fields.notes, {
        read: fields.read,
        create: fields.create,
        update: fields.update,
        delete: fields.delete,
      }),
    },
    analysis: {
      risks: toStringArray(safeSpec[fields.risks]),
      assumptions: [],
      missing_information: toStringArray(ambiguities[fields.missing]),
      clarification_questions: toStringArray(ambiguities[fields.questions]),
    },
    signals: {
      confidence: normalizeConfidence(validationReport),
      needs_clarification: Boolean(validationReport?.needs_clarification),
      severity: toText(validationReport?.severity, 'low'),
      warning_count: Number(validationReport?.warning_count || 0),
      blocking_issue_count: Number(validationReport?.blocking_issue_count || 0),
    },
  });
}
