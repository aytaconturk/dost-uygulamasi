import { useEffect, useMemo } from 'react';
import { useStepContext } from '../../contexts/StepContext';

export default function L5Step3() {
  const { onStepCompleted } = useStepContext();
  
  useEffect(() => {
    // No text-to-speech - as requested
    
    // Mark step as completed
    if (onStepCompleted) {
      onStepCompleted({
        level: 5,
        completed: true,
        storyCompleted: true
      });
    }
  }, [onStepCompleted]);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-3">3. Adım: Çalışmayı sonlandırma</h2>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-lg text-gray-800">Çalışma tamamlandı. Ana sayfaya dönerek yeni oturumu başlatabilirsin.</p>
        <div className="mt-4">
          <a href="/" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold">Ana Sayfaya Dön</a>
        </div>
      </div>
    </div>
  );
}
