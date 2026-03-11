import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync(new URL('./useExperiencedSummary.js', import.meta.url), 'utf8');

test('useExperiencedSummary reads quick-mode data from a normalized summary model', () => {
  assert.match(source, /summaryModel,/);
  assert.match(source, /const safeSummaryModel = isObject\(summaryModel\) \? summaryModel : \{\};/);
  assert.match(source, /const actions = isObject\(safeSummaryModel\.actions\) \? safeSummaryModel\.actions : \{\};/);
  assert.match(source, /const validation = isObject\(safeSummaryModel\.validation\) \? safeSummaryModel\.validation : \{\};/);
  assert.match(source, /const guide = isObject\(safeSummaryModel\.guide\) \? safeSummaryModel\.guide : \{\};/);
  assert.match(source, /const clarify = isObject\(safeSummaryModel\.clarify\) \? safeSummaryModel\.clarify : \{\};/);
  assert.match(source, /const hasValidationReport = validation\.hasReport === true;/);
  assert.match(source, /const guideData = isObject\(guide\.data\) \? guide\.data : null;/);
  assert.match(source, /const guideStatus = toText\(guide\.status, 'idle'\);/);
  assert.match(source, /const guideStatusLabel = getGuideStatusLabel\(guideStatus\);/);
  assert.match(source, /const clarifyAnswers = isObject\(clarify\.answers\) \? clarify\.answers : \{\};/);
  assert.match(source, /const clarifyLoopTurn = Number\(clarify\.loopTurn \|\| 0\);/);
  assert.doesNotMatch(source, /derived\.standardOutput/);
  assert.doesNotMatch(source, /derived\.validationReport/);
  assert.doesNotMatch(source, /derived\.clarifyLoop/);
  assert.doesNotMatch(source, /state\.hybridStackGuide/);
  assert.doesNotMatch(source, /state\.hybridStackGuideStatus/);
});