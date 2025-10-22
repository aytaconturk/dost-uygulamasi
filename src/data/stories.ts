export type TextSegment = { text: string; bold?: boolean };
export type Paragraph = TextSegment[]; // supports bold spans

export type StoryCategory =
  | 'Hayvanlarla ilgili metinler'
  | 'Bitkilerle ilgili metinler'
  | 'Elektronik araçlarla ilgili metinler'
  | 'Coğrafi B��lgelerle İlgili ilgili metinler';

// Map storyId -> array of paragraphs
const STORIES: Record<number, Paragraph[]> = {
  1: [
    [
      { text: '“Karınca gibi çalışkan” ne demek? Sen hiç karınca yuvası gördün mü? Karıncaların yaşamı nasıldır? Haydi, bu soruların cevaplarını birlikte öğrenelim!' }
    ],
    [
      { text: 'Karıncaların yaşayışlarıyla başlayalım. ' },
      { text: 'Karıncalar çok çalışkan hayvanlardır.', bold: true },
      { text: ' Onlar oldukça ' },
      { text: 'hızlı hareket eder.', bold: true },
      { text: ' ' },
      { text: 'Küçük gruplar hâlinde yuvalarda yaşar.', bold: true },
      { text: ' Minik dostlarımız ' },
      { text: 'bir ekip olarak çalışır, işbirliğine önem verir.', bold: true },
      { text: ' Karıncaları her yerde görebilirsin. Mutfakta, ağaç köklerinde, taşların ve toprağın altında... Buralara yuva yaparlar.' }
    ],
    [
      { text: 'Şimdi bir karıncanın şekli nasıldır, bunu öğrenelim? ' },
      { text: 'Kocaman bir başı, uzun bir gövdesi vardır.', bold: true },
      { text: ' ' },
      { text: 'Karıncalar genellikle siyah, kahverengi ya da kırmızı renktedir.', bold: true },
      { text: ' ' },
      { text: 'Ayakları altı tanedir.', bold: true },
      { text: ' ' },
      { text: '��ki tane anteni vardır.', bold: true },
      { text: ' ' },
      { text: 'Bazı karıncalar kanatlıdır.', bold: true }
    ],
    [
      { text: 'Peki, sence karıncalar nasıl beslenir? Eğer cevabın şeker ise doğru! ' },
      { text: 'Genellikle şekerli yiyecekler yer.', bold: true },
      { text: ' ' },
      { text: 'Yere düşmüş tüm kırıntılara bayılır.', bold: true },
      { text: ' ' },
      { text: 'Aynı zamanda bitkileri de yer.', bold: true },
      { text: ' Kocaman bir ekmek parçasını bir sürü küçük karıncanın taşıdığını görebilirsin. Küçüktürler ama yaptıkları işler çok büyüktür.' }
    ],
    [
      { text: 'Peki, onlar nasıl çoğalır? Şimdi bunun cevabına bakalım. ' },
      { text: 'Karıncalar, yumurtlayarak çoğalır.', bold: true },
      { text: ' ' },
      { text: 'Kraliçe karınca yılda 50 milyon yumurta yapabilir.', bold: true },
      { text: ' Bu bir kova kumdan bile daha fazladır. İnanılmaz değil mi?' }
    ],
    [
      { text: 'Karıncaların çevreye olan etkilerini hiç düşündün mü? Küçük karıncalar, doğaya büyük faydalar sağlar. ' },
      { text: 'Onlar toprakları havalandırır.', bold: true },
      { text: ' ' },
      { text: 'Ağaçlara zarar veren böcekleri yer.', bold: true },
      { text: ' ' },
      { text: 'Tıpkı bir postacı gibi bitkilerin tohumunu dağıtır.', bold: true },
      { text: ' Bu canlılar, bazen zararlı da olabilir. ' },
      { text: 'Bazen insanlar ısırır. Bu durum kaşıntı yapabilir.', bold: true },
      { text: ' Bazen de ' },
      { text: 'tifüs ve verem gibi hastalıkları yayabilir.', bold: true },
      { text: ' Küçük dostlarımızı artık çok iyi biliyorsun. Onlara bugün bir küp şeker ısmarlamaya ne dersin?' }
    ]
  ],
  3: [
    [
      { text: 'Hey! Sana bir meyvenin ismini vermeden anlatayım, sen hangi meyve olduğunu tahmin et. Buruşuk, tatlı, kahverengi renkte bir meyvedir. Birçok çeşidi vardır. Özellikle Ramazan ayında tüketilir. Sence bu hangi meyvedir? ' },
      { text: 'Cevabın hurmaysa doğru bildin!', bold: true },
      { text: ' Haydi şimdi hurmaların yetiştiği hurma ağacını tanıyalım!' }
    ],
    [
      { text: 'Hurmanın yaşam koşulları ile başlayalım. ' },
      { text: 'Hurmalar, çok sıcak olan çöl ikliminde yetişir.', bold: true },
      { text: ' Yani sıcağı çok sever. ' },
      { text: 'Ülkemizde ise Akdeniz Bölgesi\'nde olur.', bold: true },
      { text: ' ' },
      { text: 'Hurma meyvesi ağaçta yetişir.', bold: true },
      { text: ' ' },
      { text: 'Hurma ağaçları çok uzundur.', bold: true },
      { text: ' Ayrıca hurma ağaçları kuraklığa dayanıklıdır.', bold: true },
      { text: ' Ancak meyvelerini verirken suya ihtiyaç duyar.', bold: true },
      { text: ' Hurma meyvesi salkım şeklinde hurma ağacının dallarından sallanır.', bold: true }
    ],
    [
      { text: 'Şimdi de hurma ağaçlarının görünümlerine bakalım. ' },
      { text: 'Hurma ağacı; gövde, yaprak ve meyve olmak üzere üç kısımdan oluşur.', bold: true },
      { text: ' Bu ağaç, palmiyeye benzer. ' },
      { text: 'Özellikle uzun gövdesiyle dikkat çeker.', bold: true },
      { text: ' En güzel yanları, meyveleridir tabii ki! ' },
      { text: 'Bu meyveler, şekerlemeye benzer, çok da lezzetlidir.', bold: true },
      { text: ' Meyvenin içinde çekirdek bulunur.', bold: true },
      { text: ' Hurma ağaçlarının yaprakları uzun ve küçüktür.', bold: true },
      { text: ' Bu yapraklardan da çay yapılır.' }
    ],
    [
      { text: 'Hurma ağaçlarının nasıl çoğaldığını bilmek ister misin? ' },
      { text: 'İstersen çekirdeğini ekerek çoğalmasını sağlarsın.', bold: true },
      { text: ' İstersen hurma ağacının gövdesinden çıkan filizleri ekersin.', bold: true },
      { text: ' ' },
      { text: 'Bir hurma ağacı yaklaşık 70 yıl yaşar.', bold: true },
      { text: ' Yeter ki hava soğuk olmasın!' }
    ],
    [
      { text: 'Son olarak hurmanın çevreye etkisine bakalım. ' },
      { text: 'Hurma ağacının yaprak ve gövdesiyle çeşitli eşyalar yapılır.', bold: true },
      { text: ' Hurma meyvesi çok faydalıdır; en önemli yararlarından biri ', },
      { text: 'kemikleri güçlendirmesidir.', bold: true },
      { text: ' Hurma meyvesi ise, beynimizin ve kalbimizin sağlığı için çok faydalıdır.', bold: true },
      { text: ' Ancak çok tüketilirse baş ağrısı yapabilir.', bold: true }
    ]
  ]
,
  4: [
    [
      { text: 'Hey! Sana bir sorum var: Turizmin incisi olarak bilinen bölgemiz hangisidir? Tabii ki, Akdeniz Bölgesi. Haydi, birlikte Akdeniz\'i keşfedelim.' }
    ],
    [
      { text: 'Akdeniz bölgesinin iklimi ile başlayalım. Bu bölgede ' },
      { text: 'Akdeniz iklimi görülür.', bold: true },
      { text: ' Bu iklimde yazları sıcak ve kuraktır. Kışları ise ılık ve yağışlıdır. Don olayları nadiren yaşanır. En fazla yağış kış mevsiminde düşer. Bazen ani ve aşırı yağmurlar da görülebilir. Bu ani ve aşırı yağmurlar, bir doğal afet olan sele sebep olabilir.' }
    ],
    [
      { text: 'Peki, sence bu bölgenin bitki örtüsü nasıldır? ' },
      { text: 'Akdeniz Bölgesi\'nin bitki örtüsü makidir.', bold: true },
      { text: ' Makiler, kısa boylu ağaçlardır. Maki türleri arasında mersin, keçiboynuzu, defne vardır. Bu bölgede ' },
      { text: 'bolca zeytin ve portakal ağaçları da bulunur.', bold: true }
    ],
    [
      { text: 'Sırada bölgenin yeryüzü şekilleri var. ' },
      { text: 'Akdeniz, dağlık ve engebelidir.', bold: true },
      { text: ' Bu bölgede engebeli ve sulak araziler olduğu için dağınık yerleşim görülür. Bölgeyi dağlar ve yüksek platolar oluşturur. Ayrıca bu bölgede kırmızı renkli topraklar bulunur. Bu topraklar verimlidir. Akdeniz\'in sıcak ve tuzlu bir denizi vardır.' }
    ],
    [
      { text: 'Akdeniz bölgesi gelirini tarım ve turizmden elde eder.', bold: true },
      { text: ' Tarım iç bölgelerde yapılır. Zeytinlerden lezzetli zeytinyağı yapılır. Portakallar ve limonlar üretilir. Bu ürünlerden büyük gelir elde edilir. Diğer bir gelir kaynağı olan turizm bölgenin başlıca kaynağıdır. Deniz, güneş ve turkuaz kıyılar turistler için burayı cazip kılar. Ayrıca antik kentler ve güzel doğal güzellikleri tanıtmak için birçok insan burayı ziyaret eder.' }
    ],
    [
      { text: 'Bölgenin nüfusu yaklaşık 11 milyona yakındır. ' },
      { text: 'Bölgede yaşayan insanların çoğunluğu kentlerde yaşamaktadır.', bold: true },
      { text: ' Sen de burada yaşamak ister miydin?' }
    ]
  ]
,
  5: [
    [
      { text: 'Çöl Gemisi deyince aklına ne geliyor? Şimdi birlikte bu sorunun cevabını öğreneceğiz. Hazır mısın?' }
    ],
    [
      { text: 'Çöl gemilerinin ne olduğu ve nasıl yaşadığı ile başlayalım. ' },
      { text: 'Çöl gemisi, develere verilen bir isimdir.', bold: true },
      { text: ' Çünkü develer genellikle çöl ikliminde yaşar. Çöl zorlu bir iklimdir. Yani, ' },
      { text: 'develer zorlu iklim koşullarında yaşayabilir.', bold: true },
      { text: ' Develer, gezmeyi çok sever. Onlar sürü halinde gezer. Sürüde bir erkek, bir dişi ve yavru develer vardır. ' },
      { text: 'Kendini tehlikede hisseden bir deve tükürebilir.', bold: true },
      { text: ' Böylelikle kendisini korumaya çalışır.' }
    ],
    [
      { text: 'Sırada develerle ilgili fiziksel özellikler var. ' },
      { text: 'Develer, uzun boyludur. Hörgüçleri vardır.', bold: true },
      { text: ' Bazı develer tek hörgüçlüdür. Bazı develer ise çift hörgüçlüdür.', bold: true },
      { text: ' Hörgüçler adeta bir depo gibidir. Develer yiyeceklerini buraya saklar. Böylelikle bu hayvanlar uzun süre aç ve susuz kalabilir. ' },
      { text: 'Develerin uzun kirpikleri vardır.', bold: true },
      { text: ' Bu kirpikler, develerin gözlerini kum fırtınalarından korur.' }
    ],
    [
      { text: 'Şimdi, sırada beslenmeleri var. ' },
      { text: 'Develer, otçul hayvanlardır.', bold: true },
      { text: ' Yaprakları, meyveleri, dikenli bitkileri yer. ' },
      { text: 'Develer, az besinle yetinebilir. Günlerce yemek yemese de olur.', bold: true },
      { text: ' Bu hayvanlar, tek bir seferde 80-90 litre su içer. Bu sayede günlerce susuz kalabilir.' }
    ],
    [
      { text: 'Develer nasıl çoğalır? Bir fikrin var mı? ' },
      { text: 'Develer doğurarak çoğalır.', bold: true },
      { text: ' Yeni doğan deve hörgüçsüzdür. Büyüdükçe hörgüçleri belirginleşir.' }
    ],
    [
      { text: 'Peki develerin çevreye olan etkileri nelerdir? ' },
      { text: 'Develer insanların dostudur. İnsanların ulaşımını sağlar.', bold: true },
      { text: ' Eşyalarını taşırlar. İnsanlar develerin yününden, sütünden, etinden faydalanabilir. ' },
      { text: 'Ancak dikkat et! Bazı develer hastalık taşıyabilir.', bold: true },
      { text: ' Bu insanlara bulaşabilir. İşte bu kadar! Haydi develerle ilgili öğrendiklerini arkadaşlarına da anlat!' }
    ]
  ]
};

