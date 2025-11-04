import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { getApiBase } from '../../lib/api';
import { getParagraphs } from '../../data/stories';

const STORY_ID = 2;
const TOTAL_SECONDS = 60;

export default function Level2Step1() {
  const story = { id: STORY_ID, title: 'Avucumun İçindeki Akıllı Kutu' };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<null | { wordsRead: number; wpm: number; wordsPerSecond: number }>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [countdownStartTime, setCountdownStartTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [beeped60, setBeeped60] = useState(false);

  const paragraphs = getParagraphs(story.id);
  const displayTitle = story.title;

  const handleStart = async () => {
    setStarted(true);
    setReading(true);
    setCountdownStartTime(Date.now());
  };

  useEffect(() => {
    if (!reading) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
      const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
      setTimeLeft(remaining);
      if (remaining === 60 && !beeped60) {
        setBeeped60(true);
        if (audioRef.current) {
          audioRef.current.src = '/src/assets/audios/sira-sende-mikrofon.mp3';
          audioRef.current.play().catch(() => {});
        }
      }
      if (remaining === 0) {
        setTimeUp(true);
        setReading(false);
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [reading, countdownStartTime, beeped60]);

  const handleFinish = async () => {
    setReading(false);
    const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
    const wordsRead = selectedWordIndex !== null ? selectedWordIndex + 1 : 0;
    const wpm = elapsed > 0 ? Math.round((wordsRead / elapsed) * 60) : 0;
    const wordsPerSecond = elapsed > 0 ? wordsRead / elapsed : 0;

    setResult({ wordsRead, wpm, wordsPerSecond });
    setIsUploading(true);

    try {
      const { data } = await axios.post(`${getApiBase()}/dost/level2/reading-analysis`, {
        storyId: story.id,
        wordsRead,
        wpm,
        elapsedSeconds: elapsed,
        userId: 'test-user',
      });
      setAnalysis(data);
    } catch {
      console.log('Upload error (offline mode)');
    } finally {
      setIsUploading(false);
    }
  };

  const CountdownBadge = ({ secondsLeft, total }: { secondsLeft: number; total: number }) => {
    const size = 64;
    const stroke = 6;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(1 - secondsLeft / total, 0), 1);
    const dashOffset = circumference * progress;
    const color = progress < 0.5 ? '#22c55e' : progress < 0.85 ? '#f59e0b' : '#ef4444';
    return (
      <svg width={size} height={size} className="block">
        <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
        <g style={{ transform: `rotate(90deg)`, transformOrigin: '50% 50%' }}>
          <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
        </g>
      </svg>
    );
  };

  const introText = 'Şimdi ikinci seviyeye geçiyoruz. Bu seviyede metni ilk kez okuyacaksın ben de senin okuma hızını belirleyeceğim. Bunun için seni bir görev bekliyor. Az sonra ekranda çıkacak olan başla butonuna basar basmaz metin karşına çıkacak sen de beklemeden tüm metni güzel okuma kurallarına uygun bir şekilde oku.';

  return (
    <div className="w-full mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      
      {/* Start screen */}
      {!started && !reading && !result && (
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">1. Adım: Birinci okuma ve Okuma hızı belirleme</h2>
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <p className="text-gray-800 text-lg">{introText}</p>
          </div>
          <div className="flex justify-center">
            <button onClick={handleStart} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Başla</button>
          </div>
        </div>
      )}

      {/* Reading screen */}
      {reading && (
        <div className="w-full relative">
          <div className="flex flex-col lg:flex-row gap-0">
            {/* Left sticky image */}
            <div className="hidden lg:sticky lg:top-0 lg:w-1/4 lg:flex flex-col items-center justify-start p-4 h-screen overflow-y-auto flex-shrink-0">
              <img src="https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story2.png" alt={displayTitle} className="w-full max-w-xs rounded-xl shadow-lg" />
              <h2 className="mt-4 text-2xl font-bold text-purple-800 text-center">{displayTitle}</h2>
              <div className="mt-2 text-center text-gray-600 text-sm">{beeped60 ? '60. saniye: Son sözcüğü işaretle' : 'Okumaya devam et'}</div>
            </div>

            {/* Center text */}
            <div className="flex-1 bg-white shadow p-6 leading-relaxed text-gray-800">
              <div className={`text-lg leading-relaxed space-y-4 ${timeUp ? 'blur-sm' : ''}`}>
                {(() => {
                  let globalIndex = -1;
                  return paragraphs.map((para, pIdx) => (
                    <p key={pIdx}>
                      {para.map((seg, sIdx) => {
                        const words = seg.text.split(/\s+/).filter(Boolean);
                        return (
                          <span key={sIdx} className={seg.bold ? 'font-bold' : ''}>
                            {words.map((w, wIdx) => {
                              globalIndex += 1;
                              const idx = globalIndex;
                              return (
                                <span
                                  key={wIdx}
                                  onClick={() => setSelectedWordIndex(idx)}
                                  className={`cursor-pointer px-0.5 ${selectedWordIndex === idx ? 'bg-yellow-300 rounded' : ''}`}
                                >
                                  {w}{' '}
                                </span>
                              );
                            })}
                          </span>
                        );
                      })}
                    </p>
                  ));
                })()}
              </div>
              {timeUp && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/70 rounded-xl"></div>
                  <div className="relative text-red-600 text-2xl font-extrabold animate-bounce">Süre doldu</div>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                <button onClick={handleFinish} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow">Bitir</button>
                {beeped60 && <div className="text-sm text-orange-700 bg-orange-50 border-l-4 border-orange-400 px-3 py-2 rounded">Bip sesinden sonra son okuduğun sözcüğü işaretlemeyi unutma.</div>}
              </div>
            </div>
          </div>

          {/* Right fixed countdown */}
          <div className="hidden lg:flex fixed right-8 top-20 flex-col items-center justify-start p-4 bg-white rounded-lg shadow z-40">
            <div className="w-16 h-16 mb-2">
              <CountdownBadge secondsLeft={timeLeft} total={TOTAL_SECONDS} />
            </div>
            <div className="text-center text-gray-600 text-sm">Kalan Süre</div>
          </div>
        </div>
      )}

      {/* Result screen */}
      {(result || isUploading || analysis) && (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            {result && (
              <>
                <h3 className="text-2xl font-bold text-purple-800 mb-2">Okuma Hızın</h3>
                <p className="text-gray-700">Okuduğun sözcük: <span className="font-bold text-green-700">{result.wordsRead}</span></p>
                <p className="text-gray-700">Dakikadaki sözcük: <span className="font-bold text-green-700">{result.wpm}</span></p>
              </>
            )}
            {isUploading && <p className="text-gray-600">Analiz yapılıyor...</p>}
            {analysis && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-gray-800">{analysis.feedback || 'Analiz tamamlandı'}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
