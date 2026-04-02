import React from 'react';
import { HE_OPTIONS } from '../../constants';
import './InputForm.css';

function HEGradeSelector({ value, onChange, disabled = false }) {
  return (
    <div className="he-grade-selector">
      <label className="input-label">HE Grade (West-Haven)</label>
      <div className="he-buttons">
        {HE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`he-button ${value === option.value ? 'selected' : ''}`}
            onClick={() => onChange(option.value)}
            disabled={disabled}
          >
            <span className="he-label">{option.label}</span>
            <span className="he-description">{option.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default HEGradeSelector;
