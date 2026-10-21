 "use client";
import { FormEvent, useEffect, useState } from "react";
import { supabaseBrowser } from "../lib/supabase-browser";
import Script from "next/script";

type ProgramEvent = {date:string;month:string;type:string;title:string;desc:string;tag:string;ticket_url?:string;image_url?:string};
const fallbackEvents: ProgramEvent[] = [
  { date: "EM BREVE", month: "—", type: "MÚSICA", title: "Novos encontros, novas histórias", desc: "A próxima programação está a ser preparada. Fique atento às novidades.", tag: "Em atualização" },
  { date: "EM BREVE", month: "—", type: "ARTES PERFORMATIVAS", title: "O palco está à sua espera", desc: "Espetáculos, criação contemporânea e momentos para partilhar.", tag: "Em atualização" },
  { date: "EM BREVE", month: "—", type: "COMUNIDADE", title: "Cultura feita em conjunto", desc: "Atividades e iniciativas que aproximam pessoas através da cultura.", tag: "Em atualização" },
];

export default function Home() {
  const [cookieOpen, setCookieOpen] = useState(false);
  const [cookieSettings, setCookieSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [consentChoice, setConsentChoice] = useState<{analytics:boolean;marketing:boolean}|null>(null);
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const [email, setEmail] = useState("");
  const [newsState, setNewsState] = useState("");
  const [contactState, setContactState] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [events, setEvents] = useState<ProgramEvent[]>(fallbackEvents);
  const [content, setContent] = useState<Record<string,{title:string;body:string}>>({});
  const [settings, setSettings] = useState<Record<string,string>>({});
  useEffect(() => {
    let active = true;
    try {
      const db = supabaseBrowser();
      void db.from("events").select("title,category,description,starts_at,ticket_url,image_url")
        .eq("status","published").order("starts_at",{ascending:true}).then(({data,error}) => {
          if (!active || error || !data || !data.length) return;
          setEvents(data.map(ev => ({
            date: ev.starts_at ? new Date(ev.starts_at).toLocaleDateString("pt-PT",{day:"2-digit"}) : "EM BREVE",
            month: ev.starts_at ? new Date(ev.starts_at).toLocaleDateString("pt-PT",{month:"short",year:"numeric"}).toUpperCase() : "—",
            type: ev.category.toUpperCase(), title:ev.title,desc:ev.description,tag:ev.starts_at?"Confirmado":"Em breve",
            ticket_url:ev.ticket_url || "", image_url:ev.image_url || ""
          })));
        });
      void db.from("site_content").select("key,title,body").then(({data}) => {
        if(active && data) setContent(Object.fromEntries(data.map(c=>[c.key,{title:c.title,body:c.body}])));
      });
      void db.from("site_settings").select("key,value").then(({data}) => {
        if(active && data) setSettings(Object.fromEntries(data.map(c=>[c.key,c.value])));
      });
    } catch {}
    return () => {active=false};
  }, []);

  useEffect(() => {
    try { const saved = localStorage.getItem("ccco-cookie-consent"); if (!saved) { setCookieOpen(true); return; } const parsed = JSON.parse(saved); if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") { setCookieOpen(true); return; } setConsentChoice({analytics:parsed.analytics,marketing:parsed.marketing}); setAnalytics(parsed.analytics); setMarketing(parsed.marketing); } catch { setCookieOpen(true); }
  }, []);
  function consent(allowAnalytics: boolean, allowMarketing: boolean) { const previous = consentChoice; const next = {analytics:allowAnalytics,marketing:allowMarketing}; try { localStorage.setItem("ccco-cookie-consent", JSON.stringify({essential:true,...next,at:new Date().toISOString()})); } catch {} setConsentChoice(next); setAnalytics(allowAnalytics); setMarketing(allowMarketing); setCookieOpen(false); setCookieSettings(false); if (previous && ((previous.analytics && !allowAnalytics) || (previous.marketing && !allowMarketing))) window.location.reload(); }
  async function subscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setNewsState("A enviar…");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, consent: true }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível subscrever.");
      setNewsState("Obrigado! A sua inscrição foi registada."); setEmail("");
    } catch (err) { setNewsState(err instanceof Error ? err.message : "Ocorreu um erro."); }
  }
  async function sendContact(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setContactState("A enviar…");
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      const r = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Não foi possível enviar a mensagem.");
      setContactState("Mensagem enviada. Obrigado pelo contacto."); form.reset();
    } catch (err) { setContactState(err instanceof Error ? err.message : "Ocorreu um erro."); }
  }

  return <main>
    {consentChoice?.analytics && gaId && /^G-[A-Z0-9]+$/.test(gaId) && <><Script src={"https://www.googletagmanager.com/gtag/js?id="+gaId} strategy="afterInteractive" /><Script id="ccco-ga4" strategy="afterInteractive">{ "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag(\u0027js\u0027,new Date());gtag(\u0027config\u0027,\u0027"+gaId+"\u0027,{anonymize_ip:true});" }</Script></>}
    {consentChoice?.marketing && pixelId && /^[0-9]+$/.test(pixelId) && <Script id="ccco-meta-pixel" strategy="afterInteractive">{ "!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version=\u00272.0\u0027;n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,\u0027script\u0027,\u0027https://connect.facebook.net/en_US/fbevents.js\u0027);fbq(\u0027init\u0027,\u0027"+pixelId+"\u0027);fbq(\u0027track\u0027,\u0027PageView\u0027);" }</Script>}
    <header className="site-header">
      <a href="#inicio" className="brand" aria-label="Casa da Cultura César Oliveira — início"><img src="/logo.png" alt="Casa da Cultura César Oliveira" /></a>
      <button className="menu-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "FECHAR −" : "MENU +"}</button>
      <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Navegação principal">
        <a href="#inicio" onClick={() => setMenuOpen(false)}>Home</a><details className="nav-dropdown"><summary>A CCCO <span aria-hidden="true">⌄</span></summary><div className="nav-submenu"><a href="#apresentacao-missao" onClick={() => setMenuOpen(false)}>APRESENTAÇÃO E MISSÃO</a><a href="#espacos" onClick={() => setMenuOpen(false)}>ESPAÇOS</a></div></details><a href="#programacao" onClick={() => setMenuOpen(false)}>Programação</a><a href="#informacoes" onClick={() => setMenuOpen(false)}>Informações</a><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
      </nav>
      <a className="header-cta" href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Bilheteira <span>↗</span></a>
    </header>

    <section className="hero" id="inicio">
      <div className="hero-topline"><span>UM LUGAR PARA A CULTURA</span><span>OLIVEIRA DO HOSPITAL · PORTUGAL</span></div>
      <div className="hero-copy"><p className="eyebrow"><span className="dot"></span> CULTURA, ENCONTRO, COMUNIDADE</p>
        <h1>{content.hero?.title || <>Há coisas que<br/>só acontecem <em>ao vivo.</em></>}</h1>
        <p className="hero-lede">{content.hero?.body || "Um espaço aberto às ideias, às pessoas e às expressões artísticas. Entre, descubra e faça parte."}</p>
        <a className="round-link" href="#programacao">Explorar programação <span>↘</span></a>
      </div>
      <div className="hero-art" aria-label="Composição gráfica abstrata inspirada no movimento e nas artes"><div className="art-circle"></div><div className="art-ring"></div><div className="art-bar"></div><div className="art-caption">ESPAÇO PARA<br/>O QUE NOS MOVE.</div><span className="art-index">CCCO / 01</span></div>
      <div className="hero-bottom"><span>ARTE QUE NOS LIGA.</span><span>DESCUBRA O QUE VEM A SEGUIR ↓</span></div>
    </section>

    <section className="intro section-pad" id="apresentacao-missao"><div className="section-kicker"><span>01 / A CASA</span><span>MAIS DO QUE UM ESPAÇO</span></div><div className="intro-grid"><h2>{content.intro?.title || <>Um ponto de encontro.<br/><em>Mil possibilidades.</em></>}</h2><div className="intro-text"><p>{content.intro?.body || "Acreditamos na cultura como lugar de descoberta, partilha e transformação. Um espaço para ver, ouvir, pensar e sentir — em conjunto."}</p><a className="text-link" href="#contacto">Venha conhecer-nos <span>↗</span></a></div></div></section>

    <section className="intro section-pad" id="espacos"><div className="section-kicker"><span>ESPAÇOS</span><span>CASA DA CULTURA CÉSAR OLIVEIRA</span></div><div className="intro-grid"><h2>Espaços para <em>viver a cultura.</em></h2><div className="intro-text"><p>Conheça os espaços da Casa da Cultura César Oliveira, dedicados ao encontro entre a comunidade e as diferentes expressões artísticas.</p><a className="text-link" href="#contacto">Peça mais informações <span>↗</span></a></div></div></section>

    <section className="program section-pad" id="programacao"><div className="section-kicker"><span>02 / AGENDA</span><span>O QUE ACONTECE AQUI</span></div><div className="section-heading"><h2>Programação<span className="accent">.</span></h2><p>Novas perspetivas. Novas vozes.<br/>Momentos para viver em conjunto.</p></div>
      <div className="program-grid">{events.map((ev, i) => <article className="program-card" key={i}>
        <div className="program-card-image">{ev.image_url ? <img src={ev.image_url} alt={"Cartaz do evento "+ev.title} loading="lazy" /> : <div className="program-card-placeholder" aria-hidden="true"><span>CCCO ✳</span><strong>CULTURA<br/>AO VIVO.</strong></div>}<span className="program-card-category">{ev.type}</span></div>
        <div className="program-card-info"><span className="program-card-date">{ev.date} {ev.month}</span><h3>{ev.title}</h3><p>{ev.desc}</p><div className="program-card-bottom"><span>{ev.tag}</span>{ev.ticket_url ? <a href={ev.ticket_url} target="_blank" rel="noopener noreferrer" aria-label={"Bilhetes para "+ev.title}>Bilhetes ↗</a> : <span>Em breve ↗</span>}</div></div>
      </article>)}</div>
      <p className="editor-note">A agenda será atualizada com eventos e datas confirmados.</p>
    </section>

    <section className="ticket section-pad" id="bilheteira"><div className="ticket-shape"><span>AO VIVO</span><span>NO MESMO LUGAR.</span><div className="ticket-stamp">CCCO<br/>✳</div></div><div className="ticket-copy" id="informacoes"><p className="eyebrow">03 / BILHETEIRA</p><h2>O seu próximo<br/>momento começa <em>aqui.</em></h2><p>Consulte a programação e prepare a sua próxima visita. As informações de bilhetes serão disponibilizadas assim que cada evento for anunciado.</p><a className="button-light" href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Comprar bilhetes na Ticketline <span>↗</span></a><small>A compra de bilhetes é feita na página oficial da Casa da Cultura na Ticketline.</small></div></section>

    <section className="contact section-pad" id="contacto"><div className="section-kicker"><span>04 / CONVERSA</span><span>ESTAMOS POR AQUI</span></div><div className="contact-grid"><div><h2>Vamos<br/><em>conversar?</em></h2><p>Tem uma questão, uma ideia ou quer saber mais sobre a Casa? Escreva-nos.</p><div className="contact-meta"><span>CASA DA CULTURA CÉSAR OLIVEIRA</span><a href="https://www.google.com/maps/search/?api=1&query=Rua%20do%20Col%C3%A9gio%2C%203400-065%20Oliveira%20do%20Hospital" target="_blank" rel="noopener noreferrer" aria-label="Ver morada no Google Maps">Rua do Colégio, 3400-065 Oliveira do Hospital ↗</a><a href={"mailto:"+(settings.contact_email || "ccco@cm-oliveiradohospital.pt")}>{settings.contact_email || "ccco@cm-oliveiradohospital.pt"}</a></div></div><form className="contact-form" onSubmit={sendContact}><label>O seu nome<input name="name" required placeholder="Como se chama?" /></label><label>O seu email<input name="email" type="email" required placeholder="nome@email.com" /></label><label>Assunto<select name="subject" defaultValue="Informações gerais"><option>Informações gerais</option><option>Bilheteira</option><option>Programação</option><option>Parcerias</option></select></label><label>A sua mensagem<textarea name="message" required rows={3} placeholder="Diga-nos como podemos ajudar…" /></label><button className="submit-button" type="submit">Enviar mensagem <span>↗</span></button>{contactState && <p className="form-status" role="status">{contactState}</p>}</form></div></section>

    <section className="newsletter"><div><p className="eyebrow">CARTA DA CASA · SEM SPAM</p><h2>As novidades chegam<br/><em>até si.</em></h2><p>Receba programação, novidades e momentos a não perder.</p></div><form onSubmit={subscribe} className="newsletter-form"><label htmlFor="newsletter-email">O seu email</label><div className="email-row"><input id="newsletter-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com"/><button type="submit" aria-label="Subscrever newsletter">Subscrever <span>↗</span></button></div><label className="newsletter-consent"><input type="checkbox" required /> Aceito receber por email a programação e novidades da Casa da Cultura César Oliveira. Posso cancelar a subscrição a qualquer momento.</label>{newsState && <p className="form-status" role="status">{newsState}</p>}</form></section>

    <footer className="footer"><a href="#inicio" className="footer-brand"><img src="/logo.png" alt="Casa da Cultura César Oliveira"/></a><p>Um lugar para a cultura.<br/>Um lugar para todos.</p><div className="footer-links"><a href="#programacao">Programação</a><a href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Bilheteira ↗</a><a href="#contacto">Contacto</a><button onClick={() => {setCookieOpen(true);setCookieSettings(true)}}>Preferências de cookies</button></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Casa da Cultura César Oliveira</span><span>FEITO PARA VIVER AO VIVO. ↗</span></div></footer>

    {cookieOpen && <div className="cookie-backdrop" role="presentation"><section className="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><div className="cookie-top"><span>CCCO / PRIVACIDADE</span><span>✳</span></div><h2 id="cookie-title">{cookieSettings ? "As suas preferências." : "A sua privacidade importa."}</h2><p>Utilizamos armazenamento essencial para o funcionamento do site. Com a sua autorização, o Google Analytics ajuda-nos a compreender as visitas e o Meta Pixel permite medir campanhas de publicidade no Facebook e Instagram. Pode escolher cada finalidade em separado.</p>{cookieSettings && <div className="cookie-preferences"><label className="analytics-toggle"><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)}/> Estatísticas (Google Analytics)</label><label className="analytics-toggle"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}/> Publicidade (Meta Pixel)</label></div>}<div className="cookie-actions"><button className="cookie-accept" onClick={() => consent(true,true)}>Aceitar todos</button><button onClick={() => consent(false,false)}>Só essenciais</button>{cookieSettings ? <button onClick={() => consent(analytics,marketing)}>Guardar preferências</button> : <button onClick={() => setCookieSettings(true)}>Personalizar</button>}</div><small>Pode alterar as suas preferências a qualquer momento no rodapé. As ferramentas opcionais não são carregadas antes do consentimento.</small></section></div>}
  </main>;
}