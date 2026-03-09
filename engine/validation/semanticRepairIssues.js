function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function toSafeString(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function resolveSchemaKey(schemaKeys, fieldName, fallback) {
  const candidate = schemaKeys?.[fieldName];
  return typeof candidate === 'string' && candidate.trim() ? candidate : fallback;
}

function getSemanticSource(rawValue, schemaKey, legacyKey) {
  const safe = isObject(rawValue) ? rawValue : {};
  if (isObject(safe[schemaKey])) return safe[schemaKey];
  if (isObject(safe[legacyKey])) return safe[legacyKey];
  return {};
}

function hasMeaningfulText(value) {
  return Boolean(toSafeString(value));
}

function hasMeaningfulList(value) {
  if (!Array.isArray(value)) return false;
  return value.some((item) => {
    if (typeof item === 'string') return Boolean(toSafeString(item));
    if (!isObject(item)) return false;
    return Object.values(item).some((entry) => hasMeaningfulText(entry));
  });
}

export function collectSemanticRepairIssues(raw, { schemaKeys = {} } = {}) {
  const safe = isObject(raw) ? raw : {};
  const problemFrameKey = resolveSchemaKey(schemaKeys, 'PROBLEM_FRAME', 'problem_frame');
  const featuresKey = resolveSchemaKey(schemaKeys, 'FEATURES', 'core_features');
  const requestConverterKey = resolveSchemaKey(schemaKeys, 'REQUEST_CONVERTER', 'request_converter');
  const rolesKey = resolveSchemaKey(schemaKeys, 'ROLES', 'users_and_roles');
  const inputFieldsKey = resolveSchemaKey(schemaKeys, 'INPUT_FIELDS', 'input_fields');
  const permissionsKey = resolveSchemaKey(schemaKeys, 'PERMISSIONS', 'permission_matrix');
  const testsKey = resolveSchemaKey(schemaKeys, 'TESTS', 'test_scenarios');
  const whoKey = resolveSchemaKey(schemaKeys, 'WHO', 'who');
  const whatKey = resolveSchemaKey(schemaKeys, 'WHAT', 'what');
  const successKey = resolveSchemaKey(schemaKeys, 'SUCCESS', 'success_criteria');
  const mustKey = resolveSchemaKey(schemaKeys, 'MUST', 'must');
  const standardRequestKey = resolveSchemaKey(schemaKeys, 'STANDARD_REQUEST', 'standard');

  const problemFrame = getSemanticSource(safe, problemFrameKey, 'problem_frame');
  const features = getSemanticSource(safe, featuresKey, 'core_features');
  const requestConverter = getSemanticSource(safe, requestConverterKey, 'request_converter');

  const roles = Array.isArray(safe[rolesKey]) ? safe[rolesKey] : safe.users_and_roles;
  const inputFields = Array.isArray(safe[inputFieldsKey]) ? safe[inputFieldsKey] : safe.input_fields;
  const permissions = Array.isArray(safe[permissionsKey]) ? safe[permissionsKey] : safe.permission_matrix;
  const tests = Array.isArray(safe[testsKey]) ? safe[testsKey] : safe.test_scenarios;

  const issues = [];

  if (!hasMeaningfulText(problemFrame[whoKey] ?? problemFrame.who)) {
    issues.push('Fill the primary user in problem_frame.who.');
  }
  if (!hasMeaningfulText(problemFrame[whatKey] ?? problemFrame.what)) {
    issues.push('Fill the core job-to-be-done in problem_frame.what.');
  }
  if (!hasMeaningfulText(problemFrame[successKey] ?? problemFrame.success_criteria)) {
    issues.push('Fill concrete success criteria in problem_frame.success.');
  }
  if (!hasMeaningfulList(roles)) {
    issues.push('Add at least one concrete user role.');
  }
  if (!hasMeaningfulList(features[mustKey] ?? features.must)) {
    issues.push('Add at least one must-have feature.');
  }
  if (!hasMeaningfulList(inputFields)) {
    issues.push('Add at least one input field with name and type.');
  }
  if (!hasMeaningfulList(permissions)) {
    issues.push('Add at least one permission rule.');
  }
  if (!hasMeaningfulList(tests)) {
    issues.push('Add concrete test scenarios.');
  }
  if (!hasMeaningfulText(requestConverter[standardRequestKey] ?? requestConverter.standard)) {
    issues.push('Fill the standard developer request text.');
  }

  return issues;
}