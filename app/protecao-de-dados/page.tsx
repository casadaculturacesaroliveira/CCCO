import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Proteção de Dados (RGPD) | Casa da Cultura César Oliveira",
  description: "Informação sobre privacidade, dados pessoais, cookies e direitos dos titulares no site da Casa da Cultura César Oliveira.",
};

export default function ProtecaoDados() {
  return <main className="privacy-page">
    <header className="privacy-header"><Link href="/" aria-label="Voltar à página inicial">← Voltar ao site</Link><span>CASA DA CULTURA CÉSAR OLIVEIRA</span></header>
    <article className="privacy-content">
      <p className="privacy-kicker">PRIVACIDADE E TRANSPARÊNCIA</p>
      <h1>Regulamento Geral sobre a Proteção de Dados <em>(RGPD)</em></h1>
      <p className="privacy-lead">A proteção dos seus dados pessoais é importante. Nesta página explicamos que informações podem ser tratadas através do site www.ccco.pt e como pode exercer os seus direitos.</p>
      <p className="privacy-note"><strong>Informação em validação:</strong> a identificação formal do responsável pelo tratamento, os prazos de conservação, os eventuais subcontratantes e as transferências internacionais devem ser confirmados pela entidade gestora e pelo respetivo encarregado de proteção de dados. Esta página não substitui essa validação.</p>

      <section><h2>1. Responsável pelo tratamento e contactos</h2>
      <p>O site é disponibilizado no âmbito da atividade da Casa da Cultura César Oliveira, em Oliveira do Hospital. A identificação jurídica completa da entidade responsável pelo tratamento e, quando aplicável, os contactos do encarregado de proteção de dados encontram-se pendentes de confirmação.</p>
      <p>Para questões relativas à privacidade ou ao exercício dos seus direitos, pode contactar <a href="mailto:ccco@cm-oliveiradohospital.pt">ccco@cm-oliveiradohospital.pt</a>. Este contacto deverá ser confirmado pela entidade responsável.</p></section>

      <section><h2>2. Dados recolhidos e finalidades</h2>
      <ul><li><strong>Formulário de contacto:</strong> nome, endereço de email, assunto e mensagem, para responder aos pedidos recebidos.</li>
      <li><strong>Newsletter:</strong> endereço de email e registo da data de consentimento, para enviar programação e novidades a quem subscreve.</li>
      <li><strong>Preferências de cookies:</strong> a escolha sobre estatísticas e publicidade é guardada no navegador para respeitar as preferências indicadas.</li>
      <li><strong>Dados técnicos:</strong> os serviços de alojamento podem tratar informações técnicas necessárias ao funcionamento e à segurança do site, sujeitas às respetivas configurações e políticas.</li></ul></section>

      <section><h2>3. Fundamentos de licitude</h2>
      <p>A newsletter e os cookies não essenciais dependem do seu consentimento, que pode retirar. O tratamento dos pedidos de contacto deve assentar no fundamento legal aplicável à atividade da entidade responsável, a confirmar antes da aprovação definitiva desta política. Os dados não devem ser usados para finalidades incompatíveis com as indicadas.</p></section>

      <section><h2>4. Newsletter e cancelamento</h2>
      <p>A inscrição é voluntária e exige uma confirmação expressa no formulário. Pode cancelar a subscrição através do mecanismo disponibilizado nas mensagens recebidas ou solicitar o cancelamento pelo contacto indicado acima.</p></section>

      <section><h2>5. Cookies e tecnologias semelhantes</h2>
      <p>O site utiliza armazenamento local para guardar as suas preferências. Se estiverem configurados, o Google Analytics (estatísticas de utilização) e o Meta Pixel (medição de campanhas) só são carregados após autorização para a respetiva finalidade.</p>
      <p>Pode aceitar, recusar ou personalizar estas finalidades no aviso apresentado na página inicial e alterar posteriormente a sua escolha através de <strong>«Preferências de cookies»</strong> no rodapé do site. A retirada de consentimento impede novos carregamentos opcionais, mas a eliminação de cookies já instalados pode exigir a utilização das definições do navegador.</p>
      <p>Uma lista definitiva de cookies, durações e destinatários deve ser completada após auditoria às ferramentas efetivamente ativadas.</p></section>

      <section><h2>6. Conservação, segurança e destinatários</h2>
      <p>Os dados dos formulários e da newsletter são tratados através de serviços técnicos utilizados pelo site, incluindo alojamento e base de dados. O acesso deve ser limitado a pessoas autorizadas e os dados conservados apenas pelo período necessário à finalidade ou exigido por lei.</p>
      <p>Os prazos concretos de conservação, os contratos com prestadores e a existência de transferências para países fora do Espaço Económico Europeu devem ser confirmados e documentados pela entidade responsável.</p></section>

      <section><h2>7. Os seus direitos</h2>
      <p>Nos termos do RGPD, e dentro dos limites legais aplicáveis, pode solicitar acesso, retificação, apagamento, limitação do tratamento, oposição e portabilidade dos dados, bem como retirar consentimentos prestados. Pode também apresentar reclamação à <a href="https://www.cnpd.pt/" target="_blank" rel="noopener noreferrer">Comissão Nacional de Proteção de Dados (CNPD)</a>.</p>
      <p>Para exercer os seus direitos, utilize o endereço de contacto indicado na secção 1.</p></section>

      <section><h2>8. Atualizações</h2><p>Esta informação poderá ser atualizada sempre que existam alterações aos tratamentos de dados ou à legislação aplicável.</p></section>
      <p className="privacy-reference">Referência legal: <a href="https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=pt" target="_blank" rel="noopener noreferrer">Regulamento (UE) 2016/679 — RGPD</a>.</p>
    </article>
    <footer className="privacy-footer"><Link href="/">← Página inicial</Link><span>© {new Date().getFullYear()} Casa da Cultura César Oliveira</span></footer>
  </main>;
}
