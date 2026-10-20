import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unsubscribeToken } from "../../../../lib/newsletter-token";

export async function POST(request: Request) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey=process.env.RESEND_API_KEY, sender=process.env.NEWSLETTER_FROM_EMAIL, site=process.env.NEWSLETTER_SITE_URL;
  if(!url||!serviceKey||!resendKey||!sender||!site||!process.env.NEWSLETTER_UNSUBSCRIBE_SECRET)
    return NextResponse.json({error:"Configuração incompleta. Confirma RESEND_API_KEY, NEWSLETTER_FROM_EMAIL, NEWSLETTER_SITE_URL e NEWSLETTER_UNSUBSCRIBE_SECRET."},{status:503});
  const auth=request.headers.get("authorization")||"";
  if(!auth.startsWith("Bearer ")) return NextResponse.json({error:"Inicia sessão no painel."},{status:401});
  const client=createClient(url,serviceKey,{auth:{persistSession:false}});
  const {data:{user},error:authError}=await client.auth.getUser(auth.slice(7));
  if(authError||!user) return NextResponse.json({error:"Sessão inválida."},{status:401});
  const {data:admin}=await client.from("admin_users").select("user_id").eq("user_id",user.id).maybeSingle();
  if(!admin) return NextResponse.json({error:"Acesso reservado a administradores."},{status:403});
  const body=await request.json().catch(()=>null);
  const subject=typeof body?.subject==="string"?body.subject.trim():"";
  const intro=typeof body?.intro==="string"?body.intro.trim():"";
  const campaignId=typeof body?.campaignId==="string"?body.campaignId:"";
  if(!/^[0-9a-f-]{36}$/i.test(campaignId)||!subject||subject.length>160||intro.length>2000)
    return NextResponse.json({error:"Assunto, mensagem ou campanha inválidos."},{status:400});
  const {data:events,error:eventError}=await client.from("events").select("title,starts_at,location,ticket_url").eq("status","published").gte("starts_at",new Date().toISOString()).order("starts_at",{ascending:true}).limit(6);
  if(eventError) return NextResponse.json({error:"Não foi possível consultar a programação."},{status:500});
  const {data:subscribers,error:subsError}=await client.from("newsletter_subscribers").select("id,email").not("consent_at","is",null).is("unsubscribed_at",null).order("id",{ascending:true}).limit(1000);
  if(subsError) return NextResponse.json({error:"Confirma que executaste a migração newsletter-campaigns.sql."},{status:500});
  const {data:previous,error:previousError}=await client.from("newsletter_deliveries").select("subscriber_id").eq("campaign_id",campaignId).limit(1000);
  if(previousError) return NextResponse.json({error:"Histórico de envios indisponível."},{status:500});
  const done=new Set((previous||[]).map(x=>String(x.subscriber_id)));
  const remaining=(subscribers||[]).filter(x=>!done.has(String(x.id)));
  const batch=remaining.slice(0,20);
  let sent=0,failed=0;
  const escape=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const root=site.replace(/\/$/,"");
  for(const subscriber of batch) {
    const {error:lockError}=await client.from("newsletter_deliveries").insert({campaign_id:campaignId,subscriber_id:subscriber.id,status:"pending"});
    if(lockError){failed++;continue;}
    const unsubscribe=root+"/api/newsletter/unsubscribe?email="+encodeURIComponent(subscriber.email)+"&token="+unsubscribeToken(subscriber.email);
    const items=(events||[]).map(ev=>'<li><strong>'+escape(ev.title)+'</strong> — '+(ev.starts_at?new Date(ev.starts_at).toLocaleString("pt-PT",{timeZone:"Europe/Lisbon",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}):"Data a anunciar")+(ev.location?" · "+escape(ev.location):"")+(ev.ticket_url&&/^https:\/\//.test(ev.ticket_url)?' · <a href="'+escape(ev.ticket_url)+'">Bilhetes</a>':"")+'</li>').join("");
    const html='<div style="font:16px/1.6 Arial,sans-serif;max-width:640px;margin:auto"><h1>Casa da Cultura César Oliveira</h1><p>'+escape(intro).replace(/\n/g,"<br>")+'</p><h2>Próximos espetáculos</h2>'+(items?'<ul>'+items+'</ul>':'<p>Consulte a nossa programação em breve.</p>')+'<p><a href="'+escape(root)+'">Ver programação no site</a></p><hr><p style="font-size:12px">Recebeu este email porque aceitou a newsletter da CCCO. <a href="'+escape(unsubscribe)+'">Cancelar subscrição</a>.</p></div>';
    try {
      const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({from:sender,to:[subscriber.email],subject,html,headers:{"List-Unsubscribe":"<"+unsubscribe+">"}})});
      const details=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error("Resend HTTP "+response.status+" "+String(details.message||""));
      await client.from("newsletter_deliveries").update({status:"sent",sent_at:new Date().toISOString()}).eq("campaign_id",campaignId).eq("subscriber_id",subscriber.id);
      sent++;
    } catch(error) {
      await client.from("newsletter_deliveries").update({status:"failed",error:String(error).slice(0,500)}).eq("campaign_id",campaignId).eq("subscriber_id",subscriber.id);
      failed++;
    }
  }
  return NextResponse.json({sent,failed,remaining:Math.max(0,remaining.length-batch.length),totalEligible:(subscribers||[]).length,events:(events||[]).length});
}
