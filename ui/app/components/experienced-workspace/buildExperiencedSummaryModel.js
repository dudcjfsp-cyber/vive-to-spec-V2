import { buildLogicMap, buildProblemFrame } from '../result-panel/builders.js';
import { isObject, toStringArray, toText } from '../result-panel/utils.js';

export function buildExperiencedSummaryModel({ state, derived }) {
  const safeState = isObject(state) ? state : {};
  const safeDerived = isObject(derived) ? derived : {};
  const safeStandardOutput = isObject(safeDerived.standardOutput) ? safeDerived.standardOutput : {};
  const safeValidationReport = isObject(safeDerived.validationReport) ? safeDerived.validationReport : {};
  const safeClarifyLoop = isObject(safeDerived.clarifyLoop) ? safeDerived.clarifyLoop : {};
  const completionScoreValue = Number(safeStandardOutput?.완성도_진단?.점수_0_100);
  const completionScore = Number.isFinite(completionScoreValue) ? completionScoreValue : null;
  const hypothesis = buildProblemFrame(safeStandardOutput);
  const logicMap = buildLogicMap(safeStandardOutput, hypothesis);

  return {
    actions: {
      today: toStringArray(safeStandardOutput?.오늘_할_일_3개).slice(0, 3),
      topWarnings: toStringArray(safeStandardOutput?.완성도_진단?.누락_경고).slice(0, 2),
    },
    delivery: {
      quickRequestBase:
        toText(safeStandardOutput?.수정요청_변환?.표준_요청)
        || toText(safeStandardOutput?.수정요청_변환?.짧은_요청, toText(safeDerived.masterPrompt)),
    },
    promptContext: {
      devSpec: toText(safeDerived.devSpec),
      nondevSpec: toText(safeDerived.nondevSpec),
      masterPrompt: toText(safeDerived.masterPrompt),
      hypothesis,
      logicMap,
    },
    completion: {
      score: completionScore,
    },
    validation: {
      severity: toText(safeValidationReport.severity, 'low'),
      hasReport: isObject(safeDerived.validationReport),
    },
    guide: {
      data: isObject(safeState.hybridStackGuide) ? safeState.hybridStackGuide : null,
      status: toText(safeState.hybridStackGuideStatus, 'idle'),
    },
    clarify: {
      questions: toStringArray(safeClarifyLoop.questions),
      answers: isObject(safeClarifyLoop.answers) ? safeClarifyLoop.answers : {},
      loopTurn: Number(safeClarifyLoop.loopTurn || 0),
      canSubmit: safeClarifyLoop.canSubmit === true,
    },
  };
}