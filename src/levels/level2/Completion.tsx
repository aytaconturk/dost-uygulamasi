import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export default function Level2Completion() {
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [completedCards, setCompletedCards] = useState<boolean[]>([false, false, false, false]);
  const completionAudio = '/src/assets/audios/level1/seviye-1-tamamlandi.mp3';

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

  const handleComplete = () => {
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    navigate('/');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <audio ref={audioRef} preload="auto" />

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
          onClick={handleComplete}
          className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-10 py-4 rounded-lg font-bold text-lg shadow-lg transition transform hover:scale-105"
        >
          Ana Sayfaya Dön
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
