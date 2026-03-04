import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AX_LAYER_TABS, INTENT_FIELD_ORDER } from './result-panel/constants';
import {
  appendLine,
  deepClone,
  isObject,
  toStringArray,
  toText,
} from './result-panel/utils';
import {
  buildContextOutputs,
  buildLogicMap,
  buildProblemFrame,
} from './result-panel/builders';
import {
  buildL1Intelligence,
  buildL2Intelligence,
} from './result-panel/intelligence';
import {
  buildWarningSummary,
  buildIntegritySignals,
  buildWarnings,
  getGateStatusFromWarnings,
  sortWarningsByPriority,
} from './result-panel/integrity';
import { buildL1FocusGuideFromWarning } from './result-panel/focus-guide';
import {
  CtaHistoryPanel,
  L1HypothesisEditor,
  L2LogicMapper,
  L3ContextOptimizer,
  L4IntegritySimulator,
  L5ActionBinder,
  LayerTabButton,
  TextBlock,
} from './result-panel/Sections';
import HybridStackGuidePanel from './HybridStackGuidePanel';
import { useActionPackState } from './result-panel/hooks/useActionPackState.js';
import { useCtaHistory } from './result-panel/hooks/useCtaHistory.js';

function buildEmptyL1FocusGuide() {
  return {
    active: false,
    warningId: '',
    warningTitle: '',
    urgency: 'yellow',
    targetFields: [],
  };
}

