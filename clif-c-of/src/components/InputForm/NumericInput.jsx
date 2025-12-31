import React from 'react';
import './InputForm.css';

function NumericInput({
  label,
  value,
  onChange,
  unit,
  placeholder,
  error,
  min,
  max,
  step = 0.1,
  disabled = false
}) {
  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val === '' ? '' : val);
  };

  return (
    <div className={`numeric-input ${error ? 'has-error' : ''}`}>
      <label className="input-label">{label}</label>
      <div className="input-wrapper">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          className="input-field"
        />
        {unit && <span className="input-unit">{unit}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export default NumericInput;
