import { useEffect, useMemo, useRef, useState } from 'react';
import { getParagraphs, paragraphToPlain } from '../../data/stories';

function countWords(text: string) {
  const m = text.trim().match(/\b\w+\b/gu);
  return m ? m.length : 0;
}

export default function L3Step2() {
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

  const startCountdown = () => {
    setPhase('countdown');
    setCount(3);
    const id = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(id);
          playBeep();
          setPhase('reading');
          startTimeRef.current = Date.now();
        }
        return c - 1;
      });
    }, 1000);
  };

  const finishReading = () => {
    const end = Date.now();
    const start = startTimeRef.current || end;
    const elapsedSec = Math.max(1, Math.round((end - start) / 1000));
    const wpm = Math.round((totalWords / elapsedSec) * 60);
    const payload = { totalWords, elapsedSec, wpm, targetWPM };
    try { localStorage.setItem('level3_result', JSON.stringify(payload)); } catch {}
    setPhase('done');
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <h2 className="text-2xl font-bold text-purple-800 mb-3">2. Adım: Üçüncü okuma ve okuma hızı belirleme</h2>

      {phase === 'intro' && (
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-800 mb-4">Şimdi hedefine ulaşıp ulaşmadığını değerlendirmek için metni üçüncü kez okuyacaksın ben de senin okuma hızını belirleyeceğim. Bunun için seni yine bir görev bekliyor. Az sonra ekranda çıkacak olan başla butonuna basar basmaz metin karşına çıkacak, sen de beklemeden tüm metni güzel okuma kurallarına uygun bir şekilde oku.</p>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-sm text-gray-700">Hedef (sözcük/dk):</label>
            <input type="number" className="border rounded px-2 py-1 w-24" value={targetWPM} onChange={e => setTargetWPM(Number(e.target.value || 0))} />
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
