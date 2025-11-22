// React 19: no default import required
import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import StepLayout from './components/StepLayout';
import Step1 from './level1/Step1';
import Step2 from './level1/Step2';
import Step3 from './level1/Step3';
import Step4 from './level1/Step4';
import Step5 from './level1/Step5';
import L2Step1 from './level2/Step1';
import L2Step2 from './level2/Step2';
import L2Step3 from './level2/Step3';
import L2Step4 from './level2/Step4';
import L3Step1 from './level3/Step1';
import L3Step2 from './level3/Step2';
import L3Step3 from './level3/Step3';
import L3Step4 from './level3/Step4';
import L4Step1 from './level4/Step1';
import L4Step2 from './level4/Step2';
import L4Step3 from './level4/Step3';
import L4Step4 from './level4/Step4';
import L5Step1 from './level5/Step1';
import L5Step2 from './level5/Step2';
import L5Step3 from './level5/Step3';
import { stopAllMedia } from '../lib/media';
import { getApiEnv } from '../lib/api';
import { updateStudentProgressStep } from '../lib/supabase';
import type { RootState } from '../store/store';

const LEVEL_STEPS_COUNT: Record<number, number> = {
  1: 5,
  2: 3,
  3: 4,
  4: 4,
  5: 3,
};

const LEVEL1_TITLES = [
  '1. Adım: Metnin görselini inceleme ve tahminde bulunma',
  '2. Adım: Metnin başlığını inceleme ve tahminde bulunma',
  '3. Adım: Metnin içindeki cümlelerden bazılarını okuma ve tahminde bulunma',
  '4. Adım: Okuma amacı belirleme',
];

const LEVEL2_TITLES = [
  '1. Adım: Birinci okuma ve Okuma hızı belirleme',
  '2. Adım: Okuma hızı',
  '3. Adım: Okuma hedefi belirleme',
];

const LEVEL3_TITLES = [
  '1. Adım: Model okuma ve İkinci okuma',
  '2. Adım: Üçüncü okuma ve okuma hızı belirleme',
  '3. Adım: Okuma hızı ve Performans geribildirimi',
  'Tamamlama',
];

const LEVEL4_TITLES = [
  '1. Adım: Dolu Şema Üzerinden Beyin Fırtınası ve Yorum',
  '2. Adım: Özetleme',
  '3. Adım: Okuduğunu Anlama Soruları',
  'Tamamlama',
];

const LEVEL5_TITLES = [
  '1. Adım: Okuduğunu anlama soruları',
  '2. Adım: Hedefe bağlı ödül',
  '3. Adım: Çalışmayı sonlandırma',
];

export default function LevelRouter() {
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);

  const levelStr = params.level || '1';
  const stepStr = params.step || '1';
  const level = Number(levelStr);
  const step = Number(stepStr);

  const totalSteps = LEVEL_STEPS_COUNT[level] || 1;

  const [isSaving, setIsSaving] = useState(false);

  const goToStep = (s: number) => {
    stopAllMedia();
    // Preserve query parameters (like storyId)
    const queryString = searchParams.toString();
    const url = queryString ? `/level/${level}/step/${s}?${queryString}` : `/level/${level}/step/${s}`;
    navigate(url);
  };

  const onPrev = () => {
    if (step > 1) goToStep(step - 1);
  };

  const onNext = async () => {
    if (!student) return;

    setIsSaving(true);
    try {
      const storyId = level;
      await updateStudentProgressStep(student.id, storyId, level, step);
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setIsSaving(false);
    }

    if (step < totalSteps) {
      goToStep(step + 1);
    }
  };

  let content: React.ReactNode = null;
  if (level === 1) {
    if (step === 1) content = <Step1 />;
    else if (step === 2) content = <Step2 />;
    else if (step === 3) content = <Step3 />;
    else if (step === 4) content = <Step4 />;
    else if (step === 5) content = <Step5 />;
  } else if (level === 2) {
    if (step === 1) content = <L2Step1 />;
    else if (step === 2) content = <L2Step2 />;
    else if (step === 3) content = <L2Step3 />;
    else if (step === 4) content = <L2Step4 />;
  } else if (level === 3) {
    if (step === 1) content = <L3Step1 />;
    else if (step === 2) content = <L3Step2 />;
    else if (step === 3) content = <L3Step3 />;
    else if (step === 4) content = <L3Step4 />;
  } else if (level === 4) {
    if (step === 1) content = <L4Step1 />;
    else if (step === 2) content = <L4Step2 />;
    else if (step === 3) content = <L4Step3 />;
    else if (step === 4) content = <L4Step4 />;
  } else if (level === 5) {
    if (step === 1) content = <L5Step1 />;
    else if (step === 2) content = <L5Step2 />;
    else if (step === 3) content = <L5Step3 />;
  }

  if (!content) {
    content = (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Bu adım henüz hazır değil</h2>
        <p className="text-lg text-gray-600">Farklı bir adıma geçebilirsin.</p>
      </div>
    );
  }

  const renderLevelChecklist = (titles: string[]) => {
    const canJump = getApiEnv() === 'test';
    return (
      <div className="bg-green-50 border-b border-green-200 py-3 px-6 -mt-4 mb-2">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-sm font-semibold text-green-800 mb-2">Adım Durumu:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {titles.map((title, i) => {
              const isCurrent = i + 1 === step;
              const isDone = i + 1 < step;
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
      hideNext={(level === 1 && (step === 4 || step === 5)) || (level === 4 && step === 4)}
      hideFooter={(level === 1 && (step === 4 || step === 5)) || (level === 4 && step === 4)}
    >
      {level === 1 ? (step === 5 ? null : renderLevelChecklist(LEVEL1_TITLES)) : null}
      {level === 2 ? renderLevelChecklist(LEVEL2_TITLES) : null}
      {level === 3 ? renderLevelChecklist(LEVEL3_TITLES) : null}
      {level === 4 ? renderLevelChecklist(LEVEL4_TITLES) : null}
      {level === 5 ? renderLevelChecklist(LEVEL5_TITLES) : null}
      {content}
    </StepLayout>
  );
}
