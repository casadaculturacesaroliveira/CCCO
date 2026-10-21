import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "node:crypto";
import { unsubscribeToken } from "../../../../lib/newsletter-token";

function page(message: string) {
  return new Response('<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Newsletter CCCO</title><body style="font:18px Arial;max-width:560px;margin:12vh auto;padding:24px"><h1>Casa da Cultura César Oliveira</h1><p>'+message+'</p><a href="/">Voltar ao site</a></body></html>', { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}
function valid(email: string, token: string) {
  try { const expected = Buffer.from(unsubscribeToken(email), "hex"); const supplied = Buffer.from(token, "hex"); return expected.length === supplied.length && timingSafeEqual(expected, supplied); } catch { return false; }
}
export async function GET(request: Request) {
  const u = new URL(request.url); const email = u.searchParams.get("email") || ""; const token = u.searchParams.get("token") || "";
  if (!valid(email,token)) return page("Ligação inválida ou expirada.");
  return new Response('<!doctype html><html lang="pt"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Cancelar newsletter</title><body style="font:18px Arial;max-width:560px;margin:12vh auto;padding:24px"><h1>Cancelar newsletter</h1><p>Deixar de receber emails da Casa da Cultura César Oliveira?</p><form method="POST"><input type="hidden" name="email" value="'+email.replace(/[&"<]/g,"")+'"><input type="hidden" name="token" value="'+token+'"><button style="padding:14px">Confirmar cancelamento</button></form></body></html>',{headers:{"Content-Type":"text/html; charset=utf-8","Cache-Control":"no-store"}});
}
export async function POST(request: Request) {
  const form = await request.formData(); const email = String(form.get("email")||"").toLowerCase(); const token = String(form.get("token")||"");
  if (!valid(email,token)) return page("Ligação inválida.");
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return page("Serviço temporariamente indisponível.");
  const db=createClient(url,key,{auth:{persistSession:false}});
  const {error}=await db.from("newsletter_subscribers").update({unsubscribed_at:new Date().toISOString()}).eq("email",email);
  if(error) return page("Não foi possível concluir o pedido. Contacte ccco@cm-oliveiradohospital.pt.");
  return page("A sua subscrição foi cancelada. Deixará de receber newsletters.");
}
