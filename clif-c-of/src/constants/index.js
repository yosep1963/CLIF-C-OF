// CLIF-C OF 프로젝트 상수 정의
// 모든 상수를 한 곳에서 관리하여 유지보수성 향상

// ACLF 등급 정의
export const ACLF_GRADES = {
  NO_ACLF: 'No ACLF',
  ACLF_1: 'ACLF-1',
  ACLF_2: 'ACLF-2',
  ACLF_3: 'ACLF-3'
};

// 등급별 색상 (통합)
export const GRADE_COLORS = {
  [ACLF_GRADES.NO_ACLF]: '#10B981',
  [ACLF_GRADES.ACLF_1]: '#F59E0B',
  [ACLF_GRADES.ACLF_2]: '#EF4444',
  [ACLF_GRADES.ACLF_3]: '#DC2626'
};

// 위험도 레벨
export const SEVERITY_LEVELS = {
  LOW: 'low',
  MODERATE: 'moderate',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// 위험도별 색상
export const SEVERITY_COLORS = {
  [SEVERITY_LEVELS.LOW]: '#10B981',
  [SEVERITY_LEVELS.MODERATE]: '#F59E0B',
  [SEVERITY_LEVELS.HIGH]: '#EF4444',
  [SEVERITY_LEVELS.CRITICAL]: '#DC2626'
};

// 위험도 정보 (아이콘, 레이블 포함)
export const SEVERITY_INFO = {
  [SEVERITY_LEVELS.LOW]: {
    color: SEVERITY_COLORS[SEVERITY_LEVELS.LOW],
    bgColor: '#D1FAE5',
    label: '낮음',
    icon: '✓'
  },
  [SEVERITY_LEVELS.MODERATE]: {
    color: SEVERITY_COLORS[SEVERITY_LEVELS.MODERATE],
    bgColor: '#FEF3C7',
    label: '중등도',
    icon: '⚠'
  },
  [SEVERITY_LEVELS.HIGH]: {
    color: SEVERITY_COLORS[SEVERITY_LEVELS.HIGH],
    bgColor: '#FEE2E2',
    label: '높음',
    icon: '⚠'
  },
  [SEVERITY_LEVELS.CRITICAL]: {
    color: SEVERITY_COLORS[SEVERITY_LEVELS.CRITICAL],
    bgColor: '#FEE2E2',
    label: '매우 높음',
    icon: '⛔'
  }
};

// 사망률 정보
export const MORTALITY_INFO = {
  [ACLF_GRADES.NO_ACLF]: { rate: '< 5%', severity: SEVERITY_LEVELS.LOW },
  [ACLF_GRADES.ACLF_1]: { rate: '~22%', severity: SEVERITY_LEVELS.MODERATE },
  [ACLF_GRADES.ACLF_2]: { rate: '~32%', severity: SEVERITY_LEVELS.HIGH },
  [ACLF_GRADES.ACLF_3]: { rate: '> 70%', severity: SEVERITY_LEVELS.CRITICAL }
};

// 장기 이름 (영어 - 한글 매핑)
export const ORGAN_NAMES = {
  liver: { en: 'Liver', kr: '간', icon: '🫘' },
  kidney: { en: 'Kidney', kr: '신장', icon: '🫘' },
  brain: { en: 'Brain', kr: '뇌', icon: '🧠' },
  coagulation: { en: 'Coagulation', kr: '응고', icon: '🩸' },
  circulation: { en: 'Circulation', kr: '순환', icon: '❤️' },
  respiratory: { en: 'Respiratory', kr: '호흡', icon: '🫁' }
};

// 입력값 유효성 범위
export const VALIDATION_RANGES = {
  bilirubin: { min: 0.1, max: 50, unit: 'mg/dL' },
  creatinine: { min: 0.1, max: 15, unit: 'mg/dL' },
  inr: { min: 0.5, max: 10, unit: '' },
  sbp: { min: 60, max: 250, unit: 'mmHg' },
  dbp: { min: 30, max: 150, unit: 'mmHg' },
  pao2: { min: 30, max: 600, unit: 'mmHg' },
  spo2: { min: 70, max: 100, unit: '%' },
  o2Flow: { min: 0, max: 5, unit: 'L/min' },
  pfRatio: { min: 50, max: 600, unit: '' }
};

// HE (간성뇌증) 등급 옵션
export const HE_OPTIONS = [
  { value: 0, label: 'Grade 0', description: '정상' },
  { value: 1, label: 'Grade 1-2', description: '경도' },
  { value: 2, label: 'Grade 3-4', description: '중증' }
];

// 신장 상태 분류
export const KIDNEY_STATUS = {
  FAILURE: 'kidney_failure',
  MODERATE_DYSFUNCTION: 'kidney_dysfunction_moderate',
  MILD_DYSFUNCTION: 'kidney_dysfunction_mild',
  NORMAL: 'kidney_normal'
};

// 초기 입력값
export const INITIAL_INPUTS = {
  bilirubin: '',
  creatinine: '',
  rrt: false,
  heGrade: 0,
  inr: '',
  sbp: '',
  dbp: '',
  vasopressors: false,
  pao2: '',
  o2Flow: '',
  useSpO2: false,
  spo2: ''
};

