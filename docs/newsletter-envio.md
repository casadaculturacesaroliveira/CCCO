# Envio de newsletters CCCO

## Configuração
1. Executar `supabase/newsletter-campaigns.sql` no SQL Editor do projeto Supabase. Não apaga inscrições existentes.
2. Criar conta em https://resend.com, verificar um domínio de envio e obter uma chave API.
3. Na Vercel, adicionar variáveis de ambiente de servidor (Production):
   - `RESEND_API_KEY`: chave da Resend.
   - `NEWSLETTER_FROM_EMAIL`: remetente verificado, por exemplo `Casa da Cultura <newsletter@dominio-verificado.pt>`.
   - `NEWSLETTER_SITE_URL`: URL pública completa do site, sem barra final.
   - `NEWSLETTER_UNSUBSCRIBE_SECRET`: segredo aleatório com pelo menos 32 caracteres. Manter estável: alterá-lo invalida os links anteriores.
   - `SUPABASE_SERVICE_ROLE_KEY`: já configurada. **Nunca usar NEXT_PUBLIC_ para segredos.**
4. Fazer redeploy na Vercel.

## Utilização
- Na página pública, o formulário passa a exigir uma caixa de consentimento. Reinscrições reativam a subscrição.
- As inscrições anteriores à migração não têm `consent_at`; não são incluídas em envios até que a pessoa volte a subscrever com consentimento explícito.
- Em `/admin → Newsletter`, preencher assunto e mensagem, e clicar em **Enviar newsletter**. A API inclui automaticamente até seis eventos futuros publicados.
- Cada clique envia até cinco emails. Repetir **Enviar próximo lote** até aparecerem zero por enviar. O histórico por campanha evita duplicados nos cliques seguintes. Não mudar assunto ou mensagem a meio do envio.
- Cada email inclui link de cancelamento, com confirmação numa página própria. Os cancelados ficam excluídos dos próximos envios.
- A newsletter apenas envia emails, não é um sistema de marketing automatizado ou agendamento. A interface não confirma entrega na caixa de entrada, apenas aceitação pelo fornecedor.
- A Vercel pode interromper uma execução; em caso de falha, verificar `newsletter_deliveries` e os logs antes de iniciar outra campanha.
- É importante atualizar a política de privacidade com o fornecedor Resend, finalidades, base legal e direitos dos titulares.

## Segurança
A API valida a sessão Supabase e a pertença a `admin_users` no servidor. Os dados dos subscritores não são enviados para o browser na operação de envio. O segredo dos links e a chave Resend permanecem no servidor.
