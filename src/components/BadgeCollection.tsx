import { useState } from 'react';
import { useBadges } from '../hooks/useBadges';
import BadgeIcon from './BadgeIcon';
import type { Badge } from '../lib/badges';

interface BadgeCollectionProps {
  filter?: 'all' | 'earned' | 'locked';
}

export default function BadgeCollection({ filter = 'all' }: BadgeCollectionProps) {
  const { allBadges, studentBadges, loading, earnedBadgesCount, totalBadgesCount } =
    useBadges();
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Rozetler yükleniyor...</div>
      </div>
    );
  }

  // Create earned badges map for quick lookup
  const earnedBadgeIds = new Set(studentBadges.map((sb) => sb.badge_id));

  // Filter badges
  let displayBadges = allBadges;
  if (filter === 'earned') {
    displayBadges = allBadges.filter((b) => earnedBadgeIds.has(b.id));
  } else if (filter === 'locked') {
    displayBadges = allBadges.filter((b) => !earnedBadgeIds.has(b.id));
  }

  // Group badges by type
  const levelBadges = displayBadges.filter((b) => b.badge_type === 'level');
  const achievementBadges = displayBadges.filter((b) => b.badge_type === 'achievement');
  const specialBadges = displayBadges.filter((b) => b.badge_type === 'special');

  const BadgeSection = ({
    title,
    badges,
    icon,
  }: {
    title: string;
    badges: Badge[];
    icon: string;
  }) => {
    if (badges.length === 0) return null;

    return (
      <div className="mb-8">
        <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
          {badges.map((badge) => {
            const isEarned = earnedBadgeIds.has(badge.id);
            return (
              <BadgeIcon
                key={badge.id}
                badge={badge}
                size="md"
                locked={!isEarned}
                showName
                onClick={() => setSelectedBadge(badge)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl p-6 mb-6 shadow-lg">
        <h2 className="text-3xl font-bold mb-2">Rozet Koleksiyonum 🏆</h2>
        <div className="flex items-center gap-4 text-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span>
              {earnedBadgesCount} / {totalBadgesCount} Rozet
            </span>
          </div>
          <div className="flex-1 bg-white/20 rounded-full h-3 overflow-hidden">
            <div
              className="bg-yellow-400 h-full rounded-full transition-all duration-500"
              style={{
                width: `${(earnedBadgesCount / totalBadgesCount) * 100}%`,
              }}
            />
          </div>
          <span className="font-bold">
            %{Math.round((earnedBadgesCount / totalBadgesCount) * 100)}
          </span>
        </div>
      </div>

      {/* Badge sections */}
      <div className="bg-white rounded-xl p-6 shadow">
        <BadgeSection title="Seviye Rozetleri" badges={levelBadges} icon="🎓" />
        <BadgeSection title="Başarı Rozetleri" badges={achievementBadges} icon="⭐" />
        <BadgeSection title="Özel Rozetler" badges={specialBadges} icon="💎" />
      </div>

      {/* Badge detail modal */}
      {selectedBadge && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setSelectedBadge(null)}
        >
          <div
            className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <BadgeIcon badge={selectedBadge} size="lg" locked={!earnedBadgeIds.has(selectedBadge.id)} />
              <h3 className="text-2xl font-bold text-purple-900 mt-4 mb-2">
                {selectedBadge.name}
              </h3>
              {selectedBadge.description && (
                <p className="text-gray-600 mb-4">{selectedBadge.description}</p>
              )}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                <span className="capitalize">{selectedBadge.tier}</span>
                <span>•</span>
                <span>
                  {selectedBadge.badge_type === 'level' && '📚 Seviye'}
                  {selectedBadge.badge_type === 'achievement' && '⭐ Başarı'}
                  {selectedBadge.badge_type === 'special' && '💎 Özel'}
                </span>
              </div>
              {selectedBadge.points_reward > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <div className="text-yellow-800 font-semibold">
                    ✨ +{selectedBadge.points_reward} Bonus Puan
                  </div>
                </div>
              )}
              {!earnedBadgeIds.has(selectedBadge.id) && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-gray-600 text-sm">
                  Bu rozeti henüz kazanmadın. Devam et! 💪
                </div>
              )}
              <button
                onClick={() => setSelectedBadge(null)}
                className="mt-6 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-semibold"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
