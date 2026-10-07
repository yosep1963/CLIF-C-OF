import React from 'react';
import './InputForm.css';

function OptionToggle({ label, options, value, onChange, error }) {
  return (
    <div className="option-toggle">
      <span className="toggle-label">{label}</span>
      <div className="toggle-button-group">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            className={`toggle-option ${value === option.value ? 'active' : ''}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export default OptionToggle;
