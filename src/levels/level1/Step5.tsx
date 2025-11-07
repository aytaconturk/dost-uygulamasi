import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const completionText = 'Metnin görselini inceleme, Metnin başlığını inceleme, Metnin içindeki cümlelerden bazılarını okuma ve tahminde bulunma, okuma amacı görevlerini gerçekleştirerek 1. Seviyemizi tamamladık seni tebrik ediyorum.';

export default function Step5() {
  const navigate = useNavigate();

  const confettiPieces = useMemo(() => {
    const lefts = [2,8,14,20,26,32,38,44,50,56,62,68,74,80,86,92];
    const durations = ['confetti-dur-3','confetti-dur-4','confetti-dur-5','confetti-dur-6'];
    const delays = ['confetti-delay-0','confetti-delay-2','confetti-delay-4','confetti-delay-6','confetti-delay-8'];
    const colors = ['bg-red-500','bg-yellow-400','bg-green-500','bg-blue-500','bg-pink-500','bg-purple-500'];
    const arr: { cls: string }[] = [];
    for (let i = 0; i < 64; i++) {
      const l = lefts[i % lefts.length];
      const c = colors[i % colors.length];
      const d = durations[i % durations.length];
      const de = delays[i % delays.length];
      arr.push({ cls: `confetti-piece confetti-l-${l} ${c} ${d} ${de}` });
    }
    return arr;
  }, []);

  return (
    <div className="relative">
      <div className="absolute inset-0 confetti pointer-events-none" aria-hidden>
        {confettiPieces.map((p, i) => (
          <div key={i} className={p.cls}></div>
        ))}
      </div>

      <div className="flex flex-col items-center justify-center text-center bg-white bg-opacity-90 rounded-2xl shadow-xl p-8 md:p-12 max-w-3xl mx-auto mt-6">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-3xl font-extrabold text-purple-800 mb-2">Tebrikler!</h3>
        <p className="text-lg text-gray-700 mb-1">1. Seviye başarıyla tamamlandı.</p>
        <p className="text-base text-gray-600 max-w-2xl">{completionText}</p>
        <div className="mt-6 flex gap-3">
          <button onClick={() => navigate('/')} className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold">Ana Sayfaya Dön</button>
        </div>
      </div>
    </div>
  );
}
