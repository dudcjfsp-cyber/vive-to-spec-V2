export const AX_LAYER_TABS = [
  { id: 'L1', label: 'L1 Intent Extractor' },
  { id: 'L2', label: 'L2 Logic Mapper' },
  { id: 'L3', label: 'L3 Context Optimizer' },
  { id: 'L4', label: 'L4 Integrity Simulator' },
  { id: 'L5', label: 'L5 Action Binder' },
];

export const WARNING_SEVERITY_SCORE = {
  critical: 95,
  high: 78,
  medium: 58,
  low: 35,
};

export const WARNING_DOMAIN_WEIGHT = {
  permission: 20,
  data_flow: 14,
  coherence: 10,
  completeness: 6,
};

export const WARNING_DOMAIN_LABEL = {
  permission: '권한/보안',
  data_flow: '데이터 흐름',
  coherence: '의도 정합',
  completeness: '완성도',
};

export const GATE_SCORE_THRESHOLD = 70;
export const GATE_STATUS_META = {
  blocked: {
    label: 'blocked',
    message: '고위험 경고가 남아 실행이 차단됩니다.',
  },
  review: {
    label: 'review',
    message: '차단은 아니지만 실행 전 검토가 필요한 경고가 있습니다.',
  },
  pass: {
    label: 'pass',
    message: '현재 고위험 경고가 없어 실행 가능합니다.',
  },
};

export const CTA_HISTORY_MAX_LENGTH = 80;
export const INTENT_FIELD_ORDER = ['who', 'when', 'what', 'why', 'success'];
export const INTENT_FIELD_LABELS = {
  who: '누가',
  when: '언제',
  what: '무엇을',
  why: '왜',
  success: '성공기준',
};

export const FILLER_PATTERN = /(미정|아직|tbd|todo|unknown|없음|미입력|추후|불명)/i;
export const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'will', 'have', 'has',
  '있는', '에서', '으로', '에게', '하기', '위해', '대한', '그리고', '또한', '기능', '화면',
  '사용자', '데이터', '정보', '처리', '단계', '기준', '가설', '정의', '요청', '변경',
]);
