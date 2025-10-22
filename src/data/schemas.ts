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
          'Ayrıca hurma ağaçları kuraklığa dayanıklıdır',
          'Ancak meyvelerinin verirken suya ihtiyaç duyar.',
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
          'En güzel yanları, meyvelerinin tabil kıl',
          'Meyyenin içinde çekirdek bulunur.',
          'Hurmaların yaprakları uzun ve küçüktür.',
          'Bu yapraklardan da çay yapılır.'
        ]
      },
      {
        id: 3,
        title: '3. Coğalmaları',
        items: [
          'İstersenç çekirdeğini ekerek çoğalmasını sağlarsın.',
          'İstersenç hurma ağacı gövdesinden çıkan filizleri ekersin.',
          'Bir hurma ağacı yaklaşık 70 yıl yaşar.'
        ]
      },
      {
        id: 4,
        title: '4. Etkileri',
        items: [
          'Ağacın yapışı ağızda çignenirse diş sağlığının korunmasını sağlar.',
          'Diğer faydası ise kemikleri güçlendirmedir.',
          'Hurma meyvesi ise, beynimizin ve kalbimizin sağlığı için çok faydaldır.',
          'Ancak çok tüketilirse başağrısı yapabilir.'
        ]
      }
    ]
  }
};

export const getSchema = (storyId: number): Schema | null => {
  return SCHEMAS[storyId] || null;
};
