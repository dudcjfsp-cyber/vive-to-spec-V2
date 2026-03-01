const DEFAULT_POLICY_MODE = 'baseline';
const KNOWN_POLICY_MODES = new Set([
  'baseline',
  'beginner_zero_shot',
  'strict_format',
]);
const DEFAULT_SECTION_ORDER = ['role', 'constraints', 'schema', 'goal', 'runtime', 'user_vibe'];

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizePolicyMode(mode) {
  const normalized = toText(mode, DEFAULT_POLICY_MODE);
  return KNOWN_POLICY_MODES.has(normalized) ? normalized : DEFAULT_POLICY_MODE;
}

function applyPositiveRewrite(text) {
  const source = toText(text);
  if (!source) return { text: '', changed: false };

  const replacements = [
    {
      pattern: /\bdo not simply paraphrase the user vibe\b/gi,
      replacement: 'Translate the user vibe into concrete implementation steps instead of paraphrasing it',
    },
    {
      pattern: /\bdo not write long explanations\b/gi,
      replacement: 'Keep explanations concise and limited to 1~2 sentences',
    },
    {
      pattern: /원문을\s*단순\s*재진술하지\s*마라/gi,
      replacement: '원문을 구현 가능한 작업 단위로 구체화하라',
    },
    {
      pattern: /설명문을\s*길게\s*쓰지\s*마라/gi,
      replacement: '설명문은 핵심만 1~2문장으로 간결하게 작성하라',
    },
  ];

  let rewritten = source;
  let changed = false;

  replacements.forEach(({ pattern, replacement }) => {
    if (!pattern.test(rewritten)) return;
    rewritten = rewritten.replace(pattern, replacement);
    changed = true;
    pattern.lastIndex = 0;
  });

  return {
    text: rewritten,
    changed,
  };
}

function applyPositiveRewriteToLines(lines, enabled) {
  const safeLines = Array.isArray(lines) ? lines.map((item) => toText(item)).filter(Boolean) : [];
  if (!enabled) {
    return {
      lines: safeLines,
      count: 0,
    };
  }

  let count = 0;
  const rewritten = safeLines.map((line) => {
    const next = applyPositiveRewrite(line);
    if (next.changed) count += 1;
    return next.text;
  });

  return {
    lines: rewritten,
    count,
  };
}

function createBasePolicy(mode) {
  if (mode === 'beginner_zero_shot') {
    return {
      mode,
      allowExamples: false,
      exampleMode: 'none',
      positiveFirst: true,
      sectionOrder: DEFAULT_SECTION_ORDER.slice(),
      constraintLines: [
        'Do not simply paraphrase the user vibe.',
        '설명문을 길게 쓰지 마라.',
        'Always include concrete output shape, failure handling, and completion criteria when the request is abstract.',
      ],
      goalLines: [
        'Convert the user vibe into concrete implementation steps a beginner can execute immediately.',
        'State clear success conditions so the result can be verified without extra clarification.',
      ],
      exampleLines: [],
    };
  }

  if (mode === 'strict_format') {
    return {
      mode,
      allowExamples: true,
      exampleMode: 'minimal',
      positiveFirst: true,
      sectionOrder: DEFAULT_SECTION_ORDER.concat('examples'),
      constraintLines: [
        'Do not simply paraphrase the user vibe.',
        'Keep the output field order stable and aligned with the provided schema.',
        'Always include concrete output shape, failure handling, and completion criteria when the request is abstract.',
      ],
      goalLines: [
        'Convert the user vibe into an implementation-ready spec with predictable JSON formatting.',
        'Use the example only as a shape hint and keep the actual content grounded in the current request.',
      ],
      exampleLines: [
        '{"한_줄_요약":"요약","문제정의_5칸":{"누가":"사용자","언제":"상황","무엇을":"행동","왜":"목적","성공기준":"측정 기준"}}',
      ],
    };
  }

  return {
    mode: DEFAULT_POLICY_MODE,
    allowExamples: false,
    exampleMode: 'none',
    positiveFirst: false,
    sectionOrder: DEFAULT_SECTION_ORDER.slice(),
    constraintLines: [],
    goalLines: [],
    exampleLines: [],
  };
}

