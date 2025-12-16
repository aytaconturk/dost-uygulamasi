import { getPlaybackRate } from '../components/SidebarSettings';

export async function playTts(text: string): Promise<void> {
  const res = await fetch("https://arge.aquateknoloji.com/webhook/dost/voice-generator", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`TTS isteği başarısız: ${res.status}`);

  const { audioBase64 } = await res.json() as { audioBase64: string };

  const byteStr = atob(audioBase64);
  const bytes = new Uint8Array(byteStr.length);
  for (let i = 0; i < byteStr.length; i++) bytes[i] = byteStr.charCodeAt(i);

  const blob = new Blob([bytes], { type: "audio/mpeg" });
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);

  // Apply playback rate
  audio.playbackRate = getPlaybackRate();

  return new Promise<void>((resolve, reject) => {
    audio.onended = () => {
      URL.revokeObjectURL(url);
      resolve();
    };
    
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Ses oynatılırken hata"));
    };

    audio.play().catch(err => {
      URL.revokeObjectURL(url);
      console.error("Ses oynatılırken hata:", err);
      reject(err);
    });
  });
}
