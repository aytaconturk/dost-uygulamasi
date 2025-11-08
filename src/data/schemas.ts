export type SchemaSection = {
  id: number;
  title: string;
  items: string[];
};

export type Schema = {
  storyId: number;
  title: string;
  sections: SchemaSection[];
};

export const SCHEMAS: Record<number, Schema> = {
  1: {
    storyId: 1,
    title: 'Kırıntıların Kahramanları Metni Şematik Düzenlemesi',
    sections: [
      {
        id: 1,
        title: '1. Yaşayışları',
        items: [
          'Karıncalar çok çalışkan hayvanlardır.',
          'Hızlı hareket eder.',
          'Küçük gruplar halinde yuvalarda yaşar.',
          'Bir ekip olarak çalışır, işbirliğine önem verir.'
        ]
      },
      {
        id: 2,
        title: '2. Fiziksel Özellikleri',
        items: [
          'Kocaman bir başı, uzun bir gövdesi vardır.',
          'Karıncalar genellikle siyah, kahverengi ya da kırmızı renktedir.',
          'Ayakları altı tanedir.',
          'İki tane anteni vardır.',
          'Bazı karıncalar kanatıdır.'
        ]
      },
      {
        id: 3,
        title: '3. Beslenmeleleri',
        items: [
          'Genellikle şekerli yiyecekler yer.',
          'Yere düşmüş tüm kırıntılara bayılırlar.',
          'Aynı zamanda bitkileri de yer.'
        ]
      },
      {
        id: 4,
        title: '4. Çoğalmaları',
        items: [
          'Karıncalar, yumurtlayarak çoğalır.',
          'Kraliçe karınca yılda 50 milyon yumurta yapabilir.'
        ]
      },
      {
        id: 5,
        title: '5. Çevreye Etkileri',
        items: [
          'Toprağı havalandomdırır.',
          'Ağaçlara zarar veren böcekleri yer.',
          'Bitkilerin tohumunu dağıtır.',
          'Bazen insanları ısırırı. Bu durum büyük ise yaralanabilir.',
          'Tifüs ve verem hastalıklarını yayabilir.'
        ]
      }
    ]
  },
  2: {
    storyId: 2,
    title: 'Avucumun İçindeki Akıllı Kutu Metni Şematik Düzenlemesi',
    sections: [
      {
        id: 1,
        title: '1. Kullanım Amaçları',
        items: [
          'İletişim kurasarın.',
          'Aramalar, mesajlaşmalar, videolu görüşmeler yaparsarın.',
          'Önemli bilgilere tek tuşla erişirsin.',
          'Tabi ki eğlenmek için de kullanırsın.',
          'Oyunlar oyarsarın.',
          'Müzik dinlersin.',
          'Video izlersin.',
          'Fotoğraf çekersin.',
          'Hatta bir film bile çekebilirsin.'
        ]
      },
      {
        id: 2,
        title: '2. Fiziksel Özellikleri',
        items: [
          'Genellikle telefonlar dikdörtgendir.',
          'Bazı telefonlar katlanabilir.',
          'Hepsi cebine sığacak boydadır.',
          'Hafif ve rahat kullanımına sahiptir.',
          'Hem ön hem arka kameraları vardır.',
          'Alt tarafında hoparlör ve mikrofon bulunur.'
        ]
      },
      {
        id: 3,
        title: '3. Çalışma Biçimleri',
        items: [
          'Bu cihazlar elektrik enerjisi kullanır.',
          'Bir batarya ile çalışır.',
          'Dokunmatik ekran ile kontrol edilir.',
          'Sinyalleri alır. Ardından bu sinyalleri işler.'
        ]
      },
      {
        id: 4,
        title: '4. Üretimleri',
        items: [
          'Bu cihazlar özel fabrikafarda üretilir.',
          'Akıllı telefonlar önce tasarlanır, yanı nasıl görüneceğine karar verilir.',
          'Sonra ekran, pil ve kamera gibi parçalar birleştirilir.',
          'Daha sonra telefonun çalışmasını sağlayan yazılımlar yüklenir.',
          'Son olarak her sevim düzgün çalışıp çalışmadığı test edilir.'
        ]
      },
      {
        id: 5,
        title: '5. Hayatımıza Etkileri',
        items: [
          'Bu cihazlar hayatımızı oldukça kolaylaştırır.',
          'Adeta iletişim, eğlence ve bilgi edinme konularında kütüya sıkıştırılmıştır!',
          'Ancak aşırı kullanımında göz sağlığın etkilenebilir.'
        ]
      }
    ]
  },
  3: {
    storyId: 3,
    title: 'Çöl Şekerlemesi Şematik Düzenlemesi',
    sections: [
      {
        id: 1,
        title: '1. Yaşam Koşulları',
        items: [
          'Hurmalar, çok sıcak olan çöl ikliminde yetişir.',
          'Ülkemizde ise Akdeniz Bölgesi\'nde olur',
          'Hurma meyvesi ağaçta yetişir.',
          'Hurma ağaçları çok uzundur.',
          'Ayrıca hurma ağaçları kuraklığa dayanıklıdır.',
          'Ancak meyvelerini verirken suya ihtiyaç duyar.',
          'Hurma meyvesi salkım şeklinde hurma ağacının dallarından sallanır.'
        ]
      },
      {
        id: 2,
        title: '2. Fiziksel Özellikleri',
        items: [
          'Hurma ağacı; gövde, yaprak ve meyvse olmak üzere üç kısımdan oluşur.',
          'Bu ağaç, palmiye ağacına benzer.',
          'Özellikle uzun gövdesiyle dikkat çeker.',
          'En güzel yanları, meyvelerinin tabii kıl',
          'Meyvrnin içinde çekirdek bulunur.',
          'Hurmaların yaprakları uzun ve küçüktür.',
          'Bu yapraklardan da çay yapılır.'
        ]
      },
      {
        id: 3,
        title: '3. Çoğalmaları',
        items: [
          'İstersen çekirdeğini ekerek çoğalmasını sağlarsın.',
          'İstersen hurma ağacı gövdesinden çıkan filizleri ekersin.',
          'Bir hurma ağacı yaklaşık 70 yıl yaşar.'
        ]
      },
      {
        id: 4,
        title: '4. Etkileri',
        items: [
          'Ağacın yapışı ağızda çignenirse diş sağlığının korunmasını sağlar.',
          'Diğer faydası ise kemikleri güçlendirmesidir.',
          'Hurma meyvesi ise, beynimizin ve kalbimizin sağlığı için çok faydalıdır.',
          'Ancak çok tüketilirse baş ağrısı yapabilir.'
        ]
      }
    ]
  },
  4: {
    storyId: 4,
    title: 'Turizmin İncisi Şematik Düzenlemesi',
    sections: [
      {
        id: 1,
        title: '1. İklim Özellikleri',
        items: [
          'Akdeniz iklimi görülür.',
          'Yazları sıcak ve kuraktır. Kışları ise ılık ve yağışlıdır.',
          'Don olayları nadiren yaşanır.',
          'En fazla yağış kış mevsiminde düşer.',
          'Ani ve aşırı yağmur da görülebilir.',
          'Ani ve aşırı yağmur doğal afet olan sele sebep olabilir.'
        ]
      },
      {
        id: 2,
        title: '2. Bitki Örtüsü',
        items: [
          'Akdeniz Bölgesi\'nin bitki örtüsü makiktir.',
          'Makiler, kısa boylu ağaçlardır.',
          'Maki türleri arasında zakkum, keçiboynuzu, defne, koca yemiş vardır.',
          'Bolca zeytin ve portakal ağaçları da bulunur.'
        ]
      },
      {
        id: 3,
        title: '3. Yeryüzü Özellikleri',
        items: [
          'Akdeniz, dağlık ve engebeldir.',
          'Bu bölgede engebeli ve sulak araziler olduğu için dağınık yerleşim görülür.',
          'Bölgeyi dağları ve yüksek platolar oluşturur.',
          'Ayrıca bu bölgede kırmızı renkli topraklar bulunur. Bu topraklar verimlidir.',
          'Akdeniz\'in sıcacık ve tuzlu bir denizi vardır.'
        ]
      },
      {
        id: 4,
        title: '4. Ekonomik Faaliyetler',
        items: [
          'Akdeniz bölgesi gelirini tarım ve turisme eder.',
          'Diğer bir gelir kaynağı olan turizm bölgenin başlıca gelir kaynağıdır.'
        ]
      },
      {
        id: 5,
        title: '5. Nüfus ve Yerleşme',
        items: [
          'Bölgenin nüfusu yaklaşık 11 milyona yakındır.',
          'Bölgede yaşayan insanların çoğunluğu kentlerde yaşamaktadır.'
        ]
      }
    ]
  },
  5: {
    storyId: 5,
    title: 'Çöl Gemisi Metni Şematik Düzenlemesi',
    sections: [
      {
        id: 1,
        title: '1. Yaşayışları',
        items: [
          'Develer genellikle çöl ikliminde yaşar.',
          'Develer zorlu iklim koşullarında yaşayabilir.',
          'Develer, gezmeyi çok sever.',
          'Onlar sürüler halinde gezer.',
          'Kendini tehlikede hisseden bir deve tükürlebilir.'
        ]
      },
      {
        id: 2,
        title: '2. Fiziksel Özellikleri',
        items: [
          'Develer uzun boyludur.',
          'Hörgüçleri vardır.',
          'Bazı develer tek hörgüçlüdür. Bazı develer ise çift hörgüçlüdür.',
          'Uzun kirpikleri vardır.'
        ]
      },
      {
        id: 3,
        title: '3. Beslenmeleri',
        items: [
          'Develer, otçul hayvanlardır.',
          'Yaprakları, meyvelerini, dikenli bitkileri yer.',
          'Develer, az beslenle yetinebilir.',
          'Günlerce yemek yemese de olur.',
          'Bu hayvanlar, tek bir seferde 80-90 litre su içer. Bu sayede günlerce susuz kalabilir.'
        ]
      },
      {
        id: 4,
        title: '4. Çoğalmaları',
        items: [
          'Develer doğurarak çoğalır.'
        ]
      },
      {
        id: 5,
        title: '5. Çevreye Etkileri',
        items: [
          'İnsanların ulaşımını sağlar.',
          'Essayaların taşır.',
          'İnsanlar develerinin yününden, sütünden, etinden faydalanabilirler.',
          'Bazı develer hastalık taşır.'
        ]
      }
    ]
  }
};

export const getSchema = (storyId: number): Schema | null => {
  return SCHEMAS[storyId] || null;
};
