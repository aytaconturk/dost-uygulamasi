import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file if it exists
function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

loadEnv();

// Supabase credentials - Service role key kullan (RLS bypass için)
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
// Önce service role key'i dene, yoksa anon key kullan ama RLS bypass için service role gerekli
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found!');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables');
  console.error('Note: Service role key is required to bypass RLS policies');
  process.exit(1);
}

// Service role key ile client oluştur (RLS bypass)
// Eğer service role key varsa onu kullan, yoksa anon key ile dene
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'apikey': supabaseServiceKey
    }
  }
});

// Tüm hikayeler için sorular
const allQuestions = {
  1: [ // Karıncalar
    { question_text: 'Karıncalar genellikle nerede yuva yaparlar?', option_a: 'Sadece ağaç gövdelerinde', option_b: 'Yalnızca çatılarda', option_c: 'Mutfak, toprak altı, taş altı gibi yerlerde', option_d: 'Sadece su kenarlarında', correct_option: 'C', question_order: 1 },
    { question_text: 'Karıncaların vücut yapısı ile ilgili aşağıdakilerden hangisi yanlıştır?', option_a: 'Genellikle mavi renktedir', option_b: 'İki anteni vardır', option_c: 'Altı ayağı vardır', option_d: 'Bazılarının kanatları vardır', correct_option: 'A', question_order: 2 },
    { question_text: 'Karıncalar en çok ne tür yiyeceklerden hoşlanır?', option_a: 'Tuzlu yiyecekler', option_b: 'Şekerli yiyecekler', option_c: 'Yağlı yiyecekler', option_d: 'Ekşi yiyecekler', correct_option: 'B', question_order: 3 },
    { question_text: 'Karıncalar nasıl çoğalır?', option_a: 'Yumurtlayarak', option_b: 'Doğurarak', option_c: 'Tomurcuklanarak', option_d: 'Bölünerek', correct_option: 'A', question_order: 4 },
    { question_text: 'Karıncaların doğaya faydaları arasında aşağıdakilerden hangisi yer almaz?', option_a: 'Toprağı havalandırır', option_b: 'Tohumları dağıtır', option_c: 'Zararlı böcekleri yer', option_d: 'Ağaçları kemirir', correct_option: 'D', question_order: 5 },
    { question_text: 'Karıncaların çok çalışkan ve iş birliği yapan canlılar olması, onların hangi özelliği ile daha çok ilişkilidir?', option_a: 'Yuvalarının küçük olması', option_b: 'Sosyal bir yaşam sürmeleri', option_c: 'Kanatlı olmaları', option_d: 'Renklerinin koyu olması', correct_option: 'B', question_order: 6 },
    { question_text: 'Metne göre, karıncaların insanları ısırması ve hastalık yayabilmesi, onlarla ilgili hangi genellemeyi yapmamızı sağlar?', option_a: 'Tamamen zararsızdırlar', option_b: 'Sadece faydalı canlılardır', option_c: 'Bazen insanlarla sorun yaratabilirler', option_d: 'Hiçbir zaman eve girmezler', correct_option: 'C', question_order: 7 }
  ],
  2: [ // Akıllı Telefonlar
    { question_text: 'Akıllı telefonların kullanım alanlarına bakıldığında, metne göre bu cihazların en belirgin ortak özelliği hangisidir?', option_a: 'Birçok işlevi tek cihazda toplaması', option_b: 'Görüntülü görüşmeye odaklanması', option_c: 'Bilgiyi tek yönde iletmesi', option_d: 'Yalnızca acil durumlarda kullanılması', correct_option: 'A', question_order: 1 },
    { question_text: 'Akıllı telefonların fiziksel özellikleriyle ilgili verilen bilgilerden hangisi doğrudur?', option_a: 'Genellikle kare şeklindedirler.', option_b: 'Sadece ön kameraları bulunur.', option_c: 'Çok ağır ve taşınması zordur.', option_d: 'Bazı modelleri kağıt gibi katlanabilir özelliktedir.', correct_option: 'D', question_order: 2 },
    { question_text: 'Akıllı telefonların çalışma prensibiyle ilgili aşağıdaki sıralamalardan hangisi doğrudur?', option_a: 'Sinyali iletir -> İşler -> Sinyali alır', option_b: 'Sinyali alır -> İşler -> İletir', option_c: 'Sinyali işler -> Sinyali iletir -> Enerji üretir', option_d: 'Enerji üretir -> Sinyali alır -> İşler', correct_option: 'B', question_order: 3 },
    { question_text: 'Metinde akıllı telefonların üretim sürecindeki parçaların birleştirilmesi neye benzetilmiştir?', option_a: 'Yapboz yapmaya', option_b: 'Resim çizmeye', option_c: 'Legoları birleştirmeye', option_d: 'İnşaat yapmaya', correct_option: 'C', question_order: 4 },
    { question_text: 'Akıllı telefonların insan sağlığına olası zararı metinde nasıl ifade edilmiştir?', option_a: 'Yüksek ses kulaklara zarar verebilir.', option_b: 'Aşırı kullanımda göz sağlığı etkilenebilir.', option_c: 'Radyasyon yayarak baş ağrısı yapabilir.', option_d: 'Parmak kaslarını zayıflatabilir.', correct_option: 'B', question_order: 5 },
    { question_text: 'Metnin başlığında ve içeriğinde telefon için "Akıllı Kutu" ifadesinin kullanılmasının temel sebebi ne olabilir?', option_a: 'Şeklinin sadece kutuya benzemesi.', option_b: 'İçinde yapay zeka bulunması.', option_c: 'Birçok farklı işlevi (iletişim, eğlence, bilgi) tek bir cihazda toplaması.', option_d: 'Sadece akıllı insanların kullanabilmesi.', correct_option: 'C', question_order: 6 },
    { question_text: 'Metinde geçen "film bile çekebilirsin" ifadesinden yola çıkarak akıllı telefon teknolojisi hakkında nasıl bir yorum yapılabilir?', option_a: 'Telefonların kameralarının profesyonel kameralara yaklaştığı.', option_b: 'Telefonların sadece film izlemek için tasarlandığı.', option_c: 'Telefon hafızalarının çok çabuk dolduğu.', option_d: 'Film çekmenin çok zor bir işlem olduğu.', correct_option: 'A', question_order: 7 }
  ],
  3: [ // Hurma
    { question_text: 'Hurma ağaçları için en uygun yetişme ortamı hangisidir?', option_a: 'Ilıman orman içleri', option_b: 'Çöl ve çok sıcak iklimler', option_c: 'Sürekli soğuk bölgeler', option_d: 'Dağ etekleri', correct_option: 'B', question_order: 1 },
    { question_text: 'Metne göre hurma ağacının görünümü nasıldır?', option_a: 'Kısa ve dallı gövde', option_b: 'Çalı formunda, yer seviyesinde', option_c: 'Uzun gövdeli, palmiye benzeri yapı', option_d: 'Yere yayılan sarmaşık', correct_option: 'C', question_order: 2 },
    { question_text: 'Hurma ağacı çoğaltılırken hangi yöntemler kullanılabilir?', option_a: 'Sadece yaprakla çoğaltma', option_b: 'Yalnızca aşılama', option_c: 'Tohumla çoğaltma dışında yöntem yoktur', option_d: 'Çekirdeklerinin ekilmesi ya da gövdeden çıkan filizlerin dikilmesi', correct_option: 'D', question_order: 3 },
    { question_text: 'Metne göre hurma yaprağının insan sağlığına ne gibi bir faydası vardır?', option_a: 'Ağızda çiğnendiğinde diş sağlığını koruması', option_b: 'Sindirimi hızlandırması', option_c: 'Kansere karşı koruması', option_d: 'Ateşi düşürmesi', correct_option: 'A', question_order: 4 },
    { question_text: 'Metne göre hurma meyvesinin aşırı tüketimi hangi olumsuz etkiyi verebilir?', option_a: 'Ciddi görme sorunları', option_b: 'Baş ağrısı', option_c: 'Deride soyulma', option_d: 'Kalp ritim bozukluğu', correct_option: 'B', question_order: 5 },
    { question_text: '"Çöl şekerlemesi" ifadesi hurmayı tanımlarken hangi iki özelliğine vurgu yapar?', option_a: 'Şekli ve boyutu', option_b: 'Rengi ve kokusu', option_c: 'Yetiştiği yer ve tadı', option_d: 'Fiyatı ve bulunurluğu', correct_option: 'C', question_order: 6 },
    { question_text: 'Metinde hurmanın Ramazan Ayı\'nda sık tüketildiği ifade edilmektedir. Bunun sebebi ne olabilir?', option_a: 'Besin değerlerinin yüksek olması ve uzun süre tok tutması', option_b: 'Pişirilmeden tüketilebilmesi', option_c: 'Sadece sıcak iklimlerde yetişmesi', option_d: 'Diğer meyvelerden daha ucuz olması', correct_option: 'A', question_order: 7 }
  ],
  4: [ // Akdeniz Bölgesi
    { question_text: 'Metne göre Akdeniz Bölgesi\'nin iklim özellikleri aşağıdakilerden hangisinde doğru verilmiştir?', option_a: 'Yazları yağışlı, kışları çok soğuktur.', option_b: 'Her mevsim yağışlı ve ılıktır.', option_c: 'Yazları sıcak ve kurak, kışları ılık ve yağışlıdır.', option_d: 'Kışları karlı ve don olayları çok sıktır.', correct_option: 'C', question_order: 1 },
    { question_text: 'Akdeniz Bölgesi\'nin bitki örtüsü olan "maki" ile ilgili verilen bilgilerden hangisi doğrudur?', option_a: 'Yüksek ve gür ormanlardan oluşur.', option_b: 'Kısa boylu ağaçlar ve çalılardır.', option_c: 'Sadece otlardan oluşan bozkırlardır.', option_d: 'Yapraklarını döken geniş ağaçlardır.', correct_option: 'B', question_order: 2 },
    { question_text: 'Bölgenin yeryüzü şekilleri ve bunun yerleşime etkisi nasıldır?', option_a: 'Arazi dağlık ve engebeli olduğu için dağınık yerleşim görülür.', option_b: 'Arazi çok düz olduğu için herkes bir arada yaşar.', option_c: 'Sadece ovalardan oluştuğu için yerleşim çok kolaydır.', option_d: 'Yerleşim yerleri sadece deniz kenarında toplanmıştır.', correct_option: 'A', question_order: 3 },
    { question_text: 'Akdeniz Bölgesi\'nin temel geçim kaynakları metinde hangileri olarak belirtilmiştir?', option_a: 'Madencilik ve ormancılık', option_b: 'Balıkçılık ve sanayi', option_c: 'Hayvancılık ve enerji üretimi', option_d: 'Tarım ve turizm', correct_option: 'D', question_order: 4 },
    { question_text: 'Bölgedeki nüfus ve yaşam alanları ile ilgili hangisi söylenebilir?', option_a: 'İnsanların çoğu köylerde yaşamaktadır.', option_b: 'Nüfusun tamamı tarımla uğraşır.', option_c: 'İnsanların çoğunluğu kentlerde (şehirlerde) yaşamaktadır.', option_d: 'Bölge Türkiye\'nin en tenha yeridir.', correct_option: 'C', question_order: 5 },
    { question_text: 'Bölge ekonomisinin "deniz, güneş ve doğal güzelliklere" dayalı turizmden büyük gelir elde etmesi, bölge ekonomisinin yapısı hakkında bize ne söyler?', option_a: 'Bölge ekonomisi tamamen fabrikalara ve sanayiye bağlıdır.', option_b: 'Bölge ekonomisi, doğal çevreye ve iklim şartlarının korunmasına doğrudan bağımlıdır.', option_c: 'Turizm geliri tarım gelirinden daha azdır.', option_d: 'Bölge halkı sadece yazın çalışmaktadır.', correct_option: 'B', question_order: 6 },
    { question_text: 'Akdeniz Bölgesi için "Turizmin İncisi" denilmesinin temel sebebi metne göre ne olabilir?', option_a: 'Denizin ılık, temiz olması ve doğal güzelliklerin bulunması.', option_b: 'Bölgede çok fazla fabrika bulunması.', option_c: 'Nüfusun çok kalabalık olması.', option_d: 'Topraklarının kırmızı renkli olması.', correct_option: 'A', question_order: 7 }
  ],
  5: [ // Develer
    { question_text: 'Kendini tehlikede hisseden bir deve korunmak için ne yapabilir?', option_a: 'Karşısındakine tükürebilir', option_b: 'Hızlıca koşup kaçabilir', option_c: 'Kuma saklanabilir', option_d: 'Yüksek sesle bağırabilir', correct_option: 'A', question_order: 1 },
    { question_text: 'Develerin hörgüçlerinin işlevi nedir?', option_a: 'Yalnızca süs amaçlıdır', option_b: 'Yiyecek depolamak ve uzun süre aç kalmalarını sağlamak', option_c: 'Su depolamak', option_d: 'Diğer develerle iletişim kurmak', correct_option: 'B', question_order: 2 },
    { question_text: 'Develer ne tür besinlerle beslenir?', option_a: 'Yalnızca et', option_b: 'Hem et hem ot', option_c: 'Otçuldur; yaprak, meyve, dikenli bitkiler yer', option_d: 'Sadece tahıl', correct_option: 'C', question_order: 3 },
    { question_text: 'Develer nasıl çoğalır?', option_a: 'Yumurtlayarak', option_b: 'Doğurarak', option_c: 'Bölünerek', option_d: 'Tomurcuklanarak', correct_option: 'B', question_order: 4 },
    { question_text: 'Aşağıdakilerden hangisi develerin insanlara sağladığı yarardan değildir?', option_a: 'Ulaşım sağlama', option_b: 'Yün, süt ve etinden faydalanma', option_c: 'Eşya taşıma', option_d: 'Derisinden yazlık giysiler yapılması', correct_option: 'D', question_order: 5 },
    { question_text: 'Devenin uzun kirpiklerinin kum fırtınalarından gözlerini koruması, onun hangi özelliğini gösterir?', option_a: 'Çevreye uyum sağlamıştır.', option_b: 'Görme yeteneği zayıftır.', option_c: 'Kirpikleri gereksiz uzundur.', option_d: 'Güzel görünmesini sağlar.', correct_option: 'A', question_order: 6 },
    { question_text: 'Develerin tek seferde 80-90 litre su içebilmesi, hangi ortamda yaşadıklarını düşündürür?', option_a: 'Nemli orman', option_b: 'Soğuk tundra', option_c: 'Kurak çöl', option_d: 'Yağmurlu ova', correct_option: 'C', question_order: 7 }
  ],
  6: [ // Sanal Gerçeklik Gözlükleri
    { question_text: 'Sanal gerçeklik gözlüklerinin kullanım alanları olarak metinde hangisinden bahsedilmemiştir?', option_a: 'Spor müsabakaları', option_b: 'Eğitim', option_c: 'Sağlık', option_d: 'Eğlence', correct_option: 'A', question_order: 1 },
    { question_text: 'Sanal gerçeklik gözlüklerinin fiziksel görünümü metinde nasıl tarif edilmiştir?', option_a: 'Şeffaf, güneş gözlüğüne benzeyen küçük bir yapıdadır.', option_b: 'Kutuya benzeyen, gözleri tamamen kapatan büyük bir gözlüktür.', option_c: 'Tek gözle kullanılan korsan dürbünü gibidir.', option_d: 'Sadece kulaklık kısmı olan bir kaska benzer.', correct_option: 'B', question_order: 2 },
    { question_text: 'Sanal gerçeklik kumandaları kullanıcının ne yapmasını sağlar?', option_a: 'Başını sağa sola çevirmesini', option_b: 'Gözlükteki ekranı kapatmasını', option_c: 'Gerçek dünyadaki eşyaları boyamasını', option_d: 'Sanal dünyadaki eşyaları tutup hareket ettirmesini', correct_option: 'D', question_order: 3 },
    { question_text: 'Sanal gerçeklik gözlüklerinin üretiminde ilk olarak hangi parçalar üretilir?', option_a: 'Dış çerçeveler', option_b: 'Sensörler ve ekranlar', option_c: 'Lastikli bantlar', option_d: 'Kulaklıklar', correct_option: 'B', question_order: 4 },
    { question_text: 'Sanal gerçeklik gözlüklerinin olası olumsuz etkisi aşağıdakilerden hangisidir?', option_a: 'Çok vakit geçirilirse gözler bozulabilir.', option_b: 'Baş dönmesi ve mide bulantısı yapabilir.', option_c: 'Gerçeklik algısını tamamen kaybettirebilir.', option_d: 'Kulaklarda işitme kaybına yol açabilir.', correct_option: 'A', question_order: 5 },
    { question_text: '"Doktorlar bu gözlükleri zor ameliyatlarda yardımcı bir doktor gibi kullanır" cümlesinden aşağıdakilerden hangisi çıkarılabilir?', option_a: 'Gözlükler ameliyatı tek başına yapabilir.', option_b: 'Gözlükler, ameliyatlarda doktorlara ek bir destek sağlar.', option_c: 'Doktorların gözleri iyi görmediği için bu gözlükleri takarlar.', option_d: 'Ameliyat sırasında hastaların film izlemesini sağlarlar.', correct_option: 'B', question_order: 6 },
    { question_text: 'Metinde geçen "sana bir gerçeği anlatmam lazım ama bildiğin gerçeklerden değil" ifadesiyle anlatılmak istenen nedir?', option_a: 'Yazarın yalan söylediği.', option_b: 'Bahsedilen konunun bir masal olduğu.', option_c: 'Fiziksel dünyadan farklı, dijital olarak oluşturulmuş bir deneyim olduğu.', option_d: 'Bu teknolojinin henüz icat edilmediği.', correct_option: 'C', question_order: 7 }
  ],
  7: [ // Kaktüsler
    { question_text: 'Kaktüslerin en yaygın görüldüğü bölgeler nelerdir?', option_a: 'Kutup bölgeleri', option_b: 'Afrika ve Güney Amerika gibi sıcak, kurak bölgeler', option_c: 'Nemli orman altı', option_d: 'Alpin çayırlar', correct_option: 'B', question_order: 1 },
    { question_text: 'Kaktüslerin fiziksel özellikleri il ilgili aşağıdakilerden hangisi doğrudur?', option_a: 'Uzun sarmaşık yapısı', option_b: 'Yaprak dökme yapısı', option_c: 'Gövde üzerinde geniş yaprak demetine sahip olmaları', option_d: 'Dikenlerin bulunması', correct_option: 'D', question_order: 2 },
    { question_text: 'Kaktüslerin çoğalma yollarından biri hangisidir?', option_a: 'Parçalarının toprağa ekilmesiyle veya tohumla', option_b: 'Sadece rüzgârla dağılmasıyla', option_c: 'Suda sürgün vererek', option_d: 'Hücre bölünmesiyle', correct_option: 'A', question_order: 3 },
    { question_text: 'Kaktüslerin çevreye faydaları arasında aşağıdakilerden hangisi yer almaz?', option_a: 'Hayvanlar için barınak olma', option_b: 'Toprağı koruma', option_c: 'Orman yangınlarını söndürme', option_d: 'Hayvanlar için yiyecek ve su kaynağı olma', correct_option: 'C', question_order: 4 },
    { question_text: 'Metne göre kaktüslerin insanlara ya da çevreye zarar verebilecek özelliği nedir?', option_a: 'Kokusu insan sağlığını bozar', option_b: 'Dikenlerinin cilde batmasıyla yaralanma riski', option_c: 'Aşırı su tüketimine neden olur', option_d: 'Çok zehirli meyveleri vardır', correct_option: 'B', question_order: 5 },
    { question_text: 'Kaktüs köklerinin çok uzun olmasının en mantıklı gerekçesi ne olabilir?', option_a: 'Gövdeyi çevresel etkilere karşı dengelemek', option_b: 'Diken üretimini artırmak', option_c: 'Diğer bitkilerle rekabeti artırmak', option_d: 'Topraktaki derin su kaynaklarına erişmek', correct_option: 'D', question_order: 6 },
    { question_text: 'Kaktüslerin çok çeşitli renklerde olabilmesi, onların hangi özelliği ile ilgili olabilir?', option_a: 'Tür çeşitliliği', option_b: 'Hepsinin aynı olduğunu', option_c: 'Sadece yeşil renkte olduklarını', option_d: 'Renklerinin hayvanları korkuttuğunu', correct_option: 'A', question_order: 7 }
  ],
  8: [ // Doğu Anadolu Bölgesi
    { question_text: 'Doğu Anadolu Bölgesi\'nin iklimiyle ilgili aşağıdakilerden hangisi yanlıştır?', option_a: 'Kışlar soğuk ve uzun geçer.', option_b: 'Yazlar kısa ve serindir.', option_c: 'Kış aylarında bolca kar yağar.', option_d: 'Hiçbir zaman don olayı görülmez.', correct_option: 'D', question_order: 1 },
    { question_text: 'Bölgenin bitki örtüsü metinde nasıl tanımlanmıştır?', option_a: 'Bozkır', option_b: 'Maki', option_c: 'Gür ormanlar', option_d: 'Sazlıklar', correct_option: 'A', question_order: 2 },
    { question_text: 'Doğu Anadolu Bölgesi\'nin yeryüzü şekilleri hakkında hangisi söylenebilir?', option_a: 'Yükseltisi az ve dümdüzdür.', option_b: 'Yükseltisi fazladır ve dağlar geniş yer kaplar.', option_c: 'Sadece geniş ovalardan oluşur.', option_d: 'Deniz seviyesindedir.', correct_option: 'B', question_order: 3 },
    { question_text: 'Bölgede yapılan ekonomik faaliyetler ve çıkarılan madenler hangisinde doğru eşleşmiştir?', option_a: 'Turizm - Petrol', option_b: 'Balıkçılık - Altın', option_c: 'Tarım/Hayvancılık - Bakır, Bor, Kurşun', option_d: 'Sanayi - Demir', correct_option: 'C', question_order: 4 },
    { question_text: 'Metinde bölgenin nüfusuyla ilgili hangi bilgi yer almaktadır?', option_a: 'En kalabalık bölgemizdir.', option_b: 'Kentlerde yaşayan insan sayısı daha fazladır.', option_c: 'En az insan yaşayan bölgemizdir.', option_d: 'Nüfus kıyılarda toplanmıştır.', correct_option: 'C', question_order: 5 },
    { question_text: 'Metinde bahsedilen "çığ" felaketinin bu bölgede sık görülmesinin temel nedenleri ne olabilir?', option_a: 'Yazların sıcak geçmesi ve kuraklık.', option_b: 'Arazinin düz olması ve yağmur yağması.', option_c: 'Bitki örtüsünün bozkır olması.', option_d: 'Yüksek dağların olması ve yoğun kar yağışı.', correct_option: 'D', question_order: 6 },
    { question_text: 'Metinde yüksek yerlerde "çayır" denilen uzun boylu yeşil otların olduğu belirtilmiştir. Bu durum bölgede hangi ekonomik faaliyetin gelişmesini sağlamış olabilir?', option_a: 'Büyükbaş hayvancılık (İnek vb. hayvan yetiştiriciliği)', option_b: 'Balıkçılık', option_c: 'Ormancılık', option_d: 'Tavukçuluk', correct_option: 'A', question_order: 7 }
  ],
  9: [ // Sincaplar
    { question_text: 'Sincaplar nerede yaşar?', option_a: 'Su altında', option_b: 'Çöllerde', option_c: 'Ağaçlarda', option_d: 'Mağaralarda', correct_option: 'C', question_order: 1 },
    { question_text: 'Sincapların kuyruğunun işlevi nedir?', option_a: 'Yalnızca süs', option_b: 'Saldırı silahı', option_c: 'Isınmak', option_d: 'Dengede kalmalarını sağlamak', correct_option: 'D', question_order: 2 },
    { question_text: 'Sincaplar en çok ne yemeyi sever?', option_a: 'Fındık, fıstık, palamut gibi yemişler', option_b: 'Balık', option_c: 'Et', option_d: 'Ağaç kabuğu', correct_option: 'A', question_order: 3 },
    { question_text: 'Sincaplar nasıl çoğalır?', option_a: 'Yumurtlayarak', option_b: 'Doğurarak', option_c: 'Bölünerek', option_d: 'Sporla', correct_option: 'B', question_order: 4 },
    { question_text: 'Sincapların doğaya en önemli katkısı nedir?', option_a: 'Unuttukları tohumlar yeni ağaçlara dönüşür', option_b: 'Ağaçları kemirir', option_c: 'Kuşları kovalar', option_d: 'Toprağı kazarlar', correct_option: 'A', question_order: 5 },
    { question_text: 'Sincapların yiyeceklerini toprak altına veya ağaç kovuklarına saklaması, hangi mevsim için hazırlık olabilir?', option_a: 'Yaz', option_b: 'Sonbahar', option_c: 'Kış', option_d: 'İlkbahar', correct_option: 'C', question_order: 6 },
    { question_text: 'Sincapların keskin dişleri ve harika gören gözleri, onların hangi konuda usta olduklarını gösterir?', option_a: 'Yuva yapmak', option_b: 'Besin bulmak ve işlemek', option_c: 'Düşmanlardan kaçmak', option_d: 'Yüzmek', correct_option: 'B', question_order: 7 }
  ],
  10: [ // Akıllı Saatler
    { question_text: 'Metne göre akıllı saatler aşağıdakilerden hangisini yapamaz?', option_a: 'Fotoğraf düzenlemesi yapmak', option_b: 'Adım saymak', option_c: 'Randevuları hatırlatmak', option_d: 'Bildirimleri göstermek', correct_option: 'A', question_order: 1 },
    { question_text: 'Akıllı saatleri klasik saatlerden ayıran en belirgin fiziksel özellik nedir?', option_a: 'Kolda taşınması', option_b: 'Dokunmatik bir ekrana sahip olması', option_c: 'Kayışlarının olması', option_d: 'Pille çalışması', correct_option: 'B', question_order: 2 },
    { question_text: 'Akıllı saatlerin tam kapasiteyle çalışabilmesi ve bilgi verebilmesi için genellikle neye ihtiyacı vardır?', option_a: 'Güneş enerjisine', option_b: 'Uydu bağlantısına', option_c: 'Sürekli hareket etmeye', option_d: 'Bir telefonla eşleştirilmeye', correct_option: 'D', question_order: 3 },
    { question_text: 'Akıllı saatlerin üretim süreci metinde nasıl özetlenmiştir?', option_a: 'Malzeme seçimi -> Yazılım oluşturma -> Birleştirme', option_b: 'Birleştirme -> Malzeme seçimi -> Yazılım', option_c: 'Satış -> Yazılım -> Üretim', option_d: 'Yazılım -> Test -> Malzeme seçimi', correct_option: 'A', question_order: 4 },
    { question_text: 'Akıllı saatlerin sürekli bildirim göndermesinin olumsuz sonucu nedir?', option_a: 'Şarjının bitmesi', option_b: 'Saatin ısınması', option_c: 'Dikkat dağınıklığı oluşturması', option_d: 'Bileği terletmesi', correct_option: 'C', question_order: 5 },
    { question_text: 'Metinde akıllı saatler için "Kolumuzdaki Süper Kahraman" benzetmesi yapılmasının nedeni ne olabilir?', option_a: 'Uçabilmemizi sağlaması.', option_b: 'Çok güçlü ve dayanıklı malzemeden yapılması.', option_c: 'Sadece tehlikeli durumlarda çalışması.', option_d: 'Hayatımızı kolaylaştıran birçok özelliğe sahip olması.', correct_option: 'D', question_order: 6 },
    { question_text: '"Spor yaparken ne kadar aktif olduğunu takip eder, böylece düzenli yaşamana katkı sağlar" ifadesinden hangi sonuca ulaşılır?', option_a: 'Akıllı saatlerin sadece sporcular için üretildiği.', option_b: 'Bu cihazların kişisel sağlık yönetimi ve motivasyon konusunda destekleyici olduğu.', option_c: 'Spor yapmayanların akıllı saat kullanamayacağı.', option_d: 'Akıllı saatin spor hareketlerini kendisinin yaptığı.', correct_option: 'B', question_order: 7 }
  ],
  11: [ // Nar
    { question_text: 'Nar ağaçları hangi iklim koşulları uygundur?', option_a: 'Soğuk ve yağışlı', option_b: 'Sıcak iklimler', option_c: 'Kutup kuşağı', option_d: 'Sürekli karasal iklim', correct_option: 'B', question_order: 1 },
    { question_text: 'Narın fiziksel özellikleri ile ilgili hangisi doğrudur?', option_a: 'Dış kabuğu yumuşak ve şeffaftır.', option_b: 'İçi tamamen çekirdeksizdir.', option_c: 'Meyvenin içinde beyaz zar ve kıpkırmızı taneler bulunur.', option_d: 'Meyve siyah renktedir.', correct_option: 'C', question_order: 2 },
    { question_text: 'Metinde narın çoğaltılması için hangi yöntemlerin kullanıldığı belirtilmiştir?', option_a: 'Sadece aşı ile', option_b: 'Çekirdek veya ağacın dalının toprağa dikilmesiyle', option_c: 'Yalnızca gölge altında yetiştirilir', option_d: 'Suya bırakılarak çoğalır', correct_option: 'B', question_order: 3 },
    { question_text: 'Metinde narın insan sağlığına hangi açıdan yararlı olduğu söylenmektedir?', option_a: 'Zihinsel faaliyetleri tamamen geri getirir.', option_b: 'Vücut ısısını artırır.', option_c: 'Kalp sağlığını destekler.', option_d: 'Saçların rengini değiştirir.', correct_option: 'C', question_order: 4 },
    { question_text: 'Nar meyvesiyle ilgili aşağıdakilerden hangisi olası bir yan etki olarak değerlendirilebilir?', option_a: 'Halsizlik yapması', option_b: 'Kemik gelişimini durdurması', option_c: 'Soğuk algınlığına yol açması', option_d: 'Kaşıntı veya mide ağrısına neden olması', correct_option: 'D', question_order: 5 },
    { question_text: 'Nar ağacının kuraklığa dayanıklı olması, ancak yazın suya ihtiyaç duyması, onun hangi özelliğini gösterir?', option_a: 'Suyu sevdiğini ama çok da ihtiyaç duymadığını', option_b: 'Tamamen susuz yaşayabildiğini', option_c: 'Çok fazla suya ihtiyaç duyduğunu', option_d: 'Sadece yağmur suyu ile yetindiğini', correct_option: 'A', question_order: 6 },
    { question_text: 'Narın bilmecelerde "içi dolu boncuk" olarak geçmesi, narın hangi özelliği ile ilgilidir?', option_a: 'Renginin kırmızı olması', option_b: 'Şeklinin ve iç yapısının tanelere benzemesi', option_c: 'Ağacının uzun olması', option_d: 'Çiçeklerinin güzel kokması', correct_option: 'B', question_order: 7 }
  ]
};

