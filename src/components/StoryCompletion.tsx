import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getStoryById, getStudentProgressByStory } from '../lib/supabase';
import { supabase } from '../lib/supabase';
import type { RootState } from '../store/store';

const LEVEL_TITLES: Record<number, string[]> = {
  1: [
    '1. Adım: Metnin görselini inceleme ve tahminde bulunma',
    '2. Adım: Metnin başlığını inceleme ve tahminde bulunma',
    '3. Adım: Metnin içindeki cümlelerden bazılarını okuma ve tahminde bulunma',
    '4. Adım: Okuma amacı belirleme',
  ],
  2: [
    '1. Adım: Birinci okuma ve Okuma hızı belirleme',
    '2. Adım: Okuma hızı',
    '3. Adım: Okuma hedefi belirleme',
  ],
  3: [
    '1. Adım: Model okuma ve İkinci okuma',
    '2. Adım: Üçüncü okuma ve okuma hızı belirleme',
    '3. Adım: Okuma hızı ve Performans geribildirimi',
  ],
  4: [
    '1. Adım: Dolu Şema Üzerinden Beyin Fırtınası ve Yorum',
    '2. Adım: Özetleme',
  ],
  5: [
    '1. Adım: Okuduğunu anlama soruları',
    '2. Adım: Hedefe bağlı ödül',
    '3. Adım: Çalışmayı sonlandırma',
  ],
};

export default function StoryCompletion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const student = useSelector((state: RootState) => state.user.student);
  const storyId = Number(searchParams.get('storyId')) || 1;

  const [storyTitle, setStoryTitle] = useState<string>('');
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [completedLevels, setCompletedLevels] = useState<number[]>([]);

  useEffect(() => {
    const loadData = async () => {
      if (!student) return;

      try {
        setLoading(true);

        // Get story title
        const { data: story, error: storyError } = await getStoryById(storyId);
        if (!storyError && story) {
          setStoryTitle(story.title);
        } else {
          const FALLBACK_STORIES: Record<number, string> = {
            1: 'Kırıntıların Kahramanları',
            2: 'Avucumun İçindeki Akıllı Kutu',
            3: 'Hurma Ağacı',
            4: 'Akdeniz Bölgesi',
            5: 'Çöl Gemisi',
          };
          setStoryTitle(FALLBACK_STORIES[storyId] || `Oturum ${storyId}`);
        }

        // Get progress and points
        const { data: progress, error: progressError } = await getStudentProgressByStory(
          student.id,
          storyId
        );

        if (!progressError && progress) {
          setCompletedLevels(progress.completed_levels || []);
          setTotalPoints(progress.points || 0);
        } else {
          // If no progress, try to get points from points_history
          const { data: pointsData, error: pointsError } = await supabase
            .from('points_history')
            .select('points_earned')
            .eq('student_id', student.id)
            .eq('story_id', storyId);

          if (!pointsError && pointsData) {
            const total = pointsData.reduce((sum, record) => sum + (record.points_earned || 0), 0);
            setTotalPoints(total);
          }
        }
      } catch (err) {
        console.error('Error loading story completion data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [student?.id, storyId]);

  // Listen for progress update events to refresh points
  useEffect(() => {
    if (!student) return;

    const handleProgressUpdate = async () => {
      try {
        const { data: progress, error: progressError } = await getStudentProgressByStory(
          student.id,
          storyId
        );

        if (!progressError && progress) {
          setTotalPoints(progress.points || 0);
        }
      } catch (err) {
        console.error('Error refreshing points:', err);
      }
    };

    window.addEventListener('progressUpdated', handleProgressUpdate);
    return () => {
      window.removeEventListener('progressUpdated', handleProgressUpdate);
    };
  }, [student?.id, storyId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f9f9fb] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Completion Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Confetti Background */}
          <div className="absolute inset-0 confetti pointer-events-none" aria-hidden>
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                key={i}
                className={`confetti-piece absolute ${
                  ['bg-red-500', 'bg-yellow-400', 'bg-green-500', 'bg-blue-500', 'bg-pink-500', 'bg-purple-500'][
                    i % 6
                  ]
                }`}
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  animation: `confetti-fall ${2 + Math.random() * 2}s linear infinite`,
                  animationDelay: `${Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">🎉</div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-purple-800 mb-2">
                Hikaye Tamamlandı!
              </h1>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-700 mb-4">
                {storyTitle}
              </h2>
              <div className="inline-flex items-center gap-2 bg-purple-100 px-6 py-3 rounded-full">
                <span className="text-2xl">⭐</span>
                <span className="text-xl font-bold text-purple-800">
                  Toplam Puan: {totalPoints}
                </span>
              </div>
            </div>

            {/* Level Timeline */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
                Tamamlanan Seviyeler
              </h3>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((level) => {
                  const isCompleted = completedLevels.includes(level);
                  const steps = LEVEL_TITLES[level] || [];

                  return (
                    <div
                      key={level}
                      className={`border-2 rounded-lg p-4 transition-all ${
                        isCompleted
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-300 bg-gray-50 opacity-60'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-400'
                          }`}
                        >
                          {isCompleted ? '✓' : level}
                        </div>
                        <h4 className="text-lg font-bold text-gray-800">
                          Seviye {level}
                        </h4>
                      </div>
                      {isCompleted && steps.length > 0 && (
                        <div className="ml-11 space-y-1">
                          {steps.map((stepTitle, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                              <span className="text-green-600">✓</span>
                              <span>{stepTitle}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Button */}
            <div className="text-center">
              <button
                onClick={() => navigate('/')}
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                🏠 Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti-fall {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}



