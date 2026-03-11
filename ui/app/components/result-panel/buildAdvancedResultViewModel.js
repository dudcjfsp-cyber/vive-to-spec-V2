import {
  buildLogicMap,
  buildProblemFrame,
} from './builders';
import {
  isObject,
  toObjectArray,
  toStringArray,
  toText,
} from './utils';

function toObjectOrNull(value) {
  return isObject(value) ? value : null;
}

function toAction(value) {
  return typeof value === 'function' ? value : undefined;
}

function toPositiveNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildAdvancedResultViewModel({
  state,
  derived,
  personaCapabilities,
  selectedImplementationStack,
  onSelectImplementationStack,
  actions,
}) {
  const safeState = toObjectOrNull(state) || {};
  const safeDerived = toObjectOrNull(derived) || {};
  const safeActions = toObjectOrNull(actions) || {};
  const safePromptPolicyMeta = toObjectOrNull(safeDerived.promptPolicyMeta) || {};
  const safeValidationReport = toObjectOrNull(safeDerived.validationReport) || {};
  const safeClarifyLoop = toObjectOrNull(safeDerived.clarifyLoop) || {};
  const safeHybridStackGuide = toObjectOrNull(safeState.hybridStackGuide) || {};
  const safeStandardOutput = toObjectOrNull(safeDerived.standardOutput) || {};
  const safeRequestConverter = toObjectOrNull(safeStandardOutput.수정요청_변환) || {};
  const safeCompleteness = toObjectOrNull(safeStandardOutput.완성도_진단) || {};
  const blockingIssues = Array.isArray(safeValidationReport.blocking_issues)
    ? safeValidationReport.blocking_issues
    : [];
  const problemFrame = buildProblemFrame(safeStandardOutput);
  const logicMap = buildLogicMap(safeStandardOutput, problemFrame);

  return {
    session: {
      status: safeState.status || 'idle',
      activeModel: safeState.activeModel || '',
      vibe: safeState.vibe || '',
    },
    guide: {
      status: safeState.hybridStackGuideStatus || 'idle',
      data: toObjectOrNull(safeState.hybridStackGuide),
      frameCount: Array.isArray(safeHybridStackGuide.frames)
        ? safeHybridStackGuide.frames.filter((item) => isObject(item)).length
        : 0,
      selectedImplementationStack: toObjectOrNull(selectedImplementationStack),
    },
    artifacts: {
      standardOutput: toObjectOrNull(safeDerived.standardOutput),
      nondevSpec: safeDerived.nondevSpec || '',
      devSpec: safeDerived.devSpec || '',
      masterPrompt: safeDerived.masterPrompt || '',
    },
    workspaceSeed: {
      hypothesis: problemFrame,
      logicMap,
    },
    delivery: {
      todayActions: toStringArray(safeStandardOutput.오늘_할_일_3개),
      standardRequest: toText(safeRequestConverter.표준_요청),
      shortRequest: toText(safeRequestConverter.짧은_요청),
    },
    integritySource: {
      permissionRules: toObjectArray(safeStandardOutput.권한_규칙),
      schemaWarnings: toStringArray(safeCompleteness.누락_경고),
    },
    diagnostics: {
      promptPolicy: {
        sections: toStringArray(safePromptPolicyMeta.prompt_sections),
        mode: toText(safePromptPolicyMeta.prompt_policy_mode, 'baseline'),
        experimentId: toText(safePromptPolicyMeta.prompt_experiment_id, '-'),
        exampleMode: toText(safePromptPolicyMeta.example_mode, 'none'),
        positiveRewriteCount: toPositiveNumber(safePromptPolicyMeta.positive_rewrite_count),
      },
      validation: {
        hasData: isObject(safeDerived.validationReport),
        severity: toText(safeValidationReport.severity, 'low'),
        warnings: toStringArray(safeValidationReport.warnings).slice(0, 3),
        suggestedQuestions: toStringArray(safeValidationReport.suggested_questions).slice(0, 3),
        blockingIssues,
        blockingIssueCount: toPositiveNumber(safeValidationReport.blocking_issue_count, blockingIssues.length),
        warningCount: toPositiveNumber(safeValidationReport.warning_count),
        canAutoProceed: safeValidationReport.can_auto_proceed === true,
      },
      manualLoop: {
        questions: toStringArray(safeClarifyLoop.questions),
        answers: isObject(safeClarifyLoop.answers) ? safeClarifyLoop.answers : {},
        canSubmit: safeClarifyLoop.canSubmit === true,
      },
      clarifyApplyNotice: safeDerived.clarifyApplyNotice || '',
    },
    display: {
      personaCapabilities: toObjectOrNull(personaCapabilities) || {},
    },
    actions: {
      onRefreshHybrid: toAction(safeActions.handleRefreshHybrid),
      onSyncWarningToClarify: toAction(safeActions.syncWarningToClarifyLoop),
      onSetClarifyAnswer: toAction(safeActions.setClarifyAnswer),
      onRemoveClarifyQuestion: toAction(safeActions.removeClarifyQuestion),
      onApplyClarifications: toAction(safeActions.handleApplyClarifications),
      onClearClarifyQuestions: toAction(safeActions.clearClarifyQuestions),
      onSelectImplementationStack: toAction(onSelectImplementationStack),
    },
  };
}
