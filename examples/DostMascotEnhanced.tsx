/**
 * GELİŞTİRİLMİŞ DOST MASKOT COMPONENT
 * 
 * Bu dosya sadece örnek amaçlıdır, uygulamaya eklenmeyecek.
 * Mevcut görselleri kullanarak CSS + Framer Motion animasyonları ekler.
 * 
 * Kullanım:
 * 1. Bu dosyayı src/components/ altına kopyalayın
 * 2. Gerekli görselleri public/dost/ klasörüne ekleyin
 * 3. Mevcut DostMascot.tsx yerine bu component'i kullanın
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';

interface Props {
  state: MascotState;
  size?: 'small' | 'medium' | 'large';
  position?: 'bottom-right' | 'bottom-left' | 'center';
  showSpeechBubble?: boolean;
  speechText?: string;
}

export default function DostMascotEnhanced({ 
  state, 
  size = 'medium',
  position = 'bottom-right',
  showSpeechBubble = false,
  speechText = ''
}: Props) {
  const [imageSrc, setImageSrc] = useState('/dost/idle.png');

  // State değiştiğinde görseli güncelle
  useEffect(() => {
    const imageMap: Record<MascotState, string> = {
      idle: '/dost/idle.png',
      talking: '/dost/talking.gif',
      listening: '/dost/listening.png', // Yeni görsel gerekli
      celebrating: '/dost/celebrating.gif', // Yeni görsel gerekli
    };
    setImageSrc(imageMap[state]);
  }, [state]);

  // Boyut ayarları
  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-28 h-28',
    large: 'w-40 h-40',
  };

  // Pozisyon ayarları
  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'bottom-1/2 right-1/2 transform translate-x-1/2 translate-y-1/2',
  };

  // Her state için farklı animasyonlar
  const containerAnimations = {
    idle: {
      y: [0, -8, 0],
      transition: { 
        duration: 3, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      },
    },
    talking: {
      scale: [1, 1.05, 1],
      transition: { 
        duration: 0.5, 
        repeat: Infinity,
        ease: 'easeInOut'
      },
    },
    listening: {
      rotate: [-3, 3, -3],
      scale: [1, 1.08, 1],
      transition: { 
        duration: 1.2, 
        repeat: Infinity,
        ease: 'easeInOut'
      },
    },
    celebrating: {
      y: [0, -30, 0],
      rotate: [0, 10, -10, 0],
      scale: [1, 1.2, 1],
      transition: { 
        duration: 0.6, 
        repeat: 3,
        ease: 'easeOut'
      },
    },
  };

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} ${sizeClasses[size]} z-50`}
      animate={containerAnimations[state]}
      initial={false}
    >
      {/* Konuşma balonu */}
      {showSpeechBubble && speechText && (
        <motion.div
          className="absolute bottom-full right-0 mb-2 bg-white rounded-lg p-3 shadow-lg max-w-xs"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <p className="text-sm text-gray-800 font-medium">{speechText}</p>
          {/* Ok işareti */}
          <div className="absolute bottom-0 right-4 -mb-2">
            <div className="w-4 h-4 bg-white transform rotate-45"></div>
          </div>
        </motion.div>
      )}

      {/* Maskot görseli */}
      <img 
        src={imageSrc} 
        alt="DOST maskotu" 
        className="w-full h-full object-contain drop-shadow-lg"
      />
      
      {/* Listening state için ekstra görsel efektler - ses dalgaları */}
      {state === 'listening' && (
        <>
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-blue-400 pointer-events-none"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut'
            }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-blue-300 pointer-events-none"
            animate={{
              scale: [1, 1.6, 1],
              opacity: [0.4, 0, 0.4],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: 0.3,
              ease: 'easeOut'
            }}
          />
        </>
      )}
      
      {/* Celebrating state için konfeti efekti */}
      {state === 'celebrating' && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const distance = 60;
            const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#AA96DA'];
            
            return (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  left: '50%',
                  top: '50%',
                  backgroundColor: colors[i % colors.length],
                }}
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * distance,
                  y: Math.sin((angle * Math.PI) / 180) * distance,
                  scale: 0,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  delay: i * 0.05,
                  duration: 1,
                  ease: 'easeOut'
                }}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
}


