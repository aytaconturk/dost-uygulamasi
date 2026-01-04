import { supabase } from './supabase';
import { awardPoints } from './supabase';

// Badge types
export interface Badge {
  id: string;
  badge_key: string;
  name: string;
  description: string | null;
  badge_type: 'level' | 'achievement' | 'special';
  level_number: number | null;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  icon_url: string;
  criteria: BadgeCriteria;
  points_reward: number;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudentBadge {
  id: string;
  student_id: string;
  badge_id: string;
  story_id: number | null;
  session_id: string | null;
  earned_at: string;
  metadata: any;
  badge?: Badge; // Joined badge data
}

export interface BadgeCriteria {
  required_level?: number;
  min_wpm?: number;
  min_accuracy?: number;
  min_points?: number;
  story_complete?: boolean;
  goal_achieved?: boolean;
  perfect_score?: boolean;
}

export interface BadgeMetrics {
  wpm?: number;
  accuracy?: number;
  points?: number;
  completedLevels?: number[];
  goalAchieved?: boolean;
  perfectScore?: boolean;
  quizScore?: number;
  storyCompleted?: boolean;
}

/**
 * Tüm badge tanımlarını getir (cache'lenebilir)
 */
export async function getAllBadges(): Promise<Badge[]> {
  const { data, error } = await supabase
    .from('badges')
    .select('*')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    console.error('❌ Error fetching badges:', error);
    throw error;
  }

  return data || [];
}

/**
 * Öğrencinin kazandığı tüm rozetleri getir
 */
export async function getStudentBadges(studentId: string): Promise<StudentBadge[]> {
  const { data, error } = await supabase
    .from('student_badges')
    .select(`
      *,
      badge:badges(*)
    `)
    .eq('student_id', studentId)
    .order('earned_at', { ascending: false });

  if (error) {
    console.error('❌ Error fetching student badges:', error);
    throw error;
  }

  return data || [];
}

/**
 * Öğrencinin belirli bir rozeti kazanıp kazanmadığını kontrol et
 */
