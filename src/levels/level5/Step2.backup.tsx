import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { getStepCompletionData, awardPoints, logStudentAction } from '../../lib/supabase';
import { useStepContext } from '../../contexts/StepContext';
import type { RootState } from '../../store/store';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { playSoundEffect } from '../../lib/soundEffects';
import PointsAnimation from '../../components/PointsAnimation';
import { Trophy, Image, Music, BookOpen, Award, Sparkles, Download, CheckCircle } from 'lucide-react';

type Phase = 'loading' | 'result' | 'reward-select' | 'reward-input' | 'reward-generating' | 'reward-ready';

// Ödül seçenekleri
const REWARD_OPTIONS = [
  {
    id: 'image',
    title: 'Görsel Oluştur',
    description: 'İstediğin bir görsel oluşturabilirim',
    icon: Image,
    emoji: '🖼️',
    color: 'from-pink-500 to-rose-500',
    placeholder: 'Örn: Uzayda uçan bir kedi, gökkuşağı ve bulutlar...'
  },
  {
    id: 'song',
    title: 'Şarkı Yaz',
    description: 'İstediğin konuda sana şarkı yazabilirim',
    icon: Music,
    emoji: '🎵',
    color: 'from-purple-500 to-indigo-500',
    placeholder: 'Örn: Arkadaşlık hakkında neşeli bir şarkı...'
  },
  {
    id: 'story',
    title: 'Hikaye Oluştur',
    description: 'İstediğin karakterlerle hikaye yazabilirim',
    icon: BookOpen,
    emoji: '📖',
    color: 'from-blue-500 to-cyan-500',
    placeholder: 'Örn: Cesur bir tavşan ve büyülü orman macerası...'
  },
  {
    id: 'badge',
    title: 'Rozet / Madalya',
    description: 'Dijital okuma rozeti veya madalya yapabilirim',
    icon: Award,
    emoji: '🏅',
    color: 'from-yellow-500 to-orange-500',
    placeholder: 'Örn: Okuma Kahramanı, Süper Okuyucu, Kitap Kurdu...'
  },
  {
    id: 'sticker',
    title: 'Sticker',
    description: 'İstediğin bir sticker görseli yapabilirim',
    icon: Sparkles,
    emoji: '✨',
    color: 'from-green-500 to-teal-500',
    placeholder: 'Örn: Gülen güneş, sevimli köpek, yıldızlı kalp...'
  }
];

