import { useEffect, useState } from 'react';
import type { Badge } from '../lib/badges';

interface BadgeAnimationProps {
  badge: Badge | null;
  show: boolean;
  onClose?: () => void;
}

export default function BadgeAnimation({ badge, show, onClose }: BadgeAnimationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (show && badge) {
      setIsVisible(true);
      setTimeout(() => setIsAnimating(true), 50);

      // Auto close after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [show, badge]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!isVisible || !badge) return null;

  // Tier colors
  const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-300 to-purple-500',
  };

  const tierGlow = {
    bronze: 'shadow-amber-500/50',
    silver: 'shadow-gray-400/50',
    gold: 'shadow-yellow-400/50',
    platinum: 'shadow-purple-400/50',
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform transition-all duration-500 ${
          isAnimating ? 'scale-100 rotate-0' : 'scale-50 rotate-12'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Confetti effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: '-10%',
                animationDelay: `${Math.random() * 0.5}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center relative z-10">
          {/* Badge icon */}
          <div className="mb-6 flex justify-center">
            <div
              className={`relative w-32 h-32 rounded-full bg-gradient-to-br ${tierColors[badge.tier]} ${tierGlow[badge.tier]} shadow-2xl flex items-center justify-center transform transition-transform duration-700 ${
                isAnimating ? 'scale-100 rotate-0' : 'scale-0 rotate-180'
              }`}
            >
              <img
                src={badge.icon_url}
                alt={badge.name}
                className="w-20 h-20 drop-shadow-lg"
                onError={(e) => {
                  // Fallback emoji if SVG not found
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling!.classList.remove('hidden');
                }}
              />
              <div className="hidden text-5xl">
                {badge.tier === 'bronze' && '🥉'}
                {badge.tier === 'silver' && '🥈'}
                {badge.tier === 'gold' && '🥇'}
                {badge.tier === 'platinum' && '👑'}
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold text-purple-900 mb-2">
            Yeni Rozet Kazandın! 🎉
          </h2>

          {/* Badge name */}
          <div
            className={`inline-block px-6 py-2 rounded-full bg-gradient-to-r ${tierColors[badge.tier]} text-white font-bold text-xl mb-3 shadow-lg`}
          >
            {badge.name}
          </div>

          {/* Description */}
          {badge.description && (
            <p className="text-gray-600 mb-4">{badge.description}</p>
          )}

          {/* Points reward */}
          {badge.points_reward > 0 && (
            <div className="flex items-center justify-center gap-2 text-green-600 font-semibold">
              <span className="text-2xl">✨</span>
              <span>+{badge.points_reward} Bonus Puan!</span>
            </div>
          )}

          {/* Close button */}
          <button
            onClick={handleClose}
            className="mt-6 px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold shadow-lg transform transition-transform hover:scale-105"
          >
            Harika! 👍
          </button>
        </div>
      </div>

      {/* Custom CSS for confetti animation */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(500px) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear infinite;
        }
      `}</style>
    </div>
  );
}
