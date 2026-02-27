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
  '그리고',
  '또는',
  '기능',
  '서비스',
  '개발',
  '요청',
  '요청합니다',
  '합니다',
  '필요한',
  '핵심',
  '정보',
  '보여주는',
  'the',
  'with',
]);

function extractTokens(value) {
  const text = normalizeText(value);
  if (!text) return [];
  return (text.match(/[a-z0-9가-힣]{2,}/g) || [])
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

const CORE_REQUIREMENTS = [
  {
    id: 'persona',
    checks: [/(사용자|운영자|관리자|역할|누가)/i],
    text: '사용자 역할을 분리한다: 일반 사용자(업로드/조회)와 관리자(검토/다운로드) 권한을 명시한다.',
  },
  {
    id: 'input',
    checks: [/(입력|업로드|파일 형식|pdf|ocr|용량|페이지)/i],
    text: '입력 조건을 정의한다: PDF 허용 형식, 최대 용량/페이지 제한, 스캔본 OCR 지원 여부를 명시한다.',
  },
  {
    id: 'output',
    checks: [/(출력|json|테이블|카드|필드|페이지 번호|source)/i],
    text: '출력 형식을 고정한다: UI 카드와 JSON을 함께 제공하고 각 추출값에 원문 페이지 번호를 포함한다.',
  },
  {
    id: 'error',
    checks: [/(오류|실패|예외|재시도|검증|fallback|시간 초과|타임아웃)/i],
    text: '예외 처리를 정의한다: 암호화 PDF, 손상 파일, 추출 실패 시 원인/재시도 가이드를 제공한다.',
  },
  {
    id: 'acceptance',
    checks: [/(테스트|정확도|수용 기준|완료 기준|검증 기준|샘플)/i],
    text: '완료 기준을 명시한다: 샘플 문서 3건 기준 필수 필드 추출률과 누락 허용 기준을 정의한다.',
  },
];

const MSDS_REQUIREMENTS = [
  {
    id: 'msds_fields',
    checks: [/(cas|ghs|응급조치|보호구|ppe|유해성|h 문구|p 문구|폐기|누출|화재)/i],
    text: 'MSDS 필수 필드를 추출한다: 제품명, CAS 번호, GHS 분류, H/P 문구, 응급조치, PPE, 누출/화재/폐기 정보.',
  },
];

function isMsdsTopic(value) {
  return /(msds|material safety data sheet|물질안전보건자료|안전보건자료)/i.test(toText(value));
}

function collectMissingRequirements(sourceText, vibeText) {
  const target = `${toText(sourceText)} ${toText(vibeText)}`;
  const missing = CORE_REQUIREMENTS
    .filter((item) => !item.checks.some((regex) => regex.test(target)))
    .map((item) => item.text);

  if (isMsdsTopic(target)) {
    MSDS_REQUIREMENTS.forEach((item) => {
      if (!item.checks.some((regex) => regex.test(target))) {
        missing.push(item.text);
      }
    });
  }
  return missing.slice(0, 6);
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

function buildEnhancedPrompt(basePrompt, additions) {
  const goalLine = toText(basePrompt, '요구사항을 구현 가능한 단위로 정리해 주세요.');
  return [
    goalLine,
    '',
    '[필수 구현 요구사항]',
    ...additions.map((item) => `- ${item}`),
  ].join('\n');
}

export function buildBeginnerQuickPrompt({
  vibe,
  candidatePrompt,
}) {
  const sourceVibe = toText(vibe);
  const basePrompt = toText(candidatePrompt, sourceVibe);
  const similarity = computePromptSimilarity(sourceVibe, basePrompt);
  const nearParaphrase = isNearParaphrase(sourceVibe, basePrompt);
  const missingRequirements = collectMissingRequirements(basePrompt, sourceVibe);
  const shouldEnhance = nearParaphrase && missingRequirements.length > 0;

  return {
    prompt: shouldEnhance ? buildEnhancedPrompt(basePrompt, missingRequirements) : basePrompt,
    meta: {
      similarity,
      nearParaphrase,
      isEnhanced: shouldEnhance,
      addedItemCount: shouldEnhance ? missingRequirements.length : 0,
      addedRequirements: shouldEnhance ? missingRequirements : [],
    },
  };
}
