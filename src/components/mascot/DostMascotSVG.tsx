/**
 * SVG TABANLI DOST MASKOT - GÖRSELE UYGUN TASARIM
 * Görseldeki tasarıma birebir uygun - Gradient, visör, detaylı gözler
 */

import { motion } from 'framer-motion';

type MascotState = 'idle' | 'talking' | 'listening' | 'celebrating';

interface Props {
  state: MascotState;
  size?: number;
}

export default function DostMascotSVG({ state, size = 160 }: Props) {
  // Her state için farklı animasyonlar
  const animations = {
    idle: {
      body: { 
        y: [0, -8, 0], 
        transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } 
      },
      eyes: { 
        scaleY: [1, 0.1, 1], 
        transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } 
      },
      head: {
        rotate: [0, 1.5, -1.5, 0],
        transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
      },
      antenna: {
        y: [0, -3, 0],
        opacity: [0.8, 1, 0.8],
        transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
      }
    },
    talking: {
      // Ağız animasyonu - konuşma hızına uygun, daha yavaş
      mouth: { 
        scaleY: [1, 0.3, 1, 0.4, 1, 0.35, 1], 
        scaleX: [1, 1.2, 1, 1.15, 1, 1.18, 1],
        transition: { 
          duration: 0.6, // Daha yavaş - kelime hızına uygun
          repeat: Infinity, 
          ease: 'easeInOut',
          times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1] // Kelime benzeri ritim
        } 
      },
      body: { 
        scale: [1, 1.08, 1], 
        y: [0, -2, 0],
        transition: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' } 
      },
      eyes: {
        scale: [1, 1.1, 1],
        transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
      },
      head: {
        y: [0, -3, 0],
        transition: { duration: 0.4, repeat: Infinity, ease: 'easeInOut' }
      },
      antenna: {
        scale: [1, 1.15, 1],
        opacity: [0.9, 1, 0.9],
        transition: { duration: 0.5, repeat: Infinity }
      }
    },
    listening: {
      ears: { 
        scale: [1, 1.2, 1],
        transition: { duration: 0.8, repeat: Infinity, ease: 'easeInOut' } 
      },
      eyes: { 
        scale: [1, 1.25, 1], 
        y: [0, -3, 0],
        transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } 
      },
      body: {
        x: [0, 4, 0],
        transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
      },
      head: {
        rotate: [-4, 4, -4],
        transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' }
      },
      antenna: {
        scale: [1, 1.25, 1],
        opacity: [0.7, 1, 0.7],
        transition: { duration: 1, repeat: Infinity }
      }
    },
    celebrating: {
      body: { 
        y: [0, -35, 0], 
        rotate: [0, 12, -12, 0],
        scale: [1, 1.25, 1],
        transition: { duration: 0.5, repeat: 4, ease: 'easeOut' } 
      },
      eyes: {
        scale: [1, 1.5, 1],
        transition: { duration: 0.3, repeat: 4 }
      },
      arms: {
        rotate: [0, 30, -30, 0],
        y: [0, -8, 0],
        transition: { duration: 0.5, repeat: 4 }
      },
      head: {
        rotate: [0, 8, -8, 0],
        transition: { duration: 0.5, repeat: 4 }
      },
      antenna: {
        scale: [1, 1.5, 1],
        opacity: [0.8, 1, 0.8],
        transition: { duration: 0.5, repeat: 4 }
      }
    },
  };

  const currentAnim = animations[state];

  return (
    <motion.div
      className="absolute bottom-8 right-8 z-50"
      style={{ width: size, height: size }}
      initial={false}
    >
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.2))' }}
      >
        {/* Gradient tanımlamaları - görseldeki renklere uygun */}
        <defs>
          <linearGradient id="headGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#B8E986" stopOpacity="1" /> {/* Lime green */}
            <stop offset="40%" stopColor="#7FDBDA" stopOpacity="1" /> {/* Light teal */}
            <stop offset="100%" stopColor="#4ECDC4" stopOpacity="1" /> {/* Teal */}
          </linearGradient>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7FDBDA" stopOpacity="1" /> {/* Light teal */}
            <stop offset="100%" stopColor="#4ECDC4" stopOpacity="1" /> {/* Teal */}
          </linearGradient>
          <radialGradient id="antennaGlow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#4ECDC4" stopOpacity="1" />
            <stop offset="100%" stopColor="#4ECDC4" stopOpacity="0.3" />
          </radialGradient>
          <linearGradient id="highlight" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="highlightVertical" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Gövde - Küçük, yuvarlak, gradient */}
        <motion.ellipse
          cx="100"
          cy="158"
          rx="38"
          ry="32"
          fill="url(#bodyGradient)"
          animate={currentAnim.body}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
        />
        
        {/* Gövde highlight - glossy görünüm */}
        <motion.ellipse
          cx="100"
          cy="148"
          rx="30"
          ry="22"
          fill="url(#highlightVertical)"
          animate={currentAnim.body}
          opacity="0.6"
        />
        
        {/* Kollar/Wing benzeri appendages - yanlarda */}
        <motion.g animate={state === 'celebrating' ? currentAnim.arms : {}}>
          {/* Sol kol/wing */}
          <motion.ellipse
            cx="62"
            cy="152"
            rx="14"
            ry="20"
            fill="url(#bodyGradient)"
            animate={state === 'listening' ? currentAnim.ears : {}}
            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
          />
          <ellipse cx="62" cy="148" rx="10" ry="14" fill="url(#highlight)" opacity="0.5" />
          
          {/* Sağ kol/wing - celebrating'de kalkık */}
          {state === 'celebrating' ? (
            <motion.ellipse
              cx="138"
              cy="132"
              rx="14"
              ry="20"
              fill="url(#bodyGradient)"
              animate={currentAnim.arms}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }}
            />
          ) : (
            <ellipse cx="138" cy="152" rx="14" ry="20" fill="url(#bodyGradient)" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
          )}
          <ellipse 
            cx={state === 'celebrating' ? 138 : 138} 
            cy={state === 'celebrating' ? 128 : 148} 
            rx="10" 
            ry="14" 
            fill="url(#highlight)" 
            opacity="0.5" 
          />
        </motion.g>
        
        {/* Kafa - Büyük, yuvarlak, gradient (lime green'den teal'e) */}
        <motion.ellipse
          cx="100"
          cy="82"
          rx="62"
          ry="70"
          fill="url(#headGradient)"
          animate={{ ...currentAnim.body, ...currentAnim.head }}
          style={{ filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))' }}
        />
        
        {/* Kafa highlight - sağ üstte parlaklık (glossy görünüm) */}
        <motion.ellipse
          cx="115"
          cy="50"
          rx="35"
          ry="40"
          fill="url(#highlight)"
          animate={currentAnim.head}
          opacity="0.6"
        />
        
        {/* Kafa üst detay - küçük dikdörtgen */}
        <rect x="90" y="20" width="20" height="6" rx="2" fill="#4ECDC4" opacity="0.5" />
        
        {/* Visör alanı - koyu, gözler için */}
        <motion.ellipse
          cx="100"
          cy="78"
          rx="52"
          ry="38"
          fill="#1A4A4A"
          fillOpacity="0.9"
          animate={currentAnim.head}
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
        />
        
        {/* Gözler - Büyük, siyah pupil, kalın beyaz outline, içinde 2 beyaz reflection */}
        <motion.g animate={currentAnim.eyes}>
          {/* Sol göz - beyaz outline */}
          <circle cx="82" cy="75" r="16" fill="#FFFFFF" />
          {/* Sol göz - siyah pupil */}
          <circle cx="82" cy="75" r="11" fill="#000000" />
          {/* Sol göz - büyük reflection */}
          <circle cx="85" cy="72" r="4" fill="#FFFFFF" />
          {/* Sol göz - küçük reflection */}
          <circle cx="88" cy="74" r="2" fill="#FFFFFF" />
          
          {/* Sağ göz - beyaz outline */}
          <circle cx="118" cy="75" r="16" fill="#FFFFFF" />
          {/* Sağ göz - siyah pupil */}
          <circle cx="118" cy="75" r="11" fill="#000000" />
          {/* Sağ göz - büyük reflection */}
          <circle cx="121" cy="72" r="4" fill="#FFFFFF" />
          {/* Sağ göz - küçük reflection */}
          <circle cx="124" cy="74" r="2" fill="#FFFFFF" />
        </motion.g>
        
        {/* Ağız - talking state'inde animasyonlu (yavaş, konuşma hızında) */}
        {state === 'talking' && (
          <motion.g animate={currentAnim.mouth}>
            {/* Beyaz gülümseme çizgisi */}
            <path
              d="M 75 95 Q 100 105 125 95"
              stroke="#FFFFFF"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            {/* Alt teal şekil (ağız içi) */}
            <motion.ellipse
              cx="100"
              cy="98"
              rx="20"
              ry="12"
              fill="#4ECDC4"
              animate={currentAnim.mouth}
            />
          </motion.g>
        )}
        
        {/* Dinleme yüz ifadesi - listening state'inde */}
        {state === 'listening' && (
          <motion.path
            d="M 75 95 Q 100 100 125 95"
            stroke="#FFFFFF"
            strokeWidth="4"
            fill="none"
            strokeLinecap="round"
            animate={{
              d: [
                "M 75 95 Q 100 100 125 95",
                "M 75 95 Q 100 103 125 95",
                "M 75 95 Q 100 100 125 95"
              ]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        )}
        
        {/* Normal ağız - idle ve celebrating state'lerde */}
        {state !== 'talking' && state !== 'listening' && (
          <motion.g>
            {/* Beyaz gülümseme çizgisi */}
            <motion.path
              d={state === 'idle' ? "M 75 95 Q 100 100 125 95" : "M 75 97 Q 100 102 125 97"}
              stroke="#FFFFFF"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
              animate={state === 'idle' ? {
                d: [
                  "M 75 95 Q 100 100 125 95",
                  "M 75 95 Q 100 102 125 95",
                  "M 75 95 Q 100 100 125 95"
                ]
              } : {}}
              transition={state === 'idle' ? {
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              } : {}}
            />
            {/* Alt teal şekil (ağız içi) - sadece celebrating'de */}
            {state === 'celebrating' && (
              <ellipse cx="100" cy="100" rx="18" ry="10" fill="#4ECDC4" opacity="0.6" />
            )}
          </motion.g>
        )}
        
        {/* Anten/Indicator - Üstte küçük teal küre, beyaz reflection ile */}
        <motion.g>
          <motion.circle
            cx="100"
            cy="15"
            r="9"
            fill="url(#antennaGlow)"
            animate={currentAnim.antenna}
            style={{ filter: 'blur(2px)' }}
          />
          <motion.circle
            cx="100"
            cy="15"
            r="7"
            fill="#4ECDC4"
            animate={currentAnim.antenna}
          />
          {/* Anten reflection */}
          <circle cx="102" cy="13" r="2" fill="#FFFFFF" opacity="0.8" />
        </motion.g>
        
        {/* Konfeti - celebrating state'inde */}
        {state === 'celebrating' && (
          <>
            {[...Array(16)].map((_, i) => {
              const angle = (i * 360) / 16;
              const distance = 110;
              const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#AA96DA', '#FFB6C1', '#B8E986'];
              
              return (
                <motion.circle
                  key={i}
                  cx={100}
                  cy={82}
                  r="8"
                  fill={colors[i % colors.length]}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * distance,
                    y: Math.sin((angle * Math.PI) / 180) * distance,
                    scale: [0, 1.3, 0],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    delay: i * 0.04,
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
            {[1, 2, 3, 4].map((i) => (
              <motion.circle
                key={i}
                cx="100"
                cy="82"
                r={38 + i * 14}
                fill="none"
                stroke="#4ECDC4"
                strokeWidth="3"
                opacity={0.7 - i * 0.15}
                animate={{
                  scale: [1, 1.7, 1],
                  opacity: [0.7 - i * 0.15, 0, 0.7 - i * 0.15],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: 'easeOut'
                }}
              />
            ))}
          </>
        )}
        
        {/* Talking state için anten etrafında ses efektleri */}
        {state === 'talking' && (
          <>
            {[1, 2].map((i) => (
              <motion.circle
                key={i}
                cx="100"
                cy="15"
                r={9 + i * 5}
                fill="none"
                stroke="#4ECDC4"
                strokeWidth="2"
                opacity={0.6 - i * 0.2}
                animate={{
                  scale: [1, 1.6, 1],
                  opacity: [0.6 - i * 0.2, 0, 0.6 - i * 0.2],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.25,
                }}
              />
            ))}
          </>
        )}
      </motion.svg>
    </motion.div>
  );
}
