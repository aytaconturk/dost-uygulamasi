import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { awardPoints, updateStudentProgressStep } from '../../lib/supabase';
import { calculatePointsForLevel } from '../../lib/points';
import PointsAnimation from '../../components/PointsAnimation';
import type { RootState } from '../../store/store';

export default function Level2Completion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [completedCards, setCompletedCards] = useState<boolean[]>([false, false, false, false]);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [hasAwardedPoints, setHasAwardedPoints] = useState(false);
  const student = useSelector((state: RootState) => state.user.student);
  const completionAudio = '/src/assets/audios/level1/seviye-1-tamamlandi.mp3';
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  const steps = [
    {
      title: '1. Adım: Metni Okuma',
      description: 'Metni yüksek sesle okuyan ve kaydını yaptık.',
    },
    {
      title: '2. Adım: Sonuçları Analiz Etme',
      description: 'Okuma hızı, doğruluk ve kalitesini değerlendirdik.',
    },
    {
      title: '3. Adım: Hedef Belirleme',
      description: 'Gelecek okumalar için gelişim hedefini belirledik.',
    },
    {
      title: '4. Adım: Özet Görüntüleme',
      description: '2. Seviyenin tamamını başarıyla bitirdik.',
    },
  ];

  // Show cards sequentially with delays
  useEffect(() => {
    // Play audio first
    const el = audioRef.current;
    if (el) {
      try {
        el.src = completionAudio;
        // Apply playback rate
        el.playbackRate = getPlaybackRate();
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
    const delays = [300, 800, 1300, 1800];
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
        const storyId = Number(searchParams.get('storyId')) || 2;
        const levelNumber = 2;
        const points = calculatePointsForLevel(levelNumber, 4); // 4 steps in level 2

        console.log('🎉 Completing level 2...', { studentId: student.id, storyId, levelNumber, points });

        // Award points FIRST
        const { error: pointsError, data: pointsData } = await awardPoints(
          student.id,
          storyId,
          points,
          'Seviye 2 tamamlandı'
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

        // Update progress to level 3 and mark level 2 as completed
        const progressResult = await updateStudentProgressStep(
          student.id, 
          storyId, 
          3, // currentLevel: move to level 3
          1, // currentStep: start at step 1 of level 3
          2  // completedLevel: mark level 2 as completed
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

  const handleNextLevel = () => {
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    const storyId = searchParams.get('storyId') || '2';
    navigate(`/level/3/intro?storyId=${storyId}`);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <audio ref={audioRef} preload="auto" />
      <PointsAnimation show={showPointsAnimation} points={earnedPoints} />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">🎉 2. Seviye Tamamlandı!</h1>
        <p className="text-lg text-gray-700">Tebrikler! Aşağıdaki tüm adımları başarıyla tamamladın!</p>
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

      <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-8 text-center mb-8 border-2 border-purple-300">
        <h2 className="text-2xl font-bold text-purple-800 mb-2">🌟 Harika Bir İş Çıkardın!</h2>
        <p className="text-gray-700">Okuma becerilerini geliştirmek için aldığın hedeflere ulaşmaya devam et!</p>
      </div>

      <div className="text-center">
        <button
          onClick={handleNextLevel}
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
