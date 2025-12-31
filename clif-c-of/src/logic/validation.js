// 입력값 유효성 검사 로직

export const VALIDATION_RANGES = {
  bilirubin: { min: 0.1, max: 50, unit: 'mg/dL' },
  creatinine: { min: 0.1, max: 15, unit: 'mg/dL' },
  inr: { min: 0.5, max: 10, unit: '' },
  map: { min: 30, max: 150, unit: 'mmHg' },
  pao2: { min: 30, max: 600, unit: 'mmHg' },
  fio2: { min: 21, max: 100, unit: '%' },
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

  // MAP 검증
  const mapResult = validateValue('map', inputs.map);
  if (!mapResult.valid) {
    errors.map = mapResult.error;
  } else {
    validatedInputs.map = mapResult.value;
  }

  // PaO2 검증
  const pao2Result = validateValue('pao2', inputs.pao2);
  if (!pao2Result.valid) {
    errors.pao2 = pao2Result.error;
  } else {
    validatedInputs.pao2 = pao2Result.value;
  }

  // FiO2 검증
  const fio2Result = validateValue('fio2', inputs.fio2);
  if (!fio2Result.valid) {
    errors.fio2 = fio2Result.error;
  } else {
    validatedInputs.fio2 = fio2Result.value;
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
