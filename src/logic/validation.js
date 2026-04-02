/**
 * 입력값 유효성 검사 및 계산 로직
 * CLIF-C OF 점수 계산을 위한 입력값 검증
 */

import { VALIDATION_RANGES } from '../constants';

// 유틸리티: 값이 비어있는지 확인
const isEmpty = (value) => value === null || value === undefined || value === '';

// 유틸리티: 안전한 숫자 변환
const safeParseFloat = (value) => {
  if (isEmpty(value)) return null;
  const num = parseFloat(value);
  return isNaN(num) ? null : num;
};

/**
 * 단일 필드 값 검증
 * @param {string} field - 필드명
 * @param {any} value - 검증할 값
 * @returns {{ valid: boolean, value?: number, error?: string }}
 */
export function validateValue(field, value) {
  if (isEmpty(value)) {
    return { valid: false, error: '값을 입력해주세요' };
  }

  const numValue = safeParseFloat(value);
  if (numValue === null) {
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

/**
 * P/F Ratio 계산
 * @param {number} pao2 - PaO2 (mmHg)
 * @param {number} fio2 - FiO2 (% 또는 소수)
 * @returns {number|null}
 */
export function calculatePFRatio(pao2, fio2) {
  const pao2Val = safeParseFloat(pao2);
  const fio2Val = safeParseFloat(fio2);

  if (pao2Val === null || fio2Val === null) return null;

  // FiO2가 1보다 크면 백분율로 간주
  const fio2Decimal = fio2Val > 1 ? fio2Val / 100 : fio2Val;
  if (fio2Decimal <= 0) return null;

  return Math.round(pao2Val / fio2Decimal);
}

/**
 * MAP (평균동맥압) 계산
 * 공식: MAP = (SBP + 2 * DBP) / 3
 * @param {number} sbp - 수축기 혈압
 * @param {number} dbp - 이완기 혈압
 * @returns {number|null}
 */
export function calculateMAP(sbp, dbp) {
  const sbpVal = safeParseFloat(sbp);
  const dbpVal = safeParseFloat(dbp);

  if (sbpVal === null || dbpVal === null) return null;

  return Math.round((sbpVal + 2 * dbpVal) / 3);
}

/**
 * FiO2 계산 (Nasal Prong 기준)
 * 공식: FiO2 = 21 + (4 * L/min)
 * @param {number} o2FlowLpm - 산소 유량 (L/min)
 * @returns {number|null}
 */
export function calculateFiO2FromFlow(o2FlowLpm) {
  const flowVal = safeParseFloat(o2FlowLpm);
  if (flowVal === null) return null;

  return 21 + (4 * flowVal);
}

/**
 * SpO2에서 PaO2 추정 (Severinghaus 공식 역산)
 * 공식: PaO2 = 11.2 * ln(SpO2 / (100 - SpO2)) + 26.6
 * @param {number} spo2 - 산소포화도 (%)
 * @returns {number|null}
 */
export function estimatePaO2FromSpO2(spo2) {
  const spo2Val = safeParseFloat(spo2);
  if (spo2Val === null || spo2Val < 70 || spo2Val >= 100) return null;

  const ratio = spo2Val / (100 - spo2Val);
  const estimatedPaO2 = 11.2 * Math.log(ratio) + 26.6;

  // 결과를 합리적인 범위로 제한 (30-150 mmHg)
  return Math.round(Math.max(30, Math.min(150, estimatedPaO2)));
}

/**
 * SpO2 사용 시 경고 레벨 반환
 * @param {number} spo2 - 산소포화도 (%)
 * @returns {{ level: string, message: string }}
 */
export function getSpO2Warning(spo2) {
  const spo2Val = safeParseFloat(spo2);

  if (spo2Val === null) {
    return { level: 'none', message: '' };
  }

  if (spo2Val > 97) {
    return {
      level: 'warning',
      message: 'SpO2 > 97%: PaO2 추정이 매우 부정확합니다. 가능하면 동맥혈 가스 분석을 권장합니다.'
    };
  }

  if (spo2Val > 94) {
    return {
      level: 'caution',
      message: 'SpO2 94-97%: PaO2 추정치의 정확도가 제한됩니다.'
    };
  }

  return { level: 'none', message: '' };
}

// 검증할 필드 목록 정의
const REQUIRED_FIELDS = ['bilirubin', 'creatinine', 'inr', 'sbp', 'dbp', 'o2Flow'];

/**
 * 단일 필드 검증 및 결과 저장 헬퍼
 */
function validateField(field, value, errors, validatedInputs) {
  const result = validateValue(field, value);
  if (!result.valid) {
    errors[field] = result.error;
  } else {
    validatedInputs[field] = result.value;
  }
  return result.valid;
}

/**
 * 전체 입력값 검증
 * @param {Object} inputs - 입력값 객체
 * @returns {{ isValid: boolean, errors: Object, validatedInputs: Object }}
 */
export function validateAllInputs(inputs) {
  const errors = {};
  const validatedInputs = {};

  // 기본 필드들 검증
  REQUIRED_FIELDS.forEach(field => {
    validateField(field, inputs[field], errors, validatedInputs);
  });

  // MAP 계산 (SBP, DBP가 모두 유효할 때)
  if (validatedInputs.sbp && validatedInputs.dbp) {
    validatedInputs.map = calculateMAP(validatedInputs.sbp, validatedInputs.dbp);
  }

  // SpO2 모드 플래그
  validatedInputs.useSpO2 = Boolean(inputs.useSpO2);

  // PaO2 또는 SpO2 검증 (모드에 따라)
  if (inputs.useSpO2) {
    const spo2Result = validateValue('spo2', inputs.spo2);
    if (!spo2Result.valid) {
      errors.spo2 = spo2Result.error;
    } else {
      validatedInputs.spo2 = spo2Result.value;
      const estimatedPaO2 = estimatePaO2FromSpO2(spo2Result.value);
      if (estimatedPaO2) {
        validatedInputs.pao2 = estimatedPaO2;
        validatedInputs.pao2Source = 'estimated';
      } else {
        errors.spo2 = 'SpO2 값으로 PaO2를 추정할 수 없습니다 (70-99% 범위 필요)';
      }
    }
  } else {
    const pao2Result = validateValue('pao2', inputs.pao2);
    if (!pao2Result.valid) {
      errors.pao2 = pao2Result.error;
    } else {
      validatedInputs.pao2 = pao2Result.value;
      validatedInputs.pao2Source = 'measured';
    }
  }

  // FiO2 계산
  if (validatedInputs.o2Flow !== undefined) {
    validatedInputs.fio2 = calculateFiO2FromFlow(validatedInputs.o2Flow);
  }

  // P/F ratio 계산
  if (validatedInputs.pao2 && validatedInputs.fio2) {
    validatedInputs.pfRatio = calculatePFRatio(validatedInputs.pao2, validatedInputs.fio2);
  }

  // 토글 값들
  validatedInputs.rrt = Boolean(inputs.rrt);
  validatedInputs.vasopressors = Boolean(inputs.vasopressors);
  validatedInputs.heGrade = inputs.heGrade || 0;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validatedInputs
  };
}

// VALIDATION_RANGES를 re-export (하위 호환성 유지)
export { VALIDATION_RANGES };
