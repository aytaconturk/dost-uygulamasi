import React from 'react';

export default function Step4() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center">
      <div className="flex flex-col md:flex-row items-start justify-center gap-6 px-4 md:px-12 relative mt-0 max-w-4xl">
        <div className="flex-shrink-0 mt-4">
          <img src="https://cdn.builder.io/api/v1/image/assets%2F294eb74402d9433d884eb637d7d73164%2Fa37b5e72fdf5448394c8a29c4e05d123?format=webp&width=800" alt="Oturum 2: Avucumun İçindeki Akıllı Kutu" className="rounded-lg shadow-lg w-64 md:w-80" />
        </div>
        <div className="text-lg text-gray-800 leading-relaxed max-w-xl">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">4. Adım: Söz Varlığı</h2>
          <p className="mt-2 text-gray-800">Metindeki yeni sözcükleri belirle, anlamlarını açıkla ve örnek cümle kur.</p>
        </div>
      </div>
    </div>
  );
}
