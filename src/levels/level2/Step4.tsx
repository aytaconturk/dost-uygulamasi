import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { useStepContext } from '../../contexts/StepContext';

const LEVEL_STEPS = [
  { num: 1, title: 'Okuma & Kayıt' },
  { num: 2, title: 'Sonuçları Görüntüle' },
  { num: 3, title: 'Hedef Belirleme' },
  { num: 4, title: 'Tamamlama' },
];

export default function Level2Step4() {
  const analysisResult = useSelector((state: RootState) => state.level2.analysisResult);
  const selectedGoal = useSelector((state: RootState) => state.level2.selectedGoal);
  const selectedGoalPercentage = useSelector((state: RootState) => state.level2.selectedGoalPercentage);
  const navigate = useNavigate();
  const { onStepCompleted } = useStepContext();

  // Mark step as completed when goal is selected
  useEffect(() => {
    if (selectedGoal && selectedGoalPercentage && onStepCompleted) {
      onStepCompleted({
        selectedGoal,
        selectedGoalPercentage,
        analysisResult
      });
    }
  }, [selectedGoal, selectedGoalPercentage, analysisResult, onStepCompleted]);

  return (
    <div className="w-full mx-auto px-4">
      <div className="flex flex-col gap-8">
        <h2 className="text-3xl font-bold text-purple-800 text-center">2. Seviye: Özet</h2>

        {/* Step Status */}
        <div className="bg-green-50 border-2 border-green-300 rounded-xl p-6">
          <h3 className="text-lg font-bold text-green-900 mb-4">📋 Adım Durumu:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {LEVEL_STEPS.map((step) => (
              <div
                key={step.num}
                className="flex items-center gap-3 bg-white p-3 rounded-lg border-2 border-green-300"
              >
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                  ✓
                </div>
                <div className="text-sm font-medium text-gray-800">{step.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Reading Results Summary */}
        {analysisResult && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
            <h3 className="text-lg font-bold text-blue-900 mb-4">📊 Okuma Sonuçları</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Genel Puan</p>
                <p className="text-3xl font-bold text-blue-600">{Math.round(analysisResult.overallScore || 0)}</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Okuma Hızı</p>
                <p className="text-2xl font-bold text-blue-600">
                  {Math.round(analysisResult.readingSpeed?.wordsPerMinute || 0)} sözcük/dakika
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Doğru Sözcükler</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(analysisResult.readingSpeed?.correctWordsPerMinute || 0)} sözcük/dakika
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Okunan Sözcükler</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analysisResult.wordCount?.spoken || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Selected Goal Summary */}
        {selectedGoal && selectedGoalPercentage && (
          <div className="bg-amber-50 border-2 border-amber-400 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-900 mb-4">🎯 Belirlenen Hedef</h3>
            <div className="bg-white p-4 rounded-lg border border-amber-300 text-center">
              <p className="text-sm text-gray-600 mb-2">Artış Oranı</p>
              <p className="text-3xl font-bold text-amber-600 mb-2">%{selectedGoalPercentage} Artış</p>
              <p className="text-2xl font-bold text-amber-700">
                {selectedGoal} sözcük/dakika
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
