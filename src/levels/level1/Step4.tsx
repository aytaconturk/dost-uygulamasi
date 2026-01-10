import { useEffect, useRef, useState } from 'react';
import { getParagraphs, type Paragraph } from '../../data/stories';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { analyzeObjectiveForStep4 } from '../../lib/level1-api';
import type { Level1ObjectiveAnalysisResponse } from '../../types';
import { useStepContext } from '../../contexts/StepContext';
import { getPlaybackRate } from '../../components/SidebarSettings';
import { useAudioPlaybackRate } from '../../hooks/useAudioPlaybackRate';
import { getStoryById } from '../../lib/supabase';
import { getStoryImageUrl, getAssetUrl } from '../../lib/image-utils';

export default function Step4() {
  const [searchParams] = useSearchParams();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // New states for intro flow (like Step 3)
  const [introPlayed, setIntroPlayed] = useState(false);
  const [started, setStarted] = useState(false);
  const [mascotState, setMascotState] = useState<'idle' | 'speaking' | 'listening'>('idle');
  
  const [objectiveText, setObjectiveText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [responseAudioFinished, setResponseAudioFinished] = useState(false);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);

  const { sessionId, onStepCompleted, storyId: contextStoryId } = useStepContext();
  
  // Apply playback rate to audio element
  useAudioPlaybackRate(audioRef);
  
  // Use storyId from context if available, otherwise from searchParams
  const storyIdFromParams = Number(searchParams.get('storyId')) || 1;
  const finalStoryId = contextStoryId || storyIdFromParams;
  const [story, setStory] = useState<{ id: number; title: string; description: string; image: string } | null>(null);

  const stepAudio = getAssetUrl('audios/level1/seviye-1-adim-4-fable.mp3');
  const introText = 'Bu seviyenin son basamağına geldik. Bu basamakta karşımıza çıkan metinler için okuma amaçları belirlememiz gerekiyor.';
  const navigate = useNavigate();

  // Load story data from Supabase
  useEffect(() => {
    const loadStory = async () => {
      try {
        const { data, error } = await getStoryById(finalStoryId);
        if (error || !data) {
          setStory({
            id: finalStoryId,
            title: `Oturum ${finalStoryId}`,
            description: '',
            image: `/images/story${finalStoryId}.png`,
          });
        } else {
          const imagePath = data.image || `/images/story${finalStoryId}.png`;
          setStory({
            id: data.id,
            title: data.title,
            description: data.description || '',
            image: imagePath,
          });
        }
      } catch (e) {
        setStory({
          id: finalStoryId,
          title: `Oturum ${finalStoryId}`,
          description: '',
          image: `/images/story${finalStoryId}.png`,
        });
      }
    };
    loadStory();
  }, [finalStoryId]);

  // Load paragraphs
  useEffect(() => {
    const paras = getParagraphs(finalStoryId);
    setParagraphs(paras);
  }, [finalStoryId]);

  // Play intro audio when component mounts (before showing Başla button)
  useEffect(() => {
    if (introPlayed) return;
    
    const playIntroAudio = async () => {
      if (!audioRef.current) {
        setIntroPlayed(true);
        return;
      }
      
      try {
        audioRef.current.src = stepAudio;
        audioRef.current.playbackRate = getPlaybackRate();
        setMascotState('speaking');
        
        const handleEnded = () => {
          setMascotState('idle');
          setIntroPlayed(true);
          audioRef.current?.removeEventListener('ended', handleEnded);
        };
        
        audioRef.current.addEventListener('ended', handleEnded);
        await audioRef.current.play();
      } catch (err) {
        console.error('Intro audio play error:', err);
        setIntroPlayed(true);
      }
    };
    
    const timer = setTimeout(playIntroAudio, 300);
    
    return () => {
      clearTimeout(timer);
    };
  }, [stepAudio, introPlayed]);

  // When user clicks "Başla", start the objective analysis
  useEffect(() => {
    if (!started || objectiveText) return;
    
    handleObjectiveAnalysis();
  }, [started, objectiveText]);

  // Stop all audio event listener
  useEffect(() => {
    const stopAll = () => {
      if (audioRef.current) {
        try { audioRef.current.pause(); } catch {}
      }
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
  }, []);

  const playAudioFromBase64 = async (base64: string): Promise<void> => {
    if (!audioRef.current || !base64) throw new Error('no audio');
    
    return new Promise((resolve, reject) => {
      const tryMime = async (mime: string) => {
        const src = base64.trim().startsWith('data:') ? base64.trim() : `data:${mime};base64,${base64.trim()}`;
        audioRef.current!.src = src;
        audioRef.current!.playbackRate = getPlaybackRate();
        setMascotState('speaking');
        
        const handleEnded = () => {
          setMascotState('idle');
          setResponseAudioFinished(true);
          audioRef.current?.removeEventListener('ended', handleEnded);
          resolve();
        };
        
        audioRef.current!.addEventListener('ended', handleEnded);
        await audioRef.current!.play();
      };
      
      tryMime('audio/mpeg').catch(() => {
        tryMime('audio/webm;codecs=opus').catch(() => {
          tryMime('audio/wav').catch((e) => {
            setMascotState('idle');
            setResponseAudioFinished(true);
            reject(e);
          });
        });
      });
    });
  };

  const handleObjectiveAnalysis = async () => {
    setIsAnalyzing(true);
    setMascotState('speaking');
    
    try {
      const response: Level1ObjectiveAnalysisResponse = await analyzeObjectiveForStep4({
        stepNum: 4,
        userId: sessionId || `anon-${Date.now()}`,
      });

      const text = 
        response.answer || 
        response.message || 
        response.text || 
        response.response ||
        response.textAudio || 
        '';

      setObjectiveText(text);

      if (response.audioBase64) {
        try {
          await playAudioFromBase64(response.audioBase64);
        } catch {
          setMascotState('idle');
          setResponseAudioFinished(true);
        }
      } else {
        setMascotState('idle');
        setResponseAudioFinished(true);
      }
    } catch (e) {
      console.error('Objective analysis error:', e);
      setObjectiveText('Okuma amacı belirlenirken bir hata oluştu.');
      setMascotState('idle');
      setResponseAudioFinished(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderParagraph = (p: Paragraph, idx: number) => (
    <p key={idx} className="mt-3 leading-relaxed text-gray-800">
      {p.map((seg, i) => (
        <span key={i} className={seg.bold ? 'font-bold' : undefined}>
          {seg.text}
        </span>
      ))}
    </p>
  );

  const onClickTamamla = async () => {
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    
    // Mark step as completed
    if (onStepCompleted && objectiveText) {
      await onStepCompleted({
        objectiveText
      });
    }
    
    navigate(`/level/1/completion?storyId=${finalStoryId}`);
  };

  if (!story) {
    return <div className="w-full max-w-5xl mx-auto px-4">Yükleniyor...</div>;
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <audio ref={audioRef} preload="auto" />

      {!started ? (
        // Intro screen with Başla button (like Step 3)
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg border border-purple-200 p-6 max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-purple-800 mb-2">
              4. Adım: Okuma Amacı Belirleme
            </h2>
            <p className="text-gray-700">
              {introText}
            </p>
            
            {/* Show speaking indicator while intro audio is playing */}
            {!introPlayed && mascotState === 'speaking' && (
              <div className="mt-4 flex items-center justify-center gap-2 text-purple-600">
                <div className="animate-pulse">🔊</div>
                <span className="font-medium">DOST açıklıyor...</span>
              </div>
            )}
          </div>
          
          {/* Show Başla button only after intro audio finishes */}
          {introPlayed && (
            <button
              onClick={() => setStarted(true)}
              className="mt-6 bg-purple-600 text-white px-8 py-4 rounded-full shadow-lg hover:bg-purple-700 transition text-xl font-bold"
            >
              Başla
            </button>
          )}
        </div>
      ) : (
        // Main step content
        <div className="flex flex-col md:flex-row items-start justify-center gap-6">
          <div className="flex-shrink-0 mt-4">
            <img src={getStoryImageUrl(story.image)} alt={story.title} className="rounded-lg shadow-lg w-64 md:w-80" />
          </div>
          
          <div className="text-lg text-gray-800 leading-relaxed max-w-xl w-full">
            <h2 className="text-2xl font-bold text-purple-800 mb-4">4. Adım: Okuma Amacı Belirleme</h2>

            <div className="bg-white rounded-xl shadow p-6">
              {/* Loading state */}
              {isAnalyzing && !objectiveText && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-blue-700 font-medium">DOST okuma amacını analiz ediyor...</p>
                  </div>
                </div>
              )}

              {/* Show paragraphs while analyzing */}
              {isAnalyzing && !objectiveText && (
                <div className="text-base md:text-lg">
                  {paragraphs.map((p, idx) => renderParagraph(p, idx))}
                </div>
              )}

              {/* Show API response */}
              {objectiveText && (
                <>
                  {/* Speaking indicator */}
                  {mascotState === 'speaking' && (
                    <div className="mb-4 flex items-center gap-2 text-purple-600">
                      <div className="animate-pulse">🔊</div>
                      <span className="font-medium">DOST açıklıyor...</span>
                    </div>
                  )}

                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-bold text-blue-800 mb-2">🤖 DOST'un Açıklaması:</h3>
                    <p className="text-blue-700">{objectiveText}</p>
                  </div>

                  {/* Show "Son Adıma Geç" button only after audio finishes */}
                  {responseAudioFinished && (
                    <div className="pt-6 text-center">
                      <button
                        onClick={onClickTamamla}
                        className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-lg font-bold transition text-lg"
                      >
                        Son Adıma Geç
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
