import React, { memo } from 'react';
import NumericInput from '../InputForm/NumericInput';
import { VALIDATION_RANGES, validateFollowUpInputs } from '../../logic/validation';
import { getFollowUpScore } from '../../logic/prognosisScores';
import { ACLF_GRADES } from '../../constants';
import './Results.css';

const AD_RISK_LABELS = {
  low: '저위험 (≤45)',
  intermediate: '중간 위험 (46–59)',
  high: '고위험 (≥60)'
};

/**
 * 다음 단계 예후 점수
 * ACLF면 CLIF-C ACLF (나이·WBC 추가), 아니면 CLIF-C AD (나이·WBC·Na 추가)
 */
function FollowUpScore({ diagnosis, values, onChange }) {
  const isAclf = diagnosis.grade !== ACLF_GRADES.NO_ACLF;
  const { errors } = validateFollowUpInputs(values, { needsSodium: !isAclf });
  const result = getFollowUpScore(diagnosis, values);

  const handleChange = (field, value) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <div className="follow-up-section">
      <h3 className="section-title">
        {isAclf ? '다음 단계: CLIF-C ACLF 점수' : '다음 단계: CLIF-C AD 점수'}
      </h3>
      <p className="follow-up-description">
        {isAclf
          ? '나이와 WBC를 넣으면 CLIF-C OF 점수와 합쳐 예후를 계산합니다.'
          : 'ACLF가 아니므로 CLIF-C AD 점수로 예후를 계산합니다. Creatinine과 INR은 위에서 입력한 값을 씁니다.'}
      </p>
      <div className="follow-up-inputs">
        <NumericInput
          label="나이"
          value={values.age}
          onChange={(val) => handleChange('age', val)}
          unit="세"
          placeholder="18 - 100"
          error={errors.age}
          min={VALIDATION_RANGES.age.min}
          max={VALIDATION_RANGES.age.max}
          step={1}
        />
        <NumericInput
          label="WBC"
          value={values.wbc}
          onChange={(val) => handleChange('wbc', val)}
          unit="cells/µL"
          placeholder="예: 15000"
          error={errors.wbc}
          min={VALIDATION_RANGES.wbc.min}
          max={VALIDATION_RANGES.wbc.max}
          step={100}
        />
        {!isAclf && (
          <NumericInput
            label="Na"
            value={values.sodium}
            onChange={(val) => handleChange('sodium', val)}
            unit="mmol/L"
            placeholder="예: 135"
            error={errors.sodium}
            min={VALIDATION_RANGES.sodium.min}
            max={VALIDATION_RANGES.sodium.max}
            step={1}
          />
        )}
      </div>

      {result?.type === 'aclf' && (
        <div className="follow-up-result">
          <div className="follow-up-score">CLIF-C ACLF <strong>{result.score}</strong></div>
          <div className="follow-up-mortality">
            예측 사망률 28일 <strong>{result.mortality.day28}%</strong>
            {' · '}90일 <strong>{result.mortality.day90}%</strong>
          </div>
          {result.note && <p className="follow-up-note">※ {result.note}</p>}
        </div>
      )}

      {result?.type === 'ad' && (
        <div className="follow-up-result">
          <div className="follow-up-score">
            CLIF-C AD <strong>{result.score}</strong>
            <span className="follow-up-risk">{AD_RISK_LABELS[result.riskGroup]}</span>
          </div>
          <div className="follow-up-mortality">
            예측 사망률 90일 <strong>{result.mortality.day90}%</strong>
            {' · '}1년 <strong>{result.mortality.day365}%</strong>
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(FollowUpScore);
