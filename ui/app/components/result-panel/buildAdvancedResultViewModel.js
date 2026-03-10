function toObjectOrNull(value) {
  return value && typeof value === 'object' ? value : null;
}

function toAction(value) {
  return typeof value === 'function' ? value : undefined;
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

  return {
    session: {
      status: safeState.status || 'idle',
      activeModel: safeState.activeModel || '',
      vibe: safeState.vibe || '',
    },
    guide: {
      status: safeState.hybridStackGuideStatus || 'idle',
      data: toObjectOrNull(safeState.hybridStackGuide),
      selectedImplementationStack: toObjectOrNull(selectedImplementationStack),
    },
    artifacts: {
      standardOutput: toObjectOrNull(safeDerived.standardOutput),
      nondevSpec: safeDerived.nondevSpec || '',
      devSpec: safeDerived.devSpec || '',
      masterPrompt: safeDerived.masterPrompt || '',
    },
    diagnostics: {
      promptPolicyMeta: toObjectOrNull(safeDerived.promptPolicyMeta),
      validationReport: toObjectOrNull(safeDerived.validationReport),
      clarifyLoop: toObjectOrNull(safeDerived.clarifyLoop),
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
