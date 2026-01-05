import React, { memo } from 'react';
import './Results.css';

const COLOR_CLASS_MAP = {
  green: 'status-normal',
  yellow: 'status-warning',
  red: 'status-failure'
};

function OrganCard({ organ }) {
  const {
    name,
    indicator,
    score,
    statusText,
    color,
    value,
    unit,
    isFailure
  } = organ;

  const colorClass = COLOR_CLASS_MAP[color] || 'status-unknown';

  return (
    <div className={`organ-card ${colorClass} ${isFailure ? 'is-failure' : ''}`}>
      <div className="organ-card-header">
        <span className="organ-card-name">{name}</span>
        {isFailure && <span className="failure-badge">부전</span>}
      </div>
      <div className="organ-card-body">
        <div className="organ-card-indicator">{indicator}</div>
        <div className="organ-card-value">
          {value !== null && value !== undefined ? (
            <>
              <span className="value">{value}</span>
              {unit && <span className="unit">{unit}</span>}
            </>
          ) : (
            <span className="no-value">-</span>
          )}
        </div>
      </div>
      <div className="organ-card-footer">
        <span className={`score-badge ${colorClass}`}>
          {score !== null ? `${score}점` : '-'}
        </span>
        <span className="status-text">{statusText}</span>
      </div>
    </div>
  );
}

export default memo(OrganCard);
