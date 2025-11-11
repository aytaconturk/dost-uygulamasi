import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { awardPoints, updateStudentProgressStep } from '../../lib/supabase';
import { calculatePointsForLevel } from '../../lib/points';
import PointsAnimation from '../../components/PointsAnimation';
import type { RootState } from '../../store/store';

export default function Completion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [completedCards, setCompletedCards] = useState<boolean[]>([false, false, false, false]);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  const [hasAwardedPoints, setHasAwardedPoints] = useState(false);
  const student = useSelector((state: RootState) => state.user.student);
  const completionAudio = '/src/assets/audios/level1/seviye-1-tamamlandi.mp3';

  const steps = [
    {
      title: '1. Adım: Metnin Görselini İnceleme',
      description: 'Görseli inceleyerek hikayenin ne hakkında olabileceğini tahmin ettik.',
    },
    {
      title: '2. Adım: Metnin Başlığını İnceleme',
      description: 'Başlığa bakarak metnin ne hakkında olabileceğini tahmin ettik.',
    },
    {
      title: '3. Adım: Anlama Çalışması',
      description: 'Metinden seçilen cümleleri okuyarak metnin konusunu anladık.',
    },
    {
      title: '4. Adım: Okuma Amacı Belirleme',
      description: 'Metni okurken hangi amaçla okuyacağımızı belirledik.',
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
        const storyId = Number(searchParams.get('storyId')) || 1;
        const levelNumber = 1;
        const points = calculatePointsForLevel(levelNumber, 4); // 4 steps in level 1

        console.log('🎉 Completing level 1...', { studentId: student.id, storyId, levelNumber, points });

        // Award points
        const { error: pointsError, data: pointsData } = await awardPoints(
          student.id,
          storyId,
          points,
          'Seviye 1 tamamlandı'
        );

        if (pointsError) {
          console.error('❌ Points error:', pointsError);
        } else {
          console.log('✅ Points awarded:', pointsData);
          setEarnedPoints(points);
          setShowPointsAnimation(true);
        }

        // Update progress to level 2
        const progressResult = await updateStudentProgressStep(student.id, storyId, 2, 1);
        console.log('📊 Progress updated:', progressResult);

        if (progressResult.error) {
          console.error('❌ Progress update error:', progressResult.error);
        }
      } catch (err) {
        console.error('Error awarding points or updating progress:', err);
      }
    }, 2300); // After last card appears

    return () => {
      clearTimeout(awardPointsTimeout);
    };
  }, [student, hasAwardedPoints]);

  const handleComplete = () => {
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    navigate('/story/1');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <audio ref={audioRef} preload="auto" />
      <PointsAnimation show={showPointsAnimation} points={earnedPoints} />

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">1. Seviye Özeti</h1>
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
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-10 py-4 rounded-lg font-bold text-lg shadow-lg transition transform hover:scale-105"
        >
          Tamamla
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
