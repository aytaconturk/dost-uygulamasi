import { useEffect, useMemo, useRef, useState } from 'react';
import { getRecordingDuration } from '../../components/SidebarSettings';
import { analyzeSentencesForStep3, submitChildrenVoice } from '../../lib/level1-api';
import VoiceRecorder from '../../components/VoiceRecorder';
import {
  getParagraphs,
  paragraphToPlain,
  getFirstThreeParagraphFirstSentences,
  type Paragraph,
} from '../../data/stories';
import type { Level1SentencesAnalysisResponse, Level1ChildrenVoiceResponse } from '../../types';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export default function Step3() {
  const story = {
    id: 1,
    title: 'Oturum 1: Kırıntıların Kahramanları',
  };

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [phase, setPhase] = useState<'intro' | 'dost' | 'student'>('intro');
  const [analysisText, setAnalysisText] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [childrenVoiceResponse, setChildrenVoiceResponse] = useState<string>('');
  const [isProcessingVoice, setIsProcessingVoice] = useState(false);
  const [resumeUrl, setResumeUrl] = useState<string>('');
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [firstSentences, setFirstSentences] = useState<string[]>([]);

  const currentStudent = useSelector((state: RootState) => state.user.student);

  const stepAudio = '/src/assets/audios/level1/seviye-1-adim-3-fable.mp3';

  useEffect(() => {
    const loadData = async () => {
      const paras = getParagraphs(story.id);
      setParagraphs(paras);
      const sentences = await getFirstThreeParagraphFirstSentences(story.id);
      setFirstSentences(sentences);
    };
    loadData();
  }, [story.id]);

  const firstSentenceLengths = useMemo(() => {
    if (!paragraphs || paragraphs.length === 0) return [];
    return paragraphs.map((p, idx) => {
      const plain = paragraphToPlain(p);
      if (idx < 3) {
        const fs = firstSentences[idx] || '';
        return fs.length;
      }
      const match = plain.match(/[^.!?\n]+[.!?]?/);
      return match ? match[0].trim().length : 0;
    });
  }, [paragraphs, firstSentences]);

  useEffect(() => {
    const el = audioRef.current;
    const startDostFlow = () => {
      setPhase('dost');
      runDostAnalysis();
    };
    if (el) {
      el.src = stepAudio;
      // @ts-ignore
      el.playsInline = true;
      el.muted = false;
      el.play()
        .then(() => {
          el.addEventListener('ended', startDostFlow, { once: true });
        })
        .catch(() => startDostFlow());
    } else {
      startDostFlow();
    }
    const stopAll = () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
        } catch {}
      }
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, stopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, stopAll);
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
    };
  }, []);

  const playAudioFromBase64 = async (base64: string) => {
    if (!audioRef.current || !base64) throw new Error('no audio');
    const tryMime = async (mime: string) => {
      const src = base64.trim().startsWith('data:') ? base64.trim() : `data:${mime};base64,${base64.trim()}`;
      audioRef.current!.src = src;

      // Reset progress
      setAudioProgress(0);
      setAudioDuration(0);

      // Update duration when metadata is loaded
      const onLoadedMetadata = () => {
        setAudioDuration(audioRef.current?.duration || 0);
      };

      // Update progress during playback
      const onTimeUpdate = () => {
        setAudioProgress(audioRef.current?.currentTime || 0);
      };

      // Clean up when done
      const onEnded = () => {
        setAudioProgress(0);
        setAudioDuration(0);
        audioRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
        audioRef.current?.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current?.removeEventListener('ended', onEnded);
      };

      audioRef.current?.addEventListener('loadedmetadata', onLoadedMetadata);
      audioRef.current?.addEventListener('timeupdate', onTimeUpdate);
      audioRef.current?.addEventListener('ended', onEnded);

      await audioRef.current?.play();
      await new Promise<void>((resolve) => {
        audioRef.current?.addEventListener('ended', () => resolve(), { once: true });
      });
    };
    try {
      await tryMime('audio/mpeg');
    } catch {
      try {
        await tryMime('audio/webm;codecs=opus');
      } catch {
        await tryMime('audio/wav');
      }
    }
  };

  const runDostAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const response: Level1SentencesAnalysisResponse = await analyzeSentencesForStep3({
        stepNum: 3,
        userId: currentStudent?.id || '',
      });

      const text = 
        response.answer || 
        response.message || 
        response.text || 
        response.response || 
        '';

      setAnalysisText(text);
      setResumeUrl(response.resumeUrl);

      if (response.audioBase64) {
        try {
          await playAudioFromBase64(response.audioBase64);
          setPhase('student');
        } catch {
          setPhase('student');
        }
      } else {
        setPhase('student');
      }
    } catch (e) {
      setAnalysisText('');
      setPhase('student');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const renderParagraph = (p: Paragraph, idx: number) => {
    const shouldHighlight = (phase === 'dost' && idx < 3) || (phase === 'student' && idx >= 3);
    const firstBoldIdx = p.findIndex((seg) => seg.bold);

    const parts: JSX.Element[] = [];
    p.forEach((seg, i) => {
      const base = seg.bold ? 'font-bold' : undefined;
      if (shouldHighlight && i === firstBoldIdx) {
        parts.push(
          <span key={i} className={`rounded px-1 bg-yellow-300 ${base || ''}`}>
            {seg.text}
          </span>
        );
      } else {
        parts.push(
          <span key={i} className={base}>
            {seg.text}
          </span>
        );
      }
    });
    return (
      <p key={idx} className="mt-3 leading-relaxed text-gray-800">
        {parts}
      </p>
    );
  };

  const handleVoiceSubmit = async (audioBlob: Blob) => {
    setIsProcessingVoice(true);
    try {
      const response: Level1ChildrenVoiceResponse = await submitChildrenVoice(
        audioBlob,
        resumeUrl,
        story.title,
        3,
        'cumle_tahmini'
      );

      const responseText =
        response.respodKidVoice ||
        response.message ||
        response.text ||
        response.response ||
        response.textAudio ||
        '';

      setChildrenVoiceResponse(responseText);

      if (response.audioBase64) {
        try {
          await playAudioFromBase64(response.audioBase64);
        } catch (e) {
          // audio failed, but keep response visible
        }
      }
    } catch (e) {
      setChildrenVoiceResponse('');
    } finally {
      setIsProcessingVoice(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      <h2 className="text-2xl font-bold text-purple-800 mb-4">3. Adım: Anlama Çalışması</h2>

      <div className="mb-4">
        <img
          src="https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png"
          alt={story.title}
          className="w-full max-w-xs mx-auto rounded-xl shadow"
        />
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        {isAnalyzing && phase === 'dost' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
            DOST metnin ilk cümlelerini okuyor ve tahmin ediyor...
          </div>
        )}

        {audioDuration > 0 && (
          <div className="mb-4 space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div
                className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                style={{ width: `${(audioProgress / audioDuration) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 text-center">
              {Math.floor(audioProgress)}s / {Math.floor(audioDuration)}s
            </p>
          </div>
        )}

        <div className="text-lg">{paragraphs.map((p, idx) => renderParagraph(p, idx))}</div>

        {phase === 'student' && !childrenVoiceResponse && (
          <div className="mt-6 text-center">
            <p className="mb-4 text-xl font-bold text-green-700 animate-pulse">
              Hadi sıra sende! Mikrofona konuş
            </p>
            <VoiceRecorder
              recordingDurationMs={getRecordingDuration()}
              autoSubmit={true}
              onSave={handleVoiceSubmit}
              onPlayStart={() => {
                try {
                  window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
                } catch {}
              }}
            />
            {isProcessingVoice && (
              <p className="mt-4 text-blue-600 font-medium">DOST senin sözlerini değerlendiriyor...</p>
            )}
          </div>
        )}

        {childrenVoiceResponse && (
          <div className="mt-6 p-4 bg-green-50 rounded border border-green-200">
            <h3 className="font-bold text-green-800 mb-2">🗣️ DOST'un Yorumu:</h3>
            <p className="text-green-700 text-lg">{childrenVoiceResponse}</p>
          </div>
        )}
      </div>
    </div>
  );
}
