import { useCallback, useMemo, useState } from 'react';
import {
  buildContextOutputs,
  buildLogicMap,
  buildPreferredStackRequestLine,
  buildProblemFrame,
} from '../result-panel/builders';
import { isObject, toStringArray, toText } from '../result-panel/utils';

export function useExperiencedSummary({
  derived,
  selectedImplementationStack,
}) {
  const [promptCopyStatus, setPromptCopyStatus] = useState('');

  const todayActions = useMemo(
    () => toStringArray(derived.standardOutput?.오늘_할_일_3개).slice(0, 3),
    [derived.standardOutput],
  );
  const topWarnings = useMemo(
    () => toStringArray(derived.standardOutput?.완성도_진단?.누락_경고).slice(0, 2),
    [derived.standardOutput],
  );
  const quickRequest = useMemo(() => {
    const standardRequest = toText(derived.standardOutput?.수정요청_변환?.표준_요청);
    const baseRequest = standardRequest || toText(derived.standardOutput?.수정요청_변환?.짧은_요청, derived.masterPrompt);
    const stackRequestLine = buildPreferredStackRequestLine(selectedImplementationStack);

    if (stackRequestLine && baseRequest) {
      return `${stackRequestLine}\n${baseRequest}`;
    }

    return stackRequestLine || baseRequest;
  }, [derived.masterPrompt, derived.standardOutput, selectedImplementationStack]);
  const quickAiPrompt = useMemo(() => {
    const safeSpec = isObject(derived.standardOutput) ? derived.standardOutput : {};
    const hypothesis = buildProblemFrame(safeSpec);
    const logicMap = buildLogicMap(safeSpec, hypothesis);
    return buildContextOutputs({
      devSpec: derived.devSpec,
      nondevSpec: derived.nondevSpec,
      masterPrompt: derived.masterPrompt,
      hypothesis,
      logicMap,
      preferredStack: selectedImplementationStack,
    }).aiCoding;
  }, [derived.devSpec, derived.masterPrompt, derived.nondevSpec, derived.standardOutput, selectedImplementationStack]);

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

  const completionScore = Number.isFinite(Number(derived.standardOutput?.완성도_진단?.점수_0_100))
    ? Number(derived.standardOutput?.완성도_진단?.점수_0_100)
    : null;
  const validationSeverity = toText(derived.validationReport?.severity, 'low');
  const validationQuestions = useMemo(
    () => toStringArray(derived.clarifyLoop?.questions),
    [derived.clarifyLoop],
  );
  const canSubmitClarification = derived.clarifyLoop?.canSubmit === true;

  return {
    todayActions,
    topWarnings,
    quickRequest,
    quickAiPrompt,
    promptCopyStatus,
    handleCopyExperiencedPrompt,
    completionScore,
    validationSeverity,
    validationQuestions,
    canSubmitClarification,
  };
}
