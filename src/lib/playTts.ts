export async function playTts(text: string) {
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

  audio.play()
    .catch(err => {
      console.error("Ses oynatılırken hata:", err);
    })
    .finally(() => {
      audio.onended = () => URL.revokeObjectURL(url);
    });

  return audio;
}
