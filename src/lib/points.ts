export function calculatePointsForLevel(levelNumber: number, stepCount: number): number {
  const basePoints = 100;
  const levelMultiplier = levelNumber * 50;
  return basePoints + levelMultiplier;
}

export function calculatePointsForStep(
  levelNumber: number,
  currentStep: number,
  totalSteps: number
): number {
  const basePoints = 10;
  const levelBonus = levelNumber * 5;
  const stepBonus = (currentStep / totalSteps) * 20;
  return basePoints + levelBonus + Math.floor(stepBonus);
}

export function getStarRating(totalPoints: number): number {
  if (totalPoints >= 5000) return 5;
  if (totalPoints >= 4000) return 4;
  if (totalPoints >= 3000) return 3;
  if (totalPoints >= 2000) return 2;
  if (totalPoints >= 1000) return 1;
  return 0;
}

export function getNextMilestone(currentPoints: number): { points: number; stars: number } {
  const milestones = [
    { points: 1000, stars: 1 },
    { points: 2000, stars: 2 },
    { points: 3000, stars: 3 },
    { points: 4000, stars: 4 },
    { points: 5000, stars: 5 },
  ];

  for (const milestone of milestones) {
    if (currentPoints < milestone.points) {
      return milestone;
    }
  }

  return { points: 5000, stars: 5 };
}

export function getProgressToNextMilestone(currentPoints: number): {
  current: number;
  needed: number;
  percentage: number;
} {
  const next = getNextMilestone(currentPoints);
  const previous =
    next.stars === 1
      ? 0
      : milestones[next.stars - 2]?.points || 0;

  const milestones: any[] = [
    { points: 1000, stars: 1 },
    { points: 2000, stars: 2 },
    { points: 3000, stars: 3 },
    { points: 4000, stars: 4 },
    { points: 5000, stars: 5 },
  ];

  const prev = previous || 0;
  const needed = next.points - prev;
  const current = currentPoints - prev;
  const percentage = Math.min((current / needed) * 100, 100);

  return { current, needed, percentage };
}
