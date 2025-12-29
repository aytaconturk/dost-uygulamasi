import { useState, useEffect } from 'react';
import { playSoundEffect } from '../../../lib/soundEffects';

interface Position {
  row: number;
  col: number;
}

interface WordHuntProps {
  storyId: number;
  onComplete: () => void;
  onPointsEarned: (points: number) => void;
}

// Story bazlı kelimeler
const STORY_WORDS_HUNT: Record<number, string[]> = {
  1: ['KARINCA', 'KIRINTI', 'YUVA', 'ISBIRLIK', 'TASIMA', 'GUCLU', 'SIRA'],
  2: ['TELEFON', 'EKRAN', 'MESAJ', 'FOTOGRAF', 'SARJ', 'UYGULAMA', 'DOKUNMA'],
  3: ['HURMA', 'AGAC', 'MEYVE', 'TOPLAMA', 'DAL', 'YAPRAK', 'SEPET'],
  4: ['AKDENIZ', 'BOLGE', 'IKLIM', 'SAHIL', 'TURIZM', 'TARIM', 'URUN'],
  5: ['DEVE', 'COL', 'KUM', 'HORGUC', 'SU', 'KERVAN', 'YUK'],
};

const GRID_SIZE = 10;

export default function WordHunt({ storyId, onComplete, onPointsEarned }: WordHuntProps) {
  const [words] = useState<string[]>(() => {
    const storyWords = STORY_WORDS_HUNT[storyId] || STORY_WORDS_HUNT[1];
    return storyWords.slice(0, 7);
  });

  const [grid, setGrid] = useState<string[][]>([]);
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [foundWords, setFoundWords] = useState<Set<string>>(new Set());
  const [currentSelection, setCurrentSelection] = useState<Position[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 dakika
  const [gameOver, setGameOver] = useState(false);
  const [dostMessage, setDostMessage] = useState('Kelimeleri bul ve işaretle! 🔍');

  // Grid oluştur
  useEffect(() => {
    const newGrid: string[][] = Array(GRID_SIZE).fill(null).map(() => 
      Array(GRID_SIZE).fill('')
    );

    // Kelimeleri yerleştir
    words.forEach(word => {
      let placed = false;
      let attempts = 0;
      
      while (!placed && attempts < 100) {
        attempts++;
        const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        
        if (direction === 'horizontal' && col + word.length <= GRID_SIZE) {
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            if (newGrid[row][col + i] !== '' && newGrid[row][col + i] !== word[i]) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            for (let i = 0; i < word.length; i++) {
              newGrid[row][col + i] = word[i];
            }
            placed = true;
          }
        } else if (direction === 'vertical' && row + word.length <= GRID_SIZE) {
          let canPlace = true;
          for (let i = 0; i < word.length; i++) {
            if (newGrid[row + i][col] !== '' && newGrid[row + i][col] !== word[i]) {
              canPlace = false;
              break;
            }
          }
          
          if (canPlace) {
            for (let i = 0; i < word.length; i++) {
              newGrid[row + i][col] = word[i];
            }
            placed = true;
          }
        }
      }
    });

    // Boş hücreleri rastgele harflerle doldur
    const letters = 'ABCDEFGHIJKLMNOPRSTUVYZ';
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (newGrid[i][j] === '') {
          newGrid[i][j] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }

    setGrid(newGrid);
  }, [words]);

  // Timer
  useEffect(() => {
    if (gameOver || foundWords.size === words.length) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameOver(true);
          setDostMessage('Süre doldu! Yine de harika bir performans gösterdin! 🕐');
          playSoundEffect('error');
          setTimeout(() => {
            const earnedPoints = Math.max(10, foundWords.size * 6);
            onPointsEarned(earnedPoints);
            onComplete();
          }, 2000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, foundWords.size, words.length, onComplete, onPointsEarned]);

  const getCellKey = (row: number, col: number) => `${row}-${col}`;

  const handleMouseDown = (row: number, col: number) => {
    if (gameOver) return;
    setIsSelecting(true);
    setCurrentSelection([{ row, col }]);
  };

  const handleMouseEnter = (row: number, col: number) => {
    if (!isSelecting || gameOver) return;
    
    const lastPos = currentSelection[currentSelection.length - 1];
    if (!lastPos) return;

    // Sadece yatay veya dikey hareket
    if (row === lastPos.row || col === lastPos.col) {
      const exists = currentSelection.find(p => p.row === row && p.col === col);
      if (!exists) {
        setCurrentSelection([...currentSelection, { row, col }]);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isSelecting || gameOver) return;
    setIsSelecting(false);

    // Seçilen harfleri birleştir
    const selectedWord = currentSelection
      .map(pos => grid[pos.row]?.[pos.col] || '')
      .join('');

    // Kelime var mı kontrol et
    if (words.includes(selectedWord) && !foundWords.has(selectedWord)) {
      playSoundEffect('success');
      setFoundWords(prev => new Set([...prev, selectedWord]));
      
      // Seçilen hücreleri kaydet
      const newSelected = new Set(selectedCells);
      currentSelection.forEach(pos => {
        newSelected.add(getCellKey(pos.row, pos.col));
      });
      setSelectedCells(newSelected);

      const messages = [
        'Harika! Kelimeyi buldun! 🎉',
        'Mükemmel! Devam et! ⭐',
        'Süpersin! Çok iyi gidiyor! 🚀',
        'Bravo! Harika bir iş! 👏',
      ];
      setDostMessage(messages[Math.floor(Math.random() * messages.length)]);

      // Tüm kelimeler bulundu mu?
      if (foundWords.size + 1 === words.length) {
        setTimeout(() => {
          setGameOver(true);
          setDostMessage('Muhteşem! Tüm kelimeleri buldun! 🏆');
          playSoundEffect('success');
          const earnedPoints = 50 + Math.floor(timeLeft / 5);
          onPointsEarned(earnedPoints);
          setTimeout(() => onComplete(), 2000);
        }, 500);
      }
    } else if (selectedWord.length >= 3) {
      playSoundEffect('error');
      setDostMessage('Bu kelime listede yok. Devam et! 🔍');
    }

    setCurrentSelection([]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isCurrentlySelected = (row: number, col: number) => {
    return currentSelection.some(pos => pos.row === row && pos.col === col);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-teal-500 text-white rounded-xl p-6 mb-6 shadow-lg">
        <h2 className="text-3xl font-bold mb-4 text-center">🔍 Kelime Avcısı</h2>
        
        {/* Stats */}
        <div className="flex justify-around items-center bg-white/20 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{formatTime(timeLeft)}</div>
            <div className="text-sm opacity-90">Süre</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{foundWords.size}/{words.length}</div>
            <div className="text-sm opacity-90">Bulunan</div>
          </div>
        </div>

        {/* DOST Message */}
        <div className="mt-4 bg-white/90 text-blue-800 rounded-lg p-3 text-center font-semibold">
          🗣️ {dostMessage}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Grid */}
        <div className="lg:col-span-3">
          <div 
            className="inline-block bg-white rounded-xl p-4 shadow-lg"
            onMouseLeave={() => {
              if (isSelecting) handleMouseUp();
            }}
          >
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}>
              {grid.map((row, rowIndex) =>
                row.map((letter, colIndex) => {
                  const key = getCellKey(rowIndex, colIndex);
                  const isFound = selectedCells.has(key);
                  const isCurrent = isCurrentlySelected(rowIndex, colIndex);
                  
                  return (
                    <div
                      key={key}
                      className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center font-bold text-sm sm:text-lg rounded cursor-pointer transition-all select-none ${
                        isFound
                          ? 'bg-green-400 text-white'
                          : isCurrent
                          ? 'bg-yellow-400 text-gray-800'
                          : 'bg-gray-100 text-gray-700 hover:bg-blue-100'
                      }`}
                      onMouseDown={() => handleMouseDown(rowIndex, colIndex)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, colIndex)}
                      onMouseUp={handleMouseUp}
                    >
                      {letter}
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-3 text-center">
            💡 İpucu: Fare ile sürükleyerek kelimeleri seç
          </p>
        </div>

        {/* Word List */}
        <div className="bg-white rounded-xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-gray-700 mb-4">Kelime Listesi</h3>
          <div className="space-y-2">
            {words.map(word => (
              <div
                key={word}
                className={`p-3 rounded-lg font-semibold transition-all ${
                  foundWords.has(word)
                    ? 'bg-green-100 text-green-700 line-through'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {foundWords.has(word) ? '✓ ' : '• '}{word}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
