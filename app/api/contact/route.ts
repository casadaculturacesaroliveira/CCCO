import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body.name || "").trim(), email = String(body.email || "").trim(), subject = String(body.subject || "Informações gerais").trim(), message = String(body.message || "").trim();
    if (name.length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5) return NextResponse.json({ error: "Verifique os campos e tente novamente." }, { status: 400 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: "O formulário ainda não está configurado. Contacte-nos por outro meio." }, { status: 503 });
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("contact_messages").insert({ name, email, subject, message });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Não foi possível enviar a mensagem. Tente novamente mais tarde." }, { status: 500 }); }
}