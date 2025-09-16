import React from 'react';

export default function Step4() {
  const story = {
    id: 1,
    title: 'Büyük İşler Küçük Dostlar',
    description: 'Karıncalar hakkında',
    image: 'https://raw.githubusercontent.com/aytaconturk/dost-api-assets/main/assets/images/story1.png'
  };

  return (
    <div className="flex flex-col md:flex-row items-start justify-center gap-6 px-4 md:px-12 relative mt-0">
      <div className="flex-shrink-0 mt-4">
        <img src={story.image} alt={story.title} className="rounded-lg shadow-lg w-64 md:w-80" />
      </div>
      <div className="text-lg text-gray-800 leading-relaxed max-w-xl">
        <h2 className="text-2xl font-bold text-purple-800 mb-4">4. Adım: Sözcük dağarcığını geliştirme</h2>
        <p className="mt-2 text-gray-800">Hikayede öğrendiğin yeni kelimeleri söyle. Bu kelimelerin anlamlarını açıkla.</p>
      </div>
    </div>
  );
}
