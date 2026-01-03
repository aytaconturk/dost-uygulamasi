import { useState, useEffect, useContext } from 'react';
import { StepContext } from '../contexts/StepContext';

const VOICE_API_URL = 'https://arge.aquateknoloji.com/webhook/dost/voice-generator';

// IndexedDB Constants
const DB_NAME = 'DostTestAudioDB';
const DB_VERSION = 1;
const AUDIO_STORE_NAME = 'audioFiles';

// LocalStorage keys - Sadece metin ve checkbox için
const getStorageKey = (storyId: number, level: number, step: number) => 
  `test_audio_${storyId}_level${level}_step${step}`;

const getTextStorageKey = (storyId: number, level: number, step: number) => 
  `test_audio_text_${storyId}_level${level}_step${step}`;

const getCheckboxStorageKey = (storyId: number, level: number, step: number) => 
  `test_audio_enabled_${storyId}_level${level}_step${step}`;

// Global checkbox key (kullanıcı her girdiğinde false olsun)
const GLOBAL_USE_TEST_AUDIO_KEY = 'use_test_audio_global';

// IndexedDB fonksiyonları
const initIndexedDB = async (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        console.error('❌ IndexedDB açılırken hata:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(AUDIO_STORE_NAME)) {
          db.createObjectStore(AUDIO_STORE_NAME, { keyPath: 'id' });
          console.log('✅ IndexedDB object store oluşturuldu');
        }
      };
    } catch (err) {
      console.error('❌ IndexedDB init hatası:', err);
      reject(err);
    }
  });
};

const saveAudioToIndexedDB = async (storyId: number, level: number, step: number, base64: string): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    const id = `${storyId}_${level}_${step}`;
    
    const data = {
      id,
      storyId,
      level,
      step,
      base64,
      timestamp: Date.now()
    };
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => {
        console.log(`✅ Ses IndexedDB'ye kaydedildi: ${id}`);
        resolve();
      };
      request.onerror = () => {
        console.error(`❌ IndexedDB kayıt hatası: ${id}`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('❌ saveAudioToIndexedDB hatası:', err);
    throw err;
  }
};

const getAudioFromIndexedDB = async (storyId: number, level: number, step: number): Promise<string | null> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction([AUDIO_STORE_NAME], 'readonly');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    const id = `${storyId}_${level}_${step}`;
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => {
        const result = request.result;
        if (result && result.base64) {
          console.log(`✅ Ses IndexedDB'den alındı: ${id}`);
          resolve(result.base64);
        } else {
          resolve(null);
        }
      };
      request.onerror = () => {
        console.error(`❌ IndexedDB okuma hatası: ${id}`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('❌ getAudioFromIndexedDB hatası:', err);
    return null;
  }
};

const deleteAudioFromIndexedDB = async (storyId: number, level: number, step: number): Promise<void> => {
  try {
    const db = await initIndexedDB();
    const transaction = db.transaction([AUDIO_STORE_NAME], 'readwrite');
    const store = transaction.objectStore(AUDIO_STORE_NAME);
    const id = `${storyId}_${level}_${step}`;
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => {
        console.log(`✅ Ses IndexedDB'den silindi: ${id}`);
        resolve();
      };
      request.onerror = () => {
        console.error(`❌ IndexedDB silme hatası: ${id}`, request.error);
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('❌ deleteAudioFromIndexedDB hatası:', err);
    throw err;
  }
};

export interface TestAudioConfig {
  storyId: number;
  level: number;
  step: number;
  text: string;
  audioBase64: string | null;
  enabled: boolean;
}

// Dışarıdan erişilebilir fonksiyonlar
export function isTestAudioEnabled(storyId: number, level: number, step: number): boolean {
  try {
    const key = getCheckboxStorageKey(storyId, level, step);
    return localStorage.getItem(key) === 'true';
  } catch {
    return false;
  }
}

export async function getTestAudioBlob(storyId: number, level: number, step: number): Promise<Blob | null> {
  try {
    // Önce IndexedDB'den oku
    const base64 = await getAudioFromIndexedDB(storyId, level, step);
    if (!base64) return null;
    
    // Base64'ü Blob'a çevir
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: 'audio/mp3' });
  } catch (err) {
    console.error('Test audio blob alınırken hata:', err);
    return null;
  }
}

export async function hasTestAudio(storyId: number, level: number, step: number): Promise<boolean> {
  try {
    const base64 = await getAudioFromIndexedDB(storyId, level, step);
    return base64 !== null;
  } catch {
    return false;
  }
}

// Level/Step seçenekleri
const LEVEL_STEPS: { level: number; steps: { step: number; name: string }[] }[] = [
  { 
    level: 1, 
    steps: [
      { step: 1, name: 'Görsel İnceleme' },
      { step: 2, name: 'Başlık İnceleme' },
      { step: 3, name: 'Cümle Okuma' },
      { step: 4, name: 'Okuma Amacı' },
    ]
  },
  { 
    level: 2, 
    steps: [
      { step: 1, name: 'Birinci Okuma' },
      { step: 2, name: 'Okuma Hızı' },
      { step: 3, name: 'Hedef Belirleme' },
    ]
  },
  { 
    level: 3, 
    steps: [
      { step: 1, name: 'Model Okuma' },
      { step: 2, name: 'Üçüncü Okuma' },
      { step: 3, name: 'Performans' },
    ]
  },
  { 
    level: 4, 
    steps: [
      { step: 1, name: 'Beyin Fırtınası' },
      { step: 2, name: 'Özetleme' },
    ]
  },
  { 
    level: 5, 
    steps: [
      { step: 1, name: 'Anlama Soruları' },
      { step: 2, name: 'Ödül' },
      { step: 3, name: 'Sonlandırma' },
    ]
  },
];