const STORY_CATEGORIES: Record<number, StoryCategory> = {
  1: 'Hayvanlarla ilgili metinler',
  3: 'Bitkilerle ilgili metinler',
  4: 'Coğrafi Bölgelerle İlgili ilgili metinler',
  5: 'Hayvanlarla ilgili metinler',
};

export const getParagraphs = (storyId: number): Paragraph[] => STORIES[storyId] || [];
export const getStoryCategory = (storyId: number): StoryCategory | null => STORY_CATEGORIES[storyId] || null;

export type ComprehensionQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export type ComprehensionQuestions = Record<number, ComprehensionQuestion[]>;

const COMPREHENSION_QUESTIONS: ComprehensionQuestions = {
  3: [
    {
      question: 'Hurmalar hangi iklimde yetişir?',
      options: ['Soğuk iklimde', 'Çöl ikliminde', 'Orman ikliminde', 'Dağ ikliminde'],
      correctIndex: 1
    },
    {
      question: 'Hurma ağacı kaç yıl yaşar?',
      options: ['Yaklaşık 30 yıl', 'Yaklaşık 50 yıl', 'Yaklaşık 70 yıl', 'Yaklaşık 100 yıl'],
      correctIndex: 2
    },
    {
      question: 'Hurma ağacının temel parçaları nelerdir?',
      options: ['Yaprak ve meyve', 'Gövde, yaprak ve meyve', 'Sadece gövde', 'Kök, gövde ve yaprak'],
      correctIndex: 1
    },
    {
      question: 'Hurma meyvesi ne şekilde ağaçtan sallanır?',
      options: ['Tekil şekilde', 'Çift şekilde', 'Salkım şeklinde', 'Demetler halinde'],
      correctIndex: 2
    },
    {
      question: 'Hurma ağacının yapraklarından ne yapılır?',
      options: ['Çay', 'Yağ', 'Reçel', 'Ekmek'],
      correctIndex: 0
    }
  ]
};

export const getComprehensionQuestions = (storyId: number): ComprehensionQuestion[] => {
  return COMPREHENSION_QUESTIONS[storyId] || [];
};

export const paragraphToPlain = (p: Paragraph) => p.map(s => s.text).join('');

export const getFirstSentence = (text: string): string => {
  const match = text.match(/[^.!?\n]+[.!?]?/);
  return match ? match[0].trim() : text.trim();
};

export const getFirstThreeParagraphFirstSentences = (storyId: number): string[] => {
  const paras = getParagraphs(storyId);
  const firstThree = paras.slice(0, 3).map(paragraphToPlain);
  return firstThree.map(getFirstSentence).filter(Boolean);
};

export const getFullText = (storyId: number): string => {
  const paras = getParagraphs(storyId).map(paragraphToPlain);
  return paras.join('\n\n');
};
