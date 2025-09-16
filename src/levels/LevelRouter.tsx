import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StepLayout from './components/StepLayout';
import Step1 from './level1/Step1';
import Step2 from './level1/Step2';
import Step3 from './level1/Step3';
import Step4 from './level1/Step4';

const LEVEL_STEPS_COUNT: Record<number, number> = {
  1: 4,
};

export default function LevelRouter() {
  const navigate = useNavigate();
  const params = useParams();

  // Params come like level="1" for /level1/..., step="1" for /step1
  const levelStr = params.level || '1';
  const stepStr = params.step || '1';
  const level = Number(levelStr);
  const step = Number(stepStr);

  const totalSteps = LEVEL_STEPS_COUNT[level] || 1;
  const goToStep = (s: number) => navigate(`/level/${level}/step/${s}`);
  const onPrev = () => {
    if (step > 1) goToStep(step - 1);
  };
  const onNext = () => {
    if (step < totalSteps) goToStep(step + 1);
  };

  let content: React.ReactNode = null;
  if (level === 1) {
    if (step === 1) content = <Step1 />;
    else if (step === 2) content = <Step2 />;
    else if (step === 3) content = <Step3 />;
    else if (step === 4) content = <Step4 />;
  }

  if (!content) {
    content = (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">Bu adım henüz hazır değil</h2>
        <p className="text-lg text-gray-600">Farklı bir adıma geçebilirsin.</p>
      </div>
    );
  }

  return (
    <StepLayout
      currentStep={step}
      totalSteps={totalSteps}
      onPrev={onPrev}
      onNext={onNext}
    >
      {content}
    </StepLayout>
  );
}