const STORIES = [
  { id: 1, name: 'Kırıntıların Kahramanları' },
  { id: 2, name: 'Avucumun İçindeki Akıllı Kutu' },
  { id: 3, name: 'Hurma Ağacı' },
  { id: 4, name: 'Akdeniz Bölgesi' },
  { id: 5, name: 'Çöl Gemisi' },
];

// Örnek test metinleri - Her storyId, level, step için default metin
const DEFAULT_TEST_TEXTS: Record<string, string> = {
  // Level 1 - Tahmin Stratejileri
  '1_1_1': 'Bu resimde kar-karıncalar görüyorum. Onlar çok çalışkan hayvanlar. Sanırım bu hikaye karıncaların yaşamını anlatacak.',
  '1_1_2': 'Başlıkta kırıntı kelimesi var. Belki de karıncalar kırıntı topluyorlar. Bu hikaye yemek hakkında olabilir.',
  '1_1_3': 'Karıncalar küçük ama güçlü hayvanlardır. Onlar birlikte çalışırlar ve yuvalarını temiz tutarlar.',
  '1_1_4': 'Bu metni okumaktaki amacım karıncaların nasıl yaşadığını öğrenmek. Onların toplumsal yaşamlarını merak ediyorum.',
  
  '2_1_1': 'Telefon benim en sevdiğim aletim. Her gün kullanıyorum ama içinde neler olduğunu bilmiyorum.',
  '2_1_2': 'Akıllı telefon başlığı ilginç. Sanırım bu metin telefonların içindeki teknolojiden bahsedecek.',
  '2_1_3': 'Telefonlar günümüzün en önemli iletişim araçlarıdır. İçlerinde çok küçük parçalar vardır.',
  '2_1_4': 'Bu metni okurken telefonların nasıl çalıştığını anlamak istiyorum.',
  
  '3_1_1': 'Hurma ağacı sıcak bölgelerde yetişir. Meyveleri çok tatlıdır ve insanlar onu severler.',
  '3_1_2': 'Hurma Ağacı başlığını görünce sıcak çölleri düşündüm. Bu ağaç muhtemelen çöl ikliminde yaşar.',
  '3_1_3': 'Hurma ağaçları uzun boyludur. Yaprakları büyük ve geniştir. Meyveleri salkım salkım yetişir.',
  '3_1_4': 'Bu metni okurken hurma ağacının özelliklerini ve faydalarını öğrenmek istiyorum.',
  
  '4_1_1': 'Akdeniz bölgesi Türkiye\'nin güney kıyılarında yer alır. İklimi ılıman ve yağışlıdır.',
  '4_1_2': 'Akdeniz Bölgesi başlığı coğrafya ile ilgili. Sanırım bu bölgenin özellikleri anlatılacak.',
  '4_1_3': 'Akdeniz bölgesinde yazlar sıcak ve kurak, kışlar ılık ve yağışlı geçer.',
  '4_1_4': 'Bu metni okurken Akdeniz bölgesinin coğrafi özelliklerini öğrenmek istiyorum.',
  
  '5_1_1': 'Develer çölün gemileri olarak bilinir. Çünkü onlar çölde uzun mesafeler kat edebilirler.',
  '5_1_2': 'Çöl Gemisi başlığı ilginç bir benzetme. Sanırım develerden bahsedilecek.',
  '5_1_3': 'Develer hörgüçlerinde su ve yağ depolayabilirler. Bu özellik onların susuz kalmasını sağlar.',
  '5_1_4': 'Bu metni okurken develerin çöl şartlarına nasıl uyum sağladığını öğrenmek istiyorum.',
  
  // Level 2 - İlk Okuma ve Hız (TÜM HİKAYE METİNLERİ)
  '1_2_1': '"Karınca gibi çalışkan" ne demek? Sen hiç karınca yuvası gördün mü? Karıncaların yaşamı nasıldır? Haydi, bu soruların cevaplarını birlikte öğrenelim! Karıncaların yaşayışlarıyla başlayalım. Karıncalar çok çalışkan hayvanlardır. Onlar oldukça hızlı hareket eder. Küçük gruplar hâlinde yuvalarda yaşar. Minik dostlarımız bir ekip olarak çalışır, işbirliğine önem verir. Karıncaları her yerde görebilirsin. Mutfakta, ağaç köklerinde, taşların ve toprağın altında... Buralara yuva yaparlar. Şimdi bir karıncanın şekli nasıldır, bunu öğrenelim? Kocaman bir başı, uzun bir gövdesi vardır. Karıncalar genellikle siyah, kahverengi ya da kırmızı renktedir. Ayakları altı tanedir. İki tane anteni vardır. Bazı karıncalar kanatlıdır. Peki, sence karıncalar nasıl beslenir? Eğer cevabın şeker ise doğru! Genellikle şekerli yiyecekler yer. Yere düşmüş tüm kırıntılara bayılır. Aynı zamanda bitkileri de yer. Kocaman bir ekmek parçasını bir sürü küçük karıncanın taşıdığını görebilirsin. Küçüktürler ama yaptıkları işler çok büyüktür. Peki, onlar nasıl çoğalır? Şimdi bunun cevabına bakalım. Karıncalar, yumurtlayarak çoğalır. Kraliçe karınca yılda 50 milyon yumurta yapabilir. Bu bir kova kumdan bile daha fazladır. İnanılmaz değil mi? Karıncaların çevreye olan etkilerini hiç düşündün mü? Küçük karıncalar, doğaya büyük faydalar sağlar. Onlar toprakları havalandırır. Ağaçlara zarar veren böcekleri yer. Tıpkı bir postacı gibi bitkilerin tohumunu dağıtır. Bu canlılar, bazen zararlı da olabilir. Bazen insanlar ısırır. Bu durum kaşıntı yapabilir. Bazen de tifüs ve verem gibi hastalıkları yayabilir. Küçük dostlarımızı artık çok iyi biliyorsun. Onlara bugün bir küp şeker ısmarlamaya ne dersin?',
  '1_2_2': 'Karıncalar toplu halde yaşarlar ve birlikte çalışırlar. Kraliçe karınca yumurtlar. İşçi karıncalar yiyecek toplar.',
  '1_2_3': 'Bu adımda dakikada en az 80 kelime okumayı hedefliyorum. Akıcı ve anlaşılır okumaya çalışacağım.',
  
  '2_2_1': 'Hey! Akıllı telefonlar hakkında neler biliyorsun? Bu icatla ilgili bir maceraya hazır mısın? Şimdi birlikte keşfetme zamanı! Önce akıllı telefonun kullanım amaçlarına bakalım. Bu telefonlar birçok amaç için kullanılır. Örneğin iletişim kurarsın. Aramalar, mesajlaşmalar, videolu görüşmeler yaparsın. Önemli bilgilere tek tuşla erişirsin. Tabi ki eğlenmek için de kullanırsın. Oyunlar oynarsın. Müzik dinlersin. Video izlersin. Fotoğraf çekersin. Hatta bir film bile çekebilirsin. Haydi, şimdi akıllı telefonların şekil ve boyutlarına bakalım. Genellikle telefonlar dikdörtgendir. Bazı telefonlar katlanabilir. Evet, yanlış okumadın. Tıpkı bir kâğıt gibi katlanır. Hepsi cebine sığacak boydadır. Hafif ve rahat kullanıma sahiptir. Hem ön hem arka kameraları vardır. Alt tarafında hoparlör ve mikrofon bulunur. Peki, nasıl çalışır? Hiç merak ettin mi? Bu cihazlar elektrik enerjisi kullanır. Bir batarya ile çalışır. Dokunmatik ekran ile kontrol edilir. Sinyalleri alır. Ardından bu sinyalleri işler. Daha sonra iletir. İnternet bağlantısı da böyle sağlanır. Şimdi de üretimlerine bakalım. Bu cihazlar özel fabrikalarda üretilir. Akıllı telefonlar önce tasarlanır, yani nasıl görüneceğine karar verilir. Sonra ekran, pil ve kamera gibi parçalar laboratuvarda birleştirilir. Daha sonra telefonun çalışmasını sağlayan yazılımlar yüklenir. Son olarak her şeyin düzgün çalışıp çalışmadığı test edilir. Akıllı telefonların insanların hayatına farklı etkileri vardır. Bu cihazlar hayatımızı oldukça kolaylaştırır. Âdeta iletişim, eğlence ve bilgi edinme küçücük bir kutuya sıkıştırılmıştır! Akıllı bir kutu gibi! Ancak aşırı kullanımda göz sağlığın etkilenebilir. Bu nedenle onu ihtiyacın kadar kullanmalısın.',
  '2_2_2': 'Akıllı telefonlar modern teknolojinin harikasıdır. Ekranı, kamerası, işlemcisi gibi birçok bileşeni vardır.',
  '2_2_3': 'Hedefim bu metni dakikada 90 kelime hızında okuyabilmek.',
  
  '3_2_1': 'Hey! Sana bir meyvenin ismini vermeden anlatayım, sen hangi meyve olduğunu tahmin et. Buruşuk, tatlı, kahverengi renkte bir meyvedir. Birçok çeşidi vardır. Özellikle Ramazan ayında tüketilir. Sence bu hangi meyvedir? Cevabın hurmaysa doğru bildin! Haydi şimdi hurmaların yetiştiği hurma ağacını tanıyalım! Hurmanın yaşam koşulları ile başlayalım. Hurmalar, çok sıcak olan çöl ikliminde yetişir. Yani sıcağı çok sever. Ülkemizde ise Akdeniz Bölgesi\'nde olur. Hurma meyvesi ağaçta yetişir. Hurma ağaçları çok uzundur. Ayrıca hurma ağaçları kuraklığa dayanıklıdır. Ancak meyvelerini verirken suya ihtiyaç duyar. Hurma meyvesi salkım şeklinde hurma ağacının dallarından sallanır. Şimdi de hurma ağaçlarının görünümlerine bakalım. Hurma ağacı; gövde, yaprak ve meyve olmak üzere üç kısımdan oluşur. Bu ağaç, palmiyeye benzer. Özellikle uzun gövdesiyle dikkat çeker. En güzel yanları, meyveleridir tabii ki! Bu meyveler, şekerlemeye benzer, çok da lezzetlidir. Meyvenin içinde çekirdek bulunur. Hurma ağaçlarının yaprakları uzun ve küçüktür. Bu yapraklardan da çay yapılır. Hurma ağaçlarının nasıl çoğaldığını bilmek ister misin? İstersen çekirdeğini ekerek çoğalmasını sağlarsın. İstersen hurma ağacının gövdesinden çıkan filizleri ekersin. Bir hurma ağacı yaklaşık 70 yıl yaşar. Yeter ki hava soğuk olmasın! Son olarak hurmanın çevreye etkisine bakalım. Hurma ağacının yaprak ve gövdesiyle çeşitli eşyalar yapılır. Hurma meyvesi çok faydalıdır; en önemli yararlarından biri kemikleri güçlendirmesidir. Hurma meyvesi ise, beynimizin ve kalbimizin sağlığı için çok faydalıdır. Ancak çok tüketilirse baş ağrısı yapabilir.',
  '3_2_2': 'Hurma ağaçları yüksek boylu ve dayanıklı ağaçlardır. Sıcak iklimlerde kolayca büyürler.',
  '3_2_3': 'Bu metni düzgün telaffuz ederek ve doğru noktalamaya dikkat ederek okumayı planlıyorum.',
  
  '4_2_1': 'Hey! Sana bir sorum var: Turizmin incisi olarak bilinen bölgemiz hangisidir? Tabii ki, Akdeniz Bölgesi. Haydi, birlikte Akdeniz\'i keşfedelim. Akdeniz bölgesinin iklimi ile başlayalım. Bu bölgede Akdeniz iklimi görülür. Bu iklimde yazları sıcak ve kuraktır. Kışları ise ılık ve yağışlıdır. Don olayları nadiren yaşanır. En fazla yağış kış mevsiminde düşer. Bazen ani ve aşırı yağmurlar da görülebilir. Bu ani ve aşırı yağmurlar, bir doğal afet olan sele sebep olabilir. Peki, sence bu bölgenin bitki örtüsü nasıldır? Akdeniz Bölgesi\'nin bitki örtüsü makidir. Makiler, kısa boylu ağaçlardır. Maki türleri arasında mersin, keçiboynuzu, defne vardır. Bu bölgede bolca zeytin ve portakal ağaçları da bulunur. Sırada bölgenin yeryüzü şekilleri var. Akdeniz, dağlık ve engebelidir. Bu bölgede engebeli ve sulak araziler olduğu için dağınık yerleşim görülür. Bölgeyi dağlar ve yüksek platolar oluşturur. Ayrıca bu bölgede kırmızı renkli topraklar bulunur. Bu topraklar verimlidir. Akdeniz\'in sıcak ve tuzlu bir denizi vardır. Akdeniz bölgesi gelirini tarım ve turizmden elde eder. Tarım iç bölgelerde yapılır. Zeytinlerden lezzetli zeytinyağı yapılır. Portakallar ve limonlar üretilir. Bu ürünlerden büyük gelir elde edilir. Diğer bir gelir kaynağı olan turizm bölgenin başlıca kaynağıdır. Deniz, güneş ve turkuaz kıyılar turistler için burayı cazip kılar. Ayrıca antik kentler ve güzel doğal güzellikleri tanıtmak için birçok insan burayı ziyaret eder. Bölgenin nüfusu yaklaşık 11 milyona yakındır. Bölgede yaşayan insanların çoğunluğu kentlerde yaşamaktadır. Sen de burada yaşamak ister miydin?',
  '4_2_2': 'Bölgede zeytincilik, turizm ve seracılık yapılır. Deniz ürünleri bolca bulunur.',
  '4_2_3': 'Hedefim metni doğru telaffuzla ve uygun hızda okuyabilmek.',
  
  '5_2_1': 'Çöl Gemisi deyince aklına ne geliyor? Şimdi birlikte bu sorunun cevabını öğreneceğiz. Hazır mısın? Çöl gemilerinin ne olduğu ve nasıl yaşadığı ile başlayalım. Çöl gemisi, develere verilen bir isimdir. Çünkü develer genellikle çöl ikliminde yaşar. Çöl zorlu bir iklimdir. Yani, develer zorlu iklim koşullarında yaşayabilir. Develer, gezmeyi çok sever. Onlar sürü halinde gezer. Sürüde bir erkek, bir dişi ve yavru develer vardır. Kendini tehlikede hisseden bir deve tükürebilir. Böylelikle kendisini korumaya çalışır. Sırada develerle ilgili fiziksel özellikler var. Develer, uzun boyludur. Hörgüçleri vardır. Bazı develer tek hörgüçlüdür. Bazı develer ise çift hörgüçlüdür. Hörgüçler adeta bir depo gibidir. Develer yiyeceklerini buraya saklar. Böylelikle bu hayvanlar uzun süre aç ve susuz kalabilir. Develerin uzun kirpikleri vardır. Bu kirpikler, develerin gözlerini kum fırtınalarından korur. Şimdi, sırada beslenmeleri var. Develer, otçul hayvanlardır. Yaprakları, meyveleri, dikenli bitkileri yer. Develer, az besinle yetinebilir. Günlerce yemek yemese de olur. Bu hayvanlar, tek bir seferde 80-90 litre su içer. Bu sayede günlerce susuz kalabilir. Develer nasıl çoğalır? Bir fikrin var mı? Develer doğurarak çoğalır. Yeni doğan deve hörgüçsüzdür. Büyüdükçe hörgüçleri belirginleşir. Peki develerin çevreye olan etkileri nelerdir? Develer insanların dostudur. İnsanların ulaşımını sağlar. Eşyalarını taşırlar. İnsanlar develerin yününden, sütünden, etinden faydalanabilir. Ancak dikkat et! Bazı develer hastalık taşıyabilir. Bu insanlara bulaşabilir. İşte bu kadar! Haydi develerle ilgili öğrendiklerini arkadaşlarına da anlat!',
  '5_2_2': 'Develerin ayakları geniştir ve kumda batmazlar. Kirpikleri uzundur ve kumdan korur.',
  '5_2_3': 'Bu metni akıcı şekilde okumayı ve hedef hızıma ulaşmayı planlıyorum.',
  
  // Level 3 - Model Okuma ve Tekrar
  '1_3_1': 'Karıncalar koloniler halinde yaşar. Her koloni kraliçe, erkek ve işçilerden oluşur. İşçiler yiyecek toplar, yuva yapar.',
  '1_3_2': 'Karınca kolonileri binlerce bireyden oluşabilir. Karıncalar feromonlarla iletişim kurar. (HIZLI VE AKICI)',
  '1_3_3': 'Hedefim DOST\'un model okumasını takip edip sonra aynı akıcılıkla okuyabilmek. Performansımı ölçmek istiyorum.',
  
  '2_3_1': 'Telefonun kalbi işlemcidir. İşlemci saniyede milyarlarca işlem yapar. Ekran dokunmatik teknoloji kullanır.',
  '2_3_2': 'Telefonun bataryası şarj edilebilir lityum iyon bataryadır. Kamera yüksek çözünürlüklü fotoğraflar çeker.',
  '2_3_3': 'Model okumayı dinledikten sonra aynı hızda ve tonlamayla okumayı deneyeceğim.',
  
  '3_3_1': 'Hurma ağacı 20 metre boya ulaşabilir. Meyveleri 5-7 santimetre uzunluğundadır. Çok besleyicidir.',
  '3_3_2': 'Hurma meyvesi şeker, lif ve mineraller açısından zengindir. İnsanlar onu taze veya kurutulmuş tüketir.',
  '3_3_3': 'DOST\'un okumasını örnek alarak hız ve doğruluk hedeflerime ulaşmayı planlıyorum.',
  
  '4_3_1': 'Akdeniz bölgesinde narenciye, muz, avokado yetişir. Sera tarımı yaygındır. Turizm geliri yüksektir.',
  '4_3_2': 'Bölgenin önemli şehirleri Antalya, Mersin ve Hatay\'dır. Antik kentler turistleri çeker.',
  '4_3_3': 'Okuma hızımı artırmak ve doğru telaffuz için model okumayı takip edeceğim.',
  
  '5_3_1': 'Develer günde 100 kilometre yol gidebilir. 50 kilogram yük taşıyabilir. Susuz 7 gün dayanabilir.',
  '5_3_2': 'Develerin iki türü vardır: Tek hörgüçlü dromader ve çift hörgüçlü baktiriyen devesi.',
  '5_3_3': 'Model okumayla karşılaştırarak okuma performansımı değerlendireceğim.',
  
  // Level 4 - Şema ve Özetleme
  '1_4_1': 'Karınca kolonisinin yapısı: Kraliçe yumanrtalar. İşçiler yiyecek toplar, yuva yapar, larvaları besler. Erkekler sadece çiftleşir.',
  '1_4_2': 'Karıncalar toplu yaşayan, organize, çalışkan hayvanlardır. Görevler bellidir. Herkes işini yapar.',
  
  '2_4_1': 'Telefonun bileşenleri: İşlemci (beyin), ekran (görüntü), batarya (enerji), kamera (fotoğraf), hafıza (depolama).',
  '2_4_2': 'Akıllı telefon küçük ama güçlü bir bilgisayardır. İçinde birçok teknoloji bir araya gelmiştir.',
  
  '3_4_1': 'Hurma ağacının özellikleri: Uzun boylu, geniş yapraklı, tatlı meyveli, çöl ikliminde yetişen bir bitkidir.',
  '3_4_2': 'Hurma ağacı insanlar için çok faydalıdır. Hem gıda hem de gölge sağlar. Çölde yaşam kaynağıdır.',
  
  '4_4_1': 'Akdeniz bölgesinin özellikleri: Deniz kıyısı, ılıman iklim, tarım, turizm, antik kentler.',
  '4_4_2': 'Akdeniz bölgesi Türkiye\'nin en gelişmiş bölgelerinden biridir. Hem tarım hem turizm önemlidir.',
  
  '5_4_1': 'Develerin çöle uyumu: Hörgüçte su depolama, geniş ayaklar, uzun kirpikler, kalın tüyler.',
  '5_4_2': 'Develer çöl şartlarına mükemmel uyum sağlamıştır. Bu özellikleri sayesinde çölde yaşayabilir.',
  
  // Level 5 - Anlama Soruları ve Oyunlar
  '1_5_1': 'Karıncalar koloniler halinde yaşar. Kraliçe yumurtlar, işçiler çalışır, erkekler çiftleşir. Feremonlarla iletişim kurarlar.',
  '1_5_2': 'Karıncaları inceledik ve onların organize yapısını öğrendik. Çok çalışkan ve başarılı hayvanlardır.',
  '1_5_3': 'Hikayeyi tamamladık. Karıncalar hakkında çok şey öğrendik. Artık oyunları oynayabiliriz.',
  
  '2_5_1': 'Telefonun işlemcisi beyin gibidir. Ekranı dokunmatik, kamerası yüksek çözünürlüklü, bataryası şarj edilebilir.',
  '2_5_2': 'Akıllı telefonu inceledik. Modern teknolojinin harikasını öğrendik. Çok karmaşık bir cihazdır.',
  '2_5_3': 'Telefon hikayesini bitirdik. Artık teknolojinin nasıl çalıştığını anlıyoruz.',
  
  '3_5_1': 'Hurma ağacı 20 metre boyunda, besleyici meyveli, çöl ikliminde yetişen bir bitkidir. İnsanlar için çok faydalıdır.',
  '3_5_2': 'Hurma ağacını öğrendik. Çöl yaşamı için ne kadar önemli olduğunu gördük.',
  '3_5_3': 'Hurma ağacı hikayesini tamamladık. Bitkilerin insanlar için önemini anladık.',
  
  '4_5_1': 'Akdeniz bölgesi deniz kıyısında, ılıman iklimli, tarım ve turizm açısından zengin bir bölgedir. Antik kentleri vardır.',
  '4_5_2': 'Akdeniz bölgesini inceledik. Coğrafi özellikleri ve ekonomik faaliyetleri öğrendik.',
  '4_5_3': 'Akdeniz bölgesi hikayesini bitirdik. Türkiye\'nin güney kıyıları hakkında bilgi sahibi olduk.',
  
  '5_5_1': 'Develer hörgüçlerinde su depolar, geniş ayakları kumda batmaz, uzun kirpikleri kumdan korur. Çöl şartlarına uyum sağlamıştır.',
  '5_5_2': 'Develeri inceledik. Çöl gemisi lakabını neden aldıklarını öğrendik. Hayvanların uyum yeteneğini gördük.',
  '5_5_3': 'Çöl gemisi hikayesini tamamladık. Artık develerin özel özelliklerini biliyoruz.',
};

