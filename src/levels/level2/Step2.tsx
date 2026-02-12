import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { useStepContext } from '../../contexts/StepContext';

const QUALITY_METRIC_LABELS: Record<string, string> = {
  speechRate: 'Okuma Hızı',
  correctWords: 'Doğru Sözcükler',
  punctuation: 'Noktalama',
  expressiveness: 'İfadeli Okuma',
};

export default function Level2Step2() {
  const analysisResult = useSelector((state: RootState) => state.level2.analysisResult);
  const navigate = useNavigate();
  const { onStepCompleted, storyId } = useStepContext();

  console.log('Step2: analysisResult from Redux:', analysisResult);

  // Mark step as completed when analysis result is available
  useEffect(() => {
    if (analysisResult && onStepCompleted) {
      onStepCompleted({
        analysisResult
      });
    }
  }, [analysisResult, onStepCompleted]);

  if (!analysisResult) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 min-h-96">
        <div className="text-center bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 max-w-md">
          <p className="text-xl text-gray-800 mb-4 font-semibold">⚠️ Henüz okuma analizi sonucu yok</p>
          <p className="text-gray-600 mb-6">Lütfen önce 1. Adımı tamamla.</p>
          <button
            onClick={() => navigate(`/level/2/step/1?storyId=${storyId}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
          >
            1. Adıma Git
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto px-4">
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-purple-800 text-center">2. Adım: Okuma hızı</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overall Score */}
          <div className="md:col-span-2 lg:col-span-1 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Okuma hızı (bir dakikada okunan doğru sözcük sayısı)</h4>
            <p className="text-3xl font-bold text-blue-600">{Math.round(analysisResult?.readingSpeed?.correctWordsPerMinute ?? analysisResult?.overallScore ?? 0)}</p>
          </div>

          {/* Reading Speed */}
          {analysisResult?.readingSpeed && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-900 mb-2">Okuma Hızı</h4>
              <p className="text-gray-700">Dakikadaki Sözcük: <span className="font-bold text-green-700">{Math.round(analysisResult.readingSpeed.wordsPerMinute || 0)}</span></p>
              <p className="text-gray-700">Doğru Sözcük/Dakika: <span className="font-bold text-green-700">{Math.round(analysisResult.readingSpeed.correctWordsPerMinute || 0)}</span></p>
            </div>
          )}

          {/* Word Count */}
          {analysisResult?.wordCount && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-bold text-purple-900 mb-2">Sözcük Sayıları</h4>
              <p className="text-gray-700">Orijinal: <span className="font-bold">{analysisResult.wordCount.original}</span></p>
              <p className="text-gray-700">Okunan: <span className="font-bold">{analysisResult.wordCount.spoken}</span></p>
              <p className="text-gray-700">Doğru: <span className="font-bold text-green-700">{analysisResult.wordCount.correct}</span></p>
            </div>
          )}

          {/* Quality Rules */}
          {analysisResult?.qualityRules && (
            <div className="md:col-span-2 lg:col-span-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h4 className="font-bold text-orange-900 mb-3">Kalite Değerlendirmesi</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {Object.entries(analysisResult.qualityRules).map(([key, rule]) => (
                  <div key={key} className="bg-white p-3 rounded border border-orange-100">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700 text-sm">{QUALITY_METRIC_LABELS[key] || key}</span>
                      <span className="font-bold text-orange-600">{(rule as any).score}%</span>
                    </div>
                    <p className="text-xs text-gray-600">{(rule as any).feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pronunciation */}
          {analysisResult?.pronunciation && (
            <div className="md:col-span-2 lg:col-span-2 p-4 bg-red-50 rounded-lg border border-red-200">
              <h4 className="font-bold text-red-900 mb-2">Telaffuz Doğruluğu</h4>
              <p className="text-gray-700 mb-3">Doğruluk: <span className="font-bold text-red-600">{analysisResult.pronunciation.accuracy}%</span></p>
              {analysisResult.pronunciation.errors.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Hatalar:</p>
                  <div className="space-y-2">
                    {analysisResult.pronunciation.errors.map((error, idx) => (
                      <div key={idx} className="bg-white p-2 rounded text-sm border border-red-100">
                        <p><span className="text-red-600 font-bold">{error.expected}</span> → <span className="text-blue-600 font-bold">{error.actual}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {analysisResult?.recommendations && (
            <div className="md:col-span-2 lg:col-span-1 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-2">Öneriler</h4>
              <ul className="space-y-2">
                {analysisResult.recommendations.map((rec, idx) => (
                  <li key={idx} className="text-gray-700 text-sm flex items-start">
                    <span className="text-indigo-600 font-bold mr-2">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Transcript */}
          {analysisResult?.transcript && (
            <div className="md:col-span-2 lg:col-span-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h4 className="font-bold text-gray-900 mb-2">Transkript</h4>
              <p className="text-gray-700 italic text-sm">"{analysisResult.transcript}"</p>
            </div>
          )}
        </div>

        {/* Navigation Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={() => navigate(`/level/2/step/3?storyId=${storyId}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
          >
            Hedef Belirle →
          </button>
        </div>
      </div>
    </div>
  );
}
