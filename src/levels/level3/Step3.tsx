import { useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import type { RootState } from '../../store/store';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { useBadges } from '../../hooks/useBadges';
import BadgeAnimation from '../../components/BadgeAnimation';

export default function L3Step3() {
  const [searchParams] = useSearchParams();
  const step2Analysis = useSelector((state: RootState) => state.level3.step2Analysis);
  const student = useSelector((state: RootState) => state.user.student);
  const navigate = useNavigate();
  const { onStepCompleted, sessionId } = useStepContext();
  const storyId = searchParams.get('storyId') || '3';
  const storyIdNum = parseInt(storyId);
  const { checkForNewBadges, newBadges, clearNewBadges } = useBadges();

  const [hasPlayedAudio, setHasPlayedAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);

  // API'den gelen ses dosyasını çal
  useEffect(() => {
    if (!step2Analysis || hasPlayedAudio) return;

    const playAnalysisAudio = async () => {
      try {
        // API'den gelen audioBase64'ü çal
        if (step2Analysis.audioBase64 && audioRef.current) {
          const src = step2Analysis.audioBase64.trim().startsWith('data:') 
            ? step2Analysis.audioBase64.trim() 
            : `data:audio/mpeg;base64,${step2Analysis.audioBase64.trim()}`;
          
          audioRef.current.src = src;
          audioRef.current.playbackRate = getPlaybackRate();
          (audioRef.current as any).playsInline = true;
          audioRef.current.muted = false;
          
          await audioRef.current.play();
          setHasPlayedAudio(true);

          // Check for badges after audio finishes
          if (student?.id) {
            const earnedBadges = await checkForNewBadges(
              storyIdNum,
              3,
              sessionId,
              {
                wpm: step2Analysis.metrics.wpmCorrect,
                accuracy: step2Analysis.metrics.accuracyPercent,
                goalAchieved: step2Analysis.reachedTarget,
                completedLevels: [1, 2, 3]
              }
            );
            console.log(`🏆 Earned ${earnedBadges.length} badges in Level 3 Step 3`);
          }
        }
      } catch (err) {
        console.error('Error playing analysis audio:', err);
        setHasPlayedAudio(true);
      }
    };

    playAnalysisAudio();
  }, [step2Analysis, hasPlayedAudio, student?.id, storyIdNum, sessionId, checkForNewBadges]);

  console.log('Step3: step2Analysis from Redux:', step2Analysis);

  // Mark step as completed when analysis result is available
  useEffect(() => {
    if (step2Analysis && onStepCompleted) {
      onStepCompleted({
        step2Analysis
      });
    }
  }, [step2Analysis, onStepCompleted]);

  if (!step2Analysis) {
    return (
      <div className="w-full flex flex-col items-center justify-center py-12 min-h-96">
        <div className="text-center bg-yellow-50 border-2 border-yellow-300 rounded-lg p-8 max-w-md">
          <p className="text-xl text-gray-800 mb-4 font-semibold">⚠️ Henüz okuma analizi sonucu yok</p>
          <p className="text-gray-600 mb-6">Lütfen önce 2. Adımı tamamla.</p>
          <button
            onClick={() => navigate(`/level/3/step/2?storyId=${storyId}`)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition"
          >
            2. Adıma Git
          </button>
        </div>
      </div>
    );
    }

  const { metrics, reachedTarget, analysisText, coachText, speedSummary, hedefOkuma, transcriptText } = step2Analysis;

  return (
    <div className="w-full mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      
      <div className="flex flex-col gap-6">
        <h2 className="text-3xl font-bold text-purple-800 text-center">3. Adım: Okuma hızı ve Performans geribildirimi</h2>
        
        {/* Hedef Durumu */}
        <div className={`border-2 rounded-xl p-6 text-center max-w-3xl mx-auto ${
          reachedTarget 
            ? 'bg-green-50 border-green-300' 
            : 'bg-yellow-50 border-yellow-300'
        }`}>
          <h4 className={`font-bold mb-2 text-xl ${
            reachedTarget 
              ? 'text-green-900' 
              : 'text-yellow-900'
          }`}>
            {reachedTarget ? '🎉 Tebrikler!' : '💪 Devam Et!'}
          </h4>
          {/* Speed Summary */}
          <p className="text-sm text-gray-600 mb-3">{speedSummary}</p>
        </div>

        {/* DOST'un Analiz Mesajı */}
        {analysisText && (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6 max-w-3xl mx-auto">
            <h4 className="font-bold text-blue-900 mb-2 text-xl">🗣️ DOST'un Mesajı</h4>
            <p className="text-gray-800 text-lg">{analysisText}</p>
          </div>
        )}

        {/* Koç Mesajı */}
        {coachText && (
          <div className="bg-purple-50 border-2 border-purple-300 rounded-xl p-6 max-w-3xl mx-auto">
            <h4 className="font-bold text-purple-900 mb-2 text-xl">💡 Koç Tavsiyeleri</h4>
            <p className="text-gray-800 text-lg">{coachText}</p>
          </div>
        )}

        {/* Okuma Hızı ve Hedef Özeti */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <h4 className="font-bold text-green-900 mb-2">Doğru Okuma Hızın</h4>
            <p className="text-3xl font-bold text-green-700">{metrics.wpmCorrect}</p>
            <p className="text-sm text-gray-600 mt-1">sözcük/dakika</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
            <h4 className="font-bold text-purple-900 mb-2">Okuma Hedefin</h4>
            <p className="text-3xl font-bold text-purple-700">{hedefOkuma}</p>
            <p className="text-sm text-gray-600 mt-1">sözcük/dakika</p>
          </div>
        </div>
        
        {/* Detaylı Metrikler */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 text-center">
            <h4 className="font-bold text-blue-900 mb-2">Doğruluk</h4>
            <p className="text-3xl font-bold text-blue-600">%{metrics.accuracyPercent}</p>
          </div>

          <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
            <h4 className="font-bold text-green-900 mb-2">Süre</h4>
            <p className="text-3xl font-bold text-green-700">{metrics.durationMMSS}</p>
          </div>

          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200 text-center">
            <h4 className="font-bold text-purple-900 mb-2">Okunan Sözcük</h4>
            <p className="text-3xl font-bold text-purple-700">{metrics.spokenWordCount}</p>
            <p className="text-sm text-gray-600 mt-1">/ {metrics.targetWordCount}</p>
          </div>

          <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 text-center">
            <h4 className="font-bold text-orange-900 mb-2">Doğru Sözcük</h4>
            <p className="text-3xl font-bold text-orange-700">{metrics.matchedWordCount}</p>
          </div>
        </div>

        {/* Transkript */}
        {transcriptText && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-3xl mx-auto">
            <h4 className="font-bold text-gray-900 mb-2">📝 Okunan Metin (Transkript)</h4>
            <p className="text-gray-700 italic text-sm leading-relaxed">"{transcriptText}"</p>
      </div>
        )}
      </div>

      {/* Badge Animation */}
      {newBadges.length > 0 && (
        <BadgeAnimation 
          badge={newBadges[0]} 
          show={true}
          onClose={clearNewBadges}
        />
      )}
    </div>
  );
}
