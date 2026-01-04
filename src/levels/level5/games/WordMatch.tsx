import { useState, useEffect } from 'react';
import { playSoundEffect } from '../../../lib/soundEffects';

interface WordPair {
  word: string;
  definition: string;
}

interface WordMatchProps {
  storyId: number;
  onComplete: () => void;
  onPointsEarned: (points: number) => void;
}

// Story bazlı kelime-tanım eşleştirmeleri
const STORY_WORDS: Record<number, WordPair[]> = {
  1: [ // Kırıntıların Kahramanları
    { word: 'Karınca', definition: 'Küçük ama çok çalışkan böcek' },
    { word: 'Kırıntı', definition: 'Yemekten düşen küçük parçalar' },
    { word: 'Yuvarlak', definition: 'Daire şeklinde olan' },
    { word: 'İşbirliği', definition: 'Birlikte çalışma' },
    { word: 'Taşımak', definition: 'Bir yerden başka yere götürmek' },
    { word: 'Güçlü', definition: 'Kuvvetli, dayanıklı' },
    { word: 'Sıra', definition: 'Arka arkaya dizilme' },
    { word: 'Yorulmak', definition: 'Çok çalışınca halsiz kalmak' },
  ],
  2: [ // Akıllı Kutu
    { word: 'Telefon', definition: 'Konuşmak için kullanılan cihaz' },
    { word: 'Ekran', definition: 'Görüntü çıkan yer' },
    { word: 'Tuşlamak', definition: 'Parmakla basmak' },
    { word: 'Mesaj', definition: 'Birisine yazılan yazı' },
    { word: 'Fotoğraf', definition: 'Çekilen resim' },
    { word: 'Şarj', definition: 'Bataryayı doldurmak' },
    { word: 'Uygulama', definition: 'Telefonda kullanılan program' },
    { word: 'Dokunmatik', definition: 'Parmakla kontrol edilen' },
  ],
  3: [ // Hurma Ağacı
    { word: 'Hurma', definition: 'Tatlı bir meyve' },
    { word: 'Ağaç', definition: 'Gövdesi ve dalları olan bitki' },
    { word: 'Meyve', definition: 'Ağaçtan toplanan yenilebilir şey' },
    { word: 'Toplama', definition: 'Bir araya getirme' },
    { word: 'Dal', definition: 'Ağacın kolları' },
    { word: 'Yaprak', definition: 'Ağacın yeşil kısımları' },
    { word: 'Tırmanmak', definition: 'Yukarı çıkmak' },
    { word: 'Sepet', definition: 'İçine bir şeyler konan hasır kap' },
  ],
  4: [ // Akdeniz
    { word: 'Akdeniz', definition: 'Türkiye\'nin güneyindeki deniz' },
    { word: 'Bölge', definition: 'Belirli bir alan' },
    { word: 'İklim', definition: 'Bir yerin hava durumu' },
    { word: 'Sahil', definition: 'Deniz kenarı' },
    { word: 'Turizm', definition: 'Tatil ve seyahat' },
    { word: 'Tarım', definition: 'Bitki yetiştirme' },
    { word: 'Ürün', definition: 'Üretilen şey' },
    { word: 'Sıcak', definition: 'Yüksek ısı' },
  ],
  5: [ // Çöl Gemisi
    { word: 'Deve', definition: 'Çölde yaşayan büyük hayvan' },
    { word: 'Çöl', definition: 'Kurak ve kumluk alan' },
    { word: 'Kum', definition: 'Çok ince toprak taneleri' },
    { word: 'Hörgüç', definition: 'Devenin sırtındaki yumru' },
    { word: 'Su', definition: 'İçilen sıvı' },
    { word: 'Kervan', definition: 'Deve kafilesi' },
    { word: 'Yük', definition: 'Taşınan ağır eşya' },
    { word: 'Uzun', definition: 'Kısa olmayan' },
  ],
};

