import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

// Progression constants - balanced for long-term growth
export const PROGRESSION_CONFIG = {
  GOAL_BONUS: 1.5,           // Attack rating bonus per goal
  ASSIST_BONUS: 1.0,         // Skill rating bonus per assist
  MVP_BONUS: 3.0,            // Overall rating bonus for MVP
  PARTICIPATION_BONUS: 0.5,  // Strength rating bonus for participating
  MAX_RATING: 100,
  MIN_RATING: 0,
};

/**
 * Calculates bonus with diminishing returns
 * Higher ratings get smaller bonuses to prevent fast progression at high levels
 * At rating 50: ~66% of base bonus
 * At rating 80: ~47% of base bonus
 * At rating 95: ~37% of base bonus
 */
export const calculateBonus = (currentRating: number, baseBonus: number): number => {
  const scaleFactor = 1 - (currentRating / 150);
  const adjustedBonus = baseBonus * Math.max(scaleFactor, 0.1);
  return Math.round(adjustedBonus * 10) / 10;
};

/**
 * Calculates new ratings based on game performance
 */
export const calculateNewRatings = (
  profile: Profile,
  goals: number,
  assists: number,
  isMVP: boolean
): {
  attack_rating: number;
  skill_rating: number;
  strength_rating: number;
  overall_rating: number;
  total_goals: number;
  total_assists: number;
} => {
  const currentAttack = profile.attack_rating || 50;
  const currentSkill = profile.skill_rating || 50;
  const currentStrength = profile.strength_rating || 50;
  const currentOverall = profile.overall_rating || 50;

  // Calculate bonuses with diminishing returns
  const attackBonus = goals * calculateBonus(currentAttack, PROGRESSION_CONFIG.GOAL_BONUS);
  const skillBonus = assists * calculateBonus(currentSkill, PROGRESSION_CONFIG.ASSIST_BONUS);
  const strengthBonus = calculateBonus(currentStrength, PROGRESSION_CONFIG.PARTICIPATION_BONUS);
  const overallBonus = isMVP ? calculateBonus(currentOverall, PROGRESSION_CONFIG.MVP_BONUS) : 0;

  // Calculate new ratings (capped at max)
  const newAttack = Math.min(
    PROGRESSION_CONFIG.MAX_RATING,
    Math.round((currentAttack + attackBonus) * 10) / 10
  );
  const newSkill = Math.min(
    PROGRESSION_CONFIG.MAX_RATING,
    Math.round((currentSkill + skillBonus) * 10) / 10
  );
  const newStrength = Math.min(
    PROGRESSION_CONFIG.MAX_RATING,
    Math.round((currentStrength + strengthBonus) * 10) / 10
  );

  // Calculate overall as weighted average + MVP bonus
  const weightedOverall =
    newAttack * 0.35 +
    (profile.defense_rating || 50) * 0.25 +
    newSkill * 0.25 +
    newStrength * 0.15;

  const newOverall = Math.min(
    PROGRESSION_CONFIG.MAX_RATING,
    Math.round((weightedOverall + overallBonus) * 10) / 10
  );

  return {
    attack_rating: Math.round(newAttack),
    skill_rating: Math.round(newSkill),
    strength_rating: Math.round(newStrength),
    overall_rating: Math.round(newOverall),
    total_goals: (profile.total_goals || 0) + goals,
    total_assists: (profile.total_assists || 0) + assists,
  };
};

/**
 * Formats a rating change for display
 */
export const formatRatingChange = (before: number, after: number): string => {
  const diff = after - before;
  if (diff > 0) return `+${diff}`;
  if (diff < 0) return `${diff}`;
  return '0';
};
