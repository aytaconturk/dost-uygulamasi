const axios = require('axios');
const fs = require('fs');
const path = require('path');

const API_BASE = 'https://arge.aquateknoloji.com/webhook';

// Level 3 completion metni
const text = 'Tebrikler! 3. seviyeyi başarıyla tamamladın. Model okuma yaparak güzel okuma kurallarını öğrendin, üçüncü okumanda okuma hızını ölçtün ve hedefine ulaşıp ulaşamadığını kontrol ettin. Harika bir iş çıkardın!';

async function generateAudio() {
  try {
    console.log('🎵 Ses oluşturuluyor...');
    console.log('📝 Metin:', text);
    
    const response = await axios.post(
      `${API_BASE}/dost/voice-generator`,
      { text },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const { audioBase64 } = response.data;
    
    if (!audioBase64) {
      throw new Error('API\'den audioBase64 gelmedi');
    }

    // Base64'ü buffer'a çevir
    const audioBuffer = Buffer.from(audioBase64, 'base64');
    
    // Dosya yolları
    const publicPath = path.join(__dirname, '../public/audios/level3/seviye-3-tamamlandi.mp3');
    const assetsPath = path.join(__dirname, '../src/assets/audios/level3/seviye-3-tamamlandi.mp3');
    
    // Dizinleri oluştur
    [publicPath, assetsPath].forEach(filePath => {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
    
    // Dosyaları kaydet
    fs.writeFileSync(publicPath, audioBuffer);
    fs.writeFileSync(assetsPath, audioBuffer);
    
    console.log('✅ Ses dosyası oluşturuldu!');
    console.log('📁 Public:', publicPath);
    console.log('📁 Assets:', assetsPath);
    console.log('📊 Dosya boyutu:', (audioBuffer.length / 1024).toFixed(2), 'KB');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
    if (error.response) {
      console.error('📥 API Yanıtı:', error.response.data);
    }
    process.exit(1);
  }
}

generateAudio();

