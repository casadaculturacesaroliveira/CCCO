import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unsubscribeToken } from "../../../../../lib/newsletter-token";

export async function POST(request: Request) {
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY;
  const resendKey=process.env.RESEND_API_KEY, sender=process.env.NEWSLETTER_FROM_EMAIL, site=process.env.NEWSLETTER_SITE_URL;
  if(!url||!serviceKey||!resendKey||!sender||!site||!(process.env.NEWSLETTER_UNSUBSCRIBE_SECRET && process.env.NEWSLETTER_UNSUBSCRIBE_SECRET.length>=32))
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
  const rawMedia=body?.media;
  if(!Array.isArray(rawMedia) || rawMedia.length>6 || rawMedia.some((m:unknown)=>!m||typeof m!=="object"||typeof (m as {url?:unknown}).url!=="string"||typeof (m as {name?:unknown}).name!=="string"||!["image","video"].includes(String((m as {type?:unknown}).type)))) return NextResponse.json({error:"Ficheiros multimédia inválidos."},{status:400});
  const media=rawMedia as {url:string;name:string;type:"image"|"video"}[];
  const mediaOrigin=new URL(url).origin;
  if(media.some(m=>{try{const u=new URL(m.url);return u.protocol!=="https:"||u.origin!==mediaOrigin||!u.pathname.startsWith("/storage/v1/object/public/newsletter-media/newsletter/")||m.name.length>180;}catch{return true;}})) return NextResponse.json({error:"Ligação de ficheiro inválida."},{status:400});
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
  const batch=remaining.slice(0,5);
  let sent=0,failed=0;
  const escape=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const root=site.replace(/\/$/,"");
  for(const subscriber of batch) {
    const {error:lockError}=await client.from("newsletter_deliveries").insert({campaign_id:campaignId,subscriber_id:subscriber.id,status:"pending"});
    if(lockError){failed++;continue;}
    const unsubscribe=root+"/api/newsletter/unsubscribe?email="+encodeURIComponent(subscriber.email)+"&token="+unsubscribeToken(subscriber.email);
    const upcoming=(events||[]);
    const issueDate=new Intl.DateTimeFormat("pt-PT",{month:"long",year:"numeric",timeZone:"Europe/Lisbon"}).format(new Date()).toUpperCase();
    const dateLabel=(value:string|null)=>value?new Date(value).toLocaleString("pt-PT",{timeZone:"Europe/Lisbon",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}):"Data a anunciar";
    const safeLink=(value:string|null)=>value&&/^https:\/\//.test(value)?value:root;
    const feature=(ev:(typeof upcoming)[number],index:number)=>{
      const bg=index%3===0?"#f06c72":index%3===1?"#e8e8e6":"#36c6b7";
      return '<td class="feature" valign="top" width="50%" style="width:50%;padding:30px 26px;background:'+bg+';vertical-align:top"><p style="margin:0 0 28px;font:700 11px Arial,sans-serif;letter-spacing:2px;text-transform:uppercase">EM DESTAQUE · '+String(index+1).padStart(2,"0")+'</p><h3 style="margin:0 0 24px;font:normal 31px/1.1 Georgia,serif;color:#171717">'+escape(ev.title)+'</h3><p style="font:14px/1.5 Arial,sans-serif;color:#222">'+escape(dateLabel(ev.starts_at))+(ev.location?' · '+escape(ev.location):'')+'</p><a href="'+escape(safeLink(ev.ticket_url))+'" style="display:inline-block;margin-top:10px;padding-bottom:5px;border-bottom:1px solid #171717;font:700 12px Arial,sans-serif;letter-spacing:1px;text-decoration:none;color:#171717">VER EVENTO</a></td>';
    };
    const eventRows=upcoming.length?Array.from({length:Math.ceil(upcoming.length/2)},(_,i)=>{
      const a=upcoming[i*2],b=upcoming[i*2+1];
      return '<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse"><tr>'+feature(a,i*2)+(b?feature(b,i*2+1):'<td width="50%" style="background:#f7f7f5"></td>')+'</tr></table>';
    }).join(""):'<p style="padding:36px;text-align:center;font:16px Georgia,serif">Em breve, novas propostas culturais. Acompanhe a programação no nosso site.</p>';
    const mediaHtml=media.map((m,i)=>m.type==="image"?'<tr><td style="padding:0"><a href="'+escape(root)+'"><img src="'+escape(m.url)+'" alt="'+escape(m.name)+'" width="600" style="display:block;width:100%;height:auto;border:0"></a></td></tr>':'<tr><td style="padding:28px 36px;background:#f1f1f1"><p style="font:700 11px Arial,sans-serif;letter-spacing:2px">VÍDEO · '+String(i+1).padStart(2,"0")+'</p><a href="'+escape(m.url)+'" style="font:normal 25px Georgia,serif;color:#171717">'+escape(m.name)+'</a></td></tr>').join("");
    const html='<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media only screen and (max-width:600px){.feature{display:block!important;width:auto!important}.shell{width:100%!important}.hero{padding:38px 24px!important}.hero-title{font-size:38px!important}}</style></head><body style="margin:0;padding:0;background:#f4f4f2;color:#171717"><div style="display:none;max-height:0;overflow:hidden;opacity:0">'+escape(intro.slice(0,130))+'</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f4f4f2"><tr><td align="center" style="padding:24px 10px"><table class="shell" role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;border-collapse:collapse;background:#fff"><tr><td style="border-top:2px solid #171717;padding:25px 24px;text-align:center"><a href="'+escape(root)+'" style="font:700 18px Georgia,serif;color:#171717;text-decoration:none">CASA DA CULTURA<br>CÉSAR OLIVEIRA</a></td></tr><tr><td class="hero" style="padding:62px 44px 56px;background:#e9e9e9;text-align:center"><p style="margin:0 0 28px;font:700 11px Arial,sans-serif;letter-spacing:2px">'+escape(issueDate)+'</p><h1 class="hero-title" style="margin:0 0 28px;font:normal 48px/1.06 Georgia,serif;letter-spacing:-1px;color:#171717">'+escape(subject)+'</h1><p style="margin:0 auto;max-width:420px;font:16px/1.65 Arial,sans-serif;white-space:pre-line">'+escape(intro).replace(/\n/g,"<br>")+'</p></td></tr><tr><td style="padding:26px 28px 20px;text-align:center"><p style="margin:0;font:700 11px Arial,sans-serif;letter-spacing:2px">A NOSSA PROGRAMAÇÃO</p></td></tr><tr><td>'+eventRows+'</td></tr>'+mediaHtml+'<tr><td style="padding:44px 24px;text-align:center;background:#171717"><p style="margin:0 0 22px;font:normal 28px Georgia,serif;color:#fff">A cultura acontece aqui.</p><a href="'+escape(root)+'" style="display:inline-block;padding:13px 24px;background:#fff;color:#171717;text-decoration:none;font:700 12px Arial,sans-serif;letter-spacing:1px">VER TODA A PROGRAMAÇÃO</a></td></tr><tr><td style="padding:30px 28px;text-align:center;background:#f4f4f2"><p style="font:12px/1.7 Arial,sans-serif;color:#555">Casa da Cultura César Oliveira<br>Recebeu este email porque subscreveu a nossa newsletter.</p><p style="font:12px Arial,sans-serif"><a href="'+escape(unsubscribe)+'" style="color:#333;text-decoration:underline">Cancelar subscrição</a></p></td></tr></table></td></tr></table></body></html>';
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
