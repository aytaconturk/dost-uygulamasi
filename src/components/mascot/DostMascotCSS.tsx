/**
 * CSS + GÖRSELLER TABANLI DOST MASKOT
 * Mevcut görselleri kullanarak CSS animasyonları ekler
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';

interface Props {
  state: MascotState;
  size?: number;
}

export default function DostMascotCSS({ state, size = 160 }: Props) {
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

  // Her state için farklı animasyonlar
  const containerAnimations = {
    idle: {
      y: [0, -8, 0],
      transition: { 
        duration: 2.5, 
        repeat: Infinity, 
        ease: 'easeInOut' 
      },
    },
    talking: {
      scale: [1, 1.06, 1],
      transition: { 
        duration: 0.4, 
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
        duration: 0.5, 
        repeat: 4,
        ease: 'easeOut'
      },
    },
  };

  return (
    <motion.div
      className="absolute bottom-8 right-8 z-50"
      style={{ width: size, height: size }}
      animate={containerAnimations[state]}
      initial={false}
    >
      <img 
        src={imageSrc} 
        alt="DOST maskotu" 
        className="w-full h-full object-contain drop-shadow-lg"
        style={{ filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.15))' }}
      />
      
      {/* Listening state için ekstra görsel efektler - ses dalgaları */}
      {state === 'listening' && (
        <>
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-4 border-blue-400 pointer-events-none"
              style={{ borderColor: '#4ECDC4' }}
              animate={{
                scale: [1, 1.4 + i * 0.1, 1],
                opacity: [0.6 - i * 0.15, 0, 0.6 - i * 0.15],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeOut'
              }}
            />
          ))}
        </>
      )}
      
      {/* Celebrating state için konfeti efekti */}
      {state === 'celebrating' && (
        <div className="absolute inset-0 pointer-events-none overflow-visible">
          {[...Array(12)].map((_, i) => {
            const angle = (i * 360) / 12;
            const distance = 80;
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