export default function ResultPanel({
  status,
  errorMessage,
  activeModel,
  hybridStackGuideStatus,
  hybridStackGuide,
  vibe,
  standardOutput,
  nondevSpec,
  devSpec,
  masterPrompt,
  promptPolicyMeta,
  validationReport,
  clarifyLoop,
  personaCapabilities,
  onRefreshHybrid,
  onSyncWarningToClarify,
  onSetClarifyAnswer,
  onRemoveClarifyQuestion,
  onApplyClarifications,
  onClearClarifyQuestions,
}) {
  const safeCapabilities = isObject(personaCapabilities) ? personaCapabilities : {};
  const shouldShowAdvancedPromptPolicyMeta = safeCapabilities.showAdvancedPromptPolicyMeta === true;
  const shouldShowLayerPanels = safeCapabilities.showLayerPanels !== false;
  const shouldShowCtaHistory = safeCapabilities.showCtaHistory !== false;
  const shouldShowLegacyArtifacts = safeCapabilities.showLegacyArtifacts !== false;
  const shouldShowIntegrityWarningsExpanded = safeCapabilities.showIntegrityWarningsExpanded !== false;
  const isCompactIntegrityView = !shouldShowIntegrityWarningsExpanded;
  const promptSections = useMemo(
    () => toStringArray(promptPolicyMeta?.prompt_sections),
    [promptPolicyMeta],
  );
  const promptPolicyMode = toText(promptPolicyMeta?.prompt_policy_mode, 'baseline');
  const promptExperimentId = toText(promptPolicyMeta?.prompt_experiment_id, '-');
  const promptExampleMode = toText(promptPolicyMeta?.example_mode, 'none');
  const positiveRewriteCount = Number.isFinite(Number(promptPolicyMeta?.positive_rewrite_count))
    ? Number(promptPolicyMeta?.positive_rewrite_count)
    : 0;
  const shouldShowValidationMeta = safeCapabilities.showValidationMeta === true;
  const validationSeverity = toText(validationReport?.severity, 'low');
  const validationWarnings = useMemo(
    () => toStringArray(validationReport?.warnings).slice(0, 3),
    [validationReport],
  );
  const suggestedQuestions = useMemo(
    () => toStringArray(validationReport?.suggested_questions).slice(0, 3),
    [validationReport],
  );
  const manualLoopQuestions = useMemo(
    () => toStringArray(clarifyLoop?.questions),
    [clarifyLoop],
  );
  const manualLoopQuestionCount = manualLoopQuestions.length;
  const manualLoopAnswers = isObject(clarifyLoop?.answers) ? clarifyLoop.answers : {};
  const canSubmitManualLoop = clarifyLoop?.canSubmit === true;
  const blockingIssues = useMemo(
    () => Array.isArray(validationReport?.blocking_issues) ? validationReport.blocking_issues : [],
    [validationReport],
  );
  const canSyncToManualLoop = typeof onSyncWarningToClarify === 'function';

  // 1) Core panel state (L1~L5 interaction state + derived artifacts)
  const [activeLayer, setActiveLayer] = useState('L1');
  const [hypothesis, setHypothesis] = useState(buildProblemFrame({}));
  const [hypothesisConfirmed, setHypothesisConfirmed] = useState(false);
  const [hypothesisConfirmedStamp, setHypothesisConfirmedStamp] = useState('');
  const [logicMap, setLogicMap] = useState(buildLogicMap({}, buildProblemFrame({})));
  const [changedAxis, setChangedAxis] = useState('');
  const [syncHint, setSyncHint] = useState('');
  const [permissionGuardEnabled, setPermissionGuardEnabled] = useState(false);
  const [contextOutputs, setContextOutputs] = useState(
    buildContextOutputs({
      devSpec: '',
      nondevSpec: '',
      masterPrompt: '',
      hypothesis: buildProblemFrame({}),
      logicMap: buildLogicMap({}, buildProblemFrame({})),
    }),
  );
  const [exportStatus, setExportStatus] = useState('');
  const [resolvedWarningIds, setResolvedWarningIds] = useState([]);
  const [l1FocusGuide, setL1FocusGuide] = useState(buildEmptyL1FocusGuide());
  const [isSuggestedHypothesisPreviewOpen, setIsSuggestedHypothesisPreviewOpen] = useState(false);
  const [l1SuggestionStatus, setL1SuggestionStatus] = useState('');

  const {
    actionPack,
    actionPackPresetId,
    actionPackPresets,
    actionPackExportStatus,
    buildActionPackSnapshot,
    restoreActionPackSnapshot,
    resetActionPackState,
    changeActionPackPreset,
    buildAndStoreActionPack,
    exportCurrentActionPack,
  } = useActionPackState();

  // 2) Snapshot/rollback primitives for CTA reliability
  const buildPanelSnapshot = useCallback(() => ({
    activeLayer,
    hypothesis: deepClone(hypothesis),
    hypothesisConfirmed,
    hypothesisConfirmedStamp,
    logicMap: deepClone(logicMap),
    changedAxis,
    syncHint,
    permissionGuardEnabled,
    contextOutputs: deepClone(contextOutputs),
    exportStatus,
    resolvedWarningIds: deepClone(resolvedWarningIds),
    l1FocusGuide: deepClone(l1FocusGuide),
    isSuggestedHypothesisPreviewOpen,
    l1SuggestionStatus,
    ...buildActionPackSnapshot(),
  }), [
    activeLayer,
    buildActionPackSnapshot,
    changedAxis,
    contextOutputs,
    exportStatus,
    hypothesis,
    hypothesisConfirmed,
    hypothesisConfirmedStamp,
    isSuggestedHypothesisPreviewOpen,
    l1FocusGuide,
    l1SuggestionStatus,
    logicMap,
    permissionGuardEnabled,
    resolvedWarningIds,
    syncHint,
  ]);

  const restorePanelSnapshot = useCallback((snapshot) => {
    const safe = isObject(snapshot) ? snapshot : {};
    setActiveLayer(toText(safe.activeLayer, 'L1'));
    setHypothesis(isObject(safe.hypothesis) ? deepClone(safe.hypothesis) : buildProblemFrame({}));
    setHypothesisConfirmed(Boolean(safe.hypothesisConfirmed));
    setHypothesisConfirmedStamp(toText(safe.hypothesisConfirmedStamp));
    setLogicMap(isObject(safe.logicMap) ? deepClone(safe.logicMap) : buildLogicMap({}, buildProblemFrame({})));
    setChangedAxis(toText(safe.changedAxis));
    setSyncHint(toText(safe.syncHint));
    setPermissionGuardEnabled(Boolean(safe.permissionGuardEnabled));
    setContextOutputs(isObject(safe.contextOutputs)
      ? deepClone(safe.contextOutputs)
      : buildContextOutputs({
        devSpec,
        nondevSpec,
        masterPrompt,
        hypothesis: buildProblemFrame({}),
        logicMap: buildLogicMap({}, buildProblemFrame({})),
      }));
    setExportStatus(toText(safe.exportStatus));
    setResolvedWarningIds(Array.isArray(safe.resolvedWarningIds) ? deepClone(safe.resolvedWarningIds) : []);
    setL1FocusGuide(isObject(safe.l1FocusGuide) ? deepClone(safe.l1FocusGuide) : buildEmptyL1FocusGuide());
    setIsSuggestedHypothesisPreviewOpen(Boolean(safe.isSuggestedHypothesisPreviewOpen));
    setL1SuggestionStatus(toText(safe.l1SuggestionStatus));
    restoreActionPackSnapshot(safe);
  }, [devSpec, masterPrompt, nondevSpec, restoreActionPackSnapshot]);

  const {
    ctaHistory,
    runCtaAction,
    rollbackToHistory,
    resetCtaHistory,
  } = useCtaHistory({
    buildPanelSnapshot,
    restorePanelSnapshot,
    onActionFailure: (message) => {
      setExportStatus(`CTA 실행 실패: ${message}`);
    },
    onRollbackApplied: (target) => {
      setExportStatus(`롤백 적용: ${target.label} 이전 상태로 되돌렸습니다.`);
    },
  });

  // 3) Source payload hydration
  useEffect(() => {
    const safeSpec = isObject(standardOutput) ? standardOutput : {};
    const nextHypothesis = buildProblemFrame(safeSpec);
    const nextLogicMap = buildLogicMap(safeSpec, nextHypothesis);

    setHypothesis(nextHypothesis);
    setHypothesisConfirmed(false);
    setHypothesisConfirmedStamp('');
    setLogicMap(nextLogicMap);
    setChangedAxis('');
    setSyncHint('');
    setPermissionGuardEnabled(false);
    setContextOutputs(buildContextOutputs({
      devSpec,
      nondevSpec,
      masterPrompt,
      hypothesis: nextHypothesis,
      logicMap: nextLogicMap,
    }));
    setExportStatus('');
    setResolvedWarningIds([]);
    setL1FocusGuide(buildEmptyL1FocusGuide());
    setIsSuggestedHypothesisPreviewOpen(false);
    setL1SuggestionStatus('');
    resetActionPackState();
    resetCtaHistory();
    setActiveLayer('L1');
  }, [
    devSpec,
    masterPrompt,
    nondevSpec,
    resetActionPackState,
    resetCtaHistory,
    standardOutput,
  ]);

  const todayActions = useMemo(
    () => toStringArray(standardOutput?.오늘_할_일_3개),
    [standardOutput],
  );

  // 4) L1/L2 intelligence signals
  const l1Intelligence = useMemo(
    () => buildL1Intelligence({ vibeText: vibe, hypothesis }),
    [vibe, hypothesis],
  );
  const suggestedHypothesisDiffByField = useMemo(
    () => INTENT_FIELD_ORDER.reduce((acc, fieldId) => {
      const currentValue = toText(hypothesis[fieldId]);
      const inferredValue = toText(l1Intelligence?.inferredHypothesis?.[fieldId]);
      const isFocusedField = Boolean(l1FocusGuide?.active && l1FocusGuide.targetFields.includes(fieldId));
      const isLowConfidenceField = l1Intelligence?.lowConfidenceFields?.includes(fieldId);
      const shouldRecommend = isFocusedField || isLowConfidenceField || !currentValue;

      if (!shouldRecommend || !inferredValue || inferredValue === currentValue) return acc;
      acc[fieldId] = inferredValue;
      return acc;
    }, {}),
    [hypothesis, l1FocusGuide, l1Intelligence],
  );
  const suggestedHypothesisDiffCount = Object.keys(suggestedHypothesisDiffByField).length;
  const l2Intelligence = useMemo(
    () => buildL2Intelligence({ logicMap, changedAxis }),
    [logicMap, changedAxis],
  );
  const integritySignals = useMemo(() => buildIntegritySignals({
    standardOutput,
    permissionGuardEnabled,
    hypothesisWhat: hypothesis.what,
    logicText: logicMap.text,
    changedAxis,
    l1Intelligence,
    l2Intelligence,
  }), [
    standardOutput,
    permissionGuardEnabled,
    hypothesis.what,
    logicMap.text,
    changedAxis,
    l1Intelligence,
    l2Intelligence,
  ]);

  // 5) L4 warning graph and gate derivation
  const warnings = useMemo(() => buildWarnings({
    standardOutput,
    hypothesisConfirmed,
    changedAxis,
    l1Intelligence,
    l2Intelligence,
    integritySignals,
  }), [
    standardOutput,
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
  const visibleRemainingWarnings = isCompactIntegrityView
    ? unresolvedWarnings.slice(2)
    : remainingWarnings;
  const warningSummary = useMemo(
    () => buildWarningSummary(unresolvedWarnings),
    [unresolvedWarnings],
  );
  const gateStatus = useMemo(
    () => getGateStatusFromWarnings(unresolvedWarnings),
    [unresolvedWarnings],
  );

  const clearL1FocusGuide = () => {
    setL1FocusGuide(buildEmptyL1FocusGuide());
  };

  const resetSuggestedHypothesisPreview = () => {
    setIsSuggestedHypothesisPreviewOpen(false);
    setL1SuggestionStatus('');
  };

  // 6) Action handlers (CTA + warning operations)
  const markWarningResolved = (warningId) => {
    setResolvedWarningIds((prev) => (prev.includes(warningId) ? prev : [...prev, warningId]));
  };

  const confirmHypothesis = () => {
    runCtaAction({
      layerId: 'L1',
      actionId: 'confirm-hypothesis',
      label: '가설 확정',
      mutate: () => {
        setHypothesisConfirmed(true);
        setHypothesisConfirmedStamp(new Date().toLocaleTimeString('ko-KR', { hour12: false }));
        clearL1FocusGuide();
        resetSuggestedHypothesisPreview();
        markWarningResolved('intent-unconfirmed');
      },
    });
  };

  const getSyncHintByAxis = (axis) => {
    if (axis === 'text') return 'Text 변경을 DB/API/UI에 전파하세요.';
    if (axis === 'db') return 'DB 변경을 API 계약과 UI 입력 흐름에 반영하세요.';
    if (axis === 'api') return 'API 변경을 UI 호출과 Text 설명에 동기화하세요.';
    if (axis === 'ui') return 'UI 변경을 API 동작 및 Text 목표와 정합성 검토하세요.';
    return '';
  };

  const handleChangeHypothesis = (field, value) => {
    setHypothesis((prev) => ({ ...prev, [field]: value }));
    setHypothesisConfirmed(false);
    setHypothesisConfirmedStamp('');
    setL1FocusGuide((prev) => {
      if (!prev.active || !prev.targetFields.includes(field)) return prev;
      const remaining = prev.targetFields.filter((item) => item !== field);
      return remaining.length
        ? { ...prev, targetFields: remaining }
        : buildEmptyL1FocusGuide();
    });
    resetSuggestedHypothesisPreview();
    setResolvedWarningIds((prev) => prev.filter((id) => id !== 'intent-unconfirmed' && id !== 'intent-low-confidence'));
  };

  const previewSuggestedHypothesis = () => {
    runCtaAction({
      layerId: 'L1',
      actionId: 'preview-suggested-hypothesis',
      label: '추천 가설 보기',
      mutate: () => {
        setIsSuggestedHypothesisPreviewOpen(true);
        if (suggestedHypothesisDiffCount > 0) {
          setL1SuggestionStatus(`기존 값은 그대로 두고, 변경 예정 필드 ${suggestedHypothesisDiffCount}개를 아래에 미리 보여줍니다.`);
          return;
        }
        if (l1FocusGuide.active && l1FocusGuide.targetFields.length > 0) {
          setL1SuggestionStatus('자동으로 덮어쓸 추천값은 없지만, 강조된 필드는 직접 보완이 필요합니다.');
          return;
        }
        setL1SuggestionStatus('현재 입력값과 다른 추천 가설이 없어 그대로 유지됩니다.');
      },
    });
  };

  const applySuggestedHypothesis = () => {
    runCtaAction({
      layerId: 'L1',
      actionId: 'apply-suggested-hypothesis',
      label: '추천 가설 적용',
      mutate: () => {
        setHypothesis((prev) => ({
          ...prev,
          ...suggestedHypothesisDiffByField,
        }));
        setHypothesisConfirmed(false);
        setHypothesisConfirmedStamp('');
        clearL1FocusGuide();
        setIsSuggestedHypothesisPreviewOpen(false);
        setL1SuggestionStatus(
          suggestedHypothesisDiffCount > 0
            ? `추천 가설 ${suggestedHypothesisDiffCount}개 필드를 기존 값 위에 반영했습니다.`
            : '적용할 추천 변경값이 없어 기존 값을 그대로 유지했습니다.',
        );
        setResolvedWarningIds((prev) => prev.filter((id) => id !== 'intent-unconfirmed' && id !== 'intent-low-confidence'));
      },
    });
  };

  const handleChangeLogicAxis = (axis, value) => {
    setLogicMap((prev) => ({ ...prev, [axis]: value }));
    setChangedAxis(axis);
    setSyncHint(getSyncHintByAxis(axis));
    setResolvedWarningIds((prev) => prev.filter((id) => id !== 'data-flow-alignment'));
  };

  const applySync = () => {
    runCtaAction({
      layerId: 'L2',
      actionId: 'apply-sync',
      label: '연동 반영',
      meta: { axis: changedAxis || 'auto' },
      mutate: () => {
        setLogicMap((prev) => {
          if (!changedAxis) {
            return {
              text: appendLine(prev.text, '- [sync] 축 정합성 재평가 완료'),
              db: appendLine(prev.db, '- [sync] 데이터 필드 누락 점검 완료'),
              api: appendLine(prev.api, '- [sync] API 계약/권한 정합성 점검 완료'),
              ui: appendLine(prev.ui, '- [sync] UI 입력/출력 흐름 점검 완료'),
            };
          }

          if (changedAxis === 'text') {
            return {
              ...prev,
              db: appendLine(prev.db, '- [sync] 텍스트 변경 기반 필드 검토 필요'),
              api: appendLine(prev.api, '- [sync] 텍스트 변경 기반 API 계약 점검'),
              ui: appendLine(prev.ui, '- [sync] 텍스트 변경 기반 화면 문구 점검'),
            };
          }
          if (changedAxis === 'db') {
            return {
              ...prev,
              text: appendLine(prev.text, '- [sync] DB 축 변경이 반영되었습니다.'),
              api: appendLine(prev.api, '- [sync] DB 변경 기반 API 입력/응답 스키마 갱신'),
              ui: appendLine(prev.ui, '- [sync] DB 변경 기반 폼 필드 점검'),
            };
          }
          if (changedAxis === 'api') {
            return {
              ...prev,
              text: appendLine(prev.text, '- [sync] API 축 변경이 반영되었습니다.'),
              db: appendLine(prev.db, '- [sync] API 변경 기반 저장 필드 점검'),
              ui: appendLine(prev.ui, '- [sync] API 변경 기반 버튼/오류 처리 점검'),
            };
          }
          return {
            ...prev,
            text: appendLine(prev.text, '- [sync] UI 축 변경이 반영되었습니다.'),
            db: appendLine(prev.db, '- [sync] UI 변경 기반 데이터 수집 항목 점검'),
            api: appendLine(prev.api, '- [sync] UI 변경 기반 API 호출 흐름 점검'),
          };
        });

        setChangedAxis('');
        setSyncHint('');
        markWarningResolved('data-flow-alignment');
      },
    });
  };

  const handleExportContext = async () => runCtaAction({
    layerId: 'L3',
    actionId: 'export-context',
    label: 'AI 코딩 프롬프트 복사',
    mutate: async () => {
      const nextOutputs = buildContextOutputs({
        devSpec,
        nondevSpec,
        masterPrompt,
        hypothesis,
        logicMap,
      });
      setContextOutputs(nextOutputs);

      const aiCodingPrompt = toText(nextOutputs.aiCoding);

      if (!aiCodingPrompt) {
        setExportStatus('복사할 AI 코딩용 실행 프롬프트가 아직 없습니다.');
        return;
      }

      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        setExportStatus('클립보드 미지원 환경입니다. 화면 출력본을 그대로 사용하세요.');
        return;
      }

      try {
        await navigator.clipboard.writeText(aiCodingPrompt);
        setExportStatus('AI 코딩용 실행 프롬프트를 클립보드에 복사했습니다.');
      } catch {
        setExportStatus('AI 코딩용 실행 프롬프트 복사에 실패했습니다. 화면 출력본을 그대로 사용하세요.');
      }
    },
  });

  const applyPermissionGuard = () => {
    runCtaAction({
      layerId: 'L4',
      actionId: 'apply-permission-guard',
      label: '삭제 보호 적용',
      mutate: () => {
        setPermissionGuardEnabled(true);
        markWarningResolved('permission-delete');
        setLogicMap((prev) => ({
          ...prev,
          api: appendLine(prev.api, '- [guard] 삭제 동작은 사용자 승인 단계 이후로 제한'),
        }));
      },
    });
  };

  const alignIntentToSpec = () => {
    runCtaAction({
      layerId: 'L4',
      actionId: 'align-intent',
      label: '의도 반영',
      mutate: () => {
        setLogicMap((prev) => ({
          ...prev,
          text: appendLine(prev.text, `- 핵심 문제 정렬: ${hypothesis.what}`),
        }));
        markWarningResolved('intent-mismatch');
      },
    });
  };

  const sendWarningToClarifyLoop = (warning) => {
    if (!canSyncToManualLoop) return;

    runCtaAction({
      layerId: 'L4',
      actionId: 'send-to-clarify',
      label: '수동 루프로 보내기',
      meta: {
        warningId: warning?.id || '',
        existingQuestions: manualLoopQuestionCount,
      },
      mutate: () => {
        const syncedQuestions = onSyncWarningToClarify({
          source: 'result_panel_warning',
          warningId: warning?.id,
          warningDetail: warning?.detail,
        });
        if (Array.isArray(syncedQuestions) && syncedQuestions.length > 0) {
          setActiveLayer('L5');
          setExportStatus(`수동 루프 질문 ${syncedQuestions.length}개를 동기화했습니다.`);
        }
      },
    });
  };

  const handleWarningAction = (warningId, actionId) => {
    const targetWarning = warnings.find((warning) => warning.id === warningId);

    if (actionId === 'go-l1') {
      runCtaAction({
        layerId: 'L4',
        actionId: 'go-l1',
        label: 'L1 열기',
        meta: { warningId },
        mutate: () => {
          setActiveLayer('L1');
          if (targetWarning) {
            setL1FocusGuide(buildL1FocusGuideFromWarning({
              warning: targetWarning,
              l1LowConfidenceFields: l1Intelligence.lowConfidenceFields,
            }));
          } else {
            clearL1FocusGuide();
          }
        },
      });
      return;
    }
    if (actionId === 'go-l2') {
      runCtaAction({
        layerId: 'L4',
        actionId: 'go-l2',
        label: 'L2 열기',
        meta: { warningId },
        mutate: () => setActiveLayer('L2'),
      });
      return;
    }
    if (actionId === 'mark-resolved') {
      runCtaAction({
        layerId: 'L4',
        actionId: 'mark-resolved',
        label: '경고 확인 완료',
        meta: { warningId },
        mutate: () => markWarningResolved(warningId),
      });
      return;
    }
    if (actionId === 'confirm-intent') {
      confirmHypothesis();
      return;
    }
    if (actionId === 'apply-suggested-hypothesis') {
      applySuggestedHypothesis();
      return;
    }
    if (actionId === 'sync-apply') {
      applySync();
      return;
    }
    if (actionId === 'apply-permission-guard') {
      applyPermissionGuard();
      return;
    }
    if (actionId === 'align-intent') {
      alignIntentToSpec();
      return;
    }
    if (actionId === 'send-to-clarify') {
      sendWarningToClarifyLoop(targetWarning);
    }
  };

  const applyAutoFixes = () => {
    runCtaAction({
      layerId: 'L4',
      actionId: 'apply-auto-fixes',
      label: '자동 보정 제안 적용',
      meta: { topWarningCount: topWarnings.length },
      mutate: () => {
        topWarnings.forEach((warning) => {
          if (warning.autoAction) {
            handleWarningAction(warning.id, warning.autoAction);
          }
        });
      },
    });
  };

  const createActionPack = () => {
    if (gateStatus === 'blocked') return;
    runCtaAction({
      layerId: 'L5',
      actionId: 'create-action-pack',
      label: '실행 팩 생성',
      meta: { gateStatus, preset: actionPackPresetId },
      mutate: () => {
        buildAndStoreActionPack({
          contextOutputs,
          todayActions,
          activeModel,
          gateStatus,
        });
      },
    });
  };

  const syncSuggestedQuestionsToManualLoop = () => {
    if (!canSyncToManualLoop) return;

    runCtaAction({
      layerId: 'L5',
      actionId: 'sync-clarify-loop',
      label: '추천 질문 동기화',
      meta: {
        suggestedQuestions: suggestedQuestions.length,
        existingQuestions: manualLoopQuestionCount,
      },
      mutate: () => {
        const syncedQuestions = onSyncWarningToClarify({
          source: 'result_panel_l5',
          warningId: 'schema-0',
          warningDetail: `question sync ${validationWarnings.join(' | ')}`,
        });
        if (Array.isArray(syncedQuestions) && syncedQuestions.length > 0) {
          setExportStatus(`수동 루프 질문 ${syncedQuestions.length}개를 동기화했습니다.`);
        }
      },
    });
  };

  const exportActionPack = async () => runCtaAction({
    layerId: 'L5',
    actionId: 'export-action-pack',
    label: '실행 팩 복사',
    meta: { preset: actionPackPresetId },
    mutate: async () => {
      await exportCurrentActionPack();
    },
  });

  // 7) Status gating + render
  if (status === 'idle') {
    return (
      <section className="panel status-only">
        <p>요구사항을 입력하면 스펙 생성을 시작합니다.</p>
      </section>
    );
  }

  if (status === 'processing') {
    return (
      <section className="panel status-only">
        <p>스펙 생성 중...</p>
      </section>
    );
  }

  if (status === 'error') {
    return (
      <section className="panel status-only">
        <p>오류: {errorMessage || '알 수 없는 오류'}</p>
      </section>
    );
  }

  return (
    <section className="result-panel">
      <div className="status-bar">
        <strong>모델:</strong> {activeModel}
        {' | '}
        <strong>하이브리드 스택:</strong> {hybridStackGuideStatus}
        <button type="button" className="btn btn-ghost" onClick={onRefreshHybrid}>
          하이브리드 가이드 새로고침
        </button>
      </div>

      {(hybridStackGuideStatus !== 'idle' || hybridStackGuide) && (
        <section className="panel hybrid-guide-wrap">
          <HybridStackGuidePanel
            guide={hybridStackGuide}
            status={hybridStackGuideStatus}
          />
        </section>
      )}

      {shouldShowAdvancedPromptPolicyMeta && (
        <section className="panel">
          <h2>Prompt Policy</h2>
          <div className="signal-pills">
            <span className="pill">mode: {promptPolicyMode}</span>
            <span className="pill">experiment: {promptExperimentId}</span>
            <span className="pill">example: {promptExampleMode}</span>
            <span className="pill">positive rewrite: {positiveRewriteCount}</span>
          </div>
          <p className="small-muted">
            sections: {promptSections.length > 0 ? promptSections.join(' -> ') : '-'}
          </p>
        </section>
      )}

      {shouldShowValidationMeta && validationReport && (
        <section className="panel">
          <h2>Validation Report</h2>
          <div className="signal-pills">
            <span className="pill">severity: {validationSeverity}</span>
            <span className="pill">blocking: {Number(validationReport?.blocking_issue_count || 0)}</span>
            <span className="pill">warnings: {Number(validationReport?.warning_count || 0)}</span>
            <span className="pill">auto proceed: {validationReport?.can_auto_proceed ? 'yes' : 'no'}</span>
          </div>
          {validationWarnings.length > 0 && (
            <div>
              <strong>상위 경고</strong>
              <ul>
                {validationWarnings.map((warning, idx) => (
                  <li key={`${warning}-${idx}`}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          {suggestedQuestions.length > 0 && (
            <div>
              <strong>추천 보완 질문</strong>
              <ol>
                {suggestedQuestions.map((question, idx) => (
                  <li key={`${question}-${idx}`}>{question}</li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}

      {shouldShowLayerPanels && (
        <section className="panel layer-panel">
          <h2>Layer Tab (AX)</h2>
          <p className="layer-panel-intro">탭에서 읽고 복사하는 흐름이 아니라, 확인/수정/적용 중심으로 동작합니다.</p>

          <div className="layer-tabs">
            {AX_LAYER_TABS.map((tab) => (
              <LayerTabButton key={tab.id} tab={tab} activeLayer={activeLayer} onSelect={setActiveLayer} />
            ))}
          </div>

          <div className="layer-content">
          {activeLayer === 'L1' && (
            <L1HypothesisEditor
              hypothesis={hypothesis}
              onChangeHypothesis={handleChangeHypothesis}
              l1Intelligence={l1Intelligence}
              l1FocusGuide={l1FocusGuide}
              hypothesisConfirmed={hypothesisConfirmed}
              hypothesisConfirmedStamp={hypothesisConfirmedStamp}
              suggestionPreviewOpen={isSuggestedHypothesisPreviewOpen}
              suggestionStatus={l1SuggestionStatus}
              suggestedHypothesisDiffByField={suggestedHypothesisDiffByField}
              onConfirmHypothesis={confirmHypothesis}
              onPreviewSuggestedHypothesis={previewSuggestedHypothesis}
              onApplySuggestedHypothesis={applySuggestedHypothesis}
              onClearL1FocusGuide={clearL1FocusGuide}
            />
          )}
          {activeLayer === 'L2' && (
            <L2LogicMapper
              logicMap={logicMap}
              changedAxis={changedAxis}
              syncHint={syncHint}
              l2Intelligence={l2Intelligence}
              onChangeLogicAxis={handleChangeLogicAxis}
              onApplySync={applySync}
            />
          )}
          {activeLayer === 'L3' && (
            <L3ContextOptimizer
              contextOutputs={contextOutputs}
              exportStatus={exportStatus}
              onExportContext={handleExportContext}
            />
          )}
          {activeLayer === 'L4' && (
            <L4IntegritySimulator
              gateStatus={gateStatus}
              integritySignals={integritySignals}
              topWarnings={visibleTopWarnings}
              remainingWarnings={visibleRemainingWarnings}
              warningSummary={warningSummary}
              compactMode={isCompactIntegrityView}
              canSyncToManualLoop={canSyncToManualLoop}
              onWarningAction={handleWarningAction}
              onApplyAutoFixes={applyAutoFixes}
            />
          )}
          {activeLayer === 'L5' && (
            <L5ActionBinder
              todayActions={todayActions}
              gateStatus={gateStatus}
              actionPack={actionPack}
              actionPackPresetId={actionPackPresetId}
              actionPackPresets={actionPackPresets}
              actionPackExportStatus={actionPackExportStatus}
              validationSeverity={validationSeverity}
              blockingIssues={blockingIssues}
              clarifyQuestions={manualLoopQuestions}
              clarifyAnswers={manualLoopAnswers}
              canSubmitClarifications={canSubmitManualLoop}
              isProcessing={status === 'processing'}
              canSyncToManualLoop={canSyncToManualLoop}
              onChangeActionPackPreset={changeActionPackPreset}
              onCreateActionPack={createActionPack}
              onExportActionPack={exportActionPack}
              onSyncToManualLoop={syncSuggestedQuestionsToManualLoop}
              onSetClarifyAnswer={onSetClarifyAnswer}
              onRemoveClarifyQuestion={onRemoveClarifyQuestion}
              onApplyClarifications={onApplyClarifications}
              onClearClarifyQuestions={onClearClarifyQuestions}
            />
          )}
          </div>
        </section>
      )}

      {shouldShowCtaHistory && (
        <CtaHistoryPanel
          entries={ctaHistory}
          onRollback={rollbackToHistory}
        />
      )}

      {shouldShowLegacyArtifacts && (
        <details className="legacy-details">
          <summary>기존 산출물 보기</summary>
          <TextBlock title="Non-dev Spec" value={nondevSpec} />
          <TextBlock title="Dev Spec" value={devSpec} />
          <TextBlock title="Master Prompt" value={masterPrompt} />
        </details>
      )}
    </section>
  );
}
