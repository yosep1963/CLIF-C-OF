// ACLF 등급 판정 로직

export const ACLF_GRADES = {
  NO_ACLF: 'No ACLF',
  ACLF_1: 'ACLF-1',
  ACLF_2: 'ACLF-2',
  ACLF_3: 'ACLF-3'
};

export const MORTALITY_RATES = {
  'No ACLF': { rate: '< 5%', severity: 'low' },
  'ACLF-1': { rate: '22-25%', severity: 'medium' },
  'ACLF-2': { rate: '32-35%', severity: 'high' },
  'ACLF-3': { rate: '> 75%', severity: 'critical' }
};

// ACLF-1 조건 체크를 위한 신장 상태 확인
function checkKidneyCondition(creatinine, rrt) {
  if (rrt || creatinine >= 3.5) {
    return 'kidney_failure'; // 신부전 (3점)
  }
  if (creatinine >= 2.0 && creatinine < 3.5) {
    return 'kidney_dysfunction_moderate'; // 중등도 신기능장애 (2점)
  }
  if (creatinine >= 1.5 && creatinine < 2.0) {
    return 'kidney_dysfunction_mild'; // 경미한 신기능장애
  }
  return 'kidney_normal';
}

// ACLF 등급 판정
export function determineACLFGrade(scores, inputs) {
  const { organFailures, organFailureCount } = scores;
  const { creatinine, rrt, heGrade } = inputs;

  // 결과 객체 초기화
  const result = {
    grade: ACLF_GRADES.NO_ACLF,
    rationale: '',
    rationaleKr: '',
    organFailures: organFailures,
    organFailureCount: organFailureCount
  };

  // 1. ACLF-3: 장기부전 3개 이상
  if (organFailureCount >= 3) {
    result.grade = ACLF_GRADES.ACLF_3;
    result.rationale = `${organFailureCount} organ failures`;
    result.rationaleKr = `장기부전 ${organFailureCount}개`;
    return result;
  }

  // 2. ACLF-2: 장기부전 2개
  if (organFailureCount === 2) {
    result.grade = ACLF_GRADES.ACLF_2;
    result.rationale = '2 organ failures';
    result.rationaleKr = '장기부전 2개';
    return result;
  }

  // 3. ACLF-1 조건들 (장기부전 1개 또는 특정 조건)
  if (organFailureCount === 1) {
    const failedOrgan = organFailures[0];
    const kidneyCondition = checkKidneyCondition(creatinine, rrt);

    // 3a. 신부전 단독
    if (failedOrgan === 'kidney') {
      result.grade = ACLF_GRADES.ACLF_1;
      result.rationale = 'Single kidney failure';
      result.rationaleKr = '단독 신부전';
      return result;
    }

    // 3b. 기타 장기부전 1개 + 경미한 신기능장애 (Cr 1.5-1.9)
    if (kidneyCondition === 'kidney_dysfunction_mild') {
      result.grade = ACLF_GRADES.ACLF_1;
      result.rationale = `${capitalizeFirst(failedOrgan)} failure + mild kidney dysfunction (Cr 1.5-1.9)`;
      result.rationaleKr = `${getOrganNameKr(failedOrgan)} 부전 + 경미한 신기능장애`;
      return result;
    }

    // 3c. 기타 장기부전 1개 + 경도 간성뇌증 (HE 1-2)
    if (heGrade === 1 && failedOrgan !== 'brain') {
      result.grade = ACLF_GRADES.ACLF_1;
      result.rationale = `${capitalizeFirst(failedOrgan)} failure + mild hepatic encephalopathy (HE 1-2)`;
      result.rationaleKr = `${getOrganNameKr(failedOrgan)} 부전 + 경도 간성뇌증`;
      return result;
    }

    // 기타 단독 장기부전 (ACLF-1로 분류되지 않음)
    result.grade = ACLF_GRADES.NO_ACLF;
    result.rationale = `Single ${failedOrgan} failure without additional criteria`;
    result.rationaleKr = `단독 ${getOrganNameKr(failedOrgan)} 부전 (추가 조건 미충족)`;
    return result;
  }

  // 4. 장기부전 없음, 단독 신장 2점 (Cr 2.0-3.4) 체크
  const kidneyCondition = checkKidneyCondition(creatinine, rrt);
  if (kidneyCondition === 'kidney_dysfunction_moderate') {
    result.grade = ACLF_GRADES.ACLF_1;
    result.rationale = 'Moderate kidney dysfunction (Cr 2.0-3.4)';
    result.rationaleKr = '중등도 신기능장애 (Cr 2.0-3.4)';
    return result;
  }

  // 5. No ACLF
  result.grade = ACLF_GRADES.NO_ACLF;
  result.rationale = 'No organ failure criteria met';
  result.rationaleKr = '장기부전 기준 미충족';
  return result;
}

// 28일 사망률 및 위험도 반환
export function getMortalityInfo(grade) {
  return MORTALITY_RATES[grade] || MORTALITY_RATES['No ACLF'];
}

// 위험도 색상 반환
export function getSeverityColor(severity) {
  switch (severity) {
    case 'low':
      return '#10B981'; // 초록
    case 'medium':
      return '#F59E0B'; // 노랑
    case 'high':
      return '#EF4444'; // 빨강
    case 'critical':
      return '#DC2626'; // 진한 빨강
    default:
      return '#6B7280'; // 회색
  }
}

// 유틸리티 함수
function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function getOrganNameKr(organ) {
  const names = {
    liver: '간',
    kidney: '신장',
    brain: '뇌',
    coagulation: '응고',
    circulation: '순환',
    respiratory: '호흡'
  };
  return names[organ] || organ;
}

