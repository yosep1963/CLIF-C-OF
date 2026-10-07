import { describe, it, expect } from 'vitest';
import { buildDiagnosis, recomputeHistoryRecord } from './diagnosis';

// validateAllInputs를 거친 입력, 모든 장기 정상
const VALID_INPUTS = {
  bilirubin: 1.0,
  creatinine: 1.0,
  rrt: false,
  heGrade: 0,
  inr: 1.2,
  mapMode: 'bp',
  sbp: 120,
  dbp: 70,
  map: 87,
  vasopressors: false,
  mechVent: false,
  useSpO2: false,
  fio2Mode: 'flow',
  pao2: 95,
  o2Flow: 0,
  fio2: 21,
  pfRatio: 452.4
};

describe('진단 결과 만들기', () => {
  it('단독 신부전(Cr 2.5)은 ACLF-1, 총점 7, 28일 사망률 22.1%', () => {
    const diagnosis = buildDiagnosis({ ...VALID_INPUTS, creatinine: 2.5 });

    expect(diagnosis.grade).toBe('ACLF-1');
    expect(diagnosis.totalScore).toBe(7);
    expect(diagnosis.mortality).toBe('22.1%');
  });
});

describe('이전 버전 이력 다시 계산', () => {
  // 2026-04 버전: Cr 2.0-3.4를 신부전으로 보지 않던 시기의 기록
  const KIDNEY_RECORD = {
    id: 1,
    timestamp: '2026-04-10T09:00:00.000Z',
    inputs: { ...VALID_INPUTS, creatinine: 2.5 },
    grade: 'No ACLF',
    totalScore: 7,
    mortality: '< 5%'
  };

  // 2026-01 버전: SpO2를 PaO2로 환산해 P/F로 평가하던 시기의 기록 (sfRatio 없음)
  const SPO2_RECORD = {
    id: 2,
    timestamp: '2026-01-05T09:00:00.000Z',
    inputs: {
      bilirubin: 15,
      creatinine: 1.0,
      rrt: false,
      heGrade: 0,
      inr: 1.2,
      sbp: 120,
      dbp: 70,
      map: 87,
      vasopressors: false,
      useSpO2: true,
      spo2: 92,
      pao2: 54,
      pao2Source: 'estimated',
      o2Flow: 2,
      fio2: 29,
      pfRatio: 186
    },
    grade: 'ACLF-2',
    totalScore: 10
  };

  it('현재 신부전 기준으로 다시 계산하고 바뀐 판정을 표시한다', () => {
    const record = recomputeHistoryRecord(KIDNEY_RECORD);

    expect(record.grade).toBe('ACLF-1');
    expect(record.savedGrade).toBe('No ACLF');
    expect(record.isChanged).toBe(true);
  });

  it('SpO₂ 기록은 S/F로 다시 평가한다 (S/F 317 → 호흡 2점, No ACLF)', () => {
    const record = recomputeHistoryRecord(SPO2_RECORD);

    expect(record.scores.respiratory).toBe(2);
    expect(record.grade).toBe('No ACLF');
    expect(record.savedTotalScore).toBe(10);
    expect(record.totalScore).toBe(9);
  });

  it('id·저장 시각·다음 단계 입력은 그대로 둔다', () => {
    const followUp = { age: '60', wbc: '15000', sodium: '' };
    const record = recomputeHistoryRecord({ ...KIDNEY_RECORD, followUp });

    expect(record.id).toBe(1);
    expect(record.timestamp).toBe('2026-04-10T09:00:00.000Z');
    expect(record.followUp).toEqual(followUp);
  });

  it('판정과 총점이 같으면 바뀌지 않은 것으로 표시한다', () => {
    const current = buildDiagnosis({ ...VALID_INPUTS, creatinine: 2.5 });
    const record = recomputeHistoryRecord({ ...current, id: 3, timestamp: '2026-10-07T09:00:00.000Z' });

    expect(record.isChanged).toBe(false);
  });

  it('입력값이 없는 기록은 그대로 돌려준다', () => {
    const broken = { id: 4, grade: 'ACLF-1' };

    expect(recomputeHistoryRecord(broken)).toEqual(broken);
  });
});
