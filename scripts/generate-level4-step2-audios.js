import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Voice generator API endpoint
const VOICE_API_URL = 'https://arge.muhbirai.com/webhook/dost/voice-generator';

// Metinden dosya adı oluştur (örn: "yaşayışları hakkında" -> "yasayislari")
function getFileNameFromText(text) {
  // "Hikayeyi okuduk, [başlık] hakkında metinden..." formatından başlığı çıkar
  const match = text.match(/Hikayeyi okuduk, (.+?) hakkında/);
  if (match && match[1]) {
    let title = match[1].trim();
    // Türkçe karakterleri değiştir ve küçük harfe çevir
    title = title
      .toLowerCase()
      .replace(/ı/g, 'i')
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]/g, '-') // Özel karakterleri tire ile değiştir
      .replace(/-+/g, '-') // Birden fazla tireyi tek tire yap
      .replace(/^-|-$/g, ''); // Başta ve sonda tire varsa kaldır
    return `schema-${title}.mp3`;
  }
  // Eğer format uymazsa hash kullan
  return `schema-${crypto.createHash('md5').update(text).digest('hex').substring(0, 8)}.mp3`;
}

// Prompt metinleri - her hikaye ve şematik için
const prompts = {
  1: { // Kırıntıların Kahramanları
    1: "Hikayeyi okuduk, yaşayışları hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    2: "Hikayeyi okuduk, fiziksel özellikleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    3: "Hikayeyi okuduk, beslenmeleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    4: "Hikayeyi okuduk, çoğalmaları hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    5: "Hikayeyi okuduk, çevreye etkileri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver."
  },
  2: { // Avucumun İçindeki Akıllı Kutu
    1: "Hikayeyi okuduk, kullanım amaçları hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    2: "Hikayeyi okuduk, fiziksel özellikleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    3: "Hikayeyi okuduk, çalışma biçimleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    4: "Hikayeyi okuduk, üretimleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    5: "Hikayeyi okuduk, hayatımıza etkileri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver."
  },
  3: { // Çöl Şekerlemesi
    1: "Hikayeyi okuduk, yaşam koşulları hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    2: "Hikayeyi okuduk, fiziksel özellikleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    3: "Hikayeyi okuduk, çoğalmaları hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    4: "Hikayeyi okuduk, etkileri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver."
  },
  4: { // Turizmin İncisi
    1: "Hikayeyi okuduk, iklim özellikleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    2: "Hikayeyi okuduk, bitki örtüsü hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    3: "Hikayeyi okuduk, yeryüzü özellikleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    4: "Hikayeyi okuduk, ekonomik faaliyetler hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    5: "Hikayeyi okuduk, nüfus ve yerleşme hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver."
  },
  5: { // Çöl Gemisi
    1: "Hikayeyi okuduk, yaşayışları hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    2: "Hikayeyi okuduk, fiziksel özellikleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    3: "Hikayeyi okuduk, beslenmeleri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    4: "Hikayeyi okuduk, çoğalmaları hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver.",
    5: "Hikayeyi okuduk, çevreye etkileri hakkında metinden aklında kalanları özetle ve mikrofona tıklayarak cevabını ver."
  }
};

// Base64 string'i buffer'a çevir
function base64ToBuffer(base64String) {
  return Buffer.from(base64String, 'base64');
}

// API'ye istek gönder (fetch kullanarak)
async function generateAudio(text) {
  try {
    console.log(`   🔗 API'ye istek gönderiliyor: ${VOICE_API_URL}`);
    
    const response = await fetch(VOICE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    console.log(`   📡 API yanıt durumu: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API returned ${response.status}: ${errorText.substring(0, 200)}`);
    }

    const contentType = response.headers.get('content-type');
    console.log(`   📄 Content-Type: ${contentType}`);

    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      throw new Error(`API returned ${contentType} instead of JSON. Response: ${text.substring(0, 200)}...`);
    }

    const result = await response.json();
    
    if (result.audioBase64) {
      console.log(`   ✅ audioBase64 alındı (${result.audioBase64.length} karakter)`);
      return result.audioBase64;
    } else {
      throw new Error(`API response does not contain audioBase64. Response keys: ${Object.keys(result).join(', ')}`);
    }
  } catch (error) {
    if (error.message.includes('fetch')) {
      throw new Error(`Network error: ${error.message}`);
    }
    throw error;
  }
}