export default function WordMatch({ storyId, onComplete, onPointsEarned }: WordMatchProps) {
  const [words] = useState<WordPair[]>(() => {
    const storyWords = STORY_WORDS[storyId] || STORY_WORDS[1];
    // Rastgele 8 kelime seç
    return [...storyWords].sort(() => Math.random() - 0.5).slice(0, 8);
  });

  const [shuffledWords] = useState<string[]>(() => 
    [...words.map(w => w.word)].sort(() => Math.random() - 0.5)
  );
  
  const [shuffledDefinitions] = useState<string[]>(() => 
    [...words.map(w => w.definition)].sort(() => Math.random() - 0.5)
  );

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120); // 2 dakika
  const [gameOver, setGameOver] = useState(false);
  const [dostMessage, setDostMessage] = useState('Kelimeleri tanımlarıyla eşleştir! 🎯');

  const maxWrongAttempts = 3;

  // Timer
  useEffect(() => {
    if (gameOver || matchedPairs.size === words.length) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setDostMessage('Süre doldu! Ama yine de harika bir çaba gösterdin! 🕐');
          playSoundEffect('error');
          setTimeout(() => {
            const earnedPoints = Math.max(10, matchedPairs.size * 3);
            onPointsEarned(earnedPoints);
            onComplete();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, matchedPairs.size, words.length, onComplete, onPointsEarned]);

  // Eşleştirme kontrolü
  useEffect(() => {
    if (!selectedWord || !selectedDefinition) return;

    const matchingPair = words.find(
      pair => pair.word === selectedWord && pair.definition === selectedDefinition
    );

    if (matchingPair) {
      // Doğru eşleştirme
      playSoundEffect('success');
      setMatchedPairs(prev => new Set([...prev, selectedWord]));
      
      const messages = [
        'Mükemmel! Çok iyi eşleştirdin! 🎉',
        'Harika! Doğru cevap! ⭐',
        'Süpersin! Devam et! 🚀',
        'Bravo! Çok başarılısın! 👏',
      ];
      setDostMessage(messages[Math.floor(Math.random() * messages.length)]);
      
      setSelectedWord(null);
      setSelectedDefinition(null);

      // Tüm eşleştirmeler tamamlandı mı?
      if (matchedPairs.size + 1 === words.length) {
        setTimeout(() => {
          setGameOver(true);
          setDostMessage('Tebrikler! Tüm kelimeleri doğru eşleştirdin! 🏆');
          playSoundEffect('success');
          const earnedPoints = 50 - (wrongAttempts * 5) + Math.floor(timeLeft / 10);
          onPointsEarned(earnedPoints);
          setTimeout(() => onComplete(), 2000);
        }, 500);
      }
    } else {
      // Yanlış eşleştirme
      playSoundEffect('wrong');
      setWrongAttempts(prev => prev + 1);
      
      if (wrongAttempts + 1 >= maxWrongAttempts) {
        setGameOver(true);
        setDostMessage('3 hata hakkın bitti! Ama sen yine de harikasın! 💪');
        setTimeout(() => {
          const earnedPoints = Math.max(10, matchedPairs.size * 3);
          onPointsEarned(earnedPoints);
          onComplete();
        }, 2000);
      } else {
        const messages = [
          'Olmadı! Tekrar dene! 🤔',
          'Bu eşleşme doğru değil. Bir daha bak! 👀',
          'Yanlış eşleştirme. Başka bir dene! 💭',
        ];
        setDostMessage(messages[Math.floor(Math.random() * messages.length)]);
      }
      
      setTimeout(() => {
        setSelectedWord(null);
        setSelectedDefinition(null);
      }, 800);
    }
  }, [selectedWord, selectedDefinition, words, matchedPairs, wrongAttempts, timeLeft, onComplete, onPointsEarned]);

  const handleWordClick = (word: string) => {
    if (gameOver || matchedPairs.has(word)) return;
    setSelectedWord(word === selectedWord ? null : word);
  };

  const handleDefinitionClick = (definition: string) => {
    if (gameOver || matchedPairs.has(words.find(w => w.definition === definition)?.word || '')) return;
    setSelectedDefinition(definition === selectedDefinition ? null : definition);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-center">🎯 Kelime Eşleştirme</h2>
        
        {/* Stats */}
        <div className="flex justify-around items-center bg-white/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
            <div className="text-sm opacity-90">Süre</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{matchedPairs.size}/{words.length}</div>
            <div className="text-sm opacity-90">Eşleşme</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{maxWrongAttempts - wrongAttempts}</div>
            <div className="text-sm opacity-90">Hak</div>
          </div>
        </div>

        {/* DOST Message */}
        <div className="mt-4 bg-white/90 text-purple-800 rounded-lg p-3 text-center font-semibold">
          🗣️ {dostMessage}
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Kelimeler */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Kelimeler</h3>
          {shuffledWords.map((word) => {
            const isMatched = matchedPairs.has(word);
            const isSelected = selectedWord === word;
            
            return (
              <button
                key={word}
                onClick={() => handleWordClick(word)}
                disabled={isMatched || gameOver}
                className={`w-full p-4 rounded-lg font-bold text-lg transition-all transform hover:scale-105 ${
                  isMatched
                    ? 'bg-green-200 text-green-800 cursor-default opacity-60'
                    : isSelected
                    ? 'bg-purple-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-800 border-2 border-purple-300 hover:border-purple-500'
                }`}
              >
                {isMatched ? '✓ ' : ''}{word}
              </button>
            );
          })}
        </div>

        {/* Tanımlar */}
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-gray-700 mb-4 text-center">Tanımlar</h3>
          {shuffledDefinitions.map((definition) => {
            const matchedWord = words.find(w => w.definition === definition)?.word;
            const isMatched = matchedWord ? matchedPairs.has(matchedWord) : false;
            const isSelected = selectedDefinition === definition;
            
            return (
              <button
                key={definition}
                onClick={() => handleDefinitionClick(definition)}
                disabled={isMatched || gameOver}
                className={`w-full p-4 rounded-lg font-medium text-base transition-all transform hover:scale-105 text-left ${
                  isMatched
                    ? 'bg-green-200 text-green-800 cursor-default opacity-60'
                    : isSelected
                    ? 'bg-pink-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 border-2 border-pink-300 hover:border-pink-500'
                }`}
              >
                {isMatched ? '✓ ' : ''}{definition}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
