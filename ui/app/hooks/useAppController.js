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
import { initializeSpecState, shadowWriteSpecState } from '../services/specStateShadow';
import { resolvePersonaRuntimeConfig } from '../persona/presets';

function getSafeModelName(value, fallback = 'OFFLINE') {
  const text = String(value || '').trim();
  return text ? text.toUpperCase() : fallback;
}

function buildPromptExperimentId(personaConfig) {
  const resolvedPersona = resolvePersonaRuntimeConfig(personaConfig);
  const scope = String(resolvedPersona.promptExperimentScope || resolvedPersona.id || 'default').trim() || 'default';
  const mode = String(resolvedPersona.promptPolicyMode || 'baseline').trim() || 'baseline';
  return `${scope}_${mode}_v1`;
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(() => !getStoredApiKey(getStoredProvider(SUPPORTED_MODEL_PROVIDERS), SUPPORTED_MODEL_PROVIDERS));
  const [modelOptions, setModelOptions] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelOptionsLoading, setIsModelOptionsLoading] = useState(false);
  const [activeModel, setActiveModel] = useState('OFFLINE');
  const [showThinking, setShowThinking] = useState(true);
  const [hybridStackGuide, setHybridStackGuide] = useState(null);
  const [hybridStackGuideStatus, setHybridStackGuideStatus] = useState('idle');

  const providerOptions = useMemo(
    () => SUPPORTED_MODEL_PROVIDERS.map((id) => ({ id, label: getProviderDisplayName(id) })),
    [],
  );

  const resetModelState = useCallback(() => {
    setModelOptions([]);
    setSelectedModel('');
    setActiveModel('OFFLINE');
  }, []);

  const loadModelOptions = useCallback(async (nextApiKey, nextProvider) => {
    if (!nextApiKey) {
      setModelOptions([]);
      setSelectedModel('');
      setIsModelOptionsLoading(false);
      return;
    }

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
  }, []);

  const requestHybridStackGuide = useCallback(async (nextResult, nextVibe) => {
    const standardOutput = nextResult?.standard_output;
    if (!apiKey || !standardOutput) {
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
  }, [apiKey, apiProvider, selectedModel]);

  const handleRefreshHybrid = useCallback(() => {
    if (!result) return;
    void requestHybridStackGuide(result, vibe);
  }, [requestHybridStackGuide, result, vibe]);

  const handleSaveKey = useCallback(() => {
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
  }, [apiProvider, tempKey]);

  const handleTransmute = useCallback(async () => {
    if (!vibe.trim()) return;
    if (!apiKey) {
      setIsSettingsOpen(true);
      setErrorMessage('API 키가 필요합니다.');
      return;
    }

    const savedAtMs = Number(sessionStorage.getItem(getApiKeySavedAtStorageKey(apiProvider, SUPPORTED_MODEL_PROVIDERS)));
    if (isApiKeyExpired(savedAtMs)) {
      clearStoredApiKey(apiProvider, SUPPORTED_MODEL_PROVIDERS);
      setApiKey('');
      setIsSettingsOpen(true);
      setErrorMessage('API 키가 만료되었습니다. 다시 입력해 주세요.');
      setActiveModel('OFFLINE');
      return;
    }

    persistApiKeyToSession(apiKey, apiProvider, SUPPORTED_MODEL_PROVIDERS);
    const promptPolicyMode = String(resolvedPersona.promptPolicyMode || 'baseline');
    const promptExperimentId = buildPromptExperimentId(resolvedPersona);
    const personaId = String(resolvedPersona.id === 'default' ? '' : resolvedPersona.id);

    setStatus('processing');
    setErrorMessage('');
    setResult(null);
    setHybridStackGuide(null);
    setHybridStackGuideStatus('idle');

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
      setResult(generated);
      setStatus('success');
      setActiveModel(getSafeModelName(generated?.model, activeModel));
      setSelectedModel((prev) => String(generated?.model || prev || '').trim());
      setModelOptions((prev) => {
        const model = String(generated?.model || '').trim();
        if (!model) return prev;
        return prev.includes(model) ? prev : [model, ...prev];
      });

      shadowWriteSpecState({
        type: 'transmute_success',
        currentNodeId: 'transmute_success',
        answersPatch: {
          api_provider: apiProvider,
          last_model: String(generated?.model || selectedModel || ''),
          last_prompt_policy_mode: String(generated?.meta?.prompt_policy_mode || promptPolicyMode),
        },
        payload: {
          provider: apiProvider,
          model: String(generated?.model || selectedModel || ''),
          prompt_policy_mode: String(generated?.meta?.prompt_policy_mode || promptPolicyMode),
          prompt_experiment_id: String(generated?.meta?.prompt_experiment_id || promptExperimentId),
          example_mode: String(generated?.meta?.example_mode || 'none'),
        },
      });

      void requestHybridStackGuide(generated, vibe);
    } catch (error) {
      setStatus('error');
      setActiveModel('LINK FAILURE');
      setHybridStackGuide(null);
      setHybridStackGuideStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '알 수 없는 변환 오류입니다.');
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
  }, [activeModel, apiKey, apiProvider, requestHybridStackGuide, resolvedPersona, selectedModel, showThinking, vibe]);

  useEffect(() => {
    initializeSpecState();
  }, []);

  useEffect(() => {
    const normalizedProvider = normalizeProvider(apiProvider, SUPPORTED_MODEL_PROVIDERS);
    persistProviderToSession(normalizedProvider, SUPPORTED_MODEL_PROVIDERS);
    const restoredKey = getStoredApiKey(normalizedProvider, SUPPORTED_MODEL_PROVIDERS);
    setApiKey(restoredKey);
    setTempKey('');
    resetModelState();
    if (!restoredKey) setIsSettingsOpen(true);

    shadowWriteSpecState({
      type: 'provider_changed',
      currentNodeId: 'provider_selected',
      answersPatch: {
        api_provider: normalizedProvider,
        api_key_ready: Boolean(restoredKey),
      },
      payload: {
        provider: normalizedProvider,
        restored_key: Boolean(restoredKey),
      },
    });
  }, [apiProvider, resetModelState]);

  useEffect(() => {
    if (!apiKey) {
      resetModelState();
      return;
    }
    void loadModelOptions(apiKey, apiProvider);
  }, [apiKey, apiProvider, loadModelOptions, resetModelState]);

  useEffect(() => {
    if (!apiKey) return undefined;

    const savedAtMs = Number(sessionStorage.getItem(getApiKeySavedAtStorageKey(apiProvider, SUPPORTED_MODEL_PROVIDERS)));
    if (isApiKeyExpired(savedAtMs)) {
      clearStoredApiKey(apiProvider, SUPPORTED_MODEL_PROVIDERS);
      setApiKey('');
      setActiveModel('OFFLINE');
      setIsSettingsOpen(true);
      return undefined;
    }

    const remainingMs = API_KEY_TTL_MS - (Date.now() - savedAtMs);
    const timerId = window.setTimeout(() => {
      clearStoredApiKey(apiProvider, SUPPORTED_MODEL_PROVIDERS);
      setApiKey('');
      setActiveModel('OFFLINE');
      setIsSettingsOpen(true);
    }, remainingMs);

    return () => window.clearTimeout(timerId);
  }, [apiKey, apiProvider]);

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
    },
    derived: {
      providerOptions,
      standardOutput: result?.standard_output || result?.표준_출력 || null,
      nondevSpec: result?.artifacts?.nondev_spec_md || '',
      devSpec: result?.artifacts?.dev_spec_md || '',
      masterPrompt: result?.artifacts?.master_prompt || '',
      promptPolicyMeta: result?.meta || null,
    },
    actions: {
      setVibe,
      setApiProvider,
      setTempKey,
      setSelectedModel,
      setShowThinking,
      setIsSettingsOpen,
      handleSaveKey,
      handleTransmute,
      handleRefreshHybrid,
    },
  };
}
