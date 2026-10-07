import React, { memo, useMemo } from 'react';
import OrganCard from './OrganCard';
import SeverityIndicator from './SeverityIndicator';
import FollowUpScore from './FollowUpScore';
import { getOrganDetails } from '../../logic/organScoring';
import { ORGAN_NAMES, GRADE_COLORS, ACLF_GRADES } from '../../constants';
import './Results.css';

function DiagnosisResult({ result, onSave, saveNotice, followUp, onFollowUpChange }) {
  // 장기 목록 메모이제이션 (Hook은 early return 전에 호출)
  const organList = useMemo(() => {
    if (!result) return [];
    const { scores, inputs } = result;
    return Object.keys(ORGAN_NAMES).map((organ) =>
      getOrganDetails(organ, scores[organ], inputs)
    );
  }, [result]);

  if (!result) return null;

  const {
    grade,
    rationaleKr,
    mortality,
    mortality90,
    severity,
    organFailureCount,
    totalScore,
    isChanged,
    savedGrade,
    savedTotalScore
  } = result;

  const gradeColor = GRADE_COLORS[grade] || '#6B7280';
  const isAclf = grade !== ACLF_GRADES.NO_ACLF;

  return (
    <div className="diagnosis-result">
      {/* 메인 진단 결과 */}
      <div className="result-header">
        <h2 className="result-title">진단 결과</h2>
        <div
          className="grade-display"
          style={{ borderColor: gradeColor }}
        >
          <span className="grade-label" style={{ color: gradeColor }}>
            {grade}
          </span>
          <span className="grade-rationale">{rationaleKr}</span>
        </div>
      </div>

      {/* 이전 버전 이력: 현재 기준으로 다시 계산한 경우 */}
      {isChanged && (
        <p className="recompute-note" role="note">
          저장 당시 판정은 {savedGrade} (총점 {savedTotalScore}점)이었습니다.
          판정 기준이 바뀌어 현재 기준으로 다시 계산했습니다.
        </p>
      )}

      {/* 위험도 표시 */}
      <SeverityIndicator severity={severity} mortality={mortality} mortality90={mortality90} />

      {/* 재평가 안내 (EASL CPG 2023: 예후는 3–7일 장기지지 후 재평가 시점으로 판단) */}
      <p className="reassess-note">
        {isAclf
          ? 'ACLF 등급은 치료 중 바뀔 수 있습니다. 장기지지 치료 3–7일 후 다시 평가한 등급과 점수가 예후를 더 정확히 반영합니다.'
          : '입원 중 상태가 나빠지면 다시 평가하세요. ACLF가 생기면 CLIF-C ACLF 점수로 예후를 봅니다.'}
      </p>

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

      {/* 다음 단계: ACLF면 CLIF-C ACLF, 아니면 CLIF-C AD */}
      {onFollowUpChange && (
        <FollowUpScore
          diagnosis={result}
          values={followUp}
          onChange={onFollowUpChange}
        />
      )}

      {/* 저장 버튼 */}
      {onSave && (
        <>
          <button className="save-button" onClick={onSave}>
            결과 저장
          </button>
          {saveNotice && (
            <p className="save-notice" role="status">진단 결과를 이력에 저장했습니다.</p>
          )}
        </>
      )}
    </div>
  );
}

export default memo(DiagnosisResult);
