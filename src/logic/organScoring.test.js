import { describe, it, expect } from 'vitest';
import {
  scoreLiver,
  scoreKidney,
  scoreBrain,
  scoreCoagulation,
  scoreCirculation,
  scoreRespiratory,
  scoreRespiratorySF,
  calculateAllScores,
  getOrganDetails
} from './organScoring';

// HE 등급 입력값 (constants의 HE_OPTIONS와 같은 값)
const HE_NONE = 0;
const HE_GRADE_1_2 = 1;
const HE_GRADE_3_4 = 2;

// 6개 장기 모두 1점인 입력
const BASELINE = {
  bilirubin: 1.0,
  creatinine: 1.0,
  rrt: false,
  heGrade: HE_NONE,
  inr: 1.0,
  map: 80,
  vasopressors: false,
  pfRatio: 400
};

describe('장기별 점수 경계값 (CLIF-C OF, Jalan 2014)', () => {
  it.each([
    [5.9, 1],
    [6, 2],
    [11.9, 2],
    [12, 3]
  ])('간: Bilirubin %s mg/dL → %i점', (bilirubin, expected) => {
    expect(scoreLiver(bilirubin)).toBe(expected);
  });

  it.each([
    [1.9, false, 1],
    [2.0, false, 2],
    [3.4, false, 2],
    [3.5, false, 3],
    [1.0, true, 3]
  ])('신장: Creatinine %s mg/dL, RRT %s → %i점', (creatinine, rrt, expected) => {
    expect(scoreKidney(creatinine, rrt)).toBe(expected);
  });

  it.each([
    [HE_NONE, 1],
    [HE_GRADE_1_2, 2],
    [HE_GRADE_3_4, 3]
  ])('뇌: HE 입력값 %i → %i점', (heGrade, expected) => {
    expect(scoreBrain(heGrade)).toBe(expected);
  });

  it.each([
    [1.9, 1],
    [2.0, 2],
    [2.4, 2],
    [2.5, 3]
  ])('응고: INR %s → %i점', (inr, expected) => {
    expect(scoreCoagulation(inr)).toBe(expected);
  });

  it.each([
    [70, false, 1],
    [69, false, 2],
    [80, true, 3]
  ])('순환: MAP %i mmHg, 승압제 %s → %i점', (map, vasopressors, expected) => {
    expect(scoreCirculation(map, vasopressors)).toBe(expected);
  });

  it.each([
    [301, 1],
    [300, 2],
    [201, 2],
    [200, 3]
  ])('호흡: P/F %i → %i점', (pfRatio, expected) => {
    expect(scoreRespiratory(pfRatio)).toBe(expected);
  });

  it.each([
    [358, 1],
    [357, 2],
    [215, 2],
    [214, 3]
  ])('호흡: S/F %i → %i점', (sfRatio, expected) => {
    expect(scoreRespiratorySF(sfRatio)).toBe(expected);
  });
});

describe('호흡 점수 입력원', () => {
  it('SpO₂ 모드는 P/F가 아닌 S/F 기준으로 점수를 매긴다', () => {
    const result = calculateAllScores({ ...BASELINE, useSpO2: true, pfRatio: undefined, sfRatio: 317 });

    expect(result.scores.respiratory).toBe(2);
  });

  it('S/F 장기 카드는 SpO₂/FiO₂와 반올림한 값으로 표시한다', () => {
    const details = getOrganDetails('respiratory', 2, {
      ...BASELINE,
      useSpO2: true,
      pfRatio: undefined,
      sfRatio: 317.24
    });

    expect(details.indicator).toBe('SpO₂/FiO₂');
    expect(details.value).toBe(317);
  });
});

describe('장기부전 판정', () => {
  it('신장은 Creatinine 2.0 이상(2점)부터 부전으로 센다', () => {
    const result = calculateAllScores({ ...BASELINE, creatinine: 2.0 });

    expect(result.scores.kidney).toBe(2);
    expect(result.organFailures).toEqual(['kidney']);
    expect(result.totalScore).toBe(7);
  });

  it('신장 외 장기는 2점이어도 부전이 아니다', () => {
    const result = calculateAllScores({
      ...BASELINE,
      bilirubin: 6,
      heGrade: HE_GRADE_1_2,
      inr: 2.0,
      map: 65,
      pfRatio: 250
    });

    expect(result.organFailures).toEqual([]);
    expect(result.totalScore).toBe(11);
  });
});

describe('장기 카드 상태', () => {
  it('신장 2점은 부전으로 표시한다', () => {
    const details = getOrganDetails('kidney', 2, { ...BASELINE, creatinine: 2.5 });

    expect(details.isFailure).toBe(true);
    expect(details.status).toBe('failure');
  });

  it('간 2점은 주의로 표시한다', () => {
    const details = getOrganDetails('liver', 2, { ...BASELINE, bilirubin: 8 });

    expect(details.isFailure).toBe(false);
    expect(details.status).toBe('warning');
  });

  it('Creatinine 1.5-1.9(1점)는 신장 기능장애로 표시한다', () => {
    const details = getOrganDetails('kidney', 1, { ...BASELINE, creatinine: 1.7 });

    expect(details.isFailure).toBe(false);
    expect(details.status).toBe('dysfunction');
  });

  it('Creatinine 1.4는 정상으로 표시한다', () => {
    expect(getOrganDetails('kidney', 1, { ...BASELINE, creatinine: 1.4 }).status).toBe('normal');
  });

  it('HE 1-2(뇌 2점)는 뇌 기능장애로 표시한다', () => {
    const details = getOrganDetails('brain', 2, { ...BASELINE, heGrade: HE_GRADE_1_2 });

    expect(details.status).toBe('dysfunction');
  });
});
