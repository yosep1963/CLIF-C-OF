import React from 'react';
import NumericInput from './NumericInput';
import ToggleSwitch from './ToggleSwitch';
import HEGradeSelector from './HEGradeSelector';
import { VALIDATION_RANGES, calculatePFRatio, calculateMAP, calculateFiO2FromFlow } from '../../logic/validation';
import './InputForm.css';

function OrganInput({ inputs, errors, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...inputs, [field]: value });
  };

  // MAP 계산 (SBP, DBP로부터)
  const calculatedMAP = calculateMAP(inputs.sbp, inputs.dbp);

  // FiO2 계산 (O2 유량으로부터)
  const calculatedFiO2 = calculateFiO2FromFlow(inputs.o2Flow);

  // P/F Ratio 계산 (계산된 FiO2 사용)
  const pfRatio = calculatePFRatio(inputs.pao2, calculatedFiO2);

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
        <div className="pf-ratio-inputs">
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
          </div>
        )}
      </div>
    </div>
  );
}

export default OrganInput;
