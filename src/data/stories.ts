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
};

const STORY_CATEGORIES: Record<number, StoryCategory> = {
  1: 'Hayvanlarla ilgili metinler',
  3: 'Bitkilerle ilgili metinler',
};

export const getParagraphs = (storyId: number): Paragraph[] => STORIES[storyId] || [];
export const getStoryCategory = (storyId: number): StoryCategory | null => STORY_CATEGORIES[storyId] || null;

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
