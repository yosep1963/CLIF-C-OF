import React from 'react';
import './InputForm.css';

function ToggleSwitch({ label, checked, onChange, disabled = false }) {
  return (
    <div className="toggle-switch-container">
      <label className="toggle-label">{label}</label>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`toggle-switch ${checked ? 'active' : ''}`}
        onClick={() => onChange(!checked)}
        disabled={disabled}
      >
        <span className="toggle-slider" />
      </button>
      <span className="toggle-status">{checked ? 'Yes' : 'No'}</span>
    </div>
  );
}

export default ToggleSwitch;
