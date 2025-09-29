// React 19: no default import required
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StepLayout from './components/StepLayout';
import Step1 from './level1/Step1';
import Step2 from './level1/Step2';
import Step3 from './level1/Step3';
import Step4 from './level1/Step4';
import L2Step1 from './level2/Step1';
import L2Step2 from './level2/Step2';
import L2Step3 from './level2/Step3';
import L2Step4 from './level2/Step4';
import { stopAllMedia } from '../lib/media';
import { getApiEnv } from '../lib/api';

const LEVEL_STEPS_COUNT: Record<number, number> = {
  1: 4,
  2: 4,
};

const LEVEL1_TITLES = [
  '1. Adım: Metnin görselini inceleme ve tahminde bulunma',
  '2. Adım: Metnin başlığını inceleme ve tahminde bulunma',
  '3. Adım: Metnin içindeki cümlelerden bazılarını okuma ve tahminde bulunma',
  '4. Adım: Okuma amacı belirleme',
];

const LS_KEY_L1 = 'level1_completed_steps';

export default function LevelRouter() {
  const navigate = useNavigate();
  const params = useParams();

  const levelStr = params.level || '1';
  const stepStr = params.step || '1';
  const level = Number(levelStr);
  const step = Number(stepStr);

  const totalSteps = LEVEL_STEPS_COUNT[level] || 1;

  const [completedLevel1, setCompletedLevel1] = useState<boolean[]>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY_L1);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === LEVEL1_TITLES.length) return arr;
      }
    } catch {}
    return new Array(LEVEL1_TITLES.length).fill(false);
  });

  useEffect(() => {
    try { localStorage.setItem(LS_KEY_L1, JSON.stringify(completedLevel1)); } catch {}
  }, [completedLevel1]);

  const goToStep = (s: number) => {
    stopAllMedia();
    navigate(`/level/${level}/step/${s}`);
  };
  const onPrev = () => {
    if (step > 1) goToStep(step - 1);
  };
  const onNext = () => {
    if (level === 1) {
      setCompletedLevel1(prev => {
        const next = [...prev];
        const idx = step - 1;
        if (idx >= 0 && idx < next.length) next[idx] = true;
        return next;
      });
    }
    if (step < totalSteps) goToStep(step + 1);
  };

  let content: React.ReactNode = null;
  if (level === 1) {
    if (step === 1) content = <Step1 />;
    else if (step === 2) content = <Step2 />;
    else if (step === 3) content = <Step3 />;
    else if (step === 4) content = <Step4 />;
  } else if (level === 2) {
    if (step === 1) content = <L2Step1 />;
    else if (step === 2) content = <L2Step2 />;
    else if (step === 3) content = <L2Step3 />;
    else if (step === 4) content = <L2Step4 />;
  }

  if (!content) {
    content = (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Bu adım henüz hazır değil</h2>
        <p className="text-lg text-gray-600">Farklı bir adıma geçebilirsin.</p>
      </div>
    );
  }

  const renderLevel1Checklist = () => {
    if (level !== 1) return null;
    const canJump = getApiEnv() === 'test';
    return (
      <div className="bg-green-50 border-b border-green-200 py-3 px-6 -mt-4 mb-2">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Adım Durumu:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {LEVEL1_TITLES.map((title, i) => {
              const isCurrent = i + 1 === step;
              const isDone = completedLevel1[i];
              const go = () => { if (canJump) goToStep(i + 1); };
              return (
                <div key={i} className={`flex items-center gap-2 ${canJump ? 'cursor-pointer' : ''}`} onClick={go}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    isDone ? 'bg-green-500 border-green-500 text-white' : isCurrent ? 'border-purple-500 bg-purple-100' : 'border-gray-300'
                  }`}>
                    {isDone ? '✓' : isCurrent ? '●' : ''}
                  </div>
                  <span className={`text-sm ${
                    isDone ? 'text-green-700 line-through' : isCurrent ? 'text-purple-700 font-medium' : 'text-gray-500'
                  }`}>
                    {title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <StepLayout
      currentStep={step}
      totalSteps={totalSteps}
      onPrev={onPrev}
      onNext={onNext}
    >
      {renderLevel1Checklist()}
      {content}
    </StepLayout>
  );
}
