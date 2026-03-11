import { useMemo } from 'react';
import { INTENT_FIELD_ORDER } from '../constants';
import { buildPreferredStackRequestLine } from '../builders';
import {
  buildL1Intelligence,
  buildL2Intelligence,
  buildSuggestionInputExamples,
} from '../intelligence';
import {
  buildIntegritySignals,
  buildWarningSummary,
  buildWarnings,
  getGateStatusFromWarnings,
  sortWarningsByPriority,
} from '../integrity';
import {
  isObject,
  toStringArray,
  toText,
} from '../utils';

export function useResultPanelDerived({
  personaCapabilities,
  promptPolicy,
  validation,
  manualLoop,
  onSyncWarningToClarify,
  hybridGuideFrameCount,
  delivery,
  integritySource,
  contextOutputs,
  selectedImplementationStack,
  vibe,
  hypothesis,
  l1FocusGuide,
  isSuggestedHypothesisPreviewOpen,
  logicMap,
  changedAxis,
  permissionGuardEnabled,
  hypothesisConfirmed,
  resolvedWarningIds,
}) {
  const safeCapabilities = isObject(personaCapabilities) ? personaCapabilities : {};
  const safePromptPolicy = isObject(promptPolicy) ? promptPolicy : {};
  const safeValidation = isObject(validation) ? validation : {};
  const safeManualLoop = isObject(manualLoop) ? manualLoop : {};
  const safeDelivery = isObject(delivery) ? delivery : {};

  const shouldShowAdvancedPromptPolicyMeta = safeCapabilities.showAdvancedPromptPolicyMeta === true;
  const shouldShowLayerPanels = safeCapabilities.showLayerPanels !== false;
  const shouldShowCtaHistory = safeCapabilities.showCtaHistory !== false;
  const shouldShowIntegrityWarningsExpanded = safeCapabilities.showIntegrityWarningsExpanded !== false;
  const isCompactIntegrityView = !shouldShowIntegrityWarningsExpanded;
  const shouldShowValidationMeta = safeCapabilities.showValidationMeta === true;
  const shouldShowCompactDeliveryPanel = safeCapabilities.showCompactDeliveryPanel === true;
  const shouldAllowIntegrityActions = safeCapabilities.allowIntegrityActions !== false;
  const shouldAllowExecutionActions = safeCapabilities.allowExecutionActions !== false;
  const shouldShowLayerL1Panel = safeCapabilities.showLayerL1Panel !== false;
  const shouldShowLayerL2Panel = safeCapabilities.showLayerL2Panel !== false;
  const shouldShowLayerOutputPanel = safeCapabilities.showLayerOutputPanel !== false;
  const shouldCollapseSupplementaryPanels = shouldShowCompactDeliveryPanel;

  const promptSections = useMemo(
    () => toStringArray(safePromptPolicy.sections),
    [safePromptPolicy],
  );
  const promptPolicyMode = toText(safePromptPolicy.mode, 'baseline');
  const promptExperimentId = toText(safePromptPolicy.experimentId, '-');
  const promptExampleMode = toText(safePromptPolicy.exampleMode, 'none');
  const positiveRewriteCount = Number.isFinite(Number(safePromptPolicy.positiveRewriteCount))
    ? Number(safePromptPolicy.positiveRewriteCount)
    : 0;

  const validationSeverity = toText(safeValidation.severity, 'low');
  const validationWarnings = useMemo(
    () => toStringArray(safeValidation.warnings).slice(0, 3),
    [safeValidation],
  );
  const suggestedQuestions = useMemo(
    () => toStringArray(safeValidation.suggestedQuestions).slice(0, 3),
    [safeValidation],
  );
  const manualLoopQuestions = useMemo(
    () => toStringArray(safeManualLoop.questions),
    [safeManualLoop],
  );
  const manualLoopQuestionCount = manualLoopQuestions.length;
  const manualLoopAnswers = isObject(safeManualLoop.answers) ? safeManualLoop.answers : {};
  const canSubmitManualLoop = safeManualLoop.canSubmit === true;
  const blockingIssues = useMemo(
    () => (Array.isArray(safeValidation.blockingIssues) ? safeValidation.blockingIssues : []),
    [safeValidation],
  );
  const canSyncToManualLoop = typeof onSyncWarningToClarify === 'function';
  const safeHybridGuideFrameCount = Number.isFinite(Number(hybridGuideFrameCount))
    ? Number(hybridGuideFrameCount)
    : 0;

  const todayActions = useMemo(
    () => toStringArray(safeDelivery.todayActions),
    [safeDelivery],
  );

  const compactRequest = useMemo(() => {
    const standardRequest = toText(safeDelivery.standardRequest);
    const baseRequest = standardRequest || toText(safeDelivery.shortRequest, contextOutputs.aiCoding);
    const stackRequestLine = buildPreferredStackRequestLine(selectedImplementationStack);

    if (stackRequestLine && baseRequest) {
      return `${stackRequestLine}\n${baseRequest}`;
    }

    return stackRequestLine || baseRequest;
  }, [contextOutputs.aiCoding, safeDelivery, selectedImplementationStack]);

  const l1Intelligence = useMemo(
    () => buildL1Intelligence({ vibeText: vibe, hypothesis }),
    [vibe, hypothesis],
  );

  const suggestedHypothesisDiffByField = useMemo(
    () => {
      const focusTargets = Array.isArray(l1FocusGuide?.targetFields) ? l1FocusGuide.targetFields : [];
      const lowConfidenceFields = Array.isArray(l1Intelligence?.lowConfidenceFields)
        ? l1Intelligence.lowConfidenceFields
        : [];

      return INTENT_FIELD_ORDER.reduce((acc, fieldId) => {
        const currentValue = toText(hypothesis[fieldId]);
        const inferredValue = toText(l1Intelligence?.inferredHypothesis?.[fieldId]);
        const isFocusedField = Boolean(l1FocusGuide?.active && focusTargets.includes(fieldId));
        const isLowConfidenceField = lowConfidenceFields.includes(fieldId);
        const shouldRecommend = isFocusedField || isLowConfidenceField || !currentValue;

        if (!shouldRecommend || !inferredValue || inferredValue === currentValue) return acc;
        acc[fieldId] = inferredValue;
        return acc;
      }, {});
    },
    [hypothesis, l1FocusGuide, l1Intelligence],
  );
  const suggestedHypothesisDiffCount = Object.keys(suggestedHypothesisDiffByField).length;
  const shouldShowSuggestionInputGuide = isSuggestedHypothesisPreviewOpen && suggestedHypothesisDiffCount === 0;
  const suggestionInputExamples = useMemo(
    () => buildSuggestionInputExamples({
      vibeText: vibe,
      inferredHypothesis: l1Intelligence?.inferredHypothesis,
    }),
    [l1Intelligence, vibe],
  );

  const l2Intelligence = useMemo(
    () => buildL2Intelligence({ logicMap, changedAxis }),
    [logicMap, changedAxis],
  );
  const integritySignals = useMemo(() => buildIntegritySignals({
    integritySource,
    permissionGuardEnabled,
    hypothesisWhat: hypothesis.what,
    logicText: logicMap.text,
    changedAxis,
    l1Intelligence,
    l2Intelligence,
  }), [
    integritySource,
    permissionGuardEnabled,
    hypothesis.what,
    logicMap.text,
    changedAxis,
    l1Intelligence,
    l2Intelligence,
  ]);

  const warnings = useMemo(() => buildWarnings({
    integritySource,
    hypothesisConfirmed,
    changedAxis,
    l1Intelligence,
    l2Intelligence,
    integritySignals,
  }), [
    integritySource,
    hypothesisConfirmed,
    changedAxis,
    l1Intelligence,
    l2Intelligence,
    integritySignals,
  ]);

  const unresolvedWarnings = useMemo(
    () => sortWarningsByPriority(warnings.filter((warning) => !resolvedWarningIds.includes(warning.id))),
    [warnings, resolvedWarningIds],
  );
  const topWarnings = unresolvedWarnings.slice(0, 3);
  const remainingWarnings = unresolvedWarnings.slice(3);
  const visibleTopWarnings = isCompactIntegrityView ? unresolvedWarnings.slice(0, 2) : topWarnings;
  const visibleRemainingWarnings = isCompactIntegrityView ? unresolvedWarnings.slice(2) : remainingWarnings;
  const warningSummary = useMemo(
    () => buildWarningSummary(unresolvedWarnings),
    [unresolvedWarnings],
  );
  const gateStatus = useMemo(
    () => getGateStatusFromWarnings(unresolvedWarnings),
    [unresolvedWarnings],
  );

  return {
    shouldShowAdvancedPromptPolicyMeta,
    shouldShowLayerPanels,
    shouldShowCtaHistory,
    isCompactIntegrityView,
    promptSections,
    promptPolicyMode,
    promptExperimentId,
    promptExampleMode,
    positiveRewriteCount,
    shouldShowValidationMeta,
    shouldShowCompactDeliveryPanel,
    shouldAllowIntegrityActions,
    shouldAllowExecutionActions,
    shouldShowLayerL1Panel,
    shouldShowLayerL2Panel,
    shouldShowLayerOutputPanel,
    shouldCollapseSupplementaryPanels,
    validationSeverity,
    validationWarnings,
    suggestedQuestions,
    manualLoopQuestions,
    manualLoopQuestionCount,
    manualLoopAnswers,
    canSubmitManualLoop,
    blockingIssues,
    canSyncToManualLoop,
    hybridGuideFrameCount: safeHybridGuideFrameCount,
    todayActions,
    compactRequest,
    l1Intelligence,
    suggestedHypothesisDiffByField,
    suggestedHypothesisDiffCount,
    shouldShowSuggestionInputGuide,
    suggestionInputExamples,
    l2Intelligence,
    integritySignals,
    warnings,
    unresolvedWarnings,
    topWarnings,
    remainingWarnings,
    visibleTopWarnings,
    visibleRemainingWarnings,
    warningSummary,
    gateStatus,
  };
}
