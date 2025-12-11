/**
 * SPRITE SHEET TABANLI DOST MASKOT
 * Sprite sheet kullanarak animasyonlu görseller
 */

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';

interface Props {
  state: MascotState;
  size?: number;
}

export default function DostMascotSprite({ state, size = 160 }: Props) {
  // Sprite sheet'teki frame pozisyonları
  const spriteConfig = {
    idle: { frames: 4, fps: 2, row: 0 },
    talking: { frames: 8, fps: 10, row: 1 },
    listening: { frames: 6, fps: 6, row: 2 },
    celebrating: { frames: 12, fps: 12, row: 3 },
  };

  const config = spriteConfig[state];
  const [currentFrame, setCurrentFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentFrame((prev) => (prev + 1) % config.frames);
    }, 1000 / config.fps);

    return () => clearInterval(interval);
  }, [state, config]);

  // Sprite sheet'ten doğru frame'i göster
  // Not: Gerçek sprite sheet görseli olmadığı için SVG ile simüle ediyoruz
  const backgroundPosition = `-${currentFrame * 200}px -${config.row * 200}px`;

  // Container animasyonları
  const containerAnimations = {
    idle: {
      y: [0, -6, 0],
      transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
    },
    talking: {
      scale: [1, 1.06, 1],
      transition: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' },
    },
    listening: {
      rotate: [-3, 3, -3],
      transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' },
    },
    celebrating: {
      y: [0, -30, 0],
      rotate: [0, 10, -10, 0],
      scale: [1, 1.2, 1],
      transition: { duration: 0.5, repeat: 4, ease: 'easeOut' },
    },
  };

  return (
    <motion.div
      className="absolute bottom-8 right-8 z-50"
      style={{ width: size, height: size }}
      animate={containerAnimations[state]}
      initial={false}
    >
      {/* Not: Gerçek sprite sheet görseli olmadığı için placeholder gösteriyoruz */}
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-center p-4">
          <div className="text-4xl mb-2">
            {state === 'idle' && '😊'}
            {state === 'talking' && '🗣️'}
            {state === 'listening' && '👂'}
            {state === 'celebrating' && '🎉'}
          </div>
          <p className="text-xs text-gray-600 font-semibold">Sprite Sheet</p>
          <p className="text-xs text-gray-500">Frame: {currentFrame + 1}/{config.frames}</p>
          <p className="text-xs text-gray-500 mt-1">FPS: {config.fps}</p>
        </div>
      </div>
      
      {/* Gerçek sprite sheet kullanımı için (yorum satırı):
      <div
        className="w-full h-full"
        style={{
          backgroundImage: 'url(/dost/sprite-sheet.png)',
          backgroundSize: '800px 800px', // 4x4 grid, her frame 200x200
          backgroundPosition,
          imageRendering: 'pixelated',
        }}
      />
      */}
    </motion.div>
  );
}



