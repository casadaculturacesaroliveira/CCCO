# Auditoria SEO inicial — CCCO

Data: 2026-11-20. Âmbito: repositório `CCCO`, sem alterações em produção.

## Observações confirmadas
- Next.js 15 (App Router), React 19 e cliente Supabase.
- `app/layout.tsx` já continha metadados genéricos, mas não URL canónico nem Open Graph completo.
- Não existiam `app/robots.ts`, `app/sitemap.ts`, `public/robots.txt` ou `public/sitemap.xml` no branch principal na altura da auditoria.
- `app/page.tsx` é um componente cliente e obtém os eventos publicados do Supabase através de `useEffect`. Portanto, a programação não é garantidamente incluída no HTML inicial entregue a motores de pesquisa.

## Alterações nesta proposta
- Metadados da página inicial com URL base, canonical e Open Graph.
- Dados estruturados Organization com identificação e localização da instituição.
- Rotas nativas do Next.js para robots.txt e sitemap.xml (apenas a página inicial até se verificarem as restantes rotas).

## Próximas etapas, fora deste PR
1. Confirmar se `https://ccco.pt` é a versão canónica e configurar redirecionamento 301 da variante www na Vercel, se aplicável.
2. Auditar as rotas reais e a estrutura da tabela `events` antes de criar páginas individuais de eventos renderizadas no servidor, com slug/ID estável, metadados e schema.org/Event.
3. Adicionar ao sitemap apenas páginas públicas e indexáveis efetivamente existentes.
4. Verificar Google Search Console, Bing Webmaster Tools, indexação e Core Web Vitals.
5. Validar robots, canonical, JSON-LD, acessibilidade e build numa preview Vercel antes de aprovar o merge.

## Cuidados
- Este PR não garante posições no Google.
- Não expõe chaves do Supabase nem altera políticas RLS.
- O `robots.txt` não substitui autenticação para áreas privadas.
- A listagem de eventos renderizada no cliente continua a ser uma limitação SEO a resolver numa etapa posterior.
