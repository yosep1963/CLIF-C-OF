import React from 'react';
import './Results.css';

function SeverityIndicator({ severity, mortality }) {
  const getSeverityInfo = () => {
    switch (severity) {
      case 'low':
        return {
          label: '저위험',
          color: '#10B981',
          bgColor: '#D1FAE5',
          icon: '✓'
        };
      case 'medium':
        return {
          label: '중위험',
          color: '#F59E0B',
          bgColor: '#FEF3C7',
          icon: '⚠'
        };
      case 'high':
        return {
          label: '고위험',
          color: '#EF4444',
          bgColor: '#FEE2E2',
          icon: '⚠'
        };
      case 'critical':
        return {
          label: '초고위험',
          color: '#DC2626',
          bgColor: '#FEE2E2',
          icon: '⛔'
        };
      default:
        return {
          label: '-',
          color: '#6B7280',
          bgColor: '#F3F4F6',
          icon: '-'
        };
    }
  };

  const info = getSeverityInfo();

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
          {info.label}
        </span>
        <span className="mortality-rate">
          28일 사망률: <strong>{mortality}</strong>
        </span>
      </div>
    </div>
  );
}

export default SeverityIndicator;
