/**
 * 장기별 점수 계산 로직 (CLIF-C OF Score)
 */

import { ORGAN_NAMES as ORGAN_BASE } from '../constants';

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

// SpO2/FiO2 기준 (PaO2가 없을 때, Jalan 2014)
export const scoreRespiratorySF = (sfRatio) => {
  if (sfRatio == null) return null;
  if (sfRatio > 357) return 1;
  if (sfRatio > 214) return 2;
  return 3;
};

// 기계환기: 간성뇌증 때문이면 뇌 3점, 그 외 이유면 호흡 3점
const isVentForHE = (inputs) => inputs.mechVent && inputs.mechVentReason === 'he';
const isVentForRespiratory = (inputs) => inputs.mechVent && inputs.mechVentReason === 'other';

// 점수 계산 함수 매핑
const SCORE_FUNCTIONS = {
  liver: (inputs) => scoreLiver(inputs.bilirubin),
  kidney: (inputs) => scoreKidney(inputs.creatinine, inputs.rrt),
  brain: (inputs) => (isVentForHE(inputs) ? 3 : scoreBrain(inputs.heGrade)),
  coagulation: (inputs) => scoreCoagulation(inputs.inr),
  circulation: (inputs) => scoreCirculation(inputs.map, inputs.vasopressors),
  respiratory: (inputs) => {
    if (isVentForRespiratory(inputs)) return 3;
    return inputs.useSpO2 ? scoreRespiratorySF(inputs.sfRatio) : scoreRespiratory(inputs.pfRatio);
  }
};

// 장기부전으로 보는 최소 점수: 신장만 2점(Cr ≥2.0)부터, 나머지는 3점 (Jalan 2014)
const FAILURE_MIN_SCORE = {
  liver: 3,
  kidney: 2,
  brain: 3,
  coagulation: 3,
  circulation: 3,
  respiratory: 3
};

const isOrganFailure = (organ, score) => score != null && score >= FAILURE_MIN_SCORE[organ];

// 신기능장애: Cr 1.5-1.9 (2.0 이상·RRT는 신부전) — ACLF-1 판정 기준
export const hasKidneyDysfunction = (creatinine, rrt = false) =>
  !rrt && creatinine >= 1.5 && creatinine < 2.0;

// 카드에 기능장애로 표시할 값: 신장 Cr 1.5-1.9, 뇌 HE 1-2(2점) — ACLF-1 판정에 쓰이는 값
const isOrganDysfunction = (organ, score, inputs) => {
  if (organ === 'kidney') return hasKidneyDysfunction(inputs.creatinine, inputs.rrt);
  if (organ === 'brain') return score === 2;
  return false;
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

  // 장기부전 목록
  const organFailures = Object.entries(scores)
    .filter(([organ, score]) => isOrganFailure(organ, score))
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
 * @param {boolean} isFailure - 장기부전 여부 (신장은 2점부터 부전)
 * @returns {{ status: string, text: string, color: string }}
 */
export function getScoreStatus(score, isFailure = score === 3) {
  if (score === null) {
    return { status: 'unknown', text: '미입력', color: 'gray' };
  }
  const level = isFailure ? 3 : score;
  const colorMap = { 1: 'green', 2: 'yellow', 3: 'red' };
  const textMap = { 1: '정상', 2: '주의', 3: '부전' };
  const statusMap = { 1: 'normal', 2: 'warning', 3: 'failure' };

  return {
    status: statusMap[level] || 'unknown',
    text: textMap[level] || '-',
    color: colorMap[level] || 'gray'
  };
}

// 장기별 값 추출 함수
const VALUE_EXTRACTORS = {
  liver: (inputs) => ({ value: inputs.bilirubin, unit: 'mg/dL' }),
  kidney: (inputs) => inputs.rrt
    ? { value: 'RRT', unit: '' }
    : { value: inputs.creatinine, unit: 'mg/dL' },
  brain: (inputs) => isVentForHE(inputs)
    ? { value: '기계환기 (HE)', unit: '' }
    : { value: HE_LABELS[inputs.heGrade] || 'Grade 0', unit: '' },
  coagulation: (inputs) => ({ value: inputs.inr, unit: '' }),
  circulation: (inputs) => inputs.vasopressors
    ? { value: '승압제 사용', unit: '' }
    : { value: inputs.map, unit: 'mmHg' },
  respiratory: (inputs) => {
    if (isVentForRespiratory(inputs)) return { value: '기계환기', unit: '' };
    const ratio = inputs.sfRatio ?? inputs.pfRatio;
    return { value: ratio == null ? null : Math.round(ratio), unit: '' };
  }
};

/**
 * 장기별 상세 정보 반환
 * @param {string} organ - 장기 키
 * @param {number|null} score - 점수
 * @param {Object} inputs - 입력값
 * @returns {Object} 장기 상세 정보
 */
export function getOrganDetails(organ, score, inputs) {
  const isFailure = isOrganFailure(organ, score);
  const isDysfunction = !isFailure && isOrganDysfunction(organ, score, inputs);
  const { status, text, color } = isDysfunction
    ? { status: 'dysfunction', text: '기능장애', color: 'yellow' }
    : getScoreStatus(score, isFailure);
  const { value, unit } = VALUE_EXTRACTORS[organ]?.(inputs) || { value: '', unit: '' };

  return {
    organ,
    name: ORGAN_NAMES[organ],
    indicator: organ === 'respiratory' && inputs.sfRatio != null ? 'SpO₂/FiO₂' : ORGAN_INDICATORS[organ],
    score,
    status,
    statusText: text,
    color,
    value,
    unit,
    isFailure
  };
}
