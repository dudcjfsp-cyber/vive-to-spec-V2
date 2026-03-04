import { findMissingCoreChecklistItems } from '../../../shared/corePromptChecklist.js';

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeText(value) {
  return toText(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const TOKEN_STOPWORDS = new Set([
  'the',
  'with',
  'that',
  'this',
  'from',
  'into',
  'for',
  'and',
  'your',
  'user',
  'spec',
  'prompt',
  'request',
  'build',
]);

function extractTokens(value) {
  const text = normalizeText(value);
  if (!text) return [];
  return (text.match(/[\p{L}\p{N}]{2,}/gu) || [])
    .filter((token) => !TOKEN_STOPWORDS.has(token));
}

function tokenJaccard(left, right) {
  const leftSet = new Set(extractTokens(left));
  const rightSet = new Set(extractTokens(right));
  if (leftSet.size === 0 || rightSet.size === 0) return 0;

  let intersection = 0;
  leftSet.forEach((token) => {
    if (rightSet.has(token)) intersection += 1;
  });
  return intersection / (leftSet.size + rightSet.size - intersection);
}

function tokenCoverage(source, candidate) {
  const sourceTokens = new Set(extractTokens(source));
  const candidateTokens = new Set(extractTokens(candidate));
  if (sourceTokens.size === 0 || candidateTokens.size === 0) return 0;

  let covered = 0;
  sourceTokens.forEach((token) => {
    if (candidateTokens.has(token)) covered += 1;
  });
  return covered / sourceTokens.size;
}

function containsEachOther(left, right) {
  const l = normalizeText(left);
  const r = normalizeText(right);
  if (!l || !r) return false;
  return l.includes(r) || r.includes(l);
}

function getLengthRatio(left, right) {
  const l = normalizeText(left).length;
  const r = normalizeText(right).length;
  const maxLen = Math.max(l, r, 1);
  return Math.min(l, r) / maxLen;
}

function isMsdsTopic(value) {
  return /(msds|material safety data sheet)/i.test(toText(value));
}

function collectSupplementalWarnings(sourceText, candidatePrompt) {
  const target = `${toText(sourceText)} ${toText(candidatePrompt)}`;
  if (!isMsdsTopic(target)) return [];

  const requiredSignals = [
    /(cas|ghs)/i,
    /(h code|h statement|p code|p statement)/i,
    /(first aid|ppe)/i,
    /(spill|fire|storage|disposal)/i,
  ];
  const isCovered = requiredSignals.every((pattern) => pattern.test(candidatePrompt));
  if (isCovered) return [];

  return [
    'MSDS 추출 범위를 보완해 주세요: CAS, GHS, H/P 코드, 응급조치, PPE, 누출/화재/보관/폐기 정보를 포함하세요.',
  ];
}

export function computePromptSimilarity(sourceVibe, candidatePrompt) {
  const jaccard = tokenJaccard(sourceVibe, candidatePrompt);
  const maxCoverage = Math.max(
    tokenCoverage(sourceVibe, candidatePrompt),
    tokenCoverage(candidatePrompt, sourceVibe),
  );
  return Math.max(jaccard, maxCoverage * 0.92);
}

export function isNearParaphrase(sourceVibe, candidatePrompt) {
  const similarity = computePromptSimilarity(sourceVibe, candidatePrompt);
  const containment = containsEachOther(sourceVibe, candidatePrompt);
  const lengthRatio = getLengthRatio(sourceVibe, candidatePrompt);
  const sourceCoverage = tokenCoverage(sourceVibe, candidatePrompt);
  return similarity >= 0.42 || sourceCoverage >= 0.45 || (containment && lengthRatio >= 0.7);
}

export function buildBeginnerQuickPrompt({
  vibe,
  candidatePrompt,
}) {
  const sourceVibe = toText(vibe);
  const basePrompt = toText(candidatePrompt, sourceVibe);
  const similarity = computePromptSimilarity(sourceVibe, basePrompt);
  const nearParaphrase = isNearParaphrase(sourceVibe, basePrompt);
  const warningItems = nearParaphrase
    ? [
      ...findMissingCoreChecklistItems(basePrompt),
      ...collectSupplementalWarnings(sourceVibe, basePrompt),
    ].slice(0, 6)
    : [];

  return {
    prompt: basePrompt,
    meta: {
      similarity,
      nearParaphrase,
      isEnhanced: warningItems.length > 0,
      promptMutated: false,
      deliveryMode: warningItems.length > 0 ? 'warning_only' : 'none',
      addedItemCount: warningItems.length,
      addedRequirements: warningItems,
    },
  };
}
