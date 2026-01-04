import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store/store';
import {
  getAllBadges,
  getStudentBadges,
  checkAndAwardLevelBadges,
  type Badge,
  type StudentBadge,
  type BadgeMetrics,
} from '../lib/badges';

export function useBadges() {
  const student = useSelector((state: RootState) => state.user.student);
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [studentBadges, setStudentBadges] = useState<StudentBadge[]>([]);
  const [newBadges, setNewBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  // Load all badge definitions (only once)
  useEffect(() => {
    const loadAllBadges = async () => {
      try {
        const badges = await getAllBadges();
        setAllBadges(badges);
      } catch (error) {
        console.error('❌ Error loading all badges:', error);
      }
    };

    loadAllBadges();
  }, []);

  // Load student's earned badges
  useEffect(() => {
    if (!student?.id) return;

    const loadStudentBadges = async () => {
      try {
        setLoading(true);
        const badges = await getStudentBadges(student.id);
        setStudentBadges(badges);
      } catch (error) {
        console.error('❌ Error loading student badges:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStudentBadges();
  }, [student?.id]);

  /**
   * Check for new badges after level completion
   */
  const checkForNewBadges = async (
    storyId: number,
    level: number,
    sessionId: string | null,
    metrics: BadgeMetrics
  ): Promise<Badge[]> => {
    if (!student?.id) return [];

    try {
      const earnedBadges = await checkAndAwardLevelBadges(
        student.id,
        storyId,
        level,
        sessionId,
        metrics
      );

      if (earnedBadges.length > 0) {
        setNewBadges(earnedBadges);
        // Refresh student badges
        const updatedBadges = await getStudentBadges(student.id);
        setStudentBadges(updatedBadges);
      }

      return earnedBadges;
    } catch (error) {
      console.error('❌ Error checking for new badges:', error);
      return [];
    }
  };

  /**
   * Clear new badges (after showing animation)
   */
  const clearNewBadges = () => {
    setNewBadges([]);
  };

  /**
   * Get badge by key
   */
  const getBadgeByKey = (badgeKey: string): Badge | undefined => {
    return allBadges.find(b => b.badge_key === badgeKey);
  };

  /**
   * Check if student has a specific badge
   */
  const hasBadge = (badgeKey: string): boolean => {
    return studentBadges.some(sb => sb.badge?.badge_key === badgeKey);
  };

  /**
   * Get badges by type
   */
  const getBadgesByType = (type: 'level' | 'achievement' | 'special'): Badge[] => {
    return allBadges.filter(b => b.badge_type === type);
  };

  /**
   * Get earned badges count
   */
  const earnedBadgesCount = studentBadges.length;

  /**
   * Get total badges count
   */
  const totalBadgesCount = allBadges.length;

  return {
    allBadges,
    studentBadges,
    newBadges,
    loading,
    earnedBadgesCount,
    totalBadgesCount,
    checkForNewBadges,
    clearNewBadges,
    getBadgeByKey,
    hasBadge,
    getBadgesByType,
  };
}
