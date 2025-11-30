/**
 * LOTTIE TABANLI DOST MASKOT
 * Lottie animasyonları için component
 * Lottie dosyaları: /dost/lottie/ klasöründe olmalı
 */

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import Lottie from 'lottie-react';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';

interface Props {
  state: MascotState;
  size?: number;
}

export default function DostMascotLottie({ state, size = 160 }: Props) {
  const [animationData, setAnimationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lottie dosya yolları
  const lottieFiles: Record<MascotState, string> = {
    idle: '/dost/lottie/idle.json',
    talking: '/dost/lottie/talking.json',
    listening: '/dost/lottie/listening.json',
    celebrating: '/dost/lottie/celebrating.json',
  };

  // State değiştiğinde animasyonu yükle
  useEffect(() => {
    const loadAnimation = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const filePath = lottieFiles[state];
        console.log('🎬 Lottie yükleniyor:', filePath);
        
        const response = await fetch(filePath, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ Lottie yüklendi:', data);
        
        // Lottie format kontrolü
        if (!data.v || !data.layers) {
          throw new Error('Geçersiz Lottie formatı');
        }
        
        setAnimationData(data);
      } catch (err: any) {
        console.error('❌ Lottie animasyon yüklenemedi:', err);
        setError(err.message || 'Bilinmeyen hata');
        setAnimationData(null);
      } finally {
        setLoading(false);
      }
    };

    loadAnimation();
  }, [state]);

  // Container animasyonları (Lottie animasyonu dışında ekstra efektler için)
  const containerAnimations = {
    idle: {},
    talking: {},
    listening: {},
    celebrating: {
      scale: [1, 1.1, 1],
      transition: { duration: 0.5, repeat: 2 },
    },
  };

  return (
    <motion.div
      className="absolute bottom-8 right-8 z-50"
      style={{ width: size, height: size }}
      animate={containerAnimations[state]}
      initial={false}
    >
      {loading ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-blue-300">
          <div className="text-center p-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-xs text-gray-700 font-semibold">Yükleniyor...</p>
          </div>
        </div>
      ) : error || !animationData ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-2 border-dashed border-blue-300">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">📦</div>
            <p className="text-xs text-gray-700 font-semibold">Lottie Dosyası Bulunamadı</p>
            <p className="text-xs text-gray-600 mt-1">{lottieFiles[state]}</p>
            <p className="text-xs text-gray-500 mt-2">
              After Effects'ten export edilmiş JSON dosyası gerekli
            </p>
            <p className="text-xs text-gray-400 mt-1 text-center max-w-xs">
              Bodymovin eklentisi ile export edin ve /public/dost/lottie/ klasörüne koyun
            </p>
          </div>
        </div>
      ) : (
        <div className="w-full h-full" style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}>
          <Lottie
            animationData={animationData}
            loop={state !== 'celebrating'}
            autoplay={true}
            style={{ width: size, height: size }}
          />
        </div>
      )}
    </motion.div>
  );
}

