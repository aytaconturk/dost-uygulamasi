import { useEffect, useMemo, useRef, useState } from 'react';
import { getParagraphs, paragraphToPlain } from '../../data/stories';

interface Q {
  q: string;
  choices: string[];
  correct: number;
}

export default function L5Step1() {
  const storyId = 3; // Çöl Şekerlemesi
  const story = { id: storyId, title: 'Çöl Şekerlemesi', image: '/src/assets/images/story3.png' };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'intro'|'quiz'|'done'>('intro');
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string>('');

  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);
  const fullText = useMemo(() => paragraphs.map(p => paragraphToPlain(p)).join(' '), [paragraphs]);

  // Basit 5 soru - metinden türetilmiş
  const questions: Q[] = useMemo(() => [
    { q: 'Hurma ağacı en çok hangi iklimde yetişir?', choices: ['Ilıman iklim','Soğuk iklim','Çöl iklimi','Yağmurlu iklim'], correct: 2 },
    { q: 'Hurma ağacının meyveleri nerede bulunur?', choices: ['Köklerde','Dallarında salkım halinde','Toprak altında','Gövde içinde'], correct: 1 },
    { q: 'Hurma ağacı hangi ağaca benzer?', choices: ['Meşe','Palmiye','Çam','Kayın'], correct: 1 },
    { q: 'Hurma ağacı nasıl çoğalabilir?', choices: ['Sadece aşı ile','Sadece tohumla','Sadece filizle','Tohum veya gövdeden çıkan filizlerle'], correct: 3 },
    { q: 'Aşırı hurma tüketimi neye yol açabilir?', choices: ['Uyku hali','Baş ağrısı','Diş çürümesi','Mide yanması'], correct: 1 },
  ], []);

  const speak = (text: string, onend?: () => void) => {
    if (!('speechSynthesis' in window)) { onend?.(); return; }
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1; u.onend = () => onend?.();
    window.speechSynthesis.speak(u);
  };

  const introText = 'Beşinci seviyeye geçiyoruz. Şimdi sana metinle ilgili 5 tane okuduğunu anlama sorusu soracağım ve cevaplarının doğruluğunu kontrol edeceğim. Sen cevap vermeden diğer soruya geçmeyeceğim. Başlıyorum.';

  useEffect(() => {
    // Autoplay instruction audio, then show quiz
    const el = audioRef.current;
    const proceed = () => setPhase('quiz');
    let attached = false;
    if (el) {
      try {
        el.src = '/src/assets/audios/level5/seviye-5-adim-1.mp3';
        // @ts-ignore
        el.playsInline = true; el.muted = false;
        el.play()
          .then(() => { el.addEventListener('ended', proceed, { once: true }); attached = true; })
          .catch(() => speak(introText, proceed));
      } catch {
        speak(introText, proceed);
      }
    } else {
      speak(introText, proceed);
    }
    return () => { if (attached) try { el?.removeEventListener('ended', proceed as any); } catch {} };
  }, []);

  const onSelect = (i: number) => setSelected(i);

  const onConfirm = () => {
    if (selected == null) return;
    const q = questions[idx];
    const isCorrect = selected === q.correct;
    if (isCorrect) { setScore(s => s + 1); setFeedback('Doğru!'); }
    else { setFeedback(`Yanlış. Doğru cevap: ${q.choices[q.correct]}`); }
  };

  const onNext = () => {
    if (idx + 1 < questions.length) {
      setIdx(i => i + 1); setSelected(null); setFeedback('');
    } else {
      setPhase('done');
      try { localStorage.setItem('level5_quiz_score', String(score)); } catch {}
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <h2 className="text-2xl font-bold text-purple-800 mb-3">1. Adım: Okuduğunu anlama soruları</h2>

      {phase === 'intro' && (
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-800 text-lg">{introText}</p>
        </div>
      )}

      {phase === 'quiz' && (
        <div className="bg-white rounded-xl shadow p-5">
          <p className="text-gray-800 font-semibold">Soru {idx + 1} / {questions.length}</p>
          <p className="text-lg text-gray-900 mt-2">{questions[idx].q}</p>
          <div className="mt-3 grid gap-2">
            {questions[idx].choices.map((c, i) => (
              <label key={i} className={`flex items-center gap-2 border rounded p-2 cursor-pointer ${selected === i ? 'bg-purple-50 border-purple-400' : 'border-gray-300'}`}>
                <input type="radio" name="choice" checked={selected === i} onChange={() => onSelect(i)} />
                <span>{c}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <button onClick={onConfirm} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">Onayla</button>
            <button onClick={onNext} disabled={feedback === ''} className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded">Sonraki</button>
            {feedback && <span className={`ml-2 ${feedback.startsWith('Doğru') ? 'text-green-600' : 'text-red-600'}`}>{feedback}</span>}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">Sorular tamamlandı. Doğru sayısı: {score} / {questions.length}</div>
      )}
    </div>
  );
}
