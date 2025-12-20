import { useEffect } from 'react';
import { useStepContext } from '../../contexts/StepContext';

export default function L3Step4() {
  const { onStepCompleted } = useStepContext();

  useEffect(() => {
    // Mark step as completed
    if (onStepCompleted) {
      onStepCompleted({
        level: 3,
        completed: true
      });
    }
  }, [onStepCompleted]);

  // This step just marks completion and redirects to completion page via LevelRouter
  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 text-center">
      <p className="text-gray-600">Tamamlanıyor...</p>
    </div>
  );
}
