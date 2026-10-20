// Supabase Edge Function: create-card-checkout
// Secrets required: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
// PAGUELOFACIL_CCLW. Never put CCLW/service role keys in the web client.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowedOrigins = new Set([
  "https://ediel2502.github.io",
  "capacitor://localhost",
  "http://localhost",
  "https://localhost",
]);
function corsHeaders(origin: string | null) {
  const allowed = origin && allowedOrigins.has(origin) ? origin : "https://ediel2502.github.io";
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

function hexUtf8(value: string): string {
  return Array.from(new TextEncoder().encode(value))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.get("origin");
    if (origin && !allowedOrigins.has(origin)) return new Response("Origen no permitido.", { status: 403 });
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") return json({ error: "Método no permitido." }, 405, origin);
  const origin = req.headers.get("origin");
  if (origin && !allowedOrigins.has(origin)) {
    return json({ error: "Origen no permitido." }, 403, origin);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const cclw = Deno.env.get("PAGUELOFACIL_CCLW");
  if (!supabaseUrl || !anonKey || !serviceKey || !cclw) {
    return json({ error: "El proveedor de pagos aún no está configurado en el servidor." }, 503, origin);
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "Inicia sesión para continuar." }, 401, origin);
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  }, 200, origin);
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return json({ error: "Sesión no válida. Inicia sesión nuevamente." }, 401, origin);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  }, 200, origin);
  const orderId = crypto.randomUUID();
  const amount = 3.00; // Precio definido en el servidor, nunca aceptado desde el navegador.
  const { error: insertError } = await admin.from("payment_orders").insert({
    id: orderId,
    user_id: userData.user.id,
    provider: "paguelofacil",
    amount,
    currency: "USD",
    status: "pending",
  });
  if (insertError) {
    console.error("No se pudo registrar orden pendiente", insertError.message);
    return json({ error: "No se pudo preparar la orden de pago." }, 500, origin);
  }

  const returnUrl = "https://ediel2502.github.io/Cineplus_panama/?payment=return";
  const body = new URLSearchParams({
    CCLW: cclw,
    CMTN: amount.toFixed(2),
    CDSC: "CinePlus Panamá - suscripción mensual",
    RETURN_URL: hexUtf8(returnUrl),
    CARD_TYPE: "CARD",
    PARM_1: orderId,
    EXPIRES_IN: "1800",
  }, 200, origin);

  try {
    const response = await fetch("https://secure.paguelofacil.com/LinkDeamon.cfm", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
      },
      body,
    });
    const result = await response.json();
    const checkoutUrl = result?.data?.url;
    if (!response.ok || result?.success !== true || typeof checkoutUrl !== "string") {
      await admin.from("payment_orders").update({ status: "failed" }).eq("id", orderId);
      console.error("Proveedor rechazó crear checkout", result?.message || response.status);
      return json({ error: "El proveedor no pudo crear el checkout. Verifica la afiliación y las credenciales." }, 502, origin);
    }
    const parsed = new URL(checkoutUrl);
    if (parsed.protocol !== "https:" || !/(^|\.)checkout\.paguelofacil\.com$/i.test(parsed.hostname)) {
      await admin.from("payment_orders").update({ status: "failed" }).eq("id", orderId);
      return json({ error: "El proveedor devolvió una URL de checkout no reconocida." }, 502, origin);
    }
    await admin.from("payment_orders").update({ provider_code: String(result?.data?.code || "") }).eq("id", orderId);
    return json({ checkoutUrl: parsed.href, orderId }, 200, origin);
  } catch (error) {
    await admin.from("payment_orders").update({ status: "failed" }).eq("id", orderId);
    console.error("Fallo al conectar con proveedor", error);
    return json({ error: "No se pudo contactar al proveedor de pagos." }, 502, origin);
  }
}, 200, origin);