export async function hasBadge(
  studentId: string,
  badgeKey: string,
  storyId?: number
): Promise<boolean> {
  // First get the badge by key
  const { data: badge } = await supabase
    .from('badges')
    .select('id')
    .eq('badge_key', badgeKey)
    .single();

  if (!badge) return false;

  // Then check if student has it
  let query = supabase
    .from('student_badges')
    .select('id')
    .eq('student_id', studentId)
    .eq('badge_id', badge.id);

  if (storyId !== undefined) {
    query = query.eq('story_id', storyId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    console.error('❌ Error checking badge:', error);
  }

  return !!data;
}

/**
 * Badge kazanma kriterlerini kontrol et
 */
function meetsRequirements(
  badge: Badge,
  level: number,
  metrics: BadgeMetrics
): boolean {
  const criteria = badge.criteria;

  // Level badge
  if (criteria.required_level !== undefined) {
    return level === criteria.required_level;
  }

  // WPM badge
  if (criteria.min_wpm !== undefined && metrics.wpm !== undefined) {
    return metrics.wpm >= criteria.min_wpm;
  }

  // Accuracy badge
  if (criteria.min_accuracy !== undefined && metrics.accuracy !== undefined) {
    return metrics.accuracy >= criteria.min_accuracy;
  }

  // Points badge
  if (criteria.min_points !== undefined && metrics.points !== undefined) {
    return metrics.points >= criteria.min_points;
  }

  // Story complete badge
  if (criteria.story_complete && metrics.completedLevels) {
    return metrics.completedLevels.includes(5); // All 5 levels completed
  }

  // Goal achieved badge
  if (criteria.goal_achieved !== undefined) {
    return metrics.goalAchieved === true;
  }

  // Perfect score badge
  if (criteria.perfect_score !== undefined) {
    return metrics.perfectScore === true;
  }

  return false;
}

/**
 * Öğrencinin yeni rozet kazanma şansını kontrol et
 * Kazanılabilir rozetleri döndür
 */
export async function checkBadgeEligibility(
  studentId: string,
  storyId: number,
  level: number,
  sessionId: string | null,
  metrics: BadgeMetrics
): Promise<Badge[]> {
  try {
    // 1. Tüm badge tanımlarını getir
    const allBadges = await getAllBadges();

    // 2. Öğrencinin mevcut badge'lerini getir
    const studentBadges = await getStudentBadges(studentId);
    const earnedBadgeIds = new Set(studentBadges.map(sb => sb.badge_id));

    // 3. Kriterleri kontrol et
    const eligibleBadges: Badge[] = [];

    for (const badge of allBadges) {
      // Zaten kazanılmış mı? (story bazlı kontrol için)
      if (badge.badge_type === 'level') {
        // Level badge'ler story bazlı kazanılabilir
        const hasForThisStory = studentBadges.some(
          sb => sb.badge_id === badge.id && sb.story_id === storyId
        );
        if (hasForThisStory) continue;
      } else {
        // Achievement ve special badge'ler genel (bir kere kazanılır)
        if (earnedBadgeIds.has(badge.id)) continue;
      }

      // Kriterleri karşılıyor mu?
      if (meetsRequirements(badge, level, metrics)) {
        eligibleBadges.push(badge);
      }
    }

    console.log(`✅ Found ${eligibleBadges.length} eligible badges for student ${studentId}`);
    return eligibleBadges;
  } catch (error) {
    console.error('❌ Error checking badge eligibility:', error);
    return [];
  }
}

/**
 * Öğrenciye rozet ver
 */
export async function awardBadge(
  studentId: string,
  badge: Badge,
  storyId: number,
  sessionId: string | null,
  metadata?: any
): Promise<StudentBadge | null> {
  try {
    // 1. Badge'i zaten kazanmış mı kontrol et
    const alreadyHas = await hasBadge(
      studentId,
      badge.badge_key,
      badge.badge_type === 'level' ? storyId : undefined
    );

    if (alreadyHas) {
      console.log(`⚠️ Student ${studentId} already has badge ${badge.badge_key}`);
      return null;
    }

    // 2. Badge'i kaydet
    const { data: studentBadge, error } = await supabase
      .from('student_badges')
      .insert({
        student_id: studentId,
        badge_id: badge.id,
        story_id: badge.badge_type === 'level' ? storyId : null,
        session_id: sessionId,
        metadata: metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error awarding badge:', error);
      throw error;
    }

    console.log(`🏆 Badge "${badge.name}" awarded to student ${studentId}`);

    // 3. Bonus puan ver
    if (badge.points_reward > 0) {
      await awardPoints(
        studentId,
        storyId,
        badge.points_reward,
        `"${badge.name}" rozeti kazanıldı`
      );
      console.log(`✨ Awarded ${badge.points_reward} bonus points for badge`);
    }

    return studentBadge;
  } catch (error) {
    console.error('❌ Error awarding badge:', error);
    return null;
  }
}

/**
 * Level completion için badge kontrolü ve verme
 * Bu fonksiyon level tamamlandığında çağrılır
 */
export async function checkAndAwardLevelBadges(
  studentId: string,
  storyId: number,
  level: number,
  sessionId: string | null,
  metrics: BadgeMetrics
): Promise<Badge[]> {
  try {
    // Kazanılabilir rozetleri kontrol et
    const eligibleBadges = await checkBadgeEligibility(
      studentId,
      storyId,
      level,
      sessionId,
      metrics
    );

    if (eligibleBadges.length === 0) {
      return [];
    }

    // Tüm kazanılabilir rozetleri ver
    const awardedBadges: Badge[] = [];
    for (const badge of eligibleBadges) {
      const awarded = await awardBadge(
        studentId,
        badge,
        storyId,
        sessionId,
        metrics
      );
      if (awarded) {
        awardedBadges.push(badge);
      }
    }

    return awardedBadges;
  } catch (error) {
    console.error('❌ Error checking and awarding badges:', error);
    return [];
  }
}
