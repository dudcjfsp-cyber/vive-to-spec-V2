import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchAvailableModels,
  getProviderDisplayName,
  recommendHybridStacks,
  SUPPORTED_MODEL_PROVIDERS,
  transmuteVibeToSpec,
} from '../../../adapters/LLMAdapter';
import {
  API_KEY_TTL_MS,
  clearStoredApiKey,
  getApiKeySavedAtStorageKey,
  getStoredApiKey,
  getStoredProvider,
  isApiKeyExpired,
  normalizeProvider,
  persistApiKeyToSession,
  persistProviderToSession,
} from '../services/sessionStore';
import {
  buildClarifiedVibe,
  buildWarningDrivenQuestions,
  mergeClarificationQuestions,
} from '../services/clarifyLoop';
import {
  buildClarifyAnsweredShadowPayload,
  buildClarifyStartedShadowPayload,
  buildGeneratedResultPlan,
  buildPromptExperimentId,
  buildTransmuteSuccessShadowPayload,
} from '../services/transmuteFlow.js';
import { initializeSpecState, shadowWriteSpecState } from '../services/specStateShadow';
import { resolvePersonaRuntimeConfig } from '../persona/presets';
import { REQUIRES_USER_API_KEY } from '../config/runtime.js';

function getSafeModelName(value, fallback = 'OFFLINE') {
  const text = String(value || '').trim();
  return text ? text.toUpperCase() : fallback;
}

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function toStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => toText(item))
    .filter(Boolean);
}

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function buildGenerationRequestMeta(resolvedPersona) {
  return {
    promptPolicyMode: String(resolvedPersona?.promptPolicyMode || 'baseline'),
    promptExperimentId: buildPromptExperimentId(resolvedPersona),
    personaId: String(resolvedPersona?.id === 'default' ? '' : (resolvedPersona?.id || '')),
  };
}

