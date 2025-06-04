import { useState } from 'react';
import { ReactMic } from 'react-mic';

type AudioBlob = Blob | null;

interface Props {
  onSave: (blob: AudioBlob) => void;
}

export default function VoiceRecorder({ onSave }: Props) {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div>
      <ReactMic
        record={isRecording}
        onStop={(recordedBlob) => onSave(recordedBlob.blob)}
        mimeType="audio/mp3"
      />
      <button onClick={() => setIsRecording(!isRecording)}>
        {isRecording ? '⏹ Durdur' : '🎤 Kaydı Başlat'}
      </button>
    </div>
  );
}