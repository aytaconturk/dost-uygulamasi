import { useEffect, useMemo, useRef, useState } from 'react';

export default function L5Step2() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [request, setRequest] = useState('');
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const l3 = useMemo(() => {
    try { const raw = localStorage.getItem('level3_result'); return raw ? JSON.parse(raw) : null; } catch { return null; }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    const base = l3 ? `Üçüncü okumadaki hızın ${l3.wpm} sözcük/dk idi ve hedefin ${l3.targetWPM} idi. ` : '';
    const text = base + (l3 && l3.wpm >= l3.targetWPM ? 'Hedefine ulaştın, ödülü hak ettin!' : 'Hedefine ulaşamadın; ama pes yok, bir sonraki oturumda başarabilirsin.');
    const speak = () => { if ('speechSynthesis' in window) { const u = new SpeechSynthesisUtterance(text); u.lang = 'tr-TR'; u.rate = 0.95; u.pitch = 1; window.speechSynthesis.speak(u); } };
    if (el) { try { el.src = '/src/assets/audios/level5/seviye-5-adim-2-fable.mp3'; // optional
      // @ts-ignore
      el.playsInline = true; el.muted = false; el.play().catch(speak); } catch { speak(); } } else { speak(); }
  }, [l3]);

  const generateSticker = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 600; canvas.height = 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // background
    const grad = ctx.createLinearGradient(0,0,600,600);
    grad.addColorStop(0,'#7c4dff'); grad.addColorStop(1,'#b388ff');
    ctx.fillStyle = grad; ctx.fillRect(0,0,600,600);
    // medal circle
    ctx.fillStyle = '#ffd54f'; ctx.beginPath(); ctx.arc(300,260,180,0,Math.PI*2); ctx.fill();
    // text
    ctx.fillStyle = '#512DA8'; ctx.font = 'bold 28px sans-serif';
    const lines = (request || 'Okuma Kahramanı').slice(0,60).split(/\s+/).reduce((acc:string[],w)=>{
      const last = acc[acc.length-1]||''; const test = (last?last+' ':'')+w; if (test.length>18) acc.push(w); else acc[acc.length-1]=test; return acc;
    }, ['']);
    lines.forEach((ln,i)=>{ ctx.fillText(ln, 300 - ctx.measureText(ln).width/2, 260 + i*32); });
    ctx.fillStyle = '#fff'; ctx.font = 'bold 80px sans-serif'; ctx.fillText('★', 285, 160);
    const url = canvas.toDataURL('image/png');
    setResultUrl(url);
    setMessage('Ödülün hazır! Dilersen indir.');
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <audio ref={audioRef} preload="auto" />
      <h2 className="text-2xl font-bold text-purple-800 mb-3">2. Adım: Hedefe bağlı ödül</h2>

      <div className="bg-white rounded-xl shadow p-5">
        <p className="text-gray-800 mb-3">Hedefine ulaşıp ulaşmadığına göre DOST ödülünü yönetecek. Aşağıya istediğin ödülü yaz: görsel, şarkı, hikâye, rozet, sticker vb.</p>
        <div className="flex gap-2 items-center">
          <input value={request} onChange={e=>setRequest(e.target.value)} placeholder="Ör: Okuma Kahramanı rozeti" className="flex-1 border rounded px-3 py-2" />
          <button onClick={generateSticker} className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Oluştur</button>
        </div>
        {message && <p className="text-green-700 mt-3">{message}</p>}
        {resultUrl && (
          <div className="mt-4 flex flex-col items-center">
            <img src={resultUrl} alt="Ödül" className="w-56 h-56 rounded-xl shadow" />
            <a href={resultUrl} download="odul.png" className="mt-3 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">İndir</a>
          </div>
        )}
      </div>
    </div>
  );
}
