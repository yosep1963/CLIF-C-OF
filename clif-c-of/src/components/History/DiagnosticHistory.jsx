import React, { memo, useCallback } from 'react';
import { GRADE_COLORS, formatDate } from '../../constants';
import './History.css';

function DiagnosticHistory({ history, onLoad, onRemove, onClear }) {
  if (!history || history.length === 0) {
    return (
      <div className="history-empty">
        <p>저장된 진단 기록이 없습니다.</p>
      </div>
    );
  }

  const formatTimestamp = useCallback((timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const getGradeColor = useCallback((grade) => {
    return GRADE_COLORS[grade] || '#6B7280';
  }, []);

  return (
    <div className="diagnostic-history">
      <div className="history-header">
        <h3 className="history-title">진단 이력</h3>
        {onClear && history.length > 0 && (
          <button className="clear-all-btn" onClick={onClear}>
            전체 삭제
          </button>
        )}
      </div>

      <div className="history-list">
        {history.map((item) => (
          <div key={item.id} className="history-item">
            <button
              className="history-item-main"
              onClick={() => onLoad && onLoad(item.id)}
              type="button"
            >
              <div className="history-item-left">
                <span
                  className="history-grade"
                  style={{ color: getGradeColor(item.grade) }}
                >
                  {item.grade}
                </span>
                <span className="history-date">{formatTimestamp(item.timestamp)}</span>
              </div>
              <div className="history-item-right">
                <span className="history-score">
                  {item.totalScore}점 / {item.organFailureCount}개 부전
                </span>
              </div>
            </button>
            {onRemove && (
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                aria-label="삭제"
                type="button"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>

      <p className="history-note">
        최근 10개의 기록만 저장됩니다.
      </p>
    </div>
  );
}

export default memo(DiagnosticHistory);
