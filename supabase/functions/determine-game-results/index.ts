import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Progression constants
const PROGRESSION_CONFIG = {
  GOAL_BONUS: 1.5,
  ASSIST_BONUS: 1.0,
  MVP_BONUS: 3.0,
  DEFENDER_BONUS: 2.5,
  PARTICIPATION_BONUS: 0.5,
  MAX_RATING: 100,
  MIN_RATING: 0,
};

const calculateBonus = (currentRating: number, baseBonus: number): number => {
  const scaleFactor = 1 - currentRating / 150;
  const adjustedBonus = baseBonus * Math.max(scaleFactor, 0.1);
  return Math.round(adjustedBonus * 10) / 10;
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get games that are finished but results not determined
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id, ended_at, status, mvp_id, best_defender_id, results_determined')
      .eq('status', 'Finalizado')
      .eq('results_determined', false);

    if (gamesError) {
      console.error('Error fetching games:', gamesError);
      throw gamesError;
    }

    console.log(`Found ${games?.length || 0} games to process`);

    const results = [];

    for (const game of games || []) {
      console.log(`Processing game ${game.id}`);

      // Get all participants (including guests)
      const { data: allParticipants } = await supabase
        .from('game_participants')
        .select('id, user_id, goals, assists, stats_submitted, status, guest_name')
        .eq('game_id', game.id)
        .eq('status', 'Confirmado');

      // Only registered players (with user_id) can affect ratings
      const registeredParticipants = allParticipants?.filter(p => p.user_id) || [];
      const guestParticipants = allParticipants?.filter(p => !p.user_id) || [];
      
      console.log(`Game ${game.id}: ${registeredParticipants.length} registered, ${guestParticipants.length} guests`);

      // Check if stats have been submitted
      const hasStats = allParticipants?.some(p => p.stats_submitted) || false;
      if (!hasStats) {
        console.log(`Game ${game.id}: No stats submitted yet, skipping`);
        results.push({ gameId: game.id, status: 'waiting_stats' });
        continue;
      }

      const confirmedCount = registeredParticipants.length;
      const submittedCount = registeredParticipants.filter((p) => p.stats_submitted).length;

      // Get MVP votes (only registered players can receive/give votes)
      const { data: mvpVotes } = await supabase
        .from('mvp_votes')
        .select('voted_for_id')
        .eq('game_id', game.id);

      // Get defender votes
      const { data: defenderVotes } = await supabase
        .from('defender_votes')
        .select('voted_for_id')
        .eq('game_id', game.id);

      const voteCount = mvpVotes?.length || 0;
      const hoursAfterEnd = game.ended_at
        ? (Date.now() - new Date(game.ended_at).getTime()) / (1000 * 60 * 60)
        : 0;

      // Determine if we should calculate results
      const allVoted = confirmedCount > 0 && voteCount >= confirmedCount;
      const thresholdMet = confirmedCount > 0 && voteCount >= confirmedCount * 0.7 && hoursAfterEnd >= 4;
      const timedOut = hoursAfterEnd >= 24;

      console.log(
        `Game ${game.id}: votes=${voteCount}, confirmed=${confirmedCount}, hours=${hoursAfterEnd.toFixed(1)}, allVoted=${allVoted}, thresholdMet=${thresholdMet}, timedOut=${timedOut}`
      );

      if (!allVoted && !thresholdMet && !timedOut) {
        results.push({ gameId: game.id, status: 'waiting_votes' });
        continue;
      }

      // Count MVP votes
      const mvpCounts: Record<string, number> = {};
      for (const vote of mvpVotes || []) {
        mvpCounts[vote.voted_for_id] = (mvpCounts[vote.voted_for_id] || 0) + 1;
      }

      // Count defender votes
      const defenderCounts: Record<string, number> = {};
      for (const vote of defenderVotes || []) {
        defenderCounts[vote.voted_for_id] = (defenderCounts[vote.voted_for_id] || 0) + 1;
      }

      // Find winners
      const mvpWinner = Object.entries(mvpCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;
      const defenderWinner =
        Object.entries(defenderCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

      console.log(`Game ${game.id}: MVP=${mvpWinner}, Defender=${defenderWinner}`);

      // Update game with results
      await supabase
        .from('games')
        .update({
          mvp_id: mvpWinner,
          best_defender_id: defenderWinner,
          results_determined: true,
        })
        .eq('id', game.id);

      // Process each REGISTERED participant's ratings (guests don't have profiles)
      for (const participant of registeredParticipants) {
        if (!participant.user_id) continue; // Safety check

        // Get current profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', participant.user_id)
          .single();

        if (!profile) {
          console.log(`No profile found for user ${participant.user_id}`);
          continue;
        }

        const isMVP = participant.user_id === mvpWinner;
        const isBestDefender = participant.user_id === defenderWinner;
        const goals = participant.goals || 0;
        const assists = participant.assists || 0;

        // Calculate rating changes
        const currentAttack = profile.attack_rating || 50;
        const currentSkill = profile.skill_rating || 50;
        const currentStrength = profile.strength_rating || 50;
        const currentDefense = profile.defense_rating || 50;
        const currentOverall = profile.overall_rating || 50;

        // Calculate bonuses
        const attackBonus = goals * calculateBonus(currentAttack, PROGRESSION_CONFIG.GOAL_BONUS);
        const skillBonus =
          assists * calculateBonus(currentSkill, PROGRESSION_CONFIG.ASSIST_BONUS);
        const strengthBonus = calculateBonus(currentStrength, PROGRESSION_CONFIG.PARTICIPATION_BONUS);
        const defenseBonus = isBestDefender
          ? calculateBonus(currentDefense, PROGRESSION_CONFIG.DEFENDER_BONUS)
          : 0;
        const mvpBonus = isMVP
          ? calculateBonus(currentOverall, PROGRESSION_CONFIG.MVP_BONUS)
          : 0;

        // New ratings
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
        const newDefense = Math.min(
          PROGRESSION_CONFIG.MAX_RATING,
          Math.round((currentDefense + defenseBonus) * 10) / 10
        );

        // Calculate new overall
        const weightedOverall =
          newAttack * 0.35 + newDefense * 0.25 + newSkill * 0.25 + newStrength * 0.15;
        const newOverall = Math.min(
          PROGRESSION_CONFIG.MAX_RATING,
          Math.round((weightedOverall + mvpBonus) * 10) / 10
        );

        // Save rating history
        await supabase.from('rating_history').insert({
          user_id: participant.user_id,
          game_id: game.id,
          overall_before: currentOverall,
          overall_after: Math.round(newOverall),
          attack_before: currentAttack,
          attack_after: Math.round(newAttack),
          defense_before: currentDefense,
          defense_after: Math.round(newDefense),
          skill_before: currentSkill,
          skill_after: Math.round(newSkill),
          strength_before: currentStrength,
          strength_after: Math.round(newStrength),
          goals,
          assists,
          was_mvp: isMVP,
          was_best_defender: isBestDefender,
        });

        // Update profile
        await supabase
          .from('profiles')
          .update({
            attack_rating: Math.round(newAttack),
            skill_rating: Math.round(newSkill),
            strength_rating: Math.round(newStrength),
            defense_rating: Math.round(newDefense),
            overall_rating: Math.round(newOverall),
            total_goals: (profile.total_goals || 0) + goals,
            total_assists: (profile.total_assists || 0) + assists,
          })
          .eq('id', participant.user_id);

        console.log(
          `Updated ${participant.user_id}: overall ${currentOverall} -> ${Math.round(newOverall)}`
        );
      }

      results.push({
        gameId: game.id,
        status: 'processed',
        mvp: mvpWinner,
        bestDefender: defenderWinner,
        registeredPlayers: registeredParticipants.length,
        guestPlayers: guestParticipants.length,
      });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in determine-game-results:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
