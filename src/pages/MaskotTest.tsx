import { useState } from 'react';
import { motion } from 'framer-motion';
import DostMascotSVG from '../components/mascot/DostMascotSVG';
import DostMascotCSS from '../components/mascot/DostMascotCSS';
import DostMascotSprite from '../components/mascot/DostMascotSprite';
import DostMascotLottie from '../components/mascot/DostMascotLottie';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';
type MethodType = 'svg' | 'css' | 'sprite' | 'lottie';

export default function MaskotTest() {
  const [currentState, setCurrentState] = useState<MascotState>('idle');
  const [activeMethod, setActiveMethod] = useState<MethodType>('svg');

  const methods = [
    { id: 'svg' as MethodType, name: 'SVG + Framer Motion', description: 'Tam kontrol, hafif, özelleştirilebilir' },
    { id: 'css' as MethodType, name: 'CSS + Görseller', description: 'Hızlı implementasyon, mevcut görseller' },
    { id: 'sprite' as MethodType, name: 'Sprite Sheet', description: 'Performanslı, animasyonlu görseller' },
    { id: 'lottie' as MethodType, name: 'Lottie', description: 'Profesyonel, After Effects gerekli' },
  ];

  const states: { id: MascotState; name: string; description: string }[] = [
    { id: 'idle', name: 'Beklemede', description: 'DOST bekliyor' },
    { id: 'talking', name: 'Konuşuyor', description: 'DOST konuşuyor' },
    { id: 'listening', name: 'Dinliyor', description: 'DOST seni dinliyor' },
    { id: 'celebrating', name: 'Kutluyor', description: 'DOST kutlama yapıyor' },
  ];

  const renderMascot = () => {
    switch (activeMethod) {
      case 'svg':
        return <DostMascotSVG state={currentState} />;
      case 'css':
        return <DostMascotCSS state={currentState} />;
      case 'sprite':
        return <DostMascotSprite state={currentState} />;
      case 'lottie':
        return <DostMascotLottie state={currentState} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-purple-800 mb-2">DOST Maskot Test Sayfası</h1>
        <p className="text-gray-600 mb-8">Farklı animasyon yöntemlerini test edin</p>

        {/* Method Tabs */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Yöntem Seçimi</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {methods.map((method) => (
              <button
                key={method.id}
                onClick={() => setActiveMethod(method.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  activeMethod === method.id
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-purple-300'
                }`}
              >
                <h3 className="font-semibold text-gray-800 mb-1">{method.name}</h3>
                <p className="text-sm text-gray-600">{method.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* State Buttons */}
        <div className="bg-white rounded-lg shadow-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">State Kontrolleri</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {states.map((state) => (
              <button
                key={state.id}
                onClick={() => setCurrentState(state.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  currentState === state.id
                    ? 'border-green-500 bg-green-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <div className="text-2xl mb-2">
                  {state.id === 'idle' && '😊'}
                  {state.id === 'talking' && '🗣️'}
                  {state.id === 'listening' && '👂'}
                  {state.id === 'celebrating' && '🎉'}
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{state.name}</h3>
                <p className="text-xs text-gray-600">{state.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Mascot Display Area */}
        <div className="bg-white rounded-lg shadow-lg p-8 min-h-[500px] relative overflow-hidden">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Aktif Yöntem: <span className="text-purple-600">{methods.find(m => m.id === activeMethod)?.name}</span>
          </h2>
          <p className="text-gray-600 mb-4">
            Mevcut State: <span className="font-semibold text-green-600">{states.find(s => s.id === currentState)?.name}</span>
          </p>

          {/* Read Along tarzı pozisyon - sağ alt köşe, büyük */}
          <div className="relative w-full h-full min-h-[400px] border-2 border-dashed border-gray-300 rounded-lg">
            {/* Demo içerik alanı */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Demo İçerik Alanı</h3>
              <p className="text-gray-600">
                Bu alan uygulamanın içerik alanını simüle eder. Maskot sağ alt köşede Read Along tarzında konumlandırılmıştır.
              </p>
            </div>

            {/* Maskot - Read Along tarzı pozisyon */}
            {renderMascot()}
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg mt-6">
          <h3 className="font-semibold text-blue-800 mb-2">💡 Bilgi</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Her yöntem farklı bir implementasyon kullanır</li>
            <li>• State'leri değiştirerek animasyonları test edin</li>
            <li>• Maskot Read Along'daki gibi sağ alt köşede konumlandırılmıştır</li>
            <li>• En iyi performansı görmek için farklı state'ler arasında geçiş yapın</li>
          </ul>
        </div>
      </div>
    </div>
  );
}


