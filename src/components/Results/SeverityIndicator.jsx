import React, { memo } from 'react';
import { SEVERITY_INFO, SEVERITY_LEVELS } from '../../constants';
import './Results.css';

const SEVERITY_LABELS = {
  [SEVERITY_LEVELS.LOW]: '저위험',
  [SEVERITY_LEVELS.MODERATE]: '중위험',
  [SEVERITY_LEVELS.HIGH]: '고위험',
  [SEVERITY_LEVELS.CRITICAL]: '초고위험'
};

function SeverityIndicator({ severity, mortality }) {
  const info = SEVERITY_INFO[severity] || {
    color: '#6B7280',
    bgColor: '#F3F4F6',
    icon: '-'
  };

  const label = SEVERITY_LABELS[severity] || '-';

  return (
    <div
      className="severity-indicator"
      style={{ backgroundColor: info.bgColor }}
    >
      <div className="severity-icon" style={{ color: info.color }}>
        {info.icon}
      </div>
      <div className="severity-content">
        <span className="severity-label" style={{ color: info.color }}>
          {label}
        </span>
        <span className="mortality-rate">
          28일 사망률: <strong>{mortality}</strong>
        </span>
      </div>
    </div>
  );
}

export default memo(SeverityIndicator);