async function updateAllQuestions() {
  console.log('🔄 Tüm hikayelerin sorularını güncelliyorum...\n');
  console.log('⚠️  Not: Service role key gerekli. Eğer RLS hatası alırsanız, .env dosyasına SUPABASE_SERVICE_ROLE_KEY ekleyin.\n');

  for (const [storyIdStr, questions] of Object.entries(allQuestions)) {
    const storyId = parseInt(storyIdStr);
    console.log(`\n📚 Story ${storyId} için ${questions.length} soru güncelleniyor...`);

    try {
      // Önce mevcut soruları getir
      const { data: existingQuestions, error: fetchError } = await supabase
        .from('comprehension_questions')
        .select('id, question_order')
        .eq('story_id', storyId)
        .order('question_order', { ascending: true });

      if (fetchError) {
        console.error(`  ❌ Story ${storyId}: Mevcut sorular yüklenemedi:`, fetchError.message);
        continue;
      }

      console.log(`  📋 Mevcut ${existingQuestions?.length || 0} soru bulundu`);

      // Mevcut soruları UPDATE et (varsa)
      let updatedCount = 0;
      if (existingQuestions && existingQuestions.length > 0) {
        for (let i = 0; i < Math.min(existingQuestions.length, questions.length); i++) {
          const existing = existingQuestions[i];
          const newQuestion = questions[i];
          
          const { error: updateError } = await supabase
            .from('comprehension_questions')
            .update({
              question_text: newQuestion.question_text,
              option_a: newQuestion.option_a,
              option_b: newQuestion.option_b,
              option_c: newQuestion.option_c,
              option_d: newQuestion.option_d,
              correct_option: newQuestion.correct_option,
              question_order: newQuestion.question_order
            })
            .eq('id', existing.id);

          if (!updateError) {
            updatedCount++;
          }
        }
        
        // Fazla soruları sil
        if (existingQuestions.length > questions.length) {
          const idsToDelete = existingQuestions.slice(questions.length).map(q => q.id);
          for (const id of idsToDelete) {
            await supabase
              .from('comprehension_questions')
              .delete()
              .eq('id', id);
          }
        }
      }

      // Yeni soruları ekle (eksik olanlar için)
      const questionsToInsert = [];
      const startIndex = existingQuestions ? existingQuestions.length : 0;
      
      for (let i = startIndex; i < questions.length; i++) {
        questionsToInsert.push({
          story_id: storyId,
          ...questions[i],
          question_audio_url: null,
          correct_answer_audio_url: null,
          wrong_answer_audio_url: null
        });
      }

      let insertedCount = 0;
      if (questionsToInsert.length > 0) {
        const { data: insertedQuestions, error: insertError } = await supabase
          .from('comprehension_questions')
          .insert(questionsToInsert)
          .select();

        if (insertError) {
          console.error(`  ❌ Story ${storyId}: Yeni sorular eklenemedi:`, insertError.message);
          console.error(`     💡 Çözüm: .env dosyasına SUPABASE_SERVICE_ROLE_KEY ekleyin`);
        } else {
          insertedCount = insertedQuestions?.length || 0;
        }
      }

      if (updatedCount > 0 || insertedCount > 0) {
        console.log(`  ✅ ${updatedCount} soru güncellendi, ${insertedCount} yeni soru eklendi!`);
      } else if (existingQuestions && existingQuestions.length === questions.length) {
        console.log(`  ✅ Tüm sorular zaten mevcut`);
      }

    } catch (error) {
      console.error(`  ❌ Story ${storyId}: Hata:`, error.message);
    }
  }
}

// Script'i çalıştır
updateAllQuestions()
  .then(() => {
    console.log('\n\n✅ Tüm güncellemeler tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Hata:', error);
    process.exit(1);
  });
