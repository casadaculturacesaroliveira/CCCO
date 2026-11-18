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
  const testOnly=body?.testOnly===true;
  const testEmail="ccco@cm-oliveiradohospital.pt";
  const campaignId=typeof body?.campaignId==="string"?body.campaignId:"";
  const rawMedia=body?.media;
  if(!Array.isArray(rawMedia) || rawMedia.length>6 || rawMedia.some((m:unknown)=>!m||typeof m!=="object"||typeof (m as {url?:unknown}).url!=="string"||typeof (m as {name?:unknown}).name!=="string"||!["image","video"].includes(String((m as {type?:unknown}).type)))) return NextResponse.json({error:"Ficheiros multimédia inválidos."},{status:400});
  const media=rawMedia as {url:string;name:string;type:"image"|"video"}[];
  const mediaOrigin=new URL(url).origin;
  if(media.some(m=>{try{const u=new URL(m.url);return u.protocol!=="https:"||u.origin!==mediaOrigin||!u.pathname.startsWith("/storage/v1/object/public/newsletter-media/newsletter/")||m.name.length>180;}catch{return true;}})) return NextResponse.json({error:"Ligação de ficheiro inválida."},{status:400});
  if((!testOnly&&!/^[0-9a-f-]{36}$/i.test(campaignId))||!subject||subject.length>160||intro.length>2000)
    return NextResponse.json({error:"Assunto, mensagem ou campanha inválidos."},{status:400});
  const {data:events,error:eventError}=await client.from("events").select("title,starts_at,location,ticket_url,image_url,description").eq("status","published").gte("starts_at",new Date().toISOString()).order("starts_at",{ascending:true}).limit(50);
  if(eventError) return NextResponse.json({error:"Não foi possível consultar a programação."},{status:500});
  const uhfEvent=(events||[]).find(ev=>/\bUHF\b/i.test(ev.title));
  const selectedEvents=[...(uhfEvent?[uhfEvent]:[]),...(events||[]).filter(ev=>ev!==uhfEvent)].slice(0,6);
  if(!testOnly) {
  const {data:subscribers,error:subsError}=await client.from("newsletter_subscribers").select("id,email").not("consent_at","is",null).is("unsubscribed_at",null).order("id",{ascending:true}).limit(1000);
  if(subsError) return NextResponse.json({error:"Confirma que executaste a migração newsletter-campaigns.sql."},{status:500});
  const {data:previous,error:previousError}=await client.from("newsletter_deliveries").select("subscriber_id").eq("campaign_id",campaignId).limit(1000);
  if(previousError) return NextResponse.json({error:"Histórico de envios indisponível."},{status:500});
  const done=new Set((previous||[]).map(x=>String(x.subscriber_id)));
  const remaining=(subscribers||[]).filter(x=>!done.has(String(x.id)));
  const batch=remaining.slice(0,5);
  return await deliver(batch,selectedEvents,false,remaining.length,(subscribers||[]).length);
  }
  return await deliver([{id:"test-only",email:testEmail}],selectedEvents,true,1,1);

  async function deliver(batch:{id:string;email:string}[],eventsList:{title:string;starts_at:string|null;location:string|null;ticket_url:string|null;image_url:string|null;description:string|null}[],isTest:boolean,remainingCount:number,totalEligible:number) {
  let sent=0,failed=0;
  const escape=(v:string)=>v.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const root=(site||"").replace(/\/$/,"");
  for(const subscriber of batch) {
    if(!isTest){
      const {error:lockError}=await client.from("newsletter_deliveries").insert({campaign_id:campaignId,subscriber_id:subscriber.id,status:"pending"});
      if(lockError){failed++;continue;}
    }
    const unsubscribe=root+"/api/newsletter/unsubscribe?email="+encodeURIComponent(subscriber.email)+"&token="+unsubscribeToken(subscriber.email);
    const upcoming=eventsList;
    const issueDate=new Intl.DateTimeFormat("pt-PT",{month:"long",year:"numeric",timeZone:"Europe/Lisbon"}).format(new Date());
    const dateLabel=(value:string|null)=>value?new Date(value).toLocaleString("pt-PT",{timeZone:"Europe/Lisbon",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"}):"Data a anunciar";
    const safeLink=(value:string|null)=>value&&/^https:\/\//.test(value)?value:root;
    const safeImage=(value:string|null)=>{if(!value)return null;try{const parsed=new URL(value);return parsed.protocol==="https:"?value:null;}catch{return null;}};
    const eventHtml=upcoming.map((ev,i)=>
      '<tr><td style="padding:36px 0 40px;border-top:1px solid #d9d7d1">'+
      '<p style="margin:0 0 17px;font:500 11px/1.4 Arial,sans-serif;letter-spacing:2px;color:#7b453e">'+(/\bUHF\b/i.test(ev.title)?'EM DESTAQUE · CONCERTO UHF':'AGENDA &nbsp; / &nbsp; '+String(i+1).padStart(2,"0"))+'</p>'+
      (safeImage(ev.image_url)?'<a href="'+escape(safeLink(ev.ticket_url))+'"><img src="'+escape(safeImage(ev.image_url)!)+'" alt="'+escape(ev.title)+'" width="520" style="display:block;width:100%;height:auto;border:0;margin:0 0 24px"></a>':'')+
      '<h2 style="margin:0 0 18px;font:normal 34px/1.13 Georgia,Times New Roman,serif;letter-spacing:-.7px;color:#20201e">'+escape(ev.title)+'</h2>'+
      '<p style="margin:0 0 14px;font:14px/1.7 Arial,sans-serif;color:#585650">'+escape(dateLabel(ev.starts_at))+(ev.location?' &nbsp;·&nbsp; '+escape(ev.location):'')+'</p>'+
      (ev.description?'<p style="margin:0 0 23px;font:15px/1.75 Arial,sans-serif;color:#484640">'+escape(ev.description.slice(0,320))+'</p>':'')+
      '<a href="'+escape(safeLink(ev.ticket_url))+'" style="display:inline-block;border-bottom:1px solid #20201e;padding:0 0 5px;color:#20201e;text-decoration:none;font:600 11px/1.5 Arial,sans-serif;letter-spacing:1.4px">DESCOBRIR &nbsp; ↗</a>'+
      '</td></tr>'
    ).join("");
    const mediaHtml=media.map(m=>m.type==="image"?
      '<tr><td style="padding:10px 0 32px"><a href="'+escape(root)+'"><img src="'+escape(m.url)+'" alt="'+escape(m.name)+'" width="520" style="display:block;width:100%;height:auto;border:0"></a><p style="margin:10px 0 0;font:11px/1.5 Arial,sans-serif;color:#77736d">'+escape(m.name)+'</p></td></tr>':
      '<tr><td style="padding:20px 0 30px;border-top:1px solid #d9d7d1"><p style="font:10px Arial,sans-serif;letter-spacing:2px;color:#7b453e">VÍDEO</p><a href="'+escape(m.url)+'" style="font:normal 25px/1.3 Georgia,serif;color:#20201e">'+escape(m.name)+' ↗</a></td></tr>'
    ).join("");
    const html='<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>@media only screen and (max-width:600px){.shell{width:100%!important}.content{padding-left:26px!important;padding-right:26px!important}.headline{font-size:43px!important}}</style></head><body style="margin:0;padding:0;background:#f4f2ed;color:#20201e"><div style="display:none;max-height:0;overflow:hidden;opacity:0">'+escape(intro.slice(0,130))+'</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:#f4f2ed"><tr><td align="center" style="padding:20px 10px"><table class="shell" role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:100%;border-collapse:collapse;background:#fbfaf7"><tr><td class="content" style="padding:36px 40px 0"><table role="presentation" width="100%" style="border-collapse:collapse"><tr><td style="font:600 12px/1.4 Arial,sans-serif;letter-spacing:1px;color:#20201e">CASA DA CULTURA<br>CÉSAR OLIVEIRA</td><td align="right" valign="top" style="font:11px/1.5 Arial,sans-serif;color:#77736d">EDIÇÃO CULTURAL<br>'+escape(issueDate)+'</td></tr></table><div style="height:1px;background:#20201e;margin-top:27px"></div></td></tr><tr><td class="content" style="padding:80px 40px 68px"><p style="margin:0 0 22px;font:600 11px Arial,sans-serif;letter-spacing:2.4px;color:#7b453e">CULTURA EM MOVIMENTO</p><h1 class="headline" style="margin:0 0 36px;font:normal 56px/1.06 Georgia,Times New Roman,serif;letter-spacing:-1.5px;color:#20201e">'+escape(subject)+'</h1><p style="margin:0;max-width:450px;font:16px/1.85 Arial,sans-serif;color:#484640">'+escape(intro).replace(/\n/g,"<br>")+'</p></td></tr><tr><td class="content" style="padding:0 40px"><p style="margin:0 0 18px;font:600 11px/1.4 Arial,sans-serif;letter-spacing:2.2px;color:#77736d">EM CARTAZ</p><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">'+(eventHtml||'<tr><td style="padding:34px 0;border-top:1px solid #d9d7d1;font:16px/1.7 Georgia,serif">Novas experiências culturais em breve.</td></tr>')+'</table><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">'+mediaHtml+'</table></td></tr><tr><td class="content" style="padding:28px 40px 55px"><a href="'+escape(root)+'" style="display:inline-block;padding:15px 24px;background:#20201e;color:#fbfaf7;text-decoration:none;font:600 11px/1.4 Arial,sans-serif;letter-spacing:1.4px">EXPLORAR A PROGRAMAÇÃO &nbsp; ↗</a></td></tr><tr><td class="content" style="padding:28px 40px 36px;border-top:1px solid #d9d7d1"><p style="margin:0 0 22px;font:normal italic 25px/1.3 Georgia,serif;color:#20201e">Um lugar para a cultura.</p><p style="margin:0 0 12px;font:11px/1.8 Arial,sans-serif;color:#77736d">Casa da Cultura César Oliveira<br>'+(isTest?'EMAIL DE TESTE — não enviado aos subscritores.':'Recebeu esta mensagem porque subscreveu a nossa newsletter.')+'</p><a href="'+escape(unsubscribe)+'" style="font:11px Arial,sans-serif;color:#77736d;text-decoration:underline">Cancelar subscrição</a></td></tr></table></td></tr></table></body></html>';
    try {
      const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{"Authorization":"Bearer "+resendKey,"Content-Type":"application/json"},body:JSON.stringify({from:sender,to:[subscriber.email],subject,html,headers:{"List-Unsubscribe":"<"+unsubscribe+">"}})});
      const details=await response.json().catch(()=>({}));
      if(!response.ok) throw new Error("Resend HTTP "+response.status+" "+String(details.message||""));
      if(!isTest) await client.from("newsletter_deliveries").update({status:"sent",sent_at:new Date().toISOString()}).eq("campaign_id",campaignId).eq("subscriber_id",subscriber.id);
      sent++;
    } catch(error) {
      if(!isTest) await client.from("newsletter_deliveries").update({status:"failed",error:String(error).slice(0,500)}).eq("campaign_id",campaignId).eq("subscriber_id",subscriber.id);
      failed++;
    }
  }
  return NextResponse.json({sent,failed,remaining:Math.max(0,remainingCount-batch.length),totalEligible,events:eventsList.length,testOnly:isTest});
  }
}
