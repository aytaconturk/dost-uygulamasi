import { useState, useRef, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';

interface Props {
  onSave: (blob: Blob) => void;
  onPlayStart?: () => void;
  recordingDurationMs?: number;
  autoSubmit?: boolean;
}

export default function VoiceRecorder({ onSave, onPlayStart, recordingDurationMs = 10000, autoSubmit = true }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordStartAtRef = useRef<number | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
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
    <div className="voice-recorder">
      <div className="recording-controls">
        <button
          className={`record-button ${isRecording ? 'recording' : ''}`}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
        >
          {isRecording ? (
            <>
              <Square className="icon" />
              Kaydı Durdur
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
