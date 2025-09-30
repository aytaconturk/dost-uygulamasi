import { useEffect, useMemo, useRef, useState } from 'react';
import { getParagraphs, paragraphToPlain, type Paragraph } from '../../data/stories';

export default function L3Step1() {
  const story = { id: 3, title: 'Çöl Şekerlemesi', image: '/src/assets/images/story3.png' };
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [started, setStarted] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);

  useEffect(() => {
    return () => { try { window.speechSynthesis.cancel(); } catch {} };
  }, []);

  const instruction = 'Şimdi üçüncü seviyeye geçiyoruz. Bu seviyenin ilk basamağında ben metnimizi sesli bir şekilde paragraf paragraf model olarak okuyacağım. Benim güzel okuma kurallarını nasıl uyguladığıma dikkat et. Daha sonra da benim okumanı taklit ederek sen ikinci okumanı gerçekleştireceksin. Bu yüzden ben okurken sen de önündeki metinden beni dikkatli bir şekilde takip et. Bunu yaptığın zaman okuma becerilerin gelişecek. Hadi başlayalım.';

  const speak = (text: string, onend?: () => void) => {
    if (!('speechSynthesis' in window)) { onend?.(); return; }
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1;
    u.onend = () => { setIsSpeaking(false); onend?.(); };
    setIsSpeaking(true);
    window.speechSynthesis.speak(u);
  };

  const startFlow = async () => {
    setStarted(true);
    // play provided audio if exists else TTS
    const el = audioRef.current;
    let played = false;
    if (el) {
      try {
        el.src = '/src/assets/audios/level3/seviye-3-adim-1-fable.mp3';
        // @ts-ignore
        el.playsInline = true; el.muted = false;
        await el.play();
        el.addEventListener('ended', () => readParagraph(0), { once: true });
        played = true;
      } catch {}
    }
    if (!played) speak(instruction, () => readParagraph(0));
  };

  const readParagraph = (idx: number) => {
    setCurrentIdx(idx);
    const plain = paragraphToPlain(paragraphs[idx] || []);
    speak(plain, () => {
      // After model reading, we simply show "Şimdi sıra sende" and wait for user to proceed
    });
  };

  const onNextParagraph = () => {
    const next = currentIdx + 1;
    if (next < paragraphs.length) readParagraph(next);
  };

  return (
    <div className="w-full max-w-5xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <h2 className="text-2xl font-bold text-purple-800 mb-3">1. Adım: Model okuma ve İkinci okuma</h2>

      {!started ? (
        <button onClick={startFlow} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Model okuma ve İkinci okuma</button>
      ) : (
        <div className="bg-white rounded-xl shadow p-5">
          <div className="text-gray-800 text-lg">
            {paragraphs.map((p, i) => (
              <p key={i} className={`mt-3 leading-relaxed ${i === currentIdx ? 'bg-yellow-50 rounded px-2' : ''}`}>
                {p.map((seg, j) => <span key={j} className={seg.bold ? 'font-bold' : undefined}>{seg.text}</span>)}
              </p>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <span className="text-blue-700 font-semibold">Şimdi sıra sende.</span>
            <button onClick={() => readParagraph(currentIdx)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">DOST'u tekrar dinle</button>
            <button onClick={onNextParagraph} disabled={currentIdx >= paragraphs.length - 1} className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white px-4 py-2 rounded">Sonraki paragraf</button>
          </div>
        </div>
      )}
    </div>
  );
}
