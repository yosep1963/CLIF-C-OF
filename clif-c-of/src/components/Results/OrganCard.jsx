import React from 'react';
import './Results.css';

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

  const getColorClass = () => {
    switch (color) {
      case 'green':
        return 'status-normal';
      case 'yellow':
        return 'status-warning';
      case 'red':
        return 'status-failure';
      default:
        return 'status-unknown';
    }
  };

  return (
    <div className={`organ-card ${getColorClass()} ${isFailure ? 'is-failure' : ''}`}>
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
        <span className={`score-badge ${getColorClass()}`}>
          {score !== null ? `${score}점` : '-'}
        </span>
        <span className="status-text">{statusText}</span>
      </div>
    </div>
  );
}

export default OrganCard;
