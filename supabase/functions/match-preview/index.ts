// Public endpoint: serves HTML with dynamic Open Graph tags for crawlers
// (WhatsApp, Facebook, Twitter, etc.) and redirects real users to /m/:matchId.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const APP_ORIGIN = "https://fut-elevate-play.lovable.app";

const WEEKDAYS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const isCrawler = (ua: string) => {
  const u = ua.toLowerCase();
  return (
    u.includes("whatsapp") ||
    u.includes("facebookexternalhit") ||
    u.includes("twitterbot") ||
    u.includes("telegrambot") ||
    u.includes("slackbot") ||
    u.includes("linkedinbot") ||
    u.includes("discordbot") ||
    u.includes("googlebot") ||
    u.includes("bingbot") ||
    u.includes("embedly") ||
    u.includes("pinterest") ||
    u.includes("preview")
  );
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  // Path looks like /functions/v1/match-preview/<matchId>
  const parts = url.pathname.split("/").filter(Boolean);
  const matchId = parts[parts.length - 1];
  const appUrl = `${APP_ORIGIN}/m/${matchId}`;

  const ua = req.headers.get("user-agent") ?? "";
  const crawler = isCrawler(ua);

  // For real users: redirect immediately to the SPA
  if (!crawler) {
    return new Response(null, {
      status: 302,
      headers: { ...corsHeaders, Location: appUrl },
    });
  }

  // For crawlers: render HTML with dynamic OG tags
  let title = "Confirme sua presença na pelada";
  let description = "Toque para confirmar sua presença.";

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: match } = await supabase
      .from("matches")
      .select("match_date, match_time, location, pelada_id")
      .eq("id", matchId)
      .maybeSingle();

    if (match) {
      const { data: pelada } = await supabase
        .from("peladas")
        .select("name, location, max_players")
        .eq("id", match.pelada_id)
        .maybeSingle();

      const { count: confirmedCount } = await supabase
        .from("match_participants")
        .select("id", { count: "exact", head: true })
        .eq("match_id", matchId)
        .eq("status", "Confirmado");

      const date = new Date(`${match.match_date}T00:00:00`);
      const weekday = WEEKDAYS[date.getDay()];
      const dateStr = date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
      });
      const time = (match.match_time as string).slice(0, 5);
      const place = match.location || pelada?.location || "";
      const max = pelada?.max_players ?? 0;
      const conf = confirmedCount ?? 0;

      title = `⚽ ${pelada?.name ?? "Pelada"} — ${weekday}, ${dateStr} ${time}`;
      description = `📍 ${place} • 👥 ${conf}/${max} confirmados • Toque para confirmar sua presença.`;
    }
  } catch (e) {
    console.error("match-preview OG error", e);
  }

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}" />
<meta property="og:type" content="website" />
<meta property="og:title" content="${escapeHtml(title)}" />
<meta property="og:description" content="${escapeHtml(description)}" />
<meta property="og:url" content="${escapeHtml(appUrl)}" />
<meta property="og:site_name" content="EleveFut" />
<meta name="twitter:card" content="summary" />
<meta name="twitter:title" content="${escapeHtml(title)}" />
<meta name="twitter:description" content="${escapeHtml(description)}" />
<meta http-equiv="refresh" content="0;url=${escapeHtml(appUrl)}" />
</head>
<body>
<p><a href="${escapeHtml(appUrl)}">Abrir confirmação de presença</a></p>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
});
