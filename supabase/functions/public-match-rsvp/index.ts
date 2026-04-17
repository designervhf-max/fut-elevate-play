// Public endpoint: fetch match info & allow guest RSVP without auth.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const ALLOWED_POSITIONS = [
  "Goleiro",
  "Fixo",
  "Ala",
  "Pivô",
  "Zagueiro",
  "Meia",
  "Atacante",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);

    if (req.method === "GET") {
      const matchId = url.searchParams.get("matchId");
      if (!matchId) return json({ error: "matchId obrigatório" }, 400);

      const { data: match, error: matchErr } = await supabase
        .from("matches")
        .select(
          "id, match_date, match_time, location, status, pelada_id, open_for_confirmation",
        )
        .eq("id", matchId)
        .maybeSingle();

      if (matchErr || !match) return json({ error: "Partida não encontrada" }, 404);

      const { data: pelada } = await supabase
        .from("peladas")
        .select("id, name, location, weekday, time, game_type, max_players")
        .eq("id", match.pelada_id)
        .maybeSingle();

      const { data: participants } = await supabase
        .from("match_participants")
        .select("id, status, guest_name, user_id")
        .eq("match_id", matchId);

      // Hydrate names for registered users
      const userIds = (participants ?? [])
        .filter((p) => p.user_id)
        .map((p) => p.user_id as string);
      let nameById: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", userIds);
        nameById = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, p.name]),
        );
      }

      const confirmed = (participants ?? [])
        .filter((p) => p.status === "Confirmado")
        .map((p) => ({
          name: p.user_id ? nameById[p.user_id] ?? "Jogador" : p.guest_name,
        }));

      return json({
        match: {
          id: match.id,
          date: match.match_date,
          time: match.match_time,
          location: match.location,
          status: match.status,
          openForConfirmation: match.open_for_confirmation,
        },
        pelada,
        confirmedCount: confirmed.length,
        confirmed,
      });
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const matchId = String(body.matchId ?? "").trim();
      const name = String(body.name ?? "").trim();
      const position = String(body.position ?? "").trim();

      if (!matchId) return json({ error: "matchId obrigatório" }, 400);
      if (name.length < 2 || name.length > 60) {
        return json({ error: "Informe um nome válido (2 a 60 caracteres)" }, 400);
      }
      if (!ALLOWED_POSITIONS.includes(position)) {
        return json({ error: "Posição inválida" }, 400);
      }

      const { data: match } = await supabase
        .from("matches")
        .select("id, status, open_for_confirmation, pelada_id")
        .eq("id", matchId)
        .maybeSingle();

      if (!match) return json({ error: "Partida não encontrada" }, 404);
      if (match.status !== "scheduled" || !match.open_for_confirmation) {
        return json({ error: "Confirmações encerradas para esta partida" }, 400);
      }

      const { data: pelada } = await supabase
        .from("peladas")
        .select("max_players")
        .eq("id", match.pelada_id)
        .maybeSingle();

      // Check duplicate guest name (case-insensitive) for this match
      const { data: existing } = await supabase
        .from("match_participants")
        .select("id, status, guest_name")
        .eq("match_id", matchId);

      const dup = (existing ?? []).find(
        (p) =>
          p.guest_name &&
          p.guest_name.trim().toLowerCase() === name.toLowerCase(),
      );
      if (dup) {
        return json(
          { error: "Já existe alguém com esse nome confirmado. Adicione um sobrenome." },
          409,
        );
      }

      const confirmedCount = (existing ?? []).filter(
        (p) => p.status === "Confirmado",
      ).length;
      const isFull =
        pelada && confirmedCount >= (pelada.max_players ?? 0);
      const status = isFull ? "Lista de Espera" : "Confirmado";

      const { error: insertErr } = await supabase
        .from("match_participants")
        .insert({
          match_id: matchId,
          guest_name: name,
          guest_position: position,
          status,
        });

      if (insertErr) {
        return json({ error: "Não foi possível confirmar presença" }, 500);
      }

      return json({ ok: true, status });
    }

    return json({ error: "Método não suportado" }, 405);
  } catch (e) {
    console.error("public-match-rsvp error", e);
    return json({ error: "Erro inesperado" }, 500);
  }
});