function formatBullets(lines, fallbackLine) {
  const safeLines = Array.isArray(lines) ? lines.filter(Boolean) : [];
  if (safeLines.length === 0) return `- ${fallbackLine}`;
  return safeLines.map((line) => `- ${line}`).join('\n');
}

export function rewriteInstructionsPositiveFirst(text) {
  return applyPositiveRewrite(text).text;
}

export function resolvePromptPolicy({ persona = '', mode = '', taskType = '' } = {}) {
  const explicitMode = normalizePolicyMode(mode);
  const normalizedPersona = toText(persona).toLowerCase();
  const normalizedTaskType = toText(taskType).toLowerCase();

  let resolvedMode = explicitMode;
  if (!mode) {
    if (normalizedTaskType === 'strict_format') {
      resolvedMode = 'strict_format';
    } else if (normalizedPersona === 'beginner') {
      resolvedMode = 'beginner_zero_shot';
    }
  }

  const basePolicy = createBasePolicy(resolvedMode);
  const rewrittenConstraints = applyPositiveRewriteToLines(
    basePolicy.constraintLines,
    basePolicy.positiveFirst,
  );
  const rewrittenGoals = applyPositiveRewriteToLines(
    basePolicy.goalLines,
    basePolicy.positiveFirst,
  );

  return {
    ...basePolicy,
    constraintLines: rewrittenConstraints.lines,
    goalLines: rewrittenGoals.lines,
    positiveRewriteCount: rewrittenConstraints.count + rewrittenGoals.count,
  };
}

export function buildPromptSections({
  vibe = '',
  schemaHint = '',
  baseSystemPrompt = '',
  policy = null,
  showThinking = true,
} = {}) {
  const resolvedPolicy = policy?.mode
    ? resolvePromptPolicy({ mode: policy.mode })
    : resolvePromptPolicy();
  const runtimeState = showThinking ? 'ON' : 'OFF';

  const sections = [
    {
      id: 'role',
      label: 'SYSTEM',
      content: toText(baseSystemPrompt),
    },
    {
      id: 'constraints',
      label: 'Hard constraints',
      content: formatBullets(
        resolvedPolicy.constraintLines,
        'Return JSON only, preserve the fixed schema, and keep the output concrete.',
      ),
    },
    {
      id: 'schema',
      label: 'Output schema shape',
      content: toText(schemaHint),
    },
    {
      id: 'goal',
      label: 'Goal and success conditions',
      content: formatBullets(
        resolvedPolicy.goalLines,
        'Convert the user vibe into a practical, implementation-ready standard output schema.',
      ),
    },
    {
      id: 'runtime',
      label: 'Runtime option',
      content: `- showThinking=${runtimeState}.`,
    },
    {
      id: 'user_vibe',
      label: 'User vibe',
      content: toText(vibe),
    },
  ];

  if (resolvedPolicy.allowExamples) {
    sections.push({
      id: 'examples',
      label: 'Optional examples',
      content: formatBullets(
        resolvedPolicy.exampleLines,
        'Keep examples minimal and use them only as a formatting hint.',
      ),
    });
  }

  return sections;
}

export function buildPromptPolicyMeta({
  vibe = '',
  persona = '',
  mode = '',
  policy = null,
  promptSections = [],
  positiveRewriteCount = 0,
  promptExperimentId = '',
} = {}) {
  const resolvedPolicy = policy?.mode
    ? resolvePromptPolicy({ mode: policy.mode })
    : resolvePromptPolicy({ persona, mode });
  const sectionIds = (Array.isArray(promptSections) ? promptSections : [])
    .map((section) => {
      if (typeof section === 'string') return toText(section);
      return toText(section?.id);
    })
    .filter(Boolean);

  return {
    policy_applied: resolvedPolicy.mode !== DEFAULT_POLICY_MODE,
    prompt_policy_mode: resolvedPolicy.mode,
    prompt_experiment_id: toText(promptExperimentId, `${resolvedPolicy.mode}_v1`),
    example_mode: resolvedPolicy.exampleMode,
    positive_rewrite_count: Number.isFinite(Number(positiveRewriteCount))
      ? Number(positiveRewriteCount)
      : 0,
    prompt_sections: sectionIds.length ? sectionIds : resolvedPolicy.sectionOrder.slice(),
    persona: toText(persona),
    source_vibe_length: toText(vibe).length,
  };
}
