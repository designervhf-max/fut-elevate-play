CREATE OR REPLACE FUNCTION public.protect_profile_stats()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role (edge functions) pode atualizar tudo
  IF current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Totais de carreira e created_at: sempre preservar
  NEW.total_goals := OLD.total_goals;
  NEW.total_assists := OLD.total_assists;
  NEW.total_games := OLD.total_games;
  NEW.total_mvps := OLD.total_mvps;
  NEW.total_best_defender := OLD.total_best_defender;
  NEW.total_participations := OLD.total_participations;
  NEW.total_saves := OLD.total_saves;
  NEW.created_at := OLD.created_at;

  -- Ratings: só mudam durante a calibração inicial (uma única vez)
  IF OLD.calibration_completed THEN
    NEW.overall_rating := OLD.overall_rating;
    NEW.attack_rating := OLD.attack_rating;
    NEW.defense_rating := OLD.defense_rating;
    NEW.skill_rating := OLD.skill_rating;
    NEW.strength_rating := OLD.strength_rating;
  ELSE
    NEW.overall_rating := GREATEST(30, LEAST(99, NEW.overall_rating));
    NEW.attack_rating := GREATEST(30, LEAST(99, NEW.attack_rating));
    NEW.defense_rating := GREATEST(30, LEAST(99, NEW.defense_rating));
    NEW.skill_rating := GREATEST(30, LEAST(99, NEW.skill_rating));
    NEW.strength_rating := GREATEST(30, LEAST(99, NEW.strength_rating));
  END IF;

  -- calibration_completed não pode voltar de true para false
  IF OLD.calibration_completed THEN
    NEW.calibration_completed := true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_stats ON public.profiles;
CREATE TRIGGER trg_protect_profile_stats
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_stats();