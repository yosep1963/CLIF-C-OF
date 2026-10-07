import React, { memo, useCallback, useMemo } from 'react';
import { GRADE_COLORS } from '../../constants';
import { recomputeHistoryRecord } from '../../logic/diagnosis';
import { getFollowUpScore } from '../../logic/prognosisScores';
import './History.css';

const FOLLOW_UP_LABELS = {
  aclf: 'CLIF-C ACLF',
  ad: 'CLIF-C AD'
};

function DiagnosticHistory({ history, onLoad, onRemove, onClear }) {
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

  // 이전 버전 기록도 현재 기준으로 다시 계산해서 보여줌 (저장된 원본은 그대로 둠)
  const rows = useMemo(() => (history || []).map((item) => {
    const record = recomputeHistoryRecord(item);
    const followUpScore = record.inputs ? getFollowUpScore(record, record.followUp) : null;
    return { record, followUpScore };
  }), [history]);

  if (rows.length === 0) {
    return (
      <div className="history-empty">
        <p>저장된 진단 기록이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="diagnostic-history">
      <div className="history-header">
        <h3 className="history-title">진단 이력</h3>
        {onClear && (
          <button className="clear-all-btn" onClick={onClear}>
            전체 삭제
          </button>
        )}
      </div>

      <div className="history-list">
        {rows.map(({ record, followUpScore }) => (
          <div key={record.id} className="history-item">
            <button
              className="history-item-main"
              onClick={() => onLoad && onLoad(record.id)}
              type="button"
            >
              <div className="history-item-left">
                <span
                  className="history-grade"
                  style={{ color: getGradeColor(record.grade) }}
                >
                  {record.grade}
                </span>
                <span className="history-date">{formatTimestamp(record.timestamp)}</span>
              </div>
              <div className="history-item-right">
                <span className="history-score">
                  {record.totalScore}점 / {record.organFailureCount > 0
                    ? `${record.organFailureCount}개 부전`
                    : '부전 없음'}
                </span>
                {followUpScore && (
                  <span className="history-follow-up">
                    {FOLLOW_UP_LABELS[followUpScore.type]} {followUpScore.score}
                  </span>
                )}
                {record.isChanged && <span className="history-changed">기준 변경</span>}
              </div>
            </button>
            {onRemove && (
              <button
                className="remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(record.id);
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
        최근 10개의 기록만 저장됩니다. 이전 버전에서 저장한 기록은 현재 판정 기준으로 다시 계산해 보여줍니다.
      </p>
    </div>
  );
}

export default memo(DiagnosticHistory);
