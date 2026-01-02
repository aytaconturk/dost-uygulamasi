import { useState, useRef, useEffect } from 'react';
import { Mic, Square, TestTube } from 'lucide-react';
import { isTestAudioEnabled, getTestAudioBlob, hasTestAudio } from './TestAudioManager';

interface Props {
  onSave: (blob: Blob) => void;
  onPlayStart?: () => void;
  recordingDurationMs?: number;
  autoSubmit?: boolean;
  compact?: boolean;
  // Test audio için eklenen props
  storyId?: number;
  level?: number;
  step?: number;
}

export default function VoiceRecorder({ 
  onSave, 
  onPlayStart, 
  recordingDurationMs = 10000, 
  autoSubmit = true, 
  compact = false,
  storyId = 1,
  level = 2,
  step = 1
}: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  const [testAudioActive, setTestAudioActive] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartAtRef = useRef<number | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Test audio durumunu kontrol et
  useEffect(() => {
    const checkTestAudio = () => {
      const enabled = isTestAudioEnabled(storyId, level, step);
      setTestAudioActive(enabled);
      console.log(`[VoiceRecorder] Test audio durum kontrol: ${enabled ? 'AKTIF' : 'PASİF'} (Hikaye: ${storyId}, Seviye: ${level}, Adım: ${step})`);
    };
    
    checkTestAudio();
    
    // Storage değişikliklerini dinle (farklı sekmeler için)
    const handleStorageChange = () => {
      console.log('[VoiceRecorder] Storage event - kontrol ediliyor...');
      checkTestAudio();
    };
    
    // Custom event dinle (aynı sayfa için)
    const handleTestAudioChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      console.log('[VoiceRecorder] Test audio değişti:', customEvent.detail);
      checkTestAudio();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('testAudioChanged', handleTestAudioChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('testAudioChanged', handleTestAudioChange);
    };
  }, [storyId, level, step]);

  // Test audio kullanarak kayıt simüle et
  const useTestAudio = () => {
    if (!hasTestAudio(storyId, level, step)) {
      alert('⚠️ Bu kombinasyon için test sesi bulunamadı! Önce Ayarlar → Test Ses Yönetimi bölümünden ses oluşturun.');
      return;
    }

    const testBlob = getTestAudioBlob(storyId, level, step);
    if (!testBlob) {
      alert('⚠️ Test ses dosyası okunamadı!');
      return;
    }

    console.log('[Recorder] 🧪 Test audio kullanılıyor, size:', testBlob.size);
    setIsProcessing(true);
    
    // Kısa bir gecikme ile gönder (gerçek kayıt gibi görünsün)
    setTimeout(() => {
      try {
        onSave(testBlob);
      } catch (error) {
        console.error('[Recorder] Test audio submit error:', error);
        alert('Test sesi gönderilirken hata oluştu.');
      } finally {
        setIsProcessing(false);
      }
    }, 500);
  };

  const startRecording = async () => {
    // Test audio aktifse, mikrofon yerine hazır sesi kullan
    if (testAudioActive) {
      useTestAudio();
      return;
    }

    try {
      console.log('[Recorder] Requesting microphone access...');
      
      if (!MediaRecorder) {
        alert('Bu tarayıcı ses kaydını desteklemiyor. Chrome, Firefox veya Edge kullanın.');
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Bu tarayıcı mikrofon erişimini desteklemiyor. HTTPS gerekli olabilir.');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      console.log('[Recorder] Microphone access granted');
      
      let options: MediaRecorderOptions = {};
      const testMimes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus', 
        'audio/mp4',
        'audio/aac',
        ''
      ];
      
      for (const mime of testMimes) {
        try {
          if (!mime || MediaRecorder.isTypeSupported(mime)) {
            if (mime) {
              options = { mimeType: mime, audioBitsPerSecond: 128000 };
            }
            console.log('[Recorder] Using MIME type:', mime || 'default');
            break;
          }
        } catch (e) {
          console.warn('[Recorder] MIME test failed for:', mime, e);
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.onerror = (event) => {
        console.error('[Recorder] MediaRecorder error:', event);
        alert('Kayıt s��rasında hata oluştu. Lütfen sayfayı yenileyin.');
        setIsRecording(false);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('[Recorder] Recording started');
        recordStartAtRef.current = Date.now();
        
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
        }
        
        keepAliveRef.current = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            try {
              mediaRecorder.requestData();
            } catch (e) {
              console.warn('[Recorder] requestData failed:', e);
            }
          }
        }, 1000);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
        }
        
        recordingTimerRef.current = setInterval(() => {
          const elapsed = Date.now() - (recordStartAtRef.current || Date.now());
          const remaining = Math.max(0, Math.ceil((recordingDurationMs - elapsed) / 1000));
          setRecordingTimeLeft(remaining);
        }, 100);

        if (autoSubmit) {
          if (autoSubmitTimerRef.current) {
            clearTimeout(autoSubmitTimerRef.current);
          }
          
          autoSubmitTimerRef.current = setTimeout(() => {
            console.log('[Recorder] Auto-submit triggered after', recordingDurationMs, 'ms');
            stopRecording();
          }, recordingDurationMs);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('[Recorder] Recording stopped');
        
        setIsRecording(false);
        setRecordingTimeLeft(null);
        
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mime });
        
        console.log('[Recorder] Final result - blob size:', audioBlob.size, 'mime:', mime);
        
        if (audioBlob.size === 0) {
          console.warn('[Recorder] Empty recording');
          alert('Kayıt alınamadı. Mikrofon izni verdiğinizden emin olun.');
          setIsProcessing(false);
        } else if (audioBlob.size < 500) {
          console.warn('[Recorder] Very short recording');
          alert('Kayıt çok kısa. En az 1-2 saniye konuşun.');
          setIsProcessing(false);
        } else {
          console.log('[Recorder] Valid recording, submitting...');
          setIsProcessing(true);
          try {
            onSave(audioBlob);
          } catch (error) {
            console.error('[Recorder] Submit error:', error);
            alert('Ses gönderilirken hata oluştu.');
          } finally {
            setIsProcessing(false);
          }
        }
        
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
        if (autoSubmitTimerRef.current) {
          clearTimeout(autoSubmitTimerRef.current);
          autoSubmitTimerRef.current = null;
        }
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
        
        stream.getTracks().forEach(track => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[Recorder] Error stopping track:', e);
          }
        });
        
        mediaRecorderRef.current = null;
        chunksRef.current = [];
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      
    } catch (error: any) {
      console.error('[Recorder] Error:', error);
      setIsRecording(false);
      
      if (error?.name === 'NotAllowedError') {
        alert('Mikrofon erişimi reddedildi. Lütfen tarayıcı ayarlarından mikrofon iznini açın.');
      } else if (error?.name === 'NotFoundError') {
        alert('Mikrofon bulunamadı. Mikrofonunuzun bağlı olduğundan emin olun.');
      } else if (error?.name === 'NotReadableError') {
        alert('Mikrofon kullanımda. Diğer uygulamaları kapatıp tekrar deneyin.');
      } else {
        alert('Mikrofon hatası: ' + (error?.message || 'Bilinmeyen hata'));
      }
    }
  };

  const stopRecording = () => {
    console.log('[Recorder] Stop requested');
    
    setIsRecording(false);
    setRecordingTimeLeft(null);
    
    if (!mediaRecorderRef.current) {
      console.log('[Recorder] No MediaRecorder instance');
      return;
    }
    
    const mr = mediaRecorderRef.current;
    
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    if (autoSubmitTimerRef.current) {
      clearTimeout(autoSubmitTimerRef.current);
      autoSubmitTimerRef.current = null;
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    
    try {
      if (mr.state === 'recording') {
        mr.requestData();
        mr.stop();
      }
    } catch (e) {
      console.error('[Recorder] Error stopping MediaRecorder:', e);
    }
  };

  useEffect(() => {
    return () => {
      if (keepAliveRef.current) clearInterval(keepAliveRef.current);
      if (autoSubmitTimerRef.current) clearTimeout(autoSubmitTimerRef.current);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, []);

  const displayTime = recordingTimeLeft !== null ? `${recordingTimeLeft}s` : '';

  return (
    <div className={`voice-recorder p-0 ${compact ? 'compact' : ''}`}>
      {/* Test Audio Aktif Göstergesi */}
      {testAudioActive && (
        <div className="mb-2 px-3 py-1.5 bg-yellow-100 border border-yellow-300 rounded-lg text-xs text-yellow-800 flex items-center gap-2">
          <TestTube className="w-4 h-4" />
          <span>🧪 Test modu: Hazır ses kullanılacak</span>
        </div>
      )}
      
      <div className="recording-controls">
        <button
          className={`record-button ${isRecording ? 'recording' : ''} ${testAudioActive ? 'test-mode' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {isRecording ? (
            <>
              <Square className="icon" />
              Kaydı Durdur
            </>
          ) : testAudioActive ? (
            <>
              <TestTube className="icon" />
              Test Sesi Gönder
            </>
          ) : (
            <>
              <Mic className="icon" />
              Kaydı Başlat
            </>
          )}
        </button>
        
        {isRecording && (
          <div className="recording-indicator">
            <div className="pulse-dot"></div>
            <div>Kayıt alınıyor... {displayTime}</div>
          </div>
        )}

        {isProcessing && (
          <div className="recording-indicator">
            <div className="pulse-dot"></div>
            <div>Gönderiliyor...</div>
          </div>
        )}
      </div>
    </div>
  );
}
