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
 * 산소화 비 계산: P/F (PaO2/FiO2) 또는 S/F (SpO2/FiO2)
 * 점수 판정에 쓰므로 반올림하지 않음 (화면에서만 반올림)
 * @param {number} value - PaO2 (mmHg) 또는 SpO2 (%)
 * @param {number} fio2 - FiO2 (% 또는 소수)
 * @returns {number|null}
 */
export function calculateOxygenRatio(value, fio2) {
  const numerator = safeParseFloat(value);
  const fio2Val = safeParseFloat(fio2);

  if (numerator === null || fio2Val === null) return null;

  // FiO2가 1보다 크면 백분율로 간주
  const fio2Decimal = fio2Val > 1 ? fio2Val / 100 : fio2Val;
  if (fio2Decimal <= 0) return null;

  return numerator / fio2Decimal;
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
 * SpO2 사용 시 경고 반환 (S/F 비는 SpO2 97% 이하에서만 P/F와 잘 맞음)
 * @param {number} spo2 - 산소포화도 (%)
 * @returns {{ level: string, message: string }}
 */
export function getSpO2Warning(spo2) {
  const spo2Val = safeParseFloat(spo2);

  if (spo2Val !== null && spo2Val > 97) {
    return {
      level: 'warning',
      message: 'SpO₂ 97% 초과: S/F 비가 실제 산소화를 반영하지 못할 수 있습니다. 가능하면 동맥혈 가스(PaO₂)로 평가하세요.'
    };
  }

  return { level: 'none', message: '' };
}

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

  // 간, 응고
  validateField('bilirubin', inputs.bilirubin, errors, validatedInputs);
  validateField('inr', inputs.inr, errors, validatedInputs);

  // 신장: RRT면 3점이므로 Creatinine 불필요
  validatedInputs.rrt = Boolean(inputs.rrt);
  if (!validatedInputs.rrt) {
    validateField('creatinine', inputs.creatinine, errors, validatedInputs);
  }

  // 뇌
  validatedInputs.heGrade = inputs.heGrade || 0;

  // 순환: 승압제 사용 중이면 3점이므로 혈압 불필요
  validatedInputs.vasopressors = Boolean(inputs.vasopressors);
  validatedInputs.mapMode = inputs.mapMode === 'direct' ? 'direct' : 'bp';
  if (!validatedInputs.vasopressors) {
    if (validatedInputs.mapMode === 'direct') {
      const mapResult = validateValue('map', inputs.mapDirect);
      if (!mapResult.valid) {
        errors.mapDirect = mapResult.error;
      } else {
        validatedInputs.mapDirect = mapResult.value;
        validatedInputs.map = mapResult.value;
      }
    } else {
      const sbpValid = validateField('sbp', inputs.sbp, errors, validatedInputs);
      const dbpValid = validateField('dbp', inputs.dbp, errors, validatedInputs);
      if (sbpValid && dbpValid) {
        if (validatedInputs.dbp >= validatedInputs.sbp) {
          errors.dbp = '이완기 혈압은 수축기 혈압보다 낮아야 합니다';
        } else {
          validatedInputs.map = calculateMAP(validatedInputs.sbp, validatedInputs.dbp);
        }
      }
    }
  }

  // 기계환기: 간성뇌증 때문이면 뇌부전, 그 외 이유면 호흡부전 (Jalan 2014)
  validatedInputs.mechVent = Boolean(inputs.mechVent);
  if (validatedInputs.mechVent) {
    if (inputs.mechVentReason === 'he' || inputs.mechVentReason === 'other') {
      validatedInputs.mechVentReason = inputs.mechVentReason;
    } else {
      errors.mechVentReason = '기계환기 이유를 선택해주세요';
    }
  }

  // 호흡: 호흡부전으로 기계환기 중이면 3점이므로 산소화 지표 불필요
  validatedInputs.useSpO2 = Boolean(inputs.useSpO2);
  validatedInputs.fio2Mode = inputs.fio2Mode === 'direct' ? 'direct' : 'flow';
  if (validatedInputs.mechVentReason !== 'other') {
    const oxygenField = validatedInputs.useSpO2 ? 'spo2' : 'pao2';
    const oxygenValid = validateField(oxygenField, inputs[oxygenField], errors, validatedInputs);

    if (validatedInputs.fio2Mode === 'direct') {
      const fio2Result = validateValue('fio2Direct', inputs.fio2Direct);
      if (!fio2Result.valid) {
        errors.fio2Direct = fio2Result.error;
      } else {
        validatedInputs.fio2Direct = fio2Result.value;
        validatedInputs.fio2 = fio2Result.value;
      }
    } else if (validateField('o2Flow', inputs.o2Flow, errors, validatedInputs)) {
      validatedInputs.fio2 = calculateFiO2FromFlow(validatedInputs.o2Flow);
    }

    // PaO2 → P/F, SpO2 → S/F (CLIF-C OF는 SpO2를 PaO2로 환산하지 않고 S/F 기준을 따로 둠)
    if (oxygenValid && validatedInputs.fio2) {
      const ratio = calculateOxygenRatio(validatedInputs[oxygenField], validatedInputs.fio2);
      if (validatedInputs.useSpO2) {
        validatedInputs.sfRatio = ratio;
      } else {
        validatedInputs.pfRatio = ratio;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    validatedInputs
  };
}

/**
 * 다음 단계 점수 입력 검증 (ACLF: 나이·WBC, ACLF 아님: 나이·WBC·Na)
 * 빈 칸은 오류로 보지 않고 아직 계산하지 않음
 * @param {Object} values - { age, wbc, sodium } 입력값
 * @param {{ needsSodium: boolean }} options
 * @returns {{ isComplete: boolean, errors: Object, validated: Object }}
 */
export function validateFollowUpInputs(values, { needsSodium }) {
  const fields = needsSodium ? ['age', 'wbc', 'sodium'] : ['age', 'wbc'];
  const errors = {};
  const validated = {};

  fields.forEach((field) => {
    if (isEmpty(values[field])) return;
    const result = validateValue(field, values[field]);
    if (result.valid) {
      validated[field] = result.value;
    } else {
      errors[field] = result.error;
    }
  });

  return {
    isComplete: fields.every((field) => field in validated),
    errors,
    validated
  };
}

// VALIDATION_RANGES를 re-export (하위 호환성 유지)
export { VALIDATION_RANGES };
