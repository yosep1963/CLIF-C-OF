import React, { useState, useCallback, useEffect } from 'react';
import { OrganInput } from './components/InputForm';
import { DiagnosisResult } from './components/Results';
import { DiagnosticHistory } from './components/History';
import { useDiagnosisHistory } from './hooks/useLocalStorage';
import { validateAllInputs } from './logic/validation';
import { buildDiagnosis, recomputeHistoryRecord } from './logic/diagnosis';
import { INITIAL_INPUTS, INITIAL_FOLLOW_UP } from './constants';
import { version } from '../package.json';
import './styles/global.css';

function App() {
  const [activeTab, setActiveTab] = useState('input');
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const [followUp, setFollowUp] = useState(INITIAL_FOLLOW_UP);
  const [saveNotice, setSaveNotice] = useState(false);
  const { history, addToHistory, removeFromHistory, clearHistory, loadFromHistory } = useDiagnosisHistory();

  // 저장 알림은 잠시 보여준 뒤 숨김
  useEffect(() => {
    if (!saveNotice) return undefined;
    const timer = setTimeout(() => setSaveNotice(false), 2500);
    return () => clearTimeout(timer);
  }, [saveNotice]);

  const handleInputChange = useCallback((newInputs) => {
    setInputs(newInputs);
    setErrors({});
  }, []);

  const handleCalculate = useCallback(() => {
    const validation = validateAllInputs(inputs);

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    // P/F·S/F, FiO2, MAP은 validateAllInputs에서 이미 계산됨
    setResult(buildDiagnosis(validation.validatedInputs));
    setActiveTab('result');
  }, [inputs]);

  const handleSaveResult = useCallback(() => {
    if (result) {
      // 현재 기준으로 만든 결과와 다음 단계 입력(나이·WBC·Na)을 저장
      addToHistory({ ...buildDiagnosis(result.inputs), followUp });
      setSaveNotice(true);
    }
  }, [result, followUp, addToHistory]);

  const handleLoadHistory = useCallback((id) => {
    const savedResult = loadFromHistory(id);
    if (savedResult) {
      // 이전 버전에서 저장한 기록도 현재 기준으로 다시 계산해서 보여줌
      setResult(recomputeHistoryRecord(savedResult));
      // 이전 버전 기록에는 새 입력 항목이 없으므로 기본값과 합침
      setInputs({ ...INITIAL_INPUTS, ...savedResult.inputs });
      setFollowUp({ ...INITIAL_FOLLOW_UP, ...savedResult.followUp });
      setActiveTab('result');
    }
  }, [loadFromHistory]);

  const handleReset = useCallback(() => {
    setInputs(INITIAL_INPUTS);
    setErrors({});
    setResult(null);
    setFollowUp(INITIAL_FOLLOW_UP);
  }, []);

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">CLIF-C OF Calculator</h1>
        <p className="app-subtitle">간경변 환자 장기부전 평가 및 ACLF 등급 진단</p>
      </header>

      <nav className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          입력
        </button>
        <button
          className={`tab-button ${activeTab === 'result' ? 'active' : ''}`}
          onClick={() => setActiveTab('result')}
          disabled={!result}
        >
          결과
        </button>
        <button
          className={`tab-button ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          이력
        </button>
      </nav>

      <main>
        {activeTab === 'input' && (
          <section className="section fade-in">
            <OrganInput
              inputs={inputs}
              errors={errors}
              onChange={handleInputChange}
            />
            <button className="calculate-button" onClick={handleCalculate}>
              진단 계산
            </button>
            <button className="reset-button" onClick={handleReset}>
              초기화
            </button>
          </section>
        )}

        {activeTab === 'result' && (
          <section className="section fade-in">
            <DiagnosisResult
              result={result}
              onSave={handleSaveResult}
              saveNotice={saveNotice}
              followUp={followUp}
              onFollowUpChange={setFollowUp}
            />
            <button
              className="reset-button"
              onClick={() => setActiveTab('input')}
              style={{ marginTop: '1rem' }}
            >
              다시 계산하기
            </button>
          </section>
        )}

        {activeTab === 'history' && (
          <section className="section fade-in">
            <DiagnosticHistory
              history={history}
              onLoad={handleLoadHistory}
              onRemove={removeFromHistory}
              onClear={clearHistory}
            />
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>CLIF-C OF Calculator v{version} · 기준: CANONIC, Jalan 2014·2015, EASL CPG 2023</p>
        <p>본 계산기는 참고용이며, 최종 진단 및 치료 결정은 반드시 전문의와 상담하세요.</p>
      </footer>
    </div>
  );
}

export default App;
