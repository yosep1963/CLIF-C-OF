/**
 * 진단 결과 만들기와 이력 다시 계산
 */

import { calculateAllScores } from './organScoring';
import { determineACLFGrade, getMortalityInfo, getSeverityColor } from './aclfGrading';
import { calculateOxygenRatio } from './validation';

/**
 * 검증된 입력값으로 진단 결과 만들기
 * @param {Object} inputs - validateAllInputs의 validatedInputs
 * @returns {Object} 진단 결과
 */
export function buildDiagnosis(inputs) {
  const scoreResults = calculateAllScores(inputs);
  const aclfResult = determineACLFGrade(scoreResults, inputs);
  const mortalityInfo = getMortalityInfo(aclfResult.grade);

  return {
    inputs,
    scores: scoreResults.scores,
    totalScore: scoreResults.totalScore,
    grade: aclfResult.grade,
    rationale: aclfResult.rationale,
    rationaleKr: aclfResult.rationaleKr,
    organFailures: aclfResult.organFailures,
    organFailureCount: aclfResult.organFailureCount,
    mortality: mortalityInfo.rate,
    mortality90: mortalityInfo.rate90,
    severity: mortalityInfo.severity,
    severityColor: getSeverityColor(mortalityInfo.severity)
  };
}

/**
 * 이전 버전 입력값 보정
 * SpO2를 PaO2로 환산하던 버전의 기록에는 S/F가 없으므로 저장된 SpO2와 FiO2로 구함
 */
function migrateLegacyInputs(inputs) {
  if (inputs.useSpO2 && inputs.sfRatio == null && inputs.spo2 != null && inputs.fio2 != null) {
    return { ...inputs, sfRatio: calculateOxygenRatio(inputs.spo2, inputs.fio2) };
  }
  return inputs;
}

/**
 * 저장된 이력 기록을 현재 기준으로 다시 계산
 * 저장 당시 판정·총점은 savedGrade·savedTotalScore로 남기고, 달라졌으면 isChanged 표시
 * @param {Object} record - 저장된 기록 (id, timestamp, followUp 포함)
 * @returns {Object}
 */
export function recomputeHistoryRecord(record) {
  if (!record || !record.inputs) return record;

  const current = buildDiagnosis(migrateLegacyInputs(record.inputs));
  return {
    ...record,
    ...current,
    savedGrade: record.grade,
    savedTotalScore: record.totalScore,
    isChanged: record.grade !== current.grade || record.totalScore !== current.totalScore
  };
}
