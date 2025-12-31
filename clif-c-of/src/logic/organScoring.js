// 장기별 점수 계산 로직 (CLIF-C OF Score)

export const ORGAN_NAMES = {
  liver: '간 (Liver)',
  kidney: '신장 (Kidney)',
  brain: '뇌 (Brain)',
  coagulation: '응고 (Coagulation)',
  circulation: '순환 (Circulation)',
  respiratory: '호흡 (Respiratory)'
};

export const ORGAN_INDICATORS = {
  liver: 'Bilirubin',
  kidney: 'Creatinine',
  brain: 'HE Grade',
  coagulation: 'INR',
  circulation: 'MAP',
  respiratory: 'PaO₂/FiO₂'
};

// 간: Bilirubin 기준
export function scoreLiver(bilirubin) {
  if (bilirubin === null || bilirubin === undefined) return null;
  if (bilirubin < 6) return 1;
  if (bilirubin < 12) return 2;
  return 3; // >= 12
}

// 신장: Creatinine 기준 (RRT 포함)
export function scoreKidney(creatinine, rrt = false) {
  if (rrt) return 3; // RRT 사용 시 자동 3점
  if (creatinine === null || creatinine === undefined) return null;
  if (creatinine < 2) return 1;
  if (creatinine < 3.5) return 2;
  return 3; // >= 3.5
}

// 뇌: HE Grade 기준 (West-Haven)
// heGrade: 0 = Grade 0, 1 = Grade 1-2, 2 = Grade 3-4
export function scoreBrain(heGrade) {
  if (heGrade === null || heGrade === undefined) return null;
  if (heGrade === 0) return 1;
  if (heGrade === 1) return 2; // Grade 1-2
  return 3; // Grade 3-4
}

// 응고: INR 기준
export function scoreCoagulation(inr) {
  if (inr === null || inr === undefined) return null;
  if (inr < 2.0) return 1;
  if (inr < 2.5) return 2;
  return 3; // >= 2.5
}

// 순환: MAP 기준 (승압제 포함)
export function scoreCirculation(map, vasopressors = false) {
  if (vasopressors) return 3; // 승압제 사용 시 자동 3점
  if (map === null || map === undefined) return null;
  if (map >= 70) return 1;
  return 2; // < 70
}

// 호흡: PaO2/FiO2 기준
export function scoreRespiratory(pfRatio) {
  if (pfRatio === null || pfRatio === undefined) return null;
  if (pfRatio > 300) return 1;
  if (pfRatio > 200) return 2; // 201-300
  return 3; // <= 200
}

// 모든 장기 점수 계산
export function calculateAllScores(inputs) {
  const { bilirubin, creatinine, rrt, heGrade, inr, map, vasopressors, pfRatio } = inputs;

  const scores = {
    liver: scoreLiver(bilirubin),
    kidney: scoreKidney(creatinine, rrt),
    brain: scoreBrain(heGrade),
    coagulation: scoreCoagulation(inr),
    circulation: scoreCirculation(map, vasopressors),
    respiratory: scoreRespiratory(pfRatio)
  };

  // 총점 계산 (null인 항목 제외)
  const validScores = Object.values(scores).filter(s => s !== null);
  const totalScore = validScores.reduce((sum, s) => sum + s, 0);

  // 장기부전(3점) 개수
  const organFailures = Object.entries(scores)
    .filter(([_, score]) => score === 3)
    .map(([organ, _]) => organ);

  return {
    scores,
    totalScore,
    organFailures,
    organFailureCount: organFailures.length
  };
}

// 점수에 따른 상태 텍스트
export function getScoreStatus(score) {
  if (score === null) return { status: 'unknown', text: '미입력', color: 'gray' };
  if (score === 1) return { status: 'normal', text: '정상', color: 'green' };
  if (score === 2) return { status: 'warning', text: '주의', color: 'yellow' };
  return { status: 'failure', text: '부전', color: 'red' };
}

// 장기별 상세 정보 반환
export function getOrganDetails(organ, score, inputs) {
  const name = ORGAN_NAMES[organ];
  const indicator = ORGAN_INDICATORS[organ];
  const { status, text, color } = getScoreStatus(score);

  let value = '';
  let unit = '';

  switch (organ) {
    case 'liver':
      value = inputs.bilirubin;
      unit = 'mg/dL';
      break;
    case 'kidney':
      if (inputs.rrt) {
        value = 'RRT';
        unit = '';
      } else {
        value = inputs.creatinine;
        unit = 'mg/dL';
      }
      break;
    case 'brain':
      const heLabels = ['Grade 0', 'Grade 1-2', 'Grade 3-4'];
      value = heLabels[inputs.heGrade] || 'Grade 0';
      unit = '';
      break;
    case 'coagulation':
      value = inputs.inr;
      unit = '';
      break;
    case 'circulation':
      if (inputs.vasopressors) {
        value = '승압제 사용';
        unit = '';
      } else {
        value = inputs.map;
        unit = 'mmHg';
      }
      break;
    case 'respiratory':
      value = inputs.pfRatio;
      unit = '';
      break;
  }

  return {
    organ,
    name,
    indicator,
    score,
    status,
    statusText: text,
    color,
    value,
    unit,
    isFailure: score === 3
  };
}
