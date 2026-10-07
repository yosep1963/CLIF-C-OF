/**
 * ACLF (Acute-on-Chronic Liver Failure) 등급 판정 로직
 * 기준: CANONIC (Moreau 2013), EASL CPG 2023
 *
 * 장기부전: 간 Bil ≥12, 신장 Cr ≥2.0 또는 RRT, 뇌 HE 3-4,
 *          응고 INR ≥2.5, 순환 승압제 사용, 호흡 P/F ≤200
 *
 * ACLF-3: 장기부전 3개 이상
 * ACLF-2: 장기부전 2개
 * ACLF-1:
 *   - 단독 신부전
 *   - 단독 간·응고·순환·호흡 부전 + 신기능장애 (Cr 1.5-1.9) 및/또는 경도 간성뇌증 (HE 1-2)
 *   - 단독 뇌부전 + 신기능장애 (Cr 1.5-1.9)
 * No ACLF: 위 기준 미충족
 */

import {
  ACLF_GRADES,
  MORTALITY_INFO,
  SEVERITY_COLORS,
  ORGAN_NAMES
} from '../constants';
import { hasKidneyDysfunction } from './organScoring';

// 경도 간성뇌증: HE 1-2 (heGrade 입력값 1)
const hasMildHE = (heGrade) => heGrade === 1;

// 유틸리티 함수
const capitalizeFirst = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const getOrganNameKr = (organ) => ORGAN_NAMES[organ]?.kr || organ;

/**
 * ACLF 등급 판정
 * @param {Object} scores - 장기별 점수 및 부전 정보
 * @param {Object} inputs - 환자 입력 데이터
 * @returns {Object} ACLF 판정 결과
 */
export function determineACLFGrade(scores, inputs) {
  const { organFailures, organFailureCount } = scores;
  const { creatinine, rrt, heGrade } = inputs;

  const result = {
    grade: ACLF_GRADES.NO_ACLF,
    rationale: '',
    rationaleKr: '',
    organFailures,
    organFailureCount
  };

  // ACLF-3 / ACLF-2: 장기부전 2개 이상
  if (organFailureCount >= 2) {
    return {
      ...result,
      grade: organFailureCount >= 3 ? ACLF_GRADES.ACLF_3 : ACLF_GRADES.ACLF_2,
      rationale: `${organFailureCount} organ failures (${organFailures.join(', ')})`,
      rationaleKr: `장기부전 ${organFailureCount}개 (${organFailures.map(getOrganNameKr).join(', ')})`
    };
  }

  // No ACLF: 장기부전 없음
  if (organFailureCount === 0) {
    return {
      ...result,
      rationale: 'No organ failure',
      rationaleKr: '장기부전 없음'
    };
  }

  // 장기부전 1개
  const failedOrgan = organFailures[0];

  // 단독 신부전
  if (failedOrgan === 'kidney') {
    return {
      ...result,
      grade: ACLF_GRADES.ACLF_1,
      rationale: 'Single kidney failure (Cr ≥2.0 or RRT)',
      rationaleKr: '단독 신부전 (Cr ≥2.0 또는 RRT)'
    };
  }

  // 동반 조건: 신기능장애는 모든 장기에, 경도 간성뇌증은 뇌 외 장기에 해당
  // (뇌부전이면 HE 3-4이므로 경도 간성뇌증과 함께 있을 수 없음)
  const companions = [
    hasKidneyDysfunction(creatinine, rrt) && { en: 'kidney dysfunction (Cr 1.5-1.9)', kr: '신기능장애 (Cr 1.5-1.9)' },
    hasMildHE(heGrade) && { en: 'mild hepatic encephalopathy (HE 1-2)', kr: '경도 간성뇌증 (HE 1-2)' }
  ].filter(Boolean);

  if (companions.length > 0) {
    return {
      ...result,
      grade: ACLF_GRADES.ACLF_1,
      rationale: `${capitalizeFirst(failedOrgan)} failure + ${companions.map((c) => c.en).join(' + ')}`,
      rationaleKr: `${getOrganNameKr(failedOrgan)} 부전 + ${companions.map((c) => c.kr).join(' + ')}`
    };
  }

  // 단독 장기부전, 동반 조건 없음 (ACLF-1 미충족)
  const absentKr = failedOrgan === 'brain' ? '신기능장애' : '신기능장애·간성뇌증';
  return {
    ...result,
    rationale: `Single ${failedOrgan} failure without additional criteria`,
    rationaleKr: `단독 ${getOrganNameKr(failedOrgan)} 부전 (${absentKr} 동반 없음)`
  };
}

/**
 * 28일·90일 사망률 및 위험도 반환
 * @param {string} grade - ACLF 등급
 * @returns {{ rate: string, rate90: string, severity: string }}
 */
export function getMortalityInfo(grade) {
  return MORTALITY_INFO[grade] || MORTALITY_INFO[ACLF_GRADES.NO_ACLF];
}

/**
 * 위험도에 따른 색상 반환
 * @param {string} severity - 위험도 레벨
 * @returns {string} 색상 코드
 */
export function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity] || '#6B7280';
}

// 상수 re-export (하위 호환성)
export { ACLF_GRADES };
