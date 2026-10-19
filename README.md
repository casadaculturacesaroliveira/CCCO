# Casa da Cultura César Oliveira — website

Website responsivo em Next.js, com formulário de contacto, newsletter via Supabase e preferências de cookies.

## 1. Supabase
1. Crie um projeto em https://supabase.com.
2. Abra SQL Editor e execute `supabase/schema.sql`.
3. Em Project Settings → API, copie Project URL e `service_role` secret key.
4. Configure `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente local e no Vercel. A chave `service_role` é secreta e nunca deve ter prefixo `NEXT_PUBLIC_`.

## 2. GitHub
Crie um repositório, carregue todos os ficheiros desta pasta e faça push para a branch `main`.

## 3. Vercel
1. Importe o repositório em https://vercel.com/new.
2. Adicione as duas variáveis de ambiente indicadas acima em Project Settings → Environment Variables.
3. Faça Deploy. A cada push na branch ligada, o Vercel publica uma nova versão.

## Antes de publicar
- Confirme programação, datas, preços e links oficiais de bilheteira; os eventos da homepage são placeholders.
- Adicione email, morada, telefone e redes sociais oficiais.
- Revise o texto de privacidade/cookies com a pessoa responsável pela conformidade. O consentimento guardado é funcional, mas não ativa qualquer ferramenta de analytics.
- Considere proteção anti-spam/rate limiting nos endpoints dos formulários.
- A newsletter grava emails; prepare a política de privacidade e o processo de cancelamento antes de recolher subscrições em produção.

## Desenvolvimento
```bash
npm install
cp .env.example .env.local
npm run dev
```
