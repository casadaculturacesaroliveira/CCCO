"use client";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { supabaseBrowser } from "../../lib/supabase-browser";
import type { SupabaseClient } from "@supabase/supabase-js";
import "./admin.css";

type Tab = "events" | "site_content" | "site_settings" | "contact_messages" | "newsletter_subscribers";
type Item = { id: string; [key: string]: any };
const categories = ["Cinema", "Música", "Teatro", "Humor", "Exposição", "Concerto", "Conferência", "Palestra"];
const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: "events", label: "Programação", icon: "◈" },
  { id: "site_content", label: "Conteúdos", icon: "▤" },
  { id: "site_settings", label: "Definições", icon: "⚙" },
  { id: "contact_messages", label: "Mensagens", icon: "✉" },
  { id: "newsletter_subscribers", label: "Newsletter", icon: "◎" },
];
const emptyEvent = { title: "", category: "Música", description: "", starts_at: "", location: "Casa da Cultura César Oliveira", image_url: "", ticket_url: "", status: "draft" };
const editableTabs: Tab[] = ["events", "site_content", "site_settings"];

export default function Admin() {
  const [db, setDb] = useState<SupabaseClient | null>(null);
  const [user, setUser] = useState<string | null>(null);
  const [authorized, setAuthorized] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [tab, setTab] = useState<Tab>("events");
  const [rows, setRows] = useState<Item[]>([]);
  const [edit, setEdit] = useState<Item | null>(null);
  const editorRef = useRef<HTMLElement | null>(null);
  useEffect(() => { if (edit) editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, [edit]);
  const [form, setForm] = useState<Record<string, any>>(emptyEvent);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newsSubject, setNewsSubject] = useState("Próximos espetáculos | Casa da Cultura César Oliveira");
  const [newsIntro, setNewsIntro] = useState("Conheça a programação e os próximos espetáculos da nossa Casa da Cultura.");
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [newsSending, setNewsSending] = useState(false);
  const [newsProgress, setNewsProgress] = useState("");

  useEffect(() => {
    try {
      const client = supabaseBrowser();
      setDb(client);
      void client.auth.getUser().then(({ data }) => setUser(data.user?.id || null));
      const { data: { subscription } } = client.auth.onAuthStateChange((_event, session) => setUser(session?.user?.id || null));
      return () => subscription.unsubscribe();
    } catch (err) { setError(String(err)); }
  }, []);
  useEffect(() => {
    if (!db || !user) { setAuthorized(false); setRows([]); return; }
    let active = true;
    void db.from("admin_users").select("user_id").eq("user_id", user).maybeSingle().then(({ data, error: authError }) => {
      if (active) { setAuthorized(!!data && !authError); if (authError) setError(authError.message); }
    });
    return () => { active = false; };
  }, [db, user]);
  useEffect(() => { if (db && authorized) void load(tab); }, [db, authorized, tab]);

  async function load(currentTab: Tab) {
    if (!db) return;
    const { data, error: loadError } = await db.from(currentTab).select("*").order("created_at", { ascending: false });
    if (loadError) setError(loadError.message); else setRows(data || []);
  }
  async function sendNewsletter() {
    if (!db || !authorized || newsSending || !newsSubject.trim()) return;
    if (!confirm("Enviar a newsletter aos subscritores que deram consentimento? Esta ação envia emails reais.")) return;
    setNewsSending(true); setError(""); setNotice("");
    const id=campaignId || crypto.randomUUID();
    setCampaignId(id);
    try {
      const {data:{session}}=await db.auth.getSession();
      if(!session) throw new Error("Sessão expirada. Inicia sessão novamente.");
      const response=await fetch("/api/admin/newsletter/send",{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+session.access_token},body:JSON.stringify({subject:newsSubject,intro:newsIntro,campaignId:id})});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"Falha no envio.");
      setNewsProgress(result.sent+" enviados neste lote · "+result.failed+" falhas · "+result.remaining+" por enviar. Total elegível: "+result.totalEligible+".");
      if(result.remaining===0) setNotice("Envio concluído. Verifica o resultado do último lote.");
    } catch(err) { setError(err instanceof Error?err.message:"Erro ao enviar newsletter."); }
    finally { setNewsSending(false); }
  }
  async function login(event: FormEvent) {
    event.preventDefault(); if (!db) return;
    setBusy(true); setError("");
    const { error: loginError } = await db.auth.signInWithPassword({ email, password });
    if (loginError) setError(loginError.message);
    setBusy(false);
  }
  function begin(item?: Item) {
    setEdit(item || { id: "" });
    setForm(item ? { ...item, starts_at: item.starts_at ? String(item.starts_at).slice(0, 16) : "" }
      : tab === "events" ? { ...emptyEvent } : tab === "site_content" ? { key: "", title: "", body: "" } : { key: "", value: "" });
    setError(""); setNotice("");
  }
  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !db || !authorized) return;
    event.target.value = "";
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      setError("Escolhe uma imagem JPG, PNG, WebP ou GIF."); return;
    }
    if (file.size > 5 * 1024 * 1024) { setError("A imagem deve ter no máximo 5 MB."); return; }
    setUploading(true); setError(""); setNotice("");
    const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : file.type === "image/gif" ? "gif" : "webp";
    const path = `events/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await db.storage.from("event-images").upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) setError(`Não foi possível carregar a imagem: ${uploadError.message}. Confirma que executaste o SQL de armazenamento no Supabase.`);
    else {
      const { data } = db.storage.from("event-images").getPublicUrl(path);
      setForm(current => ({ ...current, image_url: data.publicUrl }));
      setNotice("Imagem carregada. Guarda o evento para associar o cartaz.");
    }
    setUploading(false);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!db || !authorized || !editableTabs.includes(tab) || uploading) return;
    setBusy(true); setError(""); setNotice("");
    let result: { error: { message: string } | null };
    if (tab === "events") {
      const payload = { title: form.title, category: form.category, description: form.description, starts_at: form.starts_at || null, location: form.location, image_url: form.image_url || "", ticket_url: form.ticket_url || "", status: form.status };
      result = edit?.id ? await db.from("events").update(payload).eq("id", edit.id) : await db.from("events").insert(payload);
    } else if (tab === "site_content") {
      const payload = { key: form.key, title: form.title, body: form.body };
      result = edit?.id ? await db.from("site_content").update(payload).eq("id", edit.id) : await db.from("site_content").insert(payload);
    } else {
      const payload = { key: form.key, value: form.value };
      result = edit?.id ? await db.from("site_settings").update(payload).eq("id", edit.id) : await db.from("site_settings").insert(payload);
    }
    setBusy(false);
    if (result.error) setError(result.error.message);
    else { setEdit(null); setNotice("Alterações guardadas com sucesso."); void load(tab); }
  }
  async function remove(item: Item) {
    if (!db || !authorized || !editableTabs.includes(tab) || !confirm("Eliminar este registo?")) return;
    const { error: deleteError } = await db.from(tab).delete().eq("id", item.id);
    if (deleteError) setError(deleteError.message); else { setNotice("Registo eliminado."); void load(tab); }
  }
  async function publish(item: Item) {
    if (!db || !authorized) return;
    const status = item.status === "published" ? "draft" : "published";
    const { error: updateError } = await db.from("events").update({ status }).eq("id", item.id);
    if (updateError) setError(updateError.message); else { setNotice(status === "published" ? "Evento publicado." : "Evento ocultado."); void load(tab); }
  }
  function field(name: string, label: string, kind: "text" | "textarea" | "datetime-local" | "url" = "text") {
    return <label className="ccco-field"><span>{label}</span>{kind === "textarea"
      ? <textarea rows={4} value={form[name] || ""} onChange={e => setForm({ ...form, [name]: e.target.value })} />
      : <input type={kind} value={form[name] || ""} onChange={e => setForm({ ...form, [name]: e.target.value })} />}</label>;
  }
  return <main className="ccco-admin">
    <header className="ccco-topbar"><a className="ccco-brand" href="/"><span className="ccco-mark">✳</span><span>CCCO <small>CASA DA CULTURA CÉSAR OLIVEIRA</small></span></a><a className="ccco-visit" href="/" target="_blank" rel="noopener noreferrer">Ver website ↗</a></header>
    {!user ? <section className="ccco-login ccco-panel"><span className="ccco-eyebrow">ÁREA RESERVADA</span><h1>Bem-vindo de volta<span className="ccco-accent">.</span></h1><p>Inicia sessão para gerir a programação e os conteúdos.</p><form onSubmit={login}>{/* email and password are never stored in the site content */}<label className="ccco-field"><span>Email</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} /></label><label className="ccco-field"><span>Palavra-passe</span><input type="password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="ccco-primary" disabled={busy || !db}>{busy ? "A entrar…" : "Entrar no painel →"}</button></form>{error && <p className="ccco-error" role="alert">{error}</p>}</section>
      : !authorized ? <section className="ccco-login ccco-panel"><h1>Acesso reservado</h1><p>Esta conta não tem permissão de administrador. Confirma o registo em admin_users no Supabase.</p>{error && <p className="ccco-error">{error}</p>}<button className="ccco-primary" onClick={() => void db?.auth.signOut()}>Terminar sessão</button></section>
      : <div className="ccco-shell"><aside className="ccco-sidebar"><div className="ccco-sidebar-label">GESTÃO DO WEBSITE</div><nav aria-label="Navegação do painel">{tabs.map(item => <button key={item.id} className={`ccco-nav ${tab === item.id ? "active" : ""}`} onClick={() => { setTab(item.id); setEdit(null); setError(""); setNotice(""); }}><span className="ccco-nav-icon">{item.icon}</span>{item.label}</button>)}</nav><div className="ccco-sidebar-bottom"><span className="ccco-user">{email || "Administrador"}</span><button className="ccco-logout" onClick={() => void db?.auth.signOut()}>Terminar sessão ↗</button></div></aside>
      <div className="ccco-content"><div className="ccco-heading"><div><span className="ccco-eyebrow">PAINEL DE ADMINISTRAÇÃO / CCCO</span><h1>{tabs.find(item => item.id === tab)?.label}<span className="ccco-accent">.</span></h1><p>Gere os conteúdos da Casa da Cultura num só lugar.</p></div>{editableTabs.includes(tab) && !edit && <button className="ccco-primary" onClick={() => begin()}>＋ Adicionar {tab === "events" ? "evento" : "registo"}</button>}</div>
      {error && <div className="ccco-error" role="alert">{error}</div>}{notice && <div className="ccco-notice" role="status">{notice}</div>}
      <section className="ccco-panel ccco-list"><div className="ccco-panel-heading"><div><span className="ccco-eyebrow">VISÃO GERAL</span><h2>{tabs.find(item => item.id === tab)?.label}</h2></div><span className="ccco-count">{rows.length} {rows.length === 1 ? "registo" : "registos"}</span></div>
      {tab === "newsletter_subscribers" && <div className="ccco-panel ccco-newsletter-send"><h2>Enviar newsletter</h2><p>Envia a programação publicada e os próximos espetáculos apenas a subscritores com consentimento registado. O envio é feito em lotes de até 5 emails.</p><label className="ccco-field"><span>Assunto</span><input maxLength={160} value={newsSubject} onChange={e=>{setNewsSubject(e.target.value);setCampaignId(null);setNewsProgress("");}} /></label><label className="ccco-field"><span>Mensagem de abertura</span><textarea rows={4} maxLength={2000} value={newsIntro} onChange={e=>{setNewsIntro(e.target.value);setCampaignId(null);setNewsProgress("");}} /></label><button className="ccco-primary" disabled={newsSending||!newsSubject.trim()} onClick={()=>void sendNewsletter()}>{newsSending?"A enviar…":campaignId?"Enviar próximo lote / verificar restantes →":"Enviar newsletter →"}</button>{newsProgress && <p role="status">{newsProgress}</p>}<p><small>Antes do primeiro envio, configura Resend e executa a migração SQL. Subscritores antigos sem consentimento registado não recebem emails.</small></p></div>}
      {rows.length === 0 ? <div className="ccco-empty"><span>◇</span><h3>Ainda não existem registos</h3><p>{tab === "events" ? "Começa por adicionar o primeiro evento da programação." : "Os registos aparecerão aqui."}</p></div> : <div className="ccco-table-wrap"><table className="ccco-table"><tbody>{rows.map(item => <tr key={item.id}><td className="ccco-item"><div className="ccco-item-inner">{tab === "events" && item.image_url ? <img className="ccco-thumb" src={item.image_url} alt="" /> : tab === "events" ? <span className="ccco-thumb ccco-thumb-empty">✳</span> : null}<div><strong>{item.title || item.key || item.name || item.email || "Sem título"}</strong><small>{item.category || item.subject || item.value || ""}</small>{item.message && <p>{item.message}</p>}</div></div></td><td className="ccco-date">{item.starts_at ? new Date(item.starts_at).toLocaleString("pt-PT") : item.created_at ? new Date(item.created_at).toLocaleDateString("pt-PT") : ""}</td><td>{tab === "events" && <span className={`ccco-status ${item.status === "published" ? "published" : ""}`}>{item.status === "published" ? "Publicado" : "Rascunho"}</span>}</td><td className="ccco-actions">{tab === "events" && <button onClick={() => void publish(item)}>{item.status === "published" ? "Ocultar" : "Publicar"}</button>}{editableTabs.includes(tab) && <><button onClick={() => begin(item)}>Editar</button><button className="ccco-danger" onClick={() => void remove(item)}>Eliminar</button></>}</td></tr>)}</tbody></table></div>}</section>
      {edit && <section ref={editorRef} className="ccco-panel ccco-editor"><div className="ccco-panel-heading"><div><span className="ccco-eyebrow">EDITOR</span><h2>{edit.id ? "Editar" : "Novo"} {tab === "events" ? "evento" : "registo"}</h2></div><button className="ccco-close" onClick={() => setEdit(null)} aria-label="Fechar editor">✕</button></div><form onSubmit={save}>{tab === "events" ? <><div className="ccco-form-grid">{field("title", "Título do evento")}<label className="ccco-field"><span>Categoria</span><select value={form.category || "Música"} onChange={e => setForm({ ...form, category: e.target.value })}>{!categories.includes(form.category) && form.category && <option value={form.category}>{form.category} (anterior)</option>}{categories.map(category => <option key={category} value={category}>{category}</option>)}</select></label></div>{field("description", "Descrição", "textarea")}<div className="ccco-form-grid">{field("starts_at", "Data e hora", "datetime-local")}{field("location", "Local")}</div><div className="ccco-field"><span>Cartaz / imagem do evento</span><div className="ccco-upload">{form.image_url ? <img src={form.image_url} alt="Pré-visualização do cartaz" className="ccco-preview" /> : <div className="ccco-upload-placeholder"><span>▧</span><p>O cartaz aparecerá aqui</p></div>}<div className="ccco-upload-controls"><label className="ccco-upload-button">＋ {uploading ? "A carregar…" : "Escolher imagem"}<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={e => void uploadImage(e)} disabled={uploading || busy} /></label><small>JPG, PNG, WebP ou GIF · máximo 5 MB</small>{form.image_url && <button type="button" className="ccco-text-button" onClick={() => setForm({ ...form, image_url: "" })}>Remover imagem do evento</button>}</div></div></div>{field("ticket_url", "Ligação para bilhetes (opcional)", "url")}<label className="ccco-field"><span>Estado</span><select value={form.status || "draft"} onChange={e => setForm({ ...form, status: e.target.value })}><option value="draft">Rascunho</option><option value="published">Publicado</option></select></label></> : tab === "site_content" ? <>{field("key", "Chave (ex.: hero)")}{field("title", "Título")}{field("body", "Texto", "textarea")}</> : <>{field("key", "Chave")}{field("value", "Valor", "textarea")}</>}{error && <p className="ccco-error" role="alert">{error}</p>}<div className="ccco-form-actions"><button className="ccco-primary" type="submit" disabled={busy || uploading}>{busy ? "A guardar…" : "Guardar alterações →"}</button><button className="ccco-secondary" type="button" onClick={() => setEdit(null)}>Cancelar</button></div></form></section>}
      </div></div>}
  </main>;
}
