import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { useStepContext } from '../../contexts/StepContext';
import { getLatestReadingGoal } from '../../lib/supabase';
import { generateVoice } from '../../lib/level3-api';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { getAppMode } from '../../lib/api';
import type { ReadingAnalysisResult } from '../../store/level2Slice';

const QUALITY_METRIC_LABELS: Record<string, string> = {
  speechRate: 'Okuma Hızı',
  correctWords: 'Doğru Sözcükler',
  punctuation: 'Noktalama',
  expressiveness: 'İfadeli Okuma',
};

// Mock data for dev environment testing
const MOCK_ANALYSIS_RESULT: ReadingAnalysisResult = {
  overallScore: 85,
  readingSpeed: {
    wordsPerMinute: 95,
    correctWordsPerMinute: 90,
  },
  wordCount: {
    original: 150,
    spoken: 145,
    correct: 140,
  },
  qualityRules: {
    speechRate: { score: 85, feedback: 'Okuma hızın iyi seviyede.' },
    correctWords: { score: 90, feedback: 'Sözcükleri doğru okudun.' },
    punctuation: { score: 80, feedback: 'Noktalama işaretlerine dikkat et.' },
    expressiveness: { score: 85, feedback: 'İfadeli okuma yapıyorsun.' },
  },
  pronunciation: {
    accuracy: 88,
    errors: [
      { expected: 'karınca', actual: 'karınca' },
      { expected: 'çalışkan', actual: 'çalışkan' },
    ],
  },
  recommendations: [
    'Daha yavaş ve dikkatli oku.',
    'Noktalama işaretlerine dikkat et.',
    'Her kelimeyi net telaffuz et.',
  ],
  transcript: 'Karıncalar çok çalışkan hayvanlardır. Onlar birlikte çalışarak büyük işler başarırlar.',
};

