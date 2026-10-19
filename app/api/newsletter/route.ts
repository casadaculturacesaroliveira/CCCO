import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Indique um email válido." }, { status: 400 });
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return NextResponse.json({ error: "A newsletter ainda não está configurada. Tente mais tarde." }, { status: 503 });
    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("newsletter_subscribers").upsert({ email: email.toLowerCase().trim(), source: "website" }, { onConflict: "email", ignoreDuplicates: true });
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Não foi possível concluir a inscrição. Tente novamente." }, { status: 500 }); }
}