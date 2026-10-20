# Painel CCCO — ativação
1. Fazer merge deste PR após verificar a pré-visualização da Vercel.
2. No Supabase associado ao site, executar `supabase/admin-migration.sql` no SQL Editor. Não voltar a executar o schema antigo para substituir tabelas existentes.
3. Criar um utilizador em Supabase > Authentication > Users; copiar UUID e executar `insert into public.admin_users(user_id) values ('UUID_REAL');`.
4. Na Vercel > Project > Settings > Environment Variables, configurar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon) e manter `SUPABASE_SERVICE_ROLE_KEY` **apenas no servidor**.
5. Fazer redeploy para aplicar as variáveis. Abrir `/admin`; criar um evento de teste, publicá-lo e confirmar na homepage.
6. As chaves `hero` e `intro` da tabela site_content controlam títulos/textos das respetivas secções.
7. Manter proteção anti-spam nos formulários como trabalho de endurecimento antes de aumentar tráfego.
