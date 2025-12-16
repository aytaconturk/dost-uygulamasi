// Test script for voice-generator API
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const text = "Hedefine ulaşıp ulaşmadığına göre DOST ödülünü yönetecek. Aşağıya istediğin ödülü yaz: görsel, şarkı, hikâye, rozet, sticker vb.";

console.log('🎤 Ses dosyası oluşturuluyor...');
console.log('📝 Metin:', text);
console.log('');

async function generateAndPlayAudio() {
  try {
    // API'ye istek gönder
    const res = await fetch("https://arge.aquateknoloji.com/webhook/dost/voice-generator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      throw new Error(`API isteği başarısız: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    
    if (!data.audioBase64) {
      throw new Error('API yanıtında audioBase64 bulunamadı');
    }

    console.log('✅ Ses dosyası oluşturuldu!');
    console.log('📦 Base64 uzunluğu:', data.audioBase64.length, 'karakter');
    console.log('');
    console.log('💾 Ses dosyasını kaydetmek için:');
    console.log('   Base64 verisi alındı, şimdi çalınıyor...');
    console.log('');

    // Base64'ü binary'ye çevir
    const byteStr = Buffer.from(data.audioBase64, 'base64');
    
    // Dosyaya kaydet
    const outputPath = join(__dirname, '..', 'public', 'audios', 'odul-prompt.mp3');
    
    // Dizin yoksa oluştur
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    
    writeFileSync(outputPath, byteStr);
    console.log(`✅ Ses dosyası kaydedildi: ${outputPath}`);
    console.log('');
    console.log('🎵 Dosya hazır! Tarayıcıda şu URL ile çalabilirsiniz:');
    console.log(`   /audios/odul-prompt.mp3`);
    console.log('');
    console.log('💡 Tarayıcıda test etmek için:');
    console.log('   const audio = new Audio("/audios/odul-prompt.mp3");');
    console.log('   audio.play();');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.stack) {
      console.error('Stack:', error.stack);
    }
    process.exit(1);
  }
}

generateAndPlayAudio();

