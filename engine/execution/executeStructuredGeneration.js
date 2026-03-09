function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSemanticHandoff(handoff) {
  const issues = Array.isArray(handoff?.issues)
    ? handoff.issues.filter((issue) => typeof issue === 'string' && issue.trim())
    : [];
  const issueCount = Number.isInteger(handoff?.issueCount) ? handoff.issueCount : issues.length;
  const hasIssues = typeof handoff?.hasIssues === 'boolean' ? handoff.hasIssues : issueCount > 0;

  return {
    issues,
    issueCount,
    hasIssues,
  };
}

export async function executeStructuredGeneration({
  runPromptAttempt,
  promptOptions = {},
  shouldUseAdvancedRepairs = false,
  collectSemanticHandoff,
  createSemanticRepairContext,
} = {}) {
  if (typeof runPromptAttempt !== 'function') {
    throw new Error('runPromptAttempt is required.');
  }
  if (typeof collectSemanticHandoff !== 'function') {
    throw new Error('collectSemanticHandoff is required.');
  }

  let currentAttempt = await runPromptAttempt(promptOptions);
  let repairMode = currentAttempt.parseRepairUsed ? 'json_repair' : 'none';
  let validationRetryCount = 0;
  let semanticHandoff = normalizeSemanticHandoff(collectSemanticHandoff(currentAttempt.parsed));

  if (shouldUseAdvancedRepairs && semanticHandoff.hasIssues && promptOptions.policyMode !== 'strict_format') {
    validationRetryCount += 1;
    currentAttempt = await runPromptAttempt({
      ...promptOptions,
      policyMode: 'strict_format',
    });
    repairMode = 'strict_format';
    semanticHandoff = normalizeSemanticHandoff(collectSemanticHandoff(currentAttempt.parsed));
  }

  if (shouldUseAdvancedRepairs && semanticHandoff.hasIssues) {
    if (typeof createSemanticRepairContext !== 'function') {
      throw new Error('createSemanticRepairContext is required for semantic repair.');
    }

    validationRetryCount += 1;
    currentAttempt = await runPromptAttempt({
      ...promptOptions,
      policyMode: 'semantic_repair',
      repairContext: createSemanticRepairContext(semanticHandoff, currentAttempt.parsed),
    });
    repairMode = 'semantic_repair';
    semanticHandoff = normalizeSemanticHandoff(collectSemanticHandoff(currentAttempt.parsed));
  }

  return {
    parsed: currentAttempt.parsed,
    promptMeta: isPlainObject(currentAttempt.promptMeta) ? currentAttempt.promptMeta : null,
    repairMode,
    fallbackApplied: repairMode !== 'none' || validationRetryCount > 0,
    validationRetryCount,
    semanticIssueCount: semanticHandoff.issueCount,
  };
}
