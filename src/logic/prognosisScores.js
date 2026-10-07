/**
 * 다음 단계 예후 점수 (EASL CPG 2023: CLIF-C OF로 분류한 뒤 순차 적용)
 * - ACLF: CLIF-C ACLF 점수 (Jalan 2014)
 * - ACLF 아님: CLIF-C AD 점수 (Jalan 2015)
 * 예측 사망률 P = 1 − exp(−ci × exp(beta × score)), EF CLIF 공식 계산기와 같은 계수
 */

import { ACLF_GRADES } from '../constants';
import { validateFollowUpInputs } from './validation';

export const MORTALITY_MODELS = {
  aclf: {
    day28: { ci: 0.0022, beta: 0.0995 },
    day90: { ci: 0.0079, beta: 0.0869 }
  },
  ad: {
    day90: { ci: 0.00056, beta: 0.1007 },
    day365: { ci: 0.00879, beta: 0.0698 }
  }
};

const roundToOneDecimal = (value) => Math.round(value * 10) / 10;

/**
 * CLIF-C ACLF = 10 × (0.33 × CLIF-C OF + 0.04 × 나이 + 0.63 × ln(WBC 10⁹/L) − 2)
 * @param {{ ofScore: number, age: number, wbc: number }} params - WBC는 cells/µL (검사지 수치 그대로)
 * @returns {number} 소수점 1자리
 */
export function calculateClifCAclf({ ofScore, age, wbc }) {
  return roundToOneDecimal(10 * (0.33 * ofScore + 0.04 * age + 0.63 * Math.log(wbc / 1000) - 2));
}

/**
 * CLIF-C AD = 10 × (0.03 × 나이 + 0.66 × ln(Cr) + 1.71 × ln(INR) + 0.88 × ln(WBC 10⁹/L) − 0.05 × Na + 8)
 * @param {{ age: number, creatinine: number, inr: number, wbc: number, sodium: number }} params
 * @returns {number} 소수점 1자리
 */
export function calculateClifCAd({ age, creatinine, inr, wbc, sodium }) {
  return roundToOneDecimal(
    10 * (0.03 * age + 0.66 * Math.log(creatinine) + 1.71 * Math.log(inr) + 0.88 * Math.log(wbc / 1000) - 0.05 * sodium + 8)
  );
}

/**
 * 예측 사망률 (%, 정수)
 * @param {number} score - CLIF-C ACLF 또는 CLIF-C AD 점수
 * @param {{ ci: number, beta: number }} coef - MORTALITY_MODELS의 기간별 계수
 * @returns {number}
 */
export function predictMortality(score, { ci, beta }) {
  return Math.round(100 * (1 - Math.exp(-ci * Math.exp(beta * score))));
}

/**
 * CLIF-C AD 위험군 (Jalan 2015: ≤45 저위험, 46–59 중간, ≥60 고위험)
 * @returns {'low'|'intermediate'|'high'}
 */
export function getAdRiskGroup(score) {
  if (score <= 45) return 'low';
  if (score < 60) return 'intermediate';
  return 'high';
}

/**
 * CLIF-C ACLF 70점 이상일 때 안내 (EASL CPG 2023: 3–7일 장기지지 후 재평가 점수로 판단)
 * @returns {string|null}
 */
export function getAclfScoreNote(score) {
  if (score < 70) return null;
  return '간이식 비대상자에서 3–7일간 충분한 장기지지 후에도 70점 초과(또는 장기부전 4개 이상)이면 치료 목표 재논의를 고려합니다. 입원 시점 점수만으로 판단하지 마세요.';
}

/**
 * 다음 단계 점수: ACLF면 CLIF-C ACLF, 아니면 CLIF-C AD
 * @param {{ grade: string, totalScore: number, inputs: Object }} diagnosis - 진단 결과
 * @param {{ age: number, wbc: number, sodium?: number }} values - 검증된 숫자
 */
export function calculateFollowUpScore(diagnosis, { age, wbc, sodium }) {
  if (diagnosis.grade !== ACLF_GRADES.NO_ACLF) {
    const score = calculateClifCAclf({ ofScore: diagnosis.totalScore, age, wbc });
    return {
      type: 'aclf',
      score,
      mortality: {
        day28: predictMortality(score, MORTALITY_MODELS.aclf.day28),
        day90: predictMortality(score, MORTALITY_MODELS.aclf.day90)
      },
      note: getAclfScoreNote(score)
    };
  }

  const { creatinine, inr } = diagnosis.inputs;
  const score = calculateClifCAd({ age, creatinine, inr, wbc, sodium });
  return {
    type: 'ad',
    score,
    riskGroup: getAdRiskGroup(score),
    mortality: {
      day90: predictMortality(score, MORTALITY_MODELS.ad.day90),
      day365: predictMortality(score, MORTALITY_MODELS.ad.day365)
    }
  };
}

/**
 * 다음 단계 입력(문자열)으로 점수 계산 — 필요한 입력이 부족하면 null
 * @param {Object} diagnosis - 진단 결과
 * @param {{ age, wbc, sodium }} followUpValues - 입력 화면 또는 이력에 저장된 값
 */
export function getFollowUpScore(diagnosis, followUpValues = {}) {
  const needsSodium = diagnosis.grade === ACLF_GRADES.NO_ACLF;
  const { isComplete, validated } = validateFollowUpInputs(followUpValues, { needsSodium });
  return isComplete ? calculateFollowUpScore(diagnosis, validated) : null;
}
