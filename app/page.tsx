 "use client";
import { FormEvent, useEffect, useState } from "react";

const events = [
  { date: "EM BREVE", month: "—", type: "MÚSICA", title: "Novos encontros, novas histórias", desc: "A próxima programação está a ser preparada. Fique atento às novidades.", tag: "Em atualização" },
  { date: "EM BREVE", month: "—", type: "ARTES PERFORMATIVAS", title: "O palco está à sua espera", desc: "Espetáculos, criação contemporânea e momentos para partilhar.", tag: "Em atualização" },
  { date: "EM BREVE", month: "—", type: "COMUNIDADE", title: "Cultura feita em conjunto", desc: "Atividades e iniciativas que aproximam pessoas através da cultura.", tag: "Em atualização" },
];

export default function Home() {
  const [cookieOpen, setCookieOpen] = useState(false);
  const [cookieSettings, setCookieSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [email, setEmail] = useState("");
  const [newsState, setNewsState] = useState("");
  const [contactState, setContactState] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    try { if (!localStorage.getItem("ccco-cookie-consent")) setCookieOpen(true); } catch {}
  }, []);
  function consent(value: string) {
    try { localStorage.setItem("ccco-cookie-consent", value); } catch {}
    setCookieOpen(false); setCookieSettings(false);
  }
  async function subscribe(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); setNewsState("A enviar…");
    try {
      const r = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
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
    <header className="site-header">
      <a href="#inicio" className="brand" aria-label="Casa da Cultura César Oliveira — início"><img src="/logo.png" alt="Casa da Cultura César Oliveira" /></a>
      <button className="menu-toggle" aria-label="Abrir menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? "FECHAR −" : "MENU +"}</button>
      <nav className={menuOpen ? "nav nav-open" : "nav"} aria-label="Navegação principal">
        <a href="#inicio" onClick={() => setMenuOpen(false)}>Home</a><a href="#programacao" onClick={() => setMenuOpen(false)}>Programação</a><a href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer" onClick={() => setMenuOpen(false)}>Bilheteira ↗</a><a href="#contacto" onClick={() => setMenuOpen(false)}>Contacto</a>
      </nav>
      <a className="header-cta" href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Bilheteira <span>↗</span></a>
    </header>

    <section className="hero" id="inicio">
      <div className="hero-topline"><span>UM LUGAR PARA A CULTURA</span><span>OLIVEIRA DO HOSPITAL · PORTUGAL</span></div>
      <div className="hero-copy"><p className="eyebrow"><span className="dot"></span> CULTURA, ENCONTRO, COMUNIDADE</p>
        <h1>Há coisas que<br/>só acontecem <em>ao vivo.</em></h1>
        <p className="hero-lede">Um espaço aberto às ideias, às pessoas e às expressões artísticas. Entre, descubra e faça parte.</p>
        <a className="round-link" href="#programacao">Explorar programação <span>↘</span></a>
      </div>
      <div className="hero-art" aria-label="Composição gráfica abstrata inspirada no movimento e nas artes"><div className="art-circle"></div><div className="art-ring"></div><div className="art-bar"></div><div className="art-caption">ESPAÇO PARA<br/>O QUE NOS MOVE.</div><span className="art-index">CCCO / 01</span></div>
      <div className="hero-bottom"><span>ARTE QUE NOS LIGA.</span><span>DESCUBRA O QUE VEM A SEGUIR ↓</span></div>
    </section>

    <section className="intro section-pad"><div className="section-kicker"><span>01 / A CASA</span><span>MAIS DO QUE UM ESPAÇO</span></div><div className="intro-grid"><h2>Um ponto de encontro.<br/><em>Mil possibilidades.</em></h2><div className="intro-text"><p>Acreditamos na cultura como lugar de descoberta, partilha e transformação. Um espaço para ver, ouvir, pensar e sentir — em conjunto.</p><a className="text-link" href="#contacto">Venha conhecer-nos <span>↗</span></a></div></div></section>

    <section className="program section-pad" id="programacao"><div className="section-kicker"><span>02 / AGENDA</span><span>O QUE ACONTECE AQUI</span></div><div className="section-heading"><h2>Programação<span className="accent">.</span></h2><p>Novas perspetivas. Novas vozes.<br/>Momentos para viver em conjunto.</p></div>
      <div className="event-list">{events.map((ev, i) => <article className="event" key={ev.type}><div className="event-number">0{i+1}</div><div className="event-date"><strong>{ev.date}</strong><span>{ev.month}</span></div><div className="event-main"><span className="event-type">{ev.type}</span><h3>{ev.title}</h3><p>{ev.desc}</p></div><div className="event-action"><span className="status">{ev.tag}</span><span className="event-arrow">↗</span></div></article>)}</div>
      <p className="editor-note">A agenda será atualizada com eventos e datas confirmados.</p>
    </section>

    <section className="ticket section-pad" id="bilheteira"><div className="ticket-shape"><span>AO VIVO</span><span>NO MESMO LUGAR.</span><div className="ticket-stamp">CCCO<br/>✳</div></div><div className="ticket-copy"><p className="eyebrow">03 / BILHETEIRA</p><h2>O seu próximo<br/>momento começa <em>aqui.</em></h2><p>Consulte a programação e prepare a sua próxima visita. As informações de bilhetes serão disponibilizadas assim que cada evento for anunciado.</p><a className="button-light" href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Comprar bilhetes na Ticketline <span>↗</span></a><small>A compra de bilhetes é feita na página oficial da Casa da Cultura na Ticketline.</small></div></section>

    <section className="contact section-pad" id="contacto"><div className="section-kicker"><span>04 / CONVERSA</span><span>ESTAMOS POR AQUI</span></div><div className="contact-grid"><div><h2>Vamos<br/><em>conversar?</em></h2><p>Tem uma questão, uma ideia ou quer saber mais sobre a Casa? Escreva-nos.</p><div className="contact-meta"><span>CASA DA CULTURA CÉSAR OLIVEIRA</span><span>Oliveira do Hospital, Portugal</span><span>O email e a morada oficiais podem ser adicionados aqui.</span></div></div><form className="contact-form" onSubmit={sendContact}><label>O seu nome<input name="name" required placeholder="Como se chama?" /></label><label>O seu email<input name="email" type="email" required placeholder="nome@email.com" /></label><label>Assunto<select name="subject" defaultValue="Informações gerais"><option>Informações gerais</option><option>Bilheteira</option><option>Programação</option><option>Parcerias</option></select></label><label>A sua mensagem<textarea name="message" required rows={3} placeholder="Diga-nos como podemos ajudar…" /></label><button className="submit-button" type="submit">Enviar mensagem <span>↗</span></button>{contactState && <p className="form-status" role="status">{contactState}</p>}</form></div></section>

    <section className="newsletter"><div><p className="eyebrow">CARTA DA CASA · SEM SPAM</p><h2>As novidades chegam<br/><em>até si.</em></h2><p>Receba programação, novidades e momentos a não perder.</p></div><form onSubmit={subscribe} className="newsletter-form"><label htmlFor="newsletter-email">O seu email</label><div className="email-row"><input id="newsletter-email" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nome@email.com"/><button type="submit" aria-label="Subscrever newsletter">Subscrever <span>↗</span></button></div><small>Ao subscrever, concorda em receber comunicações da Casa. Pode cancelar a qualquer momento.</small>{newsState && <p className="form-status" role="status">{newsState}</p>}</form></section>

    <footer className="footer"><a href="#inicio" className="footer-brand"><img src="/logo.png" alt="Casa da Cultura César Oliveira"/></a><p>Um lugar para a cultura.<br/>Um lugar para todos.</p><div className="footer-links"><a href="#programacao">Programação</a><a href="https://www.ticketline.pt/salas/sala/4148" target="_blank" rel="noopener noreferrer">Bilheteira ↗</a><a href="#contacto">Contacto</a><button onClick={() => {setCookieOpen(true);setCookieSettings(true)}}>Preferências de cookies</button></div><div className="footer-bottom"><span>© {new Date().getFullYear()} Casa da Cultura César Oliveira</span><span>FEITO PARA VIVER AO VIVO. ↗</span></div></footer>

    {cookieOpen && <div className="cookie-backdrop" role="presentation"><section className="cookie-panel" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><div className="cookie-top"><span>CCCO / PRIVACIDADE</span><span>✳</span></div><h2 id="cookie-title">{cookieSettings ? "As suas preferências." : "A sua privacidade importa."}</h2><p>Utilizamos cookies essenciais para o funcionamento do site. Com a sua autorização, poderemos também usar cookies analíticos para melhorar a experiência.</p>{cookieSettings && <label className="analytics-toggle"><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)}/> Permitir cookies analíticos</label>}<div className="cookie-actions"><button className="cookie-accept" onClick={() => consent(JSON.stringify({essential:true,analytics:cookieSettings ? analytics : true,at:new Date().toISOString()}))}>Aceitar todos</button><button onClick={() => consent(JSON.stringify({essential:true,analytics:false,at:new Date().toISOString()}))}>Só essenciais</button>{!cookieSettings && <button onClick={() => setCookieSettings(true)}>Personalizar</button>}</div><small>Os cookies essenciais não podem ser desativados. Pode alterar a sua escolha a qualquer momento no rodapé.</small></section></div>}
  </main>;
}