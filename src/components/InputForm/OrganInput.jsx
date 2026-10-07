import React from 'react';
import NumericInput from './NumericInput';
import ToggleSwitch from './ToggleSwitch';
import HEGradeSelector from './HEGradeSelector';
import OptionToggle from './OptionToggle';
import {
  VALIDATION_RANGES,
  calculateOxygenRatio,
  calculateMAP,
  calculateFiO2FromFlow,
  getSpO2Warning
} from '../../logic/validation';
import './InputForm.css';

const MAP_MODE_OPTIONS = [
  { value: 'bp', label: 'SBP/DBP 입력' },
  { value: 'direct', label: 'MAP 직접 입력' }
];

const VENT_REASON_OPTIONS = [
  { value: 'he', label: '간성뇌증 때문 → 뇌부전' },
  { value: 'other', label: '그 외 (호흡부전 등) → 호흡부전' }
];

const OXYGEN_SOURCE_OPTIONS = [
  { value: false, label: 'PaO₂ (동맥혈)' },
  { value: true, label: 'SpO₂ (맥박산소측정)' }
];

const FIO2_MODE_OPTIONS = [
  { value: 'flow', label: '비강 캐뉼라 (L/min)' },
  { value: 'direct', label: 'FiO₂ 직접 입력 (%)' }
];