export default function L3Step3() {
  const [searchParams] = useSearchParams();
  const rawAnalysisResult = useSelector((state: RootState) => state.level2.analysisResult);
  const student = useSelector((state: RootState) => state.user.student);
  const navigate = useNavigate();
  const { onStepCompleted } = useStepContext();
  const storyId = searchParams.get('storyId') || '3';
  const storyIdNum = parseInt(storyId);
  const appMode = getAppMode();

  // Use mock data in dev mode if no analysis result
  const analysisResult = rawAnalysisResult || (appMode === 'dev' ? MOCK_ANALYSIS_RESULT : null);

  const [targetWpm, setTargetWpm] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');
  const [resultText, setResultText] = useState<string>('');
  const [hasPlayedFirstVoice, setHasPlayedFirstVoice] = useState(false);
  const [hasPlayedResultVoice, setHasPlayedResultVoice] = useState(false);
  const [goalAchieved, setGoalAchieved] = useState<boolean | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const selectedGoal = useSelector((state: RootState) => state.level2.selectedGoal);
  const level3FeedbackAudio = useSelector((state: RootState) => state.level2.level3FeedbackAudio);

  // Load target WPM from Level 2 (from Redux or Supabase)
  useEffect(() => {
    // In dev mode, use mock target if no student or goal
    if (appMode === 'dev' && !student && !selectedGoal) {
      setTargetWpm(100); // Mock target WPM
      return;
    }

    if (!student) return;

    const loadTargetWPM = async () => {
      // First try Redux (if available)
      if (selectedGoal) {
        setTargetWpm(selectedGoal);
        return;
      }

      // Fallback to Supabase
      try {
        const goal = await getLatestReadingGoal(student.id, storyIdNum, 2);
        if (goal) {
          setTargetWpm(goal);
        } else if (appMode === 'dev') {
          // Use mock target in dev mode if no goal found
          setTargetWpm(100);
        }
      } catch (err) {
        console.error('Error loading reading goal:', err);
        if (appMode === 'dev') {
          // Use mock target in dev mode on error
          setTargetWpm(100);
        }
      }
    };

    loadTargetWPM();
  }, [student?.id, storyIdNum, selectedGoal, appMode]);

  // Play first voice from Redux (pre-generated in Step2) or generate if not available
  useEffect(() => {
    if (!analysisResult || !targetWpm || hasPlayedFirstVoice) return;

    const currentWpm = analysisResult.readingSpeed?.wordsPerMinute || 0;
    const text = `Şimdi hedefimize ulaşıp ulaşamadığımızı kontrol etme zamanı. Metni üçüncü kez okuduğunda okuma hızın ${currentWpm} sözcük. Okuma hedefi olarak ${targetWpm} sözcük seçmiştin.`;
    
    setFeedbackText(text);

    // Check if goal is achieved
    const achieved = currentWpm >= targetWpm;
    setGoalAchieved(achieved);

    const playVoice = async () => {
      try {
        let audioBase64 = level3FeedbackAudio;

        // If audio not in Redux, generate it (fallback)
        if (!audioBase64) {
          try {
            const response = await generateVoice({ text });
            audioBase64 = response.audioBase64;
          } catch (err) {
            console.error('Error generating voice:', err);
            setHasPlayedFirstVoice(true);
            return;
          }
        }

        if (audioBase64 && audioRef.current) {
          const src = audioBase64.trim().startsWith('data:') 
            ? audioBase64.trim() 
            : `data:audio/mpeg;base64,${audioBase64.trim()}`;
          
          audioRef.current.src = src;
          audioRef.current.playbackRate = getPlaybackRate();
          (audioRef.current as any).playsInline = true;
          audioRef.current.muted = false;
          
          // Wait for first audio to finish
          await audioRef.current.play();
          await new Promise<void>((resolve) => {
            audioRef.current?.addEventListener('ended', () => resolve(), { once: true });
          });
          
          setHasPlayedFirstVoice(true);
        }
      } catch (err) {
        console.error('Error playing voice:', err);
        setHasPlayedFirstVoice(true);
      }
    };

    playVoice();
  }, [analysisResult, targetWpm, hasPlayedFirstVoice, level3FeedbackAudio]);

  // Play result audio after first voice finishes
  useEffect(() => {
    if (!hasPlayedFirstVoice || hasPlayedResultVoice || goalAchieved === null || !audioRef.current) return;

    const playResultAudio = async () => {
      try {
        const audioPath = goalAchieved 
          ? '/audios/level3/seviye-3-adim-3-tebrikler.mp3'
          : '/audios/level3/seviye-3-adim-3-uzgunum.mp3';
        
        const resultMessage = goalAchieved
          ? 'Tebrikler belirlemiş olduğun hedefe ulaştın. Ödülü hak ettin. Çalışma sonunda sana sunulan ödüllerden birini tercih edebilirsin.'
          : 'Üzgünüm belirlemiş olduğun hedefe ulamadın. Ama pes etmek yok bir sonraki çalışmamızda başarabileceğine inanıyorum. Daha dikkatli ve güzel okumaya çalışırsan başarabilirsin.';

        setResultText(resultMessage);

        audioRef.current.src = audioPath;
        audioRef.current.playbackRate = getPlaybackRate();
        (audioRef.current as any).playsInline = true;
        audioRef.current.muted = false;
        
        await audioRef.current.play();
        setHasPlayedResultVoice(true);
      } catch (err) {
        console.error('Error playing result audio:', err);
        setHasPlayedResultVoice(true);
      }
    };

    playResultAudio();
  }, [hasPlayedFirstVoice, hasPlayedResultVoice, goalAchieved]);

  console.log('Step3: analysisResult from Redux:', analysisResult);

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
          <p className="text-gray-600 mb-6">Lütfen önce 2. Adımı tamamla.</p>
          <button
            onClick={() => navigate(`/level/3/step/2?storyId=${storyId}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
          >
            2. Adıma Git
          </button>
        </div>
      </div>
    );
  }

  // Show dev mode indicator if using mock data
  const isUsingMockData = appMode === 'dev' && !rawAnalysisResult;

  const currentWpm = analysisResult.readingSpeed?.wordsPerMinute || 0;

  return (
    <div className="w-full mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      {isUsingMockData && (
        <div className="mb-4 p-3 bg-yellow-100 border-2 border-yellow-400 rounded-lg text-center">
          <p className="text-sm text-yellow-800 font-semibold">🧪 DEV MODE: Test verileri kullanılıyor</p>
        </div>
      )}
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-purple-800 text-center">3. Adım: Okuma hızı ve Performans geribildirimi</h2>
        
        {/* DOST Feedback Text */}
        {feedbackText && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 text-center max-w-3xl mx-auto">
            <h4 className="font-bold text-blue-900 mb-2 text-xl">🗣️ DOST'un Mesajı</h4>
            <p className="text-gray-800 text-lg mb-4">{feedbackText}</p>
          </div>
        )}

        {/* DOST Result Text */}
        {resultText && (
          <div className={`border-2 rounded-xl p-6 text-center max-w-3xl mx-auto ${
            goalAchieved 
              ? 'bg-green-50 border-green-300' 
              : 'bg-yellow-50 border-yellow-300'
          }`}>
            <h4 className={`font-bold mb-2 text-xl ${
              goalAchieved 
                ? 'text-green-900' 
                : 'text-yellow-900'
            }`}>
              {goalAchieved ? '🎉 Tebrikler!' : '💪 Devam Et!'}
            </h4>
            <p className={`text-lg ${
              goalAchieved 
                ? 'text-green-800' 
                : 'text-yellow-800'
            }`}>
              {resultText}
            </p>
          </div>
        )}

        {/* Reading Speed Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <h4 className="font-bold text-green-900 mb-2">Okuma Hızın</h4>
            <p className="text-3xl font-bold text-green-700">{currentWpm}</p>
            <p className="text-sm text-gray-600 mt-1">sözcük/dakika</p>
          </div>
          {targetWpm && (
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
              <h4 className="font-bold text-purple-900 mb-2">Okuma Hedefin</h4>
              <p className="text-3xl font-bold text-purple-700">{targetWpm}</p>
              <p className="text-sm text-gray-600 mt-1">sözcük/dakika</p>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Overall Score */}
          <div className="md:col-span-2 lg:col-span-1 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <h4 className="font-bold text-blue-900 mb-2">Genel Puan</h4>
            <p className="text-3xl font-bold text-blue-600">{analysisResult?.overallScore || 0}</p>
          </div>

          {/* Reading Speed */}
          {analysisResult?.readingSpeed && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-bold text-green-900 mb-2">Okuma Hızı</h4>
              <p className="text-gray-700">Dakikadaki Sözcük: <span className="font-bold text-green-700">{analysisResult.readingSpeed.wordsPerMinute}</span></p>
              <p className="text-gray-700">Doğru Sözcük/Dakika: <span className="font-bold text-green-700">{analysisResult.readingSpeed.correctWordsPerMinute}</span></p>
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
      </div>
    </div>
  );
}
