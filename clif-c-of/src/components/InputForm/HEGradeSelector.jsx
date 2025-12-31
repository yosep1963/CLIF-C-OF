import React from 'react';
import './InputForm.css';

const HE_OPTIONS = [
  { value: 0, label: 'Grade 0', description: '정상' },
  { value: 1, label: 'Grade 1-2', description: '경도' },
  { value: 2, label: 'Grade 3-4', description: '중증' }
];

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
