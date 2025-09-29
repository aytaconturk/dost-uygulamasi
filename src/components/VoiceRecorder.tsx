import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Upload, Download } from 'lucide-react';

interface Props {
  onSave: (blob: Blob) => void;
  onPlayStart?: () => void;
}

export default function VoiceRecorder({ onSave, onPlayStart }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);
  const recordStartAtRef = useRef<number | null>(null);
  const keepAliveRef = useRef<NodeJS.Timeout | null>(null);

  // Not converting on client; we'll keep original encoding and let server handle any conversion if needed.

  const startRecording = async () => {
    try {
      console.log('[Recorder] Requesting microphone access...');
      
      // Check if MediaRecorder is supported
      if (!MediaRecorder) {
        alert('Bu tarayıcı ses kaydını desteklemiyor. Chrome, Firefox veya Edge kullanın.');
        return;
      }

      // Check if getUserMedia is supported
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
      
      console.log('[Recorder] Microphone access granted, stream tracks:', stream.getTracks().length);
      
      // Test different mime types and pick the first working one
      let options: MediaRecorderOptions = {};
      const testMimes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus', 
        'audio/mp4',
        'audio/aac',
        '' // fallback to default
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

      // Add error handling
      mediaRecorder.onerror = (event) => {
        console.error('[Recorder] MediaRecorder error:', event);
        alert('Kayıt sırasında hata oluştu. Lütfen sayfayı yenileyin.');
        setIsRecording(false);
      };

      mediaRecorder.ondataavailable = (event) => {
        console.log('[Recorder] Data chunk received:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log('[Recorder] Recording started');
        recordStartAtRef.current = Date.now();
        
        // Clear any existing interval
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
        }
        
        // Force data chunks every second
        keepAliveRef.current = setInterval(() => {
          if (mediaRecorder.state === 'recording') {
            try {
              mediaRecorder.requestData();
            } catch (e) {
              console.warn('[Recorder] requestData failed:', e);
            }
          }
        }, 1000);
      };

      mediaRecorder.onstop = () => {
        console.log('[Recorder] Recording stopped via onstop');
        
        // Ensure UI is in stopped state
        setIsRecording(false);
        
        const totalChunks = chunksRef.current.length;
        const mime = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(chunksRef.current, { type: mime });
        
        console.log('[Recorder] Final result - chunks:', totalChunks, 'blob size:', audioBlob.size, 'mime:', mime);
        
        if (audioBlob.size === 0) {
          console.warn('[Recorder] Empty recording');
          alert('Kayıt alınamadı. Mikrofon izni verdiğinizden ve başka uygulama mikrofonu kullanmadığından emin olun.');
          setHasRecording(false);
        } else if (audioBlob.size < 500) {
          console.warn('[Recorder] Very short recording');
          alert('Kayıt çok kısa. En az 2-3 saniye konuşun.');
          setHasRecording(false);
        } else {
          recordedBlobRef.current = audioBlob;
          setHasRecording(true);
        }
        
        // Cleanup interval if still running
        if (keepAliveRef.current) {
          clearInterval(keepAliveRef.current);
          keepAliveRef.current = null;
        }
        
        // Stop all tracks
        stream.getTracks().forEach(track => {
          try {
            track.stop();
            console.log('[Recorder] Stopped track:', track.kind, track.label);
          } catch (e) {
            console.warn('[Recorder] Error stopping track:', e);
          }
        });
        
        // Clear references
        mediaRecorderRef.current = null;
        chunksRef.current = [];
      };

      // Start recording with timeslice for reliable chunks
      console.log('[Recorder] Starting MediaRecorder...');
      mediaRecorder.start(1000); // 1 second timeslice
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
    
    // Force UI state to show stopped immediately to prevent button hanging
    setIsRecording(false);
    
    if (!mediaRecorderRef.current) {
      console.log('[Recorder] No MediaRecorder instance');
      return;
    }
    
    const mr = mediaRecorderRef.current;
    console.log('[Recorder] MediaRecorder state:', mr.state);
    
    // Clean up interval immediately
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
      console.log('[Recorder] Keep-alive interval cleared');
    }
    
    try {
      if (mr.state === 'recording') {
        // Request final data
        mr.requestData();
        console.log('[Recorder] Final requestData called');
        
        // Stop immediately
        mr.stop();
        console.log('[Recorder] MediaRecorder.stop() called');
      } else {
        console.log('[Recorder] MediaRecorder not in recording state:', mr.state);
        // Force onstop if stuck
        if (mr.onstop) {
          setTimeout(() => mr.onstop!(new Event('stop') as any), 100);
        }
      }
    } catch (e) {
      console.error('[Recorder] Error stopping MediaRecorder:', e);
      // Force cleanup if error
      recordedBlobRef.current = new Blob(chunksRef.current, { type: 'audio/webm' });
      setHasRecording(recordedBlobRef.current.size > 0);
    }
  };

  const playRecording = () => {
    if (!recordedBlobRef.current) return;
    const el = audioRef.current;
    if (!el) return;

    const audioUrl = URL.createObjectURL(recordedBlobRef.current);
    el.src = audioUrl;
  // Ensure inline playback on mobile browsers
  // @ts-ignore - playsInline is supported on HTMLMediaElement in modern browsers
  el.playsInline = true;
    el.muted = false;
    el.onended = () => {
      setIsPlaying(false);
      URL.revokeObjectURL(audioUrl);
    };
    // Stop other audios (global)
    try {
      window.dispatchEvent(new Event('STOP_ALL_AUDIO' as any));
    } catch {}
    onPlayStart?.();
    el.play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        console.error('Audio play error:', err);
        const msg = err?.name === 'NotAllowedError'
          ? 'Tarayıcı otomatik çalmayı engelledi. Lütfen "Dinle" butonuna tekrar basın.'
          : err?.name === 'NotSupportedError'
          ? 'Bu ses formatı tarayıcınız tarafından desteklenmiyor olabilir. Chrome/Edge ile deneyin.'
          : 'Ses çalınamadı. Lütfen tekrar deneyin.';
        alert(msg);
      });
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  // Download helpers
  const getExtensionForMime = (mime: string) => {
    if (!mime) return 'webm';
    if (mime.includes('ogg')) return 'ogg';
    if (mime.includes('mp4')) return 'm4a';
    if (mime.includes('aac')) return 'aac';
    if (mime.includes('webm')) return 'webm';
    return 'webm';
  };

  const handleDownload = () => {
    const blob = recordedBlobRef.current;
    if (!blob) return;
    if (blob.size === 0) {
      alert('Kayıt dosyası boş görünüyor. Lütfen yeniden kaydedin.');
      return;
    }
    const ext = getExtensionForMime(blob.type || 'audio/webm');
    const ts = new Date();
    const pad = (n: number) => `${n}`.padStart(2, '0');
    const filename = `kayit-${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.${ext}`;
    // Old Edge/IE fallback
    // @ts-ignore
    if (window.navigator && window.navigator.msSaveOrOpenBlob) {
      // @ts-ignore
      window.navigator.msSaveOrOpenBlob(blob, filename);
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    // Important: do NOT revoke immediately; some browsers need the URL alive during download
    setTimeout(() => {
      try { URL.revokeObjectURL(url); } catch {}
      a.remove();
    }, 4000);
  };

  useEffect(() => {
    const handleStopAll = () => {
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {}
      }
      setIsPlaying(false);
    };
    window.addEventListener('STOP_ALL_AUDIO' as any, handleStopAll);
    return () => {
      window.removeEventListener('STOP_ALL_AUDIO' as any, handleStopAll);
    };
  }, []);

  const handleSendRecording = async () => {
    if (!recordedBlobRef.current) return;
    
    setIsSending(true);
    try {
      // Send original blob (keep codec/mime); server will transcode if needed
      console.log('[Recorder] send -> size:', recordedBlobRef.current.size, 'type:', recordedBlobRef.current.type);
      if (recordedBlobRef.current.size < 2000) {
        alert('Kayıt dosyası çok küçük görünüyor. Lütfen tekrar kaydedip en az 1-2 saniye konuşun.');
        setIsSending(false);
        return;
      }
      onSave(recordedBlobRef.current);
      
      // Reset recording state
      setHasRecording(false);
      recordedBlobRef.current = null;
    } catch (error) {
      console.error('Error converting to MP3:', error);
      alert('Ses dosyası işlenirken hata oluştu!');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="voice-recorder">
      {/* Hidden audio element for reliable playback */}
      <audio ref={audioRef} preload="auto" style={{ display: 'none' }} />
      <div className="recording-controls">
        {!hasRecording ? (
          <div className="recording-section">
            <button
              className={`record-button ${isRecording ? 'recording' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isSending}
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
                Kayıt alınıyor...
              </div>
            )}
          </div>
        ) : (
          <div className="playback-section">
            <button
              className="play-button"
              onClick={isPlaying ? stopPlaying : playRecording}
              disabled={isSending}
            >
              {isPlaying ? (
                <>
                  <Square className="icon" />
                  Durdur
                </>
              ) : (
                <>
                  <Play className="icon" />
                  Dinle
                </>
              )}
            </button>
            
            <button
              className="download-button"
              onClick={handleDownload}
              disabled={isSending || !recordedBlobRef.current}
            >
              <Download className="icon" />
              İndir
            </button>
            
            <button
              className="send-button"
              onClick={handleSendRecording}
              disabled={isSending}
            >
              <Upload className="icon" />
              {isSending ? 'Gönderiliyor...' : 'Gönder'}
            </button>
            
            <button
              className="restart-button"
              onClick={() => {
                setHasRecording(false);
                recordedBlobRef.current = null;
              }}
              disabled={isSending}
            >
              Tekrar Kaydet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