export function useAppController({ personaConfig = null } = {}) {
  const resolvedPersona = useMemo(
    () => resolvePersonaRuntimeConfig(personaConfig),
    [personaConfig],
  );
  const [vibe, setVibe] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [apiProvider, setApiProvider] = useState(() => getStoredProvider(SUPPORTED_MODEL_PROVIDERS));
  const [apiKey, setApiKey] = useState(() => getStoredApiKey(getStoredProvider(SUPPORTED_MODEL_PROVIDERS), SUPPORTED_MODEL_PROVIDERS));
  const [tempKey, setTempKey] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => (REQUIRES_USER_API_KEY
    ? !getStoredApiKey(getStoredProvider(SUPPORTED_MODEL_PROVIDERS), SUPPORTED_MODEL_PROVIDERS)
    : false));
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelOptionsLoading, setIsModelOptionsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('OFFLINE');
  const [showThinking, setShowThinking] = useState(true);
  const [hybridStackGuide, setHybridStackGuide] = useState(null);
  const [hybridStackGuideStatus, setHybridStackGuideStatus] = useState('idle');
  const [clarifyQuestions, setClarifyQuestions] = useState([]);
  const [clarifyAnswers, setClarifyAnswers] = useState({});
  const [clarifyLoopTurn, setClarifyLoopTurn] = useState(0);
  const [clarifyApplyNotice, setClarifyApplyNotice] = useState('');
  const requiresUserApiKey = REQUIRES_USER_API_KEY;
  const hasApiAccess = requiresUserApiKey ? Boolean(apiKey) : true;

  const providerOptions = useMemo(
    () => SUPPORTED_MODEL_PROVIDERS.map((id) => ({ id, label: getProviderDisplayName(id) })),
    [],
  );

  const setVibeAndResetClarifyNotice = useCallback((nextVibe) => {
    setVibe(nextVibe);
    setClarifyApplyNotice('');
  }, []);

  const getSavedApiKeyTimestamp = useCallback(
    () => Number(sessionStorage.getItem(getApiKeySavedAtStorageKey(apiProvider, SUPPORTED_MODEL_PROVIDERS))),
    [apiProvider],
  );

  const clearExpiredApiKeyState = useCallback((message = '') => {
    if (!requiresUserApiKey) return;

    clearStoredApiKey(apiProvider, SUPPORTED_MODEL_PROVIDERS);
    setApiKey('');
    setIsSettingsOpen(true);
    if (message) {
      setErrorMessage(message);
    }
    setActiveModel('OFFLINE');
  }, [apiProvider, requiresUserApiKey]);

  const ensureApiKeyNotExpired = useCallback((message = '') => {
    if (!requiresUserApiKey) return true;
    if (!isApiKeyExpired(getSavedApiKeyTimestamp())) return true;
    clearExpiredApiKeyState(message);
    return false;
  }, [clearExpiredApiKeyState, getSavedApiKeyTimestamp, requiresUserApiKey]);

  const applyGenerationErrorState = useCallback((error) => {
    setStatus('error');
    setActiveModel('LINK FAILURE');
    setHybridStackGuide(null);
    setHybridStackGuideStatus('error');
    setErrorMessage(error instanceof Error ? error.message : '알 수 없는 변환 오류입니다.');
  }, []);

  const resetModelState = useCallback(() => {
    setModelOptions([]);
    setSelectedModel('');
    setActiveModel('OFFLINE');
  }, []);

  const resetClarifyLoop = useCallback(() => {
    setClarifyQuestions([]);
    setClarifyAnswers({});
    setClarifyLoopTurn(0);
    setClarifyApplyNotice('');
  }, []);

  const applyClarifyQuestionSet = useCallback((nextQuestions) => {
    const normalizedQuestions = toStringArray(nextQuestions);

    setClarifyQuestions(normalizedQuestions);
    setClarifyAnswers((previous) => normalizedQuestions.reduce((acc, question) => {
      if (Object.prototype.hasOwnProperty.call(previous, question)) {
        acc[question] = previous[question];
      }
      return acc;
    }, {}));

    return normalizedQuestions;
  }, []);

  const loadModelOptions = useCallback(async (nextApiKey, nextProvider) => {
    setIsModelOptionsLoading(true);
    try {
      const fetchedModels = await fetchAvailableModels(nextApiKey, { provider: nextProvider });
      const uniqueModels = Array.from(new Set(
        (Array.isArray(fetchedModels) ? fetchedModels : [])
          .map((item) => String(item || '').trim())
          .filter(Boolean),
      ));

      setModelOptions(uniqueModels);
      setSelectedModel((prev) => (prev && uniqueModels.includes(prev) ? prev : (uniqueModels[0] || '')));
    } catch {
      setModelOptions([]);
      setSelectedModel('');
    } finally {
      setIsModelOptionsLoading(false);
    }
  }, [requiresUserApiKey]);

  const requestHybridStackGuide = useCallback(async (nextResult, nextVibe) => {
    const standardOutput = nextResult?.standard_output;
    if (!standardOutput || (requiresUserApiKey && !apiKey)) {
      setHybridStackGuide(null);
      setHybridStackGuideStatus('error');
      return;
    }

    setHybridStackGuideStatus('loading');
    try {
      const guide = await recommendHybridStacks(nextVibe, standardOutput, apiKey, {
        provider: apiProvider,
        modelName: selectedModel,
      });
      setHybridStackGuide(guide);
      setHybridStackGuideStatus('success');
      shadowWriteSpecState({
        type: 'hybrid_stack_success',
        currentNodeId: 'hybrid_stack_success',
        answersPatch: {
          last_hybrid_model: String(guide?.model || selectedModel || ''),
        },
        payload: {
          provider: apiProvider,
          model: String(guide?.model || selectedModel || ''),
        },
      });
    } catch {
      setHybridStackGuide(null);
      setHybridStackGuideStatus('error');
      shadowWriteSpecState({
        type: 'hybrid_stack_error',
        currentNodeId: 'hybrid_stack_error',
        payload: {
          provider: apiProvider,
          model: String(selectedModel || ''),
        },
      });
    }
  }, [apiKey, apiProvider, requiresUserApiKey, selectedModel]);

  const handleRefreshHybrid = useCallback(() => {
    if (!result) return;
    void requestHybridStackGuide(result, vibe);
  }, [requestHybridStackGuide, result, vibe]);

  const setClarifyAnswer = useCallback((question, value) => {
    const normalizedQuestion = toText(question);
    if (!normalizedQuestion) return;

    setClarifyAnswers((previous) => ({
      ...previous,
      [normalizedQuestion]: String(value || ''),
    }));
  }, []);

  const removeClarifyQuestion = useCallback((question) => {
    const normalizedQuestion = toText(question);
    if (!normalizedQuestion) return;

    const nextQuestions = clarifyQuestions.filter((item) => item !== normalizedQuestion);
    const nextAnswers = { ...clarifyAnswers };
    delete nextAnswers[normalizedQuestion];

    setClarifyQuestions(nextQuestions);
    setClarifyAnswers(nextAnswers);

    shadowWriteSpecState({
      type: 'clarify_skipped',
      currentNodeId: 'clarify_skipped',
      clarificationAnswersPatch: nextAnswers,
      pendingQuestions: nextQuestions,
      loopTurn: clarifyLoopTurn,
      payload: {
        skipped_question: normalizedQuestion,
        remaining_questions: nextQuestions.length,
      },
    });
  }, [clarifyAnswers, clarifyLoopTurn, clarifyQuestions]);

  const clearClarifyQuestions = useCallback(() => {
    if (clarifyQuestions.length === 0) return;

    setClarifyQuestions([]);
    setClarifyAnswers({});

    shadowWriteSpecState({
      type: 'clarify_skipped',
      currentNodeId: 'clarify_skipped',
      pendingQuestions: [],
      loopTurn: clarifyLoopTurn,
      payload: {
        reason: 'manual_clear',
        skipped_count: clarifyQuestions.length,
      },
    });
  }, [clarifyLoopTurn, clarifyQuestions]);

  const syncWarningToClarifyLoop = useCallback((warningContext = {}) => {
    if (resolvedPersona.capabilities.loopMode !== 'manual') return [];

    const validationReport = isPlainObject(result?.validation_report) ? result.validation_report : null;
    const warningQuestions = buildWarningDrivenQuestions({
      warningId: warningContext?.warningId,
      warningDetail: warningContext?.warningDetail,
      validationReport,
      maxQuestions: 3,
    });
    const shouldPrioritizeIncoming = toText(warningContext?.source) === 'result_panel_warning';
    const nextQuestions = mergeClarificationQuestions(
      shouldPrioritizeIncoming ? warningQuestions : clarifyQuestions,
      shouldPrioritizeIncoming ? clarifyQuestions : warningQuestions,
      3,
    );

    if (nextQuestions.length === 0) return [];
    if (nextQuestions.length === clarifyQuestions.length
      && nextQuestions.every((question, index) => question === clarifyQuestions[index])) {
      return nextQuestions;
    }

    applyClarifyQuestionSet(nextQuestions);
    shadowWriteSpecState({
      type: 'clarify_adjusted',
      currentNodeId: 'clarify_adjusted',
      pendingQuestions: nextQuestions,
      loopTurn: clarifyLoopTurn,
      payload: {
        reason: toText(warningContext?.source, 'warning_action'),
        warning_id: toText(warningContext?.warningId),
        added_question_count: Math.max(0, nextQuestions.length - clarifyQuestions.length),
      },
    });

    return nextQuestions;
  }, [
    applyClarifyQuestionSet,
    clarifyLoopTurn,
    clarifyQuestions,
    resolvedPersona.capabilities.loopMode,
    result,
  ]);

  const applyGeneratedResult = useCallback((generated, {
    sourceVibe,
    promptPolicyMode,
    promptExperimentId,
    nextLoopTurn = 0,
    clarificationAnswersPatch = null,
  }) => {
    const {
      validationReport,
      nextQuestions,
      nextGenerationId,
    } = buildGeneratedResultPlan({
      generated,
      loopMode: resolvedPersona.capabilities.loopMode,
      maxClarifyTurns: resolvedPersona.capabilities.maxClarifyTurns,
      nextLoopTurn,
      promptExperimentId,
    });

    setResult(generated);
    setStatus('success');
    setActiveModel((previous) => getSafeModelName(generated?.model, previous));
    setClarifyLoopTurn(nextLoopTurn);
    applyClarifyQuestionSet(nextQuestions);

    setSelectedModel((previous) => String(generated?.model || previous || '').trim());
    setModelOptions((previous) => {
      const model = String(generated?.model || '').trim();
      if (!model) return previous;
      return previous.includes(model) ? previous : [model, ...previous];
    });

    shadowWriteSpecState({
      ...buildTransmuteSuccessShadowPayload({
        generated,
        apiProvider,
        selectedModel,
        promptPolicyMode,
        promptExperimentId,
        validationReport,
        nextQuestions,
        nextLoopTurn,
        nextGenerationId,
        clarificationAnswersPatch,
      }),
    });

    const clarifyStartedPayload = buildClarifyStartedShadowPayload({
      nextQuestions,
      validationReport,
      nextLoopTurn,
      nextGenerationId,
    });
    if (clarifyStartedPayload) {
      shadowWriteSpecState(clarifyStartedPayload);
    }

    void requestHybridStackGuide(generated, sourceVibe);
  }, [apiProvider, applyClarifyQuestionSet, requestHybridStackGuide, resolvedPersona.capabilities.loopMode, resolvedPersona.capabilities.maxClarifyTurns, selectedModel]);

  const handleSaveKey = useCallback(() => {
    if (!requiresUserApiKey) {
      setTempKey('');
      setIsSettingsOpen(false);
      return;
    }

    const key = tempKey.trim();
    if (!key) return;

    persistApiKeyToSession(key, apiProvider, SUPPORTED_MODEL_PROVIDERS);
    setApiKey(key);
    setTempKey('');
    setIsSettingsOpen(false);

    shadowWriteSpecState({
      type: 'api_key_saved',
      currentNodeId: 'api_key_ready',
      answersPatch: {
        api_provider: apiProvider,
        api_key_ready: true,
      },
      payload: { provider: apiProvider },
    });
  }, [apiProvider, requiresUserApiKey, tempKey]);

  const handleTransmute = useCallback(async () => {
    if (!vibe.trim()) return;
    if (requiresUserApiKey && !apiKey) {
      setIsSettingsOpen(true);
      setErrorMessage('API 키가 필요합니다.');
      return;
    }

    if (!ensureApiKeyNotExpired('API 키가 만료되었습니다. 다시 입력해 주세요.')) return;

    if (requiresUserApiKey) {
      persistApiKeyToSession(apiKey, apiProvider, SUPPORTED_MODEL_PROVIDERS);
    }
    const { promptPolicyMode, promptExperimentId, personaId } = buildGenerationRequestMeta(resolvedPersona);

    setStatus('processing');
    setErrorMessage('');
    setClarifyApplyNotice('');
    setResult(null);
    setHybridStackGuide(null);
    setHybridStackGuideStatus('idle');
    resetClarifyLoop();

    shadowWriteSpecState({
      type: 'transmute_started',
      currentNodeId: 'transmute_started',
      answersPatch: {
        source_vibe: vibe.trim(),
        api_provider: apiProvider,
        persona_id: personaId || 'default',
      },
      payload: {
        provider: apiProvider,
        model: String(selectedModel || ''),
        show_thinking: showThinking,
        prompt_policy_mode: promptPolicyMode,
        prompt_experiment_id: promptExperimentId,
      },
    });

    try {
      const generated = await transmuteVibeToSpec(vibe, apiKey, {
        provider: apiProvider,
        showThinking,
        modelName: selectedModel,
        persona: personaId,
        promptPolicyMode,
        promptExperimentId,
      });
      applyGeneratedResult(generated, {
        sourceVibe: vibe,
        promptPolicyMode,
        promptExperimentId,
        nextLoopTurn: 0,
      });
    } catch (error) {
      applyGenerationErrorState(error);
      shadowWriteSpecState({
        type: 'transmute_error',
        currentNodeId: 'transmute_error',
        payload: {
          provider: apiProvider,
          model: String(selectedModel || ''),
          prompt_policy_mode: promptPolicyMode,
          prompt_experiment_id: promptExperimentId,
        },
      });
    }
  }, [
    apiKey,
    apiProvider,
    applyGeneratedResult,
    applyGenerationErrorState,
    ensureApiKeyNotExpired,
    resetClarifyLoop,
    requiresUserApiKey,
    resolvedPersona,
    selectedModel,
    showThinking,
    vibe,
  ]);

  const handleApplyClarifications = useCallback(() => {
    if (!result) return;

    const answeredEntries = clarifyQuestions
      .map((question) => [question, toText(clarifyAnswers[question])])
      .filter(([, answer]) => Boolean(answer));
    if (answeredEntries.length === 0) return;

    const clarificationAnswersPatch = Object.fromEntries(answeredEntries);
    const clarifiedVibe = buildClarifiedVibe(vibe, clarifyQuestions, clarificationAnswersPatch);

    setVibe(clarifiedVibe);
    setErrorMessage('');
    setClarifyApplyNotice('보완 내용이 입력 매트릭스에 반영되었습니다. 생성 버튼을 눌러 다시 실행해 주세요.');

    shadowWriteSpecState({
      ...buildClarifyAnsweredShadowPayload({
        clarificationAnswersPatch,
        clarifyQuestions,
        nextLoopTurn: clarifyLoopTurn,
        answeredCount: answeredEntries.length,
      }),
    });

    shadowWriteSpecState({
      type: 'clarify_applied_to_input',
      currentNodeId: 'clarify_applied_to_input',
      clarificationAnswersPatch,
      pendingQuestions: clarifyQuestions,
      loopTurn: clarifyLoopTurn,
      payload: {
        answered_count: answeredEntries.length,
        updated_vibe_length: clarifiedVibe.length,
      },
    });
  }, [clarifyAnswers, clarifyLoopTurn, clarifyQuestions, result, vibe]);

  useEffect(() => {
    initializeSpecState();
  }, []);

  useEffect(() => {
    const normalizedProvider = normalizeProvider(apiProvider, SUPPORTED_MODEL_PROVIDERS);
    persistProviderToSession(normalizedProvider, SUPPORTED_MODEL_PROVIDERS);

    const restoredKey = requiresUserApiKey
      ? getStoredApiKey(normalizedProvider, SUPPORTED_MODEL_PROVIDERS)
      : '';

    setApiKey(restoredKey);
    setTempKey('');
    resetModelState();

    if (requiresUserApiKey) {
      if (!restoredKey) setIsSettingsOpen(true);
    } else {
      setIsSettingsOpen(false);
    }

    shadowWriteSpecState({
      type: 'provider_changed',
      currentNodeId: 'provider_selected',
      answersPatch: {
        api_provider: normalizedProvider,
        api_key_ready: requiresUserApiKey ? Boolean(restoredKey) : true,
      },
      payload: {
        provider: normalizedProvider,
        restored_key: requiresUserApiKey ? Boolean(restoredKey) : true,
      },
    });
  }, [apiProvider, requiresUserApiKey, resetModelState]);

  useEffect(() => {
    if (requiresUserApiKey && !apiKey) {
      resetModelState();
      return;
    }
    void loadModelOptions(apiKey, apiProvider);
  }, [apiKey, apiProvider, loadModelOptions, requiresUserApiKey, resetModelState]);

  useEffect(() => {
    if (!requiresUserApiKey) return undefined;
    if (!apiKey) return undefined;

    const savedAtMs = getSavedApiKeyTimestamp();
    if (!ensureApiKeyNotExpired()) return undefined;

    const remainingMs = API_KEY_TTL_MS - (Date.now() - savedAtMs);
    const timerId = window.setTimeout(() => {
      clearExpiredApiKeyState();
    }, remainingMs);

    return () => window.clearTimeout(timerId);
  }, [apiKey, clearExpiredApiKeyState, ensureApiKeyNotExpired, getSavedApiKeyTimestamp, requiresUserApiKey]);

  return {
    state: {
      vibe,
      status,
      result,
      errorMessage,
      apiProvider,
      apiKey,
      tempKey,
      isSettingsOpen,
      modelOptions,
      selectedModel,
      isModelOptionsLoading,
      activeModel,
      showThinking,
      hybridStackGuide,
      hybridStackGuideStatus,
      clarifyLoopTurn,
      clarifyApplyNotice,
      hasApiAccess,
      requiresApiKey: requiresUserApiKey,
    },
    derived: {
      providerOptions,
      standardOutput: result?.standard_output || result?.표준_출력 || null,
      nondevSpec: result?.artifacts?.nondev_spec_md || '',
      devSpec: result?.artifacts?.dev_spec_md || '',
      masterPrompt: result?.artifacts?.master_prompt || '',
      promptPolicyMeta: result?.meta || null,
      validationReport: isPlainObject(result?.validation_report) ? result.validation_report : null,
      clarifyApplyNotice,
      clarifyLoop: {
        active: Boolean(resolvedPersona.capabilities.showLoopControls) && clarifyQuestions.length > 0,
        questions: clarifyQuestions,
        answers: clarifyAnswers,
        canSubmit: clarifyQuestions.some((question) => Boolean(toText(clarifyAnswers[question]))),
        loopTurn: clarifyLoopTurn,
      },
    },
    actions: {
      setVibe: setVibeAndResetClarifyNotice,
      setApiProvider,
      setTempKey,
      setSelectedModel,
      setShowThinking,
      setIsSettingsOpen,
      setClarifyAnswer,
      removeClarifyQuestion,
      clearClarifyQuestions,
      handleSaveKey,
      handleTransmute,
      handleApplyClarifications,
      handleRefreshHybrid,
      syncWarningToClarifyLoop,
    },
  };
}
