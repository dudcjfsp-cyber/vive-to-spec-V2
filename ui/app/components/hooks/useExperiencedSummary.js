import { useCallback, useMemo, useState } from 'react';
import {
  buildContextOutputs,
  buildPreferredStackRequestLine,
} from '../result-panel/builders.js';
import { isObject, toStringArray, toText } from '../result-panel/utils';

function getGuideStatusLabel(status) {
  if (status === 'success') return '추천 준비됨';
  if (status === 'loading') return '추천 생성 중';
  if (status === 'error') return '추천 확인 필요';
  return '추천 전';
}

export function useExperiencedSummary({
  summaryModel,
  selectedImplementationStack,
}) {
  const [promptCopyStatus, setPromptCopyStatus] = useState('');
  const safeSummaryModel = isObject(summaryModel) ? summaryModel : {};
  const actions = isObject(safeSummaryModel.actions) ? safeSummaryModel.actions : {};
  const delivery = isObject(safeSummaryModel.delivery) ? safeSummaryModel.delivery : {};
  const promptContext = isObject(safeSummaryModel.promptContext) ? safeSummaryModel.promptContext : {};
  const completion = isObject(safeSummaryModel.completion) ? safeSummaryModel.completion : {};
  const validation = isObject(safeSummaryModel.validation) ? safeSummaryModel.validation : {};
  const guide = isObject(safeSummaryModel.guide) ? safeSummaryModel.guide : {};
  const clarify = isObject(safeSummaryModel.clarify) ? safeSummaryModel.clarify : {};

  const todayActions = useMemo(
    () => toStringArray(actions.today).slice(0, 3),
    [actions.today],
  );
  const topWarnings = useMemo(
    () => toStringArray(actions.topWarnings).slice(0, 2),
    [actions.topWarnings],
  );
  const quickRequest = useMemo(() => {
    const baseRequest = toText(delivery.quickRequestBase);
    const stackRequestLine = buildPreferredStackRequestLine(selectedImplementationStack);

    if (stackRequestLine && baseRequest) {
      return `${stackRequestLine}\n${baseRequest}`;
    }

    return stackRequestLine || baseRequest;
  }, [delivery.quickRequestBase, selectedImplementationStack]);
  const quickAiPrompt = useMemo(() => buildContextOutputs({
    devSpec: toText(promptContext.devSpec),
    nondevSpec: toText(promptContext.nondevSpec),
    masterPrompt: toText(promptContext.masterPrompt),
    hypothesis: isObject(promptContext.hypothesis) ? promptContext.hypothesis : {},
    logicMap: isObject(promptContext.logicMap) ? promptContext.logicMap : {},
    preferredStack: selectedImplementationStack,
  }).aiCoding, [
    promptContext.devSpec,
    promptContext.hypothesis,
    promptContext.logicMap,
    promptContext.masterPrompt,
    promptContext.nondevSpec,
    selectedImplementationStack,
  ]);

  const handleCopyExperiencedPrompt = useCallback(async () => {
    if (!quickAiPrompt) {
      setPromptCopyStatus('복사할 AI 프롬프트가 아직 없습니다.');
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      setPromptCopyStatus('클립보드를 지원하지 않는 환경입니다.');
      return;
    }

    try {
      await navigator.clipboard.writeText(quickAiPrompt);
      setPromptCopyStatus('AI 프롬프트를 복사했습니다.');
    } catch {
      setPromptCopyStatus('AI 프롬프트 복사에 실패했습니다.');
    }
  }, [quickAiPrompt]);

  const completionScore = Number.isFinite(Number(completion.score))
    ? Number(completion.score)
    : null;
  const validationSeverity = toText(validation.severity, 'low');
  const hasValidationReport = validation.hasReport === true;
  const guideData = isObject(guide.data) ? guide.data : null;
  const guideStatus = toText(guide.status, 'idle');
  const guideStatusLabel = getGuideStatusLabel(guideStatus);
  const validationQuestions = useMemo(
    () => toStringArray(clarify.questions),
    [clarify.questions],
  );
  const clarifyAnswers = isObject(clarify.answers) ? clarify.answers : {};
  const clarifyLoopTurn = Number(clarify.loopTurn || 0);
  const canSubmitClarification = clarify.canSubmit === true;

  return {
    todayActions,
    topWarnings,
    quickRequest,
    quickAiPrompt,
    promptCopyStatus,
    handleCopyExperiencedPrompt,
    completionScore,
    validationSeverity,
    hasValidationReport,
    guideData,
    guideStatus,
    guideStatusLabel,
    validationQuestions,
    clarifyAnswers,
    clarifyLoopTurn,
    canSubmitClarification,
  };
}