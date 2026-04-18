// Relatório diário de erros do EleveFut — enviado às 07:00 BRT via pg_cron.
// Requer as seguintes secrets configuradas em Supabase → Edge Functions → Secrets:
//   RESEND               → chave da API do Resend
//   SUPABASE_ACCESS_TOKEN → personal access token de https://app.supabase.com/account/tokens
//   CRON_SECRET          → mesmo valor configurado no pg_cron (via ALTER DATABASE)

const RESEND_KEY = Deno.env.get("RESEND") ?? "";
const ACCESS_TOKEN = Deno.env.get("SUPABASE_ACCESS_TOKEN") ?? "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") ?? "";
const PROJECT_REF = Deno.env.get("SUPABASE_PROJECT_REF") ?? "brywlaqddkspxmkttwlb";

const RECIPIENT = "designervhf@gmail.com";
const SENDER = "onboarding@resend.dev";
const LOGS_API =
  `https://api.supabase.com/v1/projects/${PROJECT_REF}/analytics/endpoints/logs.all`;

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface LogRow {
  timestamp: string | number;
  event_message: string;
  // deno-lint-ignore no-explicit-any
  metadata: Record<string, any>;
}

interface ErrorEntry {
  rawText: string;
  sourceLabel: string;
  ts: string;
}

interface ErrorGroup {
  friendly: string;
  sourceLabel: string;
  count: number;
  lastSeen: string;
}

// ---------------------------------------------------------------------------
// Tradução de erros técnicos → português simples
// ---------------------------------------------------------------------------

const TRANSLATIONS: [RegExp, string][] = [
  // Timeout / lentidão
  [/timeout|timed.?out|deadline exceeded/i,
    "O app demorou demais esperando uma resposta e desistiu"],
  // Conexão
  [/connection refused|econnrefused|enotfound|dns/i,
    "O app não conseguiu se conectar a um serviço"],
  [/fetch failed|network error|net::err/i,
    "O app perdeu a conexão com a internet"],
  // Auth / login
  [/invalid jwt|jwt expired|jwt malformed|token.*expired/i,
    "O login de um usuário expirou ou estava inválido"],
  [/invalid.*credentials|wrong.*password|invalid.*password/i,
    "Alguém tentou entrar com e-mail ou senha errados"],
  [/email not confirmed/i,
    "Alguém tentou entrar sem ter confirmado o e-mail de cadastro"],
  [/user not found|no user found/i,
    "Alguém tentou entrar com uma conta que não existe"],
  [/rate.?limit|too many (?:requests|attempts|logins)/i,
    "Muitas tentativas de login seguidas foram bloqueadas automaticamente"],
  [/signup.*disabled|signups.*not allowed/i,
    "Alguém tentou criar uma conta mas o cadastro estava desativado"],
  // Banco de dados
  [/unique.*constraint|violates unique|duplicate key|23505/i,
    "O app tentou salvar uma informação que já estava cadastrada"],
  [/foreign key.*constraint|violates foreign|23503/i,
    "O app tentou criar algo que depende de um dado que não existe mais"],
  [/not.null.*violat|null value in column|23502/i,
    "O app tentou salvar um registro com campo obrigatório vazio"],
  [/permission denied|42501/i,
    "O app tentou acessar dados sem a permissão necessária"],
  [/relation.*does not exist|42p01/i,
    "O app tentou acessar uma tabela inexistente (pode indicar atualização pendente)"],
  [/deadlock detected|40p01/i,
    "Dois processos travaram esperando um pelo outro — o banco se resolveu automaticamente"],
  [/too many connections/i,
    "O banco ficou sobrecarregado com muitas conexões ao mesmo tempo"],
  [/disk.*full|no space left|storage.*full/i,
    "O armazenamento do servidor está quase cheio"],
  // Erros de código JavaScript/TypeScript
  [/cannot read prop|is not a function|typeerror.*null|typeerror.*undefined/i,
    "O app tentou usar uma informação que não existia"],
  [/syntaxerror|invalid json|unexpected token|json.*parse/i,
    "O app recebeu dados em formato inesperado"],
  [/maximum call stack|rangeerror|infinite loop/i,
    "O app entrou em loop e precisou ser interrompido"],
  [/out of memory|heap.*out.*memory|memory.*limit/i,
    "O app consumiu memória demais e foi reiniciado"],
  // Códigos HTTP
  [/\b500\b|internal server error/i,
    "O app travou ao tentar processar uma ação"],
  [/\b404\b|not found/i,
    "O app tentou acessar uma página ou recurso que não existe"],
  [/\b401\b|unauthorized/i,
    "O app tentou acessar algo sem estar logado"],
  [/\b403\b|forbidden/i,
    "O app tentou acessar algo sem ter permissão"],
  [/\b429\b/i,
    "O app foi bloqueado temporariamente por excesso de requisições"],
  [/\b502\b|\b503\b|bad gateway|service unavailable/i,
    "Um serviço externo ficou fora do ar por alguns instantes"],
];

