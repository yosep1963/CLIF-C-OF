/**
 * ACLF (Acute-on-Chronic Liver Failure) 등급 판정 로직
 *
 * ACLF-3: 장기부전 3개 이상
 * ACLF-2: 장기부전 2개
 * ACLF-1:
 *   - 신부전 단독
 *   - 기타 장기부전 1개 + 경미한 신기능장애 (Cr 1.5-1.9)
 *   - 기타 장기부전 1개 + 경도 간성뇌증 (HE 1-2)
 *   - 중등도 신기능장애 (Cr 2.0-3.4) 단독
 * No ACLF: 위 기준 미충족
 */

import {
  ACLF_GRADES,
  MORTALITY_INFO,
  SEVERITY_COLORS,
  KIDNEY_STATUS,
  ORGAN_NAMES
} from '../constants';

// 신장 상태 확인 함수
function checkKidneyCondition(creatinine, rrt) {
  if (rrt || creatinine >= 3.5) {
    return KIDNEY_STATUS.FAILURE;
  }
  if (creatinine >= 2.0 && creatinine < 3.5) {
    return KIDNEY_STATUS.MODERATE_DYSFUNCTION;
  }
  if (creatinine >= 1.5 && creatinine < 2.0) {
    return KIDNEY_STATUS.MILD_DYSFUNCTION;
  }
  return KIDNEY_STATUS.NORMAL;
}

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

  // ACLF-3: 장기부전 3개 이상
  if (organFailureCount >= 3) {
    return {
      ...result,
      grade: ACLF_GRADES.ACLF_3,
      rationale: `${organFailureCount} organ failures`,
      rationaleKr: `장기부전 ${organFailureCount}개`
    };
  }

  // ACLF-2: 장기부전 2개
  if (organFailureCount === 2) {
    return {
      ...result,
      grade: ACLF_GRADES.ACLF_2,
      rationale: '2 organ failures',
      rationaleKr: '장기부전 2개'
    };
  }

  // ACLF-1 조건들 (장기부전 1개)
  if (organFailureCount === 1) {
    const failedOrgan = organFailures[0];
    const kidneyCondition = checkKidneyCondition(creatinine, rrt);

    // 신부전 단독
    if (failedOrgan === 'kidney') {
      return {
        ...result,
        grade: ACLF_GRADES.ACLF_1,
        rationale: 'Single kidney failure',
        rationaleKr: '단독 신부전'
      };
    }

    // 기타 장기부전 + 경미한 신기능장애
    if (kidneyCondition === KIDNEY_STATUS.MILD_DYSFUNCTION) {
      return {
        ...result,
        grade: ACLF_GRADES.ACLF_1,
        rationale: `${capitalizeFirst(failedOrgan)} failure + mild kidney dysfunction (Cr 1.5-1.9)`,
        rationaleKr: `${getOrganNameKr(failedOrgan)} 부전 + 경미한 신기능장애`
      };
    }

    // 기타 장기부전 + 경도 간성뇌증
    if (heGrade === 1 && failedOrgan !== 'brain') {
      return {
        ...result,
        grade: ACLF_GRADES.ACLF_1,
        rationale: `${capitalizeFirst(failedOrgan)} failure + mild hepatic encephalopathy (HE 1-2)`,
        rationaleKr: `${getOrganNameKr(failedOrgan)} 부전 + 경도 간성뇌증`
      };
    }

    // 기타 단독 장기부전 (ACLF-1 미충족)
    return {
      ...result,
      grade: ACLF_GRADES.NO_ACLF,
      rationale: `Single ${failedOrgan} failure without additional criteria`,
      rationaleKr: `단독 ${getOrganNameKr(failedOrgan)} 부전 (추가 조건 미충족)`
    };
  }

  // 장기부전 없음, 중등도 신기능장애 체크
  const kidneyCondition = checkKidneyCondition(creatinine, rrt);
  if (kidneyCondition === KIDNEY_STATUS.MODERATE_DYSFUNCTION) {
    return {
      ...result,
      grade: ACLF_GRADES.ACLF_1,
      rationale: 'Moderate kidney dysfunction (Cr 2.0-3.4)',
      rationaleKr: '중등도 신기능장애 (Cr 2.0-3.4)'
    };
  }

  // No ACLF
  return {
    ...result,
    grade: ACLF_GRADES.NO_ACLF,
    rationale: 'No organ failure criteria met',
    rationaleKr: '장기부전 기준 미충족'
  };
}

/**
 * 28일 사망률 및 위험도 반환
 * @param {string} grade - ACLF 등급
 * @returns {{ rate: string, severity: string }}
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
