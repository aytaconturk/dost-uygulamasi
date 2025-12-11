/**
 * SVG TABANLI DOST MASKOT COMPONENT
 * 
 * Bu dosya sadece örnek amaçlıdır, uygulamaya eklenmeyecek.
 * Tamamen SVG ve CSS ile çizilmiş, kod tabanlı maskot.
 * 
 * Avantajlar:
 * - Çok hafif (dosya boyutu küçük)
 * - Özelleştirilebilir
 * - Responsive
 * - Framer Motion ile entegre
 * 
 * Dezavantajlar:
 * - Tasarım yeteneği gerekir
 * - Karmaşık animasyonlar zaman alıcı
 */

import { motion } from 'framer-motion';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';

interface Props {
  state: MascotState;
  size?: number;
}

export default function DostMascotSVG({ state, size = 112 }: Props) {
  // Her state için farklı animasyonlar
  const animations = {
    idle: {
      body: { 
        y: [0, -5, 0], 
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } 
      },
      eyes: { 
        scaleY: [1, 0.1, 1], 
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } 
      },
    },
    talking: {
      mouth: { 
        scaleY: [1, 0.3, 1], 
        transition: { duration: 0.3, repeat: Infinity, ease: 'easeInOut' } 
      },
      body: { 
        scale: [1, 1.05, 1], 
        transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' } 
      },
    },
    listening: {
      ears: { 
        rotate: [-8, 8, -8], 
        transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } 
      },
      eyes: { 
        scale: [1, 1.2, 1], 
        transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' } 
      },
      body: {
        x: [0, 2, 0],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
      }
    },
    celebrating: {
      body: { 
        y: [0, -20, 0], 
        rotate: [0, 5, -5, 0],
        scale: [1, 1.1, 1],
        transition: { duration: 0.6, repeat: 3, ease: 'easeOut' } 
      },
      eyes: {
        scale: [1, 1.3, 1],
        transition: { duration: 0.3, repeat: 3 }
      }
    },
  };

  const currentAnim = animations[state];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className="absolute bottom-4 right-4 z-50"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Vücut - Mor renk */}
      <motion.circle
        cx="100"
        cy="130"
        r="55"
        fill="#512DA8"
        animate={currentAnim.body}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
      />
      
      {/* Kafa - Açık mor renk */}
      <motion.circle
        cx="100"
        cy="70"
        r="50"
        fill="#7986CB"
        animate={currentAnim.body}
        style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))' }}
      />
      
      {/* Gözler */}
      <motion.ellipse
        cx="85"
        cy="65"
        rx="8"
        ry="12"
        fill="white"
        animate={currentAnim.eyes}
      />
      <motion.ellipse
        cx="115"
        cy="65"
        rx="8"
        ry="12"
        fill="white"
        animate={currentAnim.eyes}
      />
      
      {/* Göz bebekleri */}
      <circle cx="85" cy="65" r="4" fill="#512DA8" />
      <circle cx="115" cy="65" r="4" fill="#512DA8" />
      
      {/* Ağız - sadece talking state'inde animasyonlu */}
      {state === 'talking' && (
        <motion.ellipse
          cx="100"
          cy="85"
          rx="18"
          ry="10"
          fill="white"
          animate={currentAnim.mouth}
        />
      )}
      
      {/* Normal ağız - diğer state'lerde */}
      {state !== 'talking' && (
        <ellipse
          cx="100"
          cy="85"
          rx="15"
          ry="5"
          fill="#512DA8"
          opacity="0.6"
        />
      )}
      
      {/* Kulaklar - her zaman görünür ama listening'de animasyonlu */}
      <motion.ellipse
        cx="70"
        cy="50"
        rx="12"
        ry="20"
        fill="#7986CB"
        animate={state === 'listening' ? currentAnim.ears : {}}
      />
      <motion.ellipse
        cx="130"
        cy="50"
        rx="12"
        ry="20"
        fill="#7986CB"
        animate={state === 'listening' ? currentAnim.ears : {}}
      />
      
      {/* Kulak içi */}
      <ellipse cx="70" cy="50" rx="6" ry="10" fill="#512DA8" opacity="0.5" />
      <ellipse cx="130" cy="50" rx="6" ry="10" fill="#512DA8" opacity="0.5" />
      
      {/* Konfeti - sadece celebrating state'inde */}
      {state === 'celebrating' && (
        <>
          {[...Array(8)].map((_, i) => {
            const angle = (i * 360) / 8;
            const distance = 80;
            const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3'];
            
            return (
              <motion.circle
                key={i}
                cx={100}
                cy={70}
                r="6"
                fill={colors[i % colors.length]}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  x: Math.cos((angle * Math.PI) / 180) * distance,
                  y: Math.sin((angle * Math.PI) / 180) * distance,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  delay: i * 0.1,
                  duration: 1,
                  ease: 'easeOut'
                }}
              />
            );
          })}
        </>
      )}
      
      {/* Listening state için ses dalgaları */}
      {state === 'listening' && (
        <>
          {[1, 2, 3].map((i) => (
            <motion.circle
              key={i}
              cx="100"
              cy="70"
              r={30 + i * 15}
              fill="none"
              stroke="#4ECDC4"
              strokeWidth="3"
              opacity={0.6 - i * 0.15}
              animate={{
                scale: [1, 1.5, 1],
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
    </motion.svg>
  );
}



