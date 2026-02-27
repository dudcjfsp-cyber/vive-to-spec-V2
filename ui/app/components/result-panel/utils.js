export function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

export function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

export function toObjectArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (isObject(item) ? item : null))
    .filter(Boolean);
}

export function appendLine(base, line) {
  const safeBase = toText(base);
  const safeLine = toText(line);
  if (!safeLine) return safeBase;
  if (!safeBase) return safeLine;
  return safeBase.includes(safeLine) ? safeBase : `${safeBase}\n${safeLine}`;
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function deepClone(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

export function formatLocalTime(ts) {
  const parsed = Number(ts);
  if (!Number.isFinite(parsed)) return '-';
  return new Date(parsed).toLocaleTimeString('ko-KR', { hour12: false });
}

export function formatHistoryMeta(meta) {
  if (!isObject(meta)) return '';
  const parts = Object.entries(meta)
    .map(([key, value]) => `${key}=${toText(value) || String(value)}`)
    .filter((item) => item && !item.endsWith('='));
  return parts.join(' | ');
}

export function toErrorMessage(error) {
  if (error instanceof Error) return toText(error.message, '알 수 없는 오류');
  return toText(String(error), '알 수 없는 오류');
}

export function isPromiseLike(value) {
  return Boolean(value) && typeof value.then === 'function';
}
