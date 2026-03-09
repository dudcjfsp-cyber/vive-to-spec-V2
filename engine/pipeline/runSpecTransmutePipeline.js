function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

export async function runSpecTransmutePipeline({
  generateText,
  promptOptions = {},
  selectedModel = '',
  normalizedProvider = '',
  sourceVibe = '',
  executePromptRepairChain,
  normalizeResult,
} = {}) {
  if (typeof generateText !== 'function') {
    throw new Error('generateText is required.');
  }
  if (typeof executePromptRepairChain !== 'function') {
    throw new Error('executePromptRepairChain is required.');
  }
  if (typeof normalizeResult !== 'function') {
    throw new Error('normalizeResult is required.');
  }

  const repairResult = await executePromptRepairChain(generateText, promptOptions);

  return {
    ...normalizeResult(repairResult.parsed, selectedModel, {
      ...(isPlainObject(repairResult.promptMeta) ? repairResult.promptMeta : {}),
      repair_mode: repairResult.repairMode,
      fallback_applied: repairResult.fallbackApplied,
      validation_retry_count: repairResult.validationRetryCount,
      semantic_issue_count: repairResult.semanticIssueCount,
    }, sourceVibe),
    provider: normalizedProvider,
  };
}
