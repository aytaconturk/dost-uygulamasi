import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { getParagraphs, paragraphToPlain } from '../../data/stories';
import { insertReadingLog } from '../../lib/supabase';
import type { RootState } from '../../store/store';

function countWords(text: string) {
  const m = text.trim().match(/\b\w+\b/gu);
  return m ? m.length : 0;
}

export default function L3Step2() {
  const student = useSelector((state: RootState) => state.user.student);

  const story = { id: 3, title: 'Çöl Şekerlemesi', image: '/src/assets/images/story3.png' };
  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);
  const fullText = useMemo(() => paragraphs.map(p => paragraphToPlain(p)).join(' '), [paragraphs]);
  const totalWords = useMemo(() => countWords(fullText), [fullText]);

  const [targetWPM, setTargetWPM] = useState<number>(() => {
    const v = Number(localStorage.getItem('level3_target_wpm') || '80');
    return isNaN(v) ? 80 : v;
  });
  const [phase, setPhase] = useState<'intro'|'countdown'|'reading'|'done'>('intro');
  const [count, setCount] = useState(3);
  const startTimeRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => { try { localStorage.setItem('level3_target_wpm', String(targetWPM)); } catch {} }, [targetWPM]);

  const playBeep = () => {
    const el = audioRef.current;
    if (!el) return;
    try {
      el.src = '/src/assets/audios/sira-sende-mikrofon.mp3';
      // @ts-ignore
      el.playsInline = true; el.muted = false; el.play().catch(() => {});
    } catch {}
  };

  const startCountdown = async () => {
    setPhase('countdown');
    setCount(3);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          setPhase('reading');
          startTimeRef.current = Date.now();
          playBeep();
        }
        return c - 1;
      });
    }, 1000);
  };

  const finishReading = async () => {
    if (!startTimeRef.current) return;

    const elapsedSec = (Date.now() - startTimeRef.current) / 1000;
    const wpm = Math.round((totalWords / elapsedSec) * 60);

    try {
      localStorage.setItem('level3_result', JSON.stringify({ totalWords, elapsedSec, wpm, targetWPM }));
    } catch {}

    // Save reading log to Supabase
    if (student) {
      try {
        await insertReadingLog(student.id, 3, 3, wpm, totalWords, totalWords);
      } catch (err) {
        console.error('Failed to save reading log:', err);
      }
    }

    setPhase('done');
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <div className="flex flex-col items-center justify-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-purple-800">2. Adım: Üçüncü okuma ve okuma hızı belirleme</h2>
      </div>

      {phase === 'intro' && (
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl shadow p-5 w-full">
            <p className="text-gray-800 mb-6">Şimdi hedefine ulaşıp ulaşmadığını değerlendirmek için metni üçüncü kez okuyacaksın ben de senin okuma hızını belirleyeceğim. Bunun için seni yine bir görev bekliyor. Az sonra ekranda çıkacak olan başla butonuna basar basmaz metin karşına çıkacak sen de beklemeden tüm metni güzel okuma kurallarına uygun bir şekilde metni oku. Okuman bitince "Bitir" butonuna bas.</p>
          </div>
          <button onClick={startCountdown} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Başla</button>
        </div>
      )}

      {phase === 'countdown' && (
        <div className="text-center bg-white rounded-xl shadow p-10 text-6xl font-bold text-purple-700">{count}</div>
      )}

      {phase === 'reading' && (
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <img src={story.image} alt={story.title} className="rounded-xl shadow w-48 md:w-64" />
          <div className="bg-white rounded-xl shadow p-5 flex-1">
            <div className="text-lg text-gray-800 leading-relaxed">
              {paragraphs.map((p, i) => (
                <p key={i} className="mt-3">{p.map((s,j)=>(<span key={j} className={s.bold?'font-bold':undefined}>{s.text}</span>))}</p>
              ))}
            </div>
            <div className="mt-4">
              <button onClick={finishReading} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-2 rounded">Bitir</button>
            </div>
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-800">Okuma tamamlandı. Bir sonraki adımda hızın ve hedefin değerlendirilecek.</p>
        </div>
      )}
    </div>
  );
}
