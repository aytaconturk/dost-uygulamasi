import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useStepContext } from '../../contexts/StepContext';
import { awardPoints } from '../../lib/supabase';
import type { RootState } from '../../store/store';
import PointsAnimation from '../../components/PointsAnimation';
import WordMatch from './games/WordMatch';
import WordHunt from './games/WordHunt';
import MemoryGame from './games/MemoryGame';

type GameType = 'select' | 'wordmatch' | 'wordhunt' | 'memory' | 'completed';

export default function L5Step3() {
  const navigate = useNavigate();
  const student = useSelector((state: RootState) => state.user.student);
  const { onStepCompleted, storyId, sessionId } = useStepContext();
  
  const [currentGame, setCurrentGame] = useState<GameType>('select');
  const [completedGames, setCompletedGames] = useState<Set<string>>(new Set());
  const [totalEarnedPoints, setTotalEarnedPoints] = useState(0);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  const games = [
    {
      id: 'wordmatch',
      name: 'Kelime Eşleştirme',
      icon: '🎯',
      description: 'Kelimeleri tanımlarıyla eşleştir',
      color: 'from-purple-500 to-pink-500',
    },
    {
      id: 'wordhunt',
      name: 'Kelime Avcısı',
      icon: '🔍',
      description: 'Harf matrisinde kelimeleri bul',
      color: 'from-blue-500 to-teal-500',
    },
    {
      id: 'memory',
      name: 'Hafıza Oyunu',
      icon: '🎴',
      description: 'Eşleşen kartları bul',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  const handleGameComplete = () => {
    setCompletedGames(prev => new Set([...prev, currentGame]));
    
    // Tüm oyunlar tamamlandı mı?
    if (completedGames.size + 1 === games.length) {
      setCurrentGame('completed');
      
      // Step'i tamamla
      if (onStepCompleted) {
        onStepCompleted({
          level: 5,
          completed: true,
          storyCompleted: true,
          gamesCompleted: games.length,
          totalPoints: totalEarnedPoints,
        });
      }
    } else {
      // Oyun seçim ekranına dön
      setCurrentGame('select');
    }
  };

  const handlePointsEarned = async (points: number) => {
    setEarnedPoints(points);
    setShowPointsAnimation(true);
    setTotalEarnedPoints(prev => prev + points);

    // Puanları kaydet
    if (student?.id && sessionId) {
      try {
        await awardPoints(
          student.id,
          points,
          storyId || 5,
          5,
          sessionId,
          `level5_step3_${currentGame}_game`
        );
      } catch (err) {
        console.error('Error awarding game points:', err);
      }
    }

    setTimeout(() => setShowPointsAnimation(false), 2000);
  };

  const handleStartGame = (gameId: string) => {
    setCurrentGame(gameId as GameType);
  };

  // Oyun seçim ekranı
  if (currentGame === 'select') {
    return (
      <div className="w-full max-w-5xl mx-auto p-6">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl p-8 mb-8 shadow-xl">
          <h2 className="text-4xl font-bold mb-4 text-center">🎮 Mini Oyunlar</h2>
          <p className="text-xl text-center opacity-90 mb-4">
            Öğrendiklerini pekiştirmek için eğlenceli oyunlar oyna!
          </p>
          <div className="bg-white/20 rounded-lg p-4 text-center">
            <div className="text-3xl font-bold">{completedGames.size}/{games.length}</div>
            <div className="text-sm opacity-90">Tamamlanan Oyun</div>
            {totalEarnedPoints > 0 && (
              <div className="mt-2">
                <div className="text-2xl font-bold">+{totalEarnedPoints} 🎁</div>
                <div className="text-sm opacity-90">Kazanılan Puan</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {games.map(game => {
            const isCompleted = completedGames.has(game.id);
            
            return (
              <div
                key={game.id}
                className={`bg-white rounded-xl shadow-lg overflow-hidden transform transition-all hover:scale-105 ${
                  isCompleted ? 'opacity-75' : ''
                }`}
              >
                <div className={`bg-gradient-to-br ${game.color} p-6 text-white text-center`}>
                  <div className="text-6xl mb-3">{game.icon}</div>
                  <h3 className="text-2xl font-bold">{game.name}</h3>
                </div>
                
                <div className="p-6">
                  <p className="text-gray-600 mb-4 text-center">{game.description}</p>
                  
                  {isCompleted ? (
                    <div className="bg-green-100 text-green-700 font-bold py-3 rounded-lg text-center">
                      ✓ Tamamlandı
                    </div>
                  ) : (
                    <button
                      onClick={() => handleStartGame(game.id)}
                      className={`w-full bg-gradient-to-r ${game.color} text-white font-bold py-3 rounded-lg hover:shadow-xl transition-all`}
                    >
                      Oyna
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {completedGames.size === games.length && (
          <div className="mt-8 text-center">
            <div className="bg-gradient-to-r from-green-400 to-blue-500 text-white rounded-xl p-8 shadow-xl">
              <h3 className="text-3xl font-bold mb-4">🎉 Tebrikler!</h3>
              <p className="text-xl mb-6">Tüm oyunları tamamladın!</p>
              <button
                onClick={() => navigate(`/story-completion/${storyId}`)}
                className="bg-white text-purple-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all"
              >
                Devam Et →
              </button>
            </div>
          </div>
        )}

        {showPointsAnimation && (
          <PointsAnimation points={earnedPoints} show={showPointsAnimation} />
        )}
      </div>
    );
  }

  // Oyun ekranları
  if (currentGame === 'wordmatch') {
    return <WordMatch storyId={storyId || 3} onComplete={handleGameComplete} onPointsEarned={handlePointsEarned} />;
  }

  if (currentGame === 'wordhunt') {
    return <WordHunt storyId={storyId || 3} onComplete={handleGameComplete} onPointsEarned={handlePointsEarned} />;
  }

  if (currentGame === 'memory') {
    return <MemoryGame storyId={storyId || 3} onComplete={handleGameComplete} onPointsEarned={handlePointsEarned} />;
  }

  // Tamamlandı ekranı (eski kod)
  return (
    <div className="w-full max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-purple-800 mb-3">3. Adım: Çalışmayı sonlandırma</h2>
      <div className="bg-white rounded-xl shadow p-6">
        <p className="text-lg text-gray-800">Çalışma tamamlandı. Ana sayfaya dönerek yeni oturumu başlatabilirsin.</p>
        <div className="mt-4">
          <button
            onClick={() => navigate('/')}
            className="bg-purple-500 hover:bg-purple-600 text-white px-6 py-3 rounded-lg font-bold"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    </div>
  );
}