function getDefaultText(storyId: number, level: number, step: number): string {
  const key = `${storyId}_${level}_${step}`;
  return DEFAULT_TEST_TEXTS[key] || '';
}

interface TestAudioManagerProps {
  initialStoryId?: number | null;
  initialLevel?: number | null;
  initialStep?: number | null;
}

export default function TestAudioManager({ initialStoryId, initialLevel, initialStep }: TestAudioManagerProps = {}) {
  // Context'ten bilgileri al (optional - bazı sayfalarda context olmayabilir)
  const stepContext = useContext(StepContext);
  
  // Öncelik sırası: URL params (initial) > Context > Default
  const defaultStoryId = initialStoryId ?? stepContext?.storyId ?? 1;
  const defaultLevel = initialLevel ?? stepContext?.level ?? 2;
  const defaultStep = initialStep ?? stepContext?.step ?? 1;

  const [selectedStory, setSelectedStory] = useState(defaultStoryId);
  const [selectedLevel, setSelectedLevel] = useState(defaultLevel);
  const [selectedStep, setSelectedStep] = useState(defaultStep);
  const [text, setText] = useState('');
  const [audioExists, setAudioExists] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isBulkGenerating, setIsBulkGenerating] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  // URL veya Context değiştiğinde (sayfa değişikliği) seçimleri güncelle
  useEffect(() => {
    const newStoryId = initialStoryId ?? stepContext?.storyId ?? 1;
    const newLevel = initialLevel ?? stepContext?.level ?? 2;
    const newStep = initialStep ?? stepContext?.step ?? 1;
    
    console.log(`📍 Context/URL güncellendi: Hikaye ${newStoryId}, Seviye ${newLevel}, Adım ${newStep}`);
    
    setSelectedStory(newStoryId);
    setSelectedLevel(newLevel);
    setSelectedStep(newStep);
  }, [initialStoryId, initialLevel, initialStep, stepContext?.storyId, stepContext?.level, stepContext?.step]);

  // Seçim değiştiğinde veya reload tetiklendiğinde verileri yükle
  useEffect(() => {
    const loadData = async () => {
      const textKey = getTextStorageKey(selectedStory, selectedLevel, selectedStep);
      const enabledKey = getCheckboxStorageKey(selectedStory, selectedLevel, selectedStep);

      try {
        const savedText = localStorage.getItem(textKey);
        const savedEnabled = localStorage.getItem(enabledKey) === 'true';
        
        // IndexedDB'den ses kontrolü
        const hasAudio = await getAudioFromIndexedDB(selectedStory, selectedLevel, selectedStep);

        // Eğer kayıtlı metin yoksa, default metni kullan
        const textToUse = savedText !== null ? savedText : getDefaultText(selectedStory, selectedLevel, selectedStep);
        
        console.log(`📝 Metin yüklendi (${selectedStory}_${selectedLevel}_${selectedStep}):`, textToUse ? textToUse.substring(0, 50) + '...' : 'BOŞ');
        
        setText(textToUse);
        setAudioExists(hasAudio !== null);
        setIsEnabled(savedEnabled);
        setError(null);
        setSuccess(null);
      } catch (err) {
        console.error('Veri yükleme hatası:', err);
      }
    };

    loadData();
  }, [selectedStory, selectedLevel, selectedStep, reloadTrigger]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    
    // Metni kaydet
    const textKey = getTextStorageKey(selectedStory, selectedLevel, selectedStep);
    localStorage.setItem(textKey, newText);
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    
    // Eğer checkbox'ı açmaya çalışıyorsa ama ses yoksa uyarı ver
    if (checked && !audioExists) {
      setError('⚠️ Önce ses oluşturmalısınız!');
      return;
    }
    
    setIsEnabled(checked);
    const enabledKey = getCheckboxStorageKey(selectedStory, selectedLevel, selectedStep);
    localStorage.setItem(enabledKey, String(checked));
    
    // Global key'e de yaz (tüm step'lerde çalışması için)
    localStorage.setItem(GLOBAL_USE_TEST_AUDIO_KEY, String(checked));
    
    // Diğer component'lere bildir (storage event sadece farklı sekmelerde çalışır)
    window.dispatchEvent(new CustomEvent('testAudioChanged', { 
      detail: { storyId: selectedStory, level: selectedLevel, step: selectedStep, enabled: checked } 
    }));
    
    setError(null);
    console.log(`🎤 Test audio ${checked ? 'aktif' : 'pasif'} edildi: Hikaye ${selectedStory}, Seviye ${selectedLevel}, Adım ${selectedStep}`);
  };

  const handleGenerateAudio = async () => {
    if (!text.trim()) {
      setError('⚠️ Lütfen bir metin girin!');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setSuccess(null);

    try {
      console.log('🎵 TTS API\'ye istek gönderiliyor...');
      
      const response = await fetch(VOICE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API hatası: ${response.status} - ${errorText.substring(0, 100)}`);
      }

      const data = await response.json();
      
      if (!data.audioBase64) {
        throw new Error('API yanıtında audioBase64 bulunamadı');
      }

      // IndexedDB'ye kaydet
      await saveAudioToIndexedDB(selectedStory, selectedLevel, selectedStep, data.audioBase64);
      
      setAudioExists(true);
      setSuccess(`✅ Ses başarıyla oluşturuldu! (${Math.round(data.audioBase64.length / 1024)} KB)`);
      console.log('✅ Ses dosyası kaydedildi');

    } catch (err) {
      console.error('❌ Ses oluşturma hatası:', err);
      setError(`❌ Hata: ${err instanceof Error ? err.message : 'Bilinmeyen hata'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayAudio = async () => {
    try {
      const base64 = await getAudioFromIndexedDB(selectedStory, selectedLevel, selectedStep);
      
      if (!base64) {
        setError('⚠️ Ses dosyası bulunamadı!');
        return;
      }

      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audio.play();
    } catch (err) {
      console.error('❌ Ses oynatma hatası:', err);
      setError('❌ Ses oynatılamadı');
    }
  };

  const handleDeleteAudio = async () => {
    try {
      const enabledKey = getCheckboxStorageKey(selectedStory, selectedLevel, selectedStep);
      
      // IndexedDB'den sil
      await deleteAudioFromIndexedDB(selectedStory, selectedLevel, selectedStep);
      localStorage.setItem(enabledKey, 'false');
      
      setAudioExists(false);
      setIsEnabled(false);
      setSuccess('🗑️ Ses dosyası silindi');
    } catch (err) {
      console.error('❌ Ses silme hatası:', err);
      setError('❌ Ses silinirken hata oluştu');
    }
  };

  // Toplu ses oluşturma
  const handleBulkGenerate = async () => {
    if (!confirm('Tüm hikaye/seviye/adım kombinasyonları için ses dosyaları oluşturulsun mu?\n\nBu işlem uzun sürebilir ve API kotanızı tüketebilir.')) {
      return;
    }

    setIsBulkGenerating(true);
    setError(null);
    setSuccess(null);
    
    const combinations: { story: number; level: number; step: number; text: string }[] = [];
    
    // Tüm kombinasyonları topla
    STORIES.forEach(story => {
      LEVEL_STEPS.forEach(levelData => {
        levelData.steps.forEach(stepData => {
          const defaultText = getDefaultText(story.id, levelData.level, stepData.step);
          if (defaultText) {
            combinations.push({
              story: story.id,
              level: levelData.level,
              step: stepData.step,
              text: defaultText
            });
          }
        });
      });
    });

    setBulkProgress({ current: 0, total: combinations.length });
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < combinations.length; i++) {
      const combo = combinations[i];
      setBulkProgress({ current: i + 1, total: combinations.length });

      try {
        // Ses zaten varsa atla
        const existingAudio = await getAudioFromIndexedDB(combo.story, combo.level, combo.step);
        if (existingAudio) {
          console.log(`⏭️ Atlandı: Hikaye ${combo.story}, Seviye ${combo.level}, Adım ${combo.step} (zaten mevcut)`);
          successCount++;
          continue;
        }

        console.log(`🎵 Oluşturuluyor: Hikaye ${combo.story}, Seviye ${combo.level}, Adım ${combo.step}`);
        
        const response = await fetch(VOICE_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ text: combo.text }),
        });

        if (!response.ok) {
          throw new Error(`API hatası: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.audioBase64) {
          throw new Error('audioBase64 bulunamadı');
        }

        // Kaydet
        const textKey = getTextStorageKey(combo.story, combo.level, combo.step);
        await saveAudioToIndexedDB(combo.story, combo.level, combo.step, data.audioBase64);
        localStorage.setItem(textKey, combo.text);
        
        successCount++;
        console.log(`✅ Başarılı: Hikaye ${combo.story}, Seviye ${combo.level}, Adım ${combo.step}`);
        
        // API'yi yormamak için kısa gecikme
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (err) {
        console.error(`❌ Hata: Hikaye ${combo.story}, Seviye ${combo.level}, Adım ${combo.step}`, err);
        failCount++;
      }
    }

    setBulkProgress(null);
    setIsBulkGenerating(false);
    setSuccess(`✅ Toplu oluşturma tamamlandı!\n✔️ Başarılı: ${successCount}\n❌ Başarısız: ${failCount}`);
    
    // Mevcut kombinasyonu yeniden yükle
    setReloadTrigger(prev => prev + 1);
  };

  const currentLevelSteps = LEVEL_STEPS.find(l => l.level === selectedLevel)?.steps || [];

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-bold text-purple-700 mb-2">🎤 Test Ses Yönetimi</h3>
      
      {/* Otomatik tespit bilgisi */}
      {(stepContext?.storyId || initialStoryId) && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
          <span className="font-semibold">✨ Otomatik tespit:</span> Bulunduğunuz sayfa için test metni hazır
        </div>
      )}
      
      {/* Toplu Oluşturma Butonu */}
      <div className="mb-4">
        <button
          onClick={handleBulkGenerate}
          disabled={isBulkGenerating}
          className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isBulkGenerating
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
          }`}
        >
          {isBulkGenerating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span>
              {bulkProgress ? `${bulkProgress.current}/${bulkProgress.total}` : 'Hazırlanıyor...'}
            </span>
          ) : (
            '🚀 Tüm Sesleri Toplu Oluştur'
          )}
        </button>
        <p className="text-xs text-gray-500 mt-1 text-center">
          Default metinlerin tümü için ses dosyaları oluşturulur
        </p>
      </div>

      <hr className="my-3" />
      
      {/* Hikaye Seçimi */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Hikaye</label>
        <select 
          value={selectedStory} 
          onChange={(e) => setSelectedStory(Number(e.target.value))}
          className="w-full border border-gray-300 rounded-lg p-2 text-sm"
        >
          {STORIES.map(story => (
            <option key={story.id} value={story.id}>{story.id}. {story.name}</option>
          ))}
        </select>
      </div>

      {/* Level ve Step Seçimi */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Seviye</label>
          <select 
            value={selectedLevel} 
            onChange={(e) => {
              const newLevel = Number(e.target.value);
              setSelectedLevel(newLevel);
              setSelectedStep(1);
            }}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          >
            {LEVEL_STEPS.map(l => (
              <option key={l.level} value={l.level}>Seviye {l.level}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Adım</label>
          <select 
            value={selectedStep} 
            onChange={(e) => setSelectedStep(Number(e.target.value))}
            className="w-full border border-gray-300 rounded-lg p-2 text-sm"
          >
            {currentLevelSteps.map(s => (
              <option key={s.step} value={s.step}>{s.step}. {s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Metin Girişi */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">
          Test Metni
          <span className="ml-2 text-purple-600 font-normal">(Otomatik dolduruldu - düzenleyebilirsiniz)</span>
        </label>
        <textarea
          value={text}
          onChange={handleTextChange}
          placeholder="Burada test etmek istediğiniz metni yazın... Örneğin yanlış okunan bir paragraf."
          className="w-full border border-gray-300 rounded-lg p-2 text-sm resize-y min-h-[100px] max-h-[300px] overflow-y-auto"
          style={{ resize: 'vertical' }}
        />
        {text && (
          <p className="text-xs text-gray-500 mt-1">
            {text.length} karakter • {Math.ceil(text.split(' ').length / 5)} saniye (tahmini)
          </p>
        )}
      </div>

      {/* Durum Göstergesi */}
      <div className={`text-xs p-2 rounded-lg ${audioExists ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>
        {audioExists ? (
          <span>✅ Bu kombinasyon için ses mevcut</span>
        ) : (
          <span>⚠️ Henüz ses oluşturulmadı</span>
        )}
      </div>

      {/* Butonlar */}
      <div className="flex gap-2">
        <button
          onClick={handleGenerateAudio}
          disabled={isGenerating || !text.trim()}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            isGenerating || !text.trim()
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-purple-500 hover:bg-purple-600 text-white'
          }`}
        >
          {isGenerating ? (
            <span className="flex items-center justify-center gap-1">
              <span className="animate-spin">⏳</span> Oluşturuluyor...
            </span>
          ) : audioExists ? (
            '🔄 Sesi Tekrar Oluştur'
          ) : (
            '🎵 Sesi Oluştur'
          )}
        </button>
      </div>

      {/* Ses Kontrolleri (ses varsa) */}
      {audioExists && (
        <div className="flex gap-2">
          <button
            onClick={handlePlayAudio}
            className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white"
          >
            ▶️ Sesi Dinle
          </button>
          <button
            onClick={handleDeleteAudio}
            className="px-3 py-2 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Checkbox: Bu Sesi Kullan */}
      <div className={`p-3 rounded-lg border-2 ${isEnabled ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={handleCheckboxChange}
            className="mt-1 w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
          />
          <div>
            <span className="text-sm font-medium text-gray-700">Bu Sesi Kullan</span>
            <p className="text-xs text-gray-500 mt-1">
              İşaretlendiğinde, "Ses Kaydet" butonuna basıldığında mikrofonunuz yerine bu hazır ses kullanılır.
            </p>
          </div>
        </label>
      </div>

      {/* Hata/Başarı Mesajları */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-700">
          {success}
        </div>
      )}

      {/* Bilgi */}
      <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-lg">
        <p className="font-medium mb-1">💡 Nasıl Çalışır:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>Hikaye, Seviye ve Adım seçin</li>
          <li>Test metnini yazın</li>
          <li>"Sesi Oluştur" butonuna basın</li>
          <li>"Bu Sesi Kullan" checkbox'ını işaretleyin</li>
          <li>Ders ekranında "Ses Kaydet" basınca hazır ses kullanılır</li>
        </ol>
      </div>
    </div>
  );
}
