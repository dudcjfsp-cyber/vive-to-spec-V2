import {
  getCoreChecklistIds,
  getCoreChecklistPromptLines,
} from '../../shared/corePromptChecklist.js';

const DEFAULT_POLICY_MODE = 'baseline';
const KNOWN_POLICY_MODES = new Set([
  'baseline',
  'beginner_zero_shot',
  'strict_format',
  'semantic_repair',
]);
const DEFAULT_SECTION_ORDER = [
  'role',
  'constraints',
  'schema',
  'goal',
  'core_checklist',
  'runtime',
  'user_vibe',
];

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
      replacement: 'Keep explanations concise and limited to 1-2 sentences',
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
        'Do not write long explanations.',
        'Always keep the response concrete, implementation-ready, and schema-safe.',
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
        'Always keep the response concrete, implementation-ready, and schema-safe.',
      ],
      goalLines: [
        'Convert the user vibe into an implementation-ready spec with predictable JSON formatting.',
        'Use the example only as a shape hint and keep the actual content grounded in the current request.',
      ],
      exampleLines: [
        '{"summary":"...","problem_frame":{"who":"...","what":"...","success":"..."}}',
      ],
    };
  }

  if (mode === 'semantic_repair') {
    return {
      mode,
      allowExamples: true,
      exampleMode: 'repair',
      positiveFirst: true,
      sectionOrder: DEFAULT_SECTION_ORDER.concat('examples'),
      constraintLines: [
        'Keep the output field order stable and aligned with the provided schema.',
        'Preserve valid details and only repair fields that are missing, vague, or contradictory.',
        'Resolve every listed semantic issue with concrete, implementation-ready content.',
      ],
      goalLines: [
        'Repair the existing JSON so the spec is concrete, complete, and internally consistent.',
        'Use the repair checklist as required fixes, not optional suggestions.',
      ],
      exampleLines: [
        '{"summary":"...","problem_frame":{"who":"...","what":"...","success":"..."}}',
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
    } else if (normalizedTaskType === 'semantic_repair') {
      resolvedMode = 'semantic_repair';
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
  const coreChecklistIds = getCoreChecklistIds();

  return {
    ...basePolicy,
    constraintLines: rewrittenConstraints.lines,
    goalLines: rewrittenGoals.lines,
    coreChecklistLines: basePolicy.mode === DEFAULT_POLICY_MODE ? [] : getCoreChecklistPromptLines(),
    coreChecklistIds,
    coreChecklistDelivery: basePolicy.mode === DEFAULT_POLICY_MODE ? 'baseline_only' : 'force_injected',
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
      id: 'core_checklist',
      label: 'Core implementation checklist',
      content: formatBullets(
        resolvedPolicy.coreChecklistLines,
        'Lock the input contract, permissions, failure handling, output contract, and acceptance checks before implementation.',
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
    core_checklist_delivery: resolvedPolicy.coreChecklistDelivery,
    core_checklist_ids: resolvedPolicy.coreChecklistIds.slice(),
    persona: toText(persona),
    source_vibe_length: toText(vibe).length,
  };
}
