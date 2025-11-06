import { useEffect, useMemo, useRef, useState } from 'react';
import { getParagraphs, type Paragraph, getStoryCategory, type StoryCategory } from '../../data/stories';
import { useNavigate } from 'react-router-dom';

export default function Step4() {
  const story = {
    id: 1,
    title: 'Oturum 1: Kırıntıların Kahramanları',
    description: 'Karıncalar hakkında',
    image: 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png',
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'intro' | 'text' | 'objective'>('intro');
  const [objectiveText, setObjectiveText] = useState<string>('');

  const stepAudio = '/src/assets/audios/level1/seviye-1-adim-4-fable.mp3';
  const paragraphs = useMemo(() => getParagraphs(story.id), [story.id]);
  const navigate = useNavigate();
  const category = useMemo<StoryCategory | null>(() => getStoryCategory(story.id), [story.id]);


  const getObjectiveByCategory = (cat: StoryCategory | null): string => {
    switch (cat) {
      case 'Hayvanlarla ilgili metinler':
        return 'Hayvanlarla ilgili metinlerde; hayvanların yaşayışları, fiziksel özellikleri, beslenmeleri, çoğalmaları, çevreye etkileri hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      case 'Bitkilerle ilgili metinler':
        return 'Bitkilerle ilgili metinlerde; bitkilerin yaşam koşulları, fiziksel özellikleri, çoğalmaları, çevreye etkileri hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      case 'Elektronik araçlarla ilgili metinler':
        return 'Elektronik araçlarla ilgili metinlerde; elektronik araçların kullanım amaçları, fiziksel özellikleri, çalışma biçimleri, üretimleri, çevreye etkileri hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      case 'Coğrafi Bölgelerle İlgili ilgili metinler':
        return 'Coğrafi Bölgelerle İlgili ilgili metinlerde; coğrafi bölgelerin iklimi, bitki örtüsü, yeryüzü özellikleri, ekonomik faaliyetleri, nüfus ve yerleşmesi hakkında bilgi sahibi olmak ve metinle ilgili sorulara doğru cevap verebilmek amacıyla bu metnin okunduğunu söyler.';
      default:
        return '';
    }
  };

  const speak = (text: string) => {
    if (!text) return;
    try { window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any)); } catch {}
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'tr-TR';
      u.rate = 0.95;
      u.pitch = 1;
      window.speechSynthesis.speak(u);
    }
  };

  useEffect(() => {
    const el = audioRef.current;
    const onEnded = () => {
      setPhase('text');
      const msg = getObjectiveByCategory(category);
      setObjectiveText(msg);
      // Objective will be presented shortly after text appears
      setTimeout(() => {
        setPhase('objective');
        speak(msg);
      }, 600);
    };
    if (el) {
      el.src = stepAudio;
      // @ts-ignore
      el.playsInline = true;
      el.muted = false;
      el.play().then(() => el.addEventListener('ended', onEnded, { once: true })).catch(onEnded);
    } else {
      onEnded();
    }
    const stopAll = () => { try { audioRef.current?.pause(); } catch {} };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } } catch {}
    };
  }, [category]);

  const renderParagraph = (p: Paragraph, idx: number) => (
    <p key={idx} className="mt-3 leading-relaxed text-gray-800">
      {p.map((seg, i) => (
        <span key={i} className={seg.bold ? 'font-bold' : undefined}>{seg.text}</span>
      ))}
    </p>
  );

  const onClickTamamla = async () => {
    try { window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any)); } catch {}
    navigate('/level/1/step/5');
  };

  return (
    <div className="flex flex-col md:flex-row items-start justify-center gap-6 px-4 md:px-12 relative mt-0">
      <audio ref={audioRef} preload="auto" />
      <div className="flex-shrink-0 mt-4">
        <img src={story.image} alt={story.title} className="rounded-lg shadow-lg w-64 md:w-80" />
      </div>
      <div className="text-lg text-gray-800 leading-relaxed max-w-xl w-full">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">4. Adım: Okuma amacı belirleme</h2>

        {phase === 'intro' && (
          <p className="mt-2 text-gray-800">Bu seviyenin son basamağına geldik. Bu basamakta karşımıza çıkan metinler için okuma amaçları belirlememiz gerekiyor.</p>
        )}

        {phase !== 'intro' && (
          <div className="space-y-4">
            {/* The text replaces the explanation area, image and title stay */}
            <div className="bg-white rounded-xl shadow p-4">
              <div className="text-base md:text-lg">
                {paragraphs.map((p, idx) => renderParagraph(p, idx))}
              </div>
            </div>


            {phase === 'objective' && (
              <div className="pt-2">
                <button onClick={onClickTamamla} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Tamamla</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
