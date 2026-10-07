import { describe, it, expect } from 'vitest';
import { validateAllInputs, validateFollowUpInputs } from './validation';
import { calculateAllScores } from './organScoring';
import { determineACLFGrade } from './aclfGrading';

// 입력 화면에서 넘어오는 값 (문자열), 모든 장기 정상
const BASE = {
  bilirubin: '1.0',
  creatinine: '1.0',
  rrt: false,
  heGrade: 0,
  inr: '1.2',
  mapMode: 'bp',
  sbp: '120',
  dbp: '70',
  mapDirect: '',
  vasopressors: false,
  mechVent: false,
  mechVentReason: '',
  useSpO2: false,
  pao2: '95',
  spo2: '',
  fio2Mode: 'flow',
  o2Flow: '0',
  fio2Direct: ''
};

function validate(overrides) {
  return validateAllInputs({ ...BASE, ...overrides });
}

function diagnose(overrides) {
  const { isValid, errors, validatedInputs } = validate(overrides);
  if (!isValid) throw new Error(`입력 오류: ${JSON.stringify(errors)}`);
  const scores = calculateAllScores(validatedInputs);
  return { scores, grade: determineACLFGrade(scores, validatedInputs).grade };
}

describe('기본 입력', () => {
  it('정상 입력은 오류 없이 통과한다', () => {
    expect(validate({}).isValid).toBe(true);
  });
});

describe('산소화 지표 (CLIF-C OF 호흡)', () => {
  it('SpO₂는 PaO₂로 환산하지 않고 SpO₂/FiO₂ 비로 계산한다', () => {
    const { validatedInputs } = validate({ useSpO2: true, spo2: '92', pao2: '', o2Flow: '2' });

    expect(validatedInputs.sfRatio).toBeCloseTo(317.2, 1);
    expect(validatedInputs.pfRatio).toBeUndefined();
  });

  it('빌리루빈 15 + SpO₂ 92% (산소 2 L)는 호흡 2점이라 No ACLF', () => {
    const { scores, grade } = diagnose({ bilirubin: '15', useSpO2: true, spo2: '92', pao2: '', o2Flow: '2' });

    expect(scores.scores.respiratory).toBe(2);
    expect(grade).toBe('No ACLF');
  });

  it('P/F는 반올림하지 않은 값으로 판정한다 (200.4는 부전 아님)', () => {
    const { scores } = diagnose({ pao2: '100.2', fio2Mode: 'direct', fio2Direct: '50', o2Flow: '' });

    expect(scores.scores.respiratory).toBe(2);
  });
});

describe('FiO₂ 입력', () => {
  it('FiO₂를 %로 직접 입력할 수 있다', () => {
    const { validatedInputs } = validate({ pao2: '90', fio2Mode: 'direct', fio2Direct: '60', o2Flow: '' });

    expect(validatedInputs.fio2).toBe(60);
    expect(validatedInputs.pfRatio).toBe(150);
  });

  it('비강 캐뉼라는 6 L/min까지 입력할 수 있다 (FiO₂ 45%)', () => {
    const { isValid, validatedInputs } = validate({ o2Flow: '6' });

    expect(isValid).toBe(true);
    expect(validatedInputs.fio2).toBe(45);
  });

  it.each(['20', '101'])('FiO₂ 직접 입력 %s는 범위(21-100) 밖이라 오류', (fio2Direct) => {
    const { errors } = validate({ fio2Mode: 'direct', fio2Direct, o2Flow: '' });

    expect(errors.fio2Direct).toBeDefined();
  });
});

describe('기계환기 (Jalan 2014)', () => {
  it('호흡부전으로 기계환기 중이면 산소화 지표 없이 호흡 3점', () => {
    const { scores } = diagnose({ mechVent: true, mechVentReason: 'other', pao2: '', o2Flow: '' });

    expect(scores.scores.respiratory).toBe(3);
    expect(scores.organFailures).toContain('respiratory');
  });

  it('간성뇌증으로 기계환기 중이면 뇌 3점', () => {
    const { scores } = diagnose({ mechVent: true, mechVentReason: 'he' });

    expect(scores.scores.brain).toBe(3);
    expect(scores.scores.respiratory).toBe(1);
  });

  it('기계환기 이유를 고르지 않으면 오류', () => {
    expect(validate({ mechVent: true, mechVentReason: '' }).errors.mechVentReason).toBeDefined();
  });
});

describe('잠긴 입력칸은 요구하지 않는다', () => {
  it('RRT면 Creatinine이 비어 있어도 계산한다', () => {
    expect(validate({ rrt: true, creatinine: '' }).isValid).toBe(true);
  });

  it('승압제 사용 중이면 혈압이 비어 있어도 계산한다', () => {
    expect(validate({ vasopressors: true, sbp: '', dbp: '' }).isValid).toBe(true);
  });
});

describe('혈압 입력', () => {
  it('MAP을 직접 입력할 수 있다', () => {
    const { isValid, validatedInputs } = validate({ mapMode: 'direct', mapDirect: '65', sbp: '', dbp: '' });

    expect(isValid).toBe(true);
    expect(validatedInputs.map).toBe(65);
  });

  it('이완기 혈압이 수축기 혈압 이상이면 오류', () => {
    expect(validate({ sbp: '80', dbp: '90' }).errors.dbp).toBeDefined();
  });
});

describe('다음 단계 점수 입력 (나이·WBC·Na)', () => {
  it('ACLF 점수는 나이와 WBC만 있으면 계산할 수 있다', () => {
    const result = validateFollowUpInputs({ age: '60', wbc: '15000', sodium: '' }, { needsSodium: false });

    expect(result.isComplete).toBe(true);
    expect(result.validated).toEqual({ age: 60, wbc: 15000 });
  });

  it('AD 점수는 Na까지 있어야 계산할 수 있다', () => {
    const result = validateFollowUpInputs({ age: '60', wbc: '15000', sodium: '' }, { needsSodium: true });

    expect(result.isComplete).toBe(false);
    expect(result.errors).toEqual({});
  });

  it('범위를 벗어난 값은 오류를 낸다', () => {
    const result = validateFollowUpInputs({ age: '10', wbc: '15000', sodium: '200' }, { needsSodium: true });

    expect(result.isComplete).toBe(false);
    expect(result.errors.age).toBeDefined();
    expect(result.errors.sodium).toBeDefined();
  });
});
