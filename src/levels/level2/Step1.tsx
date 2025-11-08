import { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { submitReadingAnalysis } from '../../lib/level2-api';
import { getParagraphs } from '../../data/stories';
import type { Level2Step1ReadingAnalysisResponse } from '../../types';
import type { RootState } from '../../store/store';

const STORY_ID = 2;
const TOTAL_SECONDS = 60;

// Turkish translations for quality metrics
const QUALITY_METRIC_LABELS: Record<string, string> = {
  speechRate: 'Okuma Hızı',
  correctWords: 'Doğru Sözcükler',
  punctuation: 'Noktalama',
  expressiveness: 'İfadeli Okuma',
};

export default function Level2Step1() {
  const story = { id: STORY_ID, title: 'Avucumun İçindeki Akıllı Kutu' };
  const storyText = getParagraphs(story.id)
    .map(p => p.map(seg => seg.text).join(''))
    .join(' ');

  const currentStudent = useSelector((state: RootState) => state.user.student);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const [started, setStarted] = useState(false);
  const [reading, setReading] = useState(false);
  const [result, setResult] = useState<null | { wordsRead: number; wpm: number; wordsPerSecond: number }>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [analysis, setAnalysis] = useState<Level2Step1ReadingAnalysisResponse | null>(null);
  const [countdownStartTime, setCountdownStartTime] = useState(0);
  const [recordingStartTime, setRecordingStartTime] = useState('');
  const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const [beeped60, setBeeped60] = useState(false);

  const paragraphs = getParagraphs(story.id);
  const displayTitle = story.title;

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove the data:audio/...;base64, prefix to get just the base64 string
        const base64String = base64.split(',')[1] || base64;
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleStart = async () => {
    setStarted(true);
    setReading(true);
    setCountdownStartTime(Date.now());
    setRecordingStartTime(new Date().toISOString());

    // Start audio recording
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  useEffect(() => {
    if (!reading) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
      const remaining = Math.max(0, TOTAL_SECONDS - elapsed);
      setTimeLeft(remaining);
      if (remaining === 60 && !beeped60) {
        setBeeped60(true);
        if (audioRef.current) {
          audioRef.current.src = '/src/assets/audios/sira-sende-mikrofon.mp3';
          audioRef.current.play().catch(() => {});
        }
      }
      if (remaining === 0) {
        setTimeUp(true);
        clearInterval(interval);
        // Call handleFinish when time is up
        handleFinish();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [reading, countdownStartTime, beeped60]);

  useEffect(() => {
    return () => {
      // Cleanup on unmount: stop recording and release streams
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFinish = async () => {
    setReading(false);
    setIsProcessing(true);

    const elapsed = Math.floor((Date.now() - countdownStartTime) / 1000);
    const wordsRead = selectedWordIndex !== null ? selectedWordIndex + 1 : 0;
    const wpm = elapsed > 0 ? Math.round((wordsRead / elapsed) * 60) : 0;
    const wordsPerSecond = elapsed > 0 ? wordsRead / elapsed : 0;

    setResult({ wordsRead, wpm, wordsPerSecond });

    // Stop audio recording and wait for all chunks to be collected
    let audioBlob: Blob | null = null;

    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        // Wait for the stop event to ensure all chunks are collected
        audioBlob = await new Promise((resolve, reject) => {
          const handleStop = () => {
            mediaRecorderRef.current?.removeEventListener('stop', handleStop);
            // Create blob from all collected chunks
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
            resolve(blob);
          };

          const handleError = (error: Event) => {
            mediaRecorderRef.current?.removeEventListener('error', handleError);
            reject(new Error('Recording error'));
          };

          mediaRecorderRef.current.addEventListener('stop', handleStop);
          mediaRecorderRef.current.addEventListener('error', handleError);

          // Stop the recording
          mediaRecorderRef.current.stop();
        });
      }

      // Stop the microphone stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setIsUploading(true);

      const studentId = currentStudent?.id || currentStudent?.first_name || 'unknown';
      const sessionId = `session_${Date.now()}`;
      const recordingEndTime = new Date().toISOString();

      // Only upload if we have audio
      if (audioBlob && audioBlob.size > 0) {
        const audioBase64 = await blobToBase64(audioBlob);

        const response = await submitReadingAnalysis({
          studentId,
          originalText: storyText,
          audioFile: audioBase64,
          startTime: recordingStartTime,
          endTime: recordingEndTime,
          metadata: {
            level: 2,
            sessionId,
          },
        });

        if (response.success && response.data) {
          setAnalysis(response);
        }
      } else {
        console.log('No audio recorded');
      }
    } catch (error) {
      console.log('Error during recording or upload:', error);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const CountdownBadge = ({ secondsLeft, total }: { secondsLeft: number; total: number }) => {
    const size = 64;
    const stroke = 6;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const progress = Math.min(Math.max(1 - secondsLeft / total, 0), 1);
    const dashOffset = circumference * progress;
    const color = progress < 0.5 ? '#22c55e' : progress < 0.85 ? '#f59e0b' : '#ef4444';
    return (
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg width={size} height={size} className="absolute">
          <circle cx={size/2} cy={size/2} r={radius} stroke="#e5e7eb" strokeWidth={stroke} fill="none" />
          <g style={{ transform: `rotate(90deg)`, transformOrigin: '50% 50%' }}>
            <circle cx={size/2} cy={size/2} r={radius} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={circumference} strokeDashoffset={dashOffset} />
          </g>
        </svg>
        <div className="relative text-center font-bold text-sm text-gray-800">{secondsLeft}</div>
      </div>
    );
  };

  const introText = 'Şimdi ikinci seviyeye geçiyoruz. Bu seviyede metni ilk kez okuyacaksın ben de senin okuma hızını belirleyeceğim. Bunun için seni bir görev bekliyor. Az sonra ekranda çıkacak olan başla butonuna basarsanız metin karşına çıkacak sen de beklemeden tüm metni güzel okuma kurallarına uygun bir şekilde oku.';

  return (
    <div className="w-full mx-auto px-4">
      <audio ref={audioRef} preload="auto" />
      
      {/* Start screen */}
      {!started && !reading && !result && (
        <div>
          <h2 className="text-2xl font-bold text-purple-800 mb-4 text-center">1. Adım: Birinci okuma ve Okuma hızı belirleme</h2>
          <div className="bg-white rounded-xl shadow p-5 mb-6">
            <p className="text-gray-800 text-lg">{introText}</p>
          </div>
          <div className="flex justify-center">
            <button onClick={handleStart} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold">Başla</button>
          </div>
        </div>
      )}

      {/* Reading screen */}
      {reading && (
        <div className="w-full relative">
          {isProcessing && (
            <div className="fixed inset-0 bg-white/70 flex items-center justify-center z-50 rounded-xl">
              <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-xl font-semibold text-gray-700">Okuma süresi ölçülüyor...</p>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-0">
            {/* Left sticky image */}
            <div className="hidden lg:sticky lg:top-0 lg:w-1/4 lg:flex flex-col items-center justify-start p-4 h-screen overflow-y-auto flex-shrink-0">
              <img src="https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story2.png" alt={displayTitle} className="w-full max-w-xs rounded-xl shadow-lg" />
              <h2 className="mt-4 text-2xl font-bold text-purple-800 text-center">{displayTitle}</h2>
              <div className="mt-2 text-center text-gray-600 text-sm">{beeped60 ? '60. saniye: Son sözcüğü işaretle' : 'Okumaya devam et'}</div>
            </div>

            {/* Center text */}
            <div className="flex-1 bg-white shadow p-6 leading-relaxed text-gray-800">
              <div className={`text-lg leading-relaxed space-y-4 ${timeUp || isProcessing ? 'blur-sm' : ''}`}>
                {(() => {
                  let globalIndex = -1;
                  return paragraphs.map((para, pIdx) => (
                    <p key={pIdx}>
                      {para.map((seg, sIdx) => {
                        const words = seg.text.split(/\s+/).filter(Boolean);
                        return (
                          <span key={sIdx} className={seg.bold ? 'font-bold' : ''}>
                            {words.map((w, wIdx) => {
                              globalIndex += 1;
                              const idx = globalIndex;
                              return (
                                <span
                                  key={wIdx}
                                  onClick={() => setSelectedWordIndex(idx)}
                                  className={`cursor-pointer px-0.5 ${selectedWordIndex === idx ? 'bg-yellow-300 rounded' : ''}`}
                                >
                                  {w}{' '}
                                </span>
                              );
                            })}
                          </span>
                        );
                      })}
                    </p>
                  ));
                })()}
              </div>
              {timeUp && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute inset-0 bg-white/70 rounded-xl"></div>
                  <div className="relative text-red-600 text-2xl font-extrabold animate-bounce">Süre doldu</div>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3 flex-wrap">
                {!isProcessing && (
                  <button onClick={handleFinish} className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold shadow">Bitir</button>
                )}
                {beeped60 && !isProcessing && <div className="text-sm text-orange-700 bg-orange-50 border-l-4 border-orange-400 px-3 py-2 rounded">Bip sesinden sonra son okuduğun sözcüğü işaretlemeyi unutma.</div>}
              </div>
            </div>
          </div>

          {/* Right fixed countdown */}
          {!isProcessing && (
            <div className="hidden lg:flex fixed right-8 top-20 flex-col items-center justify-start p-4 bg-white rounded-lg shadow z-40">
              <CountdownBadge secondsLeft={timeLeft} total={TOTAL_SECONDS} />
              <div className="text-center text-gray-600 text-sm mt-2">Kalan Süre</div>
            </div>
          )}
        </div>
      )}

      {/* Result screen */}
      {(result || isProcessing || isUploading || analysis) && (
        <div className="w-full max-w-3xl mx-auto px-4">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center">
            {isProcessing && (
              <div>
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-lg font-semibold text-gray-700">Okuma süresi ölçülüyor...</p>
              </div>
            )}

            {!isProcessing && isUploading && <p className="text-gray-600">Analiz yapılıyor...</p>}
            {!isProcessing && analysis && (
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Overall Score - Full Width */}
                <div className="md:col-span-2 lg:col-span-1 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                  <h4 className="font-bold text-blue-900 mb-2">Genel Puan</h4>
                  <p className="text-3xl font-bold text-blue-600">{analysis.data?.readingAnalysis?.overallScore || 0}</p>
                </div>

                {/* Reading Speed */}
                {analysis.data?.readingAnalysis?.readingSpeed && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-bold text-green-900 mb-2">Okuma Hızı</h4>
                    <p className="text-gray-700">Dakikadaki Sözcük: <span className="font-bold text-green-700">{analysis.data.readingAnalysis.readingSpeed.wordsPerMinute}</span></p>
                    <p className="text-gray-700">Doğru Sözcük/Dakika: <span className="font-bold text-green-700">{analysis.data.readingAnalysis.readingSpeed.correctWordsPerMinute}</span></p>
                  </div>
                )}

                {/* Word Count */}
                {analysis.data?.readingAnalysis?.wordCount && (
                  <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-bold text-purple-900 mb-2">Sözcük Sayıları</h4>
                    <p className="text-gray-700">Orijinal: <span className="font-bold">{analysis.data.readingAnalysis.wordCount.original}</span></p>
                    <p className="text-gray-700">Okunan: <span className="font-bold">{analysis.data.readingAnalysis.wordCount.spoken}</span></p>
                    <p className="text-gray-700">Doğru: <span className="font-bold text-green-700">{analysis.data.readingAnalysis.wordCount.correct}</span></p>
                  </div>
                )}

                {/* Quality Rules - Full Width */}
                {analysis.data?.readingAnalysis?.qualityRules && (
                  <div className="md:col-span-2 lg:col-span-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
                    <h4 className="font-bold text-orange-900 mb-3">Kalite Değerlendirmesi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                      {Object.entries(analysis.data.readingAnalysis.qualityRules).map(([key, rule]) => (
                        <div key={key} className="bg-white p-3 rounded border border-orange-100">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium text-gray-700 text-sm">{QUALITY_METRIC_LABELS[key] || key}</span>
                            <span className="font-bold text-orange-600">{(rule as any).score}%</span>
                          </div>
                          <p className="text-xs text-gray-600">{(rule as any).feedback}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Pronunciation */}
                {analysis.data?.readingAnalysis?.pronunciation && (
                  <div className="md:col-span-2 lg:col-span-2 p-4 bg-red-50 rounded-lg border border-red-200">
                    <h4 className="font-bold text-red-900 mb-2">Telaffuz Doğruluğu</h4>
                    <p className="text-gray-700 mb-3">Doğruluk: <span className="font-bold text-red-600">{analysis.data.readingAnalysis.pronunciation.accuracy}%</span></p>
                    {analysis.data.readingAnalysis.pronunciation.errors.length > 0 && (
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Hatalar:</p>
                        <div className="space-y-2">
                          {analysis.data.readingAnalysis.pronunciation.errors.map((error, idx) => (
                            <div key={idx} className="bg-white p-2 rounded text-sm border border-red-100">
                              <p><span className="text-red-600 font-bold">{error.expected}</span> → <span className="text-blue-600 font-bold">{error.actual}</span></p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Recommendations */}
                {analysis.data?.readingAnalysis?.recommendations && (
                  <div className="md:col-span-2 lg:col-span-1 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                    <h4 className="font-bold text-indigo-900 mb-2">Öneriler</h4>
                    <ul className="space-y-2">
                      {analysis.data.readingAnalysis.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-gray-700 text-sm flex items-start">
                          <span className="text-indigo-600 font-bold mr-2">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Transcript - Full Width */}
                {analysis.data?.transcript && (
                  <div className="md:col-span-2 lg:col-span-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-bold text-gray-900 mb-2">Transkript</h4>
                    <p className="text-gray-700 italic text-sm">"{analysis.data.transcript}"</p>
                  </div>
                )}

                {/* Goal Suggestions */}
                {analysis.data?.readingAnalysis?.goalSuggestions && (
                  <div className="md:col-span-2 lg:col-span-3 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <h4 className="font-bold text-yellow-900 mb-2">Hedef Öneriler (Dakika Başına Sözcük)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-700">%5 artış için:</p>
                        <p className="font-bold text-yellow-600 text-lg">{analysis.data.readingAnalysis.goalSuggestions.increase5Percent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-700">%7 artış için:</p>
                        <p className="font-bold text-yellow-600 text-lg">{analysis.data.readingAnalysis.goalSuggestions.increase7Percent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-700">%10 artış için:</p>
                        <p className="font-bold text-yellow-600 text-lg">{analysis.data.readingAnalysis.goalSuggestions.increase10Percent}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
