import { useEffect, useMemo } from 'react';

export default function L5Step3() {
  useEffect(() => {
    const text = 'Okuma becerilerini geliştirmek için çalışma boyunca metni gözden geçirme, tahminde bulunma, tekrarlı okuma, model okuma, seçenek sunma ve hedef belirleme, performans geribildirimi, şematik düzenleyicilerden yararlanma, beyin fırtınası yapma ve yorumda bulunma, özetleme, okuduğunu anlama sorularını cevaplama ve hedefe bağlı ödül gibi stratejiler kullandık tebrik ederim. Güzel bir çalışmaydı. Bir sonraki oturumun kilidini açmayı başardın. Bir sonraki oturumda görüşmek üzere.';
    if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(text); u.lang='tr-TR'; u.rate=.95; u.pitch=1; window.speechSynthesis.speak(u); }
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-3">3. Adım: Çalışmayı sonlandırma</h2>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-lg text-gray-800">Çalışma tamamlandı. Ana sayfaya dönerek yeni oturumu başlatabilirsin.</p>
        <div className="mt-4">
          <a href="/" className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold">Ana Sayfaya Dön</a>
        </div>
      </div>
    </div>
  );
}
