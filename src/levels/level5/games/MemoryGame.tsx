import { useState, useEffect } from 'react';
import { playSoundEffect } from '../../../lib/soundEffects';

interface Card {
  id: number;
  emoji: string;
  name: string;
}

interface MemoryGameProps {
  storyId: number;
  onComplete: () => void;
  onPointsEarned: (points: number) => void;
}

// Story bazlı kart eşleştirmeleri
const STORY_CARDS: Record<number, Card[]> = {
  1: [ // Karıncalar
    { id: 1, emoji: '🐜', name: 'Karınca' },
    { id: 2, emoji: '🍪', name: 'Kırıntı' },
    { id: 3, emoji: '🏠', name: 'Yuva' },
    { id: 4, emoji: '💪', name: 'Güçlü' },
    { id: 5, emoji: '👥', name: 'İşbirliği' },
    { id: 6, emoji: '📦', name: 'Yük' },
  ],
  2: [ // Telefon
    { id: 1, emoji: '📱', name: 'Telefon' },
    { id: 2, emoji: '📺', name: 'Ekran' },
    { id: 3, emoji: '💬', name: 'Mesaj' },
    { id: 4, emoji: '📸', name: 'Fotoğraf' },
    { id: 5, emoji: '🔋', name: 'Şarj' },
    { id: 6, emoji: '📲', name: 'Uygulama' },
  ],
  3: [ // Hurma
    { id: 1, emoji: '🌴', name: 'Hurma Ağacı' },
    { id: 2, emoji: '🥭', name: 'Meyve' },
    { id: 3, emoji: '🧺', name: 'Sepet' },
    { id: 4, emoji: '🍃', name: 'Yaprak' },
    { id: 5, emoji: '🌿', name: 'Dal' },
    { id: 6, emoji: '👨‍🌾', name: 'Çiftçi' },
  ],
  4: [ // Akdeniz
    { id: 1, emoji: '🌊', name: 'Deniz' },
    { id: 2, emoji: '🏖️', name: 'Sahil' },
    { id: 3, emoji: '☀️', name: 'Güneş' },
    { id: 4, emoji: '🏛️', name: 'Turizm' },
    { id: 5, emoji: '🌾', name: 'Tarım' },
    { id: 6, emoji: '🍊', name: 'Ürün' },
  ],
  5: [ // Deve
    { id: 1, emoji: '🐫', name: 'Deve' },
    { id: 2, emoji: '🏜️', name: 'Çöl' },
    { id: 3, emoji: '💧', name: 'Su' },
    { id: 4, emoji: '🏔️', name: 'Hörgüç' },
    { id: 5, emoji: '🚶', name: 'Kervan' },
    { id: 6, emoji: '📦', name: 'Yük' },
  ],
};

