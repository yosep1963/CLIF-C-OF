import React from 'react';
import NumericInput from './NumericInput';
import ToggleSwitch from './ToggleSwitch';
import HEGradeSelector from './HEGradeSelector';
import {
  VALIDATION_RANGES,
  calculatePFRatio,
  calculateMAP,
  calculateFiO2FromFlow,
  estimatePaO2FromSpO2,
  getSpO2Warning
} from '../../logic/validation';
import './InputForm.css';

function OrganInput({ inputs, errors, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...inputs, [field]: value });
  };

  // MAP 계산 (SBP, DBP로부터)
  const calculatedMAP = calculateMAP(inputs.sbp, inputs.dbp);

  // FiO2 계산 (O2 유량으로부터)
  const calculatedFiO2 = calculateFiO2FromFlow(inputs.o2Flow);

  // SpO2에서 PaO2 추정 (SpO2 모드일 때)
  const estimatedPaO2 = inputs.useSpO2 ? estimatePaO2FromSpO2(inputs.spo2) : null;

  // 실제 사용할 PaO2 값 결정
  const effectivePaO2 = inputs.useSpO2 ? estimatedPaO2 : inputs.pao2;

  // P/F Ratio 계산 (계산된 FiO2 사용)
  const pfRatio = calculatePFRatio(effectivePaO2, calculatedFiO2);

  // SpO2 경고 레벨
  const spO2Warning = inputs.useSpO2 ? getSpO2Warning(inputs.spo2) : { level: 'none', message: '' };

  return (
    <div className="organ-input-container">
      {/* 간 (Liver) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🫘</span>
          간 (Liver)
        </h3>
        <NumericInput
          label="Bilirubin"
          value={inputs.bilirubin}
          onChange={(val) => handleChange('bilirubin', val)}
          unit="mg/dL"
          placeholder="0.1 - 50"
          error={errors?.bilirubin}
          min={VALIDATION_RANGES.bilirubin.min}
          max={VALIDATION_RANGES.bilirubin.max}
        />
      </div>

      {/* 신장 (Kidney) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🫘</span>
          신장 (Kidney)
        </h3>
        <NumericInput
          label="Creatinine"
          value={inputs.creatinine}
          onChange={(val) => handleChange('creatinine', val)}
          unit="mg/dL"
          placeholder="0.1 - 15"
          error={errors?.creatinine}
          min={VALIDATION_RANGES.creatinine.min}
          max={VALIDATION_RANGES.creatinine.max}
          disabled={inputs.rrt}
        />
        <ToggleSwitch
          label="RRT (투석)"
          checked={inputs.rrt || false}
          onChange={(val) => handleChange('rrt', val)}
        />
      </div>

      {/* 뇌 (Brain) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🧠</span>
          뇌 (Brain)
        </h3>
        <HEGradeSelector
          value={inputs.heGrade || 0}
          onChange={(val) => handleChange('heGrade', val)}
        />
      </div>

      {/* 응고 (Coagulation) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🩸</span>
          응고 (Coagulation)
        </h3>
        <NumericInput
          label="INR"
          value={inputs.inr}
          onChange={(val) => handleChange('inr', val)}
          unit=""
          placeholder="0.5 - 10"
          error={errors?.inr}
          min={VALIDATION_RANGES.inr.min}
          max={VALIDATION_RANGES.inr.max}
        />
      </div>

      {/* 순환 (Circulation) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">❤️</span>
          순환 (Circulation)
        </h3>
        <div className="blood-pressure-inputs">
          <NumericInput
            label="SBP"
            value={inputs.sbp}
            onChange={(val) => handleChange('sbp', val)}
            unit="mmHg"
            placeholder="60 - 250"
            error={errors?.sbp}
            min={VALIDATION_RANGES.sbp.min}
            max={VALIDATION_RANGES.sbp.max}
            disabled={inputs.vasopressors}
          />
          <NumericInput
            label="DBP"
            value={inputs.dbp}
            onChange={(val) => handleChange('dbp', val)}
            unit="mmHg"
            placeholder="30 - 150"
            error={errors?.dbp}
            min={VALIDATION_RANGES.dbp.min}
            max={VALIDATION_RANGES.dbp.max}
            disabled={inputs.vasopressors}
          />
        </div>
        {calculatedMAP && !inputs.vasopressors && (
          <div className="calculated-value-display">
            <span className="calculated-value-label">MAP:</span>
            <span className="calculated-value">{calculatedMAP} mmHg</span>
          </div>
        )}
        <ToggleSwitch
          label="승압제 사용"
          checked={inputs.vasopressors || false}
          onChange={(val) => handleChange('vasopressors', val)}
        />
      </div>

      {/* 호흡 (Respiratory) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🫁</span>
          호흡 (Respiratory)
        </h3>

        {/* PaO2/SpO2 선택 토글 */}
        <div className="oxygen-source-toggle">
          <span className="toggle-label">산소화 지표 선택</span>
          <div className="toggle-button-group">
            <button
              type="button"
              className={`toggle-option ${!inputs.useSpO2 ? 'active' : ''}`}
              onClick={() => handleChange('useSpO2', false)}
            >
              PaO₂ (동맥혈)
            </button>
            <button
              type="button"
              className={`toggle-option ${inputs.useSpO2 ? 'active' : ''}`}
              onClick={() => handleChange('useSpO2', true)}
            >
              SpO₂ (맥박산소측정)
            </button>
          </div>
        </div>

        {/* SpO2 사용 시 경고 메시지 */}
        {inputs.useSpO2 && (
          <div className={`oxygen-warning ${spO2Warning.level}`}>
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              SpO₂에서 추정된 PaO₂는 실제 값과 차이가 있을 수 있습니다.
              {spO2Warning.message && <><br />{spO2Warning.message}</>}
            </span>
          </div>
        )}

        <div className="pf-ratio-inputs">
          {/* 조건부 렌더링: PaO2 또는 SpO2 */}
          {!inputs.useSpO2 ? (
            <NumericInput
              label="PaO₂"
              value={inputs.pao2}
              onChange={(val) => handleChange('pao2', val)}
              unit="mmHg"
              placeholder="30 - 600"
              error={errors?.pao2}
              min={VALIDATION_RANGES.pao2.min}
              max={VALIDATION_RANGES.pao2.max}
            />
          ) : (
            <NumericInput
              label="SpO₂"
              value={inputs.spo2}
              onChange={(val) => handleChange('spo2', val)}
              unit="%"
              placeholder="70 - 100"
              error={errors?.spo2}
              min={VALIDATION_RANGES.spo2.min}
              max={VALIDATION_RANGES.spo2.max}
            />
          )}
          <NumericInput
            label="O₂ 유량"
            value={inputs.o2Flow}
            onChange={(val) => handleChange('o2Flow', val)}
            unit="L/min"
            placeholder="0 - 5"
            error={errors?.o2Flow}
            min={VALIDATION_RANGES.o2Flow.min}
            max={VALIDATION_RANGES.o2Flow.max}
          />
        </div>

        {/* SpO2 사용 시 추정 PaO2 표시 */}
        {inputs.useSpO2 && estimatedPaO2 && (
          <div className="estimated-value-display">
            <span className="estimated-value-label">추정 PaO₂:</span>
            <span className="estimated-value">{estimatedPaO2} mmHg</span>
            <span className="estimated-note">(Severinghaus 공식)</span>
          </div>
        )}

        {calculatedFiO2 && (
          <div className="calculated-value-display">
            <span className="calculated-value-label">FiO₂:</span>
            <span className="calculated-value">{calculatedFiO2}%</span>
          </div>
        )}
        {pfRatio && (
          <div className="pf-ratio-display">
            <span className="pf-ratio-label">P/F Ratio:</span>
            <span className="pf-ratio-value">{pfRatio}</span>
            {inputs.useSpO2 && <span className="pf-note">(추정치)</span>}
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganInput;