// Ana fonksiyon - Paralel isteklerle hızlandırılmış versiyon
async function generateAllAudios() {
  console.log('🚀 Script başlatılıyor...\n');
  
  const outputDir = path.join(__dirname, '..', 'public', 'audios', 'level4');
  console.log(`📁 Çıktı dizini: ${outputDir}\n`);
  
  // Output dizinini oluştur
  if (!fs.existsSync(outputDir)) {
    console.log('📂 Çıktı dizini oluşturuluyor...');
    fs.mkdirSync(outputDir, { recursive: true });
    console.log('✅ Dizin oluşturuldu\n');
  } else {
    console.log('✅ Çıktı dizini mevcut\n');
  }

  console.log('🎵 4. Seviye 2. Adım ses dosyaları oluşturuluyor...\n');
  console.log('⚡ Benzersiz metinler tespit ediliyor (aynı metinler tekrar oluşturulmayacak)...\n');
  const startTime = Date.now();

  // Önce benzersiz metinleri bul
  const uniqueTexts = new Map(); // text -> { filename, filepath }
  const textToFiles = new Map(); // text -> [{storyId, sectionId, originalFilename}]
  
  for (const [storyId, sections] of Object.entries(prompts)) {
    for (const [sectionId, text] of Object.entries(sections)) {
      if (!uniqueTexts.has(text)) {
        const filename = getFileNameFromText(text);
        const filepath = path.join(outputDir, filename);
        uniqueTexts.set(text, { filename, filepath });
        textToFiles.set(text, []);
      }
      const originalFilename = `schema-${storyId}-${sectionId}-prompt.mp3`;
      textToFiles.get(text).push({ storyId, sectionId, originalFilename });
    }
  }

  const totalUsage = Array.from(textToFiles.values()).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`📊 ${textToFiles.size} benzersiz metin bulundu (toplam ${totalUsage} kullanım)\n`);
  
  // Benzersiz metinleri listele
  console.log('📝 Benzersiz metinler:');
  for (const [text, { filename }] of uniqueTexts.entries()) {
    const usage = textToFiles.get(text).length;
    console.log(`   - ${filename} (${usage} yerde kullanılacak)`);
  }
  console.log('');

  // Sadece benzersiz metinler için görev oluştur
  const tasks = [];
  let skippedCount = 0;
  for (const [text, { filename, filepath }] of uniqueTexts.entries()) {
    // Dosya zaten varsa atla
    if (fs.existsSync(filepath)) {
      console.log(`⏭️  ${filename} zaten mevcut, atlanıyor...`);
      skippedCount++;
      continue;
    }
    tasks.push({ text, filename, filepath });
  }

  console.log(`📋 ${tasks.length} benzersiz dosya oluşturulacak`);
  if (skippedCount > 0) {
    console.log(`⏭️  ${skippedCount} dosya zaten mevcut, atlandı`);
  }
  console.log('⚡ Paralel isteklerle hızlandırılmış mod aktif (3 paralel istek)\n');
  
  if (tasks.length === 0) {
    console.log('✅ Tüm dosyalar zaten mevcut! Bağlantılar oluşturuluyor...\n');
  }

  let successCount = 0;
  let failCount = 0;
  let currentIndex = 0;

  // 3 paralel istek ile çalış
  const concurrency = 3;
  const workers = [];

  for (let i = 0; i < concurrency; i++) {
    workers.push(processTask());
  }

  async function processTask() {
    while (currentIndex < tasks.length) {
      const taskIndex = currentIndex++;
      if (taskIndex >= tasks.length) break;

      const task = tasks[taskIndex];
      try {
        const usageCount = textToFiles.get(task.text).length;
        console.log(`\n🎤 [${taskIndex + 1}/${tasks.length}] ${task.filename} oluşturuluyor...`);
        console.log(`   📌 ${usageCount} yerde kullanılacak`);
        console.log(`   📝 Metin: "${task.text.substring(0, 70)}..."`);
        console.log(`   ⏳ API'ye istek gönderiliyor...`);
        
        const requestStart = Date.now();
        const audioBase64 = await generateAudio(task.text);
        const requestTime = ((Date.now() - requestStart) / 1000).toFixed(1);
        
        console.log(`   ✅ API yanıtı alındı (${requestTime}s)`);
        console.log(`   💾 Dosya kaydediliyor...`);
        
        const audioBuffer = base64ToBuffer(audioBase64);
        fs.writeFileSync(task.filepath, audioBuffer);
        
        console.log(`✅ [${taskIndex + 1}/${tasks.length}] ${task.filename} başarıyla oluşturuldu! (${(audioBuffer.length / 1024).toFixed(2)} KB)`);
        successCount++;
      } catch (error) {
        console.error(`\n❌ [${taskIndex + 1}/${tasks.length}] ${task.filename} oluşturulurken hata:`);
        console.error(`   Hata: ${error.message}`);
        failCount++;
      }
    }
  }

  // Tüm worker'ların bitmesini bekle
  await Promise.all(workers);

  // Şimdi sembolik linkler veya kopyalar oluştur (her hikaye için orijinal dosya isimleri)
  console.log('\n🔗 Dosya bağlantıları oluşturuluyor...');
  let linkCount = 0;
  for (const [text, files] of textToFiles.entries()) {
    const { filename: sourceFilename } = uniqueTexts.get(text);
    const sourcePath = path.join(outputDir, sourceFilename);
    
    if (!fs.existsSync(sourcePath)) continue;
    
    for (const file of files) {
      const targetPath = path.join(outputDir, file.originalFilename);
      if (!fs.existsSync(targetPath)) {
        // Windows'ta copyFileSync kullan (sembolik link yerine)
        fs.copyFileSync(sourcePath, targetPath);
        linkCount++;
      }
    }
  }
  console.log(`✅ ${linkCount} dosya bağlantısı oluşturuldu\n`);

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('📊 Özet:');
  console.log(`  ✅ Benzersiz dosya: ${successCount}`);
  console.log(`  🔗 Toplam bağlantı: ${linkCount}`);
  console.log(`  ❌ Başarısız: ${failCount}`);
  console.log(`  ⏱️  Süre: ${duration} saniye`);
  console.log(`  📁 Dosyalar: ${outputDir}`);
}

// Script çalıştır
generateAllAudios().catch(console.error);

