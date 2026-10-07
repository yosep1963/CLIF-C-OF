import { describe, it, expect } from 'vitest';
import { calculateAllScores } from './organScoring';
import { determineACLFGrade, getMortalityInfo } from './aclfGrading';

// HE 등급 입력값 (constants의 HE_OPTIONS와 같은 값)
const HE_GRADE_1_2 = 1;
const HE_GRADE_3_4 = 2;

// 6개 장기 모두 정상(1점), Cr <1.5, HE 없음
const BASELINE = {
  bilirubin: 1.0,
  creatinine: 1.0,
  rrt: false,
  heGrade: 0,
  inr: 1.0,
  map: 80,
  vasopressors: false,
  pfRatio: 400
};

// 장기별 부전 입력 (신부전은 사례마다 Cr/RRT로 직접 지정)
const LIVER_FAILURE = { bilirubin: 12 };
const BRAIN_FAILURE = { heGrade: HE_GRADE_3_4 };
const COAGULATION_FAILURE = { inr: 2.5 };
const CIRCULATION_FAILURE = { vasopressors: true };
const RESPIRATORY_FAILURE = { pfRatio: 200 };

function diagnose(...overrides) {
  const inputs = Object.assign({}, BASELINE, ...overrides);
  return determineACLFGrade(calculateAllScores(inputs), inputs);
}

describe('ACLF 등급 판정 (CANONIC, EASL CPG 2023)', () => {
  it.each([
    ['장기부전 없음', 'No ACLF', []],
    ['단독 간부전 + Cr 1.4', 'No ACLF', [LIVER_FAILURE, { creatinine: 1.4 }]],
    ['단독 응고부전', 'No ACLF', [COAGULATION_FAILURE]],
    ['단독 순환부전', 'No ACLF', [CIRCULATION_FAILURE]],
    ['단독 호흡부전', 'No ACLF', [RESPIRATORY_FAILURE]],
    ['단독 뇌부전 + Cr 1.4', 'No ACLF', [BRAIN_FAILURE, { creatinine: 1.4 }]],

    ['단독 신부전 Cr 2.0', 'ACLF-1', [{ creatinine: 2.0 }]],
    ['단독 신부전 Cr 3.4', 'ACLF-1', [{ creatinine: 3.4 }]],
    ['단독 신부전 Cr 3.5', 'ACLF-1', [{ creatinine: 3.5 }]],
    ['단독 신부전 RRT', 'ACLF-1', [{ rrt: true }]],
    ['간부전 + Cr 1.5', 'ACLF-1', [LIVER_FAILURE, { creatinine: 1.5 }]],
    ['간부전 + Cr 1.9', 'ACLF-1', [LIVER_FAILURE, { creatinine: 1.9 }]],
    ['간부전 + HE 1-2', 'ACLF-1', [LIVER_FAILURE, { heGrade: HE_GRADE_1_2 }]],
    ['응고부전 + Cr 1.5', 'ACLF-1', [COAGULATION_FAILURE, { creatinine: 1.5 }]],
    ['순환부전 + HE 1-2', 'ACLF-1', [CIRCULATION_FAILURE, { heGrade: HE_GRADE_1_2 }]],
    ['호흡부전 + Cr 1.7 + HE 1-2', 'ACLF-1', [RESPIRATORY_FAILURE, { creatinine: 1.7, heGrade: HE_GRADE_1_2 }]],
    ['뇌부전 + Cr 1.5', 'ACLF-1', [BRAIN_FAILURE, { creatinine: 1.5 }]],
    ['뇌부전 + Cr 1.9', 'ACLF-1', [BRAIN_FAILURE, { creatinine: 1.9 }]],

    ['간부전 + 신부전 Cr 2.0', 'ACLF-2', [LIVER_FAILURE, { creatinine: 2.0 }]],
    ['뇌부전 + 신부전 RRT', 'ACLF-2', [BRAIN_FAILURE, { rrt: true }]],
    ['간부전 + 응고부전', 'ACLF-2', [LIVER_FAILURE, COAGULATION_FAILURE]],

    ['간 + 응고 + 신부전 Cr 2.5', 'ACLF-3', [LIVER_FAILURE, COAGULATION_FAILURE, { creatinine: 2.5 }]],
    ['간 + 응고 + 순환부전', 'ACLF-3', [LIVER_FAILURE, COAGULATION_FAILURE, CIRCULATION_FAILURE]]
  ])('%s → %s', (_, expected, overrides) => {
    expect(diagnose(...overrides).grade).toBe(expected);
  });

  it('장기부전 개수와 목록에 신부전(Cr 2.0-3.4)을 포함한다', () => {
    const result = diagnose(LIVER_FAILURE, COAGULATION_FAILURE, { creatinine: 2.5 });

    expect(result.organFailureCount).toBe(3);
    expect(result.organFailures).toEqual(expect.arrayContaining(['liver', 'coagulation', 'kidney']));
  });
});

describe('판정 근거 문구', () => {
  it('신기능장애 동반 근거에 Cr 1.5-1.9 기준을 적는다', () => {
    expect(diagnose(LIVER_FAILURE, { creatinine: 1.7 }).rationaleKr).toContain('Cr 1.5-1.9');
  });

  it('장기부전이 2개 이상이면 부전 장기를 모두 적는다', () => {
    const { rationaleKr } = diagnose(LIVER_FAILURE, { creatinine: 2.0 });

    expect(rationaleKr).toContain('간');
    expect(rationaleKr).toContain('신장');
  });
});

describe('등급별 사망률 (CANONIC, Moreau 2013)', () => {
  it.each([
    ['No ACLF', '4.7%', '14%'],
    ['ACLF-1', '22.1%', '40.7%'],
    ['ACLF-2', '32.0%', '52.3%'],
    ['ACLF-3', '76.7%', '79.1%']
  ])('%s: 28일 %s, 90일 %s', (aclfGrade, rate, rate90) => {
    expect(getMortalityInfo(aclfGrade)).toMatchObject({ rate, rate90 });
  });
});
