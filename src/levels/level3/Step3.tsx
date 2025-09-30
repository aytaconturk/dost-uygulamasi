import { useEffect, useMemo, useRef, useState } from 'react';

export default function L3Step3() {
  const [result, setResult] = useState<{totalWords:number; elapsedSec:number; wpm:number; targetWPM:number} | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('level3_result');
      if (raw) setResult(JSON.parse(raw));
    } catch {}
  }, []);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1;
    window.speechSynthesis.speak(u);
  };

  const summaryText = useMemo(() => {
    const r = result;
    if (!r) return 'Henüz bir okuma sonucu bulunamadı.';
    const base = `Şimdi hedefimize ulaşıp ulaşamadığımızı kontrol etme zamanı. Metni üçüncü kez okuduğunda okuma hızın ${r.wpm} sözcük/dakika. Okuma hedefi olarak ${r.targetWPM} sözcük/dakika seçmiştin.`;
    if (r.wpm >= r.targetWPM) {
      return base + ' Tebrikler belirlemiş olduğun hedefe ulaştın. Ödülü hak ettin. Çalışma sonunda sana sunulan ödüllerden birini tercih edebilirsin.';
    }
    return base + ' Üzgünüm belirlemiş olduğun hedefe ulaşamadın. Ama pes etmek yok; bir sonraki çalışmamızda başarabileceğine inanıyorum. Daha dikkatli ve güzel okumaya çalışırsan başarabilirsin.';
  }, [result]);

  useEffect(() => { if (summaryText) speak(summaryText); }, [summaryText]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-3">3. Adım: Okuma hızı ve Performans geribildirimi</h2>
      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-lg text-gray-800">{summaryText}</p>
      </div>
    </div>
  );
}