function OrganInput({ inputs, errors, onChange }) {
  const handleChange = (field, value) => {
    onChange({ ...inputs, [field]: value });
  };

  const mapMode = inputs.mapMode === 'direct' ? 'direct' : 'bp';
  const fio2Mode = inputs.fio2Mode === 'direct' ? 'direct' : 'flow';
  const ventForHE = inputs.mechVent && inputs.mechVentReason === 'he';
  const ventForRespiratory = inputs.mechVent && inputs.mechVentReason === 'other';

  // MAP 계산 (SBP, DBP로부터)
  const calculatedMAP = calculateMAP(inputs.sbp, inputs.dbp);

  // FiO2: 비강 캐뉼라 유량에서 추정하거나 직접 입력
  const calculatedFiO2 = calculateFiO2FromFlow(inputs.o2Flow);
  const fio2 = fio2Mode === 'direct' ? inputs.fio2Direct : calculatedFiO2;

  // P/F 또는 S/F (화면에는 반올림해서 표시)
  const oxygenRatio = calculateOxygenRatio(inputs.useSpO2 ? inputs.spo2 : inputs.pao2, fio2);

  // SpO2 경고 (97% 초과)
  const spO2Warning = getSpO2Warning(inputs.spo2);

  return (
    <div className="organ-input-container">
      {/* 간 (Liver) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🫘</span>
          간 (Liver)
        </h3>
        <NumericInput
          label="Bilirubin"
          value={inputs.bilirubin}
          onChange={(val) => handleChange('bilirubin', val)}
          unit="mg/dL"
          placeholder="0.1 - 50"
          error={errors?.bilirubin}
          min={VALIDATION_RANGES.bilirubin.min}
          max={VALIDATION_RANGES.bilirubin.max}
        />
      </div>

      {/* 신장 (Kidney) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🫘</span>
          신장 (Kidney)
        </h3>
        <NumericInput
          label="Creatinine"
          value={inputs.creatinine}
          onChange={(val) => handleChange('creatinine', val)}
          unit="mg/dL"
          placeholder="0.1 - 15"
          error={errors?.creatinine}
          min={VALIDATION_RANGES.creatinine.min}
          max={VALIDATION_RANGES.creatinine.max}
          disabled={inputs.rrt}
        />
        <ToggleSwitch
          label="RRT (투석)"
          checked={inputs.rrt || false}
          onChange={(val) => handleChange('rrt', val)}
        />
      </div>

      {/* 뇌 (Brain) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🧠</span>
          뇌 (Brain)
        </h3>
        <HEGradeSelector
          value={inputs.heGrade || 0}
          onChange={(val) => handleChange('heGrade', val)}
          disabled={ventForHE}
        />
        {ventForHE && (
          <p className="input-note">간성뇌증으로 기계환기 중이므로 뇌부전(3점)으로 계산합니다.</p>
        )}
      </div>

      {/* 응고 (Coagulation) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🩸</span>
          응고 (Coagulation)
        </h3>
        <NumericInput
          label="INR"
          value={inputs.inr}
          onChange={(val) => handleChange('inr', val)}
          unit=""
          placeholder="0.5 - 10"
          error={errors?.inr}
          min={VALIDATION_RANGES.inr.min}
          max={VALIDATION_RANGES.inr.max}
        />
      </div>

      {/* 순환 (Circulation) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">❤️</span>
          순환 (Circulation)
        </h3>
        <OptionToggle
          label="혈압 입력 방식"
          options={MAP_MODE_OPTIONS}
          value={mapMode}
          onChange={(val) => handleChange('mapMode', val)}
        />
        {mapMode === 'direct' ? (
          <NumericInput
            label="MAP"
            value={inputs.mapDirect}
            onChange={(val) => handleChange('mapDirect', val)}
            unit="mmHg"
            placeholder="30 - 150"
            error={errors?.mapDirect}
            min={VALIDATION_RANGES.map.min}
            max={VALIDATION_RANGES.map.max}
            disabled={inputs.vasopressors}
          />
        ) : (
          <>
            <div className="blood-pressure-inputs">
              <NumericInput
                label="SBP"
                value={inputs.sbp}
                onChange={(val) => handleChange('sbp', val)}
                unit="mmHg"
                placeholder="60 - 250"
                error={errors?.sbp}
                min={VALIDATION_RANGES.sbp.min}
                max={VALIDATION_RANGES.sbp.max}
                disabled={inputs.vasopressors}
              />
              <NumericInput
                label="DBP"
                value={inputs.dbp}
                onChange={(val) => handleChange('dbp', val)}
                unit="mmHg"
                placeholder="30 - 150"
                error={errors?.dbp}
                min={VALIDATION_RANGES.dbp.min}
                max={VALIDATION_RANGES.dbp.max}
                disabled={inputs.vasopressors}
              />
            </div>
            {calculatedMAP && !inputs.vasopressors && (
              <div className="calculated-value-display">
                <span className="calculated-value-label">MAP:</span>
                <span className="calculated-value">{calculatedMAP} mmHg</span>
              </div>
            )}
          </>
        )}
        <ToggleSwitch
          label="승압제 사용"
          checked={inputs.vasopressors || false}
          onChange={(val) => handleChange('vasopressors', val)}
        />
      </div>

      {/* 호흡 (Respiratory) */}
      <div className="organ-section">
        <h3 className="organ-title">
          <span className="organ-icon">🫁</span>
          호흡 (Respiratory)
        </h3>

        <ToggleSwitch
          label="기계환기 중"
          checked={inputs.mechVent || false}
          onChange={(val) => handleChange('mechVent', val)}
        />
        {inputs.mechVent && (
          <OptionToggle
            label="기계환기 이유"
            options={VENT_REASON_OPTIONS}
            value={inputs.mechVentReason}
            onChange={(val) => handleChange('mechVentReason', val)}
            error={errors?.mechVentReason}
          />
        )}

        {ventForRespiratory ? (
          <p className="input-note">호흡부전(3점)으로 계산합니다. 산소화 지표는 입력하지 않아도 됩니다.</p>
        ) : (
          <>
            <OptionToggle
              label="산소화 지표"
              options={OXYGEN_SOURCE_OPTIONS}
              value={Boolean(inputs.useSpO2)}
              onChange={(val) => handleChange('useSpO2', val)}
            />

            {/* SpO2는 PaO2로 환산하지 않고 S/F 기준으로 평가 */}
            {inputs.useSpO2 && (
              <div className={`oxygen-warning ${spO2Warning.level}`}>
                <span className="warning-icon">ℹ️</span>
                <span className="warning-text">
                  SpO₂/FiO₂(S/F) 기준으로 평가합니다: &gt;357 정상 · 215–357 주의 · ≤214 부전
                  {spO2Warning.message && <><br />{spO2Warning.message}</>}
                </span>
              </div>
            )}

            <OptionToggle
              label="FiO₂ 입력 방식"
              options={FIO2_MODE_OPTIONS}
              value={fio2Mode}
              onChange={(val) => handleChange('fio2Mode', val)}
            />

            <div className="pf-ratio-inputs">
              {!inputs.useSpO2 ? (
                <NumericInput
                  label="PaO₂"
                  value={inputs.pao2}
                  onChange={(val) => handleChange('pao2', val)}
                  unit="mmHg"
                  placeholder="30 - 600"
                  error={errors?.pao2}
                  min={VALIDATION_RANGES.pao2.min}
                  max={VALIDATION_RANGES.pao2.max}
                />
              ) : (
                <NumericInput
                  label="SpO₂"
                  value={inputs.spo2}
                  onChange={(val) => handleChange('spo2', val)}
                  unit="%"
                  placeholder="70 - 100"
                  error={errors?.spo2}
                  min={VALIDATION_RANGES.spo2.min}
                  max={VALIDATION_RANGES.spo2.max}
                />
              )}
              {fio2Mode === 'direct' ? (
                <NumericInput
                  label="FiO₂"
                  value={inputs.fio2Direct}
                  onChange={(val) => handleChange('fio2Direct', val)}
                  unit="%"
                  placeholder="21 - 100"
                  error={errors?.fio2Direct}
                  min={VALIDATION_RANGES.fio2Direct.min}
                  max={VALIDATION_RANGES.fio2Direct.max}
                />
              ) : (
                <NumericInput
                  label="O₂ 유량"
                  value={inputs.o2Flow}
                  onChange={(val) => handleChange('o2Flow', val)}
                  unit="L/min"
                  placeholder="0 - 6 (실내공기 0)"
                  error={errors?.o2Flow}
                  min={VALIDATION_RANGES.o2Flow.min}
                  max={VALIDATION_RANGES.o2Flow.max}
                />
              )}
            </div>

            {fio2Mode === 'flow' && calculatedFiO2 !== null && (
              <div className="calculated-value-display">
                <span className="calculated-value-label">FiO₂:</span>
                <span className="calculated-value">{calculatedFiO2}%</span>
              </div>
            )}
            {oxygenRatio !== null && (
              <div className="pf-ratio-display">
                <span className="pf-ratio-label">{inputs.useSpO2 ? 'S/F' : 'P/F'}:</span>
                <span className="pf-ratio-value">{Math.round(oxygenRatio)}</span>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default OrganInput;
