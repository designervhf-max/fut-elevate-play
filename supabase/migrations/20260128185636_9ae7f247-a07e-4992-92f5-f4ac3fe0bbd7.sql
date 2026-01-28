-- Migration: Adicionar suporte para MatchLive, Lista de Espera e Controle Financeiro

-- 1. Adicionar started_at na tabela matches para persistir início do cronômetro
ALTER TABLE public.matches ADD COLUMN started_at timestamptz;

-- 2. Adicionar 'Lista de Espera' ao enum participant_status
ALTER TYPE public.participant_status ADD VALUE IF NOT EXISTS 'Lista de Espera';

-- 3. Adicionar price_per_game na tabela peladas (opcional)
ALTER TABLE public.peladas ADD COLUMN price_per_game decimal(10,2);

-- 4. Adicionar paid na tabela match_participants
ALTER TABLE public.match_participants ADD COLUMN paid boolean DEFAULT false;

-- 5. Criar função para promover jogador da lista de espera automaticamente
CREATE OR REPLACE FUNCTION public.promote_from_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  next_in_line RECORD;
  pelada_max_players INTEGER;
  confirmed_count INTEGER;
BEGIN
  -- Só executa se o status mudou para 'Recusado' ou se foi deletado
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.status = 'Recusado' AND OLD.status = 'Confirmado') THEN
    -- Buscar max_players da pelada
    SELECT p.max_players INTO pelada_max_players
    FROM matches m
    JOIN peladas p ON m.pelada_id = p.id
    WHERE m.id = COALESCE(OLD.match_id, NEW.match_id);

    -- Contar confirmados atuais
    SELECT COUNT(*) INTO confirmed_count
    FROM match_participants
    WHERE match_id = COALESCE(OLD.match_id, NEW.match_id)
      AND status = 'Confirmado';

    -- Se há vaga, promover primeiro da lista de espera
    IF confirmed_count < pelada_max_players THEN
      SELECT * INTO next_in_line
      FROM match_participants
      WHERE match_id = COALESCE(OLD.match_id, NEW.match_id)
        AND status = 'Lista de Espera'
      ORDER BY created_at ASC
      LIMIT 1;

      IF next_in_line.id IS NOT NULL THEN
        UPDATE match_participants
        SET status = 'Confirmado'
        WHERE id = next_in_line.id;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Criar trigger para promoção automática
DROP TRIGGER IF EXISTS trigger_promote_from_waitlist ON public.match_participants;
CREATE TRIGGER trigger_promote_from_waitlist
  AFTER UPDATE OR DELETE ON public.match_participants
  FOR EACH ROW
  EXECUTE FUNCTION public.promote_from_waitlist();