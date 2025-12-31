import React from 'react';
import NumericInput from './NumericInput';
import ToggleSwitch from './ToggleSwitch';
import HEGradeSelector from './HEGradeSelector';
import { VALIDATION_RANGES, calculatePFRatio } from '../../logic/validation';
import './InputForm.css';

function OrganInput({ inputs, errors, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...inputs, [field]: value });
  };

  const pfRatio = calculatePFRatio(inputs.pao2, inputs.fio2);

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
        <NumericInput
          label="MAP"
          value={inputs.map}
          onChange={(val) => handleChange('map', val)}
          unit="mmHg"
          placeholder="30 - 150"
          error={errors?.map}
          min={VALIDATION_RANGES.map.min}
          max={VALIDATION_RANGES.map.max}
          disabled={inputs.vasopressors}
        />
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
            label="FiO₂"
            value={inputs.fio2}
            onChange={(val) => handleChange('fio2', val)}
            unit="%"
            placeholder="21 - 100"
            error={errors?.fio2}
            min={VALIDATION_RANGES.fio2.min}
            max={VALIDATION_RANGES.fio2.max}
          />
        </div>
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
