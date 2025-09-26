import React, { useEffect, useMemo, useRef, useState } from 'react';

export default function Step1() {
  const [marked, setMarked] = useState(false);
  const [readyToStart, setReadyToStart] = useState(false);
  const [started, setStarted] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [reading, setReading] = useState(false);
  const [beeped60, setBeeped60] = useState(false);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [result, setResult] = useState<{ wordsRead: number; wpm: number } | null>(null);
  const [mascotState, setMascotState] = useState<'idle' | 'speaking' | 'listening'>('idle');

  const startTimeRef = useRef<number | null>(null);
  const sixtyTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);

  const story = {
    id: 2,
    title: 'Çöl Gemisi',
    description: 'Develer hakkında',
    image: '/src/assets/images/story2.png'
  };

  const readingText = useMemo(() => `Develer çölde yaşayan dayanıklı hayvanlardır. Sıcak günlerde uzun süre susuz kalabilirler. Gövdelerindeki hörgüçlerde yağ depolar ve bu sayede enerji sağlarlar. Kalın dudakları dikenli bitkileri bile acı duymadan yemelerine yardımcı olur. Uzun kirpikleri ve kapanabilen burun delikleri kum fırtınalarında onları korur. Yavaş ve dengeli adımlarla ilerler, çöl halkı onları çöl gemisi olarak adlandırır. İnsanlar yüzyıllardır develeri yük taşımak, yolculuk yapmak ve sütlerinden yararlanmak için kullanır.`.split(/\s+/), []);

  const totalWords = readingText.length;

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'tr-TR';
        u.rate = 0.95;
        u.pitch = 1;
        setMascotState('speaking');
        u.onend = () => setMascotState('listening');
        u.onerror = () => setMascotState('listening');
        window.speechSynthesis.speak(u);
      } catch {}
    }
  };

  const startShortBeep = (durationMs = 500) => {
    try {
      if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const ctx = audioCtxRef.current!;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.value = 0.1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      oscillatorRef.current = osc;
      window.setTimeout(() => {
        try { osc.stop(); } catch {}
        oscillatorRef.current = null;
      }, durationMs);
    } catch {}
  };

  const start60sBeep = () => {
    startShortBeep(700);
  };

  const beginCountdownThenShowText = () => {
    setCountdown(3);
    countdownTimerRef.current = window.setInterval(() => {
      setCountdown(prev => {
        if (!prev || prev <= 1) {
          if (countdownTimerRef.current) window.clearInterval(countdownTimerRef.current);
          setCountdown(null);
          // Optional start sound
          startShortBeep(300);
          // Show text and start reading timer
          setReading(true);
          setStarted(true);
          startTimeRef.current = Date.now();
          // Schedule 60s beep
          sixtyTimerRef.current = window.setTimeout(() => {
            setBeeped60(true);
            start60sBeep();
          }, 60000);
          return prev as any;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  const stopAll = () => {
    try {
      if (sixtyTimerRef.current) {
        window.clearTimeout(sixtyTimerRef.current);
        sixtyTimerRef.current = null;
      }
      if (countdownTimerRef.current) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch {}
        oscillatorRef.current = null;
      }
      if (audioCtxRef.current) {
        try { audioCtxRef.current.close(); } catch {}
        audioCtxRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  };

  useEffect(() => {
    const handleStopAll = () => stopAll();
    window.addEventListener('STOP_ALL_AUDIO' as any, handleStopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, handleStopAll);
    };
  }, []);

  useEffect(() => {
    return () => {
      stopAll();
    };
  }, []);

  const handleIntroClick = () => {
    setMarked(true);
    // Contract A/B — we implement B variant (countdown + 60s beep)
    speak('Şimdi ikinci seviyeye geçiyoruz. Bu seviyede metni ilk kez okuyacaksın ve okuma hızını belirleyip yazacaksın. Az sonra ekranda çıkacak olan başla butonuna basar basmaz beklemeden tüm metni güzel okuma kurallar��na uygun bir şekilde oku. Altmışıncı saniyede bip sesi duyduğunda son okuduğun sözcüğü tıklayarak işaretle ve okumaya devam et.');
    setTimeout(() => setReadyToStart(true), 300);
  };

  const handleStart = () => {
    // Hide mascot on text screen
    setMascotState('idle');
    beginCountdownThenShowText();
  };

  const handleFinish = () => {
    if (!reading || startTimeRef.current == null) return;
    const elapsedMs = Date.now() - startTimeRef.current;
    const minutes = Math.max(elapsedMs / 60000, 0.0001);
    const wordsRead = selectedWordIndex != null ? selectedWordIndex + 1 : totalWords;
    const wpm = Math.round(wordsRead / minutes);
    setResult({ wordsRead, wpm });
    setReading(false);
    stopAll();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative mt-0">
      {/* Intro card */}
      {!started && !reading && !result && (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            onClick={handleIntroClick}
            className="cursor-pointer bg-white rounded-xl shadow-lg border border-purple-200 p-6 max-w-2xl text-center hover:shadow-xl transition relative"
          >
            <h2 className="text-2xl font-semibold text-purple-800 mb-2">1. Adım: Birinci okuma ve Okuma hızı belirleme</h2>
            <p className="text-gray-700">Birinci okuma ve okuma hızını belirlemek için yönergeyi dinlemek üzere dokun.</p>
            {marked && (
              <div className="absolute -top-3 -right-3 bg-green-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold">✓</div>
            )}
          </div>
          {readyToStart && (
            <button onClick={handleStart} className="mt-6 bg-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-purple-700 transition text-xl font-bold">Başla</button>
          )}
        </div>
      )}

      {/* Countdown overlay */}
      {countdown !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20">
          <div className="bg-white rounded-2xl shadow-xl w-48 h-48 flex items-center justify-center text-6xl font-extrabold text-purple-700">{countdown}</div>
        </div>
      )}

      {/* Reading screen */}
      {reading && (
        <div className="w-full max-w-5xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start gap-8">
            <div className="lg:w-1/3 w-full">
              <img src={story.image} alt={story.title} className="w-full max-w-sm mx-auto rounded-xl shadow-lg" />
              <h2 className="mt-4 text-2xl font-bold text-purple-800 text-center">{story.title}</h2>
              <div className="mt-2 text-center text-gray-600">{beeped60 ? '60. saniye: Son sözcüğü işaretle' : 'Okumaya devam et'}</div>
            </div>
            <div className="lg:w-2/3 w-full bg-white rounded-xl shadow p-6 leading-relaxed text-gray-800">
              <div className="text-lg">
                {readingText.map((w, i) => (
                  <span
                    key={i}
                    onClick={() => setSelectedWordIndex(i)}
                    className={`cursor-pointer px-0.5 ${selectedWordIndex === i ? 'bg-yellow-300 rounded' : ''}`}
                  >
                    {w}{' '}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center gap-3">
                <button onClick={handleFinish} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow">Bitir</button>
                {beeped60 && <div className="text-sm text-orange-700 bg-orange-50 border-l-4 border-orange-400 px-3 py-2 rounded">Bip sesinden sonra son okuduğun sözcüğü işaretlemeyi unutma.</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Result screen */}
      {result && (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            <h3 className="text-2xl font-bold text-purple-800 mb-2">Okuma Hızın</h3>
            <p className="text-gray-700">Okuduğun sözcük: <span className="font-bold text-green-700">{result.wordsRead}</span></p>
            <p className="text-gray-700">Dakikadaki sözcük: <span className="font-bold text-green-700">{result.wpm}</span></p>
            <p className="mt-4 text-sm text-gray-500">İstersen geri dönüp tekrar deneyebilirsin.</p>
          </div>
        </div>
      )}

    </div>
  );
}
