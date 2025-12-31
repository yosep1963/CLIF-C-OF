import React from 'react';
import OrganCard from './OrganCard';
import SeverityIndicator from './SeverityIndicator';
import { getOrganDetails, ORGAN_NAMES } from '../../logic/organScoring';
import './Results.css';

function DiagnosisResult({ result, onSave }) {
  if (!result) return null;

  const {
    grade,
    rationaleKr,
    scores,
    inputs,
    mortality,
    severity,
    organFailureCount,
    totalScore
  } = result;

  const organList = Object.keys(ORGAN_NAMES).map((organ) =>
    getOrganDetails(organ, scores[organ], inputs)
  );

  const getGradeColor = () => {
    switch (grade) {
      case 'No ACLF':
        return '#10B981';
      case 'ACLF-1':
        return '#F59E0B';
      case 'ACLF-2':
        return '#EF4444';
      case 'ACLF-3':
        return '#DC2626';
      default:
        return '#6B7280';
    }
  };

  return (
    <div className="diagnosis-result">
      {/* 메인 진단 결과 */}
      <div className="result-header">
        <h2 className="result-title">진단 결과</h2>
        <div
          className="grade-display"
          style={{ borderColor: getGradeColor() }}
        >
          <span className="grade-label" style={{ color: getGradeColor() }}>
            {grade}
          </span>
          <span className="grade-rationale">{rationaleKr}</span>
        </div>
      </div>

      {/* 위험도 표시 */}
      <SeverityIndicator severity={severity} mortality={mortality} />

      {/* 요약 정보 */}
      <div className="result-summary">
        <div className="summary-item">
          <span className="summary-label">총점</span>
          <span className="summary-value">{totalScore}점</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">장기부전</span>
          <span className="summary-value">{organFailureCount}개</span>
        </div>
      </div>

      {/* 장기별 상태 카드 */}
      <div className="organ-cards-section">
        <h3 className="section-title">장기별 상태</h3>
        <div className="organ-cards-grid">
          {organList.map((organ) => (
            <OrganCard key={organ.organ} organ={organ} />
          ))}
        </div>
      </div>

      {/* 저장 버튼 */}
      {onSave && (
        <button className="save-button" onClick={onSave}>
          결과 저장
        </button>
      )}

      {/* ACLF인 경우 다음 단계 안내 */}
      {grade !== 'No ACLF' && (
        <div className="next-step-notice">
          <p>
            정밀 예후 측정을 위해 <strong>CLIF-C ACLF Score</strong> 계산을
            권장합니다.
          </p>
          <small>(Age, WBC 추가 입력 필요)</small>
        </div>
      )}
    </div>
  );
}

export default DiagnosisResult;
