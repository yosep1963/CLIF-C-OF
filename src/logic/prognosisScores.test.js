import { describe, it, expect } from 'vitest';
import {
  calculateClifCAclf,
  calculateClifCAd,
  predictMortality,
  getAdRiskGroup,
  getAclfScoreNote,
  getFollowUpScore,
  MORTALITY_MODELS
} from './prognosisScores';

// 다음 단계 점수 계산에 쓰는 진단 결과 (필요한 항목만)
const ACLF_DIAGNOSIS = { grade: 'ACLF-2', totalScore: 9, inputs: { creatinine: 2.5, inr: 1.2 } };
const NO_ACLF_DIAGNOSIS = { grade: 'No ACLF', totalScore: 7, inputs: { creatinine: 1.7, inr: 1.5 } };

describe('저장된 입력으로 다음 단계 점수 구하기', () => {
  it('ACLF면 CLIF-C ACLF 점수를 계산한다', () => {
    const result = getFollowUpScore(ACLF_DIAGNOSIS, { age: '60', wbc: '15000', sodium: '' });

    expect(result).toMatchObject({ type: 'aclf', score: 50.8, mortality: { day28: 29, day90: 48 } });
  });

  it('ACLF가 아니면 CLIF-C AD 점수를 계산한다', () => {
    const result = getFollowUpScore(NO_ACLF_DIAGNOSIS, { age: '60', wbc: '8000', sodium: '135' });

    expect(result).toMatchObject({ type: 'ad', score: 59.2, riskGroup: 'intermediate', mortality: { day90: 20, day365: 42 } });
  });

  it('필요한 입력이 빠지면 계산하지 않는다 (AD는 Na 필요)', () => {
    expect(getFollowUpScore(NO_ACLF_DIAGNOSIS, { age: '60', wbc: '8000', sodium: '' })).toBeNull();
    expect(getFollowUpScore(ACLF_DIAGNOSIS, undefined)).toBeNull();
  });
});

describe('CLIF-C ACLF 점수 (Jalan 2014)', () => {
  it.each([
    [8, 60, 15000, 47.5],
    [11, 55, 12000, 54.0]
  ])('OF %i점, 나이 %i, WBC %i → %s', (ofScore, age, wbc, expected) => {
    expect(calculateClifCAclf({ ofScore, age, wbc })).toBe(expected);
  });

  it.each([
    [40, 11, 23],
    [50, 27, 46],
    [60, 58, 77],
    [70, 90, 97]
  ])('%i점 예측 사망률: 28일 %i%%, 90일 %i%%', (score, day28, day90) => {
    expect(predictMortality(score, MORTALITY_MODELS.aclf.day28)).toBe(day28);
    expect(predictMortality(score, MORTALITY_MODELS.aclf.day90)).toBe(day90);
  });

  it('70점 미만에는 치료 목표 재논의 안내가 없다', () => {
    expect(getAclfScoreNote(69.9)).toBeNull();
  });

  it('70점 이상이면 3–7일 재평가 조건과 함께 치료 목표 재논의를 안내한다', () => {
    const note = getAclfScoreNote(70);

    expect(note).toMatch(/3–7일/);
    expect(note).toMatch(/간이식/);
  });
});

describe('CLIF-C AD 점수 (Jalan 2015)', () => {
  it.each([
    [60, 1.2, 1.5, 8000, 135, 56.9],
    [55, 1.0, 1.2, 6000, 138, 46.4]
  ])('나이 %i, Cr %s, INR %s, WBC %i, Na %i → %s', (age, creatinine, inr, wbc, sodium, expected) => {
    expect(calculateClifCAd({ age, creatinine, inr, wbc, sodium })).toBe(expected);
  });

  it.each([
    [40, 3, 13],
    [50, 8, 25],
    [60, 21, 44],
    [70, 48, 69]
  ])('%i점 예측 사망률: 90일 %i%%, 1년 %i%%', (score, day90, day365) => {
    expect(predictMortality(score, MORTALITY_MODELS.ad.day90)).toBe(day90);
    expect(predictMortality(score, MORTALITY_MODELS.ad.day365)).toBe(day365);
  });

  it.each([
    [45, 'low'],
    [45.1, 'intermediate'],
    [59.9, 'intermediate'],
    [60, 'high']
  ])('%s점 → %s 위험군 (≤45 / 46–59 / ≥60)', (score, expected) => {
    expect(getAdRiskGroup(score)).toBe(expected);
  });
});