export default function L5Step2() {
  const student = useSelector((state: RootState) => state.user.student);
  const { sessionId, storyId, onStepCompleted } = useStepContext();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [phase, setPhase] = useState<Phase>('loading');
  const [l3Result, setL3Result] = useState<{ wpm: number; targetWPM: number } | null>(null);
  const [reachedGoal, setReachedGoal] = useState(false);
  const [selectedReward, setSelectedReward] = useState<string | null>(null);
  const [rewardInput, setRewardInput] = useState('');
  const [generatedReward, setGeneratedReward] = useState<string | null>(null);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  // Load Level 3 result
  useEffect(() => {
    if (!student) return;

    const loadL3Result = async () => {
      try {
        const completionData = await getStepCompletionData(student.id, storyId, 3, 2, sessionId);
        if (completionData && completionData.wpm !== undefined) {
          const result = completionData as { wpm: number; targetWPM: number };
          setL3Result(result);
          setReachedGoal(result.wpm >= result.targetWPM);
        } else {
          // Fallback - hedefe ulaştı varsay
          setReachedGoal(true);
        }
        setPhase('result');
      } catch (err) {
        console.error('Error loading Level 3 result:', err);
        setReachedGoal(true);
        setPhase('result');
      }
    };

    loadL3Result();
  }, [student?.id, storyId, sessionId]);

  // Sonuç gösterildiğinde ses çal
  useEffect(() => {
    if (phase === 'result') {
      setTimeout(() => {
        playSoundEffect(reachedGoal ? 'success' : 'info');
      }, 500);
    }
  }, [phase, reachedGoal]);

  // Ödül seçimi
  const handleRewardSelect = (rewardId: string) => {
    setSelectedReward(rewardId);
    setPhase('reward-input');
  };

  // Ödül oluştur
  const handleGenerateReward = async () => {
    if (!rewardInput.trim()) return;
    
    setPhase('reward-generating');

    // Log the reward request
    if (student && sessionId && storyId) {
      await logStudentAction(
        sessionId,
        student.id,
        'reward_requested',
        storyId,
        5,
        2,
        { rewardType: selectedReward, rewardInput }
      );
    }

    // Simüle et - gerçek AI entegrasyonu için API çağrısı yapılabilir
    setTimeout(async () => {
      // Rozet/sticker için canvas ile görsel oluştur
      if (selectedReward === 'badge' || selectedReward === 'sticker') {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Gradient background
          const grad = ctx.createRadialGradient(200, 200, 50, 200, 200, 200);
          if (selectedReward === 'badge') {
            grad.addColorStop(0, '#FFD700');
            grad.addColorStop(1, '#FFA500');
          } else {
            grad.addColorStop(0, '#FF69B4');
            grad.addColorStop(1, '#9370DB');
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(200, 200, 180, 0, Math.PI * 2);
          ctx.fill();
          
          // Border
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 8;
          ctx.stroke();
          
          // Text
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 28px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          const words = rewardInput.split(' ');
          const lines: string[] = [];
          let currentLine = '';
          words.forEach(word => {
            if ((currentLine + ' ' + word).length > 15) {
              lines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = currentLine ? currentLine + ' ' + word : word;
            }
          });
          if (currentLine) lines.push(currentLine);
          
          const lineHeight = 35;
          const startY = 200 - ((lines.length - 1) * lineHeight) / 2;
          lines.forEach((line, i) => {
            ctx.fillText(line, 200, startY + i * lineHeight);
          });
          
          // Star
          ctx.font = 'bold 60px Arial';
          ctx.fillText('⭐', 200, 80);
          
          setGeneratedReward(canvas.toDataURL('image/png'));
        }
      } else if (selectedReward === 'song') {
        // Şarkı sözleri oluştur
        setGeneratedReward(`🎵 "${rewardInput}" Şarkısı 🎵\n\n` +
          `(Verse 1)\n` +
          `Bugün çok güzel bir gün,\n` +
          `${rewardInput} için yazdım bu tün!\n` +
          `Okumayı çok seviyorum,\n` +
          `Her kitapla büyüyorum!\n\n` +
          `(Nakarat)\n` +
          `Oku, oku, oku!\n` +
          `Hayaller kurarak oku!\n` +
          `Her sayfa bir macera,\n` +
          `Gel beraber okumaya! 🎶`);
      } else if (selectedReward === 'story') {
        // Kısa hikaye oluştur
        setGeneratedReward(`📖 "${rewardInput}" Hikayesi 📖\n\n` +
          `Bir varmış bir yokmuş, ${rewardInput}.\n\n` +
          `Günlerden bir gün, küçük kahramanımız büyük bir maceraya atıldı. ` +
          `Yolda birçok zorlukla karşılaştı ama asla pes etmedi. ` +
          `Çünkü o, tıpkı senin gibi azimli ve cesur biriydi!\n\n` +
          `Sonunda hedefine ulaştı ve herkes onu alkışladı. ` +
          `"Başarmak için sadece denemeye devam etmek yeterli!" dedi.\n\n` +
          `Ve sonsuza dek mutlu yaşadılar. 🌟\n\n` +
          `SON`);
      } else if (selectedReward === 'image') {
        // Basit bir placeholder görsel
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Gradient background
          const grad = ctx.createLinearGradient(0, 0, 400, 400);
          grad.addColorStop(0, '#87CEEB');
          grad.addColorStop(1, '#98FB98');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, 400, 400);
          
          // Text
          ctx.fillStyle = '#333';
          ctx.font = 'bold 24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('🎨 ' + rewardInput.slice(0, 30), 200, 200);
          ctx.font = '16px Arial';
          ctx.fillText('(AI görsel oluşturuluyor...)', 200, 240);
          
          setGeneratedReward(canvas.toDataURL('image/png'));
        }
      }

      // Puan ver
      if (student && storyId) {
        const { error } = await awardPoints(
          student.id,
          storyId,
          25,
          `Seviye 5 - Ödül oluşturuldu: ${selectedReward}`
        );
        if (!error) {
          setEarnedPoints(25);
          setShowPointsAnimation(true);
          setTimeout(() => setShowPointsAnimation(false), 2000);
          window.dispatchEvent(new Event('progressUpdated'));
        }
      }

      setPhase('reward-ready');
      playSoundEffect('success');

      // Step completion
      if (onStepCompleted) {
        await onStepCompleted({
          reachedGoal,
          rewardType: selectedReward,
          rewardInput,
          wpm: l3Result?.wpm,
          targetWPM: l3Result?.targetWPM
        });
      }
    }, 2000);
  };

  // İndir
  const handleDownload = () => {
    if (!generatedReward) return;
    
    if (generatedReward.startsWith('data:image')) {
      const link = document.createElement('a');
      link.download = `odul-${selectedReward}.png`;
      link.href = generatedReward;
      link.click();
    } else {
      // Text için
      const blob = new Blob([generatedReward], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `odul-${selectedReward}.txt`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  // Loading
  if (phase === 'loading') {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Sonuçlar yükleniyor...</p>
      </div>
    );
  }

  // Sonuç gösterimi
  if (phase === 'result') {
    return (
      <div className="w-full max-w-3xl mx-auto">
        <audio ref={audioRef} preload="auto" />
        <PointsAnimation show={showPointsAnimation} points={earnedPoints} />
        
        <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Trophy className="w-7 h-7" />
          2. Adım: Hedefe Bağlı Ödül
        </h2>

        <div className="bg-white rounded-xl shadow-lg p-6">
          {/* Okuma Hızı Sonucu */}
          <div className={`text-center p-6 rounded-xl mb-6 ${
            reachedGoal 
              ? 'bg-gradient-to-r from-green-400 to-green-600' 
              : 'bg-gradient-to-r from-orange-400 to-orange-600'
          } text-white`}>
            <div className="text-6xl mb-4">{reachedGoal ? '🏆' : '💪'}</div>
            <h3 className="text-2xl font-bold mb-2">
              {reachedGoal ? 'Tebrikler! Hedefe Ulaştın!' : 'Bu Sefer Olmadı, Ama...'}
            </h3>
            
            {l3Result && (
              <div className="mt-4 bg-white/20 rounded-lg p-4 inline-block">
                <p className="text-lg">
                  Okuma Hızın: <span className="font-bold text-2xl">{l3Result.wpm}</span> kelime/dk
                </p>
                <p className="text-sm opacity-90">
                  (Hedef: {l3Result.targetWPM} kelime/dk)
                </p>
              </div>
            )}
          </div>

          {/* DOST Mesajı */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 mb-6">
            <p className="text-gray-800 text-lg leading-relaxed">
              {reachedGoal ? (
                <>
                  🎉 <strong>Hedefine ulaşarak ödülü hak ettin!</strong> Şimdi ödül için sana bazı seçenekler sunacağım. 
                  İstediğin bir görsel oluşturabilirim, şarkı yazabilirim, hikaye oluşturabilirim, 
                  dijital rozet veya madalya yapabilirim, ya da sticker görseli hazırlayabilirim. 
                  Hangisini istediğini seç!
                </>
              ) : (
                <>
                  💪 <strong>Bu sefer hedefe ulaşamadın ama üzülme!</strong> Pratik yaptıkça daha da iyileşeceksin. 
                  Bir sonraki oturumda hedefe ulaşacağına eminim! 
                  Yine de seni motive etmek için küçük bir ödül hazırlayalım. Hangisini istersin?
                </>
              )}
            </p>
          </div>

          {/* Devam Butonu */}
          <button
            onClick={() => setPhase('reward-select')}
            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg rounded-xl hover:shadow-lg transition-all"
          >
            Ödül Seçeneklerini Gör →
          </button>
        </div>
      </div>
    );
  }

  // Ödül seçimi
  if (phase === 'reward-select') {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <PointsAnimation show={showPointsAnimation} points={earnedPoints} />
        
        <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Trophy className="w-7 h-7" />
          2. Adım: Ödülünü Seç!
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REWARD_OPTIONS.map((reward) => {
            const Icon = reward.icon;
            return (
              <button
                key={reward.id}
                onClick={() => handleRewardSelect(reward.id)}
                className={`
                  p-6 rounded-2xl text-white shadow-xl
                  bg-gradient-to-br ${reward.color}
                  transform hover:scale-105 hover:shadow-2xl
                  transition-all duration-300
                  flex flex-col items-center gap-3
                  border-4 border-white/30
                `}
              >
                <span className="text-5xl">{reward.emoji}</span>
                <Icon className="w-8 h-8 opacity-80" />
                <h3 className="text-xl font-bold">{reward.title}</h3>
                <p className="text-sm opacity-90 text-center">{reward.description}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Ödül detay girişi
  if (phase === 'reward-input') {
    const selectedOption = REWARD_OPTIONS.find(r => r.id === selectedReward);
    
    return (
      <div className="w-full max-w-3xl mx-auto">
        <PointsAnimation show={showPointsAnimation} points={earnedPoints} />
        
        <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <Trophy className="w-7 h-7" />
          2. Adım: {selectedOption?.title}
        </h2>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <span className="text-6xl">{selectedOption?.emoji}</span>
            <h3 className="text-xl font-bold text-gray-800 mt-2">{selectedOption?.title}</h3>
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-2">
              Ne istediğini yaz:
            </label>
            <textarea
              value={rewardInput}
              onChange={(e) => setRewardInput(e.target.value)}
              placeholder={selectedOption?.placeholder}
              className="w-full p-4 border-2 border-purple-300 rounded-xl focus:border-purple-500 focus:outline-none min-h-[120px] text-lg"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => {
                setPhase('reward-select');
                setSelectedReward(null);
                setRewardInput('');
              }}
              className="flex-1 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-all"
            >
              ← Geri
            </button>
            <button
              onClick={handleGenerateReward}
              disabled={!rewardInput.trim()}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              Oluştur ✨
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ödül oluşturuluyor
  if (phase === 'reward-generating') {
    return (
      <div className="w-full max-w-3xl mx-auto text-center py-12">
        <PointsAnimation show={showPointsAnimation} points={earnedPoints} />
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="animate-bounce text-6xl mb-4">✨</div>
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <h3 className="text-2xl font-bold text-purple-800 mb-2">Ödülün Hazırlanıyor...</h3>
          <p className="text-gray-600">DOST senin için özel bir ödül oluşturuyor!</p>
        </div>
      </div>
    );
  }

  // Ödül hazır
  if (phase === 'reward-ready') {
    const selectedOption = REWARD_OPTIONS.find(r => r.id === selectedReward);
    const isImage = generatedReward?.startsWith('data:image');
    
    return (
      <div className="w-full max-w-3xl mx-auto">
        <PointsAnimation show={showPointsAnimation} points={earnedPoints} />
        
        <h2 className="text-2xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <CheckCircle className="w-7 h-7 text-green-500" />
          Ödülün Hazır!
        </h2>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-6">
            <span className="text-6xl">{selectedOption?.emoji}</span>
            <h3 className="text-xl font-bold text-gray-800 mt-2">{selectedOption?.title}</h3>
          </div>

          {/* Ödül içeriği */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            {isImage ? (
              <img 
                src={generatedReward!} 
                alt="Ödül" 
                className="max-w-xs mx-auto rounded-xl shadow-lg"
              />
            ) : (
              <pre className="whitespace-pre-wrap text-gray-800 font-sans text-lg leading-relaxed">
                {generatedReward}
              </pre>
            )}
          </div>

          {/* İndir butonu */}
          <button
            onClick={handleDownload}
            className="w-full py-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 mb-4"
          >
            <Download className="w-5 h-5" />
            İndir
          </button>

          <p className="text-center text-gray-500 text-sm">
            Ödülün hazır! Sonraki adıma geçerek çalışmayı tamamlayabilirsin.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
