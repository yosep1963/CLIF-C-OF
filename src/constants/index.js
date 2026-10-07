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

// 사망률 정보 (CANONIC, Moreau 2013 — rate: 28일, rate90: 90일)
export const MORTALITY_INFO = {
  [ACLF_GRADES.NO_ACLF]: { rate: '4.7%', rate90: '14%', severity: SEVERITY_LEVELS.LOW },
  [ACLF_GRADES.ACLF_1]: { rate: '22.1%', rate90: '40.7%', severity: SEVERITY_LEVELS.MODERATE },
  [ACLF_GRADES.ACLF_2]: { rate: '32.0%', rate90: '52.3%', severity: SEVERITY_LEVELS.HIGH },
  [ACLF_GRADES.ACLF_3]: { rate: '76.7%', rate90: '79.1%', severity: SEVERITY_LEVELS.CRITICAL }
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
  map: { min: 30, max: 150, unit: 'mmHg' },
  pao2: { min: 30, max: 600, unit: 'mmHg' },
  spo2: { min: 70, max: 100, unit: '%' },
  o2Flow: { min: 0, max: 6, unit: 'L/min' },
  fio2Direct: { min: 21, max: 100, unit: '%' },
  pfRatio: { min: 50, max: 600, unit: '' },
  // 다음 단계 점수 (CLIF-C ACLF / CLIF-C AD)
  age: { min: 18, max: 100, unit: '세' },
  wbc: { min: 100, max: 100000, unit: 'cells/µL' },
  sodium: { min: 100, max: 180, unit: 'mmol/L' }
};

// HE (간성뇌증) 등급 옵션
export const HE_OPTIONS = [
  { value: 0, label: 'Grade 0', description: '정상' },
  { value: 1, label: 'Grade 1-2', description: '경도' },
  { value: 2, label: 'Grade 3-4', description: '중증' }
];

// 초기 입력값
export const INITIAL_INPUTS = {
  bilirubin: '',
  creatinine: '',
  rrt: false,
  heGrade: 0,
  inr: '',
  mapMode: 'bp',      // 'bp': SBP/DBP로 계산, 'direct': MAP 직접 입력
  sbp: '',
  dbp: '',
  mapDirect: '',
  vasopressors: false,
  mechVent: false,
  mechVentReason: '', // 'he': 간성뇌증 → 뇌부전, 'other': 그 외 → 호흡부전
  useSpO2: false,
  pao2: '',
  spo2: '',
  fio2Mode: 'flow',   // 'flow': 비강 캐뉼라 유량, 'direct': FiO2 직접 입력
  o2Flow: '',
  fio2Direct: ''
};

// 다음 단계 점수 입력 (ACLF: 나이·WBC, ACLF 아님: 나이·WBC·Na)
export const INITIAL_FOLLOW_UP = {
  age: '',
  wbc: '',
  sodium: ''
};

