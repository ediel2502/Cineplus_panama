import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://ediel2502.github.io",
  "http://localhost:3000",
  "http://localhost:5173",
]);
const corsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin && allowedOrigins.has(origin) ? origin : "https://ediel2502.github.io",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Vary": "Origin",
});
const json = (data: unknown, status: number, origin: string | null) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders(origin), "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  const origin = req.headers.get("Origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders(origin) });
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405, origin);
  if (origin && !allowedOrigins.has(origin)) return json({ error: "Origen no permitido." }, 403, origin);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !anonKey || !serviceKey) return json({ error: "El backend de pagos manuales aún no está configurado." }, 503, origin);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Inicia sesión primero." }, 401, origin);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await userClient.auth.getUser();
  if (authError || !authData.user) return json({ error: "Sesión no válida. Inicia sesión otra vez." }, 401, origin);

  let body: { provider?: unknown; reference?: unknown };
  try { body = await req.json(); } catch { return json({ error: "Solicitud inválida." }, 400, origin); }
  const provider = body.provider;
  const reference = typeof body.reference === "string" ? body.reference.trim() : "";
  if (provider !== "yappy" && provider !== "transfer" && provider !== "paypal") return json({ error: "Método de pago no admitido." }, 400, origin);
  if (reference.length < 3 || reference.length > 120) return json({ error: "La referencia debe tener entre 3 y 120 caracteres." }, 400, origin);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await admin.from("manual_payment_requests").insert({
    user_id: authData.user.id, provider, amount: 3.00, currency: "USD",
    payment_reference: reference, status: "pending",
  }).select("id,status,created_at").single();
  if (error) {
    console.error("No se pudo crear la solicitud manual", error.message);
    return json({ error: "No se pudo guardar la solicitud. Inténtalo más tarde." }, 500, origin);
  }
  return json({ ok: true, requestId: data.id, status: data.status, createdAt: data.created_at }, 200, origin);
});