function translate(rawText: string): string {
  for (const [pattern, friendly] of TRANSLATIONS) {
    if (pattern.test(rawText)) return friendly;
  }
  return "O app encontrou um erro inesperado";
}

// ---------------------------------------------------------------------------
// Busca de logs via Supabase Management API
// ---------------------------------------------------------------------------

async function queryLogs(sql: string): Promise<LogRow[]> {
  const res = await fetch(LOGS_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    console.error(`Logs API retornou ${res.status}: ${await res.text()}`);
    return [];
  }

  const data = await res.json();
  return (data.result ?? []) as LogRow[];
}

function parseTimestamp(ts: string | number): string {
  // Supabase pode retornar microseconds epoch (number) ou ISO string
  let date: Date;
  if (typeof ts === "number") {
    date = new Date(ts / 1000); // microseconds → milliseconds
  } else {
    date = new Date(ts);
  }
  if (isNaN(date.getTime())) return String(ts);
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function extractErrorText(row: LogRow, source: string): string {
  const meta = row.metadata ?? {};

  if (source === "edge_logs") {
    // edge_logs aninha o erro dentro de metadata.error ou metadata.err
    const nested =
      (meta.error as Record<string, string> | undefined)?.message ??
      (meta.err as Record<string, string> | undefined)?.message ??
      "";
    return nested || row.event_message || "";
  }

  if (source === "auth_logs") {
    // auth_logs usa metadata.msg ou metadata.message
    return (
      (meta.msg as string) ??
      (meta.message as string) ??
      row.event_message ??
      ""
    );
  }

  return row.event_message ?? "";
}

function isErrorRow(row: LogRow, source: string): boolean {
  const meta = row.metadata ?? {};
  const msg = (row.event_message ?? "").toLowerCase();
  const status = Number(meta.status ?? 0);

  if (source === "edge_logs") {
    if (status >= 400) return true;
    if (meta.error || meta.err) return true;
    if (/error|exception|panic|fatal/i.test(msg)) return true;
  }

  if (source === "auth_logs") {
    const level = String(meta.level ?? "").toLowerCase();
    if (level === "error" || level === "fatal") return true;
    if (status >= 400) return true;
    if (/error|failed|invalid/i.test(msg)) return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Agrupamento
// ---------------------------------------------------------------------------

function groupErrors(entries: ErrorEntry[]): ErrorGroup[] {
  const map = new Map<string, ErrorGroup>();

  for (const e of entries) {
    const friendly = translate(e.rawText);
    const key = `${e.sourceLabel}::${friendly}`;

    if (!map.has(key)) {
      map.set(key, {
        friendly,
        sourceLabel: e.sourceLabel,
        count: 0,
        lastSeen: e.ts,
      });
    }

    const g = map.get(key)!;
    g.count++;
    if (e.ts > g.lastSeen) g.lastSeen = e.ts;
  }

  return Array.from(map.values()).sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Geração do HTML do e-mail
// ---------------------------------------------------------------------------

function buildEmail(groups: ErrorGroup[], dateRange: string, missingToken: boolean): string {
  const hasErrors = groups.length > 0;
  const totalOccurrences = groups.reduce((s, g) => s + g.count, 0);

  const headerBg = hasErrors ? "#dc2626" : "#16a34a";
  const headerEmoji = hasErrors ? "⚠️" : "✅";
  const headerTitle = hasErrors
    ? `${headerEmoji} Alguns problemas detectados hoje`
    : `${headerEmoji} Tudo funcionando perfeitamente!`;

  const bodyContent = (() => {
    if (missingToken) {
      return `
        <tr>
          <td style="padding:32px 40px;">
            <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:20px;">
              <p style="margin:0 0 8px;font-size:16px;font-weight:bold;color:#854d0e;">⚙️ Configuração pendente</p>
              <p style="margin:0;font-size:14px;color:#713f12;line-height:1.6;">
                O relatório de erros precisa de uma chave de acesso extra para ler os logs do Supabase.<br><br>
                <strong>O que fazer:</strong><br>
                1. Acesse <strong>app.supabase.com → Account → Access Tokens</strong><br>
                2. Crie um token com o nome "EleveFut Error Reporter"<br>
                3. Vá em <strong>Supabase → Edge Functions → daily-error-report → Secrets</strong><br>
                4. Adicione a secret <code>SUPABASE_ACCESS_TOKEN</code> com o valor do token
              </p>
            </div>
          </td>
        </tr>`;
    }

    if (!hasErrors) {
      return `
        <tr>
          <td style="padding:40px;text-align:center;">
            <div style="font-size:64px;margin-bottom:16px;">🎉</div>
            <h2 style="margin:0 0 12px;color:#16a34a;font-size:24px;">Noite tranquila!</h2>
            <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.7;">
              O <strong>EleveFut</strong> passou as últimas 24 horas funcionando perfeitamente.<br>
              Todos os seus jogadores conseguiram usar o app normalmente, sem nenhum travamento ou erro.
            </p>
            <p style="margin:0;color:#6b7280;font-size:14px;">
              Continue assim! ⚽
            </p>
          </td>
        </tr>`;
    }

    const groupRows = groups.map((g) => `
      <tr>
        <td style="padding:16px 0;border-bottom:1px solid #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="padding-right:12px;vertical-align:top;width:32px;">
                <span style="display:inline-block;width:28px;height:28px;background:#fee2e2;border-radius:50%;text-align:center;line-height:28px;font-size:14px;">🔸</span>
              </td>
              <td>
                <p style="margin:0 0 4px;font-size:15px;font-weight:bold;color:#111827;">${g.friendly}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">
                  Aconteceu <strong style="color:#dc2626;">${g.count}x</strong>
                  &nbsp;·&nbsp;
                  Última vez: ${g.lastSeen}
                  &nbsp;·&nbsp;
                  Onde: ${g.sourceLabel}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`).join("");

    return `
      <tr>
        <td style="padding:32px 40px 16px;">
          <p style="margin:0 0 4px;font-size:16px;color:#374151;">
            Foram encontrados <strong style="color:#dc2626;">${totalOccurrences} ocorrência(s)</strong>
            de <strong>${groups.length} tipo(s)</strong> de problema nas últimas 24 horas.
          </p>
          <p style="margin:0 0 24px;font-size:14px;color:#6b7280;">
            Na maioria dos casos esses problemas se resolvem sozinhos. Se algum aparece com muita frequência, vale investigar.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${groupRows}
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:16px 40px 32px;">
          <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;">
            <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
              💡 <strong>Dica:</strong> Erros de "login expirado" são normais e comuns — acontecem quando um usuário fica muito tempo sem usar o app.
              Erros que aparecem dezenas de vezes seguidas merecem atenção.
            </p>
          </div>
        </td>
      </tr>`;
  })();

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
  <title>EleveFut — Relatório Diário</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0"
          style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;
                 box-shadow:0 1px 3px rgba(0,0,0,.1);">

          <!-- Cabeçalho -->
          <tr>
            <td style="background:${headerBg};padding:32px 40px;text-align:center;">
              <h1 style="margin:0 0 4px;color:#ffffff;font-size:26px;font-weight:bold;letter-spacing:-0.5px;">
                ⚽ EleveFut
              </h1>
              <p style="margin:0;color:rgba(255,255,255,.8);font-size:14px;">${headerTitle}</p>
            </td>
          </tr>

          <!-- Período -->
          <tr>
            <td style="background:#f9fafb;padding:10px 40px;border-bottom:1px solid #e5e7eb;">
              <p style="margin:0;font-size:13px;color:#6b7280;text-align:center;">
                📅 Período monitorado: <strong>${dateRange}</strong>
              </p>
            </td>
          </tr>

          <!-- Conteúdo principal -->
          ${bodyContent}

          <!-- Rodapé -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;text-align:center;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:12px;">
                Relatório gerado automaticamente · EleveFut · Enviado todo dia às 07:00
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Envio via Resend
// ---------------------------------------------------------------------------

async function sendEmail(subject: string, html: string): Promise<void> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: SENDER,
      to: [RECIPIENT],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend retornou ${res.status}: ${body}`);
  }
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  }

  // Validar cron secret
  const incoming = req.headers.get("x-cron-secret") ?? "";
  if (CRON_SECRET && incoming !== CRON_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (!RESEND_KEY) {
    return new Response("Missing secret: RESEND", { status: 500 });
  }

  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const fmt = (d: Date) =>
    d.toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  const dateRange = `${fmt(yesterday)} — ${fmt(now)}`;

  // Se não há token de acesso, enviar e-mail explicando a configuração
  if (!ACCESS_TOKEN) {
    const html = buildEmail([], dateRange, true);
    await sendEmail("⚙️ EleveFut — Configuração pendente no relatório diário", html);
    return new Response(JSON.stringify({ ok: true, note: "missing ACCESS_TOKEN, sent setup email" }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Consultar logs das últimas 24h
  const LOG_SOURCES = [
    {
      source: "edge_logs",
      label: "Funções internas do app",
      sql: `SELECT timestamp, event_message, metadata
            FROM edge_logs
            WHERE timestamp > now() - interval '1 day'
            ORDER BY timestamp DESC
            LIMIT 2000`,
    },
    {
      source: "auth_logs",
      label: "Login e cadastro",
      sql: `SELECT timestamp, event_message, metadata
            FROM auth_logs
            WHERE timestamp > now() - interval '1 day'
            ORDER BY timestamp DESC
            LIMIT 2000`,
    },
  ];

  const allErrors: ErrorEntry[] = [];

  for (const { source, label, sql } of LOG_SOURCES) {
    try {
      const rows = await queryLogs(sql);
      for (const row of rows) {
        if (!isErrorRow(row, source)) continue;
        allErrors.push({
          rawText: extractErrorText(row, source),
          sourceLabel: label,
          ts: parseTimestamp(row.timestamp),
        });
      }
    } catch (err) {
      console.error(`Erro ao consultar ${source}:`, err);
    }
  }

  const groups = groupErrors(allErrors);

  const subject =
    groups.length === 0
      ? "✅ EleveFut — Tudo funcionando perfeitamente hoje!"
      : `⚠️ EleveFut — ${groups.reduce((s, g) => s + g.count, 0)} ocorrência(s) detectada(s) hoje`;

  const html = buildEmail(groups, dateRange, false);
  await sendEmail(subject, html);

  return new Response(
    JSON.stringify({ ok: true, groups: groups.length, total: allErrors.length }),
    { headers: { "Content-Type": "application/json" } },
  );
});
