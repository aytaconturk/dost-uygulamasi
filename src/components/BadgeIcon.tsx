import type { Badge, StudentBadge } from '../lib/badges';

interface BadgeIconProps {
  badge: Badge | StudentBadge;
  size?: 'sm' | 'md' | 'lg';
  locked?: boolean;
  showName?: boolean;
  onClick?: () => void;
}

export default function BadgeIcon({
  badge,
  size = 'md',
  locked = false,
  showName = false,
  onClick,
}: BadgeIconProps) {
  // Handle both Badge and StudentBadge types
  const badgeData: Badge = ('badge' in badge && badge.badge) ? badge.badge as Badge : badge as Badge;
  if (!badgeData) return null;

  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };

  const iconSizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const tierColors = {
    bronze: 'from-amber-600 to-amber-800',
    silver: 'from-gray-300 to-gray-500',
    gold: 'from-yellow-400 to-yellow-600',
    platinum: 'from-purple-300 to-purple-500',
  };

  const tierBorder = {
    bronze: 'border-amber-600',
    silver: 'border-gray-400',
    gold: 'border-yellow-500',
    platinum: 'border-purple-400',
  };

  return (
    <div
      className={`flex flex-col items-center gap-2 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div
        className={`relative ${sizeClasses[size]} rounded-full ${
          locked
            ? 'bg-gray-200 border-2 border-gray-300'
            : `bg-gradient-to-br ${tierColors[badgeData.tier]} border-2 ${tierBorder[badgeData.tier]}`
        } flex items-center justify-center shadow-lg transition-transform hover:scale-110`}
      >
        {locked ? (
          <div className="text-gray-400 text-2xl">🔒</div>
        ) : (
          <img
            src={badgeData.icon_url}
            alt={badgeData.name}
            className={`${iconSizeClasses[size]} drop-shadow-lg`}
            onError={(e) => {
              // Fallback emoji
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling!.classList.remove('hidden');
            }}
          />
        )}
        <div className="hidden text-3xl">
          {badgeData.tier === 'bronze' && '🥉'}
          {badgeData.tier === 'silver' && '🥈'}
          {badgeData.tier === 'gold' && '🥇'}
          {badgeData.tier === 'platinum' && '👑'}
        </div>
      </div>

      {showName && (
        <div
          className={`text-center ${
            locked ? 'text-gray-400' : 'text-gray-700'
          } font-medium text-sm max-w-[100px]`}
        >
          {badgeData.name}
        </div>
      )}
    </div>
  );
}
