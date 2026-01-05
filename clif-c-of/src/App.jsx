import React, { useState, useCallback, useMemo } from 'react';
import { OrganInput } from './components/InputForm';
import { DiagnosisResult } from './components/Results';
import { DiagnosticHistory } from './components/History';
import { useDiagnosisHistory } from './hooks/useLocalStorage';
import { validateAllInputs, calculatePFRatio } from './logic/validation';
import { calculateAllScores } from './logic/organScoring';
import { determineACLFGrade, getMortalityInfo, getSeverityColor } from './logic/aclfGrading';
import { INITIAL_INPUTS } from './constants';
import './styles/global.css';

function App() {
  const [activeTab, setActiveTab] = useState('input');
  const [inputs, setInputs] = useState(INITIAL_INPUTS);
  const [errors, setErrors] = useState({});
  const [result, setResult] = useState(null);
  const { history, addToHistory, removeFromHistory, clearHistory, loadFromHistory } = useDiagnosisHistory();

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

    const validInputs = validation.validatedInputs;
    const pfRatio = calculatePFRatio(validInputs.pao2, validInputs.fio2);
    const inputsWithPF = { ...validInputs, pfRatio };

    const scoreResults = calculateAllScores(inputsWithPF);
    const aclfResult = determineACLFGrade(scoreResults, inputsWithPF);
    const mortalityInfo = getMortalityInfo(aclfResult.grade);

    const diagnosisResult = {
      inputs: inputsWithPF,
      scores: scoreResults.scores,
      totalScore: scoreResults.totalScore,
      grade: aclfResult.grade,
      rationale: aclfResult.rationale,
      rationaleKr: aclfResult.rationaleKr,
      organFailures: aclfResult.organFailures,
      organFailureCount: aclfResult.organFailureCount,
      mortality: mortalityInfo.rate,
      severity: mortalityInfo.severity,
      severityColor: getSeverityColor(mortalityInfo.severity)
    };

    setResult(diagnosisResult);
    setActiveTab('result');
  }, [inputs]);

  const handleSaveResult = useCallback(() => {
    if (result) {
      addToHistory(result);
      alert('진단 결과가 저장되었습니다.');
    }
  }, [result, addToHistory]);

  const handleLoadHistory = useCallback((id) => {
    const savedResult = loadFromHistory(id);
    if (savedResult) {
      setResult(savedResult);
      setInputs(savedResult.inputs);
      setActiveTab('result');
    }
  }, [loadFromHistory]);

  const handleReset = useCallback(() => {
    setInputs(INITIAL_INPUTS);
    setErrors({});
    setResult(null);
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
            <DiagnosisResult result={result} onSave={handleSaveResult} />
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
    </div>
  );
}

export default App;
