/**
 * 장기별 점수 계산 로직 (CLIF-C OF Score)
 */

import { ORGAN_NAMES as ORGAN_BASE, SCORE_LABELS, SCORE_COLORS } from '../constants';

// 장기 표시 이름 (ORGAN_BASE에서 파생)
export const ORGAN_NAMES = Object.fromEntries(
  Object.entries(ORGAN_BASE).map(([key, val]) => [key, `${val.kr} (${val.en})`])
);

// 장기별 지표
export const ORGAN_INDICATORS = {
  liver: 'Bilirubin',
  kidney: 'Creatinine',
  brain: 'HE Grade',
  coagulation: 'INR',
  circulation: 'MAP',
  respiratory: 'PaO₂/FiO₂'
};

// HE 등급 라벨
const HE_LABELS = ['Grade 0', 'Grade 1-2', 'Grade 3-4'];

// 점수 계산 함수들
export const scoreLiver = (bilirubin) => {
  if (bilirubin == null) return null;
  if (bilirubin < 6) return 1;
  if (bilirubin < 12) return 2;
  return 3;
};

export const scoreKidney = (creatinine, rrt = false) => {
  if (rrt) return 3;
  if (creatinine == null) return null;
  if (creatinine < 2) return 1;
  if (creatinine < 3.5) return 2;
  return 3;
};

export const scoreBrain = (heGrade) => {
  if (heGrade == null) return null;
  if (heGrade === 0) return 1;
  if (heGrade === 1) return 2;
  return 3;
};

export const scoreCoagulation = (inr) => {
  if (inr == null) return null;
  if (inr < 2.0) return 1;
  if (inr < 2.5) return 2;
  return 3;
};

export const scoreCirculation = (map, vasopressors = false) => {
  if (vasopressors) return 3;
  if (map == null) return null;
  if (map >= 70) return 1;
  return 2;
};

export const scoreRespiratory = (pfRatio) => {
  if (pfRatio == null) return null;
  if (pfRatio > 300) return 1;
  if (pfRatio > 200) return 2;
  return 3;
};

// 점수 계산 함수 매핑
const SCORE_FUNCTIONS = {
  liver: (inputs) => scoreLiver(inputs.bilirubin),
  kidney: (inputs) => scoreKidney(inputs.creatinine, inputs.rrt),
  brain: (inputs) => scoreBrain(inputs.heGrade),
  coagulation: (inputs) => scoreCoagulation(inputs.inr),
  circulation: (inputs) => scoreCirculation(inputs.map, inputs.vasopressors),
  respiratory: (inputs) => scoreRespiratory(inputs.pfRatio)
};

/**
 * 모든 장기 점수 계산
 * @param {Object} inputs - 입력값 객체
 * @returns {Object} 점수 및 부전 정보
 */
export function calculateAllScores(inputs) {
  const scores = {};

  // 각 장기 점수 계산
  Object.keys(SCORE_FUNCTIONS).forEach((organ) => {
    scores[organ] = SCORE_FUNCTIONS[organ](inputs);
  });

  // 총점 계산
  const validScores = Object.values(scores).filter((s) => s !== null);
  const totalScore = validScores.reduce((sum, s) => sum + s, 0);

  // 장기부전(3점) 목록
  const organFailures = Object.entries(scores)
    .filter(([, score]) => score === 3)
    .map(([organ]) => organ);

  return {
    scores,
    totalScore,
    organFailures,
    organFailureCount: organFailures.length
  };
}

/**
 * 점수에 따른 상태 정보 반환
 * @param {number|null} score - 점수
 * @returns {{ status: string, text: string, color: string }}
 */
export function getScoreStatus(score) {
  if (score === null) {
    return { status: 'unknown', text: '미입력', color: 'gray' };
  }
  const colorMap = { 1: 'green', 2: 'yellow', 3: 'red' };
  const textMap = { 1: '정상', 2: '주의', 3: '부전' };
  const statusMap = { 1: 'normal', 2: 'warning', 3: 'failure' };

  return {
    status: statusMap[score] || 'unknown',
    text: textMap[score] || '-',
    color: colorMap[score] || 'gray'
  };
}

// 장기별 값 추출 함수
const VALUE_EXTRACTORS = {
  liver: (inputs) => ({ value: inputs.bilirubin, unit: 'mg/dL' }),
  kidney: (inputs) => inputs.rrt
    ? { value: 'RRT', unit: '' }
    : { value: inputs.creatinine, unit: 'mg/dL' },
  brain: (inputs) => ({ value: HE_LABELS[inputs.heGrade] || 'Grade 0', unit: '' }),
  coagulation: (inputs) => ({ value: inputs.inr, unit: '' }),
  circulation: (inputs) => inputs.vasopressors
    ? { value: '승압제 사용', unit: '' }
    : { value: inputs.map, unit: 'mmHg' },
  respiratory: (inputs) => ({ value: inputs.pfRatio, unit: '' })
};

/**
 * 장기별 상세 정보 반환
 * @param {string} organ - 장기 키
 * @param {number|null} score - 점수
 * @param {Object} inputs - 입력값
 * @returns {Object} 장기 상세 정보
 */
export function getOrganDetails(organ, score, inputs) {
  const { status, text, color } = getScoreStatus(score);
  const { value, unit } = VALUE_EXTRACTORS[organ]?.(inputs) || { value: '', unit: '' };

  return {
    organ,
    name: ORGAN_NAMES[organ],
    indicator: ORGAN_INDICATORS[organ],
    score,
    status,
    statusText: text,
    color,
    value,
    unit,
    isFailure: score === 3
  };
}
