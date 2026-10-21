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

    <section className="intro section-pad" id="apresentacao-missao"><div className="section-kicker"><span>01 / A CCCO</span><span>APRESENTAÇÃO E MISSÃO</span></div><div className="intro-grid"><h2>Apresentação <em>e Missão.</em></h2><div className="intro-text"><p>A <strong>Casa da Cultura César Oliveira (CCCO)</strong>, situada em Oliveira do Hospital, é um equipamento cultural municipal que assume, na sua missão de serviço público, o compromisso de promover e valorizar a cultura, a criação artística e o acesso às artes.</p><p>Através de uma programação cultural regular, diversificada e de qualidade, a Casa da Cultura César Oliveira procura proporcionar à comunidade o contacto com diferentes linguagens e expressões artísticas, abrangendo áreas como a música, o teatro, a dança, o cinema e outras manifestações culturais. Pretende afirmar-se como um espaço de encontro, descoberta e partilha, aberto a públicos de todas as idades e atento à diversidade de interesses e sensibilidades.</p><p>A <strong>formação e sensibilização de públicos</strong> constituem igualmente uma dimensão fundamental da sua missão. Através de iniciativas educativas, atividades culturais e projetos de participação comunitária, a CCCO procura estimular a curiosidade, o pensamento crítico, a criatividade e a valorização das artes, incentivando uma relação próxima e continuada entre a cultura e a comunidade.</p><p>Enquanto espaço de acolhimento e dinamização cultural, a Casa da Cultura César Oliveira pretende contribuir ativamente para o desenvolvimento cultural de Oliveira do Hospital e da região, promovendo o diálogo entre artistas, criadores, instituições e públicos.</p><p>Assumindo-se como um lugar de proximidade, inclusão e participação, a CCCO valoriza a identidade cultural do território, apoia a divulgação de diferentes formas de expressão artística e procura estabelecer parcerias que fortaleçam a vida cultural do concelho.</p><p><strong>Mais do que um espaço de espetáculos, a Casa da Cultura César Oliveira é um lugar de encontro entre pessoas, ideias e emoções, onde a cultura acontece, se vive e se partilha.</strong></p></div></div></section>

    <section className="intro section-pad" id="espacos"><div className="section-kicker"><span>ESPAÇOS</span><span>CASA DA CULTURA CÉSAR OLIVEIRA</span></div><div className="espacos-content"><h2>Os nossos <em>espaços.</em></h2><div className="espacos-list"><article className="espacos-item"><h3>AUDITÓRIO</h3><p>Este é o espaço por excelência para receber os espetáculos mais importantes, nas áreas da música, dança, teatro, multidisciplinar e cinema. Este espaço, nomeadamente o palco nele integrado, dadas as suas características, serve também o desenvolvimento de atividades ligadas ao Serviço Educativo de Práticas Artísticas (SEPA), assim como para a realização de pequenos espetáculos ou performances intimistas. Tem capacidade para 288 lugares sentados.</p></article><article className="espacos-item"><h3>PEQUENO AUDITÓRIO/SALA MULTIUSOS</h3><p>O Pequeno Auditório/Sala Multiusos funciona como sala de exposições e como espaço para tertúlias, conversas informais, debates, colóquios, reuniões, concertos intimistas, espetáculos de dança e teatro e ainda exibição de filmes em formato 35mm. Tem capacidade para cerca de 100 pessoas.</p></article><article className="espacos-item"><h3>SALA DE EXPOSIÇÕES</h3><p>Este espaço é destinado a exposições de artes plásticas, fotografia, escultura, instalação e outras, podendo igualmente desenvolverem-se atividades no âmbito do Serviço Educativo de Práticas Artísticas (SEPA).</p></article><article className="espacos-item"><h3>WELCOME CENTER</h3><p>O Welcome Center funciona como montra da Casa da Cultura César Oliveira e igualmente como montra da oferta turística de Oliveira do Hospital, uma vez que este espaço funciona também como Posto de Turismo, promovendo as redes institucionais das quais o Município de Oliveira do Hospital faz parte, como as Aldeias do Xisto, Aldeias de Montanha ou o Estrela Geopark Mundial da UNESCO. É também um espaço de venda de artesanato local e de autor (cestas tradicionais, tapetes, azulejaria, olaria ou gastronomia regional embalada), assim como de peças de recordação do concelho de Oliveira do Hospital (crachás, canecas, livros, brochuras, etc.).</p></article><article className="espacos-item"><h3>ANFITEATRO AO AR LIVRE</h3><p>Dadas as características deste espaço, é ideal para espetáculos ao ar livre, na área do teatro e da música, assim como espaço de convívio informal. Nos meses mais quentes, serve como espaço de debates e tertúlias sobre vários e variados temas, convidando oradores locais, regionais e nacionais. Sessões de DJ e música eletrónica ou sessões de cinema ao ar livre são ideais para este espaço da Casa da Cultura César Oliveira.</p></article><article className="espacos-item"><h3>ANTIGO COLÉGIO BRÁS GARCIA DE MASCARENHAS/ROTARY UNIVERSIDADE SÉNIOR</h3><p>Este espaço, para além de albergar a Universidade Sénior de Oliveira do Hospital, funciona igualmente como espaço de residências artísticas e trabalho colaborativo.</p></article><article className="espacos-item"><h3>SERVIÇO EDUCATIVO DE PRÁTICAS ARTÍSTICAS (SEPA)</h3><p>O Serviço Educativo da CCCO é uma porta aberta para todas as crianças e jovens, principalmente, interessados em saber e aprender sobre vários assuntos ligados à arte e ao espetáculo, assim como o público sénior e público em geral. Visitas guiadas à CCCO e formação e oficinas sobre som, música, vídeo, fotografia, cinema e outros media, são os objetivos do SEPA, numa perspetiva lúdica e pedagógica.</p></article></div></div></section>

    <section className="program section-pad" id="programacao"><div className="section-kicker"><span>02 / AGENDA</span><span>O QUE ACONTECE AQUI</span></div><div className="section-heading"><h2>Programação<span className="accent">.</span></h2><p>Novas perspetivas. Novas vozes.<br/>Momentos para viver em conjunto.</p></div>
      <div className="program-grid">{events.map((ev, i) => <article className="program-card" key={i}>
        <div className="program-card-image">{ev.image_url ? <img src={ev.image_url} alt={"Cartaz do evento "+ev.title} loading="lazy" /> : <div className="program-card-placeholder" aria-hidden="true"><span>CCCO ✳</span><strong>CULTURA<br/>AO VIVO.</strong></div>}<span className="program-card-category">{ev.type}</span><div className="program-card-overlay"><strong>{ev.title}</strong><p>{ev.desc}</p></div></div>
        <div className="program-card-info"><span className="program-card-date">{ev.date} {ev.month}</span><h3>{ev.title}</h3><div className="program-card-bottom">{ev.ticket_url ? <a href={ev.ticket_url} target="_blank" rel="noopener noreferrer" aria-label={"Bilhetes para "+ev.title}>Bilhetes ↗</a> : <span>Bilhetes em breve</span>}</div></div>
      </article>)}</div>
      <p className="editor-note">A agenda será atualizada com eventos e datas confirmados.</p>
    </section>

    <section className="ticket section-pad" id="bilheteira"><div className="ticket-shape"><span>AO VIVO</span><span>NO MESMO LUGAR.</span><div className="ticket-stamp">CCCO<br/>✳</div></div><div className="ticket-copy" id="informacoes"><p className="eyebrow">03 / INFORMAÇÕES</p><h2>Bilheteira<span className="accent">.</span></h2><p><strong>Bilheteira presencial</strong> | Para informações sobre aquisição presencial de bilhetes, horários de atendimento e reservas, contacte a Casa da Cultura César Oliveira através do email <a href="mailto:casadaculturacesaroliveira@gmail.com">casadaculturacesaroliveira@gmail.com</a>.</p><p><strong>Bilheteira online</strong> | Poderá adquirir os seus bilhetes através da página oficial da Casa da Cultura César Oliveira na Ticketline.</p><a className="button-light" href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Comprar bilhetes na Ticketline <span>↗</span></a><p>Após a compra online, consulte o email de confirmação e as instruções de utilização dos bilhetes enviadas pela plataforma. Siga as indicações de validação apresentadas no bilhete.</p><p><strong>Condições de acesso</strong> | Recomendamos a chegada antes da hora indicada para o início do espetáculo. A entrada após o início pode estar sujeita às indicações da equipa de sala e às condições específicas do evento. Conserve o bilhete até ao final do espetáculo.</p><p>A captação de imagem ou som durante os espetáculos depende de autorização prévia. Respeite as indicações da equipa de sala relativas ao consumo de alimentos e bebidas e às regras de utilização dos espaços.</p><p><strong>Acessibilidade</strong> | Se necessitar de apoio ou de condições específicas de acesso por mobilidade reduzida, contacte antecipadamente a Casa da Cultura César Oliveira para obter informações sobre as condições disponíveis.</p></div></section>

    <section className="contact section-pad" id="contacto"><div className="section-kicker"><span>04 / CONVERSA</span><span>ESTAMOS POR AQUI</span></div><div className="contact-grid"><div><h2>Vamos<br/><em>conversar?</em></h2><p>Tem uma questão, uma ideia ou quer saber mais sobre a Casa? Escreva-nos.</p><div className="contact-meta"><span>CASA DA CULTURA CÉSAR OLIVEIRA</span><a href="https://www.google.com/maps/search/?api=1&query=Rua%20do%20Col%C3%A9gio%2C%203400-065%20Oliveira%20do%20Hospital" target="_blank" rel="noopener noreferrer" aria-label="Ver morada no Google Maps">Rua do Colégio, 3400-065 Oliveira do Hospital ↗</a><a href={"mailto:"+(settings.contact_email || "ccco@cm-oliveiradohospital.pt")}>{settings.contact_email || "ccco@cm-oliveiradohospital.pt"}</a></div></div><form className="contact-form" onSubmit={sendContact}><label>O seu nome<input name="name" required placeholder="Como se chama?" /></label><label>O seu email<input name="email" type="email" required placeholder="nome@email.com" /></label><label>Assunto<select name="subject" defaultValue="Informações gerais"><option>Informações gerais</option><option>Bilheteira</option><option>Programação</option><option>Parcerias</option></select></label><label>A sua mensagem<textarea name="message" required rows={3} placeholder="Diga-nos como podemos ajudar…" /></label><button className="submit-button" type="submit">Enviar mensagem <span>↗</span></button>{contactState && <p className="form-status" role="status">{contactState}</p>}</form></div></section>

    <section className="newsletter"><div><p className="eyebrow">CARTA DA CASA · SEM SPAM</p><h2>As novidades chegam<br/><em>até si.</em></h2><p>Receba programação, novidades e momentos a não perder.</p></div><form onSubmit={subscribe} className="newsletter-form"><label htmlFor="newsletter-email">O seu email</label><div className="email-row"><input id="newsletter-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com"/><button type="submit" aria-label="Subscrever newsletter">Subscrever <span>↗</span></button></div><label className="newsletter-consent"><input type="checkbox" required /> Aceito receber por email a programação e novidades da Casa da Cultura César Oliveira. Posso cancelar a subscrição a qualquer momento.</label>{newsState && <p className="form-status" role="status">{newsState}</p>}</form></section>

    <footer className="footer"><a href="#inicio" className="footer-brand"><img src="/logo.png" alt="Casa da Cultura César Oliveira"/></a><p>Um lugar para a cultura.<br/>Um lugar para todos.</p><div className="footer-links"><a href="#programacao">Programação</a><a href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Bilheteira ↗</a><a href="#contacto">Contacto</a><button onClick={() => {setCookieOpen(true);setCookieSettings(true)}}>Preferências de cookies</button></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Casa da Cultura César Oliveira</span><span>FEITO PARA VIVER AO VIVO. ↗</span></div></footer>

    {cookieOpen && <div className="cookie-backdrop" role="presentation"><section className="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><div className="cookie-top"><span>CCCO / PRIVACIDADE</span><span>✳</span></div><h2 id="cookie-title">{cookieSettings ? "As suas preferências." : "A sua privacidade importa."}</h2><p>Utilizamos armazenamento essencial para o funcionamento do site. Com a sua autorização, o Google Analytics ajuda-nos a compreender as visitas e o Meta Pixel permite medir campanhas de publicidade no Facebook e Instagram. Pode escolher cada finalidade em separado.</p>{cookieSettings && <div className="cookie-preferences"><label className="analytics-toggle"><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)}/> Estatísticas (Google Analytics)</label><label className="analytics-toggle"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}/> Publicidade (Meta Pixel)</label></div>}<div className="cookie-actions"><button className="cookie-accept" onClick={() => consent(true,true)}>Aceitar todos</button><button onClick={() => consent(false,false)}>Só essenciais</button>{cookieSettings ? <button onClick={() => consent(analytics,marketing)}>Guardar preferências</button> : <button onClick={() => setCookieSettings(true)}>Personalizar</button>}</div><small>Pode alterar as suas preferências a qualquer momento no rodapé. As ferramentas opcionais não são carregadas antes do consentimento.</small></section></div>}
  </main>;
}