interface GameCard extends Card {
  uniqueId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export default function MemoryGame({ storyId, onComplete, onPointsEarned }: MemoryGameProps) {
  const [cards, setCards] = useState<GameCard[]>([]);
  const [flippedCards, setFlippedCards] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [dostMessage, setDostMessage] = useState('Eşleşen kartları bul! 🎴');
  const [canClick, setCanClick] = useState(true);

  // Kartları oluştur ve karıştır
  useEffect(() => {
    const storyCards = STORY_CARDS[storyId] || STORY_CARDS[1];
    
    // Her karttan 2 tane oluştur
    const duplicatedCards = storyCards.flatMap(card => [
      { ...card, uniqueId: `${card.id}-a`, isFlipped: false, isMatched: false },
      { ...card, uniqueId: `${card.id}-b`, isFlipped: false, isMatched: false },
    ]);

    // Karıştır
    const shuffled = duplicatedCards.sort(() => Math.random() - 0.5);
    setCards(shuffled);
  }, [storyId]);

  // Kart eşleştirme kontrolü
  useEffect(() => {
    if (flippedCards.length !== 2) return;

    setCanClick(false);
    const [firstId, secondId] = flippedCards;
    const firstCard = cards.find(c => c.uniqueId === firstId);
    const secondCard = cards.find(c => c.uniqueId === secondId);

    if (!firstCard || !secondCard) return;

    setMoves(prev => prev + 1);

    if (firstCard.id === secondCard.id) {
      // Eşleşme bulundu
      playSoundEffect('success');
      
      setCards(prev =>
        prev.map(card =>
          card.uniqueId === firstId || card.uniqueId === secondId
            ? { ...card, isMatched: true }
            : card
        )
      );

      setMatchedPairs(prev => prev + 1);

      const messages = [
        'Harika! Eşleşme buldun! 🎉',
        'Mükemmel! Devam et! ⭐',
        'Süpersin! Hafızan çok iyi! 🧠',
        'Bravo! Muhteşem bir hafıza! 👏',
      ];
      setDostMessage(messages[Math.floor(Math.random() * messages.length)]);

      setTimeout(() => {
        setFlippedCards([]);
        setCanClick(true);
      }, 600);

      // Oyun bitti mi?
      if (matchedPairs + 1 === cards.length / 2) {
        setTimeout(() => {
          setGameOver(true);
          setDostMessage('Tebrikler! Tüm eşleşmeleri buldun! 🏆');
          playSoundEffect('success');
          
          // Puan hesaplama: Az hamle = Daha çok puan
          const basePoints = 50;
          const moveBonus = Math.max(0, 24 - moves) * 2; // Minimum 12 hamle için bonus
          const earnedPoints = basePoints + moveBonus;
          
          onPointsEarned(earnedPoints);
          setTimeout(() => onComplete(), 2000);
        }, 500);
      }
    } else {
      // Eşleşme yok
      playSoundEffect('error');
      setDostMessage('Eşleşme yok! Tekrar dene! 🤔');

      setTimeout(() => {
        setCards(prev =>
          prev.map(card =>
            card.uniqueId === firstId || card.uniqueId === secondId
              ? { ...card, isFlipped: false }
              : card
          )
        );
        setFlippedCards([]);
        setCanClick(true);
      }, 1000);
    }
  }, [flippedCards, cards, matchedPairs, moves, onComplete, onPointsEarned]);

  const handleCardClick = (uniqueId: string) => {
    if (!canClick || gameOver) return;
    
    const card = cards.find(c => c.uniqueId === uniqueId);
    if (!card || card.isFlipped || card.isMatched || flippedCards.includes(uniqueId)) return;

    setCards(prev =>
      prev.map(c =>
        c.uniqueId === uniqueId ? { ...c, isFlipped: true } : c
      )
    );

    setFlippedCards(prev => [...prev, uniqueId]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-center">🎴 Hafıza Oyunu</h2>
        
        {/* Stats */}
        <div className="flex justify-around items-center bg-white/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{moves}</div>
            <div className="text-sm opacity-90">Hamle</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{matchedPairs}/{cards.length / 2}</div>
            <div className="text-sm opacity-90">Eşleşme</div>
          </div>
        </div>

        {/* DOST Message */}
        <div className="mt-4 bg-white/90 text-indigo-800 rounded-lg p-3 text-center font-semibold">
          🗣️ {dostMessage}
        </div>
      </div>

      {/* Game Board */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(card => (
          <button
            key={card.uniqueId}
            onClick={() => handleCardClick(card.uniqueId)}
            disabled={!canClick || card.isMatched || card.isFlipped}
            className={`aspect-square rounded-xl text-4xl sm:text-5xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg ${
              card.isMatched
                ? 'bg-green-400 text-white cursor-default opacity-80'
                : card.isFlipped
                ? 'bg-white text-gray-800 border-4 border-indigo-400'
                : 'bg-gradient-to-br from-indigo-400 to-purple-400 text-transparent hover:from-indigo-500 hover:to-purple-500'
            }`}
            style={{
              perspective: '1000px',
              transformStyle: 'preserve-3d',
            }}
          >
            <div className="flex flex-col items-center justify-center h-full">
              {card.isFlipped || card.isMatched ? (
                <>
                  <span className="mb-1">{card.emoji}</span>
                  <span className="text-xs sm:text-sm font-semibold">{card.name}</span>
                </>
              ) : (
                <span className="text-white text-6xl">?</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Instructions */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center">
        <p className="text-blue-800 font-medium">
          💡 <strong>Nasıl Oynanır:</strong> Kartlara tıklayarak eşleşen çiftleri bul. 
          En az hamleyle bitirmeye çalış!
        </p>
      </div>
    </div>
  );
}
