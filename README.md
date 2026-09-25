# LP do Dr. Patrick Santos

Página de agendamento (Vite, React e pré-renderização), publicada na Vercel no projeto `lp-dr-santos`.

## Domínio e redirecionamentos

- Domínio principal: `https://drpatricksantos.com.br` (`SITE_URL` em `src/config.ts`). O canonical de todas as páginas e o JSON-LD usam esse endereço, e o `scripts/verificar-build.mjs` confere o canonical.
- `vercel.json` redireciona com 301, pela condição de host exata:
  - `www.drpatricksantos.com.br/:path*` vai para `https://drpatricksantos.com.br/:path*`;
  - `lp-dr-santos.vercel.app/:path*` (o endereço antigo de produção) vai para `https://drpatricksantos.com.br/:path*`.
- A query segue no redirecionamento (o destino não define query própria), então o `gclid` e as UTMs chegam ao domínio principal.
- Os previews da Vercel (`lp-dr-santos-<hash>-oandrelopesz1.vercel.app` e os de branch) **não** redirecionam: o host deles não é igual a nenhum dos dois acima. Não troque a condição por um curinga como `*.vercel.app`, senão os previews passam a abrir a produção.
- O teste `src/test/redirecionamentos.test.ts` cobre essas regras.
