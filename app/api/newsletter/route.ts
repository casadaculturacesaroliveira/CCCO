import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Indique um email válido." }, { status: 400 });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      console.error("Newsletter: configuração Supabase em falta.");
      return NextResponse.json({ error: "A newsletter está temporariamente indisponível. Contacte-nos por email." }, { status: 503 });
    }

    const supabase = createClient(url, key, { auth: { persistSession: false } });
    const { error } = await supabase.from("newsletter_subscribers").upsert(
      { email, source: "website" },
      { onConflict: "email", ignoreDuplicates: true }
    );
    if (error) {
      console.error("Newsletter: erro ao guardar inscrição:", error.code, error.message);
      return NextResponse.json({ error: "Não foi possível registar a inscrição. Tente novamente." }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Newsletter: pedido inválido ou falha inesperada:", error);
    return NextResponse.json({ error: "Não foi possível concluir a inscrição. Tente novamente." }, { status: 500 });
  }
}
