import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { awardPoints, updateStudentProgressStep } from '../../lib/supabase';
import { calculatePointsForLevel } from '../../lib/points';
import PointsAnimation from '../../components/PointsAnimation';
import type { RootState } from '../../store/store';
import { getAssetUrl } from '../../lib/image-utils';

export default function Level3Completion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [completedCards, setCompletedCards] = useState<boolean[]>([false, false, false]);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [hasAwardedPoints, setHasAwardedPoints] = useState(false);
  const student = useSelector((state: RootState) => state.user.student);
  const completionAudio = getAssetUrl('audios/level3/seviye-3-tamamlandi.mp3');

  const steps = [
    {
      title: '1. Adım: Model okuma ve İkinci okuma',
      description: 'Paragraf paragraf model okuma yapıldı ve öğrenci ikinci okumasını gerçekleştirdi.',
    },
    {
      title: '2. Adım: Üçüncü okuma ve okuma hızı belirleme',
      description: 'Üçüncü okuma yapıldı ve okuma hızı ölçüldü.',
    },
    {
      title: '3. Adım: Okuma hızı ve Performans geribildirimi',
      description: 'Okuma hızı analiz edildi ve hedef kontrolü yapıldı.',
    },
  ];

  // Show cards sequentially with delays
  useEffect(() => {
    // Play audio first
    const el = audioRef.current;
    if (el) {
      try {
        el.src = completionAudio;
        // @ts-ignore
        el.playsInline = true;
        el.muted = false;
        el.play().catch(() => {
          // Fallback: proceed even if audio fails
        });
      } catch {
        // Fallback: proceed even if audio setup fails
      }
    }

    // Show cards sequentially with delays
    const delays = [300, 800, 1300];
    const timeouts = delays.map((delay, idx) => {
      return setTimeout(() => {
        setCompletedCards((prev) => {
          const next = [...prev];
          next[idx] = true;
          return next;
        });
      }, delay);
    });

    const stopAll = () => {
      try {
        audioRef.current?.pause();
      } catch {}
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);

    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      timeouts.forEach((t) => clearTimeout(t));
      try {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      } catch {}
    };
  }, []);

  // Award points after cards are shown
  useEffect(() => {
    if (hasAwardedPoints || !student) return;

    const awardPointsTimeout = setTimeout(async () => {
      setHasAwardedPoints(true);
      try {
        const storyId = Number(searchParams.get('storyId')) || 3;
        const levelNumber = 3;
        const points = calculatePointsForLevel(levelNumber, 4); // 4 steps in level 3

        console.log('🎉 Completing level 3...', { studentId: student.id, storyId, levelNumber, points });

        // Award points FIRST
        const { error: pointsError, data: pointsData } = await awardPoints(
          student.id,
          storyId,
          points,
          'Seviye 3 tamamlandı'
        );

        if (pointsError) {
          console.error('❌ Points error:', pointsError);
        } else {
          console.log('✅ Points awarded:', pointsData);
          setEarnedPoints(points);
          setShowPointsAnimation(true);
        }

        // Wait to ensure points are saved to database
        await new Promise(resolve => setTimeout(resolve, 300));

        // Update progress to level 4 and mark level 3 as completed
        const progressResult = await updateStudentProgressStep(
          student.id, 
          storyId, 
          4, // currentLevel: move to level 4
          1, // currentStep: start at step 1 of level 4
          3  // completedLevel: mark level 3 as completed
        );
        console.log('📊 Progress updated:', progressResult);

        if (progressResult.error) {
          console.error('❌ Progress update error:', progressResult.error);
        } else {
          // Dispatch custom event to refresh progress data
          window.dispatchEvent(new Event('progressUpdated'));
        }
      } catch (err) {
        console.error('Error awarding points or updating progress:', err);
      }
    }, 2300); // After last card appears

    return () => {
      clearTimeout(awardPointsTimeout);
    };
  }, [student, hasAwardedPoints, searchParams]);

  const handleComplete = () => {
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    const storyId = Number(searchParams.get('storyId')) || 3;
    navigate(`/level/4/intro?storyId=${storyId}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <audio ref={audioRef} preload="auto" />
      <PointsAnimation show={showPointsAnimation} points={earnedPoints} />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">3. Seviye Özeti</h1>
        <p className="text-lg text-gray-700">Aşağıdaki tüm adımları başarıyla tamamladın!</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {steps.map((step, idx) => (
          <div
            key={idx}
            className={`relative bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition transform ${
              completedCards[idx]
                ? 'scale-100 opacity-100'
                : 'scale-95 opacity-0 pointer-events-none'
            } duration-500`}
          >
            {/* Checkmark in corner */}
            {completedCards[idx] && (
              <div className="absolute top-3 right-3 animate-bounceIn">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            )}

            <h3 className="text-lg font-bold text-purple-800 mb-2">{step.title}</h3>
            <p className="text-gray-700">{step.description}</p>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={handleComplete}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-10 py-4 rounded-lg font-bold text-lg shadow-lg transition transform hover:scale-105"
        >
          Sonraki Seviye →
        </button>
      </div>

      <style>{`
        @keyframes bounceIn {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-bounceIn {
          animation: bounceIn 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}

