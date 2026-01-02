// 입력값 유효성 검사 로직

export const VALIDATION_RANGES = {
  bilirubin: { min: 0.1, max: 50, unit: 'mg/dL' },
  creatinine: { min: 0.1, max: 15, unit: 'mg/dL' },
  inr: { min: 0.5, max: 10, unit: '' },
  sbp: { min: 60, max: 250, unit: 'mmHg' },
  dbp: { min: 30, max: 150, unit: 'mmHg' },
  pao2: { min: 30, max: 600, unit: 'mmHg' },
  o2Flow: { min: 0, max: 5, unit: 'L/min' },
  pfRatio: { min: 50, max: 600, unit: '' }
};

export function validateValue(field, value) {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: '값을 입력해주세요' };
  }

  const numValue = parseFloat(value);

  if (isNaN(numValue)) {
    return { valid: false, error: '숫자를 입력해주세요' };
  }

  const range = VALIDATION_RANGES[field];
  if (!range) {
    return { valid: true, value: numValue };
  }

  if (numValue < range.min || numValue > range.max) {
    return {
      valid: false,
      error: `유효 범위: ${range.min} - ${range.max} ${range.unit}`
    };
  }

  return { valid: true, value: numValue };
}

export function calculatePFRatio(pao2, fio2) {
  if (!pao2 || !fio2) return null;

  const pao2Val = parseFloat(pao2);
  const fio2Val = parseFloat(fio2);

  if (isNaN(pao2Val) || isNaN(fio2Val)) return null;

  // FiO2가 100 이하면 백분율로 간주, 1 이하면 소수점으로 간주
  const fio2Decimal = fio2Val > 1 ? fio2Val / 100 : fio2Val;

  if (fio2Decimal <= 0) return null;

  return Math.round(pao2Val / fio2Decimal);
}

// MAP 계산: MAP = (SBP + 2 * DBP) / 3
export function calculateMAP(sbp, dbp) {
  if (sbp === null || sbp === undefined || sbp === '') return null;
  if (dbp === null || dbp === undefined || dbp === '') return null;

  const sbpVal = parseFloat(sbp);
  const dbpVal = parseFloat(dbp);

  if (isNaN(sbpVal) || isNaN(dbpVal)) return null;

  return Math.round((sbpVal + 2 * dbpVal) / 3);
}

// FiO2 계산: FiO2 = 21 + (4 * L/min) [nasal prong 기준]
export function calculateFiO2FromFlow(o2FlowLpm) {
  if (o2FlowLpm === null || o2FlowLpm === undefined || o2FlowLpm === '') return null;

  const flowVal = parseFloat(o2FlowLpm);

  if (isNaN(flowVal)) return null;

  return 21 + (4 * flowVal);
}

export function validateAllInputs(inputs) {
  const errors = {};
  const validatedInputs = {};

  // Bilirubin 검증
  const bilResult = validateValue('bilirubin', inputs.bilirubin);
  if (!bilResult.valid) {
    errors.bilirubin = bilResult.error;
  } else {
    validatedInputs.bilirubin = bilResult.value;
  }

  // Creatinine 검증
  const crResult = validateValue('creatinine', inputs.creatinine);
  if (!crResult.valid) {
    errors.creatinine = crResult.error;
  } else {
    validatedInputs.creatinine = crResult.value;
  }

  // INR 검증
  const inrResult = validateValue('inr', inputs.inr);
  if (!inrResult.valid) {
    errors.inr = inrResult.error;
  } else {
    validatedInputs.inr = inrResult.value;
  }

  // SBP 검증
  const sbpResult = validateValue('sbp', inputs.sbp);
  if (!sbpResult.valid) {
    errors.sbp = sbpResult.error;
  } else {
    validatedInputs.sbp = sbpResult.value;
  }

  // DBP 검증
  const dbpResult = validateValue('dbp', inputs.dbp);
  if (!dbpResult.valid) {
    errors.dbp = dbpResult.error;
  } else {
    validatedInputs.dbp = dbpResult.value;
  }

  // MAP 계산 (SBP, DBP가 모두 유효할 때)
  if (validatedInputs.sbp && validatedInputs.dbp) {
    validatedInputs.map = calculateMAP(validatedInputs.sbp, validatedInputs.dbp);
  }

  // PaO2 검증
  const pao2Result = validateValue('pao2', inputs.pao2);
  if (!pao2Result.valid) {
    errors.pao2 = pao2Result.error;
  } else {
    validatedInputs.pao2 = pao2Result.value;
  }

  // O2 Flow 검증
  const o2FlowResult = validateValue('o2Flow', inputs.o2Flow);
  if (!o2FlowResult.valid) {
    errors.o2Flow = o2FlowResult.error;
  } else {
    validatedInputs.o2Flow = o2FlowResult.value;
  }

  // FiO2 계산 (O2 Flow가 유효할 때)
  if (validatedInputs.o2Flow !== undefined) {
    validatedInputs.fio2 = calculateFiO2FromFlow(validatedInputs.o2Flow);
  }

  // P/F ratio 계산
  if (validatedInputs.pao2 && validatedInputs.fio2) {
    validatedInputs.pfRatio = calculatePFRatio(
      validatedInputs.pao2,
      validatedInputs.fio2
    );
  }

  // 토글 값들 (boolean)
  validatedInputs.rrt = Boolean(inputs.rrt);
  validatedInputs.vasopressors = Boolean(inputs.vasopressors);
  validatedInputs.heGrade = inputs.heGrade || 0;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validatedInputs
  };
}
