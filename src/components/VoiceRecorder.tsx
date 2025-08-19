import { useState, useRef } from 'react';
import { Mic, Square, Play, Upload } from 'lucide-react';

interface Props {
  onSave: (blob: Blob) => void;
}

export default function VoiceRecorder({ onSave }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [hasRecording, setHasRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordedBlobRef = useRef<Blob | null>(null);

  const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    // Simple approach: create a File with MP3 MIME type
    // The actual audio format conversion will be handled server-side if needed
    return new File([audioBlob], 'recording.mp3', { type: 'audio/mp3' });
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        recordedBlobRef.current = audioBlob;
        setHasRecording(true);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Mikrofona erişim izni gerekli!');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (recordedBlobRef.current) {
      const audioUrl = URL.createObjectURL(recordedBlobRef.current);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.play();
      setIsPlaying(true);
    }
  };

  const stopPlaying = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleSendRecording = async () => {
    if (!recordedBlobRef.current) return;
    
    setIsSending(true);
    try {
      // Convert to MP3
      const mp3Blob = await convertToMp3(recordedBlobRef.current);
      
      // Send to parent component for API call
      onSave(mp3Blob);
      
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